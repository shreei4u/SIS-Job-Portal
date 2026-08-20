<?php
/**
 * Shield Job Portal - Project Contractors API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'projects';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. Contractor: List Active Projects
// ------------------------------------------------------------------------
if ($action === 'projects') {
    $user = requireRole(['contractor', 'employer', 'admin']);
    $userId = $user['id'];

    if ($user['role'] === 'contractor') {
        $stmt = $db->prepare("SELECT * FROM contractor_projects WHERE contractor_user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
    } elseif ($user['role'] === 'employer') {
        $stmt = $db->prepare("SELECT cp.*, u.name as contractor_name FROM contractor_projects cp JOIN users u ON cp.contractor_user_id = u.id WHERE cp.requested_by_user_id = ? ORDER BY cp.created_at DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $db->prepare("SELECT cp.*, u.name as contractor_name FROM contractor_projects cp JOIN users u ON cp.contractor_user_id = u.id ORDER BY cp.created_at DESC");
        $stmt->execute();
    }
    $projects = $stmt->fetchAll();

    foreach ($projects as &$p) {
        $p['manpower_roles'] = json_decode($p['manpower_roles'] ?? '[]', true) ?: [];
    }

    jsonSuccess(['projects' => $projects]);
}

// ------------------------------------------------------------------------
// 2. Contractor / Employer: Add Project
// ------------------------------------------------------------------------
if ($action === 'create_project') {
    $user = requireRole(['contractor', 'employer', 'admin']);
    $contractorUserId = intval($body['contractor_user_id'] ?? $user['id']);

    $name = trim($body['name'] ?? '');
    $client = trim($body['client'] ?? $user['name']);
    $location = trim($body['location'] ?? '');
    $contactName = trim($body['contact_name'] ?? '');
    $contactNumber = trim($body['contact_number'] ?? '');
    $value = floatval($body['value'] ?? 0);
    $startDate = $body['start_date'] ?? null;
    $endDate = $body['end_date'] ?? null;
    $contractPeriod = trim($body['contract_period'] ?? '');
    $manpowerRequired = intval($body['manpower_required'] ?? 0);
    $manpowerRoles = json_encode($body['manpower_roles'] ?? []);
    $description = trim($body['description'] ?? '');

    if (!$name || !$client) {
        jsonError('Please provide Project Name and Client Name.');
    }

    $stmt = $db->prepare("INSERT INTO contractor_projects (
        contractor_user_id, requested_by_user_id, name, client, location,
        contact_name, contact_number, value, start_date, end_date,
        contract_period, manpower_required, manpower_roles, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ongoing')");

    $stmt->execute([
        $contractorUserId, $user['id'], $name, $client, $location,
        $contactName, $contactNumber, $value, $startDate ?: null, $endDate ?: null,
        $contractPeriod, $manpowerRequired, $manpowerRoles, $description
    ]);

    logActivityDB("<b>{$user['name']}</b> added project: <b>{$name}</b>");
    jsonSuccess(['id' => $db->lastInsertId()], 'Project added successfully.');
}

// ------------------------------------------------------------------------
// 3. Update Project Status
// ------------------------------------------------------------------------
if ($action === 'update_project_status') {
    $user = requireRole(['contractor', 'admin']);
    $projectId = intval($body['project_id'] ?? 0);
    $status = trim($body['status'] ?? 'Ongoing');

    $stmt = $db->prepare("UPDATE contractor_projects SET status = ? WHERE id = ?");
    $stmt->execute([$status, $projectId]);

    jsonSuccess([], "Project status updated to {$status}.");
}

// ------------------------------------------------------------------------
// 4. Delete Project
// ------------------------------------------------------------------------
if ($action === 'delete_project') {
    $user = requireRole(['contractor', 'admin']);
    $projectId = intval($body['project_id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM contractor_projects WHERE id = ?");
    $stmt->execute([$projectId]);

    jsonSuccess([], 'Project removed.');
}

// ------------------------------------------------------------------------
// 5. Received Bids (List & Log)
// ------------------------------------------------------------------------
if ($action === 'bids') {
    $user = requireRole(['contractor', 'admin']);
    $userId = $user['id'];

    if ($user['role'] === 'contractor') {
        $stmt = $db->prepare("SELECT * FROM project_bids WHERE contractor_user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $db->prepare("SELECT pb.*, u.name as contractor_name FROM project_bids pb JOIN users u ON pb.contractor_user_id = u.id ORDER BY pb.created_at DESC");
        $stmt->execute();
    }
    $bids = $stmt->fetchAll();

    jsonSuccess(['bids' => $bids]);
}

if ($action === 'create_bid') {
    $user = requireRole(['contractor', 'admin']);
    $bidderName = trim($body['bidder_name'] ?? '');
    $projectName = trim($body['project_name'] ?? '');
    $amount = floatval($body['amount'] ?? 0);
    $contact = trim($body['contact'] ?? '');

    if (!$bidderName || $amount <= 0) {
        jsonError('Please provide Bidder Name and Bid Amount.');
    }

    $stmt = $db->prepare("INSERT INTO project_bids (contractor_user_id, bidder_name, project_name, amount, contact, status) VALUES (?, ?, ?, ?, ?, 'New')");
    $stmt->execute([$user['id'], $bidderName, $projectName, $amount, $contact]);

    logActivityDB("Bid logged from <b>{$bidderName}</b> for ₹{$amount}");
    jsonSuccess(['id' => $db->lastInsertId()], 'Bid logged.');
}

if ($action === 'update_bid_status') {
    $user = requireRole(['contractor', 'admin']);
    $bidId = intval($body['bid_id'] ?? 0);
    $status = trim($body['status'] ?? 'Accepted');

    $stmt = $db->prepare("UPDATE project_bids SET status = ? WHERE id = ?");
    $stmt->execute([$status, $bidId]);

    jsonSuccess([], "Bid status updated to {$status}.");
}

jsonError('Invalid action specified.');
