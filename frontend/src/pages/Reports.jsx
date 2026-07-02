import { useEffect, useState } from 'react';
import { reports as repApi } from '../services/api';

export default function Reports() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await repApi.getAll();
      setList(data.reports || data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async (type) => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await repApi.generate(type);
      setMessage(`Laporan ${type} berhasil dibuat`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const { data } = await repApi.getById(id);
      setSelected(data.report || data);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Laporan</h1>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Ringkasan Bulanan</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '8px 0 16px' }}>Gambaran risiko seluruh sekolah</p>
          <button className="btn btn-primary" onClick={() => handleGenerate('monthly')} disabled={loading}>
            {loading ? 'Memproses...' : 'Buat'}
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Siswa Risiko Tinggi</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '8px 0 16px' }}>Daftar siswa yang perlu intervensi</p>
          <button className="btn btn-primary" onClick={() => handleGenerate('high_risk')} disabled={loading}>
            {loading ? 'Memproses...' : 'Buat'}
          </button>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Laporan Intervensi</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '8px 0 16px' }}>Gambaran intervensi aktif</p>
          <button className="btn btn-primary" onClick={() => handleGenerate('interventions')} disabled={loading}>
            {loading ? 'Memproses...' : 'Buat'}
          </button>
        </div>
      </div>

      {message && (
        <div className="card" style={{ background: '#dbeafe', marginBottom: 16 }}>
          <p style={{ color: '#1d4ed8' }}>{message}</p>
        </div>
      )}

      <div className="card">
        <h3>Laporan Tersimpan</h3>
        {list.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada laporan</h3>
            <p>Buat laporan untuk melihatnya di sini</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Jenis</th><th>Dibuat</th><th>Periode</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>{r.report_type}</span></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                  <td>{r.period || '-'}</td>
                  <td><button className="btn btn-sm btn-primary" onClick={() => handleView(r.id)}>Lihat</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Laporan: {selected.report_type}</h2>
            <p style={{ color: '#888', marginBottom: 16 }}>Dibuat: {selected.created_at ? new Date(selected.created_at).toLocaleString() : '-'}</p>

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {selected.summary ? (
                Object.entries(selected.summary).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 12, padding: '8px 12px', borderLeft: '3px solid #1a1a2e' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong>
                    <span style={{ marginLeft: 8, color: '#555' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>Tidak ada data ringkasan</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn" style={{ background: '#eee' }} onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
