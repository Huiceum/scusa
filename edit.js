// script.js
document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('user');
    const randomCode = sessionStorage.getItem('randomCode');

    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessageText = document.getElementById('loadingMessageText');
    const timeoutMessage = document.getElementById('timeoutMessage'); // 這裡雖然不會用到，但保留以防萬一
    const editProfileFormContainer = document.getElementById('editProfileFormContainer');

    const editAvatarPreview = document.getElementById('editAvatarPreview');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const editNicknameInput = document.getElementById('editNickname');
    const editEmailInput = document.getElementById('editEmail');
    const editIntroTextarea = document.getElementById('editIntro');
    const submitEditBtn = document.getElementById('submitEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // ImageKit.io 配置
    const imagekitConfig = {
        publicKey: 'public_cxvDgxuhxYzQXziFM3+2jCT366I=',
        urlEndpoint: 'https://ik.imagekit.io/3rzkmmncw',
        authenticationEndpoint: 'https://script.google.com/macros/s/AKfycbwk4uOVXPP3_g-soriGy6lVMe5uxSeCrKKniyt243iaZoahUB2gezomiWtY_CVF_FFBsQ/exec'
    };

    let currentAvatarUrl = sessionStorage.getItem('avatarUrl') || 'user.png'; // 用於追踪當前頭像 URL

    // --- 1. 檢查 sessionStorage 中的 user 和 randomCode 變數 ---
    if (!user || !randomCode) {
        console.log('sessionStorage中的user或randomCode缺失，導向到 login.html');
        window.location.href = 'login.html';
        return;
    }

    // --- 2. 填充表單數據 ---
    function populateFormData() {
        editAvatarPreview.src = currentAvatarUrl; // 使用 currentAvatarUrl
        editNicknameInput.value = sessionStorage.getItem('nickname') || '';
        editEmailInput.value = sessionStorage.getItem('email') || '';
        
        // 自我介紹：在 textarea 中直接顯示，不轉換 <br>
        editIntroTextarea.value = sessionStorage.getItem('introduction') || '';
    }

    populateFormData(); // 頁面加載時立即填充數據

    // --- 3. ImageKit.io 上傳邏輯 ---
    async function uploadToImageKit(file) {
        try {
            // 獲取認證參數
            const authResponse = await fetch(imagekitConfig.authenticationEndpoint);
            if (!authResponse.ok) {
                throw new Error('獲取ImageKit認證參數失敗');
            }
            const authParams = await authResponse.json();

            // 準備上傳數據
            const formData = new FormData();
            formData.append('file', file);
            formData.append('publicKey', imagekitConfig.publicKey);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire);
            formData.append('token', authParams.token);
            
            // 可選：設置文件名（使用時間戳避免重複）
            const fileName = `avatar_${Date.now()}_${file.name}`;
            formData.append('fileName', fileName);

            // 上傳到ImageKit.io
            const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`ImageKit上傳失敗: ${errorData.message || uploadResponse.statusText}`);
            }

            const result = await uploadResponse.json();
            return result.url; // 返回上傳成功的圖片URL
        } catch (error) {
            console.error('ImageKit上傳錯誤:', error);
            throw error;
        }
    }

    // --- 頭像上傳邏輯 ---
    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const maxFileSize = 32 * 1024 * 1024; // 32MB

        if (file.size > maxFileSize) {
            alert('圖片大小不能超過 32MB。');
            avatarUploadInput.value = ''; // 清除選中的文件
            return;
        }

        // 預覽圖片
        const reader = new FileReader();
        reader.onload = (e) => {
            editAvatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // 顯示載入動畫並上傳圖片
        showLoadingOverlay('上傳圖片中...');
        try {
            const imageUrl = await uploadToImageKit(file);
            currentAvatarUrl = imageUrl; // 更新當前頭像 URL
            console.log('圖片上傳成功:', currentAvatarUrl);
            loadingMessageText.textContent = '圖片上傳完成！';
            setTimeout(() => { hideLoadingOverlay(); }, 500); // 短暫顯示成功訊息
        } catch (error) {
            console.error('圖片上傳錯誤:', error);
            alert(`圖片上傳失敗：${error.message}`);
            hideLoadingOverlay();
            avatarUploadInput.value = ''; // 上傳失敗也清空文件選擇
        }
    });

    // 點擊頭像預覽圖或上傳按鈕觸發文件選擇
    editAvatarPreview.addEventListener('click', () => {
        avatarUploadInput.click();
    });
    document.querySelector('.upload-btn').addEventListener('click', () => {
        avatarUploadInput.click();
    });

    // --- 4. 完成編輯按鈕邏輯 ---
    submitEditBtn.addEventListener('click', async () => {
        showLoadingOverlay('儲存個人資料中...');
        submitEditBtn.disabled = true; // 禁用按鈕防止重複提交
        cancelEditBtn.disabled = true;

        const nickname = editNicknameInput.value.trim();
        let email = editEmailInput.value.trim();
        let intro = editIntroTextarea.value.trim();

        // 自我介紹轉換：只轉換半形逗號為全形逗號
        intro = intro.replace(/,/g, '，');

        // 電子信箱預設值邏輯 (如果使用者清空了，則使用預設)
        if (!email) {
            const cleanUserPart = user.replace(/^#/, '').split('#')[0];
            email = `${cleanUserPart}@scu.edu.tw`;
        }

        const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfqCVAqWmyCHA94tEXyy1fbxnbz4dkdiLgp1NMswvUJIOXWZA/formResponse';
        const formData = new FormData();
        formData.append('entry.623180088', email); // 信箱
        formData.append('entry.292951009', currentAvatarUrl); // 頭像網址 (可能是新上傳的或原來的)
        formData.append('entry.365501600', nickname); // 暱稱
        formData.append('entry.576325894', intro); // 自我介紹
        formData.append('entry.1843134645', user); // user
        formData.append('entry.1191471852', randomCode); // randomCode

        try {
            await fetch(googleFormUrl, {
                method: 'POST',
                mode: 'no-cors', // 允許跨域發送請求，但不允許JS讀取響應
                body: formData
            });
            console.log('數據已在背景傳送至 Google 表單。');
            loadingMessageText.textContent = '資料儲存成功！';

            // 更新 sessionStorage 中的用戶資料
            sessionStorage.setItem('avatarUrl', currentAvatarUrl);
            sessionStorage.setItem('email', email);
            sessionStorage.setItem('nickname', nickname);
            sessionStorage.setItem('introduction', intro);

            // 延遲兩秒後跳轉回 sa_account.html
            setTimeout(() => {
                hideLoadingOverlay();
                window.location.href = 'sa_account.html'; // 導向到 sa_account.html
            }, 2000); // 延遲 2 秒
        } catch (error) {
            console.error('傳送 Google 表單時發生錯誤:', error);
            alert('資料儲存失敗，請稍後再試。');
            hideLoadingOverlay();
            submitEditBtn.disabled = false;
            cancelEditBtn.disabled = false;
        }
    });

    // --- 5. 取消按鈕邏輯 ---
    cancelEditBtn.addEventListener('click', () => {
        window.location.href = 'sa_account.html'; // 返回 sa_account.html
    });

    // --- 載入動畫顯示/隱藏函數 ---
    function showLoadingOverlay(message = '處理中...') {
        loadingMessageText.textContent = message;
        loadingOverlay.classList.add('show');
    }

    function hideLoadingOverlay() {
        loadingOverlay.classList.remove('show');
    }
});