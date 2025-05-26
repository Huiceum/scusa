// script.js
document.addEventListener('DOMContentLoaded', () => {
    let pollingAttempts = 0;
    const maxPollingAttempts = 15;
    let pollingTimerId = null;
    let selectedImages = [];
    let currentUser = '';

    // --- ImageKit.io 設定 ---

    const imageKitPrivateKey = 'private_fUNcPHEPFTe521XZiXjJS8jbwEw='; 
    const imageKitUploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    const imageKitFolder = '/scusatw/'; 
    const basicAuthHeader = 'Basic ' + btoa(imageKitPrivateKey + ':');
    // --- ImageKit.io 設定結束 ---


    // 檢查登入狀態並初始化
    document.getElementById('publishSection').addEventListener('click', async function() {
        const user = sessionStorage.getItem('user');
        const randomCode = sessionStorage.getItem('randomCode');

        if (!user || !randomCode) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = user;
        document.getElementById('userOption').textContent = user;

        // 顯示載入中
        document.getElementById('loadingOverlay').style.display = 'flex';
        document.querySelector('.loading-content div:last-child').textContent = '驗證帳號中...'; // 更新載入訊息

        // 填寫第一個 Google 表單
        await submitFirstGoogleForm(user, randomCode);

        // 開始輪詢
        startPolling(user, randomCode);
    });

    // 提交第一個 Google 表單 (用於觸發試算表寫入)
    async function submitFirstGoogleForm(user, randomCode) {
        const formData = new FormData();
        formData.append('entry.1832293907', user);
        formData.append('entry.1379742742', randomCode);

        try {
            await fetch('https://docs.google.com/forms/d/e/1FAIpQLScCZNt05-1RSFT1tH6ufYv6z8tKRd__YLHJ9rrY8-oeGQlOfQ/formResponse', {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
            console.log('第一個表單提交成功');
        } catch (error) {
            console.error('提交第一個表單時發生錯誤:', error);
        }
    }

    // 開始輪詢 Google 試算表
    function startPolling(user, randomCode) {
        pollingAttempts = 0;
        // 清除任何可能存在的舊定時器
        if (pollingTimerId) {
            clearInterval(pollingTimerId);
        }
        pollingTimerId = setInterval(() => pollGoogleSheet(user, randomCode), 1000);
    }

    // 輪詢 Google 試算表
    async function pollGoogleSheet(user, randomCode) {
        pollingAttempts++;
        console.log(`正在輪詢... 嘗試 ${pollingAttempts}/${maxPollingAttempts}`);
        document.querySelector('.loading-content div:last-child').textContent = `驗證帳號中... (${pollingAttempts}/${maxPollingAttempts})`; // 更新載入訊息

        if (pollingAttempts > maxPollingAttempts) {
            clearInterval(pollingTimerId);
             // 在輪詢失敗時也嘗試發送刪除表單，清理試算表中的條目
            await sendDeleteForm(user, randomCode);
            showError('驗證失敗或網路不穩，請重新登入');
            return;
        }

        try {
            // 為了避免瀏覽器快取，可以加上時間戳或隨機參數
            const cacheBuster = `_=${new Date().getTime()}`;
            const sheetUrl = `https://docs.google.com/spreadsheets/d/1BhrlzRjRPErglpx6D_ASDyVue5pEoQrzm1AYCQ21Fic/gviz/tq?tqx=out:json&${cacheBuster}`;

            const response = await fetch(sheetUrl);
             // 檢查響應狀態碼
            if (!response.ok) {
                 console.error(`輪詢 Google Sheet 失敗, 狀態碼: ${response.status}`);
                 // 這裡不立即終止，讓它繼續嘗試直到 maxPollingAttempts
                 return;
             }

            const jsonpText = await response.text();
            // Google Visualization API 返回的格式是 jsonp，需要手動解析
            const jsonString = jsonpText.substring(jsonpText.indexOf('{'), jsonpText.lastIndexOf('}') + 1);
            const jsonData = JSON.parse(jsonString);

            const rows = jsonData.table.rows;
            let foundRow = null;

            // 找到符合 user 和 randomCode 的那一行
            for (const row of rows) {
                const userValue = row.c[0] ? row.c[0].v : ''; // 第1列是 user
                const tokenValue = row.c[1] ? row.c[1].v : ''; // 第2列是 randomCode

                if (String(userValue).trim() === user && String(tokenValue).trim() === randomCode) {
                    foundRow = row;
                    break;
                }
            }

            if (foundRow) {
                // 找到對應行，停止輪詢
                clearInterval(pollingTimerId);

                // 讀取第3列 (索引為 2) 的驗證結果
                const isValid = foundRow.c[2] ? foundRow.c[2].v : false; // 第3列是驗證結果

                // 不論結果如何，先提交刪除表單清理試算表中的這條記錄
                await sendDeleteForm(user, randomCode);

                // 根據驗證結果決定顯示哪個畫面
                if (isValid === true || isValid === 'TRUE' || isValid === 'true') { // 檢查布林值或字串形式
                    showPostForm(); // 驗證成功，顯示發文表單
                } else {
                    // 驗證失敗
                    showError('您的帳號可能在別的地方登入了，請重新登入後嘗試');
                }
            }
            // 如果沒找到，繼續輪詢

        } catch (error) {
            console.error('輪詢時發生錯誤:', error);
             // 這裡不立即終止，讓它繼續嘗試直到 maxPollingAttempts
        }
    }

    // 發送刪除表單 (用於清理試算表中的驗證記錄)
    async function sendDeleteForm(user, randomCode) {
        const formData = new FormData();
        formData.append('entry.1291631875', user); // 對應 Google 表單中的 user 欄位
        formData.append('entry.1939938647', randomCode); // 對應 Google 表單中的 randomCode 欄位

        try {
            await fetch('https://docs.google.com/forms/d/e/1FAIpQLSe42EFFjWGGg0dQc-B95qVUVwZw7Xb0i6QWKr6bKvEs86_fgg/formResponse', {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // 允許跨域發送請求，但不允許JS讀取響應
            });
            console.log('刪除表單提交成功');
        } catch (error) {
            console.error('提交刪除表單時發生錯誤:', error);
        }
    }

    // 顯示錯誤訊息並清理 Session Storage
    function showError(message) {
        document.getElementById('loadingOverlay').style.display = 'none'; // 隱藏載入動畫
        document.getElementById('errorText').textContent = message; // 設定錯誤訊息文字
        document.getElementById('errorMessage').style.display = 'block'; // 顯示錯誤訊息區塊

        // 清除 sessionStorage 中的用戶資訊，要求重新登入
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('randomCode');
        // 可以選擇是否清除其他相關資訊，如 nickname, avatarUrl 等
        // sessionStorage.removeItem('nickname');
        // sessionStorage.removeItem('avatarUrl');
        // sessionStorage.removeItem('email');
        // sessionStorage.removeItem('introduction');
    }

    // 顯示發文表單
    function showPostForm() {
        document.getElementById('loadingOverlay').style.display = 'none'; // 隱藏載入動畫
        document.getElementById('postForm').style.display = 'block'; // 顯示發文表單區塊
    }

    // 標題字數統計 (保持不變)
    document.getElementById('titleInput').addEventListener('input', function() {
        const count = this.value.length;
        const countElement = document.getElementById('titleCount');
        countElement.textContent = `${count}/23`;
        countElement.className = count > 20 ? 'char-count warning' : 'char-count';
    });

    // 圖片上傳觸發 (保持不變)
    document.getElementById('imageUpload').addEventListener('click', function() {
        document.getElementById('imageInput').click();
    });

    // 圖片預覽和選擇 (保持不變，只更新了註解)
    document.getElementById('imageInput').addEventListener('change', function(e) {
        const files = Array.from(e.target.files);

        if (files.length > 3) {
            alert('最多只能選擇3張圖片');
            this.value = ''; // 清空選擇，以便再次選擇
            return;
        }

        selectedImages = [];
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = ''; // 清空之前的預覽

        files.forEach(file => {
            if (file.size > 32 * 1024 * 1024) {
                alert(`圖片 ${file.name} 超過32MB限制`);
                // 這裡可以選擇跳過這個檔案或清空所有選擇
                // 為了簡單，我們假設使用者會重新選擇
                this.value = ''; // 清空選擇，以便再次選擇
                preview.innerHTML = ''; // 清空預覽
                selectedImages = []; // 清空已選擇的檔案
                return; // 跳出 forEach，因為已經提醒錯誤
            }

            selectedImages.push(file);

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image'); // 可以添加 class 來樣式化預覽圖
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    // 圖片壓縮和上傳 (!!! 修改為使用 ImageKit.io !!!)
    async function compressAndUploadImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                let { width, height } = img;

                // 壓縮高度到300，寬度按比例調整
                if (height > 600) {
                    width = (width * 600) / height;
                    height = 600;
                }

                // 如果寬度超過900，裁剪到900
                if (width > 1800) {
                    width = 1800;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // 將 Canvas 內容轉為 Blob，然後上傳
                canvas.toBlob(async (blob) => {
                    const formData = new FormData();
                    // ImageKit 需要的欄位名稱
                    formData.append('file', blob, file.name); // 第二個參數是 Blob，第三個是檔案名稱
                    formData.append('fileName', file.name); // ImageKit 也需要 fileName 欄位

                    // 如果設定了資料夾，則加入 folder 參數
                    if (imageKitFolder) {
                         formData.append('folder', imageKitFolder);
                    }
                     // 可以選擇加入 tags, useUniqueFileName 等參數，請查閱 ImageKit API 文件

                    try {
                        // 使用 fetch 將圖片 Blob 上傳到 ImageKit.io
                        const response = await fetch(imageKitUploadUrl, {
                            method: 'POST',
                            headers: {
                                // 使用 Basic Authentication 傳遞私鑰進行認證
                                'Authorization': basicAuthHeader
                                // Content-Type 通常不需要手動設定，fetch 會根據 FormData 自動設定
                            },
                            body: formData,
                            mode: 'cors' // 確保允許跨域請求
                        });

                        // 檢查 HTTP 響應狀態碼
                        if (!response.ok) {
                            // 嘗試解析 ImageKit 的錯誤響應
                           const errorData = await response.json().catch(() => null); // 如果響應不是 JSON 也不會拋錯
                           const errorMessage = errorData && errorData.message ? `ImageKit 上傳失敗: ${errorData.message}` : `ImageKit 上傳失敗: 狀態碼 ${response.status}`;
                           console.error('ImageKit 上傳失敗響應:', await response.text().catch(() => '無法讀取錯誤響應')); // 記錄原始錯誤響應以便偵錯
                           throw new Error(errorMessage);
                        }

                        const result = await response.json();

                        // ImageKit 成功響應通常包含 url 欄位
                        if (result && result.url) {
                            console.log('圖片上傳成功:', result.url);
                            resolve(result.url); // 返回 ImageKit 返回的圖片 URL
                        } else {
                            // 響應成功但數據格式異常
                            console.error('ImageKit 上傳成功但返回數據格式異常:', result);
                            resolve(null);
                        }

                    } catch (error) {
                        console.error('圖片上傳錯誤 (ImageKit):', error);
                        alert(`圖片上傳失敗：${error.message}`); // 向用戶顯示錯誤訊息
                        resolve(null); // 上傳失敗返回 null
                    }
                }, 'image/jpeg', 0.8); // 將 Canvas 轉為 JPEG 格式，品質 0.8
            };

            // 讀取檔案為 Data URL 以便加載到 Image 對象
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 獲取用戶IP (保持不變)
    async function getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('獲取IP失敗:', error);
            return 'unknown';
        }
    }

    // 生成哈希值 (保持不變)
    async function generateHash(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 提交文章 (已修改，使用壓縮上傳函數，其內部已改為 ImageKit)
    document.getElementById('submitBtn').addEventListener('click', async function() {
        const submitBtn = this;
        submitBtn.disabled = true; // 禁用按鈕防止重複點擊
        submitBtn.textContent = '發布中...'; // 更新按鈕文字

        const nameSelect = document.getElementById('nameSelect').value; // 匿名選項
        const title = document.getElementById('titleInput').value; // 標題
        const content = document.getElementById('contentInput').value; // 內容
        const user = sessionStorage.getItem('user'); // 用戶名
        const randomCode = sessionStorage.getItem('randomCode'); // 驗證碼

        // 基本驗證
        if (!title.trim()) {
            alert('請填寫標題');
            submitBtn.disabled = false;
            submitBtn.textContent = '發布文章';
            return;
        }
        if (title.length > 23) {
             alert('標題字數不能超過23字');
             submitBtn.disabled = false;
             submitBtn.textContent = '發布文章';
             return;
         }

        // 上傳圖片
        let imageUrls = [];
        if (selectedImages.length > 0) {
            // 顯示圖片上傳中的載入狀態
             document.getElementById('postForm').style.display = 'none'; // 暫時隱藏表單
             document.getElementById('loadingOverlay').style.display = 'flex'; // 顯示載入動畫
             document.querySelector('.loading-content div:last-child').textContent = '上傳圖片中...'; // 更新載入訊息

            for (let i = 0; i < selectedImages.length; i++) {
                 document.querySelector('.loading-content div:last-child').textContent = `上傳圖片中... (${i + 1}/${selectedImages.length})`; // 更新進度
                const url = await compressAndUploadImage(selectedImages[i]);
                if (url) {
                     imageUrls.push(url);
                     console.log(`圖片 ${i+1} 上傳成功: ${url}`);
                } else {
                     console.error(`圖片 ${i+1} 上傳失敗`);
                     // 如果有任何一張圖片上傳失敗，可能需要終止流程或提醒用戶
                     alert(`第 ${i+1} 張圖片上傳失敗，請重試或選擇其他圖片。`);
                     hideLoadingOverlay(); // 隱藏載入動畫
                     document.getElementById('postForm').style.display = 'block'; // 重新顯示表單
                     submitBtn.disabled = false;
                     submitBtn.textContent = '發布文章';
                     return; // 終止函數執行
                }
            }
             document.querySelector('.loading-content div:last-child').textContent = '圖片上傳完成！'; // 圖片上傳完成訊息
        }

        // 獲取IP和生成哈希 (保持不變)
        const ip = await getUserIP();
        const now = new Date().toISOString();
        // 生成一個更獨特的輸入以確保哈希更不容易碰撞
        const hashInput = `${user}-${randomCode}-${now}-${ip}-${title.substring(0,10)}-${Math.random()}`;
        const hash = await generateHash(hashInput);

        // 提交到最終表單 (保持不變，但圖片網址來源已改為 ImageKit)
        const finalFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdfZFlHx9ERT7VqniFrAOgqMgPm6sxU45h7gzbSTbs5wSyAhg/formResponse';
        const formData = new FormData();
        formData.append('entry.358109991', nameSelect === 'anonymous' ? 'true' : 'false'); // 是否匿名
        formData.append('entry.1813792510', title); // 標題
        formData.append('entry.1497544065', content); // 內容
        formData.append('entry.1369797758', imageUrls.join('/-#-#/')); // 圖片網址，用分隔符號連接
        formData.append('entry.1472143817', user); // 用戶名
        formData.append('entry.970812569', randomCode); // 驗證碼
        formData.append('entry.797873173', ip); // IP地址
        formData.append('entry.419946420', hash); // 哈希值

        // 顯示提交表單中的載入狀態
        document.querySelector('.loading-content div:last-child').textContent = '提交文章數據中...';

        try {
            await fetch(finalFormUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // 允許跨域發送請求，但不允許JS讀取響應 (Google Form 要求的模式)
            });

            console.log('文章數據已在背景傳送至 Google 表單。');

            // 顯示成功訊息並重新整理
            document.querySelector('.loading-content div:last-child').textContent = '發布成功！即將重新整理...';

            setTimeout(() => {
                window.location.reload(); // 重新整理頁面
            }, 3000); // 延遲 3 秒

        } catch (error) {
            console.error('提交文章時發生錯誤:', error);
            alert('發布失敗，請重試');
            hideLoadingOverlay(); // 隱藏載入動畫
            document.getElementById('postForm').style.display = 'block'; // 重新顯示表單
            submitBtn.disabled = false;
            submitBtn.textContent = '發布文章';
        }
    });

     // Helper function to hide loading overlay (Assuming you have one in the HTML)
     function hideLoadingOverlay() {
         const loadingOverlay = document.getElementById('loadingOverlay');
         if (loadingOverlay) {
             loadingOverlay.style.display = 'none';
         }
     }

});

