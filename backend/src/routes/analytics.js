const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Data dashboard (distribusi risiko, faktor risiko, dll)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardData'
 * /api/analytics/feature-importance:
 *   get:
 *     tags: [Analytics]
 *     summary: Importance fitur dari model ML
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array fitur dan nilai importance
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const schoolId = req.school.id;

    const [totalStudents] = await pool.query(
      'SELECT COUNT(*) as total FROM students WHERE school_id = ?', [schoolId]
    );
    const [riskDistribution] = await pool.query(
      'SELECT risk_level, COUNT(*) as count FROM students WHERE school_id = ? GROUP BY risk_level',
      [schoolId]
    );
    const [genderDistribution] = await pool.query(
      'SELECT sex, COUNT(*) as count FROM students WHERE school_id = ? GROUP BY sex',
      [schoolId]
    );
    const [ageDistribution] = await pool.query(
      'SELECT age, COUNT(*) as count FROM students WHERE school_id = ? GROUP BY age ORDER BY count DESC LIMIT 10',
      [schoolId]
    );
    const [recentPredictions] = await pool.query(
      'SELECT DATE(created_at) as date, COUNT(*) as count FROM predictions WHERE school_id = ? GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14',
      [schoolId]
    );
    const recentInterventions = await pool.query(
      'SELECT status, COUNT(*) as count FROM interventions WHERE school_id = ? GROUP BY status',
      [schoolId]
    );

    const [riskFactors] = await pool.query(
      `SELECT
        SUM(CASE WHEN felt_lonely IN ('Most of the time', 'Always') THEN 1 ELSE 0 END) as lonely_count,
        SUM(CASE WHEN close_friends IN ('0', '1') THEN 1 ELSE 0 END) as few_friends_count,
        SUM(CASE WHEN parents_understand_problems IN ('Never', 'Rarely') THEN 1 ELSE 0 END) as low_parental_support,
        SUM(CASE WHEN physically_attacked != '0 times' THEN 1 ELSE 0 END) as physically_attacked_count,
        SUM(CASE WHEN missed_classes_without_permission = 'Yes' THEN 1 ELSE 0 END) as truancy_count,
        COUNT(*) as total
      FROM students WHERE school_id = ?`,
      [schoolId]
    );

    res.json({
      total_students: totalStudents[0].total,
      risk_distribution: riskDistribution,
      gender_distribution: genderDistribution,
      age_distribution: ageDistribution,
      prediction_trend: recentPredictions.reverse(),
      intervention_status: recentInterventions[0],
      risk_factors: riskFactors[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/feature-importance', authenticate, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../../ml/feature_importance.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
