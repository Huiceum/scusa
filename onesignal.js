window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "d5610f64-df3e-49d5-8361-4afa83f33240",
    safari_web_id: "web.onesignal.auto.087eca46-faed-450d-af5b-90e7f525c88c",
    notifyButton: {
      enable: true // 不要顯示右下角的紅色按鈕
    },
  });
});


///



OneSignal.push(function () {
  // 建立 DOM 元素
  const dot = document.createElement('div');
  dot.textContent = '.';
  Object.assign(dot.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    color: '#ccc',
    fontSize: '24px',
    zIndex: 9999,
    pointerEvents: 'none',
    userSelect: 'none',
  });

  // 加到畫面上
  document.body.appendChild(dot);

  console.log('✅ OneSignal 已初始化完成');
});


////


let hasPrompted = false;

// 先等 OneSignal 準備好
OneSignal.push(function() {
  console.log("OneSignal Ready");

  // 再去監聽點擊
  document.addEventListener('click', function () {
    if (!hasPrompted) {
      hasPrompted = true;
      console.log("Trigger prompt from click");
      OneSignal.showSlidedownPrompt(); // 彈出推播提示
    }
  });
});