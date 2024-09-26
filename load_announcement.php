<?php
// 開啟存儲公告內容的文件
$file = fopen('announcements.txt', 'r');

// 讀取檔案的標題和訊息
$title = fgets($file);  // 讀取標題
$message = fgets($file); // 讀取公告內容
fclose($file);

// 將讀取的公告內容以 JSON 格式回傳給前端
echo json_encode(['title' => $title, 'message' => $message]);
?>
