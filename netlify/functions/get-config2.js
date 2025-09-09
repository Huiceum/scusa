// /netlify/functions/get-config.js

exports.handler = async function(event, context) {
    // 從 Netlify 伺服器環境中讀取所有四個環境變數
    const registrationFormUrl = process.env.VITE_REGISTRATION_FORM_URL;
    const verificationFormUrl = process.env.VITE_VERIFICATION_FORM_URL;
    const verificationSheetId = process.env.VITE_VERIFICATION_SHEET_ID;
    const registrationCheckSheetId = process.env.VITE_REGISTRATION_CHECK_SHEET_ID;

    // 確保所有變數都存在，否則回傳錯誤
    if (!registrationFormUrl || !verificationFormUrl || !verificationSheetId || !registrationCheckSheetId) {
        console.error('Server configuration error: Missing required environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error.' })
        };
    }

    // 將所有變數以 JSON 格式回傳給前端
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            registrationFormUrl: registrationFormUrl,
            verificationFormUrl: verificationFormUrl,
            verificationSheetId: verificationSheetId,
            registrationCheckSheetId: registrationCheckSheetId
        })
    };
};