// 圍棋名詞小辭典：術語白話解釋＋小圖；題目文字裡的術語自動變成可點的連結
(function () {
  // [名詞, 別名(空白分隔), 分類, 解釋, 圖]
  // 圖：'c:' 開頭 = 棋盤右上角（J～T 列、1～8 行），記號 x黑 o白 X/O 剛下的那手（紅點）a～c 標字母
  //     否則是小圖，'/' 分行；開頭 't|' 代表最上面一行是棋盤邊線
  const CATS = ['基本概念', '角上的位置', '掛角・守角・夾擊', '棋形與手法', '吃子與戰鬥', '局面與評價'];
  const RAW = [
    // ── 基本概念
    ['定石', '定式', 0, '角上（或邊上）雙方都照著下、結果公平的一套標準下法。是前人和 AI 研究出來的「這樣下雙方都不吃虧」的手順。'],
    ['布局', '', 0, '一盤棋最開始的階段，雙方先搶角、掛角、拆邊，大致分好地盤。'],
    ['手順', '次序 順序', 0, '一連串棋的先後順序。同樣幾手棋，順序不同結果可能完全不一樣。'],
    ['一路', '', 0, '從棋盤邊線往內數第 1 條線，也就是最外圈的邊線。'],
    ['二路', '二線', 0, '從邊線往內數第 2 條線。下在二路的棋很低，圍到的地很少，但不容易被殺。'],
    ['三路', '三線', 0, '從邊線往內數第 3 條線。下在三路容易圍到實地，是「實地線」。'],
    ['四路', '四線', 0, '從邊線往內數第 4 條線。下在四路比較重視往中央發展，是「勢力線」。'],
    ['高位', '在高位', 0, '棋子下在比較靠中央的位置（四路以上）。好處是發展性好，缺點是下面容易被對方鑽進來。'],
    ['低位', '', 0, '棋子下在比較靠邊的位置（三路以下）。好處是實地牢靠，缺點是往外發展比較慢。'],
    ['中腹', '中央', 0, '棋盤的中間區域。棋往中腹走叫「出頭」，可以避免被對方包圍。'],
    ['方向', '', 0, '要往哪一邊發展、從哪一邊擋。同樣一手棋，方向對了能配合自己其他的棋，方向錯了反而幫對方。'],
    ['配置', '', 0, '棋盤上其他地方已經有的棋子。定石常常要看配置選擇，例如旁邊有自己的棋，就適合選比較積極的下法。'],
    ['AI', '', 0, '電腦圍棋程式。2016 年起 AI 的實力超過人類，很多它下的新招改變了定石，書裡常說「AI 認為…」。'],

    // ── 角上的位置
    ['星位', '星', 1, '從兩邊各數第 4 條線的交叉點（4-4）。一手就大致占住角，往兩邊和中央發展都方便，但角上還留有點三三的空隙。', 'c:XQ4'],
    ['小目', '', 1, '一邊數第 3 條、另一邊數第 4 條的交叉點（3-4）。比星位更重視角上的實地，通常還會再補一手把角守好。', 'c:XR4'],
    ['三三', '', 1, '從兩邊各數第 3 條線的交叉點（3-3）。角地最牢靠，但比較低、往外發展慢。', 'c:XR3'],
    ['目外', '', 1, '一邊數第 3 條、另一邊數第 5 條的交叉點（3-5）。比小目更偏向一邊，重視往外發展。', 'c:XR5'],
    ['高目', '', 1, '一邊數第 4 條、另一邊數第 5 條的交叉點（4-5）。位置高，重視勢力，角地容易被對方占去。', 'c:XQ5'],
    ['超高目', '', 1, '一邊數第 4 條、另一邊數第 6 條的交叉點（4-6）。非常重視外勢的少見下法。', 'c:XQ6'],
    ['占角', '', 1, '在空著的角下第一手。角最容易圍地，所以開局都先搶角。'],
    ['角部', '角上 角地', 1, '棋盤四個角落附近的區域。角有兩條邊幫忙圍，是最容易圍出地的地方。'],

    // ── 掛角・守角・夾擊
    ['掛角', '掛', 2, '對方占了角以後，你下在角旁邊，不讓對方輕鬆把整個角圍起來。'],
    ['小飛掛角', '小飛掛', 2, '對星位（或小目）用「小飛」的距離掛角，下在三路。最常見、最基本的掛角。圖中白 O3 就是小飛掛角。', 'c:xQ4 OO3'],
    ['一間高掛', '高掛', 2, '在四路、和對方的角隔一路掛角。位置比較高，比較不容易被壓在低處，重視往外發展。', 'c:xQ4 OO4'],
    ['二間高掛', '', 2, '在四路、和對方的角隔兩路掛角。離得更遠，比較輕。', 'c:xQ4 ON4'],
    ['大飛掛角', '大飛掛', 2, '用「大飛」的距離在三路掛角。離角比較遠，比較不容易被攻擊，但對角的壓力也小。', 'c:xQ4 ON3'],
    ['二間低掛', '', 2, '在三路、和對方的角隔兩路掛角。比小飛掛遠一路，壓力小、比較輕。'],
    ['點三三', '', 2, '對方下星位時，直接下到角裡的三三，把角地搶過來。AI 很喜歡這手，現在已經是最常見的下法之一。圖中白 R3。', 'c:xQ4 OR3'],
    ['托角', '', 2, '從靠邊線的那一側貼著對方的星位下，想在角上就地活出一塊，方向性很強。圖中白 Q3。', 'c:xQ4 OQ3'],
    ['守角', '補角', 2, '自己在角旁邊再補一手，讓角變得牢靠，對方很難再進來。'],
    ['小飛守角', '', 2, '對方掛角後，用小飛的距離守角（圖中黑 R6）。最穩健的守角。', 'c:xQ4 oO3 XR6'],
    ['單關守角', '一間守角', 2, '對方掛角後，往另一邊跳一路守角（圖中黑 Q6）。位置高，重視往外發展。', 'c:xQ4 oO3 XQ6'],
    ['大飛守角', '', 2, '用大飛的距離守角（圖中黑 R7）。守的範圍大，但中間比較空。', 'c:xQ4 oO3 XR7'],
    ['夾擊', '夾', 2, '對方掛角後，不守角，反而在邊上把掛角的棋子夾住，讓它不能舒服地往邊上拆。積極的下法。', 'c:xQ4 oO3 XL3'],
    ['一間低夾', '', 2, '在三路、和對方的掛角子隔一路夾擊（圖中黑 M3）。最嚴厲的夾擊。', 'c:xQ4 oO3 XM3'],
    ['一間高夾', '', 2, '在四路、和對方的掛角子隔一路夾擊（圖中黑 M4）。', 'c:xQ4 oO3 XM4'],
    ['二間低夾', '', 2, '在三路、和對方的掛角子隔兩路夾擊（圖中黑 L3）。', 'c:xQ4 oO3 XL3'],
    ['二間高夾', '', 2, '在四路、和對方的掛角子隔兩路夾擊（圖中黑 L4）。', 'c:xQ4 oO3 XL4'],
    ['三間低夾', '', 2, '在三路、和對方的掛角子隔三路夾擊（圖中黑 K3）。比較寬鬆。', 'c:xQ4 oO3 XK3'],
    ['三間高夾', '', 2, '在四路、和對方的掛角子隔三路夾擊（圖中黑 K4）。', 'c:xQ4 oO3 XK4'],
    ['二間夾', '', 2, '和對方的掛角子隔兩路夾擊，低的叫二間低夾、高的叫二間高夾。'],
    ['三間夾', '', 2, '和對方的掛角子隔三路夾擊，低的叫三間低夾、高的叫三間高夾。'],
    ['反夾', '', 2, '被夾擊的一方不逃，反過來夾住對方的角。等於「你夾我，我也夾你」。'],
    ['二間反夾', '', 2, '被夾擊後，反過來在另一邊隔兩路夾住對方的角（圖中白 Q7）。', 'c:xQ4 oO3 xK3 OQ7'],
    ['雙飛燕', '', 2, '被夾擊後，在角的另一邊再掛一次角，兩邊同時掛住，像兩隻燕子（圖中白 O3、R6）。', 'c:xQ4 oO3 xL3 OR6'],
    ['高雙飛燕', '', 2, '雙飛燕的另一手下在四路（圖中白 Q6），位置比較高。', 'c:xQ4 oO3 xL3 OQ6'],
    ['尖頂', '', 2, '從自己的棋子斜一格下，同時頂住對方的棋子（圖中黑 P3）。把對方往外推，自己守住角地。', 'c:xQ4 oO3 XP3'],
    ['靠壓', '', 2, '從外面（靠中央那側）貼著對方的棋子壓下去（圖中黑 O4），讓對方只能在低處發展，自己取外勢。', 'c:xQ4 oO3 XO4'],
    ['小鬼把門', '', 2, '對方小飛掛角時，在二路用小飛守角（圖中黑 P2），牢牢守住角地，像小鬼守在門口。', 'c:xQ4 oO3 XP2'],
    ['二路飛', '二路小飛', 2, '在二路用「飛」的方式下。常用來守住角地、或在邊上生根，很實惠但位置低。'],
    ['肩衝', '', 2, '斜斜地下在對方棋子靠中央的那個角上，像撞對方的肩膀（圖中白 Q4）。壓低對方，讓它只能在低處圍地。', 'c:xR3 OQ4'],
    ['拆一', '', 2, '沿著邊，和自己的棋子隔一路下。很穩但圍的地小。', 't|......../......../..x.X.../........'],
    ['拆二', '', 2, '沿著邊，和自己的棋子隔兩路下（三路上隔兩格）。三路拆二是最標準的「安定」形，對方很難打進來殺掉。', 't|......../......../.x..X.../........'],
    ['拆三', '', 2, '沿著邊，和自己的棋子隔三路下。圍得比較大，但中間比較容易被打入。', 't|......../......../x...X.../........'],
    ['拆邊', '開拆 拆出 小拆', 2, '沿著邊往外拆開，替自己的棋找生根、圍地的空間。'],
    ['逼', '逼住', 2, '下在接近對方棋子的邊上，壓縮它的發展空間，同時自己也拆了邊。'],

    // ── 棋形與手法
    ['尖', '小尖', 3, '從自己的棋子斜一格下。很難被切斷，形狀堅實。', '....../....../...X../..x.../......'],
    ['飛', '小飛 斜飛', 3, '從自己的棋子走「日」字形（橫 2 豎 1）下，像象棋的馬。比尖走得快，但中間有被切的可能。', '....../....../....X./..x.../......'],
    ['大飛', '', 3, '比小飛更遠，橫 3 豎 1 的距離。走得快，但更容易被切開。', '....../....../....X./.x..../......'],
    ['象步', '', 3, '斜兩格的距離（橫 2 豎 2），像象棋的象。', '....../...X../....../.x..../......'],
    ['大斜', '大斜飛', 3, '橫 3 豎 2 的距離，比小飛更大的斜向飛法。', '....../....X./....../.x..../......'],
    ['跳', '單關 一間跳', 3, '從自己的棋子往前隔一路下。很難被切斷，是往外出頭的好方法。', '....../..X.../....../..x.../......'],
    ['大跳', '二間跳', 3, '往前隔兩路下。走得更快，但中間比較容易被對方鑽進來。', '..X.../....../....../..x.../......'],
    ['跳出', '跳起 跳下', 3, '用「跳」往中央（或往需要的方向）走，避免被對方包圍。'],
    ['飛出', '飛起', 3, '用「飛」往中央走出去。'],
    ['尖出', '', 3, '用「尖」往中央走出去，很結實。'],
    ['靠出', '', 3, '貼著對方的棋子往外走。'],
    ['飛壓', '', 3, '用飛的距離從外面蓋住對方的棋子，壓低它，讓它只能在低處發展。'],
    ['飛封', '封', 3, '用飛的距離把對方的出路堵住，不讓它往中央走。'],
    ['飛刺', '', 3, '用飛的方式下到對方的斷點旁邊，威脅要切斷，逼對方補。'],
    ['靠', '外靠', 3, '貼著對方的棋子下（緊挨著）。通常是想藉著接觸，讓對方應，順便整理自己的形。', '....../..o.../..X.../....../......'],
    ['碰', '', 3, '直接貼在對方單獨一顆棋子旁邊。和「靠」很像，常用在想試探對方應法、就地做活的時候。', '....../..oX../....../....../......'],
    ['托', '托扳', 3, '從靠邊線的那一側貼著對方的棋子下（圖中上方是邊線）。', 't|....../....../..X.../..o.../......'],
    ['壓', '', 3, '從靠中央的那一側貼著對方的棋子下，讓它只能往低處（邊線）走（圖中上方是邊線）。', 't|....../....../..o.../..X.../......'],
    ['貼', '貼起', 3, '緊挨著對方棋子的側面，和它平行地長。', '....../..ox../..oX../....../......'],
    ['扳', '', 3, '雙方棋子碰在一起時，從自己的棋子斜一格下，擋在對方棋子的前面（圖中黑）。是最常見的接觸手法。', '....../...X../..xo../....../......'],
    ['連扳', '', 3, '扳了一次之後，接著再扳一次。積極、緊湊，但會留下斷點。'],
    ['內扳', '', 3, '往裡面（角或邊那一側）扳，重視實地。'],
    ['外扳', '', 3, '往外面（中央那一側）扳，重視外勢。'],
    ['扳頭', '扳二子頭', 3, '在對方一排棋子的最前端扳，擋住它前進的方向。俗話說「二子頭必扳」，很有力。', '....../...X../..xo../..xo../......'],
    ['長', '單長 長出 長起', 3, '從自己的棋子往同一直線延伸一格。很結實，沒有斷點。', '....../..X.../..xo../....../......'],
    ['退', '', 3, '往自己這邊（離對方遠一點）退一步，冷靜補強，不跟對方硬拼。'],
    ['托退', '', 3, '先托一手，再退回來，是在角上就地做活常用的手順。'],
    ['立', '立下', 3, '從自己的棋子往邊線方向直直下一格。擴大角上的實地，也讓自己的棋更容易做眼。', 't|....../..X.../..x.../....../......'],
    ['爬', '', 3, '在二路（或很低的地方）沿著邊一顆一顆往前走。圍到的地很少，通常是不得已的時候才爬。', 't|....../..xX../.ooo../....../......'],
    ['拐', '', 3, '沿著對方的棋子轉個彎，像「ㄱ」字形地包過去。'],
    ['擋', '擋下', 3, '下在對方要前進的路上，把它擋住。', '....../..o.../..o.../..X.../......'],
    ['頂', '', 3, '從自己的棋子直直往前下一格，正好碰到對方的棋子頭上。', '....../..o.../..X.../..x.../......'],
    ['粘', '接', 3, '把兩顆有被切斷危險的自己的棋連起來（圖中黑）。', '....../..o.../.xXx../....../......'],
    ['虎', '虎口', 3, '三顆自己的棋圍住一個空點，形成「虎口」。對方下進那個點會馬上被吃，所以等於連在一起，又比直接粘更有效率。', '....../.x.X../..x.../....../......'],
    ['倒虎', '', 3, '往邊線方向做成的虎口。形狀緊湊，常用來在角上整形。'],
    ['斷', '', 3, '把對方斜著連的兩顆棋切開（圖中黑）。被斷開的兩塊棋要各自想辦法活。', '....../..ox../..Xo../....../......'],
    ['衝', '', 3, '往對方兩顆棋中間的空隙推進去，想把它們分開。', '....../..o.../.xX.../..o.../......'],
    ['衝斷', '', 3, '先衝進對方的空隙，再接著斷開。很強硬的戰鬥手段。'],
    ['靠斷', '', 3, '先靠上去，再斷開對方。'],
    ['托斷', '', 3, '先托，再斷開對方，常讓局面變得複雜。'],
    ['扳斷', '', 3, '對方扳過來時，不退不長，直接把它切斷。'],
    ['點', '', 3, '下在對方棋形的要害（例如做眼的地方、連接的關鍵點）。'],
    ['刺', '', 3, '下在對方兩顆棋中間的旁邊，威脅「下一手就斷你」，逼對方粘（圖中白）。', '....../..O.../.x.x../....../......'],
    ['挖', '', 3, '下在對方兩顆隔一路的棋子正中間，想把它們分開。', '....../....../.oXo../....../......'],
    ['鎮', '', 3, '在對方棋子往中央的方向隔一路下，蓋住它的出路。', 't|......./......./...o.../......./...X.../.......'],
    ['兩尖', '', 3, '連續下兩手尖。看起來土土的（「俗」），但往往很有力。'],
    ['秀策的尖', '秀策尖', 3, '古代名棋手本因坊秀策常用的一手尖，在小目的定石裡很有名，形狀堅實、沒有弱點。'],
    ['形', '棋形 好形 愚形', 3, '棋子排列的樣子。「好形」效率高、不容易被攻擊；「愚形」是棋子擠成一團、浪費子力的形狀。'],

    // ── 吃子與戰鬥
    ['氣', '', 4, '棋子上下左右相鄰的空點。氣被對方全部堵住就會被提掉。'],
    ['叫吃', '打吃 打', 4, '把對方的棋子堵到只剩 1 口氣，下一手就能提掉它（圖中黑）。', '....../..x.../.Xo.../..x.../......'],
    ['抱吃', '', 4, '從外側叫吃，讓對方逃不出去的吃法。'],
    ['提', '提子', 4, '把沒有氣的對方棋子拿掉。'],
    ['征子', '征', 4, '一直叫吃對方，讓對方沿著斜線逃，最後逃到邊上被吃掉。前方如果有對方的棋子接應，就叫「征子不利」，征不掉。'],
    ['枷', '枷吃', 4, '不直接叫吃，而是在對方逃跑的路上隔一格罩住，讓它怎麼逃都逃不掉。'],
    ['劫', '打劫', 4, '雙方可以來回互相提一顆子的形狀。規定被提的一方不能馬上提回，要先在別的地方下一手（找劫材）。'],
    ['棄子', '', 4, '故意讓對方吃掉幾顆子，換取外勢、先手或其他更大的利益。'],
    ['對殺', '', 4, '雙方的棋子互相包圍，比誰的氣多，氣少的被吃。'],
    ['做活', '活棋', 4, '讓一塊棋做出兩隻分開的眼，對方就永遠吃不掉。'],
    ['治孤', '', 4, '處理被對方包圍、還沒活的孤棋，想辦法活或逃出來。'],
    ['斷點', '', 4, '對方下了就能把自己的棋切斷的地方。'],

    // ── 局面與評價
    ['先手', '', 5, '下了之後對方必須應，所以下一手又輪到你。能保留先手就能先去搶別的大地方。'],
    ['後手', '', 5, '下了之後對方不必應，可以去搶別的地方。'],
    ['脫先', '它投 手拔', 5, '這裡先不下，去下棋盤上別的地方。表示這裡已經不急，或別的地方更大。'],
    ['實地', '實利 取地 取角', 5, '已經圍住、確定是自己的地盤（目）。'],
    ['外勢', '勢力 取勢 勢', 5, '面向中央、還沒變成地，但將來能用來圍地或攻擊對方的厚實棋子。'],
    ['厚', '厚實 厚味 厚勢', 5, '棋形堅固、沒有弱點，不怕被攻擊，還能用來攻擊對方。'],
    ['薄', '薄弱', 5, '棋形有弱點（斷點、眼形不足），容易被對方攻擊。'],
    ['兩分', '均勢 互角 大致兩分 局面兩分', 5, '雙方得到的東西差不多，誰也不吃虧。定石的結果通常是兩分。'],
    ['可戰', '雙方可戰 可下 雙方可下', 5, '雙方都能接受、都有得下的局面，結果大致公平。'],
    ['均可接受', '', 5, '雙方都可以接受這個結果，也就是大致公平。'],
    ['告一段落', '', 5, '這一帶的定石已經下完，可以去下別的地方了。'],
    ['定型', '', 5, '把局部的形狀確定下來（下掉一些交換），不再留下變化。'],
    ['交換', '先手交換', 5, '你下一手、對方應一手，這一來一回叫交換。好的交換對自己有利，壞的交換會讓自己失去變化或幫對方補強。'],
    ['本手', '', 5, '樸實、穩健、該下的一手。看起來不起眼，卻能避免以後出問題。'],
    ['正手', '正招 正著', 5, '正確、標準的下法。'],
    ['好手', '', 5, '效果很好的一手。'],
    ['好點', '要點 急所', 5, '雙方都想搶的重要位置。誰先下到誰有利。'],
    ['大場', '', 5, '棋盤上還空著、可以圍很多地的大地方（通常是邊上）。'],
    ['俗手', '', 5, '看起來理所當然，其實效率差或幫對方補強的一手。'],
    ['騙招', '', 5, '看起來好像有便宜可佔，其實是陷阱的下法。對方應對正確的話，下騙招的一方會吃虧。'],
    ['場合下法', '場合', 5, '不是到處都適用，要看棋盤上其他地方的配置才適合下的手法。'],
    ['緊湊', '', 5, '下得很緊、不給對方喘息的空間，效率高。'],
    ['簡明', '', 5, '變化簡單、清楚，不容易出錯。'],
    ['強硬', '', 5, '不退讓，選擇和對方正面衝突的下法。'],
    ['凶狠', '嚴厲', 5, '很有攻擊性、給對方很大壓力的下法。'],
    ['積極', '', 5, '主動出擊、爭取主動權。'],
    ['冷靜', '', 5, '不急著衝突，先把自己補好。'],
    ['靈活', '輕快 輕靈', 5, '不和對方硬拼，下得輕巧，隨時可以轉換方向。'],
    ['穩健', '沉穩 沉著', 5, '穩紮穩打，不冒險。'],
    ['騰挪', '', 5, '被對方包圍時，利用一些交換和棄子，輕巧地整形、求活或逃出。'],
    ['安定', '就地安定 生根', 5, '讓自己的棋在這裡有了根據地，不怕被攻擊（接近做活）。'],
    ['轉身', '轉換', 5, '放棄這裡的一些東西，改去別的地方取得補償。'],
    ['補棋', '補', 5, '在自己的弱點補一手，讓棋形變堅固。'],
    ['步調', '', 5, '下一手棋同時能達到好幾個目的，順暢地往前推進。例如一邊攻擊對方，一邊圍自己的地。'],
    ['出頭', '', 5, '讓自己的棋往中央走，避免被對方包圍。'],
    ['侵分', '', 5, '進到對方的地盤裡，分一部分地。'],
    ['侵入', '打入', 5, '直接下到對方的勢力範圍裡，想在裡面活棋或破壞對方的地。'],
    ['封鎖', '封住', 5, '把對方的棋子堵在裡面，不讓它往中央發展。'],
    ['味道', '餘味', 5, '局部看起來下完了，但還留著以後可以利用的手段。'],
    ['形勢判斷', '形勢', 5, '估算雙方目前的地和厚薄，判斷誰領先。'],
    ['貼目', '貼', 5, '因為黑棋先下比較有利，終局計算時白棋多加的分數。'],
  ];

  const LIST = RAW.map(([t, al, c, d, fig]) => ({ t, al: al ? al.split(/\s+/) : [], cat: CATS[c], d, fig }));
  const BY = new Map();
  LIST.forEach(e => { BY.set(e.t, e); e.al.forEach(a => { if (!BY.has(a)) BY.set(a, e); }); });
  // 單字術語只在座標（例：黑 R6 立）或「位」後面才當術語，避免把「判斷」的「斷」也標起來
  const words = [...BY.keys()].sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp('([A-T]\\d{1,2} ?|位)?(' + words.map(esc).join('|') + ')', 'g');
  // 兩個字以上但容易誤判的詞：只在座標後才算
  const NEEDPRE = new Set(['AI', '勢', '封', '補', '打', '貼', '場合', '可下', '形', '接', '征', '提', '外靠', '形勢', '中央', '角上', '轉換', '封住']);
  const NOPRE_OK = new Set(['形勢判斷', '先手交換']);

  // ── 小圖
  const COLS = 'ABCDEFGHJKLMNOPQRST';
  function figSVG(spec) {
    let W, H, cells = {}, top = false, right = false, hoshi = [];
    if (spec.startsWith('c:')) {
      top = right = true;
      const toks = spec.slice(2).trim().split(/\s+/).map(tok => ({ k: tok[0], c: COLS.indexOf(tok[1]), r: +tok.slice(2) - 1 }));
      const c0 = Math.min(13, Math.min(...toks.map(t => t.c)) - 1), rows = Math.max(5, Math.max(...toks.map(t => t.r)) + 2);
      W = 19 - c0; H = rows;
      toks.forEach(t => { cells[(t.c - c0) + ',' + t.r] = t.k; });
      hoshi = [[15 - c0, 3], [9 - c0, 3]];
    } else {
      let s = spec;
      if (s.startsWith('t|')) { top = true; s = s.slice(2); }
      const rows = s.split('/'); H = rows.length; W = rows[0].length;
      rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') cells[x + ',' + y] = ch; }));
    }
    const g = 24, pad = 14, w = pad * 2 + (W - 1) * g, h = pad * 2 + (H - 1) * g;
    let o = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="tfig"><rect width="${w}" height="${h}" rx="6" fill="#dcb06a"/>`;
    const x1 = w - (right ? pad : 0);
    for (let y = 0; y < H; y++) {
      const yy = pad + y * g;
      o += `<line x1="0" y1="${yy}" x2="${right ? x1 : w}" y2="${yy}" stroke="#3b2a17" stroke-width="${top && y === 0 ? 1.8 : .8}"/>`;
    }
    for (let x = 0; x < W; x++) {
      const xx = pad + x * g;
      o += `<line x1="${xx}" y1="${top ? pad : 0}" x2="${xx}" y2="${h}" stroke="#3b2a17" stroke-width="${right && x === W - 1 ? 1.8 : .8}"/>`;
    }
    hoshi.forEach(([x, y]) => { if (x >= 0 && x < W) o += `<circle cx="${pad + x * g}" cy="${pad + y * g}" r="2.6" fill="#3b2a17"/>`; });
    for (const k in cells) {
      const [x, y] = k.split(',').map(Number), cx = pad + x * g, cy = pad + y * g, ch = cells[k];
      if (/[xXoO]/.test(ch)) {
        const black = ch.toLowerCase() === 'x';
        o += `<circle cx="${cx}" cy="${cy}" r="10.6" fill="${black ? '#151210' : '#f6f2ea'}" stroke="${black ? '#000' : '#8a8070'}" stroke-width="1"/>`;
        if (ch === 'X' || ch === 'O') o += `<circle cx="${cx}" cy="${cy}" r="4" fill="#d8402c"/>`;
      } else {
        o += `<circle cx="${cx}" cy="${cy}" r="7.5" fill="#dcb06a"/><text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#b8412f">${ch.toUpperCase()}</text>`;
      }
    }
    return o + '</svg>';
  }

  // ── 樣式與介面
  const css = `
.term{border-bottom:1.5px dotted currentColor;cursor:help;color:inherit}
.term:hover{background:#ffffff18}
#termPop{position:fixed;z-index:60;display:none;background:var(--paper,#f6ecd8);color:var(--ink,#2b2118);border:2px solid #7a5a36;border-radius:12px;box-shadow:0 10px 28px #000a;padding:12px 14px;width:min(320px,calc(100vw - 24px));font-size:14px;line-height:1.7;user-select:text}
#termPop h4{margin:0 0 2px;font-family:var(--brush);font-size:20px}
#termPop .tc{font-size:12px;color:#8a6a45}
#termPop .tfig{display:block;margin:8px auto 0;max-width:100%;height:auto}
#termPop .tmore{margin-top:6px;font-size:13px;color:#8a3a2a;cursor:pointer;text-decoration:underline}
#dict .dlist{margin-top:8px}
#dict .dent{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border,#5a4632)}
#dict .dent b{font-family:var(--brush);font-size:19px}
#dict .dent .al{font-size:12px;color:var(--muted,#a8957c);margin-left:6px}
#dict .dent p{margin:2px 0 0;font-size:14px;line-height:1.7}
#dict .dent .tfig{flex-shrink:0;width:132px;height:auto}
#dict .dent.hl{background:#ffffff10}
#dict .dtop{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#dict input{flex:1;min-width:140px;padding:7px 10px;border-radius:8px;border:1px solid var(--border,#5a4632);background:#0003;color:var(--paper,#f6ecd8);font-size:15px;user-select:text}
#dict .dcats{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
#dict .dcats button{background:#0000;border:1px solid var(--border,#5a4632);color:var(--paper,#f6ecd8);border-radius:14px;padding:3px 10px;font-size:13px}
#dict .dcats button.on{background:#e3cfa6;color:#2b2118}
@media (max-width:480px){#dict .dent{flex-direction:column}#dict .dent .tfig{width:150px}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const pop = document.createElement('div'); pop.id = 'termPop'; document.body.appendChild(pop);
  const dict = document.createElement('div'); dict.className = 'overlay'; dict.id = 'dict';
  dict.innerHTML = `<div class="card" style="width:min(640px,100%)">
    <h2>名詞小辭典</h2>
    <p class="note" style="margin:4px 0 6px">題目文字裡畫虛線底線的字都可以點，會跳出這裡的解釋。有邊線的圖是棋盤的右上角（和練習的棋盤同一個方向），紅點是剛下的那一手。</p>
    <div class="dtop"><input id="dictQ" placeholder="搜尋，例如：扳、先手、雙飛燕"><button class="btn small dark" data-tact="closeDict">關閉</button></div>
    <div class="dcats" id="dictCats"></div>
    <div class="dlist" id="dictList"></div>
    <button class="btn" data-tact="closeDict" style="margin-top:12px">關閉</button>
  </div>`;
  document.body.appendChild(dict);
  let dcat = '全部';
  function renderDict(focus) {
    const q = ($('#dictQ') || {}).value || '';
    $('#dictCats').innerHTML = ['全部', ...CATS].map(c => `<button data-c="${c}" class="${c === dcat ? 'on' : ''}">${c}</button>`).join('');
    const rows = LIST.filter(e => (dcat === '全部' || e.cat === dcat) && (!q || e.t.includes(q) || e.al.some(a => a.includes(q)) || e.d.includes(q)));
    $('#dictList').innerHTML = rows.map(e => `<div class="dent${focus === e ? ' hl' : ''}" data-t="${e.t}">${e.fig ? figSVG(e.fig) : ''}<div><b>${e.t}</b>${e.al.length ? `<span class="al">也叫：${e.al.join('、')}</span>` : ''}<span class="al">${e.cat}</span><p>${e.d}</p></div></div>`).join('') || '<p class="note">找不到這個名詞。</p>';
    if (focus) { const el = $(`#dictList .dent[data-t="${focus.t}"]`); if (el) el.scrollIntoView({ block: 'center' }); }
  }
  function $(s) { return document.querySelector(s); }
  function openDict(e) { hidePop(); if (e) { dcat = '全部'; $('#dictQ').value = ''; } dict.classList.add('on'); renderDict(e); }
  function closeDict() { dict.classList.remove('on'); }
  dict.addEventListener('input', e => { if (e.target.id === 'dictQ') renderDict(); });
  dict.addEventListener('click', e => {
    const c = e.target.closest('#dictCats button'); if (c) { dcat = c.dataset.c; renderDict(); }
  });

  function showPop(el, e) {
    pop.innerHTML = `<h4>${e.t}</h4><div class="tc">${e.cat}${e.al.length ? ' ・ 也叫 ' + e.al.join('、') : ''}</div><div>${e.d}</div>${e.fig ? figSVG(e.fig) : ''}<div class="tmore" data-tact="dictAt" data-t="${e.t}">在名詞小辭典裡看全部 ›</div>`;
    pop.style.display = 'block';
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), innerWidth - pw - 12);
    let top = r.bottom + 8; if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  function hidePop() { pop.style.display = 'none'; }

  document.addEventListener('click', ev => {
    const t = ev.target.closest('.term');
    if (t) { ev.stopPropagation(); const e = BY.get(t.dataset.t); if (e) showPop(t, e); return; }
    const a = ev.target.closest('[data-tact],[data-act="dict"]');
    if (a) {
      const k = a.dataset.tact || 'dict';
      if (k === 'dict') openDict();
      else if (k === 'closeDict') closeDict();
      else if (k === 'dictAt') openDict(BY.get(a.dataset.t));
      return;
    }
    if (!ev.target.closest('#termPop')) hidePop();
  }, true);
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (pop.style.display === 'block') { hidePop(); ev.stopImmediatePropagation(); ev.preventDefault(); }
    else if (dict.classList.contains('on')) { closeDict(); ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  addEventListener('resize', hidePop);

  // ── 把文字裡的術語包成 <span class="term">
  function decorate(root) {
    if (!root) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement && n.parentElement.closest('.term,button,summary,input,textarea,svg')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    // 同一段文字裡，同一個名詞只標第一次，避免整段都是底線
    const seen = new Set([...root.querySelectorAll('.term')].map(x => BY.get(x.dataset.t)));
    for (const n of nodes) {
      const s = n.nodeValue; RE.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = RE.exec(s))) {
        const pre = m[1] || '', w = m[2];
        if ((w.length === 1 || NEEDPRE.has(w)) && !pre && !NOPRE_OK.has(w)) continue;
        const ent = BY.get(w); if (seen.has(ent)) continue; seen.add(ent);
        if (!frag) frag = document.createDocumentFragment();
        const at = m.index + pre.length;
        if (at > last) frag.appendChild(document.createTextNode(s.slice(last, at)));
        const sp = document.createElement('span'); sp.className = 'term'; sp.dataset.t = w; sp.textContent = w;
        frag.appendChild(sp); last = at + w.length;
      }
      if (frag) { if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(frag, n); }
    }
  }
  const TARGETS = '#rBody,#jTitle,#jIntro,#jTenuki,#jExplain,#jMain,#jLocal,#jNote,#jResult,#jOpts .note,#lQ,#lHint,#lExplain,#lStep,#lPrinciple,#hintBox,#gHint,.help';
  let pending = false;
  function run() { pending = false; document.querySelectorAll(TARGETS).forEach(decorate); }
  new MutationObserver(() => { if (!pending) { pending = true; requestAnimationFrame(run); } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  window.GoTerms = { LIST, CATS, BY, decorate, figSVG, openDict, run };
  run();
})();
