<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 接收公告的 JSON 數據
    $data = json_decode(file_get_contents('php://input'), true);

    // 取出公告陣列
    $announcements = $data['announcements'];

    // 開啟檔案寫入模式，保存公告
    $file = fopen('announcements.txt', 'w');
    foreach ($announcements as $announcement) {
        fwrite($file, "Title: " . $announcement['title'] . "\n");
        fwrite($file, "Message: " . $announcement['message'] . "\n");
        fwrite($file, "Link: " . $announcement['link'] . "\n");
        fwrite($file, "-----\n");
    }
    fclose($file);

    // 返回成功的回應
    echo json_encode(<?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // 接收公告的 JSON 數據
        $data = json_decode(file_get_contents('php://input'), true);
    
        // 確保數據存在
        if (isset($data['announcements'])) {
            $announcements = $data['announcements'];
    
            // 開啟檔案寫入模式，保存公告
            $file = fopen('announcements.txt', 'w');
            if ($file) {
                foreach ($announcements as $announcement) {
                    fwrite($file, "Title: " . $announcement['title'] . "\n");
                    fwrite($file, "Message: " . $announcement['message'] . "\n");
                    fwrite($file, "Link: " . $announcement['link'] . "\n");
                    fwrite($file, "-----\n");
                }
                fclose($file);
                // 返回成功的回應
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => '無法打開檔案。']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => '未提供公告數據。']);
        }
    }
    ?>
    ['status' => 'success']);
}
?>
