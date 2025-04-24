
// 加載頁腳連結
function loadFooterLinks() {
    const sheetId = '1nyOpPb3bOfeAlPQIlfjJml_DNxm2N6f42UDfrGcoEYE';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    fetch(url)
    .then(response => response.ok ? response.text() : Promise.reject('Network response was not ok'))
    .then(data => {
        const rows = data.split('\n').slice(1); // 分割行並移除標題行
        const footerLinks = document.getElementById('footer-links');
        footerLinks.innerHTML = '';

        rows.forEach(row => {
            const [linkText, linkUrl] = row.split(',').map(col => col.replace(/"/g, '').trim());

            if (linkText && linkUrl) {
                const linkItem = document.createElement('li');
                linkItem.innerHTML = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
                footerLinks.appendChild(linkItem);
            }
        });
    })
    .catch(error => {
        console.error('Error loading footer links:', error);
        console.log('無法載入頁腳連結，請檢查網絡連接或試算表設置。');
    });
}



//////////////////////////////////////////////////////////