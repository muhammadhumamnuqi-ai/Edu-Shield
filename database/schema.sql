CREATE DATABASE IF NOT EXISTS edushield;
USE edushield;

CREATE TABLE schools (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  record_id VARCHAR(50),
  name VARCHAR(255),
  grade VARCHAR(50),
  sex VARCHAR(20),
  age VARCHAR(50),
  physically_attacked VARCHAR(50),
  physical_fighting VARCHAR(50),
  felt_lonely VARCHAR(50),
  close_friends VARCHAR(50),
  miss_school_no_permission VARCHAR(50),
  other_students_kind VARCHAR(50),
  parents_understand_problems VARCHAR(50),
  most_of_the_time_felt_lonely VARCHAR(50),
  missed_classes_without_permission VARCHAR(50),
  were_underweight VARCHAR(50),
  were_overweight VARCHAR(50),
  were_obese VARCHAR(50),
  bullied_not_on_school_property VARCHAR(50),
  cyber_bullied VARCHAR(50),
  risk_score DECIMAL(5,4),
  risk_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE interventions (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36),
  type VARCHAR(50) DEFAULT 'Konseling',
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'Direncanakan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE predictions (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36),
  prediction VARCHAR(10),
  risk_score DECIMAL(5,4),
  risk_level VARCHAR(20),
  input_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
