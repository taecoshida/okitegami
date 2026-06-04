const connectionApps = [
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
    id: "hydrogen",
    name: "水素",
    kind: "frontier",
    defaultStatus: "off",
    pressure: "high",
    mode: "手動接続",
    description: "研究・地質・資源に接続する大きな外部文脈。",
    rule: "見るなら30分。追わない。1行だけ持ち帰る。",
    href: ""
  },
  {
    id: "community",
    name: "コミュニティ",
    kind: "community",
    defaultStatus: "off",
    pressure: "medium",
    mode: "読むだけ可",
    description: "場の流れと人の気配に接続する回線。",
    rule: "発言しなくてよい。まずは読むだけでよい。",
    href: ""
  },
  {
    id: "commentary",
    name: "実況",
    kind: "archive",
    defaultStatus: "on",
    pressure: "low",
    mode: "同席",
    description: "他人の反応と同席するための外部音声。",
    rule: "流しっぱなしにしない。見たら1行だけ残す。",
    href: ""
  },
  {
    id: "thought-space",
    name: "思想カフェ",
    kind: "thought-space",
    defaultStatus: "off",
    pressure: "medium",
    mode: "半参加",
    description: "考えている場のリズムに接続する外部回線。",
    rule: "疲れている日は見ない。見たあと生活に戻る。",
    href: ""
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
