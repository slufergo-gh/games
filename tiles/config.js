// 花磚老厝 數值設定（改這裡就能調整遊戲；對照說明見 數值表.md）
window.CONFIG = {
  // 五種花磚（順序就是牆面第一排由左到右的顏色）
  tiles: [
    { key: 'blue',   name: '鈷藍', color: '#2a4f9c' },
    { key: 'yellow', name: '鵝黃', color: '#e9b93c' },
    { key: 'pink',   name: '牡丹', color: '#d9607a' },
    { key: 'green',  name: '墨綠', color: '#1d5a44' },
    { key: 'mint',   name: '薄荷', color: '#72c3b1' },
  ],
  tilesPerColor: 20,          // 每色花磚數量（總共 5×20 = 100 塊）
  factoryCount: { 2: 5, 3: 7, 4: 9 }, // 人數 → 窯（工廠）數量
  tilesPerFactory: 4,         // 每座窯每回合放幾塊
  minPlayers: 2,
  maxPlayers: 4,

  floorPenalties: [-1, -1, -2, -2, -2, -3, -3], // 破磚列（扣分列）每格扣分，超過格數的磚直接丟掉不扣分
  firstMarkerPenalty: true,   // 拿到「先手牌」是否要佔破磚列一格（原版：是）

  // 終局加分
  bonusRow: 2,                // 每完成一整橫排
  bonusColumn: 7,             // 每完成一整直排
  bonusColor: 10,             // 每集滿一種顏色 5 塊

  endWhenRowsComplete: 1,     // 有人完成幾條橫排就在該回合結束後終局

  // 畫面與動畫
  flyMs: 550,                 // 花磚飛行動畫時間（毫秒）
  toastMs: 2600,              // 通知顯示時間（毫秒）
  roomCodeLength: 4,          // 房間代碼長度
  peerPrefix: 'hualaocuo-v1-',// 連線用的代碼前綴（不同版本互不干擾）
};
