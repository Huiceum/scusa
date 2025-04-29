// firebase-messaging-sw.js 檔案內容：
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// 初始化 Firebase - 確保與主頁面配置相同
firebase.initializeApp({
  apiKey: "AIzaSyDisL-GjghNaUWsDItEjqudlV0G2n_X2YE",
  authDomain: "scusa-85b13.firebaseapp.com",
  projectId: "scusa-85b13",
  storageBucket: "scusa-85b13.firebasestorage.app",
  messagingSenderId: "1050587816495",
  appId: "1:1050587816495:web:d2410e92470dc05d3edcda",
  measurementId: "G-XPP606Y64S"
});

// 取得 messaging 實例
const messaging = firebase.messaging();

// 背景訊息處理 - 正確方式
messaging.onBackgroundMessage(function(payload) {
  console.log('✅ 背景通知接收:', payload);
  
  // 從 payload 獲取通知內容
  const notificationTitle = payload.notification.title || '新通知';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo.png'  // 替換為您的應用圖示
  };

  // 顯示通知
  return self.registration.showNotification(notificationTitle, notificationOptions);
});