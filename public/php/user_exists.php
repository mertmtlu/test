<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "teias_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$username = isset($_GET['username']) ? $_GET['username'] : null;

if (!$username) {
    http_response_code(400);
    die(json_encode(["error" => "Username is required."]));
}

// Prepare the SQL statement to check if the username exists
$sql = "SELECT 1 FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    die(json_encode(["error" => "Failed to prepare statement: " . $conn->error]));
}

$stmt->bind_param("s", $username);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        // Username exists
        echo json_encode(["status" => "success", "message" => "Username exists", "exists" => true]);
    } else {
        // Username does not exist
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Username does not exist", "exists" => false]);
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error executing query: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
