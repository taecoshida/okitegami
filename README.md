# okitegami

画像と短い言葉を、流さずに置いておくための小さなWeb棚です。

## 構成

```text
okitegami/
├── index.html
├── style.css
└── images/
```

## 更新方法

1. `images/` に画像を入れる
2. `index.html` の `<article class="entry">` をコピーする
3. 日付、画像パス、タイトル、本文を書き換える
4. GitHub Pagesで公開する

画像を表示する場合は、placeholder部分を次のように置き換えます。

```html
<img src="images/2026-05-27.jpg" alt="今日の1枚">
```
