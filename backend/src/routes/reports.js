const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Ambil daftar laporan
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar laporan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 * /api/reports/generate:
 *   post:
 *     tags: [Reports]
 *     summary: Generate laporan baru (monthly, high_risk, interventions)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [monthly, high_risk, interventions]
 *     responses:
 *       201:
 *         description: Laporan berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 * /api/reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Ambil detail laporan by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detail laporan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Laporan tidak ditemukan
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reports WHERE school_id = ? ORDER BY created_at DESC',
      [req.school.id]
    );
    const reports = rows.map(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
      return {
        id: r.id,
        report_type: r.type,
        created_at: r.created_at,
        period: data.period
      };
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate', authenticate, async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { type } = req.body;

    let reportData = {};

    const [students] = await pool.query('SELECT * FROM students WHERE school_id = ?', [schoolId]);
    const [interventions] = await pool.query('SELECT * FROM interventions WHERE school_id = ?', [schoolId]);

    const totalStudents = students.length;
    const highRisk = students.filter(s => s.risk_level === 'High').length;
    const mediumRisk = students.filter(s => s.risk_level === 'Medium').length;
    const lowRisk = students.filter(s => s.risk_level === 'Low').length;

    if (type === 'monthly') {
      reportData = {
        report_type: 'monthly',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total_students: totalStudents,
        risk_summary: { high: highRisk, medium: mediumRisk, low: lowRisk },
        risk_percentage: totalStudents > 0 ? ((highRisk / totalStudents) * 100).toFixed(1) : 0,
        generated_at: new Date().toISOString()
      };
    } else if (type === 'high_risk') {
      const highRiskStudents = students.filter(s => s.risk_level === 'High');
      reportData = {
        report_type: 'high_risk',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total_flagged: highRiskStudents.length,
        students: highRiskStudents.map(s => ({ name: s.name, grade: s.grade, risk_score: s.risk_score })),
        generated_at: new Date().toISOString()
      };
    } else if (type === 'interventions') {
      const activeInterventions = interventions.filter(i => i.status === 'Active' || i.status === 'Planned');
      reportData = {
        report_type: 'interventions',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total_interventions: interventions.length,
        active_interventions: activeInterventions.length,
        intervention_types: [...new Set(interventions.map(i => i.type))],
        generated_at: new Date().toISOString()
      };
    } else {
      reportData = {
        report_type: type || 'comprehensive',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total_students: totalStudents,
        risk_summary: { high: highRisk, medium: mediumRisk, low: lowRisk },
        generated_at: new Date().toISOString()
      };
    }

    const id = uuidv4();
    const title = `${reportData.report_type} Report - ${new Date().toLocaleDateString()}`;
    await pool.query(
      'INSERT INTO reports (id, school_id, title, type, data) VALUES (?, ?, ?, ?, ?)',
      [id, schoolId, title, reportData.report_type, JSON.stringify(reportData)]
    );

    res.status(201).json({ message: 'Laporan berhasil dibuat', id, report: { id, report_type: reportData.report_type, period: reportData.period, created_at: new Date().toISOString(), summary: reportData } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reports WHERE id = ? AND school_id = ?',
      [req.params.id, req.school.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    const r = rows[0];
    const data = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {});
    res.json({
      report: {
        id: r.id,
        report_type: r.type,
        created_at: r.created_at,
        period: data.period,
        summary: data
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
