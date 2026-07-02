const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/interventions:
 *   get:
 *     tags: [Interventions]
 *     summary: Ambil daftar intervensi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Daftar intervensi
 *         content:
 *           application/json:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Intervention'
 *   post:
 *     tags: [Interventions]
 *     summary: Buat intervensi baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterventionInput'
 *     responses:
 *       201:
 *         description: Intervensi berhasil dibuat
 * /api/interventions/{id}:
 *   put:
 *     tags: [Interventions]
 *     summary: Update intervensi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterventionInput'
 *     responses:
 *       200:
 *         description: Intervensi diperbarui
 *   delete:
 *     tags: [Interventions]
 *     summary: Hapus intervensi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Intervensi dihapus
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT i.*, s.name as student_name FROM interventions i LEFT JOIN students s ON i.student_id = s.id WHERE i.school_id = ?';
    const params = [req.school.id];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { student_id, type, description, start_date, end_date, status } = req.body;

    const id = uuidv4();
    await pool.query(
      'INSERT INTO interventions (id, school_id, student_id, type, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.school.id, student_id || null, type || 'Counseling', description || null, start_date || null, end_date || null, status || 'Planned']
    );

    res.status(201).json({ message: 'Intervensi dibuat', id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { type, description, start_date, end_date, status } = req.body;
    await pool.query(
      'UPDATE interventions SET type = COALESCE(?, type), description = COALESCE(?, description), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), status = COALESCE(?, status) WHERE id = ? AND school_id = ?',
      [type, description, start_date, end_date, status, req.params.id, req.school.id]
    );
    res.json({ message: 'Intervensi diperbarui' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM interventions WHERE id = ? AND school_id = ?', [req.params.id, req.school.id]);
    res.json({ message: 'Intervensi dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
