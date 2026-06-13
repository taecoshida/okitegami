const weblogPosts = [
  {
    date: "2026-06-13",
    title: "生活の成立",
    description: "以前は、外へ出ることで生活を成立させようとしていた。いまは、生活が成立したから外へ出られる。",
    href: "2026-06-13-seikatsu-no-seiritsu.html",
    image: "images/2026-06-13-seikatsu-no-seiritsu.png",
    tags: ["weblog", "life", "walking", "outside"]
  },
  {
    date: "2026-06-08",
    title: "老成寺と少年神社",
    description: "老成寺に住み、少年神社へ散歩する。座れるけど、まだ押せる。",
    href: "2026-06-08-rouseiji-to-shounen-jinja.html",
    image: "images/2026-06-08-rouseiji-to-shounen-jinja.png",
    tags: ["weblog", "parable", "life-os", "play"]
  },
  {
    date: "2026-05-31",
    title: "観察あるいは上演",
    description: "ストーリーはなかった。けれど、シークエンスがあり、終わりがあった。",
    href: "2026-05-31-kansatsu-aruiwa-joen.html",
    image: "images/2026-05-31-kansatsu-aruiwa-joen.png",
    tags: ["weblog", "observation", "sequence", "performance"]
  }
];

// 新しいweblogは、weblogPosts の先頭に足す。
// 更新時に触る場所は基本ここだけ。
// 本文は article html をテンプレからコピーして作る。
