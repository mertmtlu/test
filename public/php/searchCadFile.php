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

// Validate required parameters
if (!$areaID || !$tmID || !$type) {
    echo json_encode([
        'success' => false,
        'files' => null, 
        'error' => 'Missing required parameters (areaID, tmID, type)'
    ]);
    exit;
}

// Construct the directory path
$directoryPath = __DIR__ . "/cadFiles";

// Check if the directory exists
if (!is_dir($directoryPath)) {
    echo json_encode([
        'success' => false,
        'files' => null, 
        'error' => 'CAD files directory not found'
    ]);
    exit;
}

// Get all files in the directory
$files = scandir($directoryPath);
$matchedFiles = [];

// Build the pattern to match files (for both DWG and PDF)
if ($preference) {
    $basePattern = "/TEI-B{$areaID}-TM-{$tmID}-{$type}.*{$preference}.*/i";
} else {
    $basePattern = "/TEI-B{$areaID}-TM-{$tmID}-{$type}.*/i";
}

// Loop through files and match the pattern
foreach ($files as $file) {
    if ($file === "." || $file === "..") {
        continue;
    }
    
    // Check if the file is a DWG or PDF and matches the pattern
    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (($extension === 'dwg' || $extension === 'pdf') && preg_match($basePattern, $file)) {
        $filePath = $directoryPath . '/' . $file;
        $fileInfo = [
            'name' => $file,
            'path' => $filePath,
            'url' => 'cadFiles/' . $file,  // Relative URL for frontend
            'size' => filesize($filePath),
            'extension' => $extension,
            'modified' => date('Y-m-d H:i:s', filemtime($filePath))
        ];
        
        $matchedFiles[] = $fileInfo;
    }
}

// Check if any files were found
if (empty($matchedFiles)) {
    echo json_encode([
        'success' => false,
        'files' => [], 
        'error' => 'No CAD or PDF files found matching the criteria'
    ]);
} else {
    // Sort files by name
    usort($matchedFiles, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    echo json_encode([
        'success' => true,
        'files' => $matchedFiles,
        'count' => count($matchedFiles),
        'types' => array_unique(array_column($matchedFiles, 'extension'))
    ]);
}
?>