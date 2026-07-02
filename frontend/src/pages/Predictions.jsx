import { useState } from 'react';
import { predictions as predApi } from '../services/api';

const INITIAL_FORM = {
  age: '15 years old', sex: 'Male',
  physically_attacked: '0 times', physical_fighting: '0 times',
  felt_lonely: 'Never', close_friends: '3 or more',
  miss_school_no_permission: '0 days', other_students_kind: 'Sometimes',
  parents_understand_problems: 'Sometimes', most_of_the_time_felt_lonely: 'No',
  missed_classes_without_permission: 'No', cyber_bullied: 'No',
  bullied_not_on_school_property: 'No',
  were_underweight: 'No', were_overweight: 'No', were_obese: 'No'
};

export default function Predictions() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await predApi.create(form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const getGaugeColor = (score) => {
    if (score >= 0.6) return '#dc2626';
    if (score >= 0.3) return '#d97706';
    return '#059669';
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Prediksi Risiko</h1>

      <div className="grid-2">
        <div className="card">
          <h3>Penilaian Risiko Siswa</h3>
          <form onSubmit={handleSubmit}>
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
                  {['11','12','13','14','15','16','17'].map(a => (
                    <option key={a} value={`${a} years old`}>{a} tahun</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Di-Bully di Luar Sekolah</label>
                <select value={form.bullied_not_on_school_property} onChange={(e) => setForm({ ...form, bullied_not_on_school_property: e.target.value })}>
                  <option value="No">Tidak</option><option value="Yes">Ya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pernah di-Bully secara Siber</label>
                <select value={form.cyber_bullied} onChange={(e) => setForm({ ...form, cyber_bullied: e.target.value })}>
                  <option value="No">Tidak</option><option value="Yes">Ya</option>
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={loading}>
              {loading ? 'Menganalisis...' : 'Prediksi Risiko'}
            </button>
          </form>
        </div>

        <div>
          {error && <div className="card" style={{ background: '#fee2e2' }}><p style={{ color: '#dc2626' }}>{error}</p></div>}

          {result && (
            <div className="card">
              <h3>Hasil Prediksi</h3>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="risk-gauge" style={{
                  background: `conic-gradient(${getGaugeColor(result.risk_score)} ${result.risk_score * 360}deg, #eee ${result.risk_score * 360}deg)`
                }}>
                  <span className="score">{(result.risk_score * 100).toFixed(0)}%</span>
                  <span className="label">Risiko</span>
                </div>

                <div style={{ marginTop: 16 }}>
                  <span className={`badge badge-${result.risk_level?.toLowerCase()}`} style={{ fontSize: '1rem', padding: '8px 20px' }}>
                    Risiko {result.risk_level}
                  </span>
                </div>

                <p style={{ marginTop: 12, color: '#555' }}>
                  {result.prediction === 'Yes'
                    ? 'Siswa ini menunjukkan indikator yang konsisten dengan perundungan.'
                    : 'Siswa ini menunjukkan indikator rendah terhadap perundungan.'}
                </p>
              </div>

              <h4 style={{ marginTop: 16, marginBottom: 12 }}>Faktor Risiko Utama</h4>
              {result.risk_factors?.map((rf, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontSize: '0.9rem' }}>{rf.factor}</span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{(rf.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
