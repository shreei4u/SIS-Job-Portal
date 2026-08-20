<?php
/**
 * Shield Job Portal - Applications & ATS API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'my_applications';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. Job Seeker Apply to Job
// ------------------------------------------------------------------------
if ($action === 'apply') {
    $user = requireRole('jobseeker');
    $userId = $user['id'];
    $jobId = intval($body['job_id'] ?? 0);

    if (!$jobId) {
        jsonError('Invalid job specified.');
    }

    // Verify job exists and is open
    $stmt = $db->prepare("SELECT * FROM jobs WHERE id = ? AND status = 'Published' AND open_status = 'Open'");
    $stmt->execute([$jobId]);
    $job = $stmt->fetch();

    if (!$job) {
        jsonError('Job is no longer accepting applications.', 404);
    }

    // Check if already applied
    $stmt = $db->prepare("SELECT id FROM applications WHERE user_id = ? AND job_id = ?");
    $stmt->execute([$userId, $jobId]);
    if ($stmt->fetch()) {
        jsonError('You have already applied to this job.');
    }

    $stmt = $db->prepare("INSERT INTO applications (job_id, user_id, stage, status) VALUES (?, ?, 0, 'Pending')");
    $stmt->execute([$jobId, $userId]);

    logActivityDB("<b>{$user['name']}</b> applied for <b>{$job['title']}</b> at {$job['company']}");

    jsonSuccess([], 'Application submitted successfully! Your profile is under review.');
}

// ------------------------------------------------------------------------
// 2. Job Seeker: List My Applications
// ------------------------------------------------------------------------
if ($action === 'my_applications') {
    $user = requireRole('jobseeker');
    $userId = $user['id'];

    $sql = "SELECT a.*, j.title as job_title, j.company, j.location, j.compensation, j.emp_type
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);
    $apps = $stmt->fetchAll();

    jsonSuccess(['applications' => $apps]);
}

// ------------------------------------------------------------------------
// 3. Employer: List Received Applications
// ------------------------------------------------------------------------
if ($action === 'employer_applications') {
    $user = requireRole(['employer', 'admin']);
    $userId = $user['id'];

    $sql = "SELECT a.*, u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
                   p.title as profile_title, p.exp, p.qualification, p.company as cur_company,
                   p.cur_location, p.des_location, p.salary as expected_salary, p.cur_salary,
                   p.notice, p.skills, p.about, p.linkedin, p.project_link, p.resume_name, p.resume_path,
                   j.title as job_title, j.company as job_company
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            JOIN jobs j ON a.job_id = j.id";

    $params = [];
    if ($user['role'] !== 'admin') {
        $sql .= " WHERE j.posted_by_user_id = ?";
        $params[] = $userId;
    }
    $sql .= " ORDER BY a.created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $apps = $stmt->fetchAll();

    jsonSuccess(['applications' => $apps]);
}

// ------------------------------------------------------------------------
// 4. Employer: Shortlist Candidate
// ------------------------------------------------------------------------
if ($action === 'shortlist') {
    $user = requireRole(['employer', 'admin']);
    $appId = intval($body['application_id'] ?? 0);

    $stmt = $db->prepare("SELECT a.*, j.title, j.posted_by_user_id, u.name as applicant_name 
                          FROM applications a 
                          JOIN jobs j ON a.job_id = j.id 
                          JOIN users u ON a.user_id = u.id 
                          WHERE a.id = ?");
    $stmt->execute([$appId]);
    $app = $stmt->fetch();

    if (!$app) {
        jsonError('Application not found.', 404);
    }
    if ($user['role'] !== 'admin' && $app['posted_by_user_id'] != $user['id']) {
        jsonError('Unauthorized to update this application.', 403);
    }

    $stmt = $db->prepare("UPDATE applications SET status = 'Shortlisted', stage = 0 WHERE id = ?");
    $stmt->execute([$appId]);

    logActivityDB("<b>{$app['applicant_name']}</b> was shortlisted for <b>{$app['title']}</b>");
    jsonSuccess([], 'Candidate shortlisted and entered the ATS pipeline.');
}

// ------------------------------------------------------------------------
// 5. Employer: Reject Candidate
// ------------------------------------------------------------------------
if ($action === 'reject') {
    $user = requireRole(['employer', 'admin']);
    $appId = intval($body['application_id'] ?? 0);

    $stmt = $db->prepare("SELECT a.*, j.title, j.posted_by_user_id, u.name as applicant_name 
                          FROM applications a 
                          JOIN jobs j ON a.job_id = j.id 
                          JOIN users u ON a.user_id = u.id 
                          WHERE a.id = ?");
    $stmt->execute([$appId]);
    $app = $stmt->fetch();

    if (!$app) {
        jsonError('Application not found.', 404);
    }
    if ($user['role'] !== 'admin' && $app['posted_by_user_id'] != $user['id']) {
        jsonError('Unauthorized to update this application.', 403);
    }

    $stmt = $db->prepare("UPDATE applications SET status = 'Rejected' WHERE id = ?");
    $stmt->execute([$appId]);

    logActivityDB("<b>{$app['applicant_name']}</b> was rejected for <b>{$app['title']}</b>");
    jsonSuccess([], 'Candidate rejected.');
}

// ------------------------------------------------------------------------
// 6. ATS Pipeline: Get Pipeline Grid Data
// ------------------------------------------------------------------------
if ($action === 'ats_pipeline') {
    $user = requireRole(['employer', 'admin']);
    $userId = $user['id'];

    // Jobs to include
    $jobSql = "SELECT * FROM jobs";
    $jobParams = [];
    if ($user['role'] !== 'admin') {
        $jobSql .= " WHERE posted_by_user_id = ?";
        $jobParams[] = $userId;
    } else {
        $jobSql .= " WHERE status = 'Published' AND open_status = 'Open'";
    }
    $jobSql .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($jobSql);
    $stmt->execute($jobParams);
    $jobs = $stmt->fetchAll();

    // Applications in pipeline
    $appSql = "SELECT a.*, u.name as applicant_name, u.email as applicant_email, j.title as job_title, j.company as job_company
               FROM applications a
               JOIN users u ON a.user_id = u.id
               JOIN jobs j ON a.job_id = j.id
               WHERE a.status NOT IN ('Rejected')";

    if ($user['role'] !== 'admin') {
        $appSql .= " AND j.posted_by_user_id = {$userId}";
    }

    $stmt = $db->prepare($appSql);
    $stmt->execute();
    $candidates = $stmt->fetchAll();

    jsonSuccess([
        'jobs' => $jobs,
        'candidates' => $candidates
    ]);
}

// ------------------------------------------------------------------------
// 7. ATS Pipeline: Move Candidate Stages
// ------------------------------------------------------------------------
if ($action === 'move_stage') {
    $user = requireRole(['employer', 'admin']);
    $appIds = $body['application_ids'] ?? [];
    $targetStage = intval($body['stage'] ?? 0);

    $stageNames = ['Applied', 'Screening', 'Interview', 'Verification', 'Offer', 'Hired'];
    $stageLabel = $stageNames[$targetStage] ?? 'Applied';

    if (!is_array($appIds) || empty($appIds)) {
        jsonError('No candidates selected.');
    }

    $placeholders = implode(',', array_fill(0, count($appIds), '?'));
    $stmt = $db->prepare("UPDATE applications SET stage = ?, status = ? WHERE id IN ({$placeholders})");
    $params = array_merge([$targetStage, $stageLabel], $appIds);
    $stmt->execute($params);

    logActivityDB(count($appIds) . " candidate(s) moved to <b>{$stageLabel}</b> stage.");
    jsonSuccess([], count($appIds) . " candidate(s) moved to {$stageLabel}.");
}

jsonError('Invalid action specified.');
