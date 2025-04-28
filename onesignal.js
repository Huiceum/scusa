
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "d5610f64-df3e-49d5-8361-4afa83f33240",  // 替換為你的 appId
      safari_web_id: "web.onesignal.auto.087eca46-faed-450d-af5b-90e7f525c88c", // 替換為你的 safari_web_id
      notifyButton: {
        enable: true,  // 啟用通知按鈕
        position: 'bottom-left',  // 設置按鈕位置，可以是 'bottom-right', 'top-right' 等
      },
      promptOptions: {
        siteName: "你的網站名稱",
        actionMessage: "訂閱我們的推播通知，第一時間接收最新消息！",
        acceptButtonText: "訂閱",
        cancelButtonText: "稍後再說",
      }
    });
  });

