import { useEffect, useState } from 'react';
import { interventions as intApi, students as studentsApi } from '../services/api';

export default function Interventions() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', type: 'Konseling', description: '', start_date: '', end_date: '', status: 'Direncanakan' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const [iRes, sRes] = await Promise.all([intApi.getAll(), studentsApi.getAll({ limit: 1000 })]);
      setList(iRes.data.interventions || iRes.data);
      setStudents(sRes.data.students || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ student_id: '', type: 'Konseling', description: '', start_date: '', end_date: '', status: 'Direncanakan' });
    setShowModal(true);
  };

  const openEdit = (int) => {
    setEditing(int);
    setForm({
      student_id: int.student_id,
      type: int.type,
      description: int.description || '',
      start_date: int.start_date ? int.start_date.substring(0, 10) : '',
      end_date: int.end_date ? int.end_date.substring(0, 10) : '',
      status: int.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await intApi.update(editing.id, form);
      } else {
        await intApi.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus intervensi ini?')) return;
    try { await intApi.delete(id); load(); } catch (err) { console.error(err); }
  };

  const statusColors = { Direncanakan: '#d97706', Aktif: '#059669', Selesai: '#2563eb', Dibatalkan: '#888' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Intervensi</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Intervensi Baru</button>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada intervensi</h3>
            <p>Buat program dukungan untuk siswa berisiko</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Siswa</th><th>Jenis</th><th>Deskripsi</th><th>Mulai</th><th>Selesai</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((int) => (
                <tr key={int.id}>
                  <td>{int.student_name || int.student_id}</td>
                  <td><span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>{int.type}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{int.description}</td>
                  <td>{int.start_date ? new Date(int.start_date).toLocaleDateString() : '-'}</td>
                  <td>{int.end_date ? new Date(int.end_date).toLocaleDateString() : '-'}</td>
                  <td><span className="badge" style={{ background: `${statusColors[int.status]}22`, color: statusColors[int.status] }}>{int.status}</span></td>
                  <td>
                    <button className="btn btn-sm" style={{ background: '#eee', marginRight: 4 }} onClick={() => openEdit(int)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(int.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Intervensi' : 'Intervensi Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Siswa</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
                  <option value="">Pilih siswa</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.risk_level || 'Tidak diketahui'})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jenis</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option>Konseling</option><option>Mentoring</option><option>Pertemuan Orang Tua</option>
                    <option>Dukungan Teman</option><option>Pemantauan Guru</option><option>Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option>Direncanakan</option><option>Aktif</option><option>Selesai</option><option>Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Mulai</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tanggal Selesai</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" style={{ background: '#eee' }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Perbarui' : 'Buat'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
