// 烏雞捉迷藏 — 所有可調整的數值都在這裡（對照表見 數值表.md）
// 時間單位：毫秒（1000 = 1 秒）
window.CONFIG = {
  // ===== 角色 =====
  // score：打中得分（負數＝扣分）
  // upMul：露臉時間倍率（1 = 照關卡設定，0.5 = 只露一半時間）
  // hp：要打幾下才會縮回
  // avoid：true = 不能打的角色（打到扣分、中斷連擊；挑戰模式扣一顆心；沒打不算漏掉）
  // doubleHits：打中後接下來幾次命中分數 ×2（幸運星）
  // safeEscape：沒打到讓他跑掉也不扣心、不算漏掉、不斷連擊（惡魔）
  // heal / timeBonus / addTime：補給角色。生存模式打中補 heal 顆心；破關模式計時減 timeBonus 秒；挑戰模式剩餘時間加 addTime 秒（沒打到不算漏掉）
  characters: {
    wuji:   { name: '烏雞',       img: 'assets/images/wuji.png',   score: 10,  upMul: 1.0,  hp: 1 },
    mei:    { name: '烏雞妹妹',   img: 'assets/images/mei.png',    score: 10,  upMul: 1.0,  hp: 1 },
    didi:   { name: '烏雞弟弟',   img: 'assets/images/didi.png',   score: 10,  upMul: 1.0,  hp: 1 },
    bean:   { name: '小綠豆',     img: 'assets/images/bean.png',   score: 10,  upMul: 1.0,  hp: 1 },
    rabbit: { name: '兔兔',       img: 'assets/images/rabbit.png', score: 10,  upMul: 1.0,  hp: 1 },
    kuku:   { name: 'kuku',       img: 'assets/images/kuku.png',   score: 10,  upMul: 1.0,  hp: 1 },
    gf:     { name: '老大女朋友', img: 'assets/images/gf.png',     score: -20, upMul: 1.15, hp: 1, avoid: true },
    lala:   { name: '大長今略略', img: 'assets/images/lala.png',   score: 10,  upMul: 0.9,  hp: 1, doubleHits: 5 },
    devil:  { name: '惡魔',       img: 'assets/images/devil.png',  score: 30,  upMul: 0.7,  hp: 1, safeEscape: true },
    laoda:  { name: '老大',       img: 'assets/images/laoda.png',  score: 20,  upMul: 1.4,  hp: 2 },
    cookie: { name: '餅乾怪獸',   img: 'assets/images/cookie.png', score: 10,  upMul: 0.7,  hp: 1, heal: 1, timeBonus: 3, addTime: 5, bonus: true }
  },
  normals: ['wuji', 'mei', 'didi', 'bean', 'rabbit', 'kuku'], // 一般角色（權重 normal 平均分給他們）

  // ===== 連擊加分 =====
  // 連擊數達到 at 以上時，每次命中額外加 bonus（取符合的最大一級）
  combo: [ { at: 5, bonus: 2 }, { at: 10, bonus: 5 }, { at: 20, bonus: 10 } ],

  // ===== 破關模式 =====
  // 不會失敗、沒有時間限制：分數達到 target 就過關
  // grid：幾乘幾；interval：多久冒出一隻（上下隨機 jitter 比例）
  // upTime：一般角色露臉多久；maxUp：最多同時幾隻
  // weights：各類角色出現機率權重（normal = 一般角色合計）
  // stars：[3 星秒數, 2 星秒數]，在這秒數內過關拿到該星數，超過就是 1 星
  jitter: 0.25,
  levels: [
    { name: '第 1 關　草地暖身', grid: 3, interval: 950, upTime: 1300, maxUp: 1,
      weights: { normal: 1 },                                         target: 350, stars: [38, 54] },
    { name: '第 2 關　別打女朋友', grid: 3, interval: 850, upTime: 1150, maxUp: 2,
      weights: { normal: 0.76, gf: 0.22, cookie: 0.02 },              target: 450, stars: [44, 60] },
    { name: '第 3 關　幸運略略', grid: 3, interval: 780, upTime: 1050, maxUp: 2,
      weights: { normal: 0.64, gf: 0.2, lala: 0.14, cookie: 0.02 },   target: 600, stars: [44, 60] },
    { name: '第 4 關　大庭院', grid: 4, interval: 720, upTime: 1050, maxUp: 2,
      weights: { normal: 0.56, gf: 0.18, lala: 0.1, devil: 0.14, cookie: 0.02 }, target: 700, stars: [44, 60] },
    { name: '第 5 關　老大來了', grid: 4, interval: 650, upTime: 980, maxUp: 3,
      weights: { normal: 0.48, gf: 0.18, lala: 0.1, devil: 0.12, laoda: 0.1, cookie: 0.02 }, target: 850, stars: [40, 55] },
    { name: '第 6 關　全員捉迷藏', grid: 4, interval: 560, upTime: 900, maxUp: 3,
      weights: { normal: 0.44, gf: 0.2, lala: 0.1, devil: 0.14, laoda: 0.1, cookie: 0.02 }, target: 1000, stars: [48, 66] }
  ],

  // ===== 挑戰模式（計時制）=====
  // 開始前可選 3×3 或 4×4；限時 time 秒內拿最高分，漏掉不扣血只斷連擊；打到餅乾怪獸加時間
  // 速度從 start 開始，每 rampEvery 秒變快一級，乘上 rampMul，直到 min
  timed: {
    time: 60,
    intervalStart: 850, intervalMin: 420,
    upTimeStart: 1200, upTimeMin: 700,
    rampEvery: 6, rampMul: 0.93,
    maxUpStart: 1, maxUpMax3: 3, maxUpMax4: 4, maxUpEvery: 15,
    weights: { normal: 0.5, gf: 0.18, lala: 0.1, devil: 0.12, laoda: 0.1, cookie: 0.025 }  // cookie＝加時間
  },

  // ===== 生存模式 =====
  // 開始前可選 3×3 或 4×4；漏掉角色或打到不能打的角色扣一顆心，心扣完就結束（惡魔跑掉不扣）
  survival: {
    hearts: 3,
    intervalStart: 900, intervalMin: 300,
    upTimeStart: 1300, upTimeMin: 550,
    rampEvery: 8, rampMul: 0.92,
    maxUpStart: 1, maxUpMax3: 3, maxUpMax4: 4, maxUpEvery: 25,   // 每 25 秒多一隻可同時出現（3×3 最多 3 隻、4×4 最多 4 隻）
    weights: { normal: 0.5, gf: 0.18, lala: 0.1, devil: 0.12, laoda: 0.1, cookie: 0.015 }  // cookie＝補血，極小機率
  },

  // ===== 音樂 =====
  // 檔案放在 assets/audio/；menu＝封面與選關，timed＝挑戰模式，survival＝生存模式，levels＝破關第 1～6 關各用哪首
  music: {
    tracks: { easy: 'assets/audio/easy.mp3', hard: 'assets/audio/hard.mp3' },  // easy = Sapajou - The Way To You，hard = MBB - Feel Good
    menu: 'easy',
    timed: 'hard',
    survival: 'hard',
    levels: ['easy', 'easy', 'easy', 'hard', 'hard', 'hard']
  },

  // ===== 其他 =====
  hitShowTime: 380,     // 打中後角色頭暈多久才縮回
  holeCooldown: 260,    // 洞空出來後多久才能再冒出
  laodaExtend: 350,     // 老大被打一下後延長露臉時間
  countdown: 3          // 開始前倒數秒數
};
