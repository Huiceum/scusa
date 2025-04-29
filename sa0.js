document.addEventListener('DOMContentLoaded', function() {
    // 加載導航和底部連結
    loadNavbar();
    loadFooterLinks();
    
    // 設置漢堡選單事件
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    
    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // 設置觀察者以觸發動畫
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    });
    
    document.querySelectorAll('.slide-up').forEach(element => {
        observer.observe(element);
    });
    

    
    ball.addEventListener('click', () => {
        window.location.href = '東吳大學學生會game.html';
    });
});

// 從Google試算表加載導航欄
function loadNavbar() {
    const sheetId = '1Tda_aycVUDGMmdgGK_83M8SI6GVIdo7GBikMi6Q16aw'; 
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    fetch(url)
    .then(response => response.ok ? response.text() : Promise.reject('Network response was not ok'))
    .then(data => {
        // 解析CSV數據
        const rows = data.split('\n');
        const navData = [];
        let currentParent = null;
        
        // 處理數據結構
        rows.forEach(row => {
            const columns = row.split(',').map(col => col.replace(/"/g, '').trim());
            const parentTitle = columns[0];
            const childTitle = columns[1];
            const link = columns[2];
            
            if (parentTitle && !childTitle) {
                currentParent = {
                    title: parentTitle,
                    link: link || '#',
                    children: []
                };
                navData.push(currentParent);
            } else if (currentParent && childTitle) {
                currentParent.children.push({
                    title: childTitle,
                    link: link || '#'
                });
            }
        });
        
        // 構建桌面版導航欄 HTML
        buildDesktopNavHTML(navData);
        
        // 構建手機版側邊欄 HTML
        buildMobileNavHTML(navData);
    })
    .catch(error => {
        console.error('無法載入導航欄數據:', error);
        alert('無法載入導航欄，請檢查網絡連接或試算表設置。');
    });
}

// 構建桌面版導航欄
function buildDesktopNavHTML(navData) {
    const navContainer = document.getElementById('nav-container');
    navContainer.innerHTML = '';
    
    navData.forEach(parent => {
        const navItem = document.createElement('li');
        navItem.className = 'nav-item';
        
        const parentLink = document.createElement('a');
        parentLink.href = parent.link;
        parentLink.textContent = parent.title;
        navItem.appendChild(parentLink);
        
        if (parent.children && parent.children.length > 0) {
            const dropdown = document.createElement('ul');
            dropdown.className = 'dropdown-content';
            
            parent.children.forEach(child => {
                const childItem = document.createElement('li');
                const childLink = document.createElement('a');
                childLink.href = child.link;
                childLink.textContent = child.title;
                childItem.appendChild(childLink);
                dropdown.appendChild(childItem);
            });
            
            navItem.appendChild(dropdown);
        }
        
        navContainer.appendChild(navItem);
    });
}

// 構建手機版側邊欄
function buildMobileNavHTML(navData) {
const mobileNav = document.getElementById('mobile-nav');
mobileNav.innerHTML = '';

navData.forEach((parent, index) => {
const navItem = document.createElement('li');

const mainMenu = document.createElement('div');
mainMenu.className = 'main-menu';
mainMenu.setAttribute('data-target', `#submenu-${index}`);
mainMenu.textContent = parent.title;
navItem.appendChild(mainMenu);

const submenu = document.createElement('ul');
submenu.className = 'submenu';
submenu.id = `submenu-${index}`;

// 添加主導航項目作為第一個子項目
const parentItem = document.createElement('li');
parentItem.innerHTML = `<a href="${parent.link}">${parent.title}</a>`;
submenu.appendChild(parentItem);

// 添加子導航項目
if (parent.children && parent.children.length > 0) {
    parent.children.forEach(child => {
        const childItem = document.createElement('li');
        childItem.innerHTML = `<a href="${child.link}">${child.title}</a>`;
        submenu.appendChild(childItem);
    });
}

navItem.appendChild(submenu);
mobileNav.appendChild(navItem);
});

// 在構建完整個導航後，為所有 main-menu 元素添加點擊事件
const mainMenus = document.querySelectorAll('.main-menu');
mainMenus.forEach(menu => {
menu.addEventListener('click', function() {
    const target = this.getAttribute('data-target');
    const submenu = document.querySelector(target);
    
    // 切換當前 submenu 的 active 類
    submenu.classList.toggle('active');
    
    // 可選：關閉其他已打開的 submenu
    document.querySelectorAll('.submenu.active').forEach(item => {
        if (item !== submenu) {
            item.classList.remove('active');
        }
    });
});
});
}
window.addEventListener('load', function() {
    // 創建新的 bell 按鈕
    var bellButton = document.createElement('div');
    bellButton.classList.add('custom-bell-launcher-button');
    
    // 這裡是控制點擊事件的函數，根據你的需求調整
    bellButton.addEventListener('click', function() {
      // 觸發 OneSignal 訂閱的行為
      OneSignal.push(function() {
        OneSignal.showNativePrompt();
      });
    });
  
    // 將按鈕加入頁面
    document.body.appendChild(bellButton);
  });
  
///////////////////////


    // Firebase 配置
    const firebaseConfig = {
        apiKey: "AIzaSyDisL-GjghNaUWsDItEjqudlV0G2n_X2YE",
        authDomain: "scusa-85b13.firebaseapp.com",
        projectId: "scusa-85b13",
        storageBucket: "scusa-85b13.firebasestorage.app",
        messagingSenderId: "1050587816495",
        appId: "1:1050587816495:web:d2410e92470dc05d3edcda",
        measurementId: "G-XPP606Y64S"
      };
  
      // 初始化 Firebase
      const app = firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();
  
      // 問用戶是否允許通知
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('用戶同意接收通知');
          // 註冊 Service Worker 來處理通知
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(registration => {
              // 獲取推播 Token
              messaging.getToken({
                vapidKey: 'BCw5EjKtOV3A1GQz8F8AZc_k4oZ9gMwNrrBqtP4c3zYX-j5rD7tA-S5-rHmbZ3aXJ2UN0h0k_MuJhjpRA5lm9lM'
              }).then((currentToken) => {
                if (currentToken) {
                  console.log('推播 Token: ', currentToken);
                  // 可以將 Token 存到 Google Sheets 或其他地方
                } else {
                  console.log('無法取得 Token');
                }
              }).catch(err => {
                console.log('無法取得 Token:', err);
              });
            })
            .catch(err => {
              console.log('Service Worker 註冊失敗：', err);
            });
        } else {
          console.log('用戶拒絕通知');
        }
      });