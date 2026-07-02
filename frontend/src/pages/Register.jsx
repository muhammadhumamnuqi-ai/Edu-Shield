import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setError('Kata sandi tidak cocok');
    }
    try {
      const { data } = await auth.register({ name: form.name, email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('school', JSON.stringify(data.school));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Pendaftaran gagal');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>EduShield</h1>
        <p>Daftarkan sekolah Anda</p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Sekolah</label>
            <input type="text" placeholder="SMA Negeri 1 Jakarta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="sekolah@contoh.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Kata Sandi</label>
            <input type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Konfirmasi Kata Sandi</label>
            <input type="password" placeholder="Masukkan ulang kata sandi" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Daftar</button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9rem' }}>
          Sudah terdaftar? <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 600 }}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
