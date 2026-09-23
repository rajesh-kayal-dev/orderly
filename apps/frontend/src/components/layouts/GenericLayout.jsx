// Empty layout components for Restaurant, Admin, and Delivery for brevity.
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import BrandLogo from '../common/BrandLogo';
import { 
  AppstoreOutlined, 
  ShoppingOutlined, 
  UserOutlined, 
  TeamOutlined, 
  UnorderedListOutlined,
  LogoutOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  AuditOutlined
} from '@ant-design/icons';

export default function GenericLayout({ roleTitle, rolePath }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, profile } = useSelector(state => state.auth);
  const activeCount = useSelector(state => state.order.activeCount);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 shadow-xl fixed h-full z-20 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <BrandLogo variant="light" size="md" to={rolePath} />
          </div>

          <nav className="space-y-2">
            <NavItem to={`${rolePath}`} icon={<AppstoreOutlined />} label="Dashboard" />
            <NavItem 
              to={`${rolePath}/orders`} 
              icon={<ShoppingOutlined />} 
              label="Orders" 
              badge={activeCount}
            />
            {roleTitle === 'Delivery Partner' && <NavItem to={`${rolePath}/summary`} icon={<BarChartOutlined />} label="Monthly Summary" />}
            {roleTitle === 'Restaurant' && <NavItem to={`${rolePath}/menu`} icon={<UnorderedListOutlined />} label="Menu Catalog" />}
            {roleTitle === 'Restaurant' && <NavItem to={`${rolePath}/summary`} icon={<BarChartOutlined />} label="Yearly Summary" />}
            {rolePath.includes('admin') && <NavItem to={`${rolePath}/users`} icon={<TeamOutlined />} label="User Management" />}
            {rolePath.includes('admin') && <NavItem to={`${rolePath}/pending-approvals`} icon={<AuditOutlined />} label="Pending Approvals" />}
            <NavItem to={`${rolePath}/profile`} icon={<UserOutlined />} label="Profile" />
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-800">{roleTitle} Dashboard</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Management Console</p>
          </div>

          <div className="flex items-center gap-6">
            <Link to={`${rolePath}/profile`} className="flex items-center gap-3 pr-6 border-r border-gray-100 group transition-all">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700 group-hover:text-primary">{user?.full_name || user?.email}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">{roleTitle} Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm font-mono text-lg uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                {user?.full_name?.[0] || user?.email?.[0]}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-red-200 focus:outline-none focus:ring-4 focus:ring-red-100 group"
            >
              <LogoutOutlined className="group-hover:-translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, badge }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group font-medium relative"
    >
      <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity flex items-center">{icon}</span>
      <span className="text-sm">{label}</span>
      
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 animate-pulse ml-auto mr-2">
          {badge}
        </span>
      )}

      <ArrowRightOutlined className={`${badge > 0 ? 'ml-0' : 'ml-auto'} opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all text-[10px]`} />
    </Link>
  );
}
