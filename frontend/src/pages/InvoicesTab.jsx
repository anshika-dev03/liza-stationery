import { useState, useEffect, useRef } from 'react';
import { getInvoices, getProducts, createInvoice, updateInvoice, deleteInvoice } from '../api';
import { useAuth } from '../AuthContext';

const CLASSIFICATIONS = ['', '#', '##', '###', '★'];

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function charBoxes(val, count, boxW = 28, boxH = 34, fontSize = 20, joined = false) {
  const chars = (val || '').split('').slice(0, count);
  while (chars.length < count) chars.push('');
  const spans = chars.map((c, idx) => {
    const borderLeft = (joined && idx > 0) ? 'none' : '1.5px solid #000';
    return `<span style="display:inline-block;width:${boxW}px;height:${boxH}px;border-top:1.5px solid #000;border-bottom:1.5px solid #000;border-right:1.5px solid #000;border-left:${borderLeft};text-align:center;line-height:${boxH}px;font-size:${fontSize}px;font-weight:bold">${c}</span>`;
  }).join('');
  return `<span style="display:inline-flex;flex-wrap:nowrap;vertical-align:middle;line-height:0;">${spans}</span>`;
}

function buildInvoiceHTML(inv) {
  const items = inv.items || [];
  const subTotal = items.reduce((s, i) => s + (i.amount !== undefined ? Number(i.amount) : i.qty * i.price), 0);
  const doriAmount = Number(inv.dori_qty || 0) * 0.18;
  const total = subTotal + Number(inv.packing_charge || 0) + Number(inv.booking_charge || 0) + doriAmount;

  const TXT = '20px';
  const ROW_TXT = '20px';
  const FOOTER_TXT = '18px';
  const PUNCH_PAD = '10mm';

  const buildItemRow = (it) => {
    const gross = Number(it.qty) * Number(it.price);
    const discPct = Number(it.discount_pct || 0);
    const amount = it.amount !== undefined ? Number(it.amount) : gross - (gross * discPct / 100);
    const qtyDisplay = `${it.qty} ${it.unit || 'pcs'}`;
    return `
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td style="width:110px;padding:8px;font-size:${ROW_TXT};font-weight:bold">&nbsp;</td>
      <td style="width:55px;padding:8px;font-size:${ROW_TXT};font-weight:bold;text-align:center">${qtyDisplay}</td>
      <td style="padding:8px;font-size:${ROW_TXT};font-weight:bold;white-space:nowrap">${it.product_name}</td>
      <td style="width:75px;padding:8px;font-size:${ROW_TXT};font-weight:bold;white-space:nowrap">${Number(it.price).toFixed(2)}</td>
      <td style="width:60px;padding:8px;font-size:${ROW_TXT};font-weight:bold;white-space:nowrap">${discPct > 0 ? discPct + '%' : ''}</td>
      <td style="width:90px;padding:8px;font-size:${ROW_TXT};font-weight:bold;white-space:nowrap">${amount.toFixed(2)}</td>
    </tr>`;
  };

  const buildEmptyRow = () => `<tr>
    <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
    <td style='width:110px;padding:8px;height:34px'>&nbsp;</td>
    <td style='width:55px;padding:8px'>&nbsp;</td>
    <td style='padding:8px'>&nbsp;</td>
    <td style='width:75px;padding:8px'>&nbsp;</td>
    <td style='width:60px;padding:8px'>&nbsp;</td>
    <td style='width:90px;padding:8px'>&nbsp;</td>
  </tr>`;

  const buildHeaderBlock = () => `
    <div style="margin-top:6px">
      <div style="display:flex;align-items:stretch;border:2.5px solid #000;border-bottom:none">
        <div style="width:160px;flex-shrink:0;border-right:2px solid #000;padding:8px;font-weight:bold;font-size:${TXT};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
          <span>DATE</span><span style="font-weight:bold;font-size:${TXT}">${formatDate(inv.date)}</span>
        </div>
        <div style="width:80px;flex-shrink:0;border-right:2px solid #000;padding:8px;font-weight:bold;font-size:30px;display:flex;align-items:center;justify-content:center;text-align:center">
          ${inv.classification || '&nbsp;'}
        </div>
        <div style="flex:1;text-align:center;padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-weight:bold;font-size:${TXT};margin-bottom:10px">ORDER / ESTIMATE FORM</div>
          <div style="display:flex;align-items:center;justify-content:center">
            ${charBoxes(inv.phone, 10, 26, 34, 20, true)}
          </div>
        </div>
        <div style="flex:0 0 35%;border-left:2px solid #000;padding:8px;font-weight:bold;font-size:${TXT};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
          <span>P.M.</span><span style="font-weight:bold;font-size:${TXT}">${inv.pm_number || ''}</span>
        </div>
      </div>
      <div style="display:flex;border:2.5px solid #000;border-top:2.5px solid #000;border-bottom:none">
        <div style="flex:0 0 65%;border-right:2px solid #000;padding:6px 8px;font-weight:bold;font-size:${TXT};display:flex;align-items:center;justify-content:center;text-align:center">P.A.</div>
        <div style="flex:0 0 35%;padding:6px 8px;font-weight:bold;font-size:${TXT};display:flex;align-items:center;justify-content:center;text-align:center">B.N.</div>
      </div>
      <div style="display:flex;border:2.5px solid #000;border-top:none">
        <div style="flex:0 0 65%;border-right:2px solid #000;padding:6px 8px">
          <div class="dotted-line">${inv.customer || ''}&nbsp;</div>
          <div class="dotted-line">${inv.address || ''}&nbsp;</div>
          <div class="dotted-line">${inv.station || ''}&nbsp;</div>
        </div>
        <div style="flex:0 0 35%;padding:6px 8px">
          <div class="dotted-line">${inv.has_billing ? (inv.billing_name || '') : ''}&nbsp;</div>
          <div class="dotted-line">${inv.has_billing ? (inv.billing_address || '') : ''}&nbsp;</div>
          <div class="dotted-line">${inv.has_billing ? (inv.billing_station || '') : ''}&nbsp;</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;border:2.5px solid #000;border-top:none;padding:8px">
        <div style="flex:1;font-size:${TXT};font-weight:bold">TRP.&nbsp;${inv.transport || ''}</div>
        <div style="flex:1;text-align:right;white-space:nowrap;display:flex;align-items:center;justify-content:flex-end;gap:8px">
          <span style="font-size:${TXT};font-weight:bold">GST NO.</span>
          ${charBoxes(inv.gst_no, 15, 26, 34, 20, true)}
        </div>
      </div>
    </div>`;

  const ROWS_PAGE_1 = 19;
  const ROWS_CONT = 19;
  const chunks = [];
  if (items.length <= ROWS_PAGE_1) {
    chunks.push(items);
  } else {
    chunks.push(items.slice(0, ROWS_PAGE_1));
    let i = ROWS_PAGE_1;
    while (i < items.length) { chunks.push(items.slice(i, i + ROWS_CONT)); i += ROWS_CONT; }
  }

  const summaryHTML = `
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="2" style="padding:8px"></td>
      <td colspan="3" style="white-space:nowrap;font-size:${ROW_TXT};font-weight:bold;padding:8px">SUB TOTAL</td>
      <td style="font-size:${ROW_TXT};font-weight:bold;padding:8px">${subTotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="2" style="padding:8px"></td>
      <td colspan="3" style="white-space:nowrap;font-size:${ROW_TXT};font-weight:bold;padding:8px">PACKING CHARGE</td>
      <td style="font-size:${ROW_TXT};font-weight:bold;padding:8px">${Number(inv.packing_charge || 0).toFixed(2)}</td>
    </tr>
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="2" style="padding:8px"></td>
      <td colspan="3" style="white-space:nowrap;font-size:${ROW_TXT};font-weight:bold;padding:8px">BOOKING CHARGE</td>
      <td style="font-size:${ROW_TXT};font-weight:bold;padding:8px">${Number(inv.booking_charge || 0).toFixed(2)}</td>
    </tr>
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="2" style="padding:8px"></td>
      <td colspan="3" style="white-space:nowrap;font-size:${ROW_TXT};font-weight:bold;padding:8px">DORI NO. 0 (${Number(inv.dori_qty || 0)} × 0.18)</td>
      <td style="font-size:${ROW_TXT};font-weight:bold;padding:8px">${doriAmount.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="2" style="padding:8px"></td>
      <td colspan="3" style="font-weight:bold;font-size:${ROW_TXT};padding:8px">TOTAL</td>
      <td style="font-weight:bold;font-size:${ROW_TXT};padding:8px">${total.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="spacer-col" style="width:${PUNCH_PAD};padding:0"></td>
      <td colspan="6" style="padding:0">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 8px">
          <span style="font-weight:bold;font-size:${FOOTER_TXT};display:flex;align-items:center;gap:6px">PACKED BY <span style="display:inline-block;width:130px;border-bottom:1.3px dotted #000;height:22px">&nbsp;</span></span>
          <span style="font-weight:bold;font-size:${FOOTER_TXT}">GST AS APPLICABLE</span>
          <span style="font-weight:bold;font-size:${FOOTER_TXT};display:flex;align-items:center;gap:6px">CHECKED BY <span style="display:inline-block;width:130px;border-bottom:1.3px dotted #000;height:22px">&nbsp;</span></span>
        </div>
      </td>
    </tr>`;

  const pagesHTML = chunks.map((chunk, pageIdx) => {
    const isLast = pageIdx === chunks.length - 1;
    const minRows = isLast ? 5 : ROWS_CONT;
    const rowsHtml = chunk.map(buildItemRow).join('');
    const emptyRows = Array(Math.max(0, minRows - chunk.length)).fill(0).map(buildEmptyRow).join('');
    return `
      <div class="page-block" style="${pageIdx > 0 ? 'page-break-before:always;' : ''}">
        ${buildHeaderBlock()}
        <table style="width:100%;border-collapse:collapse;table-layout:fixed">
          <colgroup>
            <col style="width:${PUNCH_PAD}">
            <col style="width:100px">
            <col style="width:80px">
            <col>
            <col style="width:95px">
            <col style="width:60px">
            <col style="width:120px">
          </colgroup>
          <thead>
            <tr>
              <th class="spacer-col" style="padding:0;border:none!important"></th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">✓</th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">QTY.</th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">DESCRIPTION</th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">RATE</th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">DISC.</th>
              <th style="font-size:${ROW_TXT};font-weight:bold;padding:8px;border:1.5px solid #000">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}${emptyRows}
            ${isLast ? summaryHTML : ''}
          </tbody>
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; }
    body{margin:0;background:#fff;font-family:Arial,sans-serif;color:#000;font-weight:bold}
    table{border-collapse:collapse;width:100%}
    th,td{border:1.5px solid #000!important;font-weight:bold}
    .spacer-col{border:none!important;background:#fff}
    .invoice{background:#fff;padding:10px}
    .dotted-line{border-bottom:1.3px dotted #000;min-height:30px;margin-bottom:4px;padding-bottom:2px;font-size:20px;font-weight:bold}
    tr{page-break-inside:avoid}
    .page-block{page-break-inside:avoid}
    @media print{html,body{margin:0;width:100%}.invoice{padding:0}.no-print{display:none!important}}
  </style></head><body>
  <div class="invoice">${pagesHTML}</div>
  <div class="no-print" style="text-align:center;margin:20px">
    <button onclick="window.print()" style="padding:10px 28px;background:#2563EB;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif">🖨️ Print Invoice</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f1f5f9;border:1px solid #ddd;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif;margin-left:10px">✕ Close</button>
  </div>
  </body></html>`;
}

// ── Searchable product picker used inside invoice form ──────
function ProductSearch({ products, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query.length < 1 ? [] : (() => {
    const q = query.toLowerCase();
    const all = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    return all.sort((a, b) => {
      const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
      const aStarts = an.startsWith(q), bStarts = bn.startsWith(q);
      const aWord = an.split(' ').some(w => w.startsWith(q));
      const bWord = bn.split(' ').some(w => w.startsWith(q));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      if (aWord && !bWord) return -1;
      if (!aWord && bWord) return 1;
      return an.localeCompare(bn);
    });
  })().slice(0, 8);

  return (
    <div style={{ position:'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search & add product…"
        autoComplete="off"
        style={{ fontSize:13 }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:8, zIndex:200, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', maxHeight:220, overflowY:'auto' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={() => { onSelect(p); setQuery(''); setOpen(false); }}
              style={{ padding:'8px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span>{p.emoji}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{p.category} · ₹{p.price} / {p.unit || 'pcs'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  pm_number:'', customer:'', address:'', station:'',
  has_billing:false, billing_name:'', billing_address:'', billing_station:'',
  transport:'', gst_no:'', phone:'',
  date: new Date().toISOString().split('T')[0],
  classification:'', remark:'', packing_charge:0, booking_charge:0, dori_qty:0
};

export default function InvoicesTab({ cart, updateCartQty, clearCart }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([getInvoices(), getProducts()]);
      setInvoices(invRes.data);
      setProducts(prodRes.data);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const openFromCart = () => {
    setItems(cart.map(c => ({
      product_name: c.product.name,
      qty: c.qty,
      price: Number(c.product.price),
      discount_pct: 0,
      unit: c.product.unit || 'pcs'
    })));
    setForm({ ...EMPTY_FORM, dori_qty: 0 });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (inv) => {
    setForm({
      pm_number: inv.pm_number || '', customer: inv.customer || '',
      address: inv.address || '', station: inv.station || '',
      has_billing: inv.has_billing || false, billing_name: inv.billing_name || '',
      billing_address: inv.billing_address || '', billing_station: inv.billing_station || '',
      transport: inv.transport || '', gst_no: inv.gst_no || '', phone: inv.phone || '',
      date: inv.date, classification: inv.classification || '', remark: inv.remark || '',
      packing_charge: inv.packing_charge || 0, booking_charge: inv.booking_charge || 0,
      dori_qty: inv.dori_qty || 0
    });
    setItems(inv.items.map(i => ({
      product_name: i.product_name, qty: i.qty,
      price: Number(i.price), discount_pct: Number(i.discount_pct) || 0,
      unit: i.unit || 'pcs'
    })));
    setEditId(inv.id);
    setShowForm(true);
  };

  // Add product from search picker
  const addProductToItems = (p) => {
    const existing = items.findIndex(i => i.product_name === p.name);
    if (existing >= 0) {
      setItems(prev => prev.map((it, idx) => idx === existing ? { ...it, qty: it.qty + 1 } : it));
    } else {
      setItems(prev => [...prev, { product_name: p.name, qty: 1, price: Number(p.price), discount_pct: 0, unit: p.unit || 'pcs' }]);
    }
  };

  const updateItemField = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const rowAmount = (it) => {
    const gross = Number(it.qty) * Number(it.price);
    return gross - (gross * (Number(it.discount_pct) || 0) / 100);
  };
  const subTotal = items.reduce((s, it) => s + rowAmount(it), 0);
  const doriAmount = Number(form.dori_qty || 0) * 0.18;
  const grandTotal = subTotal + Number(form.packing_charge || 0) + Number(form.booking_charge || 0) + doriAmount;

  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length === 0) { setError('Add at least one item.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        packing_charge: Number(form.packing_charge) || 0,
        booking_charge: Number(form.booking_charge) || 0,
        dori_qty: Number(form.dori_qty) || 0,
        items: items.map(i => ({
          product_name: i.product_name,
          qty: Number(i.qty),
          price: Number(i.price),
          discount_pct: Number(i.discount_pct) || 0
        }))
      };
      if (editId) {
        const res = await updateInvoice(editId, payload);
        setInvoices(prev => prev.map(inv => inv.id === editId ? res.data : inv));
      } else {
        const res = await createInvoice(payload);
        setInvoices(prev => [res.data, ...prev]);
        clearCart();
      }
      setShowForm(false);
      setEditId(null);
    } catch (err) {
      setError('Failed to save invoice. ' + (err.response?.data ? JSON.stringify(err.response.data) : ''));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!user?.is_staff) return;
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch { setError('Failed to delete.'); }
  };

  const handlePrint = (inv) => {
    const html = buildInvoiceHTML(inv);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const filtered = invoices.filter(inv =>
    (inv.customer || '').toLowerCase().includes(search.toLowerCase()) ||
    String(inv.id).includes(search)
  );

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>;

  return (
    <div>
      {error && <div style={{ color:'var(--red)', marginBottom:12, padding:'8px 12px', background:'rgba(220,38,38,0.06)', borderRadius:8 }}>{error}</div>}

      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or invoice #…" style={{ maxWidth:300 }} />
        <div style={{ marginLeft:'auto' }}>
          <button className="btn-primary btn-sm" onClick={openFromCart} disabled={cart.length === 0}>
            🧾 Create Invoice {cart.length > 0 && `(${cart.reduce((s,c) => s+c.qty, 0)} items)`}
          </button>
        </div>
      </div>

      {cart.length === 0 && (
        <div style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'10px 14px', color:'var(--yellow)', fontSize:13, marginBottom:16 }}>
          Cart is empty — go to Products and add items first, or Edit an existing invoice.
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table>
          <thead>
            <tr><th>#</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>By</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td><strong>#{inv.id}</strong></td>
                <td>{inv.customer || <span style={{ color:'var(--text3)' }}>—</span>}</td>
                <td>{formatDate(inv.date)}</td>
                <td>{inv.items?.length || 0} items</td>
                <td><strong>₹{Number(inv.total).toLocaleString('en-IN')}</strong></td>
                <td><span style={{ color:'var(--text3)' }}>{inv.created_by || '—'}</span></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(inv)}>✏️ Edit</button>
                    <button className="btn-ghost btn-sm" onClick={() => handlePrint(inv)}>🖨️ Print</button>
                    {user?.is_staff && <button className="btn-danger btn-sm" onClick={() => handleDelete(inv.id)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:40 }}>No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:820, maxHeight:'92vh', overflowY:'auto' }}>
            <h3 style={{ marginBottom:20 }}>{editId ? 'Edit Invoice' : 'Create Invoice'}</h3>
            <form onSubmit={handleSave}>

              {/* ── Customer details ── */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:10 }}>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>P.M. Number (optional)</label>
                    <input value={form.pm_number} onChange={e => setForm(f => ({ ...f, pm_number:e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Customer Name</label>
                    <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer:e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Classification</label>
                    <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification:e.target.value }))}>
                      {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c || '— none —'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Address</label>
                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address:e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Station</label>
                    <input value={form.station} onChange={e => setForm(f => ({ ...f, station:e.target.value }))} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:10 }}>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Transport (Trp.)</label>
                    <input value={form.transport} onChange={e => setForm(f => ({ ...f, transport:e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>GST No. (15 digits)</label>
                    <input value={form.gst_no} onChange={e => setForm(f => ({ ...f, gst_no:e.target.value }))} maxLength={15} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Phone (10 digits)</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone:e.target.value }))} maxLength={10} />
                  </div>
                </div>

                <div style={{ marginBottom:10 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.has_billing} onChange={e => setForm(f => ({ ...f, has_billing:e.target.checked }))} style={{ width:'auto' }} />
                    Add Billing Details (B.N.) — optional
                  </label>
                </div>

                {form.has_billing && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:10, background:'var(--bg)', padding:14, borderRadius:8 }}>
                    <div>
                      <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Billing Name</label>
                      <input value={form.billing_name} onChange={e => setForm(f => ({ ...f, billing_name:e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Billing Address</label>
                      <input value={form.billing_address} onChange={e => setForm(f => ({ ...f, billing_address:e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Billing Station</label>
                      <input value={form.billing_station} onChange={e => setForm(f => ({ ...f, billing_station:e.target.value }))} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Remark</label>
                  <input value={form.remark} onChange={e => setForm(f => ({ ...f, remark:e.target.value }))} />
                </div>
              </div>

              {/* ── Items ── */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontWeight:600, fontSize:13 }}>Items</label>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Search picker — always visible in form */}
                <div style={{ marginBottom:10 }}>
                  <ProductSearch products={products} onSelect={addProductToItems} />
                </div>

                <div className="card" style={{ padding:0, overflow:'hidden' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ width:60 }}>Unit</th>
                        <th style={{ width:70 }}>Qty</th>
                        <th style={{ width:90 }}>Rate (₹)</th>
                        <th style={{ width:70 }}>Disc %</th>
                        <th style={{ width:90 }}>Amount</th>
                        <th style={{ width:30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td style={{ fontSize:13 }}>{it.product_name}</td>
                          <td>
                            <input value={it.unit || 'pcs'} onChange={e => updateItemField(i, 'unit', e.target.value)} style={{ width:55, fontSize:12 }} />
                          </td>
                          <td>
                            <input type="number" value={it.qty} onChange={e => updateItemField(i, 'qty', e.target.value)} style={{ width:60 }} min="0" step="0.5" />
                          </td>
                          <td>
                            <input type="number" value={it.price} onChange={e => updateItemField(i, 'price', e.target.value)} style={{ width:80 }} min="0" step="0.01" />
                          </td>
                          <td>
                            <input type="number" value={it.discount_pct} onChange={e => updateItemField(i, 'discount_pct', e.target.value)} style={{ width:60 }} min="0" max="100" step="0.01" />
                          </td>
                          <td style={{ fontWeight:600 }}>₹{rowAmount(it).toFixed(2)}</td>
                          <td>
                            <button type="button" onClick={() => removeItem(i)} style={{ background:'transparent', color:'var(--red)', fontSize:16, padding:0 }}>×</button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>Search and add products above</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Charges ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Packing Charge (₹)</label>
                  <input type="number" value={form.packing_charge} onChange={e => setForm(f => ({ ...f, packing_charge:e.target.value }))} min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Booking Charge (₹)</label>
                  <input type="number" value={form.booking_charge} onChange={e => setForm(f => ({ ...f, booking_charge:e.target.value }))} min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Dori No. 0 (qty)</label>
                  <input type="number" value={form.dori_qty} onChange={e => setForm(f => ({ ...f, dori_qty:e.target.value }))} min="0" step="0.01" />
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>= ₹{doriAmount.toFixed(2)} (× 0.18)</div>
                </div>
              </div>

              <div style={{ textAlign:'right', fontWeight:700, fontSize:17, marginBottom:20, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                Total: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits:2 })}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update Invoice' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}