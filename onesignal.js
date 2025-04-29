window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "d5610f64-df3e-49d5-8361-4afa83f33240",
    safari_web_id: "web.onesignal.auto.087eca46-faed-450d-af5b-90e7f525c88c",
    notifyButton: {
      enable: true // 不要顯示右下角的紅色按鈕
    },
  });

  // 隱藏預設紅色按鈕（但不禁用功能）
  const style = document.createElement('style');
  style.textContent = `
    .onesignal-bell-launcher,
    .onesignal-bell-launcher-button {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // 在 OneSignal 初始化後插入 "我要收到通知" 按鈕
  const subscribeBtn = document.createElement('button');
  subscribeBtn.textContent = '我要收到通知';
  subscribeBtn.style.backgroundColor = 'black';
  subscribeBtn.style.color = 'white';
  subscribeBtn.style.border = 'none';
  subscribeBtn.style.padding = '8px 16px';
  subscribeBtn.style.marginLeft = '10px';
  subscribeBtn.style.borderRadius = '4px';
  subscribeBtn.style.cursor = 'pointer';
  subscribeBtn.style.fontSize = '14px';
  subscribeBtn.style.transition = 'background-color 0.3s';

  // Hover 時變紅色
  subscribeBtn.addEventListener('mouseenter', function() {
    subscribeBtn.style.backgroundColor = 'red';
  });
  subscribeBtn.addEventListener('mouseleave', function() {
    subscribeBtn.style.backgroundColor = 'black';
  });

  // 按下按鈕時觸發 OneSignal 推播 - 修正這裡的點擊處理
  let hasPrompted = false;  // 移到這個作用域內
  subscribeBtn.addEventListener('click', function() {
    console.log('🔔 開始推播授權');
    if (!hasPrompted) {
      hasPrompted = true;
      OneSignal.showSlidedownPrompt();
    }
  });

  // 把按鈕加到 logo 旁邊
  const logoDiv = document.querySelector('#sidebar .logo');
  if (logoDiv) {
    logoDiv.appendChild(subscribeBtn);
  } else {
    console.warn('❗ 找不到 logo 區塊');
    // 嘗試添加到備用位置，如果 logo 找不到
    document.body.appendChild(subscribeBtn);
  }

  console.log('✅ OneSignal 已初始化完成');
  

});