<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $announcements = $_POST['announcements'];

    // 儲存到檔案
    file_put_contents('announcements.json', $announcements);
    echo '成功儲存公告';
} else {
    echo '無效的請求';
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists('announcements.json')) {
        header('Content-Type: application/json');
        echo file_get_contents('announcements.json');
    } else {
        echo json_encode([]);
    }
}

?>

