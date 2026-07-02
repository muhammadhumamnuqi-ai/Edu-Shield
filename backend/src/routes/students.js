const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const { execSync } = require('child_process');
const path = require('path');

function predictRisk(studentData) {
  try {
    const predictScript = path.join(__dirname, '../../../ml/predict.py');
    const input = JSON.stringify(studentData);
    const result = execSync(`python "${predictScript}"`, {
      input,
      cwd: path.join(__dirname, '../../../'),
      timeout: 30000
    });
    return JSON.parse(result.toString());
  } catch (err) {
    console.error('Prediction error:', err.message);
    return null;
  }
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, risk_level } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT * FROM students WHERE school_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM students WHERE school_id = ?';
    const params = [req.school.id];

    if (search) {
      query += ' AND (name LIKE ? OR record_id LIKE ?)';
      countQuery += ' AND (name LIKE ? OR record_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (risk_level) {
      query += ' AND risk_level = ?';
      countQuery += ' AND risk_level = ?';
      params.push(risk_level);
    }

    const countParams = [...params];
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      students: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const id = uuidv4();
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

    await pool.query(
      `INSERT INTO students (id, school_id, record_id, name, grade, sex, age, physically_attacked,
        physical_fighting, felt_lonely, close_friends, miss_school_no_permission, other_students_kind,
        parents_understand_problems, most_of_the_time_felt_lonely, missed_classes_without_permission,
        were_underweight, were_overweight, were_obese, bullied_not_on_school_property, cyber_bullied,
        risk_score, risk_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.school.id, student.record_id || null, student.name || null, student.grade || null,
       student.sex || null, student.age || null, student.physically_attacked || null,
       student.physical_fighting || null, student.felt_lonely || null, student.close_friends || null,
       student.miss_school_no_permission || null, student.other_students_kind || null,
       student.parents_understand_problems || null, student.most_of_the_time_felt_lonely || null,
       student.missed_classes_without_permission || null, student.were_underweight || null,
       student.were_overweight || null, student.were_obese || null,
       student.bullied_not_on_school_property || null, student.cyber_bullied || null,
       prediction?.risk_score || null, prediction?.risk_level || 'Unknown']
    );

    if (prediction) {
      const predId = uuidv4();
      await pool.query(
        'INSERT INTO predictions (id, school_id, student_id, prediction, risk_score, risk_level, input_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [predId, req.school.id, id, prediction.prediction, prediction.risk_score, prediction.risk_level, JSON.stringify(inputData)]
      );
    }

    res.status(201).json({
      message: 'Student added',
      student: { id, ...student, risk_score: prediction?.risk_score, risk_level: prediction?.risk_level },
      prediction
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Ambil detail siswa by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Data siswa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Siswa tidak ditemukan
 *   put:
 *     tags: [Students]
 *     summary: Update data siswa
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
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Siswa diperbarui
 *   delete:
 *     tags: [Students]
 *     summary: Hapus siswa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Siswa dihapus
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, req.school.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const student = req.body;
    await pool.query(
      `UPDATE students SET name = ?, grade = ?, sex = ?, age = ?,
        physically_attacked = ?, physical_fighting = ?, felt_lonely = ?, close_friends = ?,
        miss_school_no_permission = ?, other_students_kind = ?, parents_understand_problems = ?,
        most_of_the_time_felt_lonely = ?, missed_classes_without_permission = ?,
        were_underweight = ?, were_overweight = ?, were_obese = ?,
        bullied_not_on_school_property = ?, cyber_bullied = ?
      WHERE id = ? AND school_id = ?`,
      [student.name, student.grade, student.sex, student.age,
       student.physically_attacked, student.physical_fighting, student.felt_lonely, student.close_friends,
       student.miss_school_no_permission, student.other_students_kind, student.parents_understand_problems,
       student.most_of_the_time_felt_lonely, student.missed_classes_without_permission,
       student.were_underweight, student.were_overweight, student.were_obese,
       student.bullied_not_on_school_property, student.cyber_bullied,
       req.params.id, req.school.id]
    );
    res.json({ message: 'Siswa diperbarui' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = ? AND school_id = ?', [req.params.id, req.school.id]);
    res.json({ message: 'Siswa dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
