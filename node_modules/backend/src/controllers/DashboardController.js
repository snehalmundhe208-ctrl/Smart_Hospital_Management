const db = require('../config/DatabaseConfig');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'ADMIN') {
      const patientCount = await db.query('SELECT COUNT(*) FROM patients');
      const doctorCount = await db.query('SELECT COUNT(*) FROM doctors');
      const staffCount = await db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('PATIENT', 'DOCTOR', 'ADMIN')");
      const appointmentCount = await db.query('SELECT COUNT(*) FROM appointments');
      const revenue = await db.query("SELECT SUM(net_amount) as total FROM invoices WHERE status = 'PAID'");
      const cancelledAptCount = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'CANCELLED'");
      const refundsStats = await db.query("SELECT COUNT(*) as refund_count, SUM(refund_amount) as total_refund FROM refunds");
      
      const revTrends = await db.query(`
        SELECT DATE(created_at) as date, SUM(net_amount) as total
        FROM invoices WHERE status = 'PAID' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date ASC
      `);
      const aptTrends = await db.query(`
        SELECT DATE(appointment_date) as date, COUNT(*) as count
        FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(appointment_date) ORDER BY date ASC
      `);
      
      const deptStats = await db.query(`
        SELECT dept.name, COUNT(DISTINCT a.patient_id) as patients
        FROM departments dept
        LEFT JOIN doctors d ON d.department_id = dept.id
        LEFT JOIN appointments a ON a.doctor_id = d.id
        GROUP BY dept.name ORDER BY patients DESC
      `);
      
      const aptStatus = await db.query(`
        SELECT status as name, CAST(COUNT(*) AS INTEGER) as value
        FROM appointments
        GROUP BY status
      `);
      
      const monthlyApt = await db.query(`
        SELECT TO_CHAR(appointment_date, 'Mon') as month, COUNT(*) as count
        FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(appointment_date, 'Mon'), EXTRACT(MONTH FROM appointment_date)
        ORDER BY EXTRACT(MONTH FROM appointment_date)
      `);

      stats = {
        patients: parseInt(patientCount.rows[0].count),
        doctors: parseInt(doctorCount.rows[0].count),
        staff: parseInt(staffCount.rows[0].count),
        appointments: parseInt(appointmentCount.rows[0].count),
        revenue: parseFloat(revenue.rows[0].total || 0),
        cancelledAppointments: parseInt(cancelledAptCount.rows[0].count),
        refundedAppointments: parseInt(refundsStats.rows[0].refund_count),
        totalRefundAmount: parseFloat(refundsStats.rows[0].total_refund || 0),
        revenueTrends: revTrends.rows.map(r => ({ date: new Date(r.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), total: parseFloat(r.total) })),
        appointmentTrends: aptTrends.rows.map(r => ({ date: new Date(r.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), count: parseInt(r.count) })),
        departmentStats: deptStats.rows.map(r => ({ name: r.name, patients: parseInt(r.patients) })),
        appointmentStatus: aptStatus.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
        monthlyAppointments: monthlyApt.rows.map(r => ({ month: r.month, count: parseInt(r.count) }))
      };
    } else if (req.user.role === 'DOCTOR') {
      const dRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (dRes.rows.length > 0) {
        const doctorId = dRes.rows[0].id;
        const patientCount = await db.query('SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = $1', [doctorId]);
        const appointmentCount = await db.query('SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE', [doctorId]);
        
        const completedPts = await db.query("SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = $1 AND status = 'COMPLETED'", [doctorId]);
        const pendingPts = await db.query("SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = $1 AND status = 'PENDING'", [doctorId]);
        const followUps = await db.query("SELECT COUNT(*) FROM prescriptions WHERE doctor_id = $1 AND follow_up_date IS NOT NULL AND follow_up_date >= CURRENT_DATE", [doctorId]);
        
        const weeklyTrend = await db.query(`
          SELECT DATE(appointment_date) as date, COUNT(DISTINCT patient_id) as count
          FROM appointments WHERE doctor_id = $1 AND appointment_date >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(appointment_date) ORDER BY date ASC
        `, [doctorId]);

        const demo = await db.query(`
           SELECT p.gender, COUNT(DISTINCT p.id) as count
           FROM appointments a JOIN patients p ON a.patient_id = p.id
           WHERE a.doctor_id = $1 GROUP BY p.gender
        `, [doctorId]);

        const reviewStats = await db.query(`
          SELECT COUNT(id) as total_reviews, COALESCE(AVG(rating), 0) as average_rating 
          FROM feedback WHERE doctor_id = $1
        `, [doctorId]);

        stats = {
          uniquePatients: parseInt(patientCount.rows[0].count),
          todaysAppointments: parseInt(appointmentCount.rows[0].count),
          completedPatients: parseInt(completedPts.rows[0].count),
          pendingPatients: parseInt(pendingPts.rows[0].count),
          followUps: parseInt(followUps.rows[0].count),
          weeklyTrend: weeklyTrend.rows.map(r => ({ date: new Date(r.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), count: parseInt(r.count) })),
          demographics: demo.rows.map(r => ({ gender: r.gender, count: parseInt(r.count) })),
          reviews: {
            total: parseInt(reviewStats.rows[0].total_reviews),
            average: parseFloat(reviewStats.rows[0].average_rating).toFixed(1)
          }
        };
      }
    } else if (req.user.role === 'PATIENT') {
        const pRes = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
        if (pRes.rows.length > 0) {
            const patientId = pRes.rows[0].id;
            const appointmentCount = await db.query('SELECT COUNT(*) FROM appointments WHERE patient_id = $1', [patientId]);
            const prescriptionsCount = await db.query('SELECT COUNT(*) FROM prescriptions WHERE patient_id = $1', [patientId]);
            
            const appointmentStatus = await db.query(`
                SELECT status as name, COUNT(*) as value
                FROM appointments WHERE patient_id = $1
                GROUP BY status
            `, [patientId]);

            const appointmentHistory = await db.query(`
                SELECT DATE(appointment_date) as date, COUNT(*) as count
                FROM appointments WHERE patient_id = $1 AND appointment_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(appointment_date) ORDER BY date ASC
            `, [patientId]);

            stats = {
                totalAppointments: parseInt(appointmentCount.rows[0].count),
                totalPrescriptions: parseInt(prescriptionsCount.rows[0].count),
                appointmentStatus: appointmentStatus.rows.map(r => ({ name: r.name, value: parseInt(r.value) })),
                appointmentHistory: appointmentHistory.rows.map(r => ({ date: r.date, count: parseInt(r.count) }))
            }
        }
    } else if (req.user.role === 'PHARMACY') {
        const topSellers = await db.query(`
           SELECT medicine_name as name, SUM(quantity) as count
           FROM medicine_order_items
           GROUP BY medicine_name ORDER BY count DESC LIMIT 5
        `);
        const alerts = await db.query(`SELECT COUNT(*) FROM medicines WHERE stock_quantity <= min_stock_level`);
        const totalStock = await db.query(`SELECT COUNT(*) as total FROM medicines`);
        const ordersToday = await db.query("SELECT COUNT(*) FROM medicine_orders WHERE DATE(created_at) = CURRENT_DATE");
        const rev = await db.query("SELECT SUM(total_amount) as total FROM medicine_orders WHERE payment_status = 'PAID'");
        
        const orderTrends = await db.query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM medicine_orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(created_at) ORDER BY date ASC
        `);
        
        stats = {
            topSellers: topSellers.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
            alerts: parseInt(alerts.rows[0].count),
            totalMedicines: parseInt(totalStock.rows[0].total || 0),
            ordersToday: parseInt(ordersToday.rows[0].count),
            revenue: parseFloat(rev.rows[0].total || 0),
            orderTrends: orderTrends.rows.map(r => ({ date: r.date, count: parseInt(r.count) }))
        };
    } else if (req.user.role === 'LAB') {
        const vol = await db.query(`
           SELECT test_name as name, COUNT(*) as count
           FROM lab_requests
           GROUP BY test_name ORDER BY count DESC LIMIT 5
        `);
        const totalTests = await db.query('SELECT COUNT(*) FROM lab_requests');
        const pending = await db.query(`SELECT COUNT(*) FROM lab_requests WHERE status='PENDING'`);
        const completed = await db.query(`SELECT COUNT(*) FROM lab_requests WHERE status='COMPLETED'`);
        const dailyVol = await db.query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM lab_requests WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(created_at) ORDER BY date ASC
        `);
        
        stats = {
            volumes: vol.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
            totalTests: parseInt(totalTests.rows[0].count),
            pendingReports: parseInt(pending.rows[0].count),
            completedReports: parseInt(completed.rows[0].count),
            dailyVolume: dailyVol.rows.map(r => ({ date: new Date(r.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), count: parseInt(r.count) }))
        };
    }

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats
};
