const places = [
  {
    id: "matsunoya",
    name: "まつのや",
    image: "",
    role: "近場の給油所。ひとり飯。迷ったらここ。",
    state: "腹は減ったが、外出を重くしたくない時。",
    bestTime: "昼すぎ / 夕方前",
    distanceFeel: "徒歩で成立。チャリ不要。",
    caution: "ここは拡張ではなく main の外食部品。",
    tags: ["給油所", "ひとり", "短距離"],
    query: "まつのや"
  },
  {
    id: "ootoya",
    name: "大戸屋",
    image: "",
    role: "飯＋コーヒー＋滞在。食後に少し座れる。",
    state: "外に出たいが、すぐ帰りたくはない時。",
    bestTime: "14時台",
    distanceFeel: "徒歩だと少し遠い / チャリなら軽い。",
    caution: "昼ピークは避ける。余白を食べに行く。",
    tags: ["定食", "コーヒー", "着席"],
    query: "大戸屋"
  },
  {
    id: "hamazushi",
    name: "はま寿司",
    image: "",
    role: "寿司欲の疎通確認。ひとりだと少し遠い。",
    state: "魚と米を外で軽く食べたい時。",
    bestTime: "平日14時台",
    distanceFeel: "徒歩だと遠い / チャリなら給油所化できるかも。",
    caution: "寿司はすぐ食えちゃう。長居目的にしない。",
    tags: ["寿司", "魚と米", "チャリ候補"],
    query: "はま寿司"
  },
  {
    id: "supermarket",
    name: "スーパー",
    image: "",
    role: "食材補給。帰りに寄れると家が強くなる。",
    state: "米・鶏・野菜・麦茶の在庫を戻したい時。",
    bestTime: "昼すぎ / 夜前",
    distanceFeel: "徒歩でも可 / 荷物があるならチャリ検討。",
    caution: "買いすぎ注意。main を補強する分だけ。",
    tags: ["補給", "在庫", "帰路"],
    query: "スーパー"
  },
  {
    id: "river",
    name: "川沿い / 公園",
    image: "",
    role: "戻りが悪い時の再着地。飯ではない外出先。",
    state: "考えすぎた時、身体を先に動かしたい時。",
    bestTime: "昼以降 / 夕方前",
    distanceFeel: "徒歩で十分 / チャリなら範囲を少し拡張。",
    caution: "冒険にしない。戻って寝るための散歩。",
    tags: ["再着地", "散歩", "低刺激"],
    query: "川沿い 公園"
  }
];
