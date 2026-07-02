import { useEffect, useState } from 'react';
import { students as studentsApi } from '../services/api';

export default function Students() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', grade: '', sex: 'Male', age: '15 years old',
    physically_attacked: '0 times', physical_fighting: '0 times',
    felt_lonely: 'Never', close_friends: '3 or more',
    miss_school_no_permission: '0 days', other_students_kind: 'Sometimes',
    parents_understand_problems: 'Sometimes', most_of_the_time_felt_lonely: 'No',
    missed_classes_without_permission: 'No', cyber_bullied: 'No',
    bullied_not_on_school_property: 'No',
    were_underweight: 'No', were_overweight: 'No', were_obese: 'No'
  });

  const load = async () => {
    try {
      const { data } = await studentsApi.getAll({ page, search, limit: 20 });
      setList(data.students);
      setTotal(data.total);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentsApi.create(form);
      setShowModal(false);
      load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus siswa ini?')) return;
    try {
      await studentsApi.delete(id);
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Siswa</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <input placeholder="Cari siswa..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: 250 }} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Siswa</button>
        </div>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada siswa</h3>
            <p>Tambahkan siswa pertama untuk memulai penilaian risiko</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Nama</th><th>Kelas</th><th>Usia</th><th>JK</th><th>Tingkat Risiko</th><th>Skor Risiko</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name || '-'}</td>
                    <td>{s.grade || '-'}</td>
                    <td>{s.age || '-'}</td>
                    <td>{s.sex || '-'}</td>
                    <td><span className={`badge badge-${s.risk_level?.toLowerCase() || 'low'}`}>{s.risk_level || 'Tidak diketahui'}</span></td>
                    <td>{s.risk_score ? `${(s.risk_score * 100).toFixed(1)}%` : '-'}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>Total: {total} siswa</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: '#eee' }}>Sebelumnya</button>
                <span style={{ padding: '6px 12px' }}>Hal {page}</span>
                <button className="btn btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} style={{ background: '#eee' }}>Selanjutnya</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tambah Siswa</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nama</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Kelas</label>
                  <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                    <option value="Male">Laki-laki</option><option value="Female">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Usia</label>
                  <select value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}>
                    <option value="11 years old">11 tahun</option><option value="12 years old">12 tahun</option><option value="13 years old">13 tahun</option>
                    <option value="14 years old">14 tahun</option><option value="15 years old">15 tahun</option><option value="16 years old">16 tahun</option>
                    <option value="17 years old">17 tahun</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Merasa Kesepian</label>
                  <select value={form.felt_lonely} onChange={(e) => setForm({ ...form, felt_lonely: e.target.value })}>
                    <option value="Never">Tidak pernah</option><option value="Rarely">Jarang</option><option value="Sometimes">Kadang-kadang</option>
                    <option value="Most of the time">Sering</option><option value="Always">Selalu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Teman Dekat</label>
                  <select value={form.close_friends} onChange={(e) => setForm({ ...form, close_friends: e.target.value })}>
                    <option>0</option><option>1</option><option>2</option><option value="3 or more">3 atau lebih</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mengalami Kekerasan Fisik</label>
                  <select value={form.physically_attacked} onChange={(e) => setForm({ ...form, physically_attacked: e.target.value })}>
                    <option value="0 times">0 kali</option><option value="1 time">1 kali</option><option value="2 or 3 times">2 atau 3 kali</option>
                    <option value="4 or 5 times">4 atau 5 kali</option><option value="6 or 7 times">6 atau 7 kali</option><option value="8 or 9 times">8 atau 9 kali</option>
                    <option value="10 or 11 times">10 atau 11 kali</option><option value="12 or more times">12 kali atau lebih</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Orang Tua Memahami Masalah</label>
                  <select value={form.parents_understand_problems} onChange={(e) => setForm({ ...form, parents_understand_problems: e.target.value })}>
                    <option value="Never">Tidak pernah</option><option value="Rarely">Jarang</option><option value="Sometimes">Kadang-kadang</option>
                    <option value="Most of the time">Sering</option><option value="Always">Selalu</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pernah di-Bully secara Siber</label>
                  <select value={form.cyber_bullied} onChange={(e) => setForm({ ...form, cyber_bullied: e.target.value })}>
                    <option value="No">Tidak</option><option value="Yes">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Di-Bully di Luar Sekolah</label>
                  <select value={form.bullied_not_on_school_property} onChange={(e) => setForm({ ...form, bullied_not_on_school_property: e.target.value })}>
                    <option value="No">Tidak</option><option value="Yes">Ya</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" style={{ background: '#eee' }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Tambah & Prediksi Risiko</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
