
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否登入
    loggedIn = checkLoginStatus();

    // 如果已登入，啟用編輯功能
    if (loggedIn) {
        enableEditing();
    }
});

// 假設一個函數用來檢查使用者是否已登入
function checkLoginStatus() {
    // 這裡可以使用真實的後端檢查
    // return true; // 假設已登入
    return true;  // 測試用，假設使用者已登入
}

let loggedIn = false;  // 模擬登入狀態

// 模擬登入後啟用編輯功能
function enableEditing() {
    if (loggedIn) {
        const titles = document.querySelectorAll('.title');
        const messages = document.querySelectorAll('.message');
        const links = document.querySelectorAll('.link');

        // 設置所有公告元素為可編輯
        titles.forEach(title => title.setAttribute('contenteditable', 'true'));
        messages.forEach(message => message.setAttribute('contenteditable', 'true'));
        links.forEach(link => link.setAttribute('contenteditable', 'true'));

        // 顯示新增及保存按鈕
        document.getElementById('add-announcement-btn').style.display = 'block';
        document.getElementById('save-announcement-btn').style.display = 'block';
    }
}

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
        alert('公告已保存！');
    })
    .catch(error => console.error('Error:', error));
}

// 動態新增一個公告
function addAnnouncement() {
    const announcementsContainer = document.querySelector('.announcements');
    const newAnnouncement = document.createElement('div');
    newAnnouncement.className = 'announcement';
    newAnnouncement.innerHTML = `
        <h2 contenteditable="true" class="title">新公告標題</h2>
        <p contenteditable="true" class="message">新公告內容</p>
        <a href="#" contenteditable="true" class="link">新超連結</a>
    `;
    announcementsContainer.appendChild(newAnnouncement);
}
