  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "d5610f64-df3e-49d5-8361-4afa83f33240",
      safari_web_id: "web.onesignal.auto.087eca46-faed-450d-af5b-90e7f525c88c",
      notifyButton: {
        enable: false, // 禁用小鈴鐺按鈕
      },
      autoRegister: true, // 打開網頁自動請求通知權限
    });
  });

