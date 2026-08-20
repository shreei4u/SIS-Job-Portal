-- ========================================================================
-- Shield Job Portal Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+ on cPanel / Apache
-- ========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------
-- 1. Table: users
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'jobseeker', 'employer', 'freelancer', 'trainer', 'manpower', 'contractor') NOT NULL,
  `subscription` VARCHAR(50) DEFAULT 'Free',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_role (`role`),
  INDEX idx_user_email (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 2. Table: profiles (Job Seeker / Freelancer / Trainer extended info)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(191) DEFAULT NULL,
  `exp` VARCHAR(100) DEFAULT NULL,
  `salary` VARCHAR(100) DEFAULT NULL,
  `cur_salary` VARCHAR(100) DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `about` TEXT DEFAULT NULL,
  `whatsapp` VARCHAR(30) DEFAULT NULL,
  `cur_location` VARCHAR(150) DEFAULT NULL,
  `des_location` VARCHAR(150) DEFAULT NULL,
  `marital` VARCHAR(30) DEFAULT NULL,
  `linkedin` VARCHAR(255) DEFAULT NULL,
  `portfolio` VARCHAR(255) DEFAULT NULL,
  `qualification` VARCHAR(191) DEFAULT NULL,
  `projects_done` VARCHAR(191) DEFAULT NULL,
  `company` VARCHAR(191) DEFAULT NULL,
  `notice` VARCHAR(100) DEFAULT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `project_link` VARCHAR(255) DEFAULT NULL,
  `ref1` VARCHAR(255) DEFAULT NULL,
  `ref2` VARCHAR(255) DEFAULT NULL,
  `resume_name` VARCHAR(255) DEFAULT NULL,
  `resume_path` VARCHAR(255) DEFAULT NULL,
  `ats_boost` TINYINT(1) DEFAULT 0,
  `review_status` ENUM('Pending', 'Published', 'Rejected') DEFAULT 'Pending',
  `saved` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 3. Table: jobs (Employer job postings)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `posted_by_user_id` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `emp_type` VARCHAR(50) NOT NULL,
  `company` VARCHAR(191) NOT NULL,
  `department` VARCHAR(150) DEFAULT NULL,
  `location` VARCHAR(150) NOT NULL,
  `compensation` VARCHAR(150) DEFAULT NULL,
  `summary` TEXT DEFAULT NULL,
  `responsibilities` TEXT DEFAULT NULL,
  `requirements` TEXT DEFAULT NULL,
  `app_instructions` VARCHAR(100) DEFAULT 'Updated CV',
  `status_update_via` VARCHAR(50) DEFAULT 'Call',
  `close_within` VARCHAR(50) DEFAULT '15 Days',
  `interview_mode` VARCHAR(50) DEFAULT 'Face to Face',
  `notice` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `bg_checks` TEXT DEFAULT NULL,
  `hiring_assist` VARCHAR(50) DEFAULT 'normal',
  `category` VARCHAR(100) DEFAULT 'Other',
  `status` ENUM('Pending', 'Published', 'Rejected') DEFAULT 'Published',
  `open_status` ENUM('Open', 'Closed') DEFAULT 'Open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`posted_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX idx_job_status (`status`, `open_status`),
  INDEX idx_job_category (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 4. Table: applications (Job Seeker job applications & ATS stages)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `stage` INT DEFAULT 0, -- 0: Applied, 1: Screening, 2: Interview, 3: Verification, 4: Offer, 5: Hired
  `status` ENUM('Pending', 'Shortlisted', 'Screening', 'Interview', 'Verification', 'Offer', 'Hired', 'Rejected') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_job (`user_id`, `job_id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 5. Table: offerings (Freelancer services)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `offerings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery` VARCHAR(100) NOT NULL,
  `desc` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT 'Other',
  `status` ENUM('Pending', 'Published', 'Rejected') DEFAULT 'Published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 6. Table: courses (Trainer courses)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `duration` VARCHAR(100) NOT NULL,
  `desc` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT 'Other',
  `status` ENUM('Pending', 'Published', 'Rejected') DEFAULT 'Published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 7. Table: workforce_pool (Manpower Provider workforce)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workforce_pool` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role_type` VARCHAR(150) NOT NULL,
  `skill_level` ENUM('Skilled', 'Semi-Skilled', 'Unskilled') DEFAULT 'Skilled',
  `experience` VARCHAR(100) DEFAULT NULL,
  `count` INT NOT NULL DEFAULT 1,
  `available` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 8. Table: deployment_requests (Manpower requests)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deployment_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider_user_id` INT NOT NULL,
  `requested_by_user_id` INT DEFAULT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `roles_needed` VARCHAR(255) DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `duration` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('New', 'In Progress', 'Fulfilled', 'Cancelled') DEFAULT 'New',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`provider_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 9. Table: service_locations (Manpower operating cities)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `location` VARCHAR(191) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 10. Table: contractor_projects (Project Contractor projects)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contractor_projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contractor_user_id` INT NOT NULL,
  `requested_by_user_id` INT DEFAULT NULL,
  `name` VARCHAR(191) NOT NULL,
  `client` VARCHAR(150) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `contact_name` VARCHAR(150) DEFAULT NULL,
  `contact_number` VARCHAR(50) DEFAULT NULL,
  `value` DECIMAL(12,2) DEFAULT 0.00,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `contract_period` VARCHAR(100) DEFAULT NULL,
  `manpower_required` INT DEFAULT 0,
  `manpower_roles` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('Ongoing', 'Completed', 'On Hold') DEFAULT 'Ongoing',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contractor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 11. Table: project_bids (Bids received for contractor projects)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_bids` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contractor_user_id` INT NOT NULL,
  `project_id` INT DEFAULT NULL,
  `bidder_name` VARCHAR(150) NOT NULL,
  `project_name` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `contact` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('New', 'Accepted', 'Rejected') DEFAULT 'New',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contractor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 12. Table: hire_requests (Employer hire requests for Freelancers/Trainers)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hire_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employer_user_id` INT NOT NULL,
  `target_user_id` INT NOT NULL,
  `target_role` ENUM('freelancer', 'trainer') NOT NULL,
  `offering_title` VARCHAR(191) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('Pending', 'Accepted', 'Declined') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`employer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 13. Table: crm_leads & notes
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `crm_leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `status` ENUM('New', 'Contacted', 'Converted', 'Lost') DEFAULT 'New',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 14. Table: activity_logs
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 15. Table: site_settings & pricing
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(64) PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Initial Seed Data
-- ------------------------------------------------------------------------

-- Default Admin Account (Password: Shree#2425@22267)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `subscription`) VALUES
(1, 'Shreekant', 'shreekant@shieldinfrasolutions.in', '+91 9876543210', '$2y$10$eU5Y6zFm2Yx1xKkH7yq8AeW/iYq2oK4zU8d6k3x1f5y8h1m2j9w0e', 'admin', 'Premium')
ON DUPLICATE KEY UPDATE `email`=`email`;

-- Default Site Settings
INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES
('hero_eyebrow', '● JOB SEEKERS &nbsp;·&nbsp; EMPLOYERS &nbsp;·&nbsp; FREELANCERS &nbsp;·&nbsp; TRAINERS &nbsp;·&nbsp; MANPOWER &nbsp;·&nbsp; CONTRACTORS'),
('hero_title', 'One Platform. Every Career Path. End to End Excellence.'),
('hero_lead', 'Shield Job Portal is where ambition meets opportunity. Whether you''re hunting for your dream job, building a freelance career, hiring top talent, training the next workforce, deploying manpower, or executing large-scale contractual projects — we deliver a seamless, powerful and trusted experience from the first click to the final offer letter.'),
('moto', '\"OUR MOTTO — EMPOWERING PEOPLE. ENABLING ENTERPRISES. END TO END.\"'),
('footer_text', '<b>Shield Job Portal</b> — a service of Shield Infra Solutions · Empowering Careers. Enabling Enterprises. End to End.'),
('logo_url', ''),
('banner_url', ''),
('social_facebook', ''),
('social_twitter', ''),
('social_linkedin', ''),
('social_instagram', ''),
('social_youtube', ''),
('contact_email', 'contact@shieldinfrasolutions.in'),
('contact_phone', '+91 9876543210'),
('contact_address', 'Shield Infra Solutions, Corporate Plaza, India'),
('price_ats_boost', '299'),
('price_employer_normal', '999'),
('price_employer_assist', '4999'),
('price_premium_sub', '499')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

SET FOREIGN_KEY_CHECKS = 1;
