import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PatientLayout from '../layouts/PatientLayout';
import PharmacyLayout from '../layouts/PharmacyLayout';
import { ClipboardCheck, PackageCheck, Pill, ShoppingCart, X, CreditCard, Download, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { downloadInvoiceReceipt } from '../utils/exportUtils';

const groupRows = (rows, key, itemKey) => Object.values(rows.reduce((result, row) => {
  if (!result[row[key]]) result[row[key]] = { ...row, items: [] };
  if (row[itemKey]) result[row[key]].items.push(row);
  return result;
}, {}));

const MedicineOrders = () => {
  const { user } = useContext(AuthContext);
  const isPharmacy = user?.role === 'PHARMACY';
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [payingPrescription, setPayingPrescription] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showQrCode, setShowQrCode] = useState(null);
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const loadData = async () => {
    try {
      if (isPharmacy) {
        const { data } = await axios.get('/api/pharmacy/orders', config);
        setOrders(data);
      } else {
        const [prescriptionResponse, orderResponse] = await Promise.all([
          axios.get('/api/pharmacy/prescription-medicines', config),
          axios.get('/api/pharmacy/orders', config),
        ]);
        setPrescriptionItems(prescriptionResponse.data);
        setOrders(orderResponse.data);
      }
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to load medicine orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [isPharmacy]);

  const prescriptions = useMemo(() => groupRows(prescriptionItems, 'prescription_id', 'prescription_item_id'), [prescriptionItems]);
  const groupedOrders = useMemo(() => groupRows(orders, 'id', 'order_item_id'), [orders]);
  
  console.log('Orders API response:', orders);
  console.log('Grouped orders:', groupedOrders);

  const statusStyle = (status) => ({
    PLACED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-amber-100 text-amber-700', READY: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-slate-100 text-slate-700', CANCELLED: 'bg-rose-100 text-rose-700',
  }[status] || 'bg-slate-100 text-slate-700');

  const quantityFor = (item) => Math.min(Math.max(1, Number(quantities[item.prescription_item_id] || 1)), Number(item.stock_quantity));

  const placeOrder = async (prescription) => {
    const items = prescription.items
      .filter((item) => item.medicine_id && Number(item.stock_quantity) > 0)
      .map((item) => ({ prescription_item_id: item.prescription_item_id, medicine_id: item.medicine_id, quantity: quantityFor(item) }));
    if (!items.length) return setNotice('None of the medicines on this prescription are currently in stock.');

    setBusyId(prescription.prescription_id);
    try {
      const { data } = await axios.post('/api/pharmacy/orders', { prescription_id: prescription.prescription_id, items, payment_method: paymentMethod }, config);
      const newRows = data.items.map((item) => ({
        ...data, ...item, order_item_id: item.id, patient_first_name: user.first_name, patient_last_name: user.last_name, diagnosis: prescription.diagnosis,
      }));
      setOrders((current) => [...newRows, ...current]);
      setPrescriptionItems((current) => current.map((item) => {
        const ordered = items.find((orderItem) => orderItem.prescription_item_id === item.prescription_item_id);
        return ordered ? { ...item, stock_quantity: Number(item.stock_quantity) - ordered.quantity } : item;
      }));
      if (data.invoice) {
        try {
          downloadInvoiceReceipt(data.invoice, user);
        } catch (pdfErr) {
          console.error('Failed to download PDF receipt:', pdfErr);
        }
      }
      setNotice('Your medicine order has been placed. Receipt downloaded. Pharmacy staff will confirm it shortly.');
      setPayingPrescription(null);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to place this medicine order.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadReceipt = (order) => {
    downloadInvoiceReceipt({
      id: order.invoice_id || order.payment_reference || order.id,
      payment_method: order.payment_method || 'Online payment',
      created_at: order.created_at,
      items: order.items.map(item => ({
         description: `${item.medicine_name} x${item.quantity}`,
         type: 'MEDICINE',
         amount: Number(item.unit_price) * Number(item.quantity)
      })),
      net_amount: order.total_amount
    }, { first_name: order.patient_first_name || user.first_name, last_name: order.patient_last_name || user.last_name });
  };

  const updateStatus = async (order, status) => {
    setBusyId(order.id);
    try {
      const { data } = await axios.put(`/api/pharmacy/orders/${order.id}`, { status }, config);
      setOrders((current) => current.map((row) => row.id === data.id ? { ...row, ...data } : row));
      setNotice(`Order ${status.toLowerCase()} successfully.`);
    } catch (error) {
      setNotice(error.response?.data?.message || 'Unable to update this order.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return isPharmacy
      ? <PharmacyLayout title="Prescription Orders"><LoadingState /></PharmacyLayout>
      : <PatientLayout title="Order Medicines"><LoadingState /></PatientLayout>;
  }

  const content = (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl sm:px-8" style={{ backgroundImage: "linear-gradient(90deg, rgba(15,23,42,.96), rgba(15,23,42,.68)), url('/images/healthcare-team-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
          {isPharmacy ? <PackageCheck className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
          {isPharmacy ? 'Pharmacy fulfilment' : 'Prescription medicine service'}
        </p>
        <h2 className="text-2xl font-extrabold">{isPharmacy ? 'Prepare care that is ready when patients are.' : 'Order medicines your doctor has prescribed.'}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">{isPharmacy ? 'Confirm, prepare, and complete prescription orders while stock is updated automatically.' : 'Only medicines linked to your digital prescriptions can be purchased here. Stock is reserved when you place an order.'}</p>
      </section>

      {!isPharmacy && (
        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl flex items-start gap-3">
          <div className="mt-0.5"><ShoppingCart size={16} /></div>
          <p><strong>Pharmacy Workflow:</strong> Once you order, the Pharmacy receives your request (PENDING). When they start packing, it shifts to PROCESSING. Finally, it will be READY for pickup/delivery, and then COMPLETED.</p>
        </div>
      )}

      {notice && <Notice text={notice} onDismiss={() => setNotice('')} />}
      {!isPharmacy && <PrescriptionList prescriptions={prescriptions} quantities={quantities} setQuantities={setQuantities} quantityFor={quantityFor} busyId={busyId} onOrder={setPayingPrescription} />}
      <OrderList isPharmacy={isPharmacy} orders={groupedOrders} statusStyle={statusStyle} busyId={busyId} onUpdate={updateStatus} onDownloadReceipt={handleDownloadReceipt} showQrCode={showQrCode} setShowQrCode={setShowQrCode} />
      
      {payingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-sm font-bold text-emerald-700">Complete Order Payment</p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">Payment Details</h3>
               </div>
               <button onClick={() => setPayingPrescription(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="bg-emerald-50 rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Amount</p>
              <p className="text-3xl font-extrabold text-emerald-900 mt-1">
                ${payingPrescription.items
                   .filter((item) => item.medicine_id && Number(item.stock_quantity) > 0)
                   .reduce((sum, item) => sum + (Number(item.unit_price) * quantityFor(item)), 0).toFixed(2)}
              </p>
            </div>
            
            <label className="block text-sm font-bold text-slate-700 mb-1">Select Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full pl-3 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 mb-6">
              <option value="UPI">UPI</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
            
            <button 
              disabled={busyId === payingPrescription.prescription_id} 
              onClick={() => placeOrder(payingPrescription)} 
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CreditCard className="w-5 h-5" />
              {busyId === payingPrescription.prescription_id ? 'Processing...' : 'Pay and Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return isPharmacy ? <PharmacyLayout title="Prescription Orders">{content}</PharmacyLayout> : <PatientLayout title="Order Medicines">{content}</PatientLayout>;
};

const LoadingState = () => <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" /></div>;
const Notice = ({ text, onDismiss }) => <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><span>{text}</span><button aria-label="Dismiss message" onClick={onDismiss}><X className="h-4 w-4" /></button></div>;

const PrescriptionList = ({ prescriptions, quantities, setQuantities, quantityFor, busyId, onOrder }) => (
  <section>
    <div className="mb-4"><h3 className="text-xl font-extrabold text-slate-800">Eligible prescriptions</h3><p className="mt-1 text-sm text-slate-500">Choose quantities for in-stock medicines and submit each prescription as one order.</p></div>
    {prescriptions.length === 0 ? <EmptyState icon={Pill} text="No prescriptions are available for medicine ordering yet." /> : <div className="grid gap-5 lg:grid-cols-2">{prescriptions.map((prescription) => {
      const available = prescription.items.filter((item) => item.medicine_id && Number(item.stock_quantity) > 0);
      const total = available.reduce((sum, item) => sum + (Number(item.unit_price) * quantityFor(item)), 0);
      return <article key={prescription.prescription_id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Digital prescription</p><h4 className="mt-1 text-lg font-extrabold text-slate-900">{prescription.diagnosis}</h4><p className="mt-1 text-sm text-slate-500">Dr. {prescription.doctor_first_name} {prescription.doctor_last_name} · {new Date(prescription.prescribed_at).toLocaleDateString()}</p></div><ClipboardCheck className="h-6 w-6 text-emerald-600" /></div></div>
        <div className="divide-y divide-slate-100">{prescription.items.map((item) => <div key={item.prescription_item_id} className="p-5"><div className="flex gap-3"><div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-700"><Pill className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3"><p className="font-bold text-slate-800">{item.medicine_name || item.prescribed_medicine_name}</p>{item.medicine_id ? <p className="text-sm font-bold text-slate-700">${Number(item.unit_price).toFixed(2)} each</p> : <span className="text-xs font-bold text-rose-600">Not stocked</span>}</div><p className="mt-1 text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}</p>{item.medicine_id ? <div className="mt-3 flex items-center justify-between"><span className={`text-xs font-bold ${Number(item.stock_quantity) > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{Number(item.stock_quantity) > 0 ? `${item.stock_quantity} in stock` : 'Out of stock'}</span><label className="flex items-center gap-2 text-xs font-bold text-slate-600">Qty<input aria-label={`Quantity for ${item.medicine_name}`} type="number" min="1" max={item.stock_quantity} value={quantities[item.prescription_item_id] || 1} onChange={(event) => setQuantities((current) => ({ ...current, [item.prescription_item_id]: event.target.value }))} className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center outline-none ring-emerald-500 focus:ring-2" /></label></div> : <p className="mt-2 text-xs text-slate-500">Ask the pharmacy team for an equivalent or availability update.</p>}</div></div></div>)}</div>
        <div className="flex flex-col gap-3 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-slate-700">Estimated total <span className="ml-1 text-lg text-slate-900">${total.toFixed(2)}</span></p><button disabled={!available.length || busyId === prescription.prescription_id} onClick={() => onOrder(prescription)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart className="h-4 w-4" />{busyId === prescription.prescription_id ? 'Placing order…' : 'Order available medicines'}</button></div>
      </article>;
    })}</div>}
  </section>
);

const OrderList = ({ isPharmacy, orders, statusStyle, busyId, onUpdate, onDownloadReceipt, showQrCode, setShowQrCode }) => (
  <section>
    <div className="mb-4"><h3 className="text-xl font-extrabold text-slate-800">{isPharmacy ? 'Prescription orders' : 'My order history'}</h3><p className="mt-1 text-sm text-slate-500">{isPharmacy ? 'Move orders through the preparation workflow.' : 'Track the pharmacy status of every prescription order.'}</p></div>
    {orders.length === 0 ? <EmptyState icon={ShoppingCart} text="No medicine orders have been placed." /> : <div className="grid gap-5 lg:grid-cols-2">{orders.map((order) => {
      const next = { PLACED: ['CONFIRMED', 'Confirm order'], CONFIRMED: ['READY', 'Mark ready'], READY: ['COMPLETED', 'Mark completed'] }[order.status];
      return <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order #{order.id.slice(0, 8)}</p><h4 className="mt-1 font-extrabold text-slate-900">{order.prescription_id ? (order.diagnosis || 'Prescription order') : 'Pharmacy Store Order'}</h4>{isPharmacy && <p className="mt-1 text-sm text-slate-500">{order.patient_first_name} {order.patient_last_name} · {order.patient_reg_id}</p>}<p className="mt-1 text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}>{order.status}</span></div>
        <div className="my-4 space-y-2 rounded-2xl bg-slate-50 p-4">{order.items.map((item) => <div key={item.order_item_id} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-700">{item.medicine_name}</span><span className="text-slate-500">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</span></div>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-slate-900">Total ${Number(order.total_amount).toFixed(2)}</p>
          {isPharmacy && !['COMPLETED', 'CANCELLED'].includes(order.status) && <div className="flex gap-2">{next && <button disabled={busyId === order.id} onClick={() => onUpdate(order, next[0])} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{busyId === order.id ? 'Updating…' : next[1]}</button>}<button disabled={busyId === order.id} onClick={() => onUpdate(order, 'CANCELLED')} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">Cancel</button></div>}
          {!isPharmacy && (
            <div className="flex gap-2">
              {order.collection_code && (order.status === 'CONFIRMED' || order.status === 'READY') && (
                <button onClick={() => setShowQrCode(showQrCode === order.id ? null : order.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 flex items-center gap-1"><QrCode className="w-4 h-4" /> QR Code</button>
              )}
              {order.payment_status === 'PAID' && (
                <button onClick={() => onDownloadReceipt(order)} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"><Download className="w-4 h-4" /> Receipt</button>
              )}
            </div>
          )}
        </div>
        {showQrCode === order.id && order.collection_code && (
           <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center">
             <QRCode value={order.collection_code} size={120} />
             <p className="text-xs font-mono mt-3 text-slate-500 font-bold tracking-widest">{order.collection_code}</p>
             <p className="text-[10px] text-slate-400 mt-1">Show this code at the pharmacy desk to collect your medicines.</p>
           </div>
        )}
      </article>;
    })}</div>}
  </section>
);

const EmptyState = ({ icon: Icon, text }) => <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><Icon className="mx-auto mb-3 h-9 w-9 text-slate-300" />{text}</div>;

export default MedicineOrders;
