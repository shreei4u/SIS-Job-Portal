<?php
/**
 * Shield Job Portal - Manpower API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'pool';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. Get Workforce Pool
// ------------------------------------------------------------------------
if ($action === 'pool') {
    $user = requireRole(['manpower', 'employer', 'admin']);
    $userId = $user['id'];

    if ($user['role'] === 'manpower') {
        $stmt = $db->prepare("SELECT * FROM workforce_pool WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
    } else {
        // Employers & Admins view all available pool
        $stmt = $db->prepare("SELECT wp.*, u.name as provider_name, u.email as provider_email, u.phone as provider_phone 
                              FROM workforce_pool wp 
                              JOIN users u ON wp.user_id = u.id 
                              WHERE wp.available = 1 
                              ORDER BY wp.created_at DESC");
        $stmt->execute();
    }
    $pool = $stmt->fetchAll();

    jsonSuccess(['pool' => $pool]);
}

// ------------------------------------------------------------------------
// 2. Add to Workforce Pool
// ------------------------------------------------------------------------
if ($action === 'add_pool') {
    $user = requireRole(['manpower', 'admin']);
    $userId = $user['id'];

    $roleType = trim($body['role_type'] ?? '');
    $skillLevel = trim($body['skill_level'] ?? 'Skilled');
    $experience = trim($body['experience'] ?? '');
    $count = intval($body['count'] ?? 1);

    if (!$roleType || $count < 1) {
        jsonError('Please specify role/trade and valid worker count.');
    }

    $stmt = $db->prepare("INSERT INTO workforce_pool (user_id, role_type, skill_level, experience, count, available) VALUES (?, ?, ?, ?, ?, 1)");
    $stmt->execute([$userId, $roleType, $skillLevel, $experience, $count]);

    logActivityDB("<b>{$user['name']}</b> added <b>{$count} {$roleType}(s)</b> to workforce pool");
    jsonSuccess(['id' => $db->lastInsertId()], 'Added to workforce pool.');
}

// ------------------------------------------------------------------------
// 3. Toggle Availability in Workforce Pool
// ------------------------------------------------------------------------
if ($action === 'toggle_availability') {
    $user = requireRole(['manpower', 'admin']);
    $poolId = intval($body['pool_id'] ?? 0);

    $stmt = $db->prepare("SELECT * FROM workforce_pool WHERE id = ?");
    $stmt->execute([$poolId]);
    $entry = $stmt->fetch();

    if (!$entry) {
        jsonError('Workforce entry not found.', 404);
    }
    if ($user['role'] !== 'admin' && $entry['user_id'] != $user['id']) {
        jsonError('Unauthorized.', 403);
    }

    $newAvail = $entry['available'] ? 0 : 1;
    $stmt = $db->prepare("UPDATE workforce_pool SET available = ? WHERE id = ?");
    $stmt->execute([$newAvail, $poolId]);

    jsonSuccess(['available' => $newAvail], 'Availability status updated.');
}

// ------------------------------------------------------------------------
// 4. Delete Workforce Pool Entry
// ------------------------------------------------------------------------
if ($action === 'delete_pool') {
    $user = requireRole(['manpower', 'admin']);
    $poolId = intval($body['pool_id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM workforce_pool WHERE id = ? AND user_id = ?");
    $stmt->execute([$poolId, $user['id']]);

    jsonSuccess([], 'Entry removed.');
}

// ------------------------------------------------------------------------
// 5. Deployment Requests (List & Log)
// ------------------------------------------------------------------------
if ($action === 'deployment_requests') {
    $user = requireRole(['manpower', 'employer', 'admin']);
    $userId = $user['id'];

    if ($user['role'] === 'manpower') {
        $stmt = $db->prepare("SELECT * FROM deployment_requests WHERE provider_user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
    } elseif ($user['role'] === 'employer') {
        $stmt = $db->prepare("SELECT dr.*, u.name as provider_name FROM deployment_requests dr JOIN users u ON dr.provider_user_id = u.id WHERE dr.requested_by_user_id = ? ORDER BY dr.created_at DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $db->prepare("SELECT * FROM deployment_requests ORDER BY created_at DESC");
        $stmt->execute();
    }
    $reqs = $stmt->fetchAll();

    jsonSuccess(['requests' => $reqs]);
}

if ($action === 'create_deployment_request') {
    $user = requireRole(['manpower', 'employer', 'admin']);
    $providerUserId = intval($body['provider_user_id'] ?? $user['id']);
    $clientName = trim($body['client_name'] ?? $user['name']);
    $location = trim($body['location'] ?? '');
    $rolesNeeded = trim($body['roles_needed'] ?? '');
    $quantity = intval($body['quantity'] ?? 1);
    $duration = trim($body['duration'] ?? '');

    if (!$location || $quantity < 1) {
        jsonError('Please provide location and quantity.');
    }

    $stmt = $db->prepare("INSERT INTO deployment_requests (provider_user_id, requested_by_user_id, client_name, location, roles_needed, quantity, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'New')");
    $stmt->execute([$providerUserId, $user['id'], $clientName, $location, $rolesNeeded, $quantity, $duration]);

    logActivityDB("<b>{$user['name']}</b> logged deployment request for {$quantity} worker(s)");
    jsonSuccess([], 'Deployment request logged.');
}

if ($action === 'update_deployment_status') {
    $user = requireRole(['manpower', 'admin']);
    $requestId = intval($body['request_id'] ?? 0);
    $status = trim($body['status'] ?? 'In Progress');

    $stmt = $db->prepare("UPDATE deployment_requests SET status = ? WHERE id = ?");
    $stmt->execute([$status, $requestId]);

    jsonSuccess([], "Status updated to {$status}.");
}

// ------------------------------------------------------------------------
// 6. Service Locations
// ------------------------------------------------------------------------
if ($action === 'locations') {
    $user = requireRole(['manpower', 'admin']);
    $stmt = $db->prepare("SELECT * FROM service_locations WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $locations = $stmt->fetchAll();

    jsonSuccess(['locations' => $locations]);
}

if ($action === 'add_location') {
    $user = requireRole(['manpower', 'admin']);
    $location = trim($body['location'] ?? '');

    if (!$location) {
        jsonError('Please provide location.');
    }

    $stmt = $db->prepare("INSERT INTO service_locations (user_id, location) VALUES (?, ?)");
    $stmt->execute([$user['id'], $location]);

    jsonSuccess(['id' => $db->lastInsertId()], 'Location added.');
}

if ($action === 'delete_location') {
    $user = requireRole(['manpower', 'admin']);
    $locId = intval($body['location_id'] ?? 0);

    $stmt = $db->prepare("DELETE FROM service_locations WHERE id = ? AND user_id = ?");
    $stmt->execute([$locId, $user['id']]);

    jsonSuccess([], 'Location removed.');
}

jsonError('Invalid action specified.');
