# okitegami

画像と短い言葉を、流さずに置いておくための小さなWeb棚です。

この版は `data/entries.js` 方式です。  
`index.html` は基本的に触らず、日々の更新は `data/entries.js` に1件足すだけでできます。

## 構成

```text
okitegami/
├── index.html
├── assets/
│   ├── css/
│   │   ├── site.css           # shared CSS
│   │   ├── top-responsive.css
│   │   └── top-weather.css
│   └── js/
│       ├── site.js
│       └── top-weather.js
├── data/
│   ├── entries.js
│   └── site-config.js
├── images/
├── dashboard/
│   ├── index.html
│   ├── dashboard.css
│   ├── dashboard.js
│   └── data/
│       ├── connect-apps.js
│       └── places.js
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
2. `data/entries.js` の `entries = [` の直後に1件追加する

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

`zaike-feed/` は、天気を生活判断に使える形で置いておくための小さな外界アンテナです。

- 表示：`zaike-feed/index.html`
- データ：`zaike-feed/data/feed.json`
- 設定：`zaike-feed/feeds.json`
- 更新スクリプト：`scripts/update_zaike_feed.py`
- 手動更新：GitHub Actions の `Update zaike feed`

場所を変えるときは、`zaike-feed/feeds.json` の `weather.locations` にある緯度・経度を書き換えます。
