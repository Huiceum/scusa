<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $announcements = $_POST['announcements'];

    // 儲存到檔案
    if (file_put_contents('announcements.json', $announcements) !== false) {
        echo json_encode(['status' => 'success', 'message' => '公告已成功儲存']);
    } else {
        echo json_encode(['status' => 'error', 'message' => '儲存公告失敗']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists('announcements.json')) {
        header('Content-Type: application/json');
        echo file_get_contents('announcements.json');
    } else {
        echo json_encode([]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => '無效的請求']);
}
?>
