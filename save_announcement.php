<?php
// 設定 HTTP 標頭為 JSON
header('Content-Type: application/json');

// 獲取請求的原始資料
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// 檢查是否有公告內容
if (isset($data['announcements'])) {
    // 連接到資料庫（請根據您的設定更改連接資訊）
    $servername = "localhost";
    $username = "your_username";
    $password = "your_password";
    $dbname = "your_database";

    $conn = new mysqli($servername, $username, $password, $dbname);

    // 檢查資料庫連接
    if ($conn->connect_error) {
        echo json_encode(['status' => 'error', 'message' => '資料庫連接失敗']);
        exit();
    }

    // 準備 SQL 語句
    $stmt = $conn->prepare("INSERT INTO announcements (title, message, link) VALUES (?, ?, ?)");
    
    // 檢查 SQL 語句準備是否成功
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'SQL 語句準備失敗']);
        exit();
    }

    // 逐個插入公告內容
    foreach ($data['announcements'] as $announcement) {
        $stmt->bind_param("sss", $announcement['title'], $announcement['message'], $announcement['link']);
        $stmt->execute();
    }

    // 關閉資料庫連接
    $stmt->close();
    $conn->close();

    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => '無效的資料']);
}
?>
