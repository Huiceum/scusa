// netlify/functions/fetchSheet.js
export async function handler(event, context) {
  const { sheet } = event.queryStringParameters;

  // 對應表，把簡單的 key 對應到環境變數
  const sheetMap = {
    announcements: process.env.SHEET_ID_ANNOUNCEMENTS,
    icons: process.env.SHEET_ID_ICONS,
    calendar: process.env.SHEET_ID_CALENDAR
  };

  const sheetId = sheetMap[sheet];
  if (!sheetId) {
    return {
      statusCode: 400,
      body: "Invalid sheet key"
    };
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);

    const data = await response.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/csv" },
      body: data
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}
