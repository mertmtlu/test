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

// Get the parameters from the request
$areaID = isset($_GET['areaID']) ? $_GET['areaID'] : null;
$tmID = isset($_GET['tmID']) ? $_GET['tmID'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : null;
$preference = isset($_GET['preference']) ? $_GET['preference'] : null;
$teslim = isset($_GET['teslim']) ? $_GET['teslim'] : "ilk";

if (!$areaID || !$tmID || !$type) {
    echo json_encode(['filePath' => null, 'error' => 'Missing parameters']);
    exit;
}

// Construct the directory path
$directoryPath = __DIR__ . ($teslim == "nihai" ? "/pdfs new/BOLGE-{$areaID}" : "/pdfs/BOLGE-{$areaID}");

// Check if the directory exists
if (!is_dir($directoryPath)) {
    echo json_encode(['filePath' => null, 'error' => 'Directory not found']);
    exit;
}

// Pattern to match the file (case insensitive)
$pattern = "/TEI-B{$areaID}-TM-{$tmID}-{$type}.*{$preference}.*\\.pdf$/i";

// Get all files in the directory
$files = scandir($directoryPath);

$matchedFile = null;

// Loop through files and match the pattern
foreach ($files as $file) {
    if (preg_match($pattern, $file)) {
        $matchedFile = $file;
        break;
    }
}

// Return the matched file path or null if not found
if ($matchedFile) {
    $loc = $teslim == "nihai" ? "pdfs new" : "pdfs";
    echo json_encode(['filePath' => "/{$loc}/BOLGE-{$areaID}/{$matchedFile}"]);
} else {
    echo json_encode(['filePath' => null, 'error' => 'File not found']);
}
?>