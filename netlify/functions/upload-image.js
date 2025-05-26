// netlify/functions/upload-image.js
const FormData = require('form-data');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // 從環境變數獲取 ImageKit 私鑰
    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    
    if (!imageKitPrivateKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'ImageKit private key not configured' })
      };
    }

    // 解析請求體中的文件數據
    const { fileData, fileName, folder } = JSON.parse(event.body);
    
    if (!fileData || !fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file data or file name' })
      };
    }

    // 將 base64 數據轉換為 Buffer
    const base64Data = fileData.split(',')[1]; // 移除 data:image/...;base64, 前綴
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 使用 form-data 套件來建立 FormData
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: 'image/jpeg' // 因為前端壓縮為 JPEG
    });
    formData.append('fileName', fileName);
    
    if (folder) {
      formData.append('folder', folder);
    }

    // 上傳到 ImageKit
    const imageKitUploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    const basicAuthHeader = 'Basic ' + Buffer.from(imageKitPrivateKey + ':').toString('base64');

    const response = await fetch(imageKitUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': basicAuthHeader,
        ...formData.getHeaders() // 自動設定正確的 Content-Type
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ 
          error: errorData.message || `Upload failed with status ${response.status}` 
        })
      };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};