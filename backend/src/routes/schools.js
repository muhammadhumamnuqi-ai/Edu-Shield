const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/schools/profile:
 *   get:
 *     tags: [Schools]
 *     summary: Ambil profil sekolah
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data profil sekolah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, address, phone, created_at FROM schools WHERE id = ?',
      [req.school.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/schools/profile:
 *   put:
 *     tags: [Schools]
 *     summary: Update profil sekolah
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Profil diperbarui
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    await pool.query(
      'UPDATE schools SET name = COALESCE(?, name), address = COALESCE(?, address), phone = COALESCE(?, phone) WHERE id = ?',
      [name, address, phone, req.school.id]
    );
    res.json({ message: 'Profil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/schools/stats:
 *   get:
 *     tags: [Schools]
 *     summary: Ambil statistik sekolah (jumlah siswa, prediksi, intervensi)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik sekolah
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [studentCount] = await pool.query(
      'SELECT COUNT(*) as total FROM students WHERE school_id = ?', [req.school.id]
    );
    const [highRisk] = await pool.query(
      "SELECT COUNT(*) as total FROM students WHERE school_id = ? AND risk_level = 'High'", [req.school.id]
    );
    const [predictionCount] = await pool.query(
      'SELECT COUNT(*) as total FROM predictions WHERE school_id = ?', [req.school.id]
    );
    const [interventionCount] = await pool.query(
      'SELECT COUNT(*) as total FROM interventions WHERE school_id = ?', [req.school.id]
    );

    res.json({
      total_students: studentCount[0].total,
      high_risk_students: highRisk[0].total,
      total_predictions: predictionCount[0].total,
      total_interventions: interventionCount[0].total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
