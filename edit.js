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

    let currentAvatarUrl = sessionStorage.getItem('avatarUrl') || 'user.png'; // 用於追踪當前頭像 URL
    let currentDeleteUrl = sessionStorage.getItem('avatarDeleteUrl') || ''; // 用於追踪當前頭像刪除 URL

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

    // --- 3. 圖片處理函數：壓縮和裁切為正方形 ---
    function compressAndCropImage(file, maxSizeMB = 8, outputWidth = 800) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 計算正方形裁切的尺寸和位置
                const minSize = Math.min(img.width, img.height);
                const startX = (img.width - minSize) / 2;
                const startY = (img.height - minSize) / 2;

                // 設置畫布為正方形
                canvas.width = outputWidth;
                canvas.height = outputWidth;

                // 繪製裁切後的正方形圖片
                ctx.drawImage(
                    img,
                    startX, startY, minSize, minSize, // 源圖片的裁切區域
                    0, 0, outputWidth, outputWidth     // 目標畫布的繪製區域
                );

                // 轉換為 Blob，並進行壓縮
                canvas.toBlob((blob) => {
                    if (blob) {
                        // 檢查檔案大小，如果超過限制就降低品質
                        const targetSize = maxSizeMB * 1024 * 1024;
                        if (blob.size <= targetSize) {
                            resolve(blob);
                        } else {
                            // 如果檔案還是太大，降低品質重新壓縮
                            let quality = 0.8;
                            const tryCompress = () => {
                                canvas.toBlob((compressedBlob) => {
                                    if (compressedBlob && (compressedBlob.size <= targetSize || quality <= 0.1)) {
                                        resolve(compressedBlob);
                                    } else {
                                        quality -= 0.1;
                                        tryCompress();
                                    }
                                }, 'image/jpeg', quality);
                            };
                            tryCompress();
                        }
                    } else {
                        reject(new Error('圖片處理失敗'));
                    }
                }, 'image/jpeg', 0.9);
            };

            img.onerror = () => reject(new Error('圖片載入失敗'));
            img.src = URL.createObjectURL(file);
        });
    }

    // --- 4. 頭像上傳邏輯 ---
    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const maxFileSize = 50 * 1024 * 1024; // 50MB 原始檔案限制

        if (file.size > maxFileSize) {
            alert('圖片大小不能超過 50MB。');
            avatarUploadInput.value = ''; // 清除選中的文件
            return;
        }

        // 檢查檔案類型
        if (!file.type.startsWith('image/')) {
            alert('請選擇有效的圖片檔案。');
            avatarUploadInput.value = '';
            return;
        }

        // 顯示載入動畫並處理圖片
        showLoadingOverlay('處理圖片中...');
        
        try {
            // 壓縮和裁切圖片
            const processedBlob = await compressAndCropImage(file, 8, 800);
            
            // 預覽處理後的圖片
            const previewUrl = URL.createObjectURL(processedBlob);
            editAvatarPreview.src = previewUrl;

            // 更新載入訊息
            loadingMessageText.textContent = '上傳圖片到 PostImage...';

            // 準備上傳到 PostImage
            const formData = new FormData();
            formData.append('upload', processedBlob, 'avatar.jpg');
            formData.append('optsize', '0'); // 不額外壓縮
            formData.append('expire', '0'); // 不過期

            const response = await fetch('https://postimages.org/json/rr', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`PostImage 上傳失敗: ${response.statusText}`);
            }

            const result = await response.json();
            
            // 檢查回應狀態
            if (result.status !== 'OK') {
                throw new Error(`PostImage 回應錯誤: ${result.error || '未知錯誤'}`);
            }

            // 成功上傳
            currentAvatarUrl = result.url; // 圖片 URL
            currentDeleteUrl = result.delete_url || ''; // 刪除 URL
            
            console.log('圖片上傳成功:', currentAvatarUrl);
            console.log('刪除 URL:', currentDeleteUrl);
            
            loadingMessageText.textContent = '圖片上傳完成！';
            setTimeout(() => { 
                hideLoadingOverlay(); 
                // 清理預覽 URL
                URL.revokeObjectURL(previewUrl);
            }, 500); // 短暫顯示成功訊息
            
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

    // --- 5. 完成編輯按鈕邏輯 ---
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
        formData.append('entry.166155644', currentDeleteUrl); // 頭像刪除 URL

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
            sessionStorage.setItem('avatarDeleteUrl', currentDeleteUrl);
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

    // --- 6. 取消按鈕邏輯 ---
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