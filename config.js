window.OKITEGAMI_CONFIG = {
  siteTitle: "okitegami",
  mode: "public",
  dashboardPath: "dashboard/",
  entriesSource: "entries.js",
  weather: {
    enabled: true,
    script: "top-weather.js",
    label: "top weather"
  },
  shelves: [
    {
      label: "zaike weblog",
      path: "weblog/index.html",
      description: "生活の中で発生した観察を、少し長い文章として置いておく場所。"
    },
    {
      label: "zaike recipe",
      path: "recipe/index.html",
      description: "生活の中で再現できた手順を、あとで戻れる形で置いておく場所。"
    },
    {
      label: "zaike sequence",
      path: "sequence/index.html",
      description: "生活の中で状態が切り替わる数秒を、動く写真として置いておく場所。"
    }
  ]
};
