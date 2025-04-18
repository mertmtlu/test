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
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        die(json_encode(["status" => "error", "message" => "Invalid JSON input."]));
    }

    $name = $conn->real_escape_string($data['name']);
    $content = $conn->real_escape_string($data['content']);
    $images = $conn->real_escape_string(json_encode($data['images']));

    // Check if the report already exists
    $sql_check = "SELECT * FROM raports WHERE name = '$name' LIMIT 1";
    $result_check = $conn->query($sql_check);

    if ($result_check->num_rows > 0) {
        $row = $result_check->fetch_assoc();
        // Report exists, present the options
        echo json_encode([
            "status" => "exists",
            "message" => "Bu raport zaten mevcut. Değiştirmek istediğinize emin misiniz?",
            "data" => $row  // Return existing data for the 'view' option
        ]);

        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'alter':
                    // Update the existing report
                    $sql_update = "UPDATE raports SET content = '$content', images = '$images' WHERE name = '$name'";
                    if ($conn->query($sql_update) === TRUE) {
                        echo json_encode([
                            "status" => "success",
                            "message" => "Report updated successfully."
                        ]);
                    } else {
                        echo json_encode([
                            "status" => "error",
                            "message" => "Error updating report: " . $conn->error
                        ]);
                    }
                    break;

                case 'view':
                    // Return the existing data
                    echo json_encode([
                        "status" => "success",
                        "message" => "Report data retrieved successfully.",
                        "data" => $row
                    ]);
                    break;

                case 'exit':
                    // Do nothing, just exit
                    echo json_encode([
                        "status" => "success",
                        "message" => "User chose to exit."
                    ]);
                    break;
            }
        }
    } else {
        // Insert new report
        $sql_insert = "INSERT INTO raports (name, content, images) VALUES ('$name', '$content', '$images')";
        if ($conn->query($sql_insert) === TRUE) {
            echo json_encode([
                "status" => "success",
                "message" => "Report added successfully."
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Error adding report: " . $conn->error
            ]);
        }
    }
}

$conn->close();
?>
