// script.js (for account.html)
document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('user');
    const randomCode = sessionStorage.getItem('randomCode');
    
    const loadingMessage = document.getElementById('loadingMessage');
    const timeoutMessage = document.getElementById('timeoutMessage');
    const profileInfoContainer = document.getElementById('profileInfoContainer');
    const userAvatar = document.getElementById('userAvatar');
    const userNickname = document.getElementById('userNickname');
    const userSubtitle = document.getElementById('userSubtitle');
    const userEmail = document.getElementById('userEmail');
    const userIntro = document.getElementById('userIntro');

    // 獲取編輯按鈕元素
    const editProfileBtn = document.getElementById('editProfileBtn');

    // Google 試算表 ID 和 URL (更改為 JSON 輸出格式)
    const pollingSheetId = '1HfaCNcfYpbBWdZWUe6Tk5I-OFKnvBxerF-_wDsXjtLU';
    const pollingUrl = `https://docs.google.com/spreadsheets/d/${pollingSheetId}/gviz/tq?tqx=out:json`;
    
    const pollingInterval = 1000;
    const maxPollingAttempts = 15;
    let pollingAttempts = 0;
    let pollingTimerId;
    let userProfileFound = false; // 此變數仍用於控制輪詢停止

    // --- 輔助函數：顯示用戶資料 ---
    function displayUserProfile(data) {
        userAvatar.src = data.avatarUrl || 'user.png';
        userNickname.textContent = data.nickname || '匿名用戶';
        userSubtitle.textContent = user; // 顯示 sessionStorage 的 user，包含 #

        let emailText = data.email || '';
        if (!emailText) {
            const cleanUserPart = user.replace(/^#/, '').split('#')[0];
            emailText = `${cleanUserPart}@scu.edu.tw`;
        }
        userEmail.textContent = `電子信箱：${emailText}`;
        // 自我介紹：直接顯示原始內容，CSS white-space: pre-wrap; 會處理換行
        userIntro.textContent = data.introduction || '尚未填寫自我介紹。';

        loadingMessage.style.display = 'none';
        profileInfoContainer.classList.add('show');
        console.log('成功顯示用戶資料！');
    }

    // --- 輔助函數：儲存用戶資料到 sessionStorage ---
    function saveUserProfileToSessionStorage(data) {
        sessionStorage.setItem('avatarUrl', data.avatarUrl || '');
        sessionStorage.setItem('email', data.email || '');
        sessionStorage.setItem('nickname', data.nickname || '');
        sessionStorage.setItem('introduction', data.introduction || '');
        sessionStorage.setItem('avatar', data.avatarUrl || ''); // 改為 'avatar'
        console.log('用戶資料已儲存到 sessionStorage。');
    }

    // --- 輔助函數：發送數據到第二個 Google 表單 ---
    function sendToSecondGoogleForm(user, randomCode) {
        const secondGoogleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfpWwjRV_ux9E6Mfab7X_ubPVSaeUWt-bbcwsZOxG3DB9xjKw/formResponse';
        const secondFormData = new FormData();
        secondFormData.append('entry.306049006', user);
        secondFormData.append('entry.853544611', randomCode);

        fetch(secondGoogleFormUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: secondFormData
        })
        .then(() => {
            console.log('數據已在背景傳送至第二個 Google 表單 (用戶資料找到)。');
        })
        .catch(error => {
            console.error('傳送第二個 Google 表單時發生錯誤:', error);
        });
    }

    // --- 1. 檢查 sessionStorage 中的 user 和 randomCode 變數 (保留) ---
    if (!user || !randomCode) {
        console.log('sessionStorage中的user或randomCode缺失，導向到 login.html');
        window.location.href = 'login.html';
        return;
    }

    // --- 2. 如果存在，則將變數寄送到第一個 Google 表單 (保留) ---
    const firstGoogleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeLoZ0kw6CGcEhmk8iHuJy4taEfV3IMWGJo3WZ4FwhqMbYppw/formResponse';
    const firstFormData = new FormData();
    firstFormData.append('entry.1923465276', user);
    firstFormData.append('entry.37724537', randomCode);

    fetch(firstGoogleFormUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: firstFormData
    })
    .then(() => {
        console.log('數據已在背景傳送至第一個 Google 表單 (初始載入)。');
    })
    .catch(error => {
        console.error('傳送第一個 Google 表單時發生錯誤:', error);
    });

    // --- 3. 移除之前檢查 sessionStorage 中是否已經有完整用戶資料的區塊 ---
    // const storedAvatarUrl = sessionStorage.getItem('avatarUrl');
    // const storedEmail = sessionStorage.getItem('email');
    // const storedNickname = sessionStorage.getItem('nickname');
    // const storedIntroduction = sessionStorage.getItem('introduction');
    // if (storedAvatarUrl && storedEmail && storedNickname && storedIntroduction) {
    //     userProfileFound = true;
    //     displayUserProfile({ /* ... */ });
    //     return; // <--- 這個 return 導致跳過輪詢，現在要移除
    // }

    // --- 4. 輪詢 Google 試算表以獲取用戶資料 (現在總是會執行) ---
    async function pollGoogleSheet() {
        if (userProfileFound) { // 如果已經找到，就停止輪詢
            clearInterval(pollingTimerId);
            return;
        }

        pollingAttempts++;
        console.log(`正在輪詢 Google 試算表... 嘗試 ${pollingAttempts}/${maxPollingAttempts}`);

        if (pollingAttempts > maxPollingAttempts) {
            clearInterval(pollingTimerId);
            handlePollingTimeout();
            return;
        }

        try {
            const response = await fetch(pollingUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonpText = await response.text();
            const jsonString = jsonpText.substring(jsonpText.indexOf('{'), jsonpText.lastIndexOf('}') + 1);
            const jsonData = JSON.parse(jsonString);

            if (!jsonData || !jsonData.table || !jsonData.table.rows) {
                throw new Error("Invalid Google Sheet JSON data structure.");
            }

            const rows = jsonData.table.rows;
            let foundRowData = null;

            for (const row of rows) {
                const userValue = row.c[0] ? row.c[0].v : '';
                const randomCodeValue = row.c[1] ? row.c[1].v : '';

                if (String(userValue) === user && String(randomCodeValue) === randomCode) {
                    foundRowData = {
                        avatarUrl: row.c[3] ? row.c[3].v : '',
                        email: row.c[2] ? row.c[2].v : '',
                        nickname: row.c[4] ? row.c[4].v : '',
                        introduction: row.c[5] ? row.c[5].v : ''
                    };
                    break;
                }
            }

            if (foundRowData) {
                userProfileFound = true; // 標記為已找到，停止輪詢
                clearInterval(pollingTimerId);

                displayUserProfile(foundRowData);
                saveUserProfileToSessionStorage(foundRowData); // 成功後仍然存儲到 sessionStorage
                sendToSecondGoogleForm(user, randomCode);
            } else {
                console.log('當前輪詢未找到匹配的用戶資料。');
            }

        } catch (error) {
            console.error('輪詢 Google 試算表時發生錯誤:', error);
            // 即使發生錯誤，也繼續嘗試，直到達到最大次數
        }
    }

    // --- 處理輪詢超時 (保留) ---
    function handlePollingTimeout() {
        console.log('輪詢超時，未找到匹配的用戶資料。');
        loadingMessage.style.display = 'none';
        timeoutMessage.style.display = 'block';

        // 清空 sessionStorage
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('randomCode');
        sessionStorage.removeItem('avatarUrl');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('nickname');
        sessionStorage.removeItem('introduction');
    }

    // 為編輯按鈕添加點擊事件監聽器 (保留)
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = 'sa_edit.html'; // 導航到 sa_edit.html 頁面
        });
    } else {
        console.error('找不到編輯按鈕元素！');
    }

    // --- 佈局調整函數 (保持空，因為沒有 QR Code 相關的佈局調整了) ---
    function adjustLayout() {
        // 此函數目前沒有其他需要 RWD 調整的元素。
        // 如果未來新增其他佈局需求，可以在這裡添加邏輯。
    }

    // 監聽視窗大小改變 (如果 adjustLayout 函數沒有其他作用，這行也可以移除)
    window.addEventListener('resize', adjustLayout);

    // --- 頁面載入時，無條件啟動輪詢 ---
    // 即使 sessionStorage 有數據，輪詢也會被啟動
    pollingTimerId = setInterval(pollGoogleSheet, pollingInterval);
    pollGoogleSheet(); // 立即執行第一次輪詢

    // 確保頁面載入時就執行一次佈局調整 (如果 adjustLayout 函數沒有其他作用，這行也可以移除)
    adjustLayout();
});