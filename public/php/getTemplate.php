<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('memory_limit', '512M'); 
ini_set('max_execution_time', 300); 

$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "teias_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT content FROM templates WHERE name = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $name);

$name = $_GET['name'];  // Get the name from the request
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo $row['content'];
} else {
    echo "No record found";
}

$stmt->close();
$conn->close();
?>