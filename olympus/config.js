// 奧林帕斯的獻祭 數值設定（改這裡就能調整遊戲；對照說明見 數值表.md）
window.CONFIG = {
  // 七位神：value＝眷顧分數，也是祂的祭品卡張數（原版 5,4,3,3,2,2,2，共 21 張）
  // fam＝「我們這一家」外觀用的角色圖（assets/images/c_<fam>.png）
  gods: [
    { key: 'zeus',      name: '宙斯',       title: '眾神之王',     value: 5, item: 'bull',   itemName: '白色公牛', color: '#e3b84f', fam: 'laoda', famName: '老大' },
    { key: 'poseidon',  name: '波賽頓',     title: '海神',         value: 4, item: 'horse',  itemName: '駿馬',     color: '#4c8fc4', fam: 'wuji',  famName: '烏雞' },
    { key: 'athena',    name: '雅典娜',     title: '智慧女神',     value: 3, item: 'olive',  itemName: '橄欖枝',   color: '#8fa653', fam: 'lala',  famName: '大長今略略' },
    { key: 'apollo',    name: '阿波羅',     title: '太陽與音樂之神', value: 3, item: 'laurel', itemName: '月桂冠',   color: '#e08a3a', fam: 'kwuji', famName: '韓國烏雞' },
    { key: 'aphrodite', name: '阿芙蘿黛蒂', title: '愛與美之神',   value: 2, item: 'rose',   itemName: '玫瑰',     color: '#d9607a', fam: 'gf',    famName: '老大女朋友' },
    { key: 'demeter',   name: '狄蜜特',     title: '豐收女神',     value: 2, item: 'wheat',  itemName: '麥穗',     color: '#cfae45', fam: 'bunny', famName: '兔兔' },
    { key: 'dionysus',  name: '戴歐尼修斯', title: '酒神',         value: 2, item: 'wine',   itemName: '葡萄酒',   color: '#9a5bc0', fam: 'bean',  famName: '小綠豆' },
  ],

  handSize: 6,          // 每回合開始每人手牌數
  removedPerRound: 1,   // 每回合開始蓋掉不用的牌數（原版 1 張）
  winPoints: 11,        // 眷顧分數達到幾分直接獲勝（先判斷）
  winGods: 4,           // 得到幾位神的眷顧獲勝（分數沒人達標時才判斷）

  // 四種行動（每回合每人各用一次）；cards＝要拿出幾張祭品
  actions: [
    { key: 'secret', name: '秘密祈禱', icon: '🕯️', cards: 1, desc: '蓋一張祭品，回合結束才翻開，獻給自己這邊。' },
    { key: 'burn',   name: '焚燒祭品', icon: '🔥', cards: 2, desc: '蓋掉兩張祭品，這回合不算分。' },
    { key: 'oracle', name: '神諭抉擇', icon: '🏺', cards: 3, desc: '拿出三張，對手先挑一張獻給他的神，剩下兩張歸你。' },
    { key: 'tables', name: '雙份供桌', icon: '⚖️', cards: 4, desc: '拿出四張分成兩份（各兩張），對手先挑一份，另一份歸你。' },
  ],

  // 電腦對手：samples＝每個候選動作模擬幾次（越多越強、越慢）
  ai: {
    easy:   { name: '簡單', samples: 4 },
    normal: { name: '普通', samples: 30 },
    hard:   { name: '困難', samples: 120 },
  },
  aiDelayMs: 900,       // 電腦思考的最短停頓（毫秒），讓玩家看得清楚

  toastMs: 2600,        // 通知顯示時間（毫秒）
  roomCodeLength: 4,    // 房間代碼長度（英文字母）
  peerPrefix: 'olympus-sac-v1-', // 連線用代碼前綴（不同版本互不干擾）
  minPlayers: 2,
  maxPlayers: 2,
};
