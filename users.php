<?php
/**
 * Shield Job Portal - User & Database Management API Endpoint (Admin)
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'list';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

$user = requireRole('admin');

// ------------------------------------------------------------------------
// 1. Get Users by Role Database Category
// ------------------------------------------------------------------------
if ($action === 'list') {
    $category = $_GET['category'] ?? 'all';
    
    $sql = "SELECT u.id, u.name, u.email, u.phone, u.role, u.subscription, u.created_at,
                   p.title, p.exp, p.salary, p.cur_salary, p.skills, p.about, p.whatsapp,
                   p.cur_location, p.des_location, p.marital, p.linkedin, p.portfolio,
                   p.qualification, p.projects_done, p.company, p.notice, p.reason,
                   p.project_link, p.ref1, p.ref2, p.resume_name, p.resume_path,
                   p.ats_boost, p.review_status, p.saved
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id";

    $params = [];
    if ($category === 'jobseeker') {
        $sql .= " WHERE u.role = 'jobseeker'";
    } elseif ($category === 'employer') {
        $sql .= " WHERE u.role = 'employer'";
    } elseif ($category === 'freelancer') {
        $sql .= " WHERE u.role = 'freelancer'";
    } elseif ($category === 'trainer') {
        $sql .= " WHERE u.role = 'trainer'";
    } elseif ($category === 'manpower-contractor') {
        $sql .= " WHERE u.role IN ('manpower', 'contractor')";
    } elseif ($category !== 'all') {
        $sql .= " WHERE u.role = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY u.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $usersList = $stmt->fetchAll();

    // Fetch related records count / items for each
    foreach ($usersList as &$u) {
        $uid = $u['id'];
        if ($u['role'] === 'employer') {
            $jStmt = $db->prepare("SELECT id, title, emp_type, company, location, compensation, summary, category, status, open_status FROM jobs WHERE posted_by_user_id = ?");
            $jStmt->execute([$uid]);
            $u['jobs'] = $jStmt->fetchAll();
        } elseif ($u['role'] === 'freelancer') {
            $oStmt = $db->prepare("SELECT id, title, price, delivery, `desc`, category, status FROM offerings WHERE user_id = ?");
            $oStmt->execute([$uid]);
            $u['offerings'] = $oStmt->fetchAll();
        } elseif ($u['role'] === 'trainer') {
            $cStmt = $db->prepare("SELECT id, title, price, duration, `desc`, category, status FROM courses WHERE user_id = ?");
            $cStmt->execute([$uid]);
            $u['courses'] = $cStmt->fetchAll();
        } elseif ($u['role'] === 'manpower' || $u['role'] === 'contractor') {
            $wpStmt = $db->prepare("SELECT * FROM workforce_pool WHERE user_id = ?");
            $wpStmt->execute([$uid]);
            $u['workforce_pool'] = $wpStmt->fetchAll();

            $locStmt = $db->prepare("SELECT location FROM service_locations WHERE user_id = ?");
            $locStmt->execute([$uid]);
            $u['service_locations'] = $locStmt->fetchAll(PDO::FETCH_COLUMN);

            $cpStmt = $db->prepare("SELECT * FROM contractor_projects WHERE contractor_user_id = ?");
            $cpStmt->execute([$uid]);
            $u['projects'] = $cpStmt->fetchAll();
        }
    }

    jsonSuccess(['users' => $usersList]);
}

// ------------------------------------------------------------------------
// 2. Edit User Basics
// ------------------------------------------------------------------------
if ($action === 'edit') {
    $userId = intval($body['user_id'] ?? 0);
    $name = trim($body['name'] ?? '');
    $phone = trim($body['phone'] ?? '');

    if (!$userId || !$name) {
        jsonError('User ID and Name are required.');
    }

    $stmt = $db->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
    $stmt->execute([$name, $phone, $userId]);

    logActivityDB("Admin updated user details for <b>{$name}</b>");
    jsonSuccess([], 'User details updated.');
}

// ------------------------------------------------------------------------
// 3. Toggle Subscription / ATS Boost
// ------------------------------------------------------------------------
if ($action === 'toggle_subscription') {
    $userId = intval($body['user_id'] ?? 0);

    $stmt = $db->prepare("SELECT role, subscription FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $targetUser = $stmt->fetch();

    if (!$targetUser) {
        jsonError('User not found.', 404);
    }

    if ($targetUser['role'] === 'jobseeker') {
        $stmt = $db->prepare("UPDATE profiles SET ats_boost = (CASE WHEN ats_boost = 1 THEN 0 ELSE 1 END) WHERE user_id = ?");
        $stmt->execute([$userId]);
        jsonSuccess([], 'Job seeker ATS Boost toggled.');
    } else {
        $newSub = ($targetUser['subscription'] === 'Premium') ? 'Free' : 'Premium';
        $stmt = $db->prepare("UPDATE users SET subscription = ? WHERE id = ?");
        $stmt->execute([$newSub, $userId]);
        jsonSuccess(['subscription' => $newSub], "Subscription updated to {$newSub}.");
    }
}

// ------------------------------------------------------------------------
// 4. Set Review Status (Job Seeker)
// ------------------------------------------------------------------------
if ($action === 'set_review_status') {
    $userId = intval($body['user_id'] ?? 0);
    $status = trim($body['status'] ?? 'Published');

    $stmt = $db->prepare("UPDATE profiles SET review_status = ? WHERE user_id = ?");
    $stmt->execute([$status, $userId]);

    jsonSuccess([], "Review status updated to {$status}.");
}

// ------------------------------------------------------------------------
// 5. Delete User
// ------------------------------------------------------------------------
if ($action === 'delete') {
    $userId = intval($body['user_id'] ?? 0);

    if ($userId === $user['id']) {
        jsonError('You cannot delete the active administrator account.');
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    logActivityDB("Admin deleted user ID #{$userId}");
    jsonSuccess([], 'User deleted from system.');
}

jsonError('Invalid action specified.');
