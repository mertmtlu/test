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
$login = isset($_GET['login']) ? $_GET['login'] : null;

if (!$username || !$password) {
    http_response_code(400);
    die(json_encode(["error" => "Username and password are required."]));
}

// Prepare the SQL statement to retrieve hashed password and validation status
$sql = "SELECT password, validation, login_times FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    die(json_encode(["error" => "Failed to prepare statement: " . $conn->error]));
}

$stmt->bind_param("s", $username);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        // User found, fetch hashed password, validation status, and login_times
        $row = $result->fetch_assoc();
        $hashedPassword = $row['password'];
        $validation = $row['validation'];
        $currentLoginTimes = $row['login_times'];

        // Check if the user is validated
        if ($validation != 1) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Account is not validated."]);
            exit;
        }

        // Verify the plaintext password with the hashed password
        if (password_verify($password, $hashedPassword)) {

            if ($login == "login") {
                // Append the new login time
                $current_time = date('Y-m-d H:i:s');
                $updatedLoginTimes = ($currentLoginTimes ? $currentLoginTimes . ';' : '') . $current_time;
    
                // Update the login_times column for the user
                $updateSql = "UPDATE users SET login_times = ? WHERE username = ?";
                $updateStmt = $conn->prepare($updateSql);
    
                if ($updateStmt) {
                    $updateStmt->bind_param("ss", $updatedLoginTimes, $username);
                    if ($updateStmt->execute()) {
                        echo json_encode(["status" => "success", "message" => "Login successful", "exists" => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Failed to update login times: " . $updateStmt->error]);
                    }
                    $updateStmt->close();
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to prepare update statement: " . $conn->error]);
                }
            }
            else {
                echo json_encode(["status" => "success", "message" => "Login successful", "exists" => true]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid username or password", "exists" => false]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid username or password", "exists" => false]);
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error executing query: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
