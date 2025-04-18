<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Include Composer's autoloader

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "teias_db";

// Database Connection
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Validate Username
$username = isset($_GET['username']) ? $_GET['username'] : null;

if (!$username) {
    http_response_code(400);
    die(json_encode(["error" => "Username is required."]));
}

// Fetch User Details
$sql = "SELECT id, email FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(400);
    die(json_encode(["error" => "Username not found."]));
}

$user = $result->fetch_assoc();
$userId = $user['id'];
$email = $user['email'];

// Generate Reset Token
$token = bin2hex(random_bytes(32));
$expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

$sql = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $token, $expiry, $userId);

if (!$stmt->execute()) {
    http_response_code(500);
    die(json_encode(["error" => "Failed to generate reset token."]));
}

$resetLink = "http://" . $_SERVER['SERVER_ADDR'] . "/reset-password.php?token=" . $token;

// PHPMailer Configuration
$mail = new PHPMailer(true);

try {
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'mertmtl0109@gmail.com'; 
    $mail->Password = 'rfee vbrv hidw lmrb'; 
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    // Email Details
    $mail->setFrom('mertmtl0109@gmail.com', 'TEİAŞ');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = 'Şifre Sıfırlama İsteği';
    $mail->Body = "
        <html>
        <body>
            <h2>Merhaba</h2>
            <p>Şifrenizi sıfırlama talebinde bulundunuz. Sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <p><a href='$resetLink'>Şifreyi Sıfırla</a></p>
            <p>Bunu siz talep etmediyseniz, lütfen bu e-postayı dikkate almayın.</p>
            <p>Bu bağlantı 1 saat içinde sona erecek.</p>
        </body>
        </html>
    ";

    // Send Email
    $mail->send();

    echo json_encode([
        "status" => "success",
        "message" => "Password reset link sent to your email.",
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Could not send email. Error: " . $mail->ErrorInfo
    ]);
}

// Close Connections
$stmt->close();
$conn->close();
?>