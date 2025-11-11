<?php
// Set headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST'); 
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once 'db_connect.php';

// MOCKED AUTH: Function to get the ID of the logged-in Poster
function getPosterId() {
  
    return 1; 
}

$posterId = getPosterId();

if (!$posterId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required for dashboard access.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // --- FETCH POSTER'S INQUIRIES ---
        try {
            // SQL query joins inquiries, listings (to check ownership), and users (to get tenant username)
            $sql = "SELECT 
                        i.id AS inquiry_id, 
                        i.contact_phone,        
                        i.contact_email,        
                        i.preferred_time,       
                        i.status, 
                        i.created_at, 
                        l.title AS listing_title,
                        l.location AS listing_location,
                        u.username AS tenant_username
                    FROM inquiries i
                    JOIN listings l ON i.listing_id = l.id
                    JOIN users u ON i.tenant_id = u.id
                    WHERE l.user_id = ? 
                    ORDER BY i.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$posterId]);
            $inquiries = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $inquiries]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to load inquiries.']);
        }
        break;

    case 'POST':
        // --- UPDATE INQUIRY STATUS (Mark as Contacted/Resolved) ---
        $data = json_decode(file_get_contents('php://input'), true);
        $inquiryId = $data['inquiry_id'] ?? null;
        $newStatus = $data['status'] ?? 'contacted'; 

        if (!$inquiryId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Inquiry ID is required for update.']);
            break;
        }

        try {
            // Update status only if the current poster owns the linked listing
            $sql = "UPDATE inquiries i
                    JOIN listings l ON i.listing_id = l.id
                    SET i.status = ? 
                    WHERE i.id = ? AND l.user_id = ?"; 
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$newStatus, $inquiryId, $posterId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Inquiry status updated successfully.']);
            } else {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Inquiry not found or unauthorized to update.']);
            }

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update inquiry status.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
        break;
}
?>
