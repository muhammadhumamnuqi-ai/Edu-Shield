const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');
const path = require('path');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/predictions:
 *   post:
 *     tags: [Predictions]
 *     summary: Prediksi risiko perundungan berdasarkan data siswa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Hasil prediksi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionResult'
 *   get:
 *     tags: [Predictions]
 *     summary: Ambil riwayat prediksi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Riwayat prediksi
 */

function predictRisk(inputData) {
  const predictScript = path.join(__dirname, '../../../ml/predict.py');
  const input = JSON.stringify(inputData);
  const result = execSync(`python "${predictScript}"`, {
    input,
    cwd: path.join(__dirname, '../../../'),
    timeout: 30000
  });
  return JSON.parse(result.toString());
}

router.post('/', authenticate, async (req, res) => {
  try {
    const student = req.body;
    const inputData = {
      Bullied_not_on_school_property_in_past_12_months: student.bullied_not_on_school_property || 'No',
      Cyber_bullied_in_past_12_months: student.cyber_bullied || 'No',
      Custom_Age: student.age || '15 years old',
      Sex: student.sex || 'Male',
      Physically_attacked: student.physically_attacked || '0 times',
      Physical_fighting: student.physical_fighting || '0 times',
      Felt_lonely: student.felt_lonely || 'Never',
      Close_friends: student.close_friends || '3 or more',
      Miss_school_no_permission: student.miss_school_no_permission || '0 days',
      Other_students_kind_and_helpful: student.other_students_kind || 'Sometimes',
      Parents_understand_problems: student.parents_understand_problems || 'Sometimes',
      Most_of_the_time_or_always_felt_lonely: student.most_of_the_time_felt_lonely || 'No',
      Missed_classes_or_school_without_permission: student.missed_classes_without_permission || 'No',
      Were_underweight: student.were_underweight || 'No',
      Were_overweight: student.were_overweight || 'No',
      Were_obese: student.were_obese || 'No'
    };

    const prediction = predictRisk(inputData);

    const id = uuidv4();
    await pool.query(
      'INSERT INTO predictions (id, school_id, prediction, risk_score, risk_level, input_data) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.school.id, prediction.prediction, prediction.risk_score, prediction.risk_level, JSON.stringify(inputData)]
    );

    res.json({ id, ...prediction });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ message: 'Prediksi gagal', error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM predictions WHERE school_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.school.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
