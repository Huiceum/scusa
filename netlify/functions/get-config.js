// /netlify/functions/get-config.js

exports.handler = async function(event, context) {
    // 從 Netlify 的伺服器環境中讀取環境變數
    const formUrl = process.env.LOGIN_GOOGLE_FORM_URL;
    const sheetId = process.env.LOGIN_GOOGLE_SHEET_ID;

    // 確保變數存在，如果不存在則回傳錯誤
    if (!formUrl || !sheetId) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error.' })
        };
    }

    // 將環境變數以 JSON 格式回傳給前端
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            loginFormUrl: formUrl,
            loginStatusSheetId: sheetId
        })
    };
};