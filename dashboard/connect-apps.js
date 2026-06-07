window.OKITEGAMI_CONNECTION_APPS = [
  {
    id: "weather",
    name: "天気",
    kind: "state",
    defaultStatus: "on",
    pressure: "low",
    mode: "状態表示",
    description: "今日どうするかを軽くする外界の状態表示。",
    rule: "常時ONでよい。判断を軽くするために見る。",
    href: "../zaike-feed/index.html"
  },
  {
    id: "github-pages",
    name: "GitHub Pages",
    kind: "production",
    defaultStatus: "on",
    pressure: "medium",
    mode: "制作",
    description: "作ったものを置く場所。外へ出すが、流されずに残せる。",
    rule: "作るときだけ開く。改善沼に入ったら切る。",
    href: "../index.html"
  }
];
