import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('school', JSON.stringify(data.school));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>EduShield</h1>
        <p>Sistem Peringatan Dini Perundungan Sekolah</p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="sekolah@contoh.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Kata Sandi</label>
            <input type="password" placeholder="Masukkan kata sandi" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Masuk</button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9rem' }}>
          Belum punya akun? <Link to="/register" style={{ color: '#1a1a2e', fontWeight: 600 }}>Daftar</Link>
        </p>
      </div>
    </div>
  );
}
