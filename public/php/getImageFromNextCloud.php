<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$area_id = isset($_GET['area_id']) ? $_GET['area_id'] : null;
$center_id = isset($_GET['center_id']) ? $_GET['center_id'] : null;
$email = 'mertmtl0109@gmail.com';
$password = 'Mm-41789';
$connection_ip = '144.122.102.147';

if (!$area_id || !$center_id) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// Format the TM number string
$tm_no_str = sprintf("%02d-%02d", $area_id, $center_id);

// Define both possible file paths
$file_paths = [
    "CALISMA/NM/NM_Alternatif_TM_Final_Risk/{$area_id}.Bolge/final_map/{$tm_no_str}map.png",
    "CALISMA/NM/NM_Alternatif_TM_Final_Risk/{$area_id}.Bolge/final_map/TM-{$tm_no_str}map.png"
];

$found_file = false;
$final_url = '';

// Check each path until we find an existing file
foreach ($file_paths as $file_path) {
    $url = "http://{$connection_ip}:8080/remote.php/dav/files/{$email}/{$file_path}";
    
    // Check if file exists
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, "{$email}:{$password}");
    curl_setopt($ch, CURLOPT_HEADER, true);

    $head_response = curl_exec($ch);
    $head_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($head_http_code === 200) {
        $found_file = true;
        $final_url = $url;
        break;
    }
}

// If no file was found in any location
if (!$found_file) {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'File not found in any location',
        'status' => 404,
        'checked_paths' => $file_paths
    ]);
    exit;
}

// Fetch the found file
$ch = curl_init($final_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_USERPWD, "{$email}:{$password}");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: */*',
    'Cache-Control: no-cache'
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

if ($http_code !== 200) {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Failed to fetch image',
        'status' => $http_code
    ]);
    exit;
}

// Set the correct content type and output the image
header('Content-Type: ' . ($content_type ?: 'image/png'));
echo $response;

curl_close($ch);
?>