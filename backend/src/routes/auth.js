const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Daftarkan sekolah baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Sekolah berhasil didaftarkan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email sudah terdaftar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan kata sandi wajib diisi' });
    }

    const [existing] = await pool.query('SELECT id FROM schools WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO schools (id, name, email, password, address, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, address || null, phone || null]
    );

    const token = jwt.sign({ id, email, name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Sekolah berhasil didaftarkan', token, school: { id, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Pendaftaran gagal', error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login sekolah
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan kata sandi wajib diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM schools WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau kata sandi salah' });
    }

    const school = rows[0];
    const validPassword = await bcrypt.compare(password, school.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email atau kata sandi salah' });
    }

    const token = jwt.sign(
      { id: school.id, email: school.email, name: school.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      school: { id: school.id, name: school.name, email: school.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal masuk', error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Ambil profil sekolah yang sedang login
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil sekolah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       401:
 *         description: Token tidak valid
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Tidak ada token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, name, email, address, phone, created_at FROM schools WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Sekolah tidak ditemukan' });

    res.json(rows[0]);
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid' });
  }
});

module.exports = router;
