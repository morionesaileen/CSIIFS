-- DATABASE DESIGN FOR STUDENT INFORMATION SYSTEM --
-- This schema represents a robust, normalized (3NF) relational database 
-- supporting both Admin management and detailed Student registration.

-- Note: Features such as automatic age calculation, dynamic name formatting,
-- and conditional requirements are designed safely around the querying layer
-- as specified.

-- ==========================================
-- 1. AUTHENTICATION & ACCESS 
-- ==========================================

-- Table: users (Shared Authentication Layer)
-- Maps either student accounts or admin accounts through `role`.
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('super_admin', 'admin', 'student')) NOT NULL,
    linked_id INT, -- Points to either `admin_id` or `student_id`
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: admins
-- Specialized profile data for administrators.
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. DYNAMIC TAXONOMIES & CATEGORIES
-- ==========================================

-- Table: indigenous_groups
-- Standardized selection of indigenous communities
CREATE TABLE indigenous_groups (
    indigenous_group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL
);

-- Default Groups Seed
INSERT INTO indigenous_groups (group_name) VALUES 
('None'), ('Igorot'), ('Mangyan'), ('Badjao'), 
('Ati'), ('Lumad'), ('Aeta');

-- ==========================================
-- 3. CORE STUDENT IDENTITIES
-- ==========================================

-- Table: students
-- Central repository for identity and academic state.
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE, -- Optional mapping if shared login exists.
    student_number VARCHAR(50) UNIQUE NOT NULL,
    
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100), -- Nullable/optional per requirement
    last_name VARCHAR(100) NOT NULL,
    
    sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')) NOT NULL,
    birth_date DATE NOT NULL,
    citizenship VARCHAR(50) NOT NULL,
    
    enrollment_status VARCHAR(20) CHECK (enrollment_status IN ('Regular', 'Irregular')) NOT NULL,
    
    indigenous_group_id INT REFERENCES indigenous_groups(indigenous_group_id),
    indigenous_other VARCHAR(100), -- Nullable: Utilized if 'Others' is requested.
    
    has_disability BOOLEAN NOT NULL DEFAULT FALSE,
    disability_type VARCHAR(150), -- Nullable
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. STRUCTURED ADDRESSES
-- ==========================================

-- Table: addresses
-- Highly structured geospatial tracking.
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    address_type VARCHAR(10) CHECK (address_type IN ('current', 'permanent')) NOT NULL,
    
    street VARCHAR(255),
    barangay VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    zip_code VARCHAR(15)
);

-- ==========================================
-- FUNCTIONAL QUERY EXAMPLES 
-- ==========================================

-- ---------------------------------------------------------
-- Query A: Insert a New Student Record
-- ---------------------------------------------------------
-- Note: Assuming Indigenous Group ID '1' is 'None'
INSERT INTO students (
    student_number, first_name, middle_name, last_name, sex, birth_date, 
    citizenship, enrollment_status, indigenous_group_id, has_disability, disability_type
) VALUES (
    '2021-12345', 'Juan', 'Martinez', 'Dela Cruz', 'Male', '2001-08-15',
    'Filipino', 'Regular', 1, TRUE, 'Visual Impairment'
);

-- Note: Corresponding Address Insert (Assuming generated student_id = 1)
INSERT INTO addresses (student_id, address_type, street, barangay, city, province, zip_code)
VALUES 
(1, 'current', 'Blk 4 Lot 12', 'San Juan', 'Daraga', 'Albay', '4501'),
(1, 'permanent', 'Blk 4 Lot 12', 'San Juan', 'Daraga', 'Albay', '4501');


-- ---------------------------------------------------------
-- Query B: Update Student Info 
-- ---------------------------------------------------------
UPDATE students 
SET 
   enrollment_status = 'Irregular',
   updated_at = CURRENT_TIMESTAMP
WHERE student_number = '2021-12345';


-- ---------------------------------------------------------
-- Query C: Fetch Full Profile (With Names Formatted & Age Derived)
-- ---------------------------------------------------------
SELECT 
    s.student_number,
    -- Query Formatting: LASTNAME, Firstname Middlename
    -- Trims safely if middle_name is NULL
    TRIM(CONCAT(UPPER(s.last_name), ', ', s.first_name, ' ', COALESCE(s.middle_name, ''))) AS full_name_formatted,
    s.sex,
    s.birth_date,
    -- Query Derivation: Dynamic Age Calculation
    DATE_PART('year', AGE(CURRENT_DATE, s.birth_date)) AS dynamic_age,
    s.citizenship,
    s.enrollment_status,
    COALESCE(i.group_name, s.indigenous_other) AS applied_indigenous_group,
    s.has_disability,
    s.disability_type,
    
    -- Addressing
    curr.province AS current_province,
    curr.city AS current_city,
    curr.zip_code AS current_zip
FROM students s
LEFT JOIN indigenous_groups i ON s.indigenous_group_id = i.indigenous_group_id
LEFT JOIN addresses curr ON s.student_id = curr.student_id AND curr.address_type = 'current'
WHERE s.student_number = '2021-12345';


-- ---------------------------------------------------------
-- Query D: Filter Students (e.g., Target Specific Demographics)
-- ---------------------------------------------------------
-- Looking for "Regular" students without disabilities who are Igorot.
SELECT 
    s.student_number,
    s.last_name, 
    s.first_name,
    DATE_PART('year', AGE(CURRENT_DATE, s.birth_date)) AS age
FROM students s
JOIN indigenous_groups i ON s.indigenous_group_id = i.indigenous_group_id
WHERE s.enrollment_status = 'Regular'
  AND s.has_disability = FALSE
  AND i.group_name = 'Igorot'
ORDER BY s.last_name ASC;
