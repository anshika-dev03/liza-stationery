import { useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  if (!user) return <LoginPage onLogin={() => {}} />;

  return <AdminDashboard />;
}