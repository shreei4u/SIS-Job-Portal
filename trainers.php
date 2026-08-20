<?php
/**
 * Shield Job Portal - Trainers & Courses API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'list';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. List Public Courses
// ------------------------------------------------------------------------
if ($action === 'list' || $action === 'search') {
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');

    $sql = "SELECT c.*, u.name as trainer_name, u.email as trainer_email, u.phone as trainer_phone,
                   p.skills, p.about, p.qualification, p.exp
            FROM courses c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE c.status = 'Published'";
    $params = [];

    if ($search) {
        $sql .= " AND (c.title LIKE ? OR c.category LIKE ? OR u.name LIKE ? OR p.skills LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    if ($category) {
        $sql .= " AND c.category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY c.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $courses = $stmt->fetchAll();

    jsonSuccess(['courses' => $courses]);
}

// ------------------------------------------------------------------------
// 2. Trainer: My Courses
// ------------------------------------------------------------------------
if ($action === 'my_courses') {
    $user = requireRole(['trainer', 'admin']);
    $userId = $user['id'];

    $stmt = $db->prepare("SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $courses = $stmt->fetchAll();

    jsonSuccess(['courses' => $courses]);
}

// ------------------------------------------------------------------------
// 3. Trainer: Add Course
// ------------------------------------------------------------------------
if ($action === 'create') {
    $user = requireRole(['trainer', 'admin']);
    $userId = $user['id'];

    $title = trim($body['title'] ?? '');
    $price = floatval($body['price'] ?? 0);
    $duration = trim($body['duration'] ?? '');
    $desc = trim($body['desc'] ?? '');
    $category = trim($body['category'] ?? 'Other');

    if (!$title || !$price || !$duration) {
        jsonError('Please provide Course Title, Fee, and Duration.');
    }

    $stmt = $db->prepare("INSERT INTO courses (user_id, title, price, duration, `desc`, category, status) VALUES (?, ?, ?, ?, ?, ?, 'Published')");
    $stmt->execute([$userId, $title, $price, $duration, $desc, $category]);

    logActivityDB("<b>{$user['name']}</b> added a new training course: <b>{$title}</b>");
    jsonSuccess(['course_id' => $db->lastInsertId()], 'Course added successfully.');
}

// ------------------------------------------------------------------------
// 4. Trainer: Delete Course
// ------------------------------------------------------------------------
if ($action === 'delete') {
    $user = requireRole(['trainer', 'admin']);
    $courseId = intval($body['course_id'] ?? 0);

    $stmt = $db->prepare("SELECT * FROM courses WHERE id = ?");
    $stmt->execute([$courseId]);
    $course = $stmt->fetch();

    if (!$course) {
        jsonError('Course not found.', 404);
    }
    if ($user['role'] !== 'admin' && $course['user_id'] != $user['id']) {
        jsonError('Unauthorized.', 403);
    }

    $stmt = $db->prepare("DELETE FROM courses WHERE id = ?");
    $stmt->execute([$courseId]);

    jsonSuccess([], 'Course removed.');
}

// ------------------------------------------------------------------------
// 5. Admin Update Course Status / Category
// ------------------------------------------------------------------------
if ($action === 'admin_update') {
    $user = requireRole('admin');
    $courseId = intval($body['course_id'] ?? 0);

    $fields = [];
    $params = [];
    if (isset($body['category'])) { $fields[] = "category = ?"; $params[] = $body['category']; }
    if (isset($body['status'])) { $fields[] = "status = ?"; $params[] = $body['status']; }
    if (isset($body['title'])) { $fields[] = "title = ?"; $params[] = $body['title']; }
    if (isset($body['price'])) { $fields[] = "price = ?"; $params[] = floatval($body['price']); }
    if (isset($body['duration'])) { $fields[] = "duration = ?"; $params[] = $body['duration']; }
    if (isset($body['desc'])) { $fields[] = "`desc` = ?"; $params[] = $body['desc']; }

    if (empty($fields)) {
        jsonError('No fields to update.');
    }

    $params[] = $courseId;
    $stmt = $db->prepare("UPDATE courses SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    jsonSuccess([], 'Course updated successfully.');
}

jsonError('Invalid action specified.');
