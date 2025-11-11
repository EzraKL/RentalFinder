<?php

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE'); 
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit();
}

require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'All fields are required.']);
    exit();
}

$username = filter_var($data['username'], FILTER_SANITIZE_STRING);
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$password = $data['password']; // Raw password
$role = filter_var($data['role'] ?? 'tenant', FILTER_SANITIZE_STRING);

// 1. Hash the password securely
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    $sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$username, $email, $hashedPassword, $role]);

    echo json_encode(['success' => true, 'message' => 'Registration successful. Please log in.']);
} catch (\PDOException $e) {
    // 1062 is the SQL error code for Duplicate entry (unique constraint violation)
    if ($e->getCode() === '23000' && strpos($e->getMessage(), '1062') !== false) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'Username or Email already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Registration failed.']);
    }
}
?>
