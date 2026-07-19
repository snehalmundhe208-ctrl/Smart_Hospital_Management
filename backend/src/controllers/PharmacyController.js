const db = require('../config/DatabaseConfig');
const { createNotification } = require('./NotificationController');
const { logActivity } = require('./AuditController');

const getMedicines = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM medicines ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const addMedicine = async (req, res) => {
  try {
    const { name, category, manufacturer, unit_price, stock_quantity, min_stock_level, expiry_date, barcode, description, dosage_information, image_url } = req.body;
    if (!name || Number(unit_price) < 0) {
      return res.status(400).json({ message: 'Medicine name and a valid price are required' });
    }

    const result = await db.query(`
      INSERT INTO medicines (name, category, manufacturer, unit_price, stock_quantity, min_stock_level, expiry_date, barcode, description, dosage_information, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `, [name.trim(), category || null, manufacturer || null, Number(unit_price), Number(stock_quantity) || 0, Number(min_stock_level) || 10, expiry_date || null, barcode || null, description || null, dosage_information || null, image_url || null]);

    await logActivity(req.user.id, 'MEDICINE_ADDED', `Added medicine ${name}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = Number(req.body.quantity);
    const type = req.body.type;
    if (type !== 'OUT_OF_STOCK' && (!Number.isInteger(quantity) || quantity <= 0 || !['add', 'subtract'].includes(type))) {
      return res.status(400).json({ message: 'Provide a positive whole quantity and a valid stock action' });
    }

    const currentRes = await db.query('SELECT stock_quantity FROM medicines WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ message: 'Medicine not found' });

    const currentStock = Number(currentRes.rows[0].stock_quantity);
    let stockQuantity = currentStock;
    if (type === 'OUT_OF_STOCK') {
       stockQuantity = 0;
    } else if (type === 'add') {
       stockQuantity = currentStock + quantity;
    } else {
       stockQuantity = Math.max(0, currentStock - quantity);
    }

    const result = await db.query(`
      UPDATE medicines SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *
    `, [stockQuantity, id]);

    await logActivity(req.user.id, 'MEDICINE_STOCK_UPDATED', `Updated stock for medicine ${id}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: { stock_quantity: currentStock },
      newValue: { stock_quantity: stockQuantity }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPrescriptionMedicineOptions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pr.id AS prescription_id, pr.diagnosis, pr.created_at AS prescribed_at,
             du.first_name AS doctor_first_name, du.last_name AS doctor_last_name,
             pi.id AS prescription_item_id, pi.medicine_name AS prescribed_medicine_name,
             pi.dosage, pi.frequency, pi.duration, pi.instructions,
             m.id AS medicine_id, m.name AS medicine_name, m.unit_price, m.stock_quantity, m.description, m.dosage_information, m.image_url
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN prescription_items pi ON pi.prescription_id = pr.id
      LEFT JOIN LATERAL (
        SELECT id, name, unit_price, stock_quantity, description, dosage_information, image_url
        FROM medicines
        WHERE LOWER(name) LIKE CONCAT('%', LOWER(pi.medicine_name), '%')
        ORDER BY stock_quantity DESC, name ASC
        LIMIT 1
      ) m ON TRUE
      WHERE p.user_id = $1
      ORDER BY pr.created_at DESC, pi.medicine_name ASC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const createPrescriptionOrder = async (req, res) => {
  try {
    const { prescription_id, items, delivery_address, payment_method } = req.body;
    if (!prescription_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Select at least one prescribed medicine to place an order' });
    }
    if (!['CARD', 'UPI', 'NET_BANKING'].includes(payment_method)) {
      return res.status(400).json({ message: 'Online payment is required before placing a medicine order' });
    }

    const patientResult = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (patientResult.rows.length === 0) return res.status(403).json({ message: 'Patient record not found' });
    const patientId = patientResult.rows[0].id;

    const prescriptionResult = await db.query(
      'SELECT id FROM prescriptions WHERE id = $1 AND patient_id = $2',
      [prescription_id, patientId]
    );
    if (prescriptionResult.rows.length === 0) return res.status(403).json({ message: 'This prescription is not available for ordering' });

    const validatedItems = [];
    for (const requestedItem of items) {
      const quantity = Number(requestedItem.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Order quantities must be positive whole numbers' });
      }

      const prescriptionItemResult = await db.query(
        'SELECT * FROM prescription_items WHERE id = $1 AND prescription_id = $2',
        [requestedItem.prescription_item_id, prescription_id]
      );
      const medicineResult = await db.query(
        'SELECT id, name, unit_price, stock_quantity FROM medicines WHERE id = $1',
        [requestedItem.medicine_id]
      );
      const prescriptionItem = prescriptionItemResult.rows[0];
      const medicine = medicineResult.rows[0];

      if (!prescriptionItem || !medicine) {
        return res.status(400).json({ message: 'One or more selected medicines are no longer available' });
      }
      if (!medicine.name.toLowerCase().includes(prescriptionItem.medicine_name.toLowerCase())) {
        return res.status(400).json({ message: `${medicine.name} does not match the prescribed medicine` });
      }
      if (Number(medicine.stock_quantity) < quantity) {
        return res.status(400).json({ message: `${medicine.name} does not have enough stock` });
      }

      validatedItems.push({ prescriptionItem, medicine, quantity });
    }

    const total = validatedItems.reduce((sum, item) => sum + (Number(item.medicine.unit_price) * item.quantity), 0);
    const paymentReference = `MED-${Date.now()}-${String(prescription_id).slice(0, 6).toUpperCase()}`;
    const orderResult = await db.query(`
      INSERT INTO medicine_orders (prescription_id, patient_id, total_amount, delivery_address, payment_status, payment_method, payment_reference)
      VALUES ($1, $2, $3, $4, 'PAID', $5, $6) RETURNING *
    `, [prescription_id, patientId, total.toFixed(2), delivery_address || null, payment_method, paymentReference]);
    const order = orderResult.rows[0];

    const orderItems = [];
    for (const item of validatedItems) {
      const itemResult = await db.query(`
        INSERT INTO medicine_order_items (medicine_order_id, prescription_item_id, medicine_id, medicine_name, unit_price, quantity)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [order.id, item.prescriptionItem.id, item.medicine.id, item.medicine.name, item.medicine.unit_price, item.quantity]);
      orderItems.push(itemResult.rows[0]);
      await db.query(
        'UPDATE medicines SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [Number(item.medicine.stock_quantity) - item.quantity, item.medicine.id]
      );
    }

    const invoiceRes = await db.query(`
      INSERT INTO invoices (patient_id, total_amount, net_amount, status, payment_method)
      VALUES ($1, $2, $2, 'PAID', $3) RETURNING *
    `, [patientId, total.toFixed(2), payment_method]);
    const invoice = invoiceRes.rows[0];
    for (const item of validatedItems) {
      await db.query(`INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1, $2, $3, 'MEDICINE')`, [
        invoice.id, `${item.medicine.name} x${item.quantity}`, (Number(item.medicine.unit_price) * item.quantity).toFixed(2),
      ]);
    }
    const updatedOrder = await db.query('UPDATE medicine_orders SET invoice_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [invoice.id, order.id]);

    await createNotification(req.user.id, 'Medicine order placed', `Your payment was received and your prescription order is being prepared.`, 'PHARMACY');
    
    await logActivity(req.user.id, 'MEDICINE_ORDER_PLACED', `Placed prescription medicine order ${updatedOrder.rows[0].id}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });
    
    res.status(201).json({ ...updatedOrder.rows[0], items: orderItems, invoice: { ...invoice, items: orderItems.map((item) => ({ description: `${item.medicine_name} x${item.quantity}`, amount: Number(item.unit_price) * Number(item.quantity), type: 'MEDICINE' })) } });
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Unable to place the medicine order' });
  }
};

const getMedicineOrders = async (req, res) => {
  try {
    const params = [];
    let whereClause = '';
    if (req.user.role === 'PATIENT') {
      params.push(req.user.id);
      whereClause = 'WHERE p.user_id = $1';
    }

    const result = await db.query(`
      SELECT o.*, p.patient_id AS patient_reg_id, u.first_name AS patient_first_name, u.last_name AS patient_last_name,
             oi.id AS order_item_id, oi.medicine_name, oi.unit_price, oi.quantity,
             pr.diagnosis
      FROM medicine_orders o
      JOIN patients p ON o.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN prescriptions pr ON o.prescription_id = pr.id
      LEFT JOIN medicine_order_items oi ON oi.medicine_order_id = o.id
      ${whereClause}
      ORDER BY o.created_at DESC, oi.created_at ASC
    `, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMedicineOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['PLACED', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid order status' });

    const currentResult = await db.query('SELECT * FROM medicine_orders WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const currentOrder = currentResult.rows[0];
    if (['COMPLETED', 'CANCELLED'].includes(currentOrder.status) && currentOrder.status !== status) {
      return res.status(400).json({ message: 'Completed or cancelled orders cannot be changed' });
    }

    if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
      const itemResult = await db.query('SELECT * FROM medicine_order_items WHERE medicine_order_id = $1', [id]);
      for (const item of itemResult.rows) {
        const medicineResult = await db.query('SELECT stock_quantity FROM medicines WHERE id = $1', [item.medicine_id]);
        if (medicineResult.rows[0]) {
          await db.query('UPDATE medicines SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [
            Number(medicineResult.rows[0].stock_quantity) + Number(item.quantity), item.medicine_id,
          ]);
        }
      }
    }

    const collectionCode = status === 'CONFIRMED' && !currentOrder.collection_code
      ? `RX-${Date.now()}-${String(id).slice(0, 8).toUpperCase()}`
      : currentOrder.collection_code;
    const result = await db.query(`
      UPDATE medicine_orders SET status = $1, collection_code = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *
    `, [status, collectionCode, id]);
    if (status === 'CONFIRMED' && collectionCode) {
      const patientRes = await db.query('SELECT user_id FROM patients WHERE id = $1', [currentOrder.patient_id]);
      if (patientRes.rows[0]) {
        await createNotification(patientRes.rows[0].user_id, 'Medicine order confirmed', `Your order is confirmed. Your secure collection QR code is ready in the medicine order screen.`, 'PHARMACY');
      }
    }

    await logActivity(req.user.id, 'MEDICINE_ORDER_STATUS_UPDATED', `Updated medicine order ${id} status to ${status}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent'],
      previousValue: { status: currentOrder.status },
      newValue: { status }
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Unable to update the medicine order' });
  }
};

const createStoreOrder = async (req, res) => {
  try {
    const { items, delivery_address, payment_method } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Select at least one medicine to place an order' });
    }
    if (!['CARD', 'UPI', 'NET_BANKING'].includes(payment_method)) {
      return res.status(400).json({ message: 'Online payment is required before placing a medicine order' });
    }

    const patientResult = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (patientResult.rows.length === 0) return res.status(403).json({ message: 'Patient record not found' });
    const patientId = patientResult.rows[0].id;

    const validatedItems = [];
    for (const requestedItem of items) {
      const quantity = Number(requestedItem.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Order quantities must be positive whole numbers' });
      }

      const medicineResult = await db.query(
        'SELECT id, name, unit_price, stock_quantity FROM medicines WHERE id = $1',
        [requestedItem.medicine_id]
      );
      const medicine = medicineResult.rows[0];

      if (!medicine) {
        return res.status(400).json({ message: 'One or more selected medicines are no longer available' });
      }
      if (Number(medicine.stock_quantity) < quantity) {
        return res.status(400).json({ message: `${medicine.name} does not have enough stock` });
      }

      validatedItems.push({ medicine, quantity });
    }

    const total = validatedItems.reduce((sum, item) => sum + (Number(item.medicine.unit_price) * item.quantity), 0);
    const paymentReference = `MED-${Date.now()}`;
    const orderResult = await db.query(`
      INSERT INTO medicine_orders (patient_id, total_amount, delivery_address, payment_status, payment_method, payment_reference)
      VALUES ($1, $2, $3, 'PAID', $4, $5) RETURNING *
    `, [patientId, total.toFixed(2), delivery_address || null, payment_method, paymentReference]);
    const order = orderResult.rows[0];

    const orderItems = [];
    for (const item of validatedItems) {
      const itemResult = await db.query(`
        INSERT INTO medicine_order_items (medicine_order_id, medicine_id, medicine_name, unit_price, quantity)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [order.id, item.medicine.id, item.medicine.name, item.medicine.unit_price, item.quantity]);
      orderItems.push(itemResult.rows[0]);
      await db.query(
        'UPDATE medicines SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [Number(item.medicine.stock_quantity) - item.quantity, item.medicine.id]
      );
    }

    const invoiceRes = await db.query(`
      INSERT INTO invoices (patient_id, total_amount, net_amount, status, payment_method)
      VALUES ($1, $2, $2, 'PAID', $3) RETURNING *
    `, [patientId, total.toFixed(2), payment_method]);
    const invoice = invoiceRes.rows[0];
    for (const item of validatedItems) {
      await db.query(`INSERT INTO invoice_items (invoice_id, description, amount, type) VALUES ($1, $2, $3, 'MEDICINE')`, [
        invoice.id, `${item.medicine.name} x${item.quantity}`, (Number(item.medicine.unit_price) * item.quantity).toFixed(2),
      ]);
    }
    const updatedOrder = await db.query('UPDATE medicine_orders SET invoice_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [invoice.id, order.id]);

    await createNotification(req.user.id, 'Medicine order placed', `Your payment was received and your pharmacy order is being prepared.`, 'PHARMACY');
    
    await logActivity(req.user.id, 'MEDICINE_ORDER_PLACED', `Placed store medicine order ${updatedOrder.rows[0].id}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.status(201).json({ ...updatedOrder.rows[0], items: orderItems, invoice: { ...invoice, items: orderItems.map((item) => ({ description: `${item.medicine_name} x${item.quantity}`, amount: Number(item.unit_price) * Number(item.quantity), type: 'MEDICINE' })) } });
  } catch (error) {
    console.error(error); console.error(error.stack);
    res.status(500).json({ message: 'Unable to place the medicine order' });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, manufacturer, unit_price, stock_quantity, min_stock_level, expiry_date, barcode, description, dosage_information, image_url } = req.body;
    
    if (!name || Number(unit_price) < 0) {
      return res.status(400).json({ message: 'Medicine name and a valid price are required' });
    }

    const checkRes = await db.query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const result = await db.query(`
      UPDATE medicines
      SET name = $1, category = $2, manufacturer = $3, unit_price = $4, stock_quantity = $5, min_stock_level = $6, expiry_date = $7, barcode = $8, description = $9, dosage_information = $10, image_url = $11
      WHERE id = $12 RETURNING *
    `, [name.trim(), category || null, manufacturer || null, Number(unit_price), Number(stock_quantity) || 0, Number(min_stock_level) || 10, expiry_date || null, barcode || null, description || null, dosage_information || null, image_url || null, id]);

    await logActivity(req.user.id, 'MEDICINE_UPDATED', `Updated medicine ${name}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkRes = await db.query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await db.query('DELETE FROM medicines WHERE id = $1', [id]);

    await logActivity(req.user.id, 'MEDICINE_DELETED', `Deleted medicine ${checkRes.rows[0].name}`, {
      module: 'PHARMACY',
      ipAddress: req.ip,
      device: req.headers['user-agent']
    });

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Ensure medicine is not used in prescriptions.' });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  updateStock,
  getPrescriptionMedicineOptions,
  createPrescriptionOrder,
  getMedicineOrders,
  updateMedicineOrderStatus,
  createStoreOrder,
  updateMedicine,
  deleteMedicine,
};
