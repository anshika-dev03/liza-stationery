import { useState } from 'react';
import { useAuth } from '../AuthContext';
import ProductsTab from './ProductsTab';
import InvoicesTab from './InvoicesTab';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('products');
  const [cart, setCart] = useState([]); // [{ product, qty }]

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, { product, qty }];
    });
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.product.id !== productId));
    } else {
      setCart(prev => prev.map(c => c.product.id === productId ? { ...c, qty } : c));
    }
  };

  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'#1E2A3A', padding:'0 28px', display:'flex', alignItems:'center', gap:20, height:56 }}>
        <div style={{ color:'#fff', fontWeight:700, fontSize:16, marginRight:'auto' }}>🖊 Liza Stationery</div>
        <button onClick={() => setTab('products')}
          style={{ background: tab === 'products' ? 'rgba(255,255,255,0.12)' : 'transparent', color:'#fff', border:'none', padding:'6px 14px', borderRadius:8, fontSize:13 }}>
          📦 Products
        </button>
        <button onClick={() => setTab('invoices')}
          style={{ background: tab === 'invoices' ? 'rgba(255,255,255,0.12)' : 'transparent', color:'#fff', border:'none', padding:'6px 14px', borderRadius:8, fontSize:13, position:'relative' }}>
          🧾 Invoices
          {cartCount > 0 && (
            <span style={{ position:'absolute', top:-4, right:-4, background:'#DC2626', color:'#fff', borderRadius:10, fontSize:10, padding:'1px 6px', fontWeight:700 }}>
              {cartCount}
            </span>
          )}
        </button>
        <div style={{ color:'#8A9BB0', fontSize:13 }}>{user?.username}</div>
        <button onClick={logout} style={{ background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', padding:'5px 12px', borderRadius:8, fontSize:12 }}>
          Sign out
        </button>
      </div>

      <div style={{ padding:28, maxWidth:1300, margin:'0 auto' }}>
        {tab === 'products' && (
          <ProductsTab cart={cart} addToCart={addToCart} updateCartQty={updateCartQty} goToInvoice={() => setTab('invoices')} />
        )}
        {tab === 'invoices' && (
          <InvoicesTab cart={cart} updateCartQty={updateCartQty} clearCart={clearCart} />
        )}
      </div>
    </div>
  );
}