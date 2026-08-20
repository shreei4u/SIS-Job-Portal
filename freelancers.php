<?php
/**
 * Shield Job Portal - Freelancers & Offerings API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'list';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. List Public Published Offerings
// ------------------------------------------------------------------------
if ($action === 'list' || $action === 'search') {
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');

    $sql = "SELECT o.*, u.name as freelancer_name, u.email as freelancer_email, u.phone as freelancer_phone,
                   p.skills, p.about, p.portfolio, p.exp
            FROM offerings o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE o.status = 'Published'";
    $params = [];

    if ($search) {
        $sql .= " AND (o.title LIKE ? OR o.category LIKE ? OR u.name LIKE ? OR p.skills LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    if ($category) {
        $sql .= " AND o.category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY o.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $offerings = $stmt->fetchAll();

    jsonSuccess(['offerings' => $offerings]);
}

// ------------------------------------------------------------------------
// 2. Freelancer: Get My Offerings
// ------------------------------------------------------------------------
if ($action === 'my_offerings') {
    $user = requireRole(['freelancer', 'admin']);
    $userId = $user['id'];

    $stmt = $db->prepare("SELECT * FROM offerings WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $offerings = $stmt->fetchAll();

    jsonSuccess(['offerings' => $offerings]);
}

// ------------------------------------------------------------------------
// 3. Freelancer: Add Offering
// ------------------------------------------------------------------------
if ($action === 'create') {
    $user = requireRole(['freelancer', 'admin']);
    $userId = $user['id'];

    $title = trim($body['title'] ?? '');
    $price = floatval($body['price'] ?? 0);
    $delivery = trim($body['delivery'] ?? '');
    $desc = trim($body['desc'] ?? '');
    $category = trim($body['category'] ?? 'Other');

    if (!$title || !$price || !$delivery) {
        jsonError('Please provide Offering Title, Price, and Delivery Time.');
    }

    $stmt = $db->prepare("INSERT INTO offerings (user_id, title, price, delivery, `desc`, category, status) VALUES (?, ?, ?, ?, ?, ?, 'Published')");
    $stmt->execute([$userId, $title, $price, $delivery, $desc, $category]);

    logActivityDB("<b>{$user['name']}</b> added a new freelancer service: <b>{$title}</b>");
    jsonSuccess(['offering_id' => $db->lastInsertId()], 'Service offering added successfully.');
}

// ------------------------------------------------------------------------
// 4. Freelancer: Delete Offering
// ------------------------------------------------------------------------
if ($action === 'delete') {
    $user = requireRole(['freelancer', 'admin']);
    $offeringId = intval($body['offering_id'] ?? 0);

    $stmt = $db->prepare("SELECT * FROM offerings WHERE id = ?");
    $stmt->execute([$offeringId]);
    $offering = $stmt->fetch();

    if (!$offering) {
        jsonError('Offering not found.', 404);
    }
    if ($user['role'] !== 'admin' && $offering['user_id'] != $user['id']) {
        jsonError('Unauthorized.', 403);
    }

    $stmt = $db->prepare("DELETE FROM offerings WHERE id = ?");
    $stmt->execute([$offeringId]);

    jsonSuccess([], 'Offering removed.');
}

// ------------------------------------------------------------------------
// 5. Employer Hire Request
// ------------------------------------------------------------------------
if ($action === 'send_hire_request') {
    $user = requireRole(['employer', 'admin']);
    $targetUserId = intval($body['target_user_id'] ?? 0);
    $targetRole = trim($body['target_role'] ?? 'freelancer');
    $offeringTitle = trim($body['offering_title'] ?? '');
    $message = trim($body['message'] ?? '');

    if (!$targetUserId || !$offeringTitle) {
        jsonError('Please specify talent and offering.');
    }

    $stmt = $db->prepare("INSERT INTO hire_requests (employer_user_id, target_user_id, target_role, offering_title, message, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
    $stmt->execute([$user['id'], $targetUserId, $targetRole, $offeringTitle, $message]);

    // Fetch target user name for log
    $stmt = $db->prepare("SELECT name FROM users WHERE id = ?");
    $stmt->execute([$targetUserId]);
    $targetUser = $stmt->fetch();

    logActivityDB("<b>{$user['name']}</b> sent a hire request to <b>" . ($targetUser['name'] ?? 'Talent') . "</b> for {$offeringTitle}");
    jsonSuccess([], 'Hire request sent.');
}

// ------------------------------------------------------------------------
// 6. List Hire Requests (Employer / Freelancer)
// ------------------------------------------------------------------------
if ($action === 'hire_requests') {
    $user = requireAuth();
    $userId = $user['id'];

    if ($user['role'] === 'employer') {
        $sql = "SELECT hr.*, u.name as target_name, u.email as target_email 
                FROM hire_requests hr 
                JOIN users u ON hr.target_user_id = u.id 
                WHERE hr.employer_user_id = ? 
                ORDER BY hr.created_at DESC";
    } else {
        $sql = "SELECT hr.*, u.name as employer_name, u.email as employer_email 
                FROM hire_requests hr 
                JOIN users u ON hr.employer_user_id = u.id 
                WHERE hr.target_user_id = ? 
                ORDER BY hr.created_at DESC";
    }

    $stmt = $db->prepare($sql);
    $stmt->execute([$userId]);
    $requests = $stmt->fetchAll();

    jsonSuccess(['requests' => $requests]);
}

// ------------------------------------------------------------------------
// 7. Respond to Hire Request (Accept / Decline)
// ------------------------------------------------------------------------
if ($action === 'respond_hire_request') {
    $user = requireAuth();
    $requestId = intval($body['request_id'] ?? 0);
    $status = trim($body['status'] ?? 'Accepted');

    $stmt = $db->prepare("SELECT hr.*, u.name as employer_name FROM hire_requests hr JOIN users u ON hr.employer_user_id = u.id WHERE hr.id = ?");
    $stmt->execute([$requestId]);
    $req = $stmt->fetch();

    if (!$req) {
        jsonError('Request not found.', 404);
    }
    if ($user['role'] !== 'admin' && $req['target_user_id'] != $user['id']) {
        jsonError('Unauthorized.', 403);
    }

    $stmt = $db->prepare("UPDATE hire_requests SET status = ? WHERE id = ?");
    $stmt->execute([$status, $requestId]);

    logActivityDB("<b>{$user['name']}</b> {$status} hire request from {$req['employer_name']}");
    jsonSuccess([], "Request {$status}.");
}

// ------------------------------------------------------------------------
// 8. Admin Update Offering Status / Category
// ------------------------------------------------------------------------
if ($action === 'admin_update') {
    $user = requireRole('admin');
    $offeringId = intval($body['offering_id'] ?? 0);

    $fields = [];
    $params = [];
    if (isset($body['category'])) { $fields[] = "category = ?"; $params[] = $body['category']; }
    if (isset($body['status'])) { $fields[] = "status = ?"; $params[] = $body['status']; }
    if (isset($body['title'])) { $fields[] = "title = ?"; $params[] = $body['title']; }
    if (isset($body['price'])) { $fields[] = "price = ?"; $params[] = floatval($body['price']); }
    if (isset($body['delivery'])) { $fields[] = "delivery = ?"; $params[] = $body['delivery']; }
    if (isset($body['desc'])) { $fields[] = "`desc` = ?"; $params[] = $body['desc']; }

    if (empty($fields)) {
        jsonError('No fields to update.');
    }

    $params[] = $offeringId;
    $stmt = $db->prepare("UPDATE offerings SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    jsonSuccess([], 'Offering updated successfully.');
}

jsonError('Invalid action specified.');
