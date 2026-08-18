-- ============================================================
-- SHIELD JOB PORTAL — DATABASE SCHEMA
-- Target: PostgreSQL 14+ (adjust types if using MySQL/SQL Server)
-- Mirrors every in-memory data structure used in the front-end
-- prototype, normalized into relational tables.
-- ============================================================

-- ------------------------------------------------------------
-- 1. USERS  (core account table for every role, incl. admin)
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    email           VARCHAR(180)  NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255)  NOT NULL,          -- store hashed, never plain text
    role            VARCHAR(20)   NOT NULL CHECK (role IN
                        ('admin','jobseeker','employer','freelancer',
                         'trainer','manpower','contractor')),
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. JOB SEEKER PROFILES  (one-to-one with users, role=jobseeker)
-- ------------------------------------------------------------
CREATE TABLE job_seeker_profiles (
    profile_id          SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    desired_title        VARCHAR(150),
    total_experience      VARCHAR(50),
    qualification         VARCHAR(150),
    projects_done         VARCHAR(100),
    current_company       VARCHAR(150),
    current_location      VARCHAR(150),
    desired_location       VARCHAR(150),
    current_salary        VARCHAR(60),
    expected_salary        VARCHAR(60),
    notice_period          VARCHAR(60),
    reason_for_change       TEXT,
    key_skills            TEXT,
    about_summary          TEXT,
    whatsapp_number        VARCHAR(20),
    linkedin_url           VARCHAR(255),
    project_link           VARCHAR(255),
    reference_1            VARCHAR(255),
    reference_2            VARCHAR(255),
    marital_status          VARCHAR(20) CHECK (marital_status IN ('Married','Not Married')),
    resume_file_name        VARCHAR(255),
    resume_file_url        VARCHAR(500),              -- actual storage path/URL in real backend
    ats_boost_active        BOOLEAN NOT NULL DEFAULT false,   -- ₹299 (or current pricing) paid
    ats_paid_at             TIMESTAMP,
    review_status           VARCHAR(20) NOT NULL DEFAULT 'Pending'
                                CHECK (review_status IN ('Pending','Published','Rejected')),
    updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. EMPLOYER JOB POSTINGS
-- ------------------------------------------------------------
CREATE TABLE job_postings (
    job_id              SERIAL PRIMARY KEY,
    employer_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL,
    company_name        VARCHAR(150) NOT NULL,
    department          VARCHAR(100),
    location            VARCHAR(150) NOT NULL,
    employment_type     VARCHAR(20) NOT NULL CHECK (employment_type IN
                            ('Full-time','Part-time','Contract','Temporary')),
    compensation         VARCHAR(120),
    summary              TEXT,
    responsibilities     TEXT,                        -- one item per line
    requirements         TEXT,
    application_instructions VARCHAR(60) DEFAULT 'Updated CV',
    status_update_via    VARCHAR(20) CHECK (status_update_via IN ('Call','WhatsApp')),
    close_within         VARCHAR(20) CHECK (close_within IN
                            ('7 Days','15 Days','21 Days','30 Days','45 Days')),
    interview_mode       VARCHAR(20) CHECK (interview_mode IN ('Face to Face','Online')),
    notice_period        VARCHAR(60),
    special_notes        TEXT,
    hiring_assistance    VARCHAR(20) NOT NULL DEFAULT 'normal'
                            CHECK (hiring_assistance IN ('normal','custom')),
    category             VARCHAR(50),                 -- e.g. IT & Software, Sales & Marketing
    open_status          VARCHAR(10) NOT NULL DEFAULT 'Open' CHECK (open_status IN ('Open','Closed')),
    review_status        VARCHAR(20) NOT NULL DEFAULT 'Pending'
                            CHECK (review_status IN ('Pending','Published','Rejected')),
    posted_at            TIMESTAMP NOT NULL DEFAULT now(),
    closed_at            TIMESTAMP
);

CREATE TABLE job_posting_background_checks (
    id            SERIAL PRIMARY KEY,
    job_id        INTEGER NOT NULL REFERENCES job_postings(job_id) ON DELETE CASCADE,
    check_type    VARCHAR(30) NOT NULL CHECK (check_type IN
                        ('Experience','Residential','Reference','Educational','Police'))
);

-- ------------------------------------------------------------
-- 4. JOB APPLICATIONS  (job seeker applies to a job posting)
-- ------------------------------------------------------------
CREATE TABLE job_applications (
    application_id   SERIAL PRIMARY KEY,
    job_id           INTEGER NOT NULL REFERENCES job_postings(job_id) ON DELETE CASCADE,
    jobseeker_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status           VARCHAR(20) NOT NULL DEFAULT 'Pending'
                        CHECK (status IN ('Pending','Shortlisted','Screening','Interview',
                                           'Offer','Hired','Rejected')),
    applied_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (job_id, jobseeker_id)                     -- one application per job per candidate
);

-- ------------------------------------------------------------
-- 5. ATS PIPELINE  (shortlisted candidates being tracked)
-- ------------------------------------------------------------
CREATE TABLE ats_pipeline (
    pipeline_id      SERIAL PRIMARY KEY,
    application_id   INTEGER REFERENCES job_applications(application_id) ON DELETE CASCADE,
    candidate_name   VARCHAR(150) NOT NULL,            -- denormalized for admin-added candidates
    role_title       VARCHAR(150),
    stage            VARCHAR(20) NOT NULL DEFAULT 'Applied'
                        CHECK (stage IN ('Applied','Screening','Interview','Offer','Hired')),
    added_at         TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. FREELANCER SERVICE OFFERINGS
-- ------------------------------------------------------------
CREATE TABLE freelancer_offerings (
    offering_id     SERIAL PRIMARY KEY,
    freelancer_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    delivery_time   VARCHAR(60),
    category        VARCHAR(50),                      -- e.g. Design & Creative
    review_status   VARCHAR(20) NOT NULL DEFAULT 'Pending'
                        CHECK (review_status IN ('Pending','Published','Rejected')),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Freelancer profile extension fields live alongside users, kept in a
-- lightweight profile table so freelancer-only attributes don't pollute `users`.
CREATE TABLE freelancer_profiles (
    profile_id      SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    professional_title VARCHAR(150),
    experience      VARCHAR(50),
    portfolio_url   VARCHAR(255),
    skills          TEXT,
    about_bio       TEXT,
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 7. TRAINER COURSES
-- ------------------------------------------------------------
CREATE TABLE trainer_courses (
    course_id       SERIAL PRIMARY KEY,
    trainer_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    fee             DECIMAL(10,2) NOT NULL,
    duration        VARCHAR(60),
    category        VARCHAR(50),                      -- e.g. Technical Skills, Soft Skills
    review_status   VARCHAR(20) NOT NULL DEFAULT 'Pending'
                        CHECK (review_status IN ('Pending','Published','Rejected')),
    added_by_admin  BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. MANPOWER PROVIDER TABLES
-- ------------------------------------------------------------
CREATE TABLE manpower_workforce_pool (
    pool_id         SERIAL PRIMARY KEY,
    provider_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_type       VARCHAR(100) NOT NULL,             -- e.g. Electrician
    skill_level     VARCHAR(20) CHECK (skill_level IN ('Skilled','Semi-Skilled','Unskilled')),
    experience      VARCHAR(50),
    worker_count    INTEGER NOT NULL DEFAULT 1,
    is_available    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE manpower_deployment_requests (
    request_id      SERIAL PRIMARY KEY,
    provider_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    client_name     VARCHAR(150) NOT NULL,
    location        VARCHAR(150) NOT NULL,
    roles_needed    VARCHAR(255),
    quantity        INTEGER NOT NULL,
    duration        VARCHAR(60),
    status          VARCHAR(20) NOT NULL DEFAULT 'New'
                        CHECK (status IN ('New','In Progress','Fulfilled','Cancelled')),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE manpower_service_locations (
    location_id     SERIAL PRIMARY KEY,
    provider_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    location_name   VARCHAR(150) NOT NULL              -- e.g. "Patna, Bihar"
);

-- Admin-curated compliance/contract details for manpower & contractor roles
CREATE TABLE manpower_contract_details (
    detail_id       SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    location_address TEXT,
    contact_name     VARCHAR(150),
    contact_number   VARCHAR(20),
    contract_period  VARCHAR(100),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE manpower_contract_roles (           -- multi-select roles, one row per role
    id              SERIAL PRIMARY KEY,
    detail_id       INTEGER NOT NULL REFERENCES manpower_contract_details(detail_id) ON DELETE CASCADE,
    role_name       VARCHAR(50) NOT NULL CHECK (role_name IN
                        ('Skilled Labour','Unskilled Labour','Security Guard',
                         'Housekeeping Staff','Driver','Technician','Supervisor','Other'))
);

-- ------------------------------------------------------------
-- 9. PROJECT CONTRACTOR TABLES
-- ------------------------------------------------------------
CREATE TABLE contractor_projects (
    project_id       SERIAL PRIMARY KEY,
    contractor_id    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    project_name     VARCHAR(150) NOT NULL,
    client_name      VARCHAR(150) NOT NULL,
    location_address TEXT,
    contact_name     VARCHAR(150),
    contact_number   VARCHAR(20),
    contract_value   DECIMAL(14,2),
    start_date       DATE,
    end_date         DATE,
    contract_period  VARCHAR(100),
    manpower_required INTEGER,
    description      TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'Ongoing'
                        CHECK (status IN ('Ongoing','Completed','On Hold')),
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE contractor_project_manpower_roles (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER NOT NULL REFERENCES contractor_projects(project_id) ON DELETE CASCADE,
    role_name       VARCHAR(50) NOT NULL
);

CREATE TABLE contractor_received_bids (
    bid_id          SERIAL PRIMARY KEY,
    contractor_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    project_id      INTEGER REFERENCES contractor_projects(project_id) ON DELETE SET NULL,
    bidder_name     VARCHAR(150) NOT NULL,
    bid_amount      DECIMAL(14,2) NOT NULL,
    contact_info    VARCHAR(150),
    status          VARCHAR(20) NOT NULL DEFAULT 'New'
                        CHECK (status IN ('New','Accepted','Rejected')),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 10. SUBSCRIPTIONS & PRICING
-- ------------------------------------------------------------
CREATE TABLE subscriptions (
    subscription_id  SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    plan             VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (plan IN ('Free','Premium')),
    activated_at     TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- Single-row (or versioned) table holding admin-configurable platform prices
CREATE TABLE pricing_settings (
    setting_id                  SERIAL PRIMARY KEY,
    ats_boost_price              DECIMAL(10,2) NOT NULL DEFAULT 299,
    employer_normal_posting_price DECIMAL(10,2) NOT NULL DEFAULT 999,
    hiring_assistant_starting_price DECIMAL(10,2) NOT NULL DEFAULT 4999,
    premium_subscription_price    DECIMAL(10,2) NOT NULL DEFAULT 499,
    updated_at                   TIMESTAMP NOT NULL DEFAULT now(),
    updated_by                   INTEGER REFERENCES users(user_id)
);

-- ------------------------------------------------------------
-- 11. CRM MODULE
-- ------------------------------------------------------------
CREATE TABLE crm_lead_status (
    user_id         INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'New'
                        CHECK (status IN ('New','Contacted','Converted','Lost')),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_by      INTEGER REFERENCES users(user_id)      -- admin who set it
);

CREATE TABLE crm_notes (
    note_id         SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    note_text       TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    created_by      INTEGER REFERENCES users(user_id)      -- admin who wrote it
);

CREATE TABLE activity_log (
    activity_id     SERIAL PRIMARY KEY,
    description     TEXT NOT NULL,
    related_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- INDEXES (common lookups)
-- ------------------------------------------------------------
CREATE INDEX idx_users_role                  ON users(role);
CREATE INDEX idx_job_postings_employer        ON job_postings(employer_id);
CREATE INDEX idx_job_postings_status          ON job_postings(review_status, open_status);
CREATE INDEX idx_job_applications_job          ON job_applications(job_id);
CREATE INDEX idx_job_applications_jobseeker    ON job_applications(jobseeker_id);
CREATE INDEX idx_freelancer_offerings_freelancer ON freelancer_offerings(freelancer_id);
CREATE INDEX idx_trainer_courses_trainer       ON trainer_courses(trainer_id);
CREATE INDEX idx_contractor_projects_contractor ON contractor_projects(contractor_id);
CREATE INDEX idx_activity_log_created_at       ON activity_log(created_at DESC);

-- ============================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================
-- 1. Passwords: the front-end prototype stores plain text passwords in
--    memory for demo purposes only. A real backend must hash them
--    (bcrypt/argon2) before writing to `password_hash`.
-- 2. Resumes: the prototype keeps the uploaded File object in browser
--    memory for the session. A real backend needs actual file storage
--    (S3, GCS, or local disk) and should store only the resulting URL
--    in `resume_file_url`.
-- 3. Role-specific "offerings"/"courses"/"projects" arrays keyed by
--    email in the JS prototype map directly to the child tables above,
--    each referencing users(user_id) as the owner.
-- 4. `ats_pipeline.application_id` is nullable to allow admin-added
--    candidates that don't originate from a real job application.
-- 5. Multi-select fields (background checks, manpower roles) are
--    normalized into their own junction tables rather than stored as
--    arrays, for clean querying — switch to a JSONB/array column if
--    you prefer denormalized storage.
