// 保存公告內容到伺服器
function saveAnnouncements() {
    const titles = document.querySelectorAll('.title');
    const messages = document.querySelectorAll('.message');
    const links = document.querySelectorAll('.link');

    const announcements = [];

    // 取出所有公告內容
    titles.forEach((title, index) => {
        announcements.push({
            title: title.innerText,
            message: messages[index].innerText,
            link: links[index].innerText
        });
    });

    console.log('要保存的公告:', announcements); // 日誌記錄

    // 使用 AJAX 發送公告內容到伺服器
    fetch('save_announcement.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ announcements })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('公告已保存！');
        } else {
            alert('保存失敗，請稍後再試。');
        }
    })
    .catch(error => console.error('Error:', error));
}