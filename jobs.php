<?php
/**
 * Shield Job Portal - Jobs API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'list';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. List Public Published Jobs / Filtered Search
// ------------------------------------------------------------------------
if ($action === 'list' || $action === 'search') {
    $title = trim($_GET['title'] ?? '');
    $location = trim($_GET['location'] ?? '');
    $salary = trim($_GET['salary'] ?? '');
    $skill = trim($_GET['skill'] ?? '');
    $category = trim($_GET['category'] ?? '');

    $sql = "SELECT j.*, u.name as employer_name, u.email as employer_email 
            FROM jobs j 
            JOIN users u ON j.posted_by_user_id = u.id 
            WHERE j.status = 'Published' AND j.open_status = 'Open'";
    $params = [];

    if ($title) {
        $sql .= " AND (j.title LIKE ? OR j.company LIKE ?)";
        $params[] = "%{$title}%";
        $params[] = "%{$title}%";
    }
    if ($location) {
        $sql .= " AND j.location LIKE ?";
        $params[] = "%{$location}%";
    }
    if ($salary) {
        $sql .= " AND j.compensation LIKE ?";
        $params[] = "%{$salary}%";
    }
    if ($skill) {
        $sql .= " AND (j.requirements LIKE ? OR j.summary LIKE ?)";
        $params[] = "%{$skill}%";
        $params[] = "%{$skill}%";
    }
    if ($category) {
        $sql .= " AND j.category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY j.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $jobs = $stmt->fetchAll();

    foreach ($jobs as &$job) {
        $job['bg_checks'] = json_decode($job['bg_checks'] ?? '[]', true) ?: [];
    }

    jsonSuccess(['jobs' => $jobs]);
}

// ------------------------------------------------------------------------
// 2. Employer My Jobs List
// ------------------------------------------------------------------------
if ($action === 'my_jobs') {
    $user = requireRole(['employer', 'admin']);
    $userId = $user['id'];

    $sql = "SELECT * FROM jobs";
    $params = [];
    if ($user['role'] !== 'admin') {
        $sql .= " WHERE posted_by_user_id = ?";
        $params[] = $userId;
    }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $jobs = $stmt->fetchAll();

    foreach ($jobs as &$job) {
        $job['bg_checks'] = json_decode($job['bg_checks'] ?? '[]', true) ?: [];
    }

    jsonSuccess(['jobs' => $jobs]);
}

// ------------------------------------------------------------------------
// 3. Post a New Job
// ------------------------------------------------------------------------
if ($action === 'create') {
    $user = requireRole(['employer', 'admin']);
    $userId = $user['id'];

    $title = trim($body['title'] ?? '');
    $empType = trim($body['emp_type'] ?? 'Full-time');
    $company = trim($body['company'] ?? '');
    $department = trim($body['department'] ?? '');
    $location = trim($body['location'] ?? '');
    $compensation = trim($body['compensation'] ?? '');
    $summary = trim($body['summary'] ?? '');
    $responsibilities = trim($body['responsibilities'] ?? '');
    $requirements = trim($body['requirements'] ?? '');
    $appInstructions = trim($body['app_instructions'] ?? 'Updated CV');
    $statusUpdateVia = trim($body['status_update_via'] ?? 'Call');
    $closeWithin = trim($body['close_within'] ?? '15 Days');
    $interviewMode = trim($body['interview_mode'] ?? 'Face to Face');
    $notice = trim($body['notice'] ?? '');
    $notes = trim($body['notes'] ?? '');
    $bgChecks = json_encode($body['bg_checks'] ?? []);
    $hiringAssist = trim($body['hiring_assist'] ?? 'normal');
    $category = trim($body['category'] ?? 'Other');

    if (!$title || !$company || !$location) {
        jsonError('Please provide Job Title, Company Name, and Location.');
    }

    $stmt = $db->prepare("INSERT INTO jobs (
        posted_by_user_id, title, emp_type, company, department, location,
        compensation, summary, responsibilities, requirements, app_instructions,
        status_update_via, close_within, interview_mode, notice, notes,
        bg_checks, hiring_assist, category, status, open_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', 'Open')");

    $stmt->execute([
        $userId, $title, $empType, $company, $department, $location,
        $compensation, $summary, $responsibilities, $requirements, $appInstructions,
        $statusUpdateVia, $closeWithin, $interviewMode, $notice, $notes,
        $bgChecks, $hiringAssist, $category
    ]);

    $jobId = $db->lastInsertId();
    logActivityDB("Employer <b>{$user['name']}</b> posted a new job: <b>{$title}</b>");

    jsonSuccess(['job_id' => $jobId], 'Job posted successfully.');
}

// ------------------------------------------------------------------------
// 4. Toggle Job Open / Closed Status
// ------------------------------------------------------------------------
if ($action === 'toggle_open_status') {
    $user = requireRole(['employer', 'admin']);
    $jobId = intval($body['job_id'] ?? 0);

    $stmt = $db->prepare("SELECT * FROM jobs WHERE id = ?");
    $stmt->execute([$jobId]);
    $job = $stmt->fetch();

    if (!$job) {
        jsonError('Job not found.', 404);
    }
    if ($user['role'] !== 'admin' && $job['posted_by_user_id'] != $user['id']) {
        jsonError('Unauthorized to modify this job.', 403);
    }

    $newStatus = ($job['open_status'] === 'Closed') ? 'Open' : 'Closed';
    $stmt = $db->prepare("UPDATE jobs SET open_status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $jobId]);

    logActivityDB("<b>{$user['name']}</b> changed hiring status for <b>{$job['title']}</b> to <b>{$newStatus}</b>");
    jsonSuccess(['open_status' => $newStatus], "Hiring status updated to {$newStatus}.");
}

// ------------------------------------------------------------------------
// 5. Update Category / Review Status (Admin)
// ------------------------------------------------------------------------
if ($action === 'admin_update') {
    $user = requireRole('admin');
    $jobId = intval($body['job_id'] ?? 0);

    $fields = [];
    $params = [];

    if (isset($body['category'])) {
        $fields[] = "category = ?";
        $params[] = $body['category'];
    }
    if (isset($body['status'])) {
        $fields[] = "status = ?";
        $params[] = $body['status'];
    }
    if (isset($body['title'])) {
        $fields[] = "title = ?";
        $params[] = $body['title'];
    }
    if (isset($body['location'])) {
        $fields[] = "location = ?";
        $params[] = $body['location'];
    }
    if (isset($body['compensation'])) {
        $fields[] = "compensation = ?";
        $params[] = $body['compensation'];
    }
    if (isset($body['summary'])) {
        $fields[] = "summary = ?";
        $params[] = $body['summary'];
    }

    if (empty($fields)) {
        jsonError('No fields to update.');
    }

    $params[] = $jobId;
    $stmt = $db->prepare("UPDATE jobs SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    jsonSuccess([], 'Job updated successfully.');
}

// ------------------------------------------------------------------------
// 6. Delete Job
// ------------------------------------------------------------------------
if ($action === 'delete') {
    $user = requireRole(['employer', 'admin']);
    $jobId = intval($body['job_id'] ?? 0);

    $stmt = $db->prepare("SELECT * FROM jobs WHERE id = ?");
    $stmt->execute([$jobId]);
    $job = $stmt->fetch();

    if (!$job) {
        jsonError('Job not found.', 404);
    }
    if ($user['role'] !== 'admin' && $job['posted_by_user_id'] != $user['id']) {
        jsonError('Unauthorized to delete this job.', 403);
    }

    $stmt = $db->prepare("DELETE FROM jobs WHERE id = ?");
    $stmt->execute([$jobId]);

    jsonSuccess([], 'Job posting deleted.');
}

jsonError('Invalid action specified.');
