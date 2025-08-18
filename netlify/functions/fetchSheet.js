// netlify/functions/fetchSheet.js
export async function handler(event, context) {
  const { sheet } = event.queryStringParameters;

  // 對應表，把簡單的 key 對應到環境變數
  const sheetMap = {
    sa_sheet_av: process.env.ADMINISTRATIVE_VISION,
    sa_sheet_aA: process.env.ADMINISTRATIVE_ACTIVITY,
    sa_sheet_aAnn: process.env.ADMINISTRATIVE_ANNOUNCEMENTS,
    sa_sheet_af: process.env.ADMINISTRATIVE_FOOTER,
    sa_sheet_Navbar: process.env.ADMINISTRATIVE_NAVBAR,
    sa_sheet_O: process.env.ADMINISTRATIVE_ORGANIZATIONAL,
    sa_sheet_ele: process.env.ADMINISTRATIVE_ELE,
    sa_sheet_f: process.env.ADMINISTRATIVE_FIANCE,
    sa_sheet_join: process.env.ADMINISTRATIVE_JOIN,
    sa_sheet_news: process.env.ADMINISTRATIVE_NEWS,
    sa_sheet_law: process.env.ADMINISTRATIVE_LAW
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
