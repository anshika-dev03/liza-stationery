import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api';
import { useAuth } from '../AuthContext';

const UNITS = ['pcs', 'bag','box','ctn', 'doz', 'dabbi', 'kg', 'grs', 'roll', 'patta', 'pkt'];
const EMPTY = { name:'', price:'', category:'', stock:'1', emoji:'📦', badge:'', featured:false, desc:'',unit:'pcs' };
const CATEGORIES = ['Pen Stands', 'Paper Weights', 'Office Supplies', 'Electronics', 'Other'];

export default function ProductsTab({ cart, addToCart, updateCartQty, goToInvoice }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch { setError('Failed to load products.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setImageFile(null); setImagePreview(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ name:p.name, price:p.price, category:p.category, stock:p.stock, emoji:p.emoji, badge:p.badge||'', featured:p.featured, desc:p.desc, unit:p.unit||'pcs' });
    setEditId(p.id);
    setImageFile(null);
    setImagePreview(p.image_url || null);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload;
      if (imageFile) {
        payload = new FormData();
        Object.entries({ ...form, price:Number(form.price), stock:Number(form.stock), badge:form.badge||'', emoji:form.emoji||'📦',unit:form.unit||'pcs' })
          .forEach(([k, v]) => payload.append(k, v));
        payload.append('image', imageFile);
      } else {
        payload = { ...form, price:Number(form.price), stock:Number(form.stock), badge:form.badge||null, emoji:form.emoji||'📦' };
      }
      if (editId) {
        const res = await updateProduct(editId, payload);
        setProducts(ps => ps.map(p => p.id === editId ? res.data : p));
      } else {
        const res = await createProduct(payload);
        setProducts(ps => [res.data, ...ps]);
      }
      setShowForm(false);
    } catch { setError('Failed to save product.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch { setError('Failed to delete.'); }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const cartQtyFor = (productId) => cart.find(c => c.product.id === productId)?.qty || 0;
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>;

  return (
    <div>
      {error && <div style={{ color:'var(--red)', marginBottom:12 }}>{error}</div>}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ maxWidth:240 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width:'auto' }}>
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          {user?.is_staff && <button className="btn-primary btn-sm" onClick={openAdd}>+ Add Product</button>}
          {cartCount > 0 && (
            <button className="btn-primary btn-sm" onClick={goToInvoice} style={{ background:'var(--green)' }}>
              🧾 Create Invoice ({cartCount})
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16 }}>
        {filtered.map(p => {
          const qty = cartQtyFor(p.id);
          return (
            <div key={p.id} className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div
                style={{ width:'100%', height:140, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor: p.image_url ? 'zoom-in' : 'default' }}
                onClick={() => p.image_url && setLightbox(p.image_url)}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <span style={{ fontSize:48 }}>{p.emoji}</span>
                )}
                {user?.is_staff && (
                  <div style={{ position:'absolute', top:6, right:6, display:'flex', gap:4 }}>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                      style={{ background:'rgba(255,255,255,0.9)', border:'none', borderRadius:6, width:26, height:26, padding:0, fontSize:12 }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      style={{ background:'rgba(255,255,255,0.9)', border:'none', borderRadius:6, width:26, height:26, padding:0, fontSize:12 }}>🗑️</button>
                  </div>
                )}
                {p.badge && (
                  <span className="badge badge-blue" style={{ position:'absolute', top:6, left:6 }}>{p.badge}</span>
                )}
              </div>
              <div style={{ padding:12, flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>{p.category}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:10, marginTop:'auto' }}>₹{Number(p.price).toLocaleString('en-IN')}</div>

                {qty === 0 ? (
                  <button className="btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={() => addToCart(p, 1)}>
                    + Add
                  </button>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg)', borderRadius:8, padding:'4px 8px' }}>
                    <button onClick={() => updateCartQty(p.id, qty - 1)} style={{ background:'transparent', padding:'2px 8px', fontWeight:700, fontSize:16, color:'var(--primary)' }}>−</button>
                    <span style={{ fontWeight:700 }}>{qty}</span>
                    <button onClick={() => updateCartQty(p.id, qty + 1)} style={{ background:'transparent', padding:'2px 8px', fontWeight:700, fontSize:16, color:'var(--primary)' }}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--text3)', padding:60 }}>No products found</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ marginBottom:20 }}>{editId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price:e.target.value }))} required min="0" />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock:e.target.value }))} min="0" />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Emoji (fallback)</label>
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji:e.target.value }))} maxLength={4} placeholder="📦" />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit:e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Badge (optional)</label>
                  <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge:e.target.value }))} placeholder="New, Popular…" />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured:e.target.checked }))} style={{ width:'auto' }} />
                  <label htmlFor="featured" style={{ fontWeight:600, fontSize:13 }}>Featured</label>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Description</label>
                  <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc:e.target.value }))} rows={3} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>
                    Product Image <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional)</span>
                  </label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                  }} />
                  {imagePreview && (
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:12 }}>
                      <img src={imagePreview} alt="preview" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />
                      <button type="button" className="btn-ghost btn-sm" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <img src={lightbox} alt="Product" style={{ maxWidth:'90vw', maxHeight:'90vh', borderRadius:12, boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }} />
        </div>
      )}
    </div>
  );
}