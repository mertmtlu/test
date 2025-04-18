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

$token = isset($_GET['token']) ? $_GET['token'] : null;
$password = isset($_GET['password']) ? $_GET['password'] : null; 

if (!$token || !$password) {
    http_response_code(400);
    die(json_encode(["error" => "Password is required."]));
}

// Hash the password before inserting it into the database
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$sql = "UPDATE users SET password = ? WHERE token = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    die(json_encode(["error" => "Failed to prepare statement: " . $conn->error]));
}

// Bind all 4 parameters: username, hashedPassword, email, current_time
$stmt->bind_param("ssss", $username, $hashedPassword, $email, $current_time);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "User added to users table"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error inserting user: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
