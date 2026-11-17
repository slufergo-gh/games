/* ===== 圍棋道場 數值設定（對照 數值表.md）=====
 * 改完存檔、重新整理瀏覽器即可生效。
 */
window.GO_CONFIG = {
  // 貼目（白棋補償）：中國規則數子法
  komi: { 9: 7, 13: 7, handicap: 0.5 },   // 讓子棋時貼目改為 0.5

  // 電腦難度：maxPlayouts = 最多模擬局數；timeMs = 最長思考時間（毫秒），兩者先到為止
  // mistake = 故意不下最佳手的機率；mistakeTop = 失誤時從前幾名候選中隨機挑
  // size13Factor：13×13 時模擬局數乘上的倍率（盤面大，每局較慢）
  difficulty: {
    easy:   { name: '簡單', maxPlayouts: 800,   timeMs: 700,  mistake: 0.30, mistakeTop: 4 },
    normal: { name: '普通', maxPlayouts: 5000,  timeMs: 1800, mistake: 0.05, mistakeTop: 2 },
    hard:   { name: '困難', maxPlayouts: 20000, timeMs: 5000, mistake: 0,    mistakeTop: 1 }
  },
  size13Factor: 0.7,

  // 電腦認輸：勝率低於此值、且已下超過 盤面路數×resignAfterFactor 手
  resignWinrate: 0.03,
  resignAfterFactor: 3,

  // 提示：模擬局數與時間（與難度無關）
  hint: { maxPlayouts: 8000, timeMs: 2000, show: 3 },

  // 覆盤：每一手的分析模擬局數與時間（13×13 時局數 ×0.6）；pvLen = 預想後續最多幾手
  // good / ok / dubious = 勝率掉多少以內算 好棋 / 可以 / 疑問手，超過就是惡手
  review: { maxPlayouts: 5000, timeMs: 1500, pvLen: 8, pvMinVisits: 30, good: 0.03, ok: 0.06, dubious: 0.12 },

  // 形勢判斷與終局判死子：隨機模擬局數
  estimatePlayouts: 400,
  deadStonePlayouts: 800,

  // 讓子位置（黑棋先擺）
  handicapPoints: {
    9:  ['G3', 'C7', 'G7', 'C3', 'E5'],
    13: ['K4', 'D10', 'K10', 'D4', 'G7']
  },

  // 教學演示每一步的間隔（毫秒）
  lessonStepMs: 900,

  // 音量預設（0–100）
  music: {
    defaultVol: 50,
    // 背景音樂：依序輪流播放（使用者提供）
    tracks: ['assets/audio/purpose.mp3', 'assets/audio/undertow.mp3']
  },
  sfx: { defaultVol: 70 }
};
