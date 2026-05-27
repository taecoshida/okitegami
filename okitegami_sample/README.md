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
└── images/
```

## 更新方法

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
