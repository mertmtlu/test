<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "teias_db";

// Establish database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Initialize variables
$token = isset($_GET['token']) ? $_GET['token'] : null;
$error = '';
$success = '';

// Check if token is present
if (!$token) {
    $error = "Geçersiz bağlantı.";
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $token = $_POST['token'] ?? '';

    // Server-side validation
    if (empty($new_password) || strlen($new_password) < 8) {
        $error = "Şifre en az 8 karakter olmalıdır.";
    } elseif ($new_password !== $confirm_password) {
        $error = "Şifreler eşleşmiyor.";
    } else {
        // Validate and use the token to find the user
        $now = date('Y-m-d H:i:s');
        $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?");
        $stmt->bind_param("ss", $token, $now);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Token is valid, get the user
            $row = $result->fetch_assoc();
            $user_id = $row['id'];

            // Hash the new password
            $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

            // Update user's password
            $update_stmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
            $update_stmt->bind_param("si", $hashed_password, $user_id);

            if ($update_stmt->execute()) {
                $success = "Şifreniz başarıyla sıfırlandı. Bu sayfayı kapatabilirsiniz.";
            } else {
                $error = "Şifre sıfırlama işlemi başarısız oldu.";
            }
        } else {
            $error = "Geçersiz bağlantı.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Şifre Sıfırlama</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .login-container {
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 100%;
            max-width: 400px;
        }

        h1 {
            text-align: center;
            color: #333;
        }

        label {
            display: block;
            margin-top: 15px;
            font-weight: bold;
            color: #555;
        }

        input {
            width: 93%;
            padding: 12px;
            margin-top: 5px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 14px;
        }

        input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }

        button {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
        }

        button:hover {
            background-color: #0056b3;
        }

        .error-message {
            color: red;
            font-size: 12px;
            margin-top: -5px;
            margin-bottom: 10px;
        }

        .toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #f44336;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: none;
            z-index: 1000;
        }

        .toast.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>TEİAŞ</h1>

        <?php if (!empty($error)): ?>
            <div id="toast" class="toast show">
                <p id="toastMessage"><?php echo htmlspecialchars($error); ?></p>
            </div>
        <?php endif; ?>

        <?php if (!empty($success)): ?>
            <div id="toast" class="toast show" style="background-color: #4CAF50;">
                <p id="toastMessage"><?php echo htmlspecialchars($success); ?></p>
            </div>
        <?php endif; ?>

        <?php if (empty($success)): ?>
            <form id="resetPasswordForm" method="POST">
                <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                
                <label for="new_password">Yeni Şifre</label>
                <input 
                    type="password" 
                    id="new_password"
                    name="new_password" 
                    placeholder="Yeni Şifrenizi Girin" 
                    required 
                    minlength="8"
                >
                <div id="newPasswordError" class="error-message">Şifre en az 8 karakter olmalıdır.</div>
                
                <label for="confirm_password">Şifreyi Onayla</label>
                <input 
                    type="password" 
                    id="confirm_password"
                    name="confirm_password" 
                    placeholder="Yeni Şifrenizi Onaylayın" 
                    required 
                    minlength="8"
                >
                <div id="confirmPasswordError" class="error-message">Şifreler eşleşmiyor.</div>
                
                <button type="submit">Şifreyi Sıfırla</button>
            </form>
        <?php endif; ?>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('resetPasswordForm');
        const newPasswordInput = document.getElementById('new_password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        const newPasswordError = document.getElementById('newPasswordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');

        // Hide error messages initially
        newPasswordError.style.display = 'none';
        confirmPasswordError.style.display = 'none';

        // Validation functions
        function validateNewPassword() {
            if (newPasswordInput.value.length < 8) {
                newPasswordError.style.display = 'block';
                return false;
            }
            newPasswordError.style.display = 'none';
            return true;
        }

        function validateConfirmPassword() {
            if (newPasswordInput.value !== confirmPasswordInput.value) {
                confirmPasswordError.style.display = 'block';
                return false;
            }
            confirmPasswordError.style.display = 'none';
            return true;
        }

        // Add event listeners
        newPasswordInput.addEventListener('input', validateNewPassword);
        confirmPasswordInput.addEventListener('input', function() {
            validateNewPassword();
            validateConfirmPassword();
        });

        // Form submission validation
        form.addEventListener('submit', function(e) {
            let isValid = validateNewPassword() && validateConfirmPassword();
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
    </script>
</body>
</html>