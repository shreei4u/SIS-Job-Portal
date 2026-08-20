<?php
/**
 * Shield Job Portal - Database & API Core Handler
 */

// Error handling settings
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

// Set JSON headers and CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start PHP Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load configuration
require_once __DIR__ . '/config.php';

/**
 * Get PDO Database Connection
 * @return PDO|null
 */
function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

/**
 * Return standardized JSON Success response
 */
function jsonSuccess($data = [], $message = 'Success') {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

/**
 * Return standardized JSON Error response
 */
function jsonError($message = 'An error occurred', $code = 400, $errors = []) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors' => $errors
    ]);
    exit;
}

/**
 * Parse JSON Request Body
 */
function getJsonBody() {
    $input = file_get_contents('php://input');
    if (!$input) {
        return $_POST;
    }
    $decoded = json_decode($input, true);
    return is_array($decoded) ? array_merge($_POST, $decoded) : $_POST;
}

/**
 * Retrieve currently authenticated user session
 */
function getAuthUser() {
    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        return $_SESSION['user'];
    }
    return null;
}

/**
 * Require user to be logged in
 */
function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        jsonError('Unauthorized. Please log in.', 401);
    }
    return $user;
}

/**
 * Require specific role or admin
 */
function requireRole($roles = []) {
    $user = requireAuth();
    if (!is_array($roles)) {
        $roles = [$roles];
    }
    $roles[] = 'admin'; // Admin has full privileges
    if (!in_array($user['role'], $roles)) {
        jsonError('Forbidden. You do not have permission to access this resource.', 403);
    }
    return $user;
}

/**
 * Log activity in activity_logs table
 */
function logActivityDB($text) {
    $db = getDB();
    if (!$db) return;
    try {
        $stmt = $db->prepare("INSERT INTO activity_logs (text) VALUES (?)");
        $stmt->execute([$text]);
    } catch (Exception $e) {}
}
