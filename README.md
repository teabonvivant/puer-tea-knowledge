# 普洱茶知識庫

普洱茶知識庫的靜態網站發布版本，包含 912 個頁面及本地搜尋。

預定公開網址：https://teabonvivant.github.io/puer-tea-knowledge/

## 發布

在 GitHub 儲存庫的 **Settings → Pages** 選擇 **Deploy from a branch**，使用 `main` 分支及 `/(root)` 目錄。

本版本已將網站連結、圖片及搜尋索引的路徑調整至 `/puer-tea-knowledge/`，並加入 `.nojekyll`。

## 檔案範圍

此儲存庫保存已生成的公開網站及網站提供的下載檔案。本地資料庫、原始採集資料、開發依賴及插圖母檔留在原專案中。

## 更新

先在原專案重建 `site/`，再將發布版本轉換為上述網址路徑、檢查內部連結，最後提交至 `main`。GitHub Pages 會根據提交重新發布。
