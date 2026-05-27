<?php
// PHP Script to handle high-performance direct image uploads for Hostinger Shared Hosting
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Submissão inválida.']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Nenhum arquivo enviado ou erro no upload.']);
    exit;
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 10 * 1024 * 1024; // 10MB

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP).']);
    exit;
}

if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'O arquivo é muito grande. Tamanho máximo permitido: 10MB.']);
    exit;
}

// Ensure "uploads" directory exists
$uploadDir = __DIR__ . '/uploads';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Falha ao criar o diretório de destino. Verifique as permissões de gravação da pasta.']);
        exit;
    }
}

// Generate unique filename
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if (empty($ext)) {
    $ext = 'jpg';
}
$newFilename = md5(uniqid(rand(), true)) . '.' . strtolower($ext);
$destination = $uploadDir . '/' . $newFilename;

if (move_uploaded_file($file['tmp_name'], $destination)) {
    // Generate relative url
    $relativeUrl = 'uploads/' . $newFilename;
    echo json_encode([
        'success' => true,
        'url' => $relativeUrl
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Não foi possível mover o arquivo para a pasta uploads.']);
}
