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
$password = isset($_GET['password']) ? $_GET['password'] : null; 
$email = isset($_GET['email']) ? $_GET['email'] : null;
$current_time = date('Y-m-d H:i:s');

if (!$username || !$password || !$email) {
    http_response_code(400);
    die(json_encode(["error" => "Username, password, and email are required."]));
}

// Hash the password before inserting it into the database
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$sql = "INSERT INTO users (username, password, validation, email, login_times) VALUES (?, ?, 0, ?, ?)";
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
