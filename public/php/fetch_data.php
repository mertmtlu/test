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

// Get version from URL parameter - defaults to current if not specified
$version = isset($_GET['version']) ? $_GET['version'] : 'tümü';
$teslim = isset($_GET['teslim']) ? $_GET['teslim'] : 'ilk';

// Map version parameter to actual database name
$dbVersions = [
    'tümü' => [
        'ilk' => 'teias_db_ilk_teslim',
        'nihai' => 'teias_db'
    ],
    'szl2' => [
        'ilk' => 'teias_db_szl2_ilk_teslim',
        'nihai' => 'teias_db_szl2_nihai_teslim'
    ],
    'szl3' => [
        'ilk' => 'teias_db_szl3_ilk_teslim',
        'nihai' => 'teias_db_szl3_nihai_teslim'
    ],
    // Add more versions as needed
];

// Determine which database to use
$dbname = isset($dbVersions[$version][$teslim]) ? $dbVersions[$version][$teslim] : "";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 1000; 
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0; 
$dataName = isset($_GET['dataName']) ? $_GET['dataName'] : '';


$sql = "SELECT * FROM `$dataName` LIMIT ? OFFSET ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $limit, $offset);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    $data = array();
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error executing query: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
