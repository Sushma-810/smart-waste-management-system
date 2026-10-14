import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = user.role === 'admin'
    ? [['/admin', 'Overview'], ['/admin/complaints', 'All complaints']]
    : [['/dashboard', 'Dashboard'], ['/report', 'Report waste'], ['/complaints', 'My complaints']];

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">EcoReport</div>
        <nav aria-label="Dashboard">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p><strong>{user.name}</strong><br /><span className="muted">{user.role === 'admin' ? 'Administrator' : 'Citizen'}</span></p>
          <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="content">
        <button className="menu-btn" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>☰ Menu</button>
        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}
