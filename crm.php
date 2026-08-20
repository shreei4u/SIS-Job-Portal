<?php
/**
 * Shield Job Portal - CRM & Analytics API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'metrics';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

$user = requireRole('admin');

// ------------------------------------------------------------------------
// 1. Full CRM Metrics & KPI Dashboard
// ------------------------------------------------------------------------
if ($action === 'metrics') {
    // Counts
    $activeClients = $db->query("SELECT COUNT(DISTINCT posted_by_user_id) FROM jobs")->fetchColumn() ?: 0;
    $activeJobs = $db->query("SELECT COUNT(*) FROM jobs WHERE status = 'Published' AND open_status = 'Open'")->fetchColumn() ?: 0;
    $closedJobs = $db->query("SELECT COUNT(*) FROM jobs WHERE open_status = 'Closed'")->fetchColumn() ?: 0;
    $registeredUsers = $db->query("SELECT COUNT(*) FROM users WHERE role != 'admin'")->fetchColumn() ?: 0;

    $activeCandidates = $db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('Rejected')")->fetchColumn() ?: 0;
    $hiredCandidates = $db->query("SELECT COUNT(*) FROM applications WHERE stage = 5 OR status = 'Hired'")->fetchColumn() ?: 0;
    $shortlistedCandidates = $db->query("SELECT COUNT(*) FROM applications WHERE status = 'Shortlisted' OR stage = 0")->fetchColumn() ?: 0;
    $rejectedCandidates = $db->query("SELECT COUNT(*) FROM applications WHERE status = 'Rejected'")->fetchColumn() ?: 0;
    $totalApplications = $db->query("SELECT COUNT(*) FROM applications")->fetchColumn() ?: 0;

    $activeFreelancers = $db->query("SELECT COUNT(DISTINCT user_id) FROM offerings WHERE status = 'Published'")->fetchColumn() ?: 0;
    $activeFreelancerServices = $db->query("SELECT COUNT(*) FROM offerings WHERE status = 'Published'")->fetchColumn() ?: 0;
    $pipelineFreelanceProjects = $db->query("SELECT COUNT(*) FROM offerings WHERE status = 'Pending'")->fetchColumn() ?: 0;

    // Hired List
    $stmt = $db->query("SELECT u.name, j.title as role 
                        FROM applications a 
                        JOIN users u ON a.user_id = u.id 
                        JOIN jobs j ON a.job_id = j.id 
                        WHERE a.stage = 5 OR a.status = 'Hired' 
                        ORDER BY a.updated_at DESC LIMIT 20");
    $hiredList = $stmt->fetchAll();

    // Lead Pipeline counts
    $leadCounts = [
        'New' => intval($db->query("SELECT COUNT(*) FROM crm_leads WHERE status = 'New'")->fetchColumn() ?: 0),
        'Contacted' => intval($db->query("SELECT COUNT(*) FROM crm_leads WHERE status = 'Contacted'")->fetchColumn() ?: 0),
        'Converted' => intval($db->query("SELECT COUNT(*) FROM crm_leads WHERE status = 'Converted'")->fetchColumn() ?: 0),
        'Lost' => intval($db->query("SELECT COUNT(*) FROM crm_leads WHERE status = 'Lost'")->fetchColumn() ?: 0),
    ];

    // Users by Role
    $roleCountsStmt = $db->query("SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role");
    $roleCounts = [];
    while ($row = $roleCountsStmt->fetch()) {
        $roleCounts[$row['role']] = intval($row['count']);
    }

    jsonSuccess([
        'metrics' => [
            'active_clients' => intval($activeClients),
            'active_jobs' => intval($activeJobs),
            'closed_jobs' => intval($closedJobs),
            'registered_users' => intval($registeredUsers),
            'active_candidates' => intval($activeCandidates),
            'hired_candidates' => intval($hiredCandidates),
            'shortlisted_candidates' => intval($shortlistedCandidates),
            'rejected_candidates' => intval($rejectedCandidates),
            'total_applications' => intval($totalApplications),
            'active_freelancers' => intval($activeFreelancers),
            'active_freelancer_services' => intval($activeFreelancerServices),
            'pipeline_freelance_projects' => intval($pipelineFreelanceProjects),
        ],
        'hired_list' => $hiredList,
        'lead_counts' => $leadCounts,
        'role_counts' => $roleCounts
    ]);
}

// ------------------------------------------------------------------------
// 2. All Leads with CRM Status & Latest Note
// ------------------------------------------------------------------------
if ($action === 'leads') {
    $sql = "SELECT u.id, u.name, u.email, u.phone, u.role, u.subscription,
                   COALESCE(cl.status, 'New') as crm_status,
                   (SELECT note FROM crm_notes WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_note,
                   (SELECT created_at FROM crm_notes WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_note_time
            FROM users u
            LEFT JOIN crm_leads cl ON u.id = cl.user_id
            WHERE u.role != 'admin'
            ORDER BY u.created_at DESC";

    $stmt = $db->query($sql);
    $leads = $stmt->fetchAll();

    jsonSuccess(['leads' => $leads]);
}

// ------------------------------------------------------------------------
// 3. Update Lead Status
// ------------------------------------------------------------------------
if ($action === 'update_status') {
    $userId = intval($body['user_id'] ?? 0);
    $status = trim($body['status'] ?? 'New');

    $stmt = $db->prepare("INSERT INTO crm_leads (user_id, status) VALUES (?, ?) ON DUPLICATE KEY UPDATE status = ?");
    $stmt->execute([$userId, $status, $status]);

    jsonSuccess([], "Lead status updated to {$status}.");
}

// ------------------------------------------------------------------------
// 4. Get User CRM Profile & Notes
// ------------------------------------------------------------------------
if ($action === 'lead_details') {
    $userId = intval($_GET['user_id'] ?? 0);

    $stmt = $db->prepare("SELECT u.*, COALESCE(cl.status, 'New') as crm_status FROM users u LEFT JOIN crm_leads cl ON u.id = cl.user_id WHERE u.id = ?");
    $stmt->execute([$userId]);
    $lead = $stmt->fetch();

    if (!$lead) {
        jsonError('User not found.', 404);
    }
    unset($lead['password']);

    // Fetch notes
    $stmt = $db->prepare("SELECT * FROM crm_notes WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $notes = $stmt->fetchAll();

    // Fetch extended summary based on role
    $stmt = $db->prepare("SELECT * FROM profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $profile = $stmt->fetch() ?: [];

    jsonSuccess([
        'lead' => $lead,
        'profile' => $profile,
        'notes' => $notes
    ]);
}

// ------------------------------------------------------------------------
// 5. Add CRM Follow-up Note
// ------------------------------------------------------------------------
if ($action === 'add_note') {
    $userId = intval($body['user_id'] ?? 0);
    $note = trim($body['note'] ?? '');

    if (!$userId || !$note) {
        jsonError('Note content is required.');
    }

    $stmt = $db->prepare("INSERT INTO crm_notes (user_id, note) VALUES (?, ?)");
    $stmt->execute([$userId, $note]);

    jsonSuccess(['id' => $db->lastInsertId()], 'Note saved.');
}

// ------------------------------------------------------------------------
// 6. Activity Feed
// ------------------------------------------------------------------------
if ($action === 'activity_log') {
    $limit = intval($_GET['limit'] ?? 50);
    $stmt = $db->prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll();

    jsonSuccess(['logs' => $logs]);
}

jsonError('Invalid action specified.');
