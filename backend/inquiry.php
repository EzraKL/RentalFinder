<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once 'db_connect.php';

// MOCKED AUTH: Assuming the user is logged in
function getCurrentTenantId() {
    return 2; // Replace with actual token validation to get tenant ID!
}

$data = json_decode(file_get_contents('php://input'), true);
$tenantId = getCurrentTenantId(); 

if (!$tenantId) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'Login required to submit inquiry.']); exit(); }

// 1. Check for NEW required fields
if (empty($data['listing_id']) || empty($data['contact_phone']) || empty($data['contact_email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Listing ID, phone, and email are required.']);
    exit();
}

$listingId = filter_var($data['listing_id'], FILTER_VALIDATE_INT);
$phone = filter_var($data['contact_phone'], FILTER_SANITIZE_STRING);
$email = filter_var($data['contact_email'], FILTER_VALIDATE_EMAIL);
$time = filter_var($data['preferred_time'] ?? 'Anytime', FILTER_SANITIZE_STRING);

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email format.']);
    exit();
}

try {
    // Check if the listing exists (optional but good practice)
    $checkSql = "SELECT id FROM listings WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$listingId]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Listing not found.']);
        exit();
    }
    
    // 2. Insert the inquiry with explicit contact details
    $sql = "INSERT INTO inquiries (listing_id, tenant_id, contact_phone, contact_email, preferred_time) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$listingId, $tenantId, $phone, $email, $time]);

    echo json_encode(['success' => true, 'message' => 'Contact request sent! The poster will reach out to you directly.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Contact request failed.']);
}
?>