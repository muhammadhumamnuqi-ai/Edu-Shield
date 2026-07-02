import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  const school = JSON.parse(localStorage.getItem('school') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('school');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>EduShield</h2>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>
            👥 Siswa
          </NavLink>
          <NavLink to="/predictions" className={({ isActive }) => isActive ? 'active' : ''}>
            🔮 Prediksi Risiko
          </NavLink>
          <NavLink to="/interventions" className={({ isActive }) => isActive ? 'active' : ''}>
            🛡️ Intervensi
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            📄 Laporan
          </NavLink>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #16213e' }}>
          <div style={{ fontSize: '0.85rem', color: '#a8a8b8', marginBottom: 8 }}>{school.name}</div>
          <button className="logout" onClick={handleLogout}>🚪 Keluar</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
