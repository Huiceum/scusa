// 正確版本：使用 compat（相容）版本
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

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

// 取得 messaging 實例
const messaging = firebase.messaging();


