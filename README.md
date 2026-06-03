# okitegami

画像と短い言葉を、流さずに置いておくための小さなWeb棚です。

この版は `entries.js` 方式です。  
`index.html` は基本的に触らず、日々の更新は `entries.js` に1件足すだけでできます。

## 構成

```text
okitegami/
├── index.html
├── style.css
├── entries.js
├── main.js
├── images/
├── weblog/
├── recipe/
├── sequence/
├── zaike-feed/
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── feeds.json
│   └── data/
│       └── feed.json
├── scripts/
│   └── update_zaike_feed.py
└── .github/workflows/
    └── update-zaike-feed.yml
```

## 置き手紙の更新方法

画像ありの場合：

1. `images/` に画像をアップロードする
2. `entries.js` の `entries = [` の直後に1件追加する

```js
{
  date: "2026-05-29",
  title: "タイトル",
  image: "images/2026-05-29.jpg",
  text: `本文を書く。`,
  tags: ["tag"]
},
```

画像なしの場合は `image: ""` にします。

## zaike feed

`zaike-feed/` は、資源・エネルギー・研究開発・制度資料の更新を薄く受信するための棚です。

- 表示：`zaike-feed/index.html`
- データ：`zaike-feed/data/feed.json`
- RSS設定：`zaike-feed/feeds.json`
- 更新スクリプト：`scripts/update_zaike_feed.py`
- 手動更新：GitHub Actions の `Update zaike feed`

RSSを追加するときは、`zaike-feed/feeds.json` にURLを入れて `enabled: true` にします。
