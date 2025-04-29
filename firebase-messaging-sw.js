// firebase-messaging-sw.js 檔案內容：
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDisL-GjghNaUWsDItEjqudlV0G2n_X2YE",
    authDomain: "scusa-85b13.firebaseapp.com",
    projectId: "scusa-85b13",
    storageBucket: "scusa-85b13.firebasestorage.app",
    messagingSenderId: "1050587816495",
    appId: "1:1050587816495:web:d2410e92470dc05d3edcda",
    measurementId: "G-XPP606Y64S"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

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