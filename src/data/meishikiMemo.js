// src/data/meishikiMemo.js
/* ─────────────────────────────────────────────────────────────
   MEISHIKI — Phase 1 (Enhanced)
   年柱（年干支）を「立春（節入り）」基準で起こす。

   ■ 診断の姿勢
   - 予言ではなく"傾向の地図"：当て行かない、不安を煽らない
   - 根拠を開示する：土台は天文暦学・一次情報に寄せる
   - 近似スコープを明記：Phase1 = 年柱のみ・立春2/4近似

   ■ 根拠（一次）
   - 六十干支：十干×十二支＝60通り（NDL「日本の暦」）
   - 立春：二十四節気の起点、太陽黄経315°（国立天文台）
   - 立春日時：年により変動（国立天文台 暦要項）
───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────
   References
───────────────────────────────────────── */
export const METHOD_SOURCES = [
  {
    title: "日本の暦｜干支① 六十干支（十干×十二支）",
    url: "https://www.ndl.go.jp/koyomi/chapter3/s1.html",
  },
  {
    title: "日本の暦｜干支② 十二支の性質",
    url: "https://www.ndl.go.jp/koyomi/chapter3/s2.html",
  },
  {
    title: "国立天文台｜二十四節気（立春＝太陽黄経315°）",
    url: "https://eco.mtk.nao.ac.jp/koyomi/faq/24sekki.html",
  },
  {
    title: "国立天文台｜暦要項 二十四節気（年ごとの立春日時）",
    url: "https://eco.mtk.nao.ac.jp/koyomi/yoko/",
  },
  {
    title: "国立天文台｜節分の日が動き出す（立春日付が動く理由）",
    url: "https://eco.mtk.nao.ac.jp/koyomi/topics/html/topics2021_2.html",
  },
];

/* ─────────────────────────────────────────
   十干 / Ten Stems
───────────────────────────────────────── */
export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

export const STEM_META = {
  甲: {
    yinYang: "陽",
    element: "木",
    image: "大樹。まだ倒れない幹。",
    tone: "直進・開拓・最初の一手",
    note: "迷いの前に動く性質がある。動いてから整える型。整える速度が精度を決める。",
  },
  乙: {
    yinYang: "陰",
    element: "木",
    image: "草・蔦。しなやかに回り込む。",
    tone: "柔軟・浸透・縫い目を通る",
    note: "正面突破より迂回が強い。条件を見て経路を変える。変え続けながら根を張る。",
  },
  丙: {
    yinYang: "陽",
    element: "火",
    image: "太陽。照らして動かす。",
    tone: "照射・全開・推進",
    note: "輝くと周りも動く。焦点が定まらないと熱が散る。焦点一つに絞ると強い。",
  },
  丁: {
    yinYang: "陰",
    element: "火",
    image: "燈火。小さくても消えない。",
    tone: "持続・点灯・内側から",
    note: "瞬発より持続。消えそうに見えて消えない型。風を防いでやれば長く燃える。",
  },
  戊: {
    yinYang: "陽",
    element: "土",
    image: "山・台地。重心が低い。",
    tone: "安定・受容・中心を守る",
    note: "揺れない基盤が強み。受け止めた後に整える。整えた後に進む型。",
  },
  己: {
    yinYang: "陰",
    element: "土",
    image: "畑の土。耕すほど豊かになる。",
    tone: "育成・蓄積・じわり浸透",
    note: "一人で刈り取らない。育てながら整える。整えながら積む。積んだものが残る。",
  },
  庚: {
    yinYang: "陽",
    element: "金",
    image: "原石・斧。切れ味と覚悟。",
    tone: "決断・精度・不純物を断つ",
    note: "迷いのある状態を嫌う。決めてから動く。決める前に整えると速い。",
  },
  辛: {
    yinYang: "陰",
    element: "金",
    image: "宝石・刃。磨くほど光る。",
    tone: "研磨・精緻・細部に宿る",
    note: "粗いままでは力が出ない。磨くほど価値が上がる型。磨く環境が条件になる。",
  },
  壬: {
    yinYang: "陽",
    element: "水",
    image: "大海・本流。深く広い。",
    tone: "広域・受容・流れを作る",
    note: "器が大きいぶん、方向を決めないと分散する。流れを決めると圧倒的になる。",
  },
  癸: {
    yinYang: "陰",
    element: "水",
    image: "霧雨・地下水。静かに染みる。",
    tone: "浸透・余韻・見えない力",
    note: "表には出にくいが、深くまで届く。静かに整えると、気づいたら遠くまで届いている。",
  },
};

/* ─────────────────────────────────────────
   十二支 / Twelve Branches
───────────────────────────────────────── */
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const BRANCH_META = {
  子: {
    season: "冬・北",
    nature: "潜勢・蓄積・静止の中の準備",
    tempo: "表面は静かだが内部が動いている。見えないところで整えている時間が長い。",
    environment: "静かで変化の少ない環境で精度が上がる。雑音が少ないほど本来の力が出る。",
    timing: "行動より準備に時間をかける型。準備が整ったときの行動は速い。",
  },
  丑: {
    season: "冬の終わり・北北東",
    nature: "根気・蓄積・着実",
    tempo: "ゆっくり、でも止まらない。一度始めたものを丁寧に積み上げる。",
    environment: "急変の少ない環境で力が出る。コツコツ型の仕組みが合う。",
    timing: "始動は遅いが、定常に入ると強い。定常を守ると積み上げが続く。",
  },
  寅: {
    season: "早春・東北東",
    nature: "開拓・行動・最初の突破",
    tempo: "最初の一手が速い。動いてから考える型。動く速度が強みになる。",
    environment: "変化と新しさがある場で火がつく。単調な繰り返しより、挑戦がある方が合う。",
    timing: "スタートダッシュが得意。立ち上がりに強い。最初の勢いを整えると長続きする。",
  },
  卯: {
    season: "春・東",
    nature: "伸長・柔軟・受け入れ",
    tempo: "柔らかく、しかし芯がある。周囲の変化に対応しながら自分の軸を守る。",
    environment: "プレッシャーが弱い環境で最大値が出る。伸びやすい空気が合う。",
    timing: "焦らず着実に。伸びる時期に合わせると、無理なく遠くまで届く。",
  },
  辰: {
    season: "春の終わり・東南東",
    nature: "変容・蓄積・大きな器",
    tempo: "変化を許容できる大きさがある。ただし、中心軸が必要。軸があれば変容できる。",
    environment: "守るべき核が明確なほど、周辺の変化に適応できる。核が曖昧だと消耗する。",
    timing: "仕込みの時間を大切にする型。仕込みがあれば跳ねる。仕込みなしでは動かない。",
  },
  巳: {
    season: "初夏・南南東",
    nature: "変化・洞察・潜在力",
    tempo: "外には見せないが内部で大きく動く。考えてから動く。考える深度が精度になる。",
    environment: "理解ある少数との環境が合う。大人数の場より、少数深い場が本領。",
    timing: "時期を選ぶ型。急かされると精度が落ちる。自分のタイミングで動くと強い。",
  },
  午: {
    season: "夏・南",
    nature: "情熱・直感・全力",
    tempo: "エネルギーの爆発力がある。ただし、熱が散ると消耗が速い。焦点が命。",
    environment: "自由に動ける空間で最大値が出る。制約が多いと燃え方が弱くなる。",
    timing: "勢いのある時期に一気に動く型。勢いを見極めてから走ると最大効率。",
  },
  未: {
    season: "盛夏・南南西",
    nature: "温もり・継続・じわりと届く",
    tempo: "急がないが離れない。じわじわと浸透して、気づいたら深く根付いている。",
    environment: "温かみのある関係性と空間で本来の力が出る。冷たい評価の場は苦手。",
    timing: "長期的な積み上げが得意。短距離戦より長期が合う。時間を味方にする型。",
  },
  申: {
    season: "初秋・西南西",
    nature: "機転・変化・素早い判断",
    tempo: "状況読みが速い。情報を素早く処理して、最適な手を選ぶ。",
    environment: "変化が多く、判断機会が多い環境で力が出る。単調だと実力が出にくい。",
    timing: "機会を逃さない型。状況が動いたときに素早く乗ると強い。",
  },
  酉: {
    season: "秋・西",
    nature: "整理・精度・研ぎ澄ます",
    tempo: "散らかったものを整理する力がある。整えたものに強い美意識を持つ。",
    environment: "基準が明確な場で実力が出る。曖昧な評価軸だと消耗する。",
    timing: "収穫の時期を見極める型。熟成を待てるほど、仕上がりが良くなる。",
  },
  戌: {
    season: "晩秋・西北西",
    nature: "誠実・守護・信頼の蓄積",
    tempo: "守り続けることで信頼が積まれる。一度決めたことをブレずに続ける強さ。",
    environment: "義理と信頼が大切にされる環境で最大値が出る。薄い関係では力が出ない。",
    timing: "継続が武器。途中でやめないと積み上がる。積み上がると圧倒的な安心感になる。",
  },
  亥: {
    season: "初冬・北北西",
    nature: "潜行・直感・深い内省",
    tempo: "外には見えないが、深く潜って考える。潜った深さがそのまま言葉の重さになる。",
    environment: "静かな内省の時間が確保される環境で力が出る。追い立てられる場は苦手。",
    timing: "内部で熟してから出る型。外から見えないぶん、出てきたときのインパクトが大きい。",
  },
};

/* ─────────────────────────────────────────
   五行 / Five Elements
───────────────────────────────────────── */
export const ELEMENT_DESC = {
  木: "伸長・構想・芽吹き",
  火: "推進・照射・点火",
  土: "安定・受容・蓄積",
  金: "精度・研磨・境界",
  水: "浸透・深度・余韻",
};

/* ─────────────────────────────────────────
   Output Blocks（診断カテゴリ）
───────────────────────────────────────── */
export const OUTPUT_BLOCKS = [
  { key: "core", label: "核", subtitle: "あなたの基本の質感", desc: "自分が最も自分らしいと感じるときの傾向", img: "/meishiki/cat-core.png" },
  { key: "friction", label: "地雷", subtitle: "性能が落ちる条件", desc: "これがあると精度・速度・判断が鈍りやすい", img: "/meishiki/cat-friction.png" },
  { key: "growth", label: "伸び方", subtitle: "成果の出る型", desc: "このやり方で動くと、自然に積み上がる", img: "/meishiki/cat-growth.png" },
  { key: "distance", label: "距離感", subtitle: "人との適温", desc: "この距離感のとき、関係が長く続く", img: "/meishiki/cat-distance.png" },
  { key: "words", label: "言葉の出方", subtitle: "表現と伝わり方", desc: "言葉が最も力を持つ状態と、弱くなる条件", img: "/meishiki/cat-words.png" },
  { key: "time", label: "時間の使い方", subtitle: "リズムと回復", desc: "このリズムで動くと、疲れにくく成果が続く", img: "/meishiki/cat-time.png" },
  { key: "seal", label: "今日の印", subtitle: "一行の記録", desc: "今日、ここに刻んで持ち帰る一文", img: "/meishiki/cat-seal.png" },
];

/* ─────────────────────────────────────────
   BASE（共通）
───────────────────────────────────────── */
export const BASE = {
  core: [
    "急いで決めると誤差が乗りやすい。静かな状態で触れると、判断が自然に絞られる。",
    "答えは外より、内側の一致で出ることが多い。ズレを見つけたら、まず整合を取る。",
    "情報が多いほど良いとは限らない。必要な順番で並ぶと、少ない材料でも見える。",
    "力で押すより、条件を揃えるほうが強い。条件が揃うと、動きは勝手に速くなる。",
    "迷いは欠陥というより“未確定”。確定できる小さな点から置くと落ち着く。",
    "直感は当てものではなく、違いの検知。差が見える環境ほど当たりやすい。",
    "一回で完成させなくていい。仮→修正→確定の往復で精度が上がる。",
    "焦点が一つに絞れると、余計な疲れが減る。疲れが減るほど判断も安定する。",
    "言葉が増えすぎたら、一度戻る合図。短い言葉に戻せると輪郭も戻る。",
    "気温と体調で決断の質が変わる。熱いときは勢い、冷えたときは確認が向く。",
    "まず“どこまでやるか”を決めると楽になる。範囲が決まると迷いが減る。",
    "視界が狭いときほど、決め打ちが危ない。いったん距離を取ると全体が見える。",
    "小さな違和感はサインとして役に立つ。無視せずメモすると後で効いてくる。",
    "混ぜるほど弱くなるものがある。一本に寄せると、自然に強さが出る。",
    "本領は“静かなとき”に出やすい。静けさは甘えではなく条件。",
    "判断が散る日は、順番が逆になっていることがある。順番を戻すと進む。",
    "結果を急ぐより、手順を守るほうが再現性が残る。再現できると強い。",
    "いまの状態を正確に扱えると、次の一手が軽くなる。未来より現在から。",
  ],
  friction: [
    "急かされる・結論だけ求められる・空気で決めさせられる。ここで誤差が増えやすい。",
    "選択肢が多すぎると、正解が見えにくい。まず候補を減らすほうが早い。",
    "雑音（音・光・通知）が多いと、集中が割れる。静かな場所に移すだけで戻る。",
    "ルールが曖昧で、その場の気分で変わる環境。基準が揺れると疲れやすい。",
    "評価の目が強い場。見られている意識で呼吸が浅くなると判断が鈍る。",
    "説明の圧が強いと、頭が飽和する。要点だけに切ると復元が早い。",
    "短期成果だけで追い立てられる。準備工程が削られると失速しやすい。",
    "雑談や同調の要求が続く。目的が薄い会話が長いと消耗が増える。",
    "未確定のまま走らされる。確定点がない状態はストレスになりやすい。",
    "他人のテンポに合わせ続ける。呼吸が乱れると、普段の精度が出にくい。",
    "やることが多すぎる日。量が増えるほど判断が荒くなる。",
    "比較される環境。軸が外へ引っ張られると、回り道が増える。",
    "“今すぐ決めて”が連発する。延期は逃げじゃなく手順として必要な場面がある。",
    "刺激の連続で休みがない。休めないと、ミスの確率が上がる。",
    "説明を盛らされる場。言葉が増えるほど本質が薄くなる。",
    "連絡が多すぎる。思考が分断されると、深い判断がしづらい。",
    "熱量が高すぎる場。熱に巻き込まれると精度が落ちることがある。",
    "“正しさ”が頻繁に変わる場。自分の基準がないと疲れが残りやすい。",
  ],
  growth: [
    "一気に伸ばすより、試して直すほうが合う。小さな実験が積み上がる。",
    "勢いより、続く仕組み。続く形にすると結果が残りやすい。",
    "短距離集中→休む→短距離集中。この波があると伸びが安定する。",
    "やることを減らすほど上手くなることがある。少数に集中すると質が上がる。",
    "先に“やらないこと”を決めると強い。捨てる判断が集中を守る。",
    "フィードバックが早い環境で伸びやすい。戻りが早いほど学習が回る。",
    "行動は小さくていい。小さくても確定させると現実が動く。",
    "準備の時間が長いほど、動き出した後が速い。仕込みが武器になる。",
    "苦手を平均化するより、得意を磨くほうが伸びやすい局面がある。",
    "同じ作業の反復より、同じ構造の反復。型が固まると再現ができる。",
    "成果が出ない時期は“仕上げ前”のことがある。焦らず手順を守ると戻る。",
    "完成を目標にしすぎると止まる。途中の確定点を増やすと進む。",
    "やり直しは失敗ではなく更新。更新できるほど精度が上がる。",
    "自分の条件（時間帯/環境/体調）を把握すると伸びが安定する。",
    "遠回りに見える整理が、後で一番効く。整頓は加速装置になる。",
    "一度に抱えない。分割すると、集中が戻る。",
    "言葉にすると輪郭が出る。輪郭が出ると、次の行動が簡単になる。",
    "波の頂点だけ狙わない。普段を整えると、頂点の質が上がる。",
  ],
  distance: [
    "近さより適温。近すぎると疲れ、適温だと続きやすい。",
    "沈黙が平気な関係で力が戻りやすい。言葉の量が少ないほうが合うことがある。",
    "理解を急がない相手と噛み合う。速さより安定で信頼が積まれる。",
    "踏み込みが雑な相手は疲れやすい。丁寧さがあると安心が残る。",
    "多数と浅くより、少数と深く。深い関係は回復にもなる。",
    "境界があるほうが優しい。境界がないと摩耗が増えやすい。",
    "連絡頻度より、信頼の安定。薄く長くが向くときがある。",
    "合わせすぎると自分が薄くなる。呼吸を守ると関係も安定する。",
    "熱量が高いほど良いわけではない。落ち着いた温度のほうが続く。",
    "“今すぐ答え”を求めない相手が合う。整える時間が尊重されると強い。",
    "距離が乱れると判断も乱れやすい。距離を整えると気持ちも整う。",
    "雑談だけより、目的が共有される関係。目的があると温度が安定する。",
    "監視より尊重。尊重されると力が出やすい。",
    "短期で詰めるより、時間で深まる。急ぐと浅くなることがある。",
    "変化を責めない関係が強い。変化を許せると長く続く。",
    "安心は言葉より態度で積まれる。積まれるほど自然体になれる。",
    "相手のテンポに引っ張られすぎない。自分のテンポが基準。",
    "距離を取る＝冷たい、ではない。距離は安定のための設計。",
  ],
  words: [
    "話すより書くほうがまとまることがある。書くと輪郭が出る。",
    "言い切るより、条件を置くほうが伝わる場面がある。",
    "長文より短文が向くことがある。短文を積むと深さになる。",
    "説明を増やしすぎると散る。要点だけ残すと届く。",
    "感情が強いときは言葉が荒くなる。落ち着いてから出すと精度が上がる。",
    "問いを置くと、相手が動きやすい。答えより問いが効く場面がある。",
    "比喩があると伝わることがある。硬い言葉だけだと通り過ぎる。",
    "正しさより、分かる形。分かる形にすると摩擦が減る。",
    "沈黙が役に立つ場面がある。言わない選択が守りになる。",
    "言葉が出ない日は、情報過多か疲れ。減らすと戻る。",
    "同じ説明を繰り返すと消耗する。図や例に置き換えると楽になる。",
    "“今ここ”の状態を書くだけで整うことがある。記録は回復になる。",
    "攻める言葉より、整う言葉。整うと判断が速くなる。",
    "説明より、順番。順番が良いと少ない言葉で伝わる。",
    "熱い場では言葉が強くなりがち。静かな場では言葉が深くなる。",
    "言葉は武器にも負担にもなる。最小で最大の表現を探すと良い。",
    "相手の理解速度に合わせると通る。合わせないと詰まる。",
    "言葉が増えたら要注意。増えた分だけ核心が隠れることがある。",
  ],
  time: [
    "朝の静けさで判断が安定しやすい。騒がしくなる前が強い。",
    "深夜は集中できても判断が荒れやすい日がある。決断は翌日に回す選択もある。",
    "長距離より中距離。2〜4時間を区切って回すと精度が残る。",
    "休息は停止じゃなく調整。休むほど翌日の質が上がることがある。",
    "同じ時間帯に同じ動作を入れると始動が楽になる。開始の儀式は効く。",
    "予定を詰めすぎると誤差が増える。空白があると修正ができる。",
    "疲れた日の結論は保留が合う。保留は逃げではなく保全。",
    "週の中に整理の日があると強い。整理は生産より先。",
    "通知が多い日は分断が増える。通知を切ると戻る。",
    "昼の強い光や騒音で疲れやすいことがある。夜より“暗い静けさ”が向く日もある。",
    "波を作ると続く。走りっぱなしだと続きにくい。",
    "体の感覚を無視すると後で響く。微調整が最短になることがある。",
    "回復の速さが武器になる。回復できる設計があると挑戦回数が増える。",
    "区切りがないと焦りが増える。区切りがあると安心が増える。",
    "短い休憩でも効く。深呼吸や散歩で判断が戻ることがある。",
    "やる前に“終わり”を決めると楽になる。終わりがあると始めやすい。",
    "余裕がある日に仕込むと強い。余裕がない日に救われる。",
    "時間の使い方より割り方。割り方が整うと迷いが減る。",
  ],
  seal: [
    "今日の一行を残す。未来の自分に渡す。",
    "決める前に、記録する。",
    "急がない。誤差を増やさない。",
    "小さく確定。軽く進む。",
    "保留は弱さじゃない。手順。",
    "静かな場所に戻る。そこから始める。",
    "言葉を減らす。残す。",
    "輪郭が出たら動く。出ない日は整える。",
    "今日の状態を守る。崩さない。",
    "一歩だけでいい。印は一つで足りる。",
    "焦りはノイズ。呼吸は指針。",
    "近道は、順番を守ること。",
    "混ぜない。一本にする。",
    "判断を急がず、条件を揃える。",
    "今日の印は、明日の地図。",
    "書けば戻る。戻れば進む。",
    "静かに置く。確かに残る。",
    "今日を持ち帰る。忘れない。",
  ],
};

/* ─────────────────────────────────────────
   Element Text Overlay（五行）
───────────────────────────────────────── */
const ELEMENT_ADD = {
  木: {
    core: [
      "芽を育てる型。伸びる前に整えると強い。余白があるほど発想が広がる。",
      "構想が先に立つ。育つ速度は一定だが、整えるほど幹が太くなる。",
      "まだ形にならないものを大切にする。種を蒔く判断が、最終的に一番大きく返ってくる。",
    ],
    friction: [
      "可能性を否定される場で消耗しやすい。刈り込みが急だと輪郭が薄くなる。",
      "伸びる余白がないと弱い。余白は甘えではなく条件。",
      "焦って刈り取ると、後の収量が減る。熟すのを待つほうが強い型。",
    ],
    growth: [
      "育てる→剪定→育てる。波で伸びる。剪定が上手いほど強くなる。",
      "芽を小さく確定させると進む。確定が養分になる。",
      "根を張るほど、幹が揺れなくなる。根は見えないが、最終的に全体を支える。",
    ],
    distance: [
      "見守られる距離が合う。急接近より、育つ関係。",
      "干渉が少ないほど力が出る。距離が成長を守る。",
    ],
    words: [
      "言葉に芽がある。小さな一言が、時間差で大きく育つ型。",
      "構想を言葉にすることで、輪郭が固まっていく。話してみると整理される。",
    ],
    time: [
      "春の木のように、ゆっくり伸びる型。急かされると逆に遅くなる。",
      "仕込みの時間が長くて当然。仕込んだぶんだけ、伸びる高さが変わる。",
    ],
  },
  火: {
    core: [
      "点火すると速い。火がつく条件が鍵。焦点が定まると強い。",
      "熱が出ると推進力が出る。熱が散ると誤差が増える。焦点の管理が命。",
      "一度燃えると周りも巻き込む力がある。ただし、散らかったまま燃えると消耗が速い。",
    ],
    friction: [
      "雑音が多いと火が散る。焦点が必要。熱を奪われる場で消耗しやすい。",
      "同調圧が強いと燃え尽きやすい。適温の設計が必要。",
      "熱量を否定される場が苦手。熱を尊重してくれる環境で最大値が出る。",
    ],
    growth: [
      "点火→形にする。この順で勝てる。燃やして冷ます波が合う。",
      "短い集中で燃やし、休んで戻す。波の設計が強さになる。",
      "火がついたときに、一気に形にする。後でやろうは火が消える。",
    ],
    distance: [
      "近すぎると熱が乱れる。適温が大事。温度を尊重する関係が良い。",
      "熱量の押し付けが苦手。静かな理解で安定する。",
    ],
    words: [
      "言葉に熱がある。熱があると動かせる。熱がない言葉は届かない型。",
      "感情を乗せた言葉が強い。ただし、過熱すると誤射になる。温度の調整が精度になる。",
    ],
    time: [
      "燃えている時間は短いが密度が高い。その時間を守ると、圧倒的に進む。",
      "休息は「火を消す」ではなく「燃料を補充する」時間。補充があると次の燃え方が強い。",
    ],
  },
  土: {
    core: [
      "整地が得意。積み上げで強くなる。足場が固まると迷いが減る。",
      "安定が先。安定が出ると精度が出る。精度が出ると速度が出る。",
      "受け止める力がある。受け止めてから整える。整えてから進む型。",
    ],
    friction: [
      "方針転換が多い場で摩耗しやすい。足場が揺れると輪郭が出ない。",
      "未整地のまま走ると崩れる。整地が必要条件。",
      "急な変化が続くと消耗が増える。変化を整える時間が必要。",
    ],
    growth: [
      "整える→積む→整える。地ならしが成果になる。継続が資産になる。",
      "小さな安定を増やすほど強くなる。安定が速度を生む。",
      "足場を作ることが最速。足場がないまま走ると、後で大きく崩れる。",
    ],
    distance: [
      "信頼が積もる距離が合う。短期より長期。約束が守られる関係で安心する。",
      "生活温度が近い相手と合う。急な変化が少ないほど安定する。",
    ],
    words: [
      "重みのある言葉が出る型。一言に積み上げてきたものが乗る。",
      "実績を伴う言葉が強い。言葉だけより、行動の後の言葉が届く。",
    ],
    time: [
      "毎日の地ならしが、気づいたら大きな土台になる。小さな習慣が最大の武器。",
      "急がないほうが正確な型。丁寧に積んだものは、簡単には崩れない。",
    ],
  },
  金: {
    core: [
      "研磨で強くなる。精度と境界が武器。削るほど価値が上がる。",
      "線が綺麗なほど強い。線が濁ると弱い。境界が守りになる。",
      "不純物を抜く力がある。抜いた後の純度が、そのまま説得力になる。",
    ],
    friction: [
      "曖昧な基準の場で疲れやすい。妥協を迫られると精度が落ちる。",
      "濁った状態を放置すると摩耗が増える。線を引き直す必要がある。",
      "粗雑な仕事環境が苦手。精度を求めてくれる場で力が出る。",
    ],
    growth: [
      "磨く→確定→磨く。研磨の反復で強くなる。削って残すほど刺さる。",
      "不純物を抜くほど上がる。上がると次の不純物が見える。これが成長。",
      "一点に集中して磨くと、突き抜ける。広く浅くより、狭く深く。",
    ],
    distance: [
      "境界が明確な関係で安定する。踏み込まれすぎない関係で優しさが出る。",
      "距離が守られているほど、誠実さが出る。",
    ],
    words: [
      "言葉を研ぐ型。余分を削ったときに、最も力が出る。",
      "不要な言葉を入れないほど、伝わる。磨かれた言葉が、信頼を作る。",
    ],
    time: [
      "磨く時間が短いと仕上がりが荒い。時間をかけて磨くと、仕上がりが圧倒的になる。",
      "完成度へのこだわりを持ちながら、確定する判断が必要。磨きすぎも選択肢の一つ。",
    ],
  },
  水: {
    core: [
      "深度が強い。静けさで思考が深く潜る。余韻を扱える型。",
      "深く潜れる環境で強い。浅い結論を急がないほうが精度が出る。",
      "見えないところで流れを作る力がある。気づいたら、全体が動いている。",
    ],
    friction: [
      "騒がしさが続くと深度が出ない。浅い結論を急がされると誤差が増える。",
      "情報が荒いと疲れる。静けさが必要条件。",
      "流れを止められる場が苦手。停滞が続くと、力が出なくなる。",
    ],
    growth: [
      "深く潜って静かに上がる。波で伸びる。流れを作ると自然に続く。",
      "整流（流れを整える）で勝つ。流れが整うと勝手に伸びる。",
      "深い理解が積み重なると、表現が豊かになる。深くなるほど、出てくるものが強い。",
    ],
    distance: [
      "静かな理解者との距離が合う。無理に言語化を迫られない関係で深まる。",
      "沈黙が許される関係が回復になる。",
    ],
    words: [
      "言葉の底に深さがある。静かな言葉が、後から響く型。",
      "言い過ぎないほうが伝わる。余韻に乗せると、言葉が深く届く。",
    ],
    time: [
      "流れに乗っているときは速い。流れに抵抗するときは遅くなる。流れを見極める力が武器。",
      "一人の時間が深さを作る。静かな時間がないと、出てくるものが浅くなる。",
    ],
  },
};

/* ─────────────────────────────────────────
   Branch Supplement（十二支の薄い色）
───────────────────────────────────────── */
const BRANCH_ADD = {
  子: {
    core: ["表面は静かだが内部が動いている。見えないところで整えている時間が長いほど、動き出したときの精度が高い。"],
    time: ["夜中から夜明けにかけての時間と相性が良い型。深夜の静けさに思考が深まりやすい。"],
  },
  丑: {
    growth: ["着実に積み上げる力がある。急ごうとすると逆に遅くなる型。ゆっくりが最速。"],
    time: ["コツコツ型の継続が一番合う。毎日少しずつが、最終的に大きな差になる。"],
  },
  寅: {
    core: ["動いてから整える型。最初の勢いがあれば、後から整えられる。動かないことのほうがリスク。"],
    growth: ["スタートダッシュが得意。最初の突破口を作ると、後が続きやすい。"],
  },
  卯: {
    distance: ["柔らかく、しかし芯がある。周囲に合わせながら自分の軸を守る距離感が合う。"],
    words: ["受け入れる力がある分、相手の言葉をよく聴いてから話す型。聴いてから話すと深く届く。"],
  },
  辰: {
    core: ["変容を許容する大きさがある。核が明確なほど、周辺の変化に対応できる。"],
    growth: ["仕込みの時間を大切にする型。仕込みが深いほど、跳ねる高さが変わる。"],
  },
  巳: {
    core: ["外には見せないが内部で大きく動く。考える深度が精度になる。急かされると精度が落ちる。"],
    time: ["時期を選ぶ型。自分のタイミングで動くと強い。他人のタイミングに合わせ続けると消耗する。"],
  },
  午: {
    core: ["エネルギーの爆発力がある。焦点を一つに絞ると、圧倒的に速い。焦点が散ると消耗も速い。"],
    growth: ["勢いのある時期に一気に動く型。勢いを見極めてから走ると最大効率。"],
  },
  未: {
    distance: ["じわじわと浸透して、気づいたら深く根付いている距離感が合う。温かみがある関係で力が出る。"],
    time: ["長期的な積み上げが得意。短距離戦より長期が合う。時間を味方にする型。"],
  },
  申: {
    core: ["状況読みが速い。情報を素早く処理して、最適な手を選ぶ。変化が多い環境で力が出る。"],
    growth: ["機会を逃さない型。状況が動いたときに素早く乗ると強い。"],
  },
  酉: {
    core: ["整理する力がある。散らかったものを整えると、本来の精度が戻る。"],
    words: ["美意識が言葉に出る型。整えられた言葉が、相手の心に残る。"],
  },
  戌: {
    distance: ["一度信頼すると、長く続ける型。義理と信頼が大切にされる関係で最大値が出る。"],
    growth: ["継続が武器。途中でやめないと積み上がる。積み上がると圧倒的な安心感になる。"],
  },
  亥: {
    core: ["深く潜って考える型。外から見えないぶん、出てきたときのインパクトが大きい。"],
    time: ["内部で熟してから出る型。熟成の時間を否定しないほうが、仕上がりが良くなる。"],
  },
};

/* ─────────────────────────────────────────
   Pillar Note（60干支×1文）
───────────────────────────────────────── */
const PILLAR_NOTE = {
  甲子: "大樹の根が地下水に届く。構想が深い場所から出てくる年柱。",
  甲寅: "大樹が大木を目指して伸びる。突破力と構想が重なる。行動の起点が強い。",
  甲辰: "大樹が大地を変容させる。核が固まれば、周辺が従属する。",
  甲午: "樹が炎のように伸びる。勢いと構想が同時に動く。焦点が命。",
  甲申: "大樹に機転が加わる。状況を読みながら伸びていく。",
  甲戌: "大樹が信頼に根差す。継続することで幹が太くなる。",
  乙丑: "蔦が地道に積み上がる。柔軟さと継続が交差する年柱。",
  乙卯: "草が春の東風を受ける。柔軟さが最大値になる。",
  乙巳: "蔦が深く考えながら伸びる。考えた経路が最もしなやか。",
  乙未: "草が温もりとともに育つ。じわりと浸透する力が強い。",
  乙酉: "蔦が精緻に伸びる。細部への注意が、全体を整える。",
  乙亥: "草が深い水を飲む。静かに、しかし深く根を張る。",
  丙子: "太陽が水面を照らす。深さに光が届く。思考と直感が交差する。",
  丙寅: "太陽が新しい地平を照らす。開拓と推進が重なる。スタートに強い。",
  丙辰: "太陽が大地を温める。変容と推進が合わさる。仕込みから動く。",
  丙午: "太陽が頂点に達する。エネルギーが全開になる。焦点を守れれば圧倒的。",
  丙申: "太陽が機転を照らす。状況判断と推進が合わさる。",
  丙戌: "太陽が信頼を照らす。誠実さと熱量が交差する。",
  丁丑: "燈火が地道な積み上げを照らす。消えない炎が、着実さと合わさる。",
  丁卯: "燈火が春の柔らかさの中に燃える。持続と柔軟が合わさる。",
  丁巳: "燈火が深い思考の中に灯る。内側から照らすタイプの力。",
  丁未: "燈火が温もりとともに燃え続ける。長く続く熱。",
  丁酉: "燈火が精緻さを照らす。磨かれた場所で最も美しく燃える。",
  丁亥: "燈火が深い水の中に宿る。消えそうで消えない、芯のある光。",
  戊子: "山が地下水を持つ。安定の中に深さがある。",
  戊寅: "山が新しい道を切り開く。安定した足場から動く開拓型。",
  戊辰: "山が変容を受け止める。大きな変化を受け止める器。",
  戊午: "山が火を持つ。安定した熱。消えないが激しくなれる。",
  戊申: "山が機転を持つ。動かないように見えて、状況に応じて動く。",
  戊戌: "山が信頼を積む。変わらない誠実さが、最終的な力になる。",
  己丑: "畑が肥沃な土に根を張る。育てることが最も得意な年柱。",
  己卯: "畑が春に開く。柔らかく受け入れながら育てる。",
  己巳: "畑が深く考えながら育てる。時間をかけるほど豊かになる。",
  己未: "畑が温もりと合わさる。育てることに温もりが加わる。",
  己酉: "畑が精緻に整えられる。丁寧に耕すほど収量が上がる。",
  己亥: "畑が深い水を受け取る。静かな浸透が、土を豊かにする。",
  庚子: "原石が深い水の中にある。磨けば光るものが深いところにある。",
  庚寅: "原石が突破口を持つ。決断と行動が同時に動く。",
  庚辰: "原石が変容の中で磨かれる。変化が磨きになる年柱。",
  庚午: "原石が火で鍛えられる。鍛えるほど強くなる。",
  庚申: "原石に機転が加わる。素早い判断が精度を生む。",
  庚戌: "原石が信頼の中に置かれる。誠実な環境で最も磨かれる。",
  辛丑: "宝石が地道に磨かれる。コツコツが光になる年柱。",
  辛卯: "宝石が春の中で磨かれる。柔らかい環境で最も美しくなる。",
  辛巳: "宝石が深く磨かれる。深度と精緻さが重なる。",
  辛未: "宝石が温もりの中に置かれる。温かい関係の中で輝く。",
  辛酉: "宝石が宝石を磨く。精緻同士が合わさる。細部が美しい年柱。",
  辛亥: "宝石が深い水の中に沈む。静かな深さが価値を高める。",
  壬子: "大海が深く広がる。深度と広域が合わさる。器が最大になる年柱。",
  壬寅: "大海が新しい地平を目指す。広さと突破が合わさる。",
  壬辰: "大海が大地を飲み込む。変容と深度が重なる。",
  壬午: "大海が熱を持つ。広さと熱量が合わさる。エネルギーが大きい。",
  壬申: "大海が機転を持つ。広い視野と素早い判断が合わさる。",
  壬戌: "大海が信頼を持つ。深さと誠実さが重なる。",
  癸丑: "霧雨が地道な土を濡らす。静かな継続が、最も深く染み込む。",
  癸卯: "霧雨が春の芽を育てる。静かに、しかし確実に。",
  癸巳: "霧雨が深く浸透する。見えない力が最も深く届く年柱。",
  癸未: "霧雨が温もりの中に降る。静かな力が温かい場所で活きる。",
  癸酉: "霧雨が精緻な石を磨く。静かな力が、最も繊細なものを仕上げる。",
  癸亥: "霧雨が深い水と交わる。静けさが重なる。内省の深さが最大になる年柱。",
};

/* ─────────────────────────────────────────
   Utilities (Deterministic / Phase1)
   - Math.random() 不使用
   - seed付きPRNGで「同じ入力→同じ出力」を保証
───────────────────────────────────────── */

const BASE_YEAR = 1984; // 1984 = 甲子
const BASE_INDEX = 0;

function safeStr(v) {
  return (v ?? "").toString().trim();
}

/** YYYY-MM-DD の日付として正当かチェック（TZズレ回避） */
function parseBirth(birthStr) {
  const s = safeStr(birthStr);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;

  const [y, m, d] = s.split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;

  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Phase1：立春=2/4で近似。2/4より前は前年扱い。 */
function yearForNenchu({ y, m, d }) {
  if (m < 2) return y - 1;
  if (m === 2 && d < 4) return y - 1;
  return y;
}

/** 立春境界付近（Phase1注意表示） */
function isNearRisshun({ m, d }) {
  return m === 2 && (d === 3 || d === 4);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function nenChuFromYear(y) {
  const idx = mod(BASE_INDEX + (y - BASE_YEAR), 60);
  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];
  return { idx, stem, branch, kanji: `${stem}${branch}` };
}

/** FNV-1a 32bit */
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: deterministic PRNG (seeded) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seed = birthStr + nenchu + key（同じ生年月日なら必ず同じ） */
function seedByKey(birthStr, nenchuKanji, key) {
  return hash32(`${safeStr(birthStr)}|${safeStr(nenchuKanji)}|${safeStr(key)}`);
}

function rngByKey(birthStr, nenchuKanji, key) {
  return mulberry32(seedByKey(birthStr, nenchuKanji, key));
}

function pickOne(arr, rng, fallback = "") {
  const a = Array.isArray(arr) ? arr : [];
  if (!a.length) return fallback;
  const i = Math.floor(rng() * a.length);
  return a[i] ?? fallback;
}

function pickMany(arr, rng, count) {
  const a = Array.isArray(arr) ? arr : [];
  if (!a.length || count <= 0) return [];
  const n = Math.min(count, a.length);
  const idxs = a.map((_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs.slice(0, n).map((i) => a[i]).filter(Boolean);
}

/* ─────────────────────────────────────────
   表現幅（固定文章の追加プール）
   ※ “内容を揺らさず、表現の幅を増やす”
───────────────────────────────────────── */
const BASE_PLUS = {
  core: [
    "結論を急ぐより、前提を一枚そろえるほうが速い。前提がそろうと迷いが減る。",
    "「いまの状態」を言語化すると、余計な心配が減る。状態→次の一手の順が安定する。",
    "正解探しより、条件合わせ。条件が合うと自然に『これでいい』が出る。",
    "情報は増やすほど良いわけじゃない。順番を整えると、少ない材料でも判断できる。",
    "迷いは欠陥ではなく“未確定”。未確定を小さく確定していくと前に進む。",
    "やることより、やらないこと。線が引けると集中が戻る。",
    "一度で決めない設計が強い。仮置き→微修正→確定で精度が上がる。",
    "整うと、速度が出る。速度は気合ではなく、整った構造の副産物。",
    "違和感はノイズではなくセンサー。メモしておくと後で効く。",
    "気分より、再現性。再現できる手順があると強い。",
    "遠くを見るほど不安が増える。まず今日の範囲だけ決めると軽くなる。",
    "“正しく見せる”より“分かる形”。分かる形が一番強い。",
  ],
  friction: [
    "結論だけを急かされると誤差が増える。前提確認の一手間が削られる場が苦手。",
    "タスクが細切れに飛んでくると集中が切れる。まとめて処理できる形が合う。",
    "通知・チャット・会議が連続すると判断が濁る。分断が多い日は精度が落ちる。",
    "“すぐ返事”が標準の場は、深い判断が難しい。返信と判断を分けた方が良い。",
    "ルールが曖昧で“空気”が正解になる環境は疲れやすい。基準がないと判断が荒れる。",
  ],
  growth: [
    "小さく出して、早く直す。レビュー回数を増やすほど精度が上がる。",
    "作業を分解すると進む。1回で全部やろうとすると止まりやすい。",
    "成果は“出力回数×修正回数”。修正できる設計が伸び方になる。",
    "環境を整えると伸びる。気合より、配置と順序。",
    "毎回100点を狙わない。70〜80点で出す回を増やすと、総量が勝つ。",
  ],
  distance: [
    "距離は“近い/遠い”ではなく“温度”。温度が合うと長く続く。",
    "境界があるほど優しい。境界がないと後で摩耗が増える。",
    "沈黙が許される相手は、回復にもなる。言葉の量が少ない方が合うことがある。",
    "急がせない関係が合う。即答を求めない相手ほど噛み合う。",
  ],
  words: [
    "文章は『結論→理由→次の一手』で短くなる。短いほど伝わることがある。",
    "比喩は“飾り”ではなく圧縮。長い説明を一枚にまとめる道具。",
    "言い切りより条件。条件があると誤解が減る。",
    "問いを置くと相手が動きやすい。答えより問いが効く場面がある。",
    "説明を盛るほど弱くなる。要点だけ残すと通る。",
  ],
  time: [
    "集中の波は作れる。『始める合図』を固定すると入りやすい。",
    "詰め込みすぎると誤差が増える。バッファがあると修正できる。",
    "深い作業はまとめてやる方が速い。浅い作業は小分けでいい。",
    "疲れた日の決断は保留でいい。保留は逃げじゃなく精度管理。",
    "区切りがあると安心が増える。『終わり』を決めると始めやすい。",
  ],
  seal: [
    "今日は整える日。結論を急がない。",
    "一行で戻す。長くしない。",
    "条件をそろえる。そこで判断する。",
    "小さく確定。次に進む。",
    "順番を戻す。焦らない。",
    "輪郭が出るまで待つ。",
  ],
};

const ELEMENT_PLUS = {
  木: {
    core: [
      "構想が先に立ちやすい。形にする前に、育てる時間が必要になる。",
      "伸び代を見つけるのが得意。伸ばす対象が決まると強い。",
    ],
    friction: [
      "余白が削られると詰まりやすい。詰まったら“削る”より“空ける”。",
      "方向が頻繁に変わると根が張れない。方針の固定が助けになる。",
    ],
    growth: [
      "芽を見つけて育てる。小さな種を決めると進む。",
      "試作→改善→育成。この循環が回ると伸びる。",
    ],
    words: ["比喩や例え話で伝えると通りやすい。抽象を具体に落とすのが得意。"],
    time: ["立ち上げ期に強い。最初の整地に時間をかけるほど後が速い。"],
  },
  火: {
    core: ["火がつくと一気に進む。点火条件（場所・時間・相手）を覚えると再現できる。"],
    friction: [
      "焦点が散ると消耗が速い。刺激を減らすだけで戻ることがある。",
      "熱量の強要は苦手。適温の合意がないと崩れやすい。",
    ],
    growth: [
      "短期集中で形にして、冷まして整える。この波が合う。",
      "『今いける』瞬間に小さくでも出すと強い。",
    ],
    words: ["短い言葉に熱が乗る。長文より短文の方が刺さることがある。"],
    time: ["勢いの時間帯を守ると強い。勢いが切れたら潔く休む。"],
  },
  土: {
    core: ["安定が出ると精度が出る。精度が出ると速度が出る。"],
    friction: ["足場が揺れると疲れやすい。順番とルールがない場は消耗する。"],
    growth: ["整える→積む→整える。地ならしが成果になる。"],
    distance: ["約束が守られる関係で安心が出る。安心が出るほど本来の力が出る。"],
    time: ["習慣化が武器。小さな反復が大きな差になる。"],
  },
  金: {
    core: ["線引きが得意。境界が決まると迷いが減る。"],
    friction: ["基準が曖昧だと疲れる。『何を良しとするか』が先に要る。"],
    growth: ["磨く→確定→磨く。仕上げの反復で強くなる。"],
    words: ["余分を削るほど伝わる。短い言葉が強い。"],
    time: ["仕上げの時間を確保すると伸びる。仕上げ不足は違和感として残る。"],
  },
  水: {
    core: ["深く潜るほど精度が出る。浅い結論を急がないほうが強い。"],
    friction: ["騒がしさが続くと深度が出ない。静けさが必要条件になる。"],
    growth: ["流れを整えると勝手に進む。整流が伸び方になる。"],
    distance: ["沈黙が許される関係で深まる。言語化の強要がない方が合う。"],
    time: ["一人の時間が燃料になる。燃料があると表現が深くなる。"],
  },
};

const BRANCH_PLUS = {
  子: { friction: ["情報が途切れると不安が増えやすい。まとめて静かに確認できる形が合う。"], growth: ["準備が整った瞬間に速い。準備を成果とみなすと伸びる。"] },
  丑: { friction: ["急な方針転換が続くと疲れる。ペースが守られるほど強い。"], growth: ["同じ型を続けると強い。小さな反復が資産になる。"] },
  寅: { friction: ["停滞が続くと力が余る。動ける課題がないと消耗する。"], growth: ["最初の一歩を早く置くと進む。後で整えればいい。"] },
  卯: { friction: ["強い圧が続くと伸びが止まりやすい。伸びる余白が必要。"], growth: ["環境が柔らかいほど伸びる。安心が成長速度になる。"] },
  辰: { friction: ["核が曖昧だと消耗する。核の一文がないと迷いが増える。"], growth: ["仕込みが深いほど跳ねる。仕込みの時間を肯定すると伸びる。"] },
  巳: { friction: ["急かされると精度が落ちる。考える時間が削られると弱い。"], growth: ["理解が深まった瞬間に強い。腹落ちしたら一気に形にする。"] },
  午: { friction: ["焦点が散ると燃え尽きる。やることを絞るほど安定する。"], growth: ["勢いの波に乗ると速い。波が来たら短期集中で形にする。"] },
  未: { friction: ["冷たい評価が続くと消耗する。温度のある関係が必要。"], growth: ["じわりと積むほど強い。時間が味方になる。"] },
  申: { friction: ["判断の余地がない単調さは消耗する。変化と裁量が必要。"], growth: ["小さく試して最適化が得意。改善回数が成長になる。"] },
  酉: { friction: ["基準が揺れると疲れる。評価軸が明確なほど強い。"], growth: ["整えた分だけ伸びる。整理→実行が最短になる。"] },
  戌: { friction: ["信頼が崩れると一気に消耗する。約束が守られる場が必要。"], growth: ["続けるほど強い。継続が信頼と成果を両方積む。"] },
  亥: { friction: ["浅い結論を急がされると誤差が増える。熟成が必要。"], growth: ["内側で熟してから出すと強い。焦らず整えるほど仕上がる。"] },
};

/* ─────────────────────────────────────────
   Text formatting helpers
───────────────────────────────────────── */
const END_RE = /[。！？!?]$/;

function cleanSpaces(s) {
  return safeStr(s).replace(/\s+/g, " ").trim();
}

function ensureEndPunct(s) {
  const t = cleanSpaces(s);
  if (!t) return "";
  return END_RE.test(t) ? t : `${t}。`;
}

function stripEndPunct(s) {
  return cleanSpaces(s).replace(/[。！？!?]+$/g, "");
}

function combineClauses(a, b, birthStr, nenchuKanji, key) {
  const left = stripEndPunct(a);
  const right = stripEndPunct(b);

  if (!left && !right) return "";
  if (!left) return ensureEndPunct(right);
  if (!right) return ensureEndPunct(left);

  const rng = rngByKey(birthStr, nenchuKanji, `${key}:combine`);
  const style = pickOne(
    ["paren", "dash", "slash", "colon", "comma", "conj"],
    rng,
    "paren"
  );

  if (style === "conj") {
    const crng = rngByKey(birthStr, nenchuKanji, `${key}:conj`);
    const conj = pickOne(
      ["なので、", "ただし、", "一方で、", "つまり、", "そのため、", "結果として、", "逆に、"],
      crng,
      "なので、"
    );
    return ensureEndPunct(`${left}${conj}${right}`);
  }

  switch (style) {
    case "dash":
      return ensureEndPunct(`${left}——${right}`);
    case "slash":
      return ensureEndPunct(`${left} / ${right}`);
    case "colon":
      return ensureEndPunct(`${left}：${right}`);
    case "comma":
      return ensureEndPunct(`${left}、${right}`);
    case "paren":
    default:
      return ensureEndPunct(`${left}（${right}）`);
  }
}

function applyStylePrefix(text, birthStr, nenchuKanji, key) {
  const rng = rngByKey(birthStr, nenchuKanji, `${key}:prefix`);
  const prefix = pickOne(
    ["", "メモ：", "要点：", "観察：", "備考：", "断章：", "ヒント："],
    rng,
    ""
  );
  if (!prefix) return text;
  return `${prefix}${stripEndPunct(text)}。`;
}

function branchFallbackByKey(key, branchMeta) {
  if (!branchMeta) return "";
  if (key === "core") return branchMeta.tempo || "";
  if (key === "distance") return branchMeta.environment || "";
  if (key === "time") return branchMeta.timing || "";
  return "";
}

function elementFallbackByKey(key, stemMeta, element) {
  if (!stemMeta) return "";
  if (key === "core") return stemMeta.note || "";
  if (key === "growth") return stemMeta.note || "";
  if (key === "words") return stemMeta.tone ? `言葉は「${stemMeta.tone}」側に寄ると出やすい。` : "";
  if (key === "friction") return stemMeta.tone ? `焦点が散ると「${stemMeta.tone}」の強さが出にくい。` : "";
  if (key === "distance") return stemMeta.tone ? `距離は「${stemMeta.tone}」の温度で安定しやすい。` : "";
  if (key === "time") return element ? `五行は${element}（${ELEMENT_DESC[element] ?? ""}）の側面を参照する。` : "";
  return "";
}

function pickLayerSentence(pool, fallback, birthStr, nenchuKanji, key) {
  const rng = rngByKey(birthStr, nenchuKanji, key);
  const merged = []
    .concat(Array.isArray(pool) ? pool : [])
    .concat(fallback ? [fallback] : []);
  return pickOne(merged, rng, fallback || "");
}

function pickLayerSentenceAvoid(pool, fallback, birthStr, nenchuKanji, key, avoid) {
  const first = pickLayerSentence(pool, fallback, birthStr, nenchuKanji, key);
  if (!avoid || first !== avoid) return first;
  const alt = pickLayerSentence(pool, fallback, birthStr, nenchuKanji, `${key}:alt`);
  return alt && alt !== avoid ? alt : first;
}

function mergedBasePool(key) {
  return [...(BASE?.[key] ?? []), ...(BASE_PLUS?.[key] ?? [])];
}
function mergedElementPool(element, key) {
  return [...(ELEMENT_ADD?.[element]?.[key] ?? []), ...(ELEMENT_PLUS?.[element]?.[key] ?? [])];
}
function mergedBranchPool(branch, key) {
  return [...(BRANCH_ADD?.[branch]?.[key] ?? []), ...(BRANCH_PLUS?.[branch]?.[key] ?? [])];
}
function mergedSealPool(branch, element) {
  return [
    ...(BRANCH_ADD?.[branch]?.seal ?? []),
    ...(BRANCH_PLUS?.[branch]?.seal ?? []),
    ...(ELEMENT_ADD?.[element]?.seal ?? []),
    ...(ELEMENT_PLUS?.[element]?.seal ?? []),
    ...(BASE?.seal ?? []),
    ...(BASE_PLUS?.seal ?? []),
  ];
}

/* ─────────────────────────────────────────
   Per-block assembly (Phase1)
   - core: 3文（支→五行→共通）
   - others: 2文（支→五行+共通を合成）
   - seal: 1行
───────────────────────────────────────── */
function buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key }) {
  const nenchuKanji = nenchu?.kanji ?? "";
  const branch = nenchu?.branch ?? "";

  const branchPool = mergedBranchPool(branch, key);
  const elementPool = mergedElementPool(element, key);
  const basePool = mergedBasePool(key);

  const bFallback = branchFallbackByKey(key, branchMeta);
  const eFallback = elementFallbackByKey(key, stemMeta, element);

  if (key === "seal") {
    const rng = rngByKey(birthStr, nenchuKanji, "seal:one");
    const line = pickOne(mergedSealPool(branch, element), rng, "今日の印を残す。");
    return ensureEndPunct(line);
  }

  if (key === "core") {
    const s1 = pickLayerSentence(branchPool, bFallback, birthStr, nenchuKanji, "core:s1");
    const s2 = pickLayerSentence(elementPool, eFallback, birthStr, nenchuKanji, "core:s2");
    const s3 = pickMany(basePool, rngByKey(birthStr, nenchuKanji, "core:base"), 1)[0] || "条件がそろうと、判断は自然に絞られる。";
    const joined = [ensureEndPunct(s1), ensureEndPunct(s2), ensureEndPunct(s3)].filter(Boolean).join(" ");
    return applyStylePrefix(joined, birthStr, nenchuKanji, "core");
  }

  const s1 =
    pickLayerSentence(branchPool, bFallback, birthStr, nenchuKanji, `${key}:s1`) ||
    pickLayerSentence(elementPool, eFallback, birthStr, nenchuKanji, `${key}:s1b`) ||
    pickLayerSentence(basePool, "", birthStr, nenchuKanji, `${key}:s1c`);

  const e = pickLayerSentenceAvoid(elementPool, eFallback, birthStr, nenchuKanji, `${key}:e`, s1);
  const b = pickLayerSentenceAvoid(basePool, "", birthStr, nenchuKanji, `${key}:b`, e);
  const s2 = combineClauses(e, b, birthStr, nenchuKanji, key);

  const joined = [ensureEndPunct(s1), ensureEndPunct(s2)].filter(Boolean).join(" ");
  return applyStylePrefix(joined, birthStr, nenchuKanji, key);
}

/* ─────────────────────────────────────────
   Method info
───────────────────────────────────────── */
function buildMethod({ birth, appliedYear, nenchu }) {
  const near = birth ? isNearRisshun(birth) : false;

  const lines = [
    "・干支は「十干×十二支＝六十干支（60通り）」の循環として扱う。",
    "・年の境目は、二十四節気の起点「立春（太陽黄経315°）」を基準とする。",
    "・立春は年ごとに日付・時刻が変動する（国立天文台 暦要項参照）。",
    "・Phase1 は軽量化のため、立春を 2/4 とする日付近似で判定している。",
    "・Phase1 の算出範囲は年柱（年干支）のみ。",
    "・出生時間・出生地・姓名は算出に反映していない（外部送信も保存もしない）。",
    `・今回の判定年：${appliedYear}（年柱：${nenchu.kanji}）`,
  ];

  if (near) {
    lines.push("・注意：2/3〜2/4 付近は立春時刻で前後する可能性がある（厳密判定は暦要項へ）。");
  }

  return {
    approx: "立春基準（Phase1：2/4近似）",
    lines,
    sources: METHOD_SOURCES,
  };
}

/* ─────────────────────────────────────────
   buildMemo — Public API (Phase1)
───────────────────────────────────────── */
export function buildMemo(formData) {
  const birthStr = safeStr(formData?.birth);
  const birth = parseBirth(birthStr);
  if (!birth) return null;

  const appliedYear = yearForNenchu(birth);
  const nenchu = nenChuFromYear(appliedYear);

  const stemMeta = STEM_META?.[nenchu.stem] ?? { yinYang: "陽", element: "土", image: "", tone: "", note: "" };
  const branchMeta = BRANCH_META?.[nenchu.branch] ?? {};
  const element = stemMeta.element;

  const nearRisshun = isNearRisshun(birth);

  const memo = {
    nenchu,
    appliedYear,
    stemMeta,
    branchMeta,
    yinYang: stemMeta.yinYang,
    element,
    elementDesc: ELEMENT_DESC[element] ?? "",
    pillarNote: PILLAR_NOTE?.[nenchu.kanji] ?? null,

    // UI用：立春境界注意（1行）
    nearRisshun,
    notice: nearRisshun
      ? "注意：2/3〜2/4 生まれは、立春時刻により年柱が前後する可能性があります（Phase1は2/4近似）。"
      : null,

    blocks: OUTPUT_BLOCKS,
    values: {
      core: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "core" }),
      friction: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "friction" }),
      growth: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "growth" }),
      distance: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "distance" }),
      words: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "words" }),
      time: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "time" }),
      seal: buildBlockText({ birthStr, nenchu, element, stemMeta, branchMeta, key: "seal" }),
    },

    method: buildMethod({ birth, appliedYear, nenchu }),
  };

  return memo;
}

/* ─────────────────────────────────────────
   formatMeta — 表示用メタ行を返す
   ※ 表示用。seedには反映しない（birth以外は“雰囲気補助”）
───────────────────────────────────────── */
export function formatMeta(formData, memo) {
  const rows = [];

  if (memo?.nenchu?.kanji) rows.push(["年柱（年干支）", memo.nenchu.kanji]);
  if (memo?.yinYang && memo?.element) rows.push(["五行", `${memo.yinYang}${memo.element}（${memo.elementDesc}）`]);
  if (memo?.stemMeta?.tone) rows.push(["干のトーン", memo.stemMeta.tone]);
  if (memo?.branchMeta?.nature) rows.push(["支の性質", memo.branchMeta.nature]);
  if (memo?.method?.approx) rows.push(["算出", memo.method.approx]);

  rows.push(["範囲", "年柱のみ（Phase1）"]);

  if (safeStr(formData?.birth)) rows.push(["生年月日", safeStr(formData.birth).replaceAll("-", "/")]);
  if (safeStr(formData?.place)) rows.push(["出生地", safeStr(formData.place)]);
  if (safeStr(formData?.time)) rows.push(["出生時間", safeStr(formData.time)]);
  if (safeStr(formData?.name)) rows.push(["名前", safeStr(formData.name)]);

  return rows;
}

/* ─────────────────────────────────────────
   buildCopyText — コピー用プレーンテキスト
───────────────────────────────────────── */
export function buildCopyText(formData, memo) {
  if (!memo) return "";

  const meta = formatMeta(formData, memo);
  const header = [
    "命式メモ（Phase1）",
    meta.length ? meta.map(([k, v]) => `${k}: ${v}`).join(" / ") : "",
    "",
  ].join("\n");

  const notice = memo?.notice ? `【注意】\n${memo.notice}\n\n` : "";

  const pillarSection = memo.pillarNote ? `【年柱の印象】\n${memo.pillarNote}\n\n` : "";
  const stemSection = memo.stemMeta?.note ? `【干（${memo.nenchu.stem}）の傾向】\n${memo.stemMeta.note}\n\n` : "";
  const branchSection = memo.branchMeta?.tempo ? `【支（${memo.nenchu.branch}）の気質】\n${memo.branchMeta.tempo}\n\n` : "";

  const body = memo.blocks
    .map((b) => `【${b.label}】${b.subtitle ? `（${b.subtitle}）` : ""}\n${memo.values[b.key] ?? ""}`)
    .join("\n\n");

  const method = memo?.method?.lines?.length ? `\n\n【算出根拠】\n${memo.method.lines.join("\n")}` : "";
  const refs = memo?.method?.sources?.length
    ? `\n\n【参考文献】\n${memo.method.sources.map((s) => `- ${s.title}\n  ${s.url}`).join("\n")}`
    : "";

  const footer =
    "\n\n—\nこれは予言ではなく、自己理解のための記録です。入力は保存しません（外部送信なし／URLに個人情報を載せない方針）。";

  return header + notice + pillarSection + stemSection + branchSection + body + method + refs + footer;
}

/* ─────────────────────────────────────────
   buildShareText / buildShareUrl
   - 共有URLに個人情報（生年月日など）を載せない
───────────────────────────────────────── */
export function buildShareUrl(rawUrl = "") {
  const u = safeStr(rawUrl);
  if (!u) return "";
  try {
    const url = new URL(u);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return u.split("#")[0].split("?")[0];
  }
}

export function buildShareText(memo, opts = {}) {
  if (!memo?.nenchu?.kanji) return "";
  const siteUrl = buildShareUrl(opts?.siteUrl ?? "");
  const head = `MEISHIKI（年柱メモ）｜年柱：${memo.nenchu.kanji}`;
  const tail = "入力は保存しません（外部送信なし）。";
  return siteUrl ? `${head}\n${tail}\n${siteUrl}` : `${head}\n${tail}`;
}