/* ===== 疊羅漢井字棋 數值設定（對照 數值表.md）=====
 * 改完存檔、重新整理瀏覽器即可生效。
 */
window.STACK_CONFIG = {
  // ---- 棋子 ----
  // 每位玩家每種尺寸幾顆：[小, 中, 大]（原版是各 2 顆）
  piecesPerSize: [2, 2, 2],
  // 棋子在格子裡的大小（佔格子寬度的比例）：[小, 中, 大]
  pieceScale: [0.42, 0.60, 0.80],
  // 疊羅漢時，每往上疊一層要往上墊高多少（佔格子高度的比例）
  stackStep: 0.075,

  // ---- 和局判定 ----
  maxTurns: 80,        // 雙方合計下了這麼多手還沒分勝負 → 和局
  repeatDraw: 3,       // 同一個盤面（含手上棋子、輪到誰）出現這麼多次 → 和局

  // ---- 電腦對手 ----
  // depth      = 最多往後算幾手
  // timeMs     = 最長思考時間（毫秒），算不完就用上一層的結果
  // mistake    = 故意不下最佳手的機率（0～1）
  // mistakeTop = 失誤時從前幾名候選裡隨機挑
  // seeWin     = true：有一步就能贏的棋一定會下、對方下一步會贏一定會擋
  levels: [
    { id: 'easy',   name: '簡單', depth: 1, timeMs: 200,  mistake: 0.45, mistakeTop: 6, seeWin: false, desc: '常常沒注意到你快連線了。' },
    { id: 'normal', name: '普通', depth: 2, timeMs: 500,  mistake: 0.15, mistakeTop: 3, seeWin: true,  desc: '會擋、會搶，偶爾恍神。' },
    { id: 'hard',   name: '困難', depth: 12, timeMs: 2000, mistake: 0,    mistakeTop: 1, seeWin: true,  desc: '全力計算，很少犯錯。' }
  ],
  // 電腦評估盤面的分數
  eval: {
    win: 10000,          // 贏的分數（越早贏越高）
    lineTwo: 12,         // 一條線上有自己 2 顆、沒有對方 → 加分
    lineOne: 2,          // 一條線上有自己 1 顆、沒有對方 → 加分
    visible: 3,          // 棋盤上每多一顆露在最上面的棋子
    bigInHand: 4,        // 手上每留一顆大棋（之後可以蓋任何棋）
    center: 3            // 佔住正中央（最上層是自己的）
  },

  // ---- 節奏與動畫 ----
  aiMinThinkMs: 500,     // 電腦最少「思考」多久才下
  dropMs: { slow: 520, normal: 360, fast: 200 }, // 棋子疊上去的動畫時間（依設定的動畫速度）
  winFlashMs: 900,       // 連線後亮起多久才跳出結算

  // ---- 其他 ----
  undoLimit: 0           // 每局可悔棋次數；0 = 不限
};

/* 我們這一家角色（img = assets/images 裡的檔名） */
window.STACK_CHARS = [
  { id: 'wuji',   name: '烏雞',       img: 'wuji.png' },
  { id: 'mei',    name: '烏雞妹妹',   img: 'mei.png' },
  { id: 'didi',   name: '烏雞弟弟',   img: 'didi.png' },
  { id: 'laoda',  name: '老大',       img: 'laoda.png' },
  { id: 'gf',     name: '老大女朋友', img: 'gf.png' },
  { id: 'bean',   name: '小綠豆',     img: 'bean.png' },
  { id: 'lala',   name: '大長今略略', img: 'lala.png' },
  { id: 'rabbit', name: '兔兔',       img: 'rabbit.png' },
  { id: 'kuku',   name: 'kuku',       img: 'kuku.png' },
  { id: 'devil',  name: '惡魔',       img: 'devil.png' },
  { id: 'kwuji',  name: '韓國烏雞',   img: 'kwuji.png' },
  { id: 'cookie', name: '餅乾怪獸',   img: 'cookie.png' }
];
// 預設隊伍：[小, 中, 大]
window.STACK_DEFAULT_TEAMS = [
  ['didi', 'mei', 'wuji'],   // 烏雞隊
  ['bean', 'gf', 'laoda']    // 老大隊
];
