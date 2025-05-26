// post.js

class ForumManager {
    constructor() {
        this.allPosts = []; // 儲存從試算表載入的所有貼文
        this.displayedPosts = []; // 儲存目前顯示在頁面上的貼文
        this.filteredPosts = []; // 儲存搜尋結果的貼文
        this.currentPage = 0; // 當前載入的頁碼
        this.postsPerPage = 25; // 每頁顯示的貼文數量
        this.isSearchMode = false; // 是否處於搜尋模式
        this.isLoading = false; // 是否正在載入貼文，防止重複載入

        // 新增：圖片放大相關的 DOM 元素引用
        this.imageOverlay = null;
        this.enlargedImage = null;
        
        // 新增：儲存所有留言數據 (鍵為貼文哈希值，值為該貼文的所有留言陣列)
        this.allComments = {}; 
        
        this.init(); // 初始化論壇管理器
    }

    async init() {
        this.bindEvents(); // 綁定事件監聽器
        this.setupImageEnlargement(); // 新增：設定圖片放大事件
        await this.loadAllPosts(); // 載入所有貼文數據
        await this.loadAllComments(); // 新增：載入所有留言數據
        this.displayPosts(); // 顯示初始貼文
    }

    bindEvents() {
        // 搜尋功能開關
        document.getElementById('searchToggle').addEventListener('click', () => {
            this.toggleSearchOverlay();
        });

        // 關閉搜尋框按鈕
        document.getElementById('closeSearch').addEventListener('click', () => {
            this.toggleSearchOverlay();
        });

        // 點擊搜尋框外部區域關閉
        document.getElementById('searchOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'searchOverlay') { // 確保只點擊背景層
                this.toggleSearchOverlay();
            }
        });

        // 搜尋按鈕點擊事件
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        // 搜尋輸入框按下 Enter 鍵
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // 載入更多按鈕
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMorePosts();
        });

        // 滾動到底部載入更多貼文
        window.addEventListener('scroll', () => {
            if (this.isNearBottom() && !this.isLoading) {
                this.loadMorePosts();
            }
        });

        // 新增：圖片點擊事件委託（因為貼文是動態生成的）
        document.getElementById('postsContainer').addEventListener('click', (e) => {
            // 檢查點擊的目標是否是帶有 'post-image' 類的圖片
            if (e.target.classList.contains('post-image')) {
                this.showEnlargedImage(e.target.src);
            }
        });
    }

    // 新增：初始化圖片放大功能
    setupImageEnlargement() {
        this.imageOverlay = document.getElementById('imageOverlay');
        this.enlargedImage = document.getElementById('enlargedImage');

        // 點擊疊加層時隱藏圖片
        this.imageOverlay.addEventListener('click', () => {
            this.hideEnlargedImage();
        });
    }

    // 新增：顯示放大圖片
    showEnlargedImage(imageUrl) {
        this.enlargedImage.src = imageUrl;
        this.enlargedImage.classList.add('active'); // 添加 active 類來觸發放大效果
        this.imageOverlay.style.display = 'flex'; // 顯示疊加層
        document.body.style.overflow = 'hidden'; // 防止滾動頁面
    }

    // 新增：隱藏放大圖片
    hideEnlargedImage() {
        this.imageOverlay.style.display = 'none'; // 隱藏疊加層
        this.enlargedImage.classList.remove('active'); // 移除 active 類
        document.body.style.overflow = ''; // 恢復頁面滾動
    }

    // 切換搜尋彈出框的顯示狀態
    toggleSearchOverlay() {
        const overlay = document.getElementById('searchOverlay');
        const isVisible = overlay.style.display === 'flex';
        overlay.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            document.getElementById('searchInput').focus(); // 顯示時自動聚焦輸入框
        }
    }

    // 從 Google 試算表載入所有貼文數據
    async loadAllPosts() {
        try {
            document.getElementById('loading').style.display = 'block'; // 顯示載入動畫
            
            // Google 試算表公開連結，注意替換為您的試算表 ID
            // 試算表 ID: 1V26ISYAh1JrVI_Ar_Yw3GfjKcEHcyle3hEpoX05P3so
            const response = await fetch('https://docs.google.com/spreadsheets/d/1V26ISYAh1JrVI_Ar_Yw3GfjKcEHcyle3hEpoX05P3so/gviz/tq?tqx=out:json');
            const jsonpText = await response.text();
            
            // 從 JSONP 格式中提取純 JSON 字串
            const jsonString = jsonpText.substring(jsonpText.indexOf('{'), jsonpText.lastIndexOf('}') + 1);
            const jsonData = JSON.parse(jsonString);

            if (!jsonData.table || !jsonData.table.rows) {
                throw new Error('無法載入數據：試算表結構不符預期或無數據');
            }

            // 解析並處理貼文數據
            this.allPosts = this.parsePostsData(jsonData.table.rows);
            // 更新貼文總數顯示
            // 清空搜尋輸入框
            document.getElementById('searchInput').value = '';
            
        } catch (error) {
            console.error('載入貼文失敗:', error);
            this.showError('載入失敗，請重新整理頁面'); // 顯示錯誤訊息
        } finally {
            document.getElementById('loading').style.display = 'none'; // 隱藏載入動畫
        }
    }

    // 解析從 Google 試算表獲取的原始數據
    parsePostsData(rows) {
        const posts = [];
        // 試算表 A~I 行依序為：匿名性,貼文標題,內文圖片,文章哈希值,id,頭像,暱稱,時間,內文
        // 對應的陣列索引為 0-8
        for (const row of rows) {
            try {
                // 檢查 c 屬性是否存在且為陣列，避免 undefined 錯誤
                if (!row.c || !Array.isArray(row.c)) {
                    console.warn('無效的行數據，跳過:', row);
                    continue;
                }

                const post = {
                    anonymous: this.getCellValue(row, 0), // A列: 匿名性
                    title: this.getCellValue(row, 1),     // B列: 貼文標題
                    content: this.getCellValue(row, 2),    // I列: 內文 (您的註釋中I列是內文，C列是內文圖片)
                    images: this.getCellValue(row, 3),    // C列: 內文圖片 (您的註釋中C列是內文圖片，I列是內文)
                    hash: this.getCellValue(row, 4),      // D列: 文章哈希值
                    id: this.getCellValue(row, 5),        // E列: id
                    avatar: this.getCellValue(row, 6),    // F: 頭像
                    nickname: this.getCellValue(row, 7),  // G列: 暱稱
                    time: this.getCellValue(row, 8)      // H列: 時間
                };

                // 驗證必要欄位，確保數據完整性
                if (post.title && post.time && post.content) {
                    posts.push(post);
                } else {
                    console.warn('缺少必要欄位，跳過貼文:', post);
                }
            } catch (error) {
                console.warn('解析貼文數據時發生錯誤:', error, '行數據:', row);
            }
        }

        // 按時間排序（最新的在前），確保時間格式正確
        return posts.sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    // 健壯地獲取單元格數據
    getCellValue(row, index) {
        // 檢查 row.c 是否存在且不是 null/undefined
        // 檢查 row.c[index] 是否存在
        if (!row.c || !row.c[index]) {
            return ''; // Cell doesn't exist or is undefined
        }

        const cell = row.c[index];
        
        // **修正重點：優先使用格式化值 (f)，如果不存在則使用原始值 (v)**
        // 確保值不是 null 或 undefined，並轉換為字串
        if (cell.f !== null && typeof cell.f !== 'undefined') {
            return String(cell.f);
        } else if (cell.v !== null && typeof cell.v !== 'undefined') {
            return String(cell.v);
        }
        return ''; // 如果 f 和 v 都沒有，則返回空字串
    }

    // 顯示貼文到頁面
    displayPosts() {
        const postsContainer = document.getElementById('postsContainer');
        const postsToShow = this.isSearchMode ? this.filteredPosts : this.allPosts;
        const startIndex = this.currentPage * this.postsPerPage;
        const endIndex = Math.min(startIndex + this.postsPerPage, postsToShow.length);
        
        // 如果是第一頁載入，清空容器以顯示新內容（或搜尋結果）
        if (this.currentPage === 0) {
            postsContainer.innerHTML = '';
            this.displayedPosts = [];
            // 如果搜尋結果為空，顯示提示
            if (postsToShow.length === 0 && this.isSearchMode) {
                postsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <p style="font-size: 1.2em;">🔍 沒有找到符合條件的貼文。</p>
                        <button onclick="forumManager.clearSearch()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            返回所有貼文
                        </button>
                    </div>
                `;
            } else if (postsToShow.length === 0 && !this.isSearchMode) {
                 postsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <p style="font-size: 1.2em;">還沒有任何貼文，快來發佈第一篇吧！</p>
                    </div>
                `;
            }
        }

        // 渲染指定範圍的貼文
        for (let i = startIndex; i < endIndex; i++) {
            const post = postsToShow[i];
            this.displayedPosts.push(post);
            this.renderPost(post);

            
        }

        // 更新載入更多按鈕的狀態
        this.updateLoadMoreButton(postsToShow);
    }

    // 渲染單個貼文卡片
    renderPost(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        
    // 判斷是否匿名
    const isAnonymous = post.anonymous.toLowerCase() === 'true';
    // 顯示名稱：如果匿名則顯示"匿名"，否則顯示暱稱（ID）或ID
    let displayName;
    if (isAnonymous) {
        displayName = '匿名';
    } else {
        const nickname = post.nickname;
        const id = post.id;
        if (nickname && id) {
            displayName = `${nickname} (${id})`;
        } else if (nickname) {
            displayName = nickname;
        } else if (id) { // 如果暱稱不存在，則使用ID作為後備
            displayName = id;
        } else { // 如果暱稱和ID都為空
            displayName = '未知使用者'; 
        }
    }
    // 頭像路徑：如果匿名則使用 user.png，否則使用提供的頭像路徑
    const avatarSrc = isAnonymous ? 'user.png' : (post.avatar || 'user.png');
        
        // 格式化時間、處理內容和圖片
        const formattedTime = this.formatTime(post.time); // 使用新的 formatTime 函數
        const processedContent = this.processContent(post.content);
        const imagesHTML = this.renderImages(post.images);

        postElement.innerHTML = `
            <div class="post-header">
                <img class="avatar" src="${avatarSrc}" alt="頭像" onerror="this.src='user.png'">
                <div class="user-info">
                    <div class="username">
                        ${this.escapeHtml(displayName)}
                        ${isAnonymous ? '<span class="anonymous-badge">匿名</span>' : ''}
                    </div>
                    <div class="post-time">${formattedTime}</div>
                </div>
            </div>
            <div class="post-title">${this.escapeHtml(post.title)}</div>
            <div class="post-content">${processedContent}</div>
            ${imagesHTML}
            <div class="post-meta">
                <div class="hash-info" title="${this.escapeHtml(post.hash)}">
                    Hash: ${this.escapeHtml(post.hash.substring(0, 16))}...
                </div>
                <div class="post-id">ID: ${this.escapeHtml(post.id)}</div>
            </div>
        `;

        document.getElementById('postsContainer').appendChild(postElement);
    }

    // 渲染貼文中的圖片
    renderImages(imagesString) {
        if (!imagesString || imagesString.trim() === '') {
            return '';
        }

        // 使用 "/-#-#/" 作為分隔符分割圖片URL
        const imageUrls = imagesString.split('/-#-#/').filter(url => url.trim() !== '');
        
        if (imageUrls.length === 0) {
            return '';
        }

        // 根據圖片數量決定 grid 佈局的 class
        const imageClass = imageUrls.length === 1 ? 'single' : 
                          imageUrls.length === 2 ? 'double' : 'triple';

        // 生成圖片的 HTML 標籤
        const imagesHTML = imageUrls.map(url => 
            // 移除了 onclick="this.requestFullscreen()"
            `<img class="post-image" src="${this.escapeHtml(url.trim())}" alt="貼文圖片" loading="lazy" onerror="this.style.display='none';">`
        ).join(''); // 將所有圖片的 HTML 連接起來

        return `<div class="post-images ${imageClass}">${imagesHTML}</div>`;
    }

    // 處理貼文內容：轉換換行符和自動生成超連結
    processContent(content) {
        if (!content) return '';

        // 1. 轉義HTML特殊字符，防止XSS攻擊
        let processedContent = this.escapeHtml(content);

        // 2. 將換行符 \n 轉換為 <br> 標籤
        processedContent = processedContent.replace(/\n/g, '<br>');

        // 3. 自動為URL加上超連結
        // 匹配 http:// 或 https:// 開頭的URL
        const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
        processedContent = processedContent.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        return processedContent;
    }

    // HTML 轉義工具函數，防止XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化時間顯示 (修改為更詳細的「多久之前」)
    formatTime(timeString) {
        try {
            // 步驟 1: 解析自定義的時間字串格式 "2025/5/24 下午 8:17:18"
            const parts = timeString.split(' ');
            if (parts.length < 3) { 
                // 如果是 Date 物件，嘗試直接處理
                if (timeString instanceof Date) {
                    const d = timeString;
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1; // getMonth() returns 0-11
                    const day = d.getDate();
                    let hours = d.getHours();
                    const minutes = d.getMinutes();
                    const seconds = d.getSeconds();
                    const ampm = hours >= 12 ? '下午' : '上午';
                    hours = hours % 12 || 12; // Convert 24hr to 12hr format, 0 becomes 12 AM, 13 becomes 1 PM
                    return this.formatTime(`${year}/${month}/${day} ${ampm} ${hours}:${minutes}:${seconds}`);
                }
                return timeString; // 無法解析，返回原始字串
            }

            const datePart = parts[0]; // 例如: "2025/5/24"
            const ampmPart = parts[1]; // 例如: "上午" 或 "下午"
            const timePart = parts[2]; // 例如: "8:17:18"

            // 解析日期部分
            const dateComponents = datePart.split('/').map(Number); // [年, 月, 日]
            let year = dateComponents[0];
            let month = dateComponents[1] - 1; // JavaScript Date 物件的月份是從 0 開始 (0-11)
            let day = dateComponents[2];

            // 解析時間部分
            const timeComponents = timePart.split(':').map(Number); // [時, 分, 秒]
            let hours = timeComponents[0];
            let minutes = timeComponents[1];
            let seconds = timeComponents[2];

            // 根據「上午」或「下午」調整小時數為 24 小時制
            if (ampmPart === '下午' && hours < 12) {
                hours += 12; // 例如：下午 8 點變成 20 點
            } else if (ampmPart === '上午' && hours === 12) {
                hours = 0; // 例如：上午 12 點 (午夜) 變成 0 點
            }
            // 如果是上午 1-11 點，或下午 12 點 (中午)，則小時數不變

            // 建立 Date 物件
            const pastDate = new Date(year, month, day, hours, minutes, seconds);

            // 檢查日期是否有效
            if (isNaN(pastDate.getTime())) { 
                return timeString; // 如果日期無效，返回原始字串
            }

            const now = new Date();
            const diffSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000); // 時間差，單位秒

            // 定義時間常數（秒為單位）
            const MINUTE = 60;
            const HOUR = MINUTE * 60;
            const DAY = HOUR * 24;
            const WEEK = DAY * 7;
            const MONTH_APPROX = DAY * 30.437; // 平均每月天數 (約 30.437 天)
            const YEAR_APPROX = DAY * 365.25;  // 平均每年天數 (約 365.25 天，考慮閏年)

            // 根據時間差返回不同的相對時間表示
            if (diffSeconds < 5) {
                return '剛剛';
            } else if (diffSeconds < MINUTE) {
                return `${diffSeconds} 秒前`;
            } else if (diffSeconds < HOUR) {
                const minutesDiff = Math.floor(diffSeconds / MINUTE);
                return `${minutesDiff} 分鐘前`;
            } else if (diffSeconds < DAY) {
                const hoursDiff = Math.floor(diffSeconds / HOUR);
                return `${hoursDiff} 小時前`;
            } else if (diffSeconds < WEEK) {
                // 判斷是否是昨天 (精確到日期，而非簡單的 24 小時)
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 當前日期午夜
                const pastDateStart = new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate()); // 貼文日期午夜

                if (pastDateStart.getTime() === (todayStart.getTime() - DAY * 1000)) { // 如果貼文日期是昨天的午夜
                    return '昨天';
                }
                const daysDiff = Math.floor(diffSeconds / DAY);
                return `${daysDiff} 天前`;
            } else if (diffSeconds < MONTH_APPROX) {
                const weeksDiff = Math.floor(diffSeconds / WEEK);
                return `${weeksDiff} 週前`;
            } else if (diffSeconds < YEAR_APPROX) {
                const monthsDiff = Math.floor(diffSeconds / MONTH_APPROX);
                return `${monthsDiff} 個月前`;
            } else {
                const yearsDiff = Math.floor(diffSeconds / YEAR_APPROX);
                return `${yearsDiff} 年前`;
            }
        } catch (error) {
            console.error('格式化時間失敗:', timeString, error);
            return timeString; // 格式化失敗返回原始字串
        }
    }

    // 執行搜尋操作
    performSearch() {
        const searchType = document.getElementById('searchType').value; // 搜尋類型 (title, id, hash)
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase(); // 搜尋關鍵字

        if (!searchTerm) {
            alert('請輸入搜尋關鍵字');
            return;
        }

        // 根據搜尋類型過濾貼文
        this.filteredPosts = this.allPosts.filter(post => {
            switch (searchType) {
                case 'title':
                    return post.title.toLowerCase().includes(searchTerm);
                case 'id':
                    return post.id.toLowerCase().includes(searchTerm);
                case 'hash':
                    return post.hash.toLowerCase().includes(searchTerm);
                default:
                    return false;
            }
        });

        this.isSearchMode = true; // 進入搜尋模式
        this.currentPage = 0; // 重置頁碼
        this.displayPosts(); // 顯示搜尋結果
        this.toggleSearchOverlay(); // 關閉搜尋彈出框

        // 更新標題和貼文計數顯示搜尋結果
        document.querySelector('.header h1').textContent = `搜尋結果`;
        document.getElementById('postCount').innerHTML = `
            找到 ${this.filteredPosts.length} 則符合條件的貼文
            <button onclick="forumManager.clearSearch()" style="margin-left: 10px; padding: 5px 10px; background: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;">清除搜尋</button>
        `;
    }

    // 清除搜尋，返回所有貼文
    clearSearch() {
        this.isSearchMode = false; // 退出搜尋模式
        this.filteredPosts = []; // 清空過濾結果
        this.currentPage = 0; // 重置頁碼
        this.displayPosts(); // 顯示所有貼文
        
        // 重置標題和貼文計數
        document.querySelector('.header h1').textContent = '社群論壇';
    }

    // 載入更多貼文
    loadMorePosts() {
        if (this.isLoading) return; // 如果正在載入，則跳過

        const postsToShow = this.isSearchMode ? this.filteredPosts : this.allPosts;
        const totalPages = Math.ceil(postsToShow.length / this.postsPerPage);
        
        // 如果已經載入所有貼文，則跳過
        if (this.currentPage + 1 >= totalPages) {
            this.updateLoadMoreButton(postsToShow); // 更新按鈕狀態為 "已顯示所有貼文"
            return;
        }

        this.isLoading = true; // 設定載入狀態為 true
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = '載入中...';
            loadMoreBtn.disabled = true;
        }

        // 模擬載入延遲，提升用戶體驗
        setTimeout(() => {
            this.currentPage++; // 增加頁碼
            this.displayPosts(); // 顯示更多貼文
            this.isLoading = false; // 載入完成，重置狀態
            
            if (loadMoreBtn) {
                loadMoreBtn.textContent = '載入更多貼文';
                loadMoreBtn.disabled = false;
            }
        }, 500); // 延遲 500 毫秒
    }

    // 更新載入更多按鈕的顯示狀態
    updateLoadMoreButton(postsToShow) {
        const totalPages = Math.ceil(postsToShow.length / this.postsPerPage);
        // 判斷是否還有更多貼文可以載入
        const hasMorePosts = (this.currentPage + 1) * this.postsPerPage < postsToShow.length;
        
        const loadMore = document.getElementById('loadMore');
        const noMore = document.getElementById('noMore');
        
        if (hasMorePosts) {
            loadMore.style.display = 'block'; // 顯示載入更多按鈕
            noMore.style.display = 'none'; // 隱藏無更多內容提示
        } else {
            loadMore.style.display = 'none'; // 隱藏載入更多按鈕
            // 如果有貼文但沒有更多了，則顯示無更多內容提示
            noMore.style.display = postsToShow.length > 0 ? 'block' : 'none';
        }
    }

    // 判斷是否滾動到頁面底部
    isNearBottom() {
        const threshold = 200; // 距離底部 200px 時觸發
        // window.innerHeight: 視窗可視高度
        // window.scrollY: 頁面已滾動的距離
        // document.body.offsetHeight: 整個頁面的高度
        return window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold;
    }

    // 顯示錯誤訊息在貼文容器中
    showError(message) {
        const container = document.getElementById('postsContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--error-color);">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <div style="font-size: 18px; margin-bottom: 20px;">${this.escapeHtml(message)}</div>
                <button onclick="location.reload()" style="padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    重新載入
                </button>
            </div>
        `;
        document.getElementById('loading').style.display = 'none'; // 確保載入動畫隱藏
        document.getElementById('postCount').textContent = '載入失敗';
    }
}

// 在 DOM 加載完成後初始化論壇管理器
let forumManager;
document.addEventListener('DOMContentLoaded', () => {
    forumManager = new ForumManager();
});

// 將 forumManager 暴露到 window 物件，以便 HTML 中的 onclick 事件可以調用
window.forumManager = forumManager;






//留言
// 留言系統相關變數
let currentCommentingPost = null; // 當前正在回應的貼文
let commentPollingTimerId = null; // 留言驗證輪詢定時器
let commentPollingAttempts = 0; // 留言驗證輪詢嘗試次數
const maxCommentPollingAttempts = 30; // 最大輪詢次數

// 修改現有的 renderPost 方法，添加留言和展開按鈕
// 注意：這個函數會替換原有的 renderPost 方法
ForumManager.prototype.renderPostWithComments = function(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.setAttribute('data-post-hash', post.hash); // 添加 data 属性用于定位
    
    // 判斷是否匿名
    const isAnonymous = post.anonymous.toLowerCase() === 'true';
    // 顯示名稱：如果匿名則顯示"匿名"，否則顯示暱稱或ID
    const displayName = isAnonymous ? '匿名' : (post.nickname || post.id);
    // 頭像路徑：如果匿名則使用 user.png，否則使用提供的頭像路徑
    const avatarSrc = isAnonymous ? 'user.png' : (post.avatar || 'user.png');
    
    // 格式化時間、處理內容和圖片
    const formattedTime = this.formatTime(post.time);
    const processedContent = this.processContent(post.content);
    const imagesHTML = this.renderImages(post.images);

    postElement.innerHTML = `
        <div class="post-header">
            <img class="avatar" src="${avatarSrc}" alt="頭像" onerror="this.src='user.png'">
            <div class="user-info">
                <div class="username">
                    ${this.escapeHtml(displayName)}
                    ${isAnonymous ? '<span class="anonymous-badge">匿名</span>' : ''}
                </div>
                <div class="post-time">${formattedTime}</div>
            </div>
        </div>
        <div class="post-title">${this.escapeHtml(post.title)}</div>
        <div class="post-content">${processedContent}</div>
        ${imagesHTML}
        <div class="post-actions">
            <button class="comment-btn" onclick="forumManager.handleCommentClick('${this.escapeHtml(post.hash)}')">
                <img src="Write.png" class="Write" alt="Write">
            </button>
            <button class="expand-btn" onclick="forumManager.handleExpandClick('${this.escapeHtml(post.hash)}')">
                📖 展開
            </button>
        </div>
        <div class="post-meta">
            <div class="hash-info" title="${this.escapeHtml(post.hash)}">
                Hash: ${this.escapeHtml(post.hash.substring(0, 16))}...
            </div>
            <div class="post-id">ID: ${this.escapeHtml(post.id)}</div>
        </div>
        <!-- 留言載入區域 -->
        <div id="comment-loading-${this.escapeHtml(post.hash)}" class="comment-loading" style="display: none;">
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <div class="spinner" style="
                    border: 3px solid var(--border-color);
                    border-top: 3px solid var(--accent-color);
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                "></div>
                <span id="comment-loading-msg-${this.escapeHtml(post.hash)}">驗證帳號中...</span>
            </div>
        </div>
        <!-- 留言輸入區域 -->
        <div id="comment-form-${this.escapeHtml(post.hash)}" class="comment-form" style="display: none;">
            <div style="
                padding: 20px;
                background: var(--secondary-bg);
                border-top: 1px solid var(--border-color);
                margin-top: 15px;
                border-radius: 0 0 12px 12px;
            ">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <select id="comment-anonymous-${this.escapeHtml(post.hash)}" style="
                        padding: 8px 12px;
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                        background: var(--card-bg);
                        color: var(--text-primary);
                        font-size: 14px;
                        min-width: 80px;
                        flex-shrink: 0;
                    ">
                        <option value="false">${this.escapeHtml(sessionStorage.getItem('user') || 'User')}</option>
                        <option value="true">匿名</option>
                    </select>
                    <span style="
                        color: var(--text-secondary);
                        line-height: 38px;
                        flex-shrink: 0;
                    ">：</span>
                    <div style="flex: 1;">
                        <textarea id="comment-content-${this.escapeHtml(post.hash)}" 
                                  placeholder="輸入您的留言..." 
                                  style="
                                      width: 100%;
                                      min-height: 38px;
                                      max-height: 144px;
                                      padding: 8px 12px;
                                      border: 1px solid var(--border-color);
                                      border-radius: 6px;
                                      background: var(--card-bg);
                                      color: var(--text-primary);
                                      font-size: 14px;
                                      line-height: 1.4;
                                      resize: none;
                                      box-sizing: border-box;
                                      font-family: inherit;
                                  "
                                  maxlength="500"
                                  oninput="forumManager.autoResizeTextarea(this)"
                                  onfocus="this.style.borderColor='var(--accent-color)'"
                                  onblur="this.style.borderColor='var(--border-color)'"
                        ></textarea>
                        <div style="
                            text-align: right; 
                            font-size: 12px; 
                            color: var(--text-muted); 
                            margin-top: 4px;
                        ">
                            <span id="comment-char-count-${this.escapeHtml(post.hash)}">0</span>/500
                        </div>
                    </div>
                </div>
                <div style="margin-top: 15px; text-align: right;">
                    <button onclick="forumManager.submitComment('${this.escapeHtml(post.hash)}')" style="
                        padding: 8px 20px;
                        background: var(--accent-color);
                        color: var(--text-primary);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                        margin-right: 10px;
                    " onmouseover="this.style.background='var(--accent-hover)'"
                       onmouseout="this.style.background='var(--accent-color)'"
                    >送出</button>
                    <button onclick="forumManager.hideCommentForm('${this.escapeHtml(post.hash)}')" style="
                        padding: 8px 20px;
                        background: var(--secondary-bg);
                        color: var(--text-secondary);
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='var(--text-muted)'; this.style.color='var(--text-primary)'"
                       onmouseout="this.style.background='var(--secondary-bg)'; this.style.color='var(--text-secondary)'"
                    >取消</button>
                </div>
            </div>
        </div>
        <!-- 留言顯示區域 -->
        <div id="comments-display-${this.escapeHtml(post.hash)}" class="comments-display"></div>
    `;

    document.getElementById('postsContainer').appendChild(postElement);

    // Initial render of comments for this post
    const commentsDisplayDiv = postElement.querySelector(`#comments-display-${this.escapeHtml(post.hash)}`);
    if (commentsDisplayDiv) {
        // Initialize displayed comment count for this post
        commentsDisplayDiv.setAttribute('data-comments-displayed', '0'); // Start with 0, renderCommentsForPost will apply initial 2
        this.renderCommentsForPost(post.hash);
    }
};

// 自動調整文字區域高度
ForumManager.prototype.autoResizeTextarea = function(textarea) {
    // 重置高度以獲得正確的 scrollHeight
    textarea.style.height = 'auto';
    
    // 計算新高度（最少1行，最多6行）
    const lineHeight = 20; // 大約的行高
    const minHeight = 38; // 最小高度
    const maxHeight = 144; // 最大高度（6行）
    
    let newHeight = Math.max(minHeight, textarea.scrollHeight);
    newHeight = Math.min(maxHeight, newHeight);
    
    textarea.style.height = newHeight + 'px';
    
    // 更新字數統計
    const postHash = textarea.id.replace('comment-content-', '');
    const charCountElement = document.getElementById(`comment-char-count-${postHash}`);
    if (charCountElement) {
        charCountElement.textContent = textarea.value.length;
    }
};

// 處理留言按鈕點擊事件
ForumManager.prototype.handleCommentClick = function(postHash) {
    // 檢查登入狀態
    const user = sessionStorage.getItem('user');
    const randomCode = sessionStorage.getItem('randomCode');

    if (!user || !randomCode) {
        window.location.href = 'login.html';
        return;
    }

    // 找到對應的貼文
    const post = this.allPosts.find(p => p.hash === postHash) || 
                 this.filteredPosts.find(p => p.hash === postHash);
    
    if (!post) {
        alert('找不到對應的貼文');
        return;
    }

    currentCommentingPost = post;
    this.startCommentVerification(user, randomCode, postHash);
};

// 處理展開按鈕點擊事件
ForumManager.prototype.handleExpandClick = function(postHash) {
    const commentsContainer = document.getElementById(`comments-display-${postHash}`);
    if (!commentsContainer) return;

    // 獲取當前已顯示的留言數量
    let currentDisplayedCount = parseInt(commentsContainer.getAttribute('data-comments-displayed') || '0', 10);
    
    const allCommentsForPost = this.allComments[postHash] || [];
    const initialDisplayLimit = 2;
    const expandStep = 5;

    let newDisplayedCount;
    if (currentDisplayedCount === 0) {
        // 如果目前沒有顯示任何留言 (理論上不會發生，因為初始會顯示2則，但作為備用)
        newDisplayedCount = initialDisplayLimit; 
    } else if (currentDisplayedCount === initialDisplayLimit) {
        // 如果目前只顯示初始的2則，則首次展開，增加 expandStep
        newDisplayedCount = currentDisplayedCount + expandStep;
    } else {
        // 後續展開，每次增加 expandStep
        newDisplayedCount = currentDisplayedCount + expandStep;
    }

    // 確保不會顯示超過總留言數
    newDisplayedCount = Math.min(newDisplayedCount, allCommentsForPost.length);
    
    commentsContainer.setAttribute('data-comments-displayed', newDisplayedCount);
    this.renderCommentsForPost(postHash); // 使用新的數量重新渲染留言
};

// 開始留言驗證流程
ForumManager.prototype.startCommentVerification = async function(user, randomCode, postHash) {
    // 顯示載入狀態
    this.showCommentLoading(postHash);
    
    // 更新載入訊息
    this.updateCommentLoadingMessage(postHash, '驗證帳號中...');

    try {
        // 提交第一個 Google 表單
        await this.submitFirstCommentGoogleForm(user, randomCode);
        
        // 開始輪詢
        this.startCommentPolling(user, randomCode, postHash);
    } catch (error) {
        console.error('開始留言驗證時發生錯誤:', error);
        this.showCommentError(postHash, '驗證失敗，請重試');
    }
};

// 顯示留言載入狀態
ForumManager.prototype.showCommentLoading = function(postHash) {
    const loadingElement = document.getElementById(`comment-loading-${postHash}`);
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
};

// 隱藏留言載入狀態
ForumManager.prototype.hideCommentLoading = function(postHash) {
    const loadingElement = document.getElementById(`comment-loading-${postHash}`);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
};

// 更新留言載入訊息
ForumManager.prototype.updateCommentLoadingMessage = function(postHash, message) {
    const messageElement = document.getElementById(`comment-loading-msg-${postHash}`);
    if (messageElement) {
        messageElement.textContent = message;
    }
};

// 提交第一個 Google 表單 (用於觸發試算表寫入)
ForumManager.prototype.submitFirstCommentGoogleForm = async function(user, randomCode) {
    const formData = new FormData();
    formData.append('entry.1832293907', user);
    formData.append('entry.1379742742', randomCode);

    try {
        await fetch('https://docs.google.com/forms/d/e/1FAIpQLScCZNt05-1RSFT1tH6ufYv6z8tKRd__YLHJ9rrY8-oeGQlOfQ/formResponse', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        console.log('留言驗證表單提交成功');
    } catch (error) {
        console.error('提交留言驗證表單時發生錯誤:', error);
        throw error;
    }
};

// 開始輪詢 Google 試算表
ForumManager.prototype.startCommentPolling = function(user, randomCode, postHash) {
    commentPollingAttempts = 0;
    // 清除任何可能存在的舊定時器
    if (commentPollingTimerId) {
        clearInterval(commentPollingTimerId);
    }
    commentPollingTimerId = setInterval(() => this.pollCommentGoogleSheet(user, randomCode, postHash), 1000);
};

// 輪詢 Google 試算表
ForumManager.prototype.pollCommentGoogleSheet = async function(user, randomCode, postHash) {
    commentPollingAttempts++;
    console.log(`正在輪詢留言驗證... 嘗試 ${commentPollingAttempts}/${maxCommentPollingAttempts}`);
    
    // 更新載入訊息
    this.updateCommentLoadingMessage(postHash, `驗證帳號中... (${commentPollingAttempts}/${maxCommentPollingAttempts})`);

    if (commentPollingAttempts > maxCommentPollingAttempts) {
        clearInterval(commentPollingTimerId);
        // 在輪詢失敗時也嘗試發送刪除表單，清理試算表中的條目
        await this.sendCommentDeleteForm(user, randomCode);
        this.showCommentError(postHash, '驗證失敗或網路不穩，請重新登入');
        return;
    }

    try {
        // 為了避免瀏覽器快取，可以加上時間戳或隨機參數
        const cacheBuster = `_=${new Date().getTime()}`;
        const sheetUrl = `https://docs.google.com/spreadsheets/d/1BhrlzRjRPErglpx6D_ASDyVue5pEoQrzm1AYCQ21Fic/gviz/tq?tqx=out:json&${cacheBuster}`;

        const response = await fetch(sheetUrl);
        // 檢查響應狀態碼
        if (!response.ok) {
            console.error(`輪詢留言驗證 Google Sheet 失敗, 狀態碼: ${response.status}`);
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
            clearInterval(commentPollingTimerId);

            // 讀取第3列 (索引為 2) 的驗證結果
            const isValid = foundRow.c[2] ? foundRow.c[2].v : false; // 第3列是驗證結果

            // 不論結果如何，先提交刪除表單清理試算表中的這條記錄
            await this.sendCommentDeleteForm(user, randomCode);

            // 根據驗證結果決定顯示哪個畫面
            if (isValid === true || isValid === 'TRUE' || isValid === 'true') {
                this.showCommentForm(postHash); // 驗證成功，顯示留言表單
            } else {
                // 驗證失敗
                this.showCommentError(postHash, '您的帳號可能在別的地方登入了，請重新登入後嘗試');
            }
        }
        // 如果沒找到，繼續輪詢

    } catch (error) {
        console.error('輪詢留言驗證時發生錯誤:', error);
    }
};

// 發送刪除表單 (用於清理試算表中的驗證記錄)
ForumManager.prototype.sendCommentDeleteForm = async function(user, randomCode) {
    const formData = new FormData();
    formData.append('entry.1291631875', user); // 對應 Google 表單中的 user 欄位
    formData.append('entry.1939938647', randomCode); // 對應 Google 表單中的 randomCode 欄位

    try {
        await fetch('https://docs.google.com/forms/d/e/1FAIpQLSe42EFFjWGGg0dQc-B95qVUVwZw7Xb0i6QWKr6bKvEs86_fgg/formResponse', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        console.log('留言刪除表單提交成功');
    } catch (error) {
        console.error('提交留言刪除表單時發生錯誤:', error);
    }
};

// 顯示留言表單
ForumManager.prototype.showCommentForm = function(postHash) {
    this.hideCommentLoading(postHash);
    
    const formElement = document.getElementById(`comment-form-${postHash}`);
    if (formElement) {
        formElement.style.display = 'block';
        
        // 自動聚焦到文字框
        const textarea = document.getElementById(`comment-content-${postHash}`);
        if (textarea) {
            textarea.focus();
        }
        
        // 綁定字數統計事件（如果還沒綁定）
        const charCountElement = document.getElementById(`comment-char-count-${postHash}`);
        if (textarea && charCountElement && !textarea.hasAttribute('data-bound')) {
            textarea.addEventListener('input', () => {
                charCountElement.textContent = textarea.value.length;
                this.autoResizeTextarea(textarea);
            });
            textarea.setAttribute('data-bound', 'true');
        }
    }
};

// 隱藏留言表單
ForumManager.prototype.hideCommentForm = function(postHash) {
    const formElement = document.getElementById(`comment-form-${postHash}`);
    if (formElement) {
        formElement.style.display = 'none';
    }
    
    // 清空表單內容
    const textarea = document.getElementById(`comment-content-${postHash}`);
    const selectElement = document.getElementById(`comment-anonymous-${postHash}`);
    const charCountElement = document.getElementById(`comment-char-count-${postHash}`);
    
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
    if (selectElement) {
        selectElement.selectedIndex = 0;
    }
    if (charCountElement) {
        charCountElement.textContent = '0';
    }
    
    currentCommentingPost = null;
};

// 顯示留言錯誤訊息
ForumManager.prototype.showCommentError = function(postHash, message) {
    this.hideCommentLoading(postHash);
    
    const loadingElement = document.getElementById(`comment-loading-${postHash}`);
    if (loadingElement) {
        loadingElement.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--error-color);">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <div style="font-size: 14px; margin-bottom: 15px;">${this.escapeHtml(message)}</div>
                <button onclick="forumManager.hideCommentError('${postHash}')" style="
                    padding: 6px 16px;
                    background: var(--accent-color);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 44px;
                    cursor: pointer;
                    font-size: 13px;
                ">確定</button>
            </div>
        `;
        loadingElement.style.display = 'block';
    }

    // 清除 sessionStorage 中的用戶資訊，要求重新登入
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('randomCode');
    sessionStorage.removeItem('avatar'); // Clear avatar as well
    sessionStorage.removeItem('nickname'); // Clear nickname as well
};

// 隱藏留言錯誤訊息
ForumManager.prototype.hideCommentError = function(postHash) {
    const loadingElement = document.getElementById(`comment-loading-${postHash}`);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
};

// 提交留言
ForumManager.prototype.submitComment = async function(postHash) {
    const textarea = document.getElementById(`comment-content-${postHash}`);
    const selectElement = document.getElementById(`comment-anonymous-${postHash}`);
    
    if (!textarea || !selectElement) {
        alert('找不到留言表單元素');
        return;
    }
    
    const commentContent = textarea.value.trim();
    const isAnonymous = selectElement.value === 'true';
    
    if (!commentContent) {
        alert('請輸入留言內容');
        return;
    }

    if (commentContent.length > 500) {
        alert('留言內容不能超過500字');
        return;
    }

    try {
        // 獲取 IP 地址
        let userIP = 'Unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            userIP = ipData.ip;
        } catch (ipError) {
            console.warn('無法獲取IP地址:', ipError);
        }

        // 準備表單數據
        const formData = new FormData();
        formData.append('entry.1552519135', isAnonymous ? 'TRUE' : 'FALSE'); // 匿名性
        formData.append('entry.2091281808', sessionStorage.getItem('randomCode')); // randomCode
        formData.append('entry.1056391041', commentContent); // 內文
        formData.append('entry.41727049', userIP); // IP位置
        formData.append('entry.1447096121', postHash); // 貼文哈希值

        // 提交到 Google 表單
        await fetch('https://docs.google.com/forms/d/e/1FAIpQLSf4k7TxyDLwLlStdIN0barqRm9NrfjYc7Bsn3Wkgaoj7I84Zg/formResponse', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });

        console.log('留言提交成功');

        // 構建新的留言物件，包含 session 中的數據
        const studentId = sessionStorage.getItem('user');
        const nickname = sessionStorage.getItem('nickname');
        const avatar = sessionStorage.getItem('avatar');

        const newComment = {
            time: new Date(), // 直接傳遞 Date 物件
            anonymous: isAnonymous,
            content: commentContent,
            postHash: postHash,
            id: studentId,
            avatar: avatar,
            nickname: nickname
        };

        // 將新留言加入到記憶體中的留言數據結構
        if (!this.allComments[postHash]) {
            this.allComments[postHash] = [];
        }
        this.allComments[postHash].push(newComment);
        
        // 重新排序該貼文的留言，確保從舊到新排序，方便編號
        this.allComments[postHash].sort((a, b) => new Date(a.time) - new Date(b.time));

        // 更新顯示的留言數量為總留言數，以確保新留言立即顯示
        const commentsContainer = document.getElementById(`comments-display-${postHash}`);
        if (commentsContainer) {
            commentsContainer.setAttribute('data-comments-displayed', this.allComments[postHash].length);
        }

        // 重新渲染該貼文的所有留言，以包含新留言、更新編號和展開按鈕
        this.renderCommentsForPost(postHash);

        // 隱藏留言表單
        this.hideCommentForm(postHash);

    } catch (error) {
        console.error('提交留言時發生錯誤:', error);
        alert('留言提交失敗，請重試');
    }
};

// 顯示留言在頁面上 (這個函數由使用者提供，但其邏輯將由 renderCommentsForPost 處理)
// 根據「不要修改我的js 而是單純的在我的js尾巴加上新的函數」的指示，此函數保持原樣存在，但其作用會被新的 renderCommentsForPost 函數覆蓋。
ForumManager.prototype.displayComment = function(postHash, comment) {
    console.warn("displayComment 函數正在被呼叫，但現在留言的實際渲染由 renderCommentsForPost 處理。");
    const commentsContainer = document.getElementById(`comments-display-${postHash}`);
    if (!commentsContainer) {
        return;
    }

    // 此段代碼僅保留原始 displayComment 的結構，實際動態更新由 renderCommentsForPost() 完成
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.style.cssText = `
        border-top: 1px solid var(--border-color);
        padding: 15px 20px;
        background: var(--card-bg);
        margin-top: 1px;
    `;

    const displayName = comment.anonymous ? '匿名' : (comment.user || comment.nickname || comment.id);
    const formattedTime = this.formatTime(comment.time);
    const avatarSrc = comment.anonymous ? 'user.png' : (comment.avatar || 'user.png');

    commentElement.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <img class="avatar" src="${avatarSrc}" alt="頭像" onerror="this.src='user.png'" style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                flex-shrink: 0;
            ">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="
                        font-weight: 600;
                        color: var(--text-primary);
                        font-size: 14px;
                    ">${this.escapeHtml(displayName)}</span>
                    ${comment.anonymous ? '<span class="anonymous-badge" style="font-size: 11px; padding: 2px 6px;">匿名</span>' : ''}
                    <span style="
                        font-size: 12px;
                        color: var(--text-muted);
                    ">${formattedTime}</span>
                </div>
                <div style="
                    color: var(--text-secondary);
                    line-height: 1.5;
                    font-size: 14px;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                ">${this.escapeHtml(comment.content)}</div>
            </div>
        </div>
    `;

    commentsContainer.appendChild(commentElement);
    
    // 如果這是第一條留言，設置容器樣式
    if (commentsContainer.children.length === 1) {
        commentsContainer.style.cssText = `
            margin-top: 15px;
            border-top: 2px solid var(--border-color);
            border-radius: 0 0 12px 12px;
            overflow: hidden;
        `;
    }
};

// 添加 CSS 樣式
const commentStyles = document.createElement('style');
commentStyles.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .comment-item:last-child {
        /* This rule is now handled inline in renderCommentsForPost for the last displayed comment */
        /* To ensure the last comment of the *current display* has the radius */
        /* This global rule will apply to the very last comment element in the DOM if it's the actual last */
        /* But the inline style ensures the visible last one has it */
    }
    
    .anonymous-badge {
        background: var(--accent-color);
        color: var(--text-primary);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
    }
`;
document.head.appendChild(commentStyles);

// 修改原有的 renderPost 方法以支援留言按鈕
// 將原來的 renderPost 方法替換為新的版本
ForumManager.prototype.renderPost = ForumManager.prototype.renderPostWithComments;


// ===========================================
// 新增的函數從這裡開始 (包含上次的修改)
// ===========================================

// 新增：載入所有留言數據的函數
ForumManager.prototype.loadAllComments = async function() {
    try {
        const commentSheetId = '165BSDk3rv6wIW9lAUFp1HcmhJWpuHH5WJD2RLD1UoIg'; // 從請求中獲取的試算表 ID
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${commentSheetId}/gviz/tq?tqx=out:json`);
        const jsonpText = await response.text();
        const jsonString = jsonpText.substring(jsonpText.indexOf('{'), jsonpText.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(jsonString);

        if (!jsonData.table || !jsonData.table.rows) {
            console.warn('無法載入留言數據：試算表結構不符預期或無數據');
            return;
        }

        this.allComments = this.parseCommentsData(jsonData.table.rows);
        console.log('留言數據載入成功:', this.allComments);

    } catch (error) {
        console.error('載入留言失敗:', error);
    }
};

// 新增：解析從 Google 試算表獲取的留言數據
ForumManager.prototype.parseCommentsData = function(rows) {
    const commentsByPost = {}; // Key: postHash, Value: array of comments

    // 試算表 A~G 行依序為：時間,匿名？,留言,貼文哈希值,學生id,頭像,暱稱
    // 對應的陣列索引為 0-6
    for (const row of rows) {
        try {
            if (!row.c || !Array.isArray(row.c)) {
                console.warn('無效的留言行數據，跳過:', row);
                continue;
            }

            const comment = {
                time: this.getCellValue(row, 0),       // A: 時間
                anonymous: this.getCellValue(row, 1).toLowerCase() === 'true', // B: 匿名？
                content: this.getCellValue(row, 2),    // C: 留言
                postHash: this.getCellValue(row, 3),   // D: 貼文哈希值
                id: this.getCellValue(row, 4),         // E: 學生id
                avatar: this.getCellValue(row, 5),     // F: 頭像
                nickname: this.getCellValue(row, 6)    // G: 暱稱
            };

            // 驗證必要欄位
            if (comment.time && comment.content && comment.postHash) {
                if (!commentsByPost[comment.postHash]) {
                    commentsByPost[comment.postHash] = [];
                }
                commentsByPost[comment.postHash].push(comment);
            } else {
                console.warn('缺少必要留言欄位，跳過留言:', comment);
            }
        } catch (error) {
            console.warn('解析留言數據時發生錯誤:', error, '行數據:', row);
        }
    }

    // Sort comments for each post by time (oldest first)
    for (const hash in commentsByPost) {
        commentsByPost[hash].sort((a, b) => {
            // 由於 Google Sheet API 返回的時間格式多樣，確保能被 Date 物件正確解析
            // 或使用原始字串比較作為備用方案，以防 Date 物件解析失敗
            const dateA = new Date(a.time);
            const dateB = new Date(b.time);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                // 如果日期無法解析，則嘗試按字串比較，或保持原樣 (返回0)
                return String(a.time).localeCompare(String(b.time));
            }
            return dateA - dateB;
        });
    }

    return commentsByPost;
};

// 新增：渲染特定貼文下方的留言
ForumManager.prototype.renderCommentsForPost = function(postHash) {
    const commentsContainer = document.getElementById(`comments-display-${postHash}`);
    if (!commentsContainer) return;

    const allCommentsForPost = this.allComments[postHash] || [];
    let currentDisplayedCount = parseInt(commentsContainer.getAttribute('data-comments-displayed') || '0', 10);
    const initialDisplayLimit = 2; // 固定顯示最新的2則留言
    const expandStep = 5;         // 每次展開5則較舊的留言

    // 清空現有留言顯示，準備重新渲染
    commentsContainer.innerHTML = '';
    commentsContainer.style.display = 'none'; // 預設隱藏

    if (allCommentsForPost.length === 0) {
        // 如果沒有留言，顯示提示
        commentsContainer.innerHTML = `
            <div style="padding: 15px 20px; font-size: 14px; color: var(--text-muted); text-align: center; border-top: 1px solid var(--border-color); border-radius: 0 0 12px 12px;">
                目前沒有留言。
            </div>
        `;
        commentsContainer.style.display = 'block';
        commentsContainer.removeAttribute('data-comments-displayed'); // 沒有留言時移除屬性
        // 更新展開按鈕狀態
        const expandBtn = commentsContainer.parentElement.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.style.display = 'inline-block';
            expandBtn.textContent = '還沒有留言';
            expandBtn.disabled = true;
            expandBtn.style.background = 'var(--secondary-bg)';
            expandBtn.style.color = 'var(--text-secondary)';
            expandBtn.style.cursor = 'default';
        }
        return;
    }

    let commentsToDisplay = [];
    if (currentDisplayedCount === 0) {
        // 初始載入：顯示最新的2則留言
        commentsToDisplay = allCommentsForPost.slice(Math.max(0, allCommentsForPost.length - initialDisplayLimit));
    } else {
        // 展開或新留言提交後：顯示已確定的數量
        commentsToDisplay = allCommentsForPost.slice(Math.max(0, allCommentsForPost.length - currentDisplayedCount));
    }
    
    // 更新實際顯示的留言數量
    commentsContainer.setAttribute('data-comments-displayed', commentsToDisplay.length);
    const newDisplayedCount = commentsToDisplay.length;


    // 渲染留言
   commentsToDisplay.forEach((comment, idx) => {
        // 獲取此留言在所有留言列表中的實際索引，以給予正確的代號
        const actualIndex = allCommentsForPost.indexOf(comment); 
        const commentNumber = actualIndex + 1; // 留言代號由 #1 開始

        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.style.cssText = `
            border-top: 1px solid var(--border-color);
            padding: 15px 20px;
            background: var(--card-bg);
            margin-top: 1px;
        `;
        // 確保最後一個留言項有圓角
        if (idx === commentsToDisplay.length - 1) {
            commentElement.style.borderRadius = '0 0 12px 12px';
        }

        // --- 請將此行修改為下方的新邏輯 ---
        // const displayName = comment.anonymous ? '匿名' : (comment.nickname || comment.id || '未知使用者'); 
        
        // --- 新的 displayName 邏輯開始 ---
        let displayName;
        if (comment.anonymous) {
            displayName = '匿名';
        } else {
            const nickname = comment.nickname;
            const id = comment.id;
            if (nickname && id) {
                displayName = `${nickname} 　（ ${id} ）`;
            } else if (nickname) {
                displayName = nickname;
            } else if (id) { // 如果暱稱不存在，則使用ID作為後備
                displayName = id;
            } else { // 如果暱稱和ID都為空
                displayName = '未知使用者'; 
            }
        }
        // --- 新的 displayName 邏輯結束 ---

        const formattedTime = this.formatTime(comment.time);
        // 如果 comment.avatar 不為空，則使用它，否則從 session 或預設值
        const avatarSrc = comment.anonymous ? 'user.png' : (comment.avatar || sessionStorage.getItem('avatar') || 'user.png'); 
        
        // ... (迴圈的其餘部分，保持不變)

        commentElement.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <img class="avatar" src="${avatarSrc}" alt="頭像" onerror="this.src='user.png'" style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    flex-shrink: 0;
                ">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="
                            font-weight: 600;
                            color: var(--text-primary);
                            font-size: 14px;
                        ">${this.escapeHtml(displayName)}</span>
                        ${comment.anonymous ? '<span class="anonymous-badge" style="font-size: 11px; padding: 2px 6px;">匿名</span>' : ''}
                        <span style="
                            font-size: 12px;
                            color: var(--text-muted);
                        ">${formattedTime}</span>
                        <span style="
                            font-size: 12px;
                            color: var(--accent-color);
                            font-weight: 500;
                            margin-left: auto; /* Push to right */
                        ">#${commentNumber}</span>
                    </div>
                    <div style="
                        color: var(--text-secondary);
                        line-height: 1.5;
                        font-size: 14px;
                        word-wrap: break-word;
                        white-space: pre-wrap;
                    ">${this.processContent(comment.content)}</div>
                </div>
            </div>
        `;
        commentsContainer.appendChild(commentElement);
    });
    
    // 更新展開按鈕的狀態和文字
    const expandBtn = commentsContainer.parentElement.querySelector('.expand-btn');
    if (expandBtn) {
        const commentsRemaining = allCommentsForPost.length - newDisplayedCount;
        if (commentsRemaining > 0) {
            expandBtn.style.display = 'inline-block';
            expandBtn.textContent = `展開較舊的 ${Math.min(expandStep, commentsRemaining)} 則留言`;
            expandBtn.disabled = false;
            expandBtn.style.background = 'var(--card-bg)';
            expandBtn.style.color = 'var(--text-primary)';
            expandBtn.style.cursor = 'pointer';
        } else {
            expandBtn.style.display = 'inline-block';
            expandBtn.textContent = '已顯示所有留言';
            expandBtn.disabled = true;
            expandBtn.style.background = 'var(--secondary-bg)';
            expandBtn.style.color = 'var(--text-secondary)';
            expandBtn.style.cursor = 'default';
        }
    }
    
    // 如果有留言顯示，設置容器樣式
    if (commentsToDisplay.length > 0) {
        commentsContainer.style.display = 'block';
        commentsContainer.style.cssText += `
            margin-top: 15px;
            border-top: 2px solid var(--border-color);
            border-radius: 0 0 12px 12px;
            overflow: hidden;
        `;
    }
};