/* ===== 奧賽羅 數值設定（對照 數值表.md）=====
 * 改完存檔、重新整理瀏覽器即可生效。
 */
window.OTHELLO_CONFIG = {
  // ---- 電腦對手（由弱到強）----
  // depth       = 往後算幾手（每多 1 手，思考量約乘 4～8 倍）
  // timeMs      = 最長思考時間（毫秒），算不完就用上一層的結果
  // endgame     = 剩下幾個空格以內，改成「算到底」（完美終局）；0 = 不用
  // mistake     = 故意不下最佳手的機率（0～1）
  // mistakeTop  = 失誤時，從前幾名候選裡隨機挑
  // greedy      = true 時只看「這手翻幾顆」，不懂角落和位置（最弱）
  // mobility    = 是否重視「行動力」（自己能下的地方多、對手少）
  levels: [
    { id: 'bean',   img: 'bean.png',   name: '小綠豆', rank: '入門', depth: 1, timeMs: 300,  endgame: 0,  mistake: 0.50, mistakeTop: 6, greedy: true,  mobility: false,
      desc: '剛學會規則，喜歡翻最多顆的地方。' },
    { id: 'rabbit', img: 'rabbit.png', name: '兔兔',   rank: '簡單', depth: 2, timeMs: 500,  endgame: 0,  mistake: 0.25, mistakeTop: 3, greedy: false, mobility: false,
      desc: '知道角落很重要，但常常看不遠。' },
    { id: 'wuji',   img: 'wuji.png',   name: '烏雞',   rank: '普通', depth: 4, timeMs: 1200, endgame: 8,  mistake: 0.06, mistakeTop: 2, greedy: false, mobility: true,
      desc: '會搶角、會留步數，偶爾恍神。' },
    { id: 'laoda',  img: 'laoda.png',  name: '老大',   rank: '困難', depth: 6, timeMs: 2500, endgame: 12, mistake: 0,    mistakeTop: 1, greedy: false, mobility: true,
      desc: '冷靜計算，最後 12 格算到底。' },
    { id: 'devil',  img: 'devil.png',  name: '惡魔',   rank: '魔王', depth: 9, timeMs: 4000, endgame: 16, mistake: 0,    mistakeTop: 1, greedy: false, mobility: true,
      desc: '全力思考，最後 16 格完美收官。' }
  ],

  // ---- 電腦評估盤面的權重 ----
  // 每一格的位置分數（左上到右下，8×8）。角落最高；角旁邊（X 位、C 位）是負分。
  weights: [
    120, -25,  20,   8,   8,  20, -25, 120,
    -25, -45,  -4,  -4,  -4,  -4, -45, -25,
     20,  -4,  15,   3,   3,  15,  -4,  20,
      8,  -4,   3,   3,   3,   3,  -4,   8,
      8,  -4,   3,   3,   3,   3,  -4,   8,
     20,  -4,  15,   3,   3,  15,  -4,  20,
    -25, -45,  -4,  -4,  -4,  -4, -45, -25,
    120, -25,  20,   8,   8,  20, -25, 120
  ],
  cornerTakenNeighbor: 10, // 角落已有棋子後，旁邊 X/C 位改成這個分數（不再危險）
  mobilityWeight: 12,      // 行動力：每多一個可下的位置加幾分
  discWeightLate: 6,       // 剩下空格 ≤ lateEmpties 時，每多一顆棋子加幾分
  lateEmpties: 14,

  // ---- 提示（幫玩家找好棋）----
  hint: { depth: 5, timeMs: 1200, endgame: 12 },

  // ---- 節奏 ----
  aiMinThinkMs: 450,       // 電腦最少「思考」多久才下（太快會像沒想）
  passToastMs: 1500,       // 沒地方下、換對方時，提示停留多久
  flipMs: { slow: 520, normal: 340, fast: 180 }, // 翻棋動畫一顆多久（依設定的動畫速度）
  flipStagger: 45,         // 同一手裡，每顆依序翻開的間隔（毫秒）

  // ---- 其他 ----
  undoLimit: 0,            // 每局可悔棋次數；0 = 不限
  bubbleMs: 2600           // 對手說話泡泡停留多久
};
