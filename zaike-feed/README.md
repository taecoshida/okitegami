# zaike feed

資源・エネルギー・研究開発・制度資料の更新を、薄く受信して置いておくための小さな棚です。

## 構成

```text
zaike-feed/
├── index.html
├── style.css
├── main.js
├── feeds.json
└── data/
    └── feed.json

scripts/
└── update_zaike_feed.py

.github/workflows/
└── update-zaike-feed.yml
```

## 役割

- `zaike-feed/index.html`：表示ページ
- `zaike-feed/main.js`：`data/feed.json` を読み込んでカード表示する
- `zaike-feed/data/feed.json`：表示するfeedデータ
- `zaike-feed/feeds.json`：RSS情報源とキーワード分類の設定
- `scripts/update_zaike_feed.py`：RSSを取得して `feed.json` を更新する
- `.github/workflows/update-zaike-feed.yml`：GitHub Actionsから手動更新する

## 使い方

### 1. まずは静的棚として見る

`zaike-feed/index.html` を GitHub Pages で開くと、`data/feed.json` の内容が表示されます。

### 2. RSSを追加する

`zaike-feed/feeds.json` の `feeds` にRSS URLを追加し、`enabled` を `true` にします。

```json
{
  "name": "source name",
  "url": "https://example.com/feed.xml",
  "enabled": true
}
```

RSSがないサイトは、無理に入れず、手動メモとして `data/feed.json` に置く運用でもよいです。

### 3. 手動更新する

GitHubのActions画面から `Update zaike feed` を選び、`Run workflow` を押すと、RSSを取得して `data/feed.json` を更新します。

## 分類

`feeds.json` のキーワードで、項目を以下に分類します。

- `読む`
- `保留`
- `読まない`

最初は分類精度よりも、薄く受信することを優先します。

## メモ

これはニュースアプリではなく、資料棚アンテナです。

- テレビ：社会の気配
- RSS：定点観測アンテナ
- zaike feed：読む/保留/読まないに分ける棚
