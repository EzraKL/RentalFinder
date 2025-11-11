<?php
// API Headers for JSON output and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Added Authorization header
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once 'db_connect.php';
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);


// This function simulates getting the user ID from a token sent by React.
function getUserIdFromToken() {
  
    return 1; 
}


switch ($method) {
    case 'GET':
        // --- READ WITH FILTERING AND AUTHORIZATION CHECK ---
        $where = ['is_available = TRUE'];
        $params = [];
        
        // Check for Query Parameters (Filters)
        $location = $_GET['location'] ?? '';
        $min_price = $_GET['min_price'] ?? '';
        $max_price = $_GET['max_price'] ?? '';

        if (!empty($location)) {
            $where[] = "location LIKE ?";
            $params[] = "%$location%";
        }
        
        if (!empty($min_price) && is_numeric($min_price)) {
            $where[] = "price >= ?";
            $params[] = $min_price;
        }

        if (!empty($max_price) && is_numeric($max_price)) {
            $where[] = "price <= ?";
            $params[] = $max_price;
        }

        // Construct the final SQL query
        $sql = 'SELECT id, title, location, price, type, description, image_url, user_id FROM listings '; // Added user_id to SELECT
        if (!empty($where)) {
            $sql .= 'WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC';

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Could not fetch listings: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        // --- CREATE (Requires User ID) ---
        $currentUserId = getUserIdFromToken();
        if (!$currentUserId) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'Authentication required.']); break; }

        if (empty($data['title']) || empty($data['location']) || empty($data['price'])) {
            http_response_code(400); 
            echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
            break;
        }
        
        $title = filter_var($data['title'], FILTER_SANITIZE_STRING);
        $location = filter_var($data['location'], FILTER_SANITIZE_STRING);
        $price = filter_var($data['price'], FILTER_VALIDATE_FLOAT);
        $type = filter_var($data['type'] ?? 'Apartment', FILTER_SANITIZE_STRING);
        $description = filter_var($data['description'] ?? '', FILTER_SANITIZE_STRING);
        $image_url = filter_var($data['image_url'] ?? 'https://picsum.photos/id/1/400/300', FILTER_SANITIZE_URL);

        try {
            // Insert the current user's ID along with the listing data
            $sql = "INSERT INTO listings (user_id, title, location, price, type, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$currentUserId, $title, $location, $price, $type, $description, $image_url]);
            
            echo json_encode(['success' => true, 'message' => 'Listing added successfully.']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database insert failed: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // --- UPDATE (Requires Authorization) ---
        $currentUserId = getUserIdFromToken();
        $listingId = $data['id'] ?? null;
        if (!$currentUserId || !$listingId || empty($data['title']) || empty($data['price'])) { 
            http_response_code(401); echo json_encode(['success' => false, 'error' => 'Authentication or required fields missing.']); break; 
        }

        // 1. Authorization Check: Verify ownership
        $checkSql = "SELECT user_id FROM listings WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$listingId]);
        $owner = $checkStmt->fetchColumn();

        if (!$owner || $owner != $currentUserId) {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'error' => 'Unauthorized: You do not own this listing.']);
            break;
        }
        
        // 2. Proceed with UPDATE
        try {
            $sql = "UPDATE listings SET title=?, location=?, price=?, type=?, description=?, image_url=? WHERE id=? AND user_id=?"; 
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                filter_var($data['title'], FILTER_SANITIZE_STRING),
                filter_var($data['location'], FILTER_SANITIZE_STRING),
                filter_var($data['price'], FILTER_VALIDATE_FLOAT),
                filter_var($data['type'], FILTER_SANITIZE_STRING),
                filter_var($data['description'], FILTER_SANITIZE_STRING),
                filter_var($data['image_url'], FILTER_SANITIZE_URL),
                $listingId,
                $currentUserId 
            ]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Listing updated successfully.']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Listing not found or no changes made.']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database update failed.']);
        }
        break;

    case 'DELETE':
        // --- DELETE (Requires Authorization) ---
        $currentUserId = getUserIdFromToken();
        $listingId = $data['id'] ?? null;
        if (!$currentUserId || !$listingId) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'Authentication or ID missing.']); break; }

        // Authorization Check: Verify ownership
        $checkSql = "SELECT user_id FROM listings WHERE id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$listingId]);
        $owner = $checkStmt->fetchColumn();

        if (!$owner || $owner != $currentUserId) {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'error' => 'Unauthorized: You do not own this listing.']);
            break;
        }

        // Proceed with DELETE
        try {
            $sql = "DELETE FROM listings WHERE id = ? AND user_id = ?"; 
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$listingId, $currentUserId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Listing deleted successfully.']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Listing not found.']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database deletion failed.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
        break;
}
?>
