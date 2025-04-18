<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Optimize memory and execution time limits
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

// Database connection details
$servername = "localhost";
$username = "root"; 
$password = ""; 
$dbname = "teias_db";

// Create a new MySQLi connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the connection
if ($conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $conn->connect_error
    ]));
}

// Handle the POST request
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Check if 'name' is provided in the POST request
    if (!isset($_POST['name']) || empty($_POST['name'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Missing or empty 'name' parameter"
        ]);
        exit;
    }

    // Escape the 'name' input to prevent SQL injection
    $name = $conn->real_escape_string($_POST['name']);

    // Query to check if the image exists by name
    $sql = "SELECT 1 FROM images WHERE name = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        // Bind parameters and execute the query
        $stmt->bind_param('s', $name);
        $stmt->execute();
        $stmt->store_result();

        // Check if any row exists with the given name
        if ($stmt->num_rows > 0) {
            echo json_encode([
                "status" => "success",
                "message" => "Image exists"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Image not found"
            ]);
        }

        $stmt->close(); // Close the prepared statement
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to prepare the SQL statement"
        ]);
    }
}

// Close the database connection
$conn->close();
?>
