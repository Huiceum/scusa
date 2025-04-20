import fitz
import re

# 讀取 PDF
pdf_path = r"C:\Users\huiceum\Desktop\學生會網站資料夾\東吳大學學生自治法規錄 (4) (1).pdf"
output_folder = r"C:\Users\huiceum\Desktop\學生會網站資料夾\split_files\\"  # 你可以改成你要的輸出路徑

# 開啟 PDF
doc = fitz.open(pdf_path)

# 正則表達式匹配目錄標題（根據 PDF 內容自行調整）
pattern = re.compile(r"^東吳大學(.+?)\s*$")

# 自動偵測標題所在頁
sections = []
for page_num in range(len(doc)):
    text = doc[page_num].get_text("text")
    lines = text.split("\n")
    for line in lines:
        match = pattern.match(line.strip())
        if match:
            title = match.group(1).strip()
            sections.append((title, page_num))

# 根據標題分割 PDF
for i in range(len(sections)):
    title, start_page = sections[i]
    end_page = sections[i + 1][1] - 1 if i + 1 < len(sections) else len(doc) - 1
    
    # 建立新 PDF
    new_doc = fitz.open()
    for j in range(start_page, end_page + 1):
        new_doc.insert_pdf(doc, from_page=j, to_page=j)
    
    # 檢查是否有頁面
    if new_doc.page_count > 0:
        # 儲存拆分後的檔案
        safe_title = re.sub(r'[\/:*?"<>|]', '_', title)  # 避免非法字元
        new_doc.save(f"{output_folder}{safe_title}.pdf")
        new_doc.close()
    else:
        print(f"跳過無頁面的區段: {title}")

print("PDF 拆分完成！")
