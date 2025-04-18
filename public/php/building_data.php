<?php
// Set appropriate headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set resource limits
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "teias_db";

// Get parameters with defaults
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10000000000000;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$dataName = isset($_GET['dataName']) ? $_GET['dataName'] : 'bina_genel_bilgi_processed';

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

try {
    // Prepare and execute the query
    $sql = "SELECT * FROM `$dataName` LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("ii", $limit, $offset);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    // Return the data as JSON
    echo json_encode($data);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    // Close resources
    if (isset($stmt)) {
        $stmt->close();
    }
    $conn->close();
}
?>