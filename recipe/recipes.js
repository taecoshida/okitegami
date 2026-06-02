const recipes = [
{
    date: "2026-06-02",
    title: "鶏スープとキムチのおじや",
    description: "残っていた鶏スープに、ご飯とキムチと卵を入れた。昨日の続きとして食べる。",
    href: "2026-06-02-tori-soup-kimchi-ojiya.html",
    image: "images/2026-06-02-tori-soup-kimchi-ojiya-card.png",
    tags: ["recipe", "rice", "soup", "kimchi", "egg"]
  },
  {
    date: "2026-06-01",
    title: "森チャーハン",
    description: "冷凍チャーハンに冷凍ブロッコリー。少ないが、うまい。",
    href: "2026-06-01-mori-chahan.html",
    image: "images/2026-06-01-mori-chahan-card.png",
    tags: ["recipe", "rice", "broccoli", "frozen"]
  }
];

// 新しいrecipeは、recipes の先頭に足す。
// 更新時に触る場所は基本ここだけ。
// 本文は _template.html をコピーして作る。
