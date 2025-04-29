importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js');

// 初始化 Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDisL-GjghNaUWsDItEjqudlV0G2n_X2YE",
  authDomain: "scusa-85b13.firebaseapp.com",
  projectId: "scusa-85b13",
  storageBucket: "scusa-85b13.firebasestorage.app",
  messagingSenderId: "1050587816495",
  appId: "1:1050587816495:web:d2410e92470dc05d3edcda",
  measurementId: "G-XPP606Y64S"
});

// 取得 Firebase Messaging 實例
const messaging = firebase.messaging();

// 當接收到背景消息時
messaging.onBackgroundMessage(function(payload) {
  console.log('收到背景訊息: ', payload);
  
  // 通知標題與內容
  const notificationTitle = '有新通知！';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'  // 這邊可以設置圖標
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
