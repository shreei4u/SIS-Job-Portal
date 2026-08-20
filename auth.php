<?php
/**
 * Shield Job Portal - Authentication API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established. Please run install.php first.', 500);
}

// ------------------------------------------------------------------------
// 1. Check Current Session / Auth User
// ------------------------------------------------------------------------
if ($action === 'check') {
    $user = getAuthUser();
    if ($user) {
        // Fetch fresh profile data
        $stmt = $db->prepare("SELECT * FROM profiles WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $profile = $stmt->fetch() ?: [];
        $user['profile'] = $profile;
        jsonSuccess(['user' => $user]);
    } else {
        jsonSuccess(['user' => null]);
    }
}

// ------------------------------------------------------------------------
// 2. User Registration
// ------------------------------------------------------------------------
if ($action === 'register') {
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $phone = trim($body['phone'] ?? '');
    $password = $body['password'] ?? '';
    $role = trim($body['role'] ?? 'jobseeker');

    $validRoles = ['jobseeker', 'employer', 'freelancer', 'trainer', 'manpower', 'contractor'];

    if (!$name || !$email || !$phone || !$password || !in_array($role, $validRoles)) {
        jsonError('Please provide all required fields with a valid role.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Please provide a valid email address.');
    }

    // Check if email already registered
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonError('This email is already registered. Please log in.');
    }

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare("INSERT INTO users (name, email, phone, password, role, subscription) VALUES (?, ?, ?, ?, ?, 'Free')");
    $stmt->execute([$name, $email, $phone, $hashedPassword, $role]);
    $userId = $db->lastInsertId();

    // Create empty profile record
    $stmt = $db->prepare("INSERT INTO profiles (user_id) VALUES (?)");
    $stmt->execute([$userId]);

    // Create CRM Lead record
    $stmt = $db->prepare("INSERT INTO crm_leads (user_id, status) VALUES (?, 'New')");
    $stmt->execute([$userId]);

    logActivityDB("New registration: <b>{$name}</b> ({$role})");

    jsonSuccess([
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'subscription' => 'Free'
        ]
    ], 'Registration successful! You can now log in.');
}

// ------------------------------------------------------------------------
// 3. User Login
// ------------------------------------------------------------------------
if ($action === 'login') {
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        jsonError('Please enter both email and password.');
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('Invalid email or password.');
    }

    // Support both bcrypt and direct match for initial seeds if needed
    $passwordMatches = password_verify($password, $user['password']) || ($password === $user['password']);

    if (!$passwordMatches) {
        jsonError('Invalid email or password.');
    }

    // Remove password hash from session
    unset($user['password']);

    // Fetch profile
    $stmt = $db->prepare("SELECT * FROM profiles WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $profile = $stmt->fetch() ?: [];
    $user['profile'] = $profile;

    $_SESSION['user'] = $user;

    jsonSuccess(['user' => $user], 'Login successful.');
}

// ------------------------------------------------------------------------
// 4. Logout
// ------------------------------------------------------------------------
if ($action === 'logout') {
    unset($_SESSION['user']);
    session_destroy();
    jsonSuccess([], 'Logged out successfully.');
}

// ------------------------------------------------------------------------
// 5. Update Profile (Job Seeker / Freelancer / Trainer)
// ------------------------------------------------------------------------
if ($action === 'update_profile') {
    $user = requireAuth();
    $userId = $user['id'];

    // Update user info
    $name = trim($body['name'] ?? $user['name']);
    $phone = trim($body['phone'] ?? $user['phone']);

    $stmt = $db->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
    $stmt->execute([$name, $phone, $userId]);
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['phone'] = $phone;

    // Check existing profile
    $stmt = $db->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $exists = $stmt->fetch();

    $title = $body['title'] ?? null;
    $exp = $body['exp'] ?? null;
    $salary = $body['salary'] ?? null;
    $curSalary = $body['cur_salary'] ?? null;
    $skills = $body['skills'] ?? null;
    $about = $body['about'] ?? null;
    $whatsapp = $body['whatsapp'] ?? null;
    $curLoc = $body['cur_location'] ?? null;
    $desLoc = $body['des_location'] ?? null;
    $marital = $body['marital'] ?? null;
    $linkedin = $body['linkedin'] ?? null;
    $portfolio = $body['portfolio'] ?? null;
    $qualification = $body['qualification'] ?? null;
    $projectsDone = $body['projects_done'] ?? null;
    $company = $body['company'] ?? null;
    $notice = $body['notice'] ?? null;
    $reason = $body['reason'] ?? null;
    $projectLink = $body['project_link'] ?? null;
    $ref1 = $body['ref1'] ?? null;
    $ref2 = $body['ref2'] ?? null;
    $resumeName = $body['resume_name'] ?? null;
    $atsBoost = !empty($body['ats_boost']) ? 1 : 0;

    if ($exists) {
        $sql = "UPDATE profiles SET 
            title = ?, exp = ?, salary = ?, cur_salary = ?, skills = ?, about = ?,
            whatsapp = ?, cur_location = ?, des_location = ?, marital = ?, linkedin = ?,
            portfolio = ?, qualification = ?, projects_done = ?, company = ?, notice = ?,
            reason = ?, project_link = ?, ref1 = ?, ref2 = ?, ats_boost = ?, saved = 1
            " . ($resumeName ? ", resume_name = ?" : "") . "
            WHERE user_id = ?";
        $params = [
            $title, $exp, $salary, $curSalary, $skills, $about,
            $whatsapp, $curLoc, $desLoc, $marital, $linkedin,
            $portfolio, $qualification, $projectsDone, $company, $notice,
            $reason, $projectLink, $ref1, $ref2, $atsBoost
        ];
        if ($resumeName) $params[] = $resumeName;
        $params[] = $userId;
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    } else {
        $sql = "INSERT INTO profiles (
            user_id, title, exp, salary, cur_salary, skills, about, whatsapp,
            cur_location, des_location, marital, linkedin, portfolio, qualification,
            projects_done, company, notice, reason, project_link, ref1, ref2,
            resume_name, ats_boost, saved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $userId, $title, $exp, $salary, $curSalary, $skills, $about, $whatsapp,
            $curLoc, $desLoc, $marital, $linkedin, $portfolio, $qualification,
            $projectsDone, $company, $notice, $reason, $projectLink, $ref1, $ref2,
            $resumeName, $atsBoost
        ]);
    }

    logActivityDB("<b>{$name}</b> updated their profile.");
    jsonSuccess([], 'Profile saved successfully.');
}

jsonError('Invalid action specified.');
