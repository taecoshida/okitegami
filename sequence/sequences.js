const sequences = [
  {
    date: "2026-06-03",
    title: "考えられうる最小の外出",
    description: "近所のコンビニへ行き、支払いと事務手続きを済ませて帰宅する。外出を、最小の生活シーケンスとして閉じる。",
    href: "2026-06-03-minimal-outing.html",
    video: "videos/2026-06-03-minimal-outing.mp4",
    tags: ["sequence", "outing", "errand", "micro"]
  },
  {
    date: "2026-06-02",
    title: "草を少し整える",
    description: "動作そのものではなく、状態の余韻を少しだけ動かす。",
    href: "2026-06-02-kusakari-micro-motion.html",
    video: "videos/2026-06-02-kusakari-micro-motion.mp4",
    poster: "images/2026-06-02-kusakari-micro-motion-preview.jpg",
    tags: ["sequence", "motion", "garden", "micro"]
  }
];

// 新しいsequenceは、sequences の先頭に足す。
// 動画は videos/、プレビュー画像は images/ に置く。
// 本文は _template.html をコピーして作る。
