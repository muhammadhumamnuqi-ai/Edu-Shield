# EduShield — Sistem Peringatan Dini Perundungan Sekolah

EduShield adalah aplikasi web full-stack berbasis Machine Learning untuk mendeteksi dan memprediksi risiko perundungan (bullying) pada siswa sekolah. Dibangun dengan arsitektur PBP (Frontend & REST API terpisah).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite), Axios, Recharts, React Router DOM |
| Backend | Express.js, MySQL (mysql2), JWT, bcryptjs |
| Machine Learning | Python, scikit-learn (RandomForest), pandas, joblib |
| API Documentation | Swagger (swagger-jsdoc + swagger-ui-express) |

---

## Struktur Proyek

```
edushield/
├── backend/
│   ├── src/
│   │   ├── middleware/    # JWT authentication
│   │   ├── routes/        # 7 route files (auth, schools, students, dll)
│   │   ├── db.js          # Koneksi MySQL (connection pool)
│   │   ├── index.js       # Entry point Express
│   │   └── swagger.js     # Konfigurasi OpenAPI 3.0
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout dengan sidebar navigasi
│   │   ├── pages/         # 7 halaman (Login, Register, Dashboard, dll)
│   │   └── services/      # Axios API client
│   └── package.json
├── database/
│   ├── schema.sql         # 5 tabel (schools, students, predictions, interventions, reports)
│   └── seed.sql           # Data dummy
├── ml/
│   ├── Bullying_2018.csv          # Dataset GSHS (56.981 siswa)
│   ├── edushield_training.ipynb   # Jupyter notebook training
│   ├── model.pkl                  # Model RandomForest terlatih
│   ├── feature_importance.json    # 16 fitur dengan nilai importance
│   └── predict.py                 # Script inference (dipanggil backend)
├── screenshot.ps1          # Script screenshot otomatis
├── screenshots/            # Folder hasil screenshot
└── README.md
```

---

## Detail Kode & Alur Aplikasi

### 1. Frontend — Jembatan ke Backend (services/api.js)

File ini adalah satu-satunya penghubung frontend ke backend. Semua data dari MySQL hanya bisa diakses lewat API ini — bukti PBP.

```js
import axios from 'axios';

// baseURL menunjuk ke BACKEND (port 5000), BUKAN langsung ke MySQL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Setiap request otomatis menyertakan JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Jika backend return 401 → token expired, redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Contoh fungsi CRUD siswa
export const students = {
  getAll: (params) => api.get('/students', { params }),
  create: (data) => api.post('/students', data),
  delete: (id) => api.delete(`/students/${id}`),
};
```

**Alur data:** `Form input` → `api.js` → `HTTP Request` → `Backend (port 5000)` → `MySQL`

### 2. Frontend — Routing & Auth Guard (App.jsx)

Mengontrol akses halaman: user tanpa token tidak bisa masuk.

```jsx
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik (tanpa token) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Halaman privat — dibungkus Layout sidebar */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="interventions" element={<Interventions />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. Frontend — Dashboard dengan Recharts

Dashboard menampilkan data real-time dari API dengan visualisasi interaktif.

```jsx
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Ambil data dashboard dari 3 endpoint sekaligus
useEffect(() => {
  const load = async () => {
    const [dashRes, featRes, statsRes] = await Promise.all([
      analytics.getDashboard(),
      analytics.getFeatureImportance(),
      schools.getStats()
    ]);
    setData(dashRes.data);
    setFeatures(featRes.data?.slice(0, 8) || []);
    setStats(statsRes.data);
  };
  load();
}, []);

// Pie chart distribusi risiko
<PieChart>
  <Pie data={data.risk_distribution} dataKey="count" nameKey="risk_level">
    {data.risk_distribution.map((entry, i) => (
      <Cell key={i} fill={entry.risk_level === 'High' ? '#dc2626' : '#d97706' : '#059669'} />
    ))}
  </Pie>
</PieChart>

// Bar chart feature importance ML
<BarChart data={features} layout="vertical">
  <Bar dataKey="importance" fill="#1a1a2e" />
</BarChart>
```

### 4. Frontend — Form Tambah Siswa dengan Field GSHS

Form menggunakan nilai GSHS asli (English) di `value` dengan label Indonesia.

```jsx
const [form, setForm] = useState({
  name: '', grade: '', sex: 'Male',
  cyber_bullied: 'No', felt_lonely: 'Never',
  // ... 16 field GSHS
});

<select value={form.felt_lonely} onChange={(e) => setForm({...form, felt_lonely: e.target.value})}>
  <option value="Never">Tidak pernah</option>
  <option value="Rarely">Jarang</option>
  <option value="Sometimes">Kadang-kadang</option>
  <option value="Most of the time">Sering</option>
  <option value="Always">Selalu</option>
</select>

/* value="Never" dikirim ke backend → ke ML model (inggris)
   Tampilan "Tidak pernah" di UI (Indonesia) */
```

### 5. Backend — Entry Point Express (index.js)

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Middleware global
app.use(helmet());          // Security headers
app.use(cors());            // Allow frontend origin
app.use(morgan('dev'));     // Logging
app.use(express.json());    // Parse JSON body

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routes — 7 grup endpoint
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/reports', reportRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Kesalahan server internal' });
});

app.listen(PORT, () => console.log(`EduShield API running on port ${PORT}`));
```

### 6. Backend — Middleware JWT (middleware/auth.js)

Setiap endpoint (kecuali login/register) melewati middleware ini.

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  // Header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.school = decoded;   // Data sekolah tersimpan di req.school
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid' });
  }
}
```

### 7. Backend — Route dengan Validasi + Query MySQL

Contoh endpoint GET /students dengan paginasi dan search.

```js
router.get('/', authenticate, async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM students WHERE school_id = ?';
  let params = [req.school.id];

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [rows] = await pool.query(query, params);
  res.json({ students: rows, total, page, limit });
});
```

### 8. Backend — Prediksi ML via Python (students.js)

Saat tambah siswa, backend otomatis memanggil Python untuk prediksi.

```js
function predictRisk(studentData) {
  const predictScript = path.join(__dirname, '../../../ml/predict.py');
  const input = JSON.stringify(studentData);

  // Panggil Python via child_process
  const result = execSync(`python "${predictScript}"`, {
    input,          // kirim data via stdin
    cwd: path.join(__dirname, '../../../'),
    timeout: 30000
  });
  return JSON.parse(result.toString());
}

// Mapping field frontend → GSHS column names
const inputData = {
  Cyber_bullied_in_past_12_months: student.cyber_bullied || 'No',
  Custom_Age: student.age || '15 years old',
  Sex: student.sex || 'Male',
  Felt_lonely: student.felt_lonely || 'Never',
  // ... 16 field
};

const prediction = predictRisk(inputData);
// → { prediction: "Yes", risk_score: 0.84, risk_level: "High", risk_factors: [...] }

// Simpan hasil prediksi ke MySQL
await pool.query(
  'INSERT INTO predictions (id, school_id, student_id, prediction, risk_score, risk_level, input_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [predId, req.school.id, id, prediction.prediction, prediction.risk_score, prediction.risk_level, JSON.stringify(inputData)]
);

res.status(201).json({ student, prediction });
```

### 9. Backend — Koneksi MySQL (db.js)

```js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edushield',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
// Semua route import pool dan panggil pool.query(SQL, params)
```

### 10. Database — Relasi Foreign Key (schema.sql)

```sql
CREATE TABLE schools (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  risk_score DECIMAL(5,4),       -- hasil ML
  risk_level VARCHAR(20),         -- High/Medium/Low
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE interventions (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36),
  status VARCHAR(20) DEFAULT 'Direncanakan',
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE predictions (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36),
  input_data JSON,                -- data mentah yang dikirim ke ML
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  data JSON,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
```

### 11. Machine Learning — Script Inference (ml/predict.py)

```python
import sys, json, joblib
import pandas as pd

# Load model — sekali di awal
model_data = joblib.load('ml/model.pkl')
model = model_data['model']
label_encoders = model_data['label_encoders']
feature_cols = model_data['feature_cols']

def predict(input_data):
    df = pd.DataFrame([input_data])

    # Encode input pakai LabelEncoder yang sama saat training
    for col in feature_cols:
        le = label_encoders.get(col)
        if le:
            known = list(le.classes_)
            fallback = 'Unknown' if 'Unknown' in known else known[0]
            df[col] = df[col].apply(lambda x: x if x in known else fallback)
            df[col] = le.transform(df[col].astype(str))

    # RandomForest predict + probabilitas
    prediction = model.predict(df[feature_cols])[0]
    proba = model.predict_proba(df[feature_cols])[0]

    risk_score = float(proba[1])  # probabilitas kelas "Yes"
    risk_level = 'High' if risk_score >= 0.6 else (
        'Medium' if risk_score >= 0.3 else 'Low'
    )

    # Top 5 faktor risiko
    feature_imp = dict(zip(feature_cols, model.feature_importances_))
    risk_factors = sorted(
        [{'factor': f.replace('_', ' ').title(), 'importance': float(v)}
         for f, v in feature_imp.items()],
        key=lambda x: x['importance'], reverse=True
    )[:5]

    return {
        'prediction': classes[prediction],
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_factors': risk_factors
    }

# Baca dari stdin (dikirim backend), tulis ke stdout
if __name__ == '__main__':
    input_data = json.loads(sys.stdin.read())
    print(json.dumps(predict(input_data)))
```

### 12. Hasil Evaluasi Model

```
Confusion Matrix:
              Predicted No    Predicted Yes
Actual No         7303           1713
Actual Yes         957           1424

Accuracy:  76.58%
ROC-AUC:   0.77

Top 5 Fitur:
  Bullied not on school property  27.2%
  Cyber bullied                   14.8%
  Felt lonely                      7.6%
  Other students kind              6.8%
  Age                              6.7%
```

---

## Cara Install & Jalankan

### Prasyarat

- Node.js >= 18
- Python >= 3.9 (scikit-learn, pandas, joblib, numpy)
- MySQL (XAMPP/Laragon)

### 1. Clone & Install

```bash
git clone https://github.com/muhammadhumamnuqi-ai/Edu-Shield.git
cd Edu-Shield

cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Database

Jalankan `database/schema.sql` di MySQL.

### 3. Konfigurasi (.env di backend/)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=edushield
JWT_SECRET=rahasia_edushield_2024
```

### 4. Jalankan

```bash
# Terminal 1
cd backend && npm start    # http://localhost:5000

# Terminal 2
cd frontend && npm run dev # http://localhost:5173
```

### 5. Screenshot

```powershell
.\screenshot.ps1
```

---

## API Endpoints

| Method | Endpoint | Deskripsi | Butuh Token? |
|---|---|---|---|
| POST | `/api/auth/register` | Daftar sekolah baru | Tidak |
| POST | `/api/auth/login` | Login sekolah | Tidak |
| GET | `/api/auth/me` | Profil sekolah | Ya |
| GET | `/api/schools/profile` | Profil sekolah | Ya |
| PUT | `/api/schools/profile` | Update profil | Ya |
| GET | `/api/schools/stats` | Statistik dashboard | Ya |
| GET | `/api/students` | Daftar siswa (paginasi) | Ya |
| POST | `/api/students` | Tambah + prediksi siswa | Ya |
| GET | `/api/students/:id` | Detail siswa | Ya |
| PUT | `/api/students/:id` | Update siswa | Ya |
| DELETE | `/api/students/:id` | Hapus siswa | Ya |
| POST | `/api/predictions` | Prediksi risiko manual | Ya |
| GET | `/api/predictions` | Riwayat prediksi | Ya |
| GET | `/api/analytics/dashboard` | Data dashboard | Ya |
| GET | `/api/analytics/feature-importance` | Importance fitur ML | Ya |
| GET | `/api/interventions` | Daftar intervensi | Ya |
| POST | `/api/interventions` | Buat intervensi | Ya |
| PUT | `/api/interventions/:id` | Update intervensi | Ya |
| DELETE | `/api/interventions/:id` | Hapus intervensi | Ya |
| GET | `/api/reports` | Daftar laporan | Ya |
| POST | `/api/reports/generate` | Generate laporan | Ya |
| GET | `/api/reports/:id` | Detail laporan | Ya |

---

## Machine Learning Detail

### Dataset GSHS

- **Sumber:** WHO & CDC — 56.981 siswa global
- **Target:** `Bullied_on_school_property_in_past_12_months` (Yes: 20.9%, No: 79.1%)

### Model: RandomForest

| Parameter | Nilai |
|---|---|
| n_estimators | 100 |
| max_depth | 15 |
| class_weight | balanced |
| Accuracy | 76.58% |
| ROC-AUC | 0.77 |

### Risk Threshold

| Skor | Level | Tindakan |
|---|---|---|
| ≥ 0.6 | High | Intervensi segera |
| 0.3 – 0.6 | Medium | Monitoring |
| < 0.3 | Low | Normal |

---

## Alur Data Lengkap

```
User Buka Browser (http://localhost:5173)
         │
         ▼
    App.jsx (PrivateRoute)
         │
         ├─ token tidak ada → Login.jsx
         │                    └─ POST /api/auth/login → JWT token
         │
         └─ token ada → Layout.jsx (sidebar)
                          │
                          ├─ Dashboard → analytics.getDashboard()
                          │              ├─ pool.query('SELECT COUNT...')
                          │              ├─ pool.query('SELECT risk_level...')
                          │              └─ pool.query('SELECT SUM(CASE...)')
                          │
                          ├─ Students → students.getAll()
                          │              └─ pool.query('SELECT * FROM students WHERE school_id=?')
                          │
                          ├─ Predictions → predictions.create(data)
                          │                 ├─ predictRisk(data) → Python ML
                          │                 └─ pool.query('INSERT INTO predictions...')
                          │
                          ├─ Interventions → interventions.create(data)
                          │                   └─ pool.query('INSERT INTO interventions...')
                          │
                          └─ Reports → reports.generate(type)
                                        ├─ pool.query('SELECT * FROM students WHERE school_id=?')
                                        ├─ pool.query('SELECT * FROM interventions WHERE school_id=?')
                                        └─ pool.query('INSERT INTO reports...')
```

---

## Lisensi

Proyek ini dibuat untuk tujuan edukasi sebagai UAS mata kuliah PBP (Pemrograman Berbasis Platform).
