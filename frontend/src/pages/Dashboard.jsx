import { useEffect, useState } from 'react';
import { analytics, schools } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, featRes, statsRes] = await Promise.all([
          analytics.getDashboard(),
          analytics.getFeatureImportance(),
          schools.getStats()
        ]);
        setData(dashRes.data);
        setFeatures(featRes.data?.slice(0, 8) || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <div className="grid-4">
        <div className="stat-card">
          <div className="label">Total Siswa</div>
          <div className="value">{stats?.total_students || data?.total_students || 0}</div>
          <div className="sub">Terdaftar di sistem</div>
        </div>
        <div className="stat-card">
          <div className="label">Risiko Tinggi</div>
          <div className="value" style={{ color: '#dc2626' }}>{data?.risk_distribution?.find(r => r.risk_level === 'High')?.count || 0}</div>
          <div className="sub">Butuh perhatian segera</div>
        </div>
        <div className="stat-card">
          <div className="label">Prediksi Dilakukan</div>
          <div className="value">{stats?.total_predictions || 0}</div>
          <div className="sub">Total penilaian risiko</div>
        </div>
        <div className="stat-card">
          <div className="label">Intervensi</div>
          <div className="value">{stats?.total_interventions || 0}</div>
          <div className="sub">Program dukungan</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Distribusi Risiko</h3>
          {data?.risk_distribution ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.risk_distribution} dataKey="count" nameKey="risk_level" cx="50%" cy="50%" outerRadius={90} label={({ risk_level, count }) => `${risk_level}: ${count}`}>
                  {data.risk_distribution.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.risk_level] || '#888'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Tambahkan siswa untuk melihat distribusi risiko</p></div>}
        </div>

        <div className="card">
          <h3>Faktor Risiko Utama</h3>
          {features.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={features} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} tickFormatter={(v) => v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 20)} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" fill="#1a1a2e" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Memuat faktor risiko...</p></div>}
        </div>
      </div>

      <div className="card">
        <h3>Analisis Faktor Risiko</h3>
        {data?.risk_factors ? (
          <div className="grid-4">
            <div className="stat-card">
              <div className="label">Merasa Kesepian</div>
              <div className="value" style={{ color: '#dc2626' }}>{data.risk_factors.lonely_count || 0}</div>
              <div className="sub">Siswa yang sering merasa kesepian</div>
            </div>
            <div className="stat-card">
              <div className="label">Sedikit Teman Dekat</div>
              <div className="value" style={{ color: '#d97706' }}>{data.risk_factors.few_friends_count || 0}</div>
              <div className="sub">Siswa dengan 0-1 teman dekat</div>
            </div>
            <div className="stat-card">
              <div className="label">Dukungan Orang Tua Rendah</div>
              <div className="value" style={{ color: '#d97706' }}>{data.risk_factors.low_parental_support || 0}</div>
              <div className="sub">Orang tua jarang/tidak pernah mengerti</div>
            </div>
            <div className="stat-card">
              <div className="label">Mengalami Kekerasan Fisik</div>
              <div className="value" style={{ color: '#dc2626' }}>{data.risk_factors.physically_attacked_count || 0}</div>
              <div className="sub">Siswa yang pernah diserang</div>
            </div>
          </div>
        ) : <div className="empty-state"><p>Tambahkan data siswa untuk melihat analisis faktor risiko</p></div>}
      </div>

      <div className="card">
        <h3>Tentang EduShield</h3>
        <p style={{ color: '#555', lineHeight: 1.7 }}>
          EduShield adalah Sistem Peringatan Dini Perundungan Sekolah yang didukung oleh pembelajaran mesin.
          Model prediksi dilatih pada data dari <strong>56.981 siswa</strong> (Survei GSHS, WHO/CDC)
          dengan akurasi <strong>76,6%</strong> dan <strong>ROC-AUC 0,77</strong>.
          Faktor risiko utama meliputi: pengalaman perundungan sebelumnya, perundungan siber, kesepian, dan kurangnya dukungan orang tua.
        </p>
      </div>
    </div>
  );
}
