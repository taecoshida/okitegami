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

### 画像なしの置き手紙

`entries.js` を開いて、`entries = [` の直後に次のような項目を足します。

```js
{
  date: "2026-05-29",
  title: "タイトル",
  image: "",
  text: "本文を書く。",
  tags: ["tag"]
},
```

### 画像ありの置き手紙

1. `images/` に画像をアップロードします  
2. `entries.js` に次のような項目を足します

```js
{
  date: "2026-05-29",
  title: "タイトル",
  image: "images/2026-05-29.jpg",
  text: "本文を書く。",
  tags: ["photo", "log"]
},
```

## GitHub Pagesでの使い方

1. GitHubで `okitegami` リポジトリを作る
2. このフォルダ内のファイルをアップロードする
3. `Settings` → `Pages` で公開する
4. 更新時は `entries.js` と必要に応じて `images/` だけ触る

## 方針

- HTMLは固定する
- CSSもなるべく固定する
- 投稿内容は `entries.js` に集める
- 画像は `images/` に置く
- 凝った改修はあとでよい
