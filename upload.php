<?php
/**
 * Shield Job Portal - File & CV Upload Handler
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'resume';
$db = getDB();

// Ensure upload directories exist
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}
if (!is_dir(RESUME_DIR)) {
    @mkdir(RESUME_DIR, 0755, true);
}
if (!is_dir(IMAGE_DIR)) {
    @mkdir(IMAGE_DIR, 0755, true);
}

// ------------------------------------------------------------------------
// 1. Upload Resume (PDF / DOC / DOCX max 5MB)
// ------------------------------------------------------------------------
if ($action === 'resume') {
    $user = requireAuth();
    $targetUserId = (isset($_POST['user_id']) && $user['role'] === 'admin') ? intval($_POST['user_id']) : $user['id'];

    if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No valid resume file was uploaded.');
    }

    $file = $_FILES['resume'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if ($file['size'] > $maxSize) {
        jsonError('File size exceeds maximum allowed size (5MB).');
    }

    $originalName = basename($file['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExts = ['pdf', 'doc', 'docx'];

    if (!in_array($ext, $allowedExts)) {
        jsonError('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
    }

    // Generate safe filename
    $safeName = 'resume_' . $targetUserId . '_' . time() . '.' . $ext;
    $destination = RESUME_DIR . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        jsonError('Failed to save uploaded file. Please check folder permissions.');
    }

    // Update profile in DB if available
    if ($db) {
        $stmt = $db->prepare("UPDATE profiles SET resume_name = ?, resume_path = ? WHERE user_id = ?");
        $stmt->execute([$originalName, $safeName, $targetUserId]);
    }

    logActivityDB("<b>{$user['name']}</b> uploaded a new resume: {$originalName}");

    jsonSuccess([
        'resume_name' => $originalName,
        'resume_path' => $safeName
    ], 'Resume uploaded successfully.');
}

// ------------------------------------------------------------------------
// 2. View / Download Stored Resume
// ------------------------------------------------------------------------
if ($action === 'view_resume') {
    $targetUserId = intval($_GET['user_id'] ?? 0);
    $user = getAuthUser();

    if (!$targetUserId && $user) {
        $targetUserId = $user['id'];
    }

    if (!$targetUserId) {
        header('HTTP/1.1 400 Bad Request');
        echo "User ID required.";
        exit;
    }

    if ($db) {
        $stmt = $db->prepare("SELECT resume_name, resume_path FROM profiles WHERE user_id = ?");
        $stmt->execute([$targetUserId]);
        $profile = $stmt->fetch();

        if ($profile && !empty($profile['resume_path'])) {
            $filePath = RESUME_DIR . $profile['resume_path'];
            if (file_exists($filePath)) {
                $ext = strtolower(pathinfo($profile['resume_name'], PATHINFO_EXTENSION));
                $contentTypes = [
                    'pdf' => 'application/pdf',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                $contentType = $contentTypes[$ext] ?? 'application/octet-stream';

                header('Content-Type: ' . $contentType);
                header('Content-Disposition: inline; filename="' . addslashes($profile['resume_name']) . '"');
                header('Content-Length: ' . filesize($filePath));
                readfile($filePath);
                exit;
            }
        }
    }

    header('HTTP/1.1 404 Not Found');
    echo "Resume file not found on server.";
    exit;
}

// ------------------------------------------------------------------------
// 3. Upload Site Image (Logo / Banner - Admin Only)
// ------------------------------------------------------------------------
if ($action === 'image') {
    $user = requireRole('admin');

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No image file was uploaded.');
    }

    $file = $_FILES['image'];
    $maxSize = 4 * 1024 * 1024; // 4MB

    if ($file['size'] > $maxSize) {
        jsonError('Image exceeds maximum allowed size (4MB).');
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

    if (!in_array($ext, $allowedExts)) {
        jsonError('Invalid image format. Allowed: JPG, PNG, WEBP, SVG.');
    }

    $safeName = 'media_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $destination = IMAGE_DIR . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        jsonError('Failed to save image.');
    }

    $url = 'uploads/images/' . $safeName;
    jsonSuccess(['url' => $url], 'Image uploaded successfully.');
}

jsonError('Invalid upload action.');
