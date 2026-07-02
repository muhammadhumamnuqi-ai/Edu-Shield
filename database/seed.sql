-- EduShield Demo Seed Data
-- IMPORTANT: First register your school via the app, then find your school_id:
--   SELECT id FROM schools LIMIT 1;
-- Replace 'YOUR_SCHOOL_UUID_HERE' below with the actual UUID.

SET @school_id = 'YOUR_SCHOOL_UUID_HERE';

-- Only proceed if school_id has been updated
SELECT IF(@school_id = 'YOUR_SCHOOL_UUID_HERE', 'WARNING: Replace YOUR_SCHOOL_UUID_HERE with actual school UUID first!', 'OK') AS status;

INSERT INTO students (id, school_id, name, grade, sex, age, physically_attacked, physical_fighting, felt_lonely, close_friends, miss_school_no_permission, other_students_kind, parents_understand_problems, most_of_the_time_felt_lonely, missed_classes_without_permission, cyber_bullied, bullied_not_on_school_property, were_underweight, were_overweight, were_obese, risk_score, risk_level)
VALUES
-- High risk students
(UUID(), @school_id, 'Andi Pratama', '10', 'Male', '15 years old', '6 or 7 times', '4 or 5 times', 'Most of the time', '0', '3 or more days', 'Never', 'Never', 'Yes', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 0.87, 'High'),
(UUID(), @school_id, 'Siti Rahmawati', '11', 'Female', '16 years old', '2 or 3 times', '1 time', 'Always', '1', '1 or 2 days', 'Rarely', 'Rarely', 'Yes', 'No', 'Yes', 'No', 'No', 'Yes', 'No', 0.72, 'High'),
(UUID(), @school_id, 'Budi Santoso', '10', 'Male', '14 years old', '4 or 5 times', '2 or 3 times', 'Sometimes', '0', '3 or more days', 'Never', 'Never', 'Yes', 'Yes', 'No', 'Yes', 'No', 'No', 'No', 0.81, 'High'),
-- Medium risk students
(UUID(), @school_id, 'Dewi Lestari', '12', 'Female', '17 years old', '1 time', '0 times', 'Sometimes', '2', '1 or 2 days', 'Sometimes', 'Sometimes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.35, 'Medium'),
(UUID(), @school_id, 'Rudi Hermawan', '11', 'Male', '15 years old', '2 or 3 times', '1 time', 'Rarely', '1', '0 days', 'Sometimes', 'Sometimes', 'No', 'Yes', 'No', 'No', 'No', 'No', 'No', 0.42, 'Medium'),
(UUID(), @school_id, 'Ana Susanti', '10', 'Female', '14 years old', '1 time', '0 times', 'Sometimes', '2', '0 days', 'Most of the time', 'Sometimes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.28, 'Medium'),
-- Low risk students
(UUID(), @school_id, 'Fajar Nugroho', '12', 'Male', '16 years old', '0 times', '0 times', 'Never', '3 or more', '0 days', 'Most of the time', 'Most of the time', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.05, 'Low'),
(UUID(), @school_id, 'Rina Marlina', '11', 'Female', '15 years old', '0 times', '0 times', 'Never', '3 or more', '0 days', 'Always', 'Always', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.02, 'Low'),
(UUID(), @school_id, 'Dian Permata', '10', 'Female', '13 years old', '0 times', '0 times', 'Rarely', '3 or more', '0 days', 'Always', 'Most of the time', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.08, 'Low'),
(UUID(), @school_id, 'Agus Wijaya', '12', 'Male', '17 years old', '0 times', '0 times', 'Never', '3 or more', '0 days', 'Sometimes', 'Most of the time', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 0.03, 'Low');
