// 从 scripts/scene-words/*.txt 生成「日常场景」词典，并登记到词典列表。
// 用法：node scripts/build-scene-dicts.mjs
// txt 每行：word | 英音 | 美音 | 词性:释义; 词性:释义 | 例句 | 例句翻译 | 短语:释义
// 词典内按真实词频排序（越常用越靠前），词频来自 ECDICT（MIT，https://github.com/skywind3000/ECDICT）
// 的 BNC / COCA 排名，保存在 scripts/scene-words/word-rank.json。
// 新增单词后，下载 ecdict.csv 并运行：node scripts/build-scene-dicts.mjs --ecdict path/to/ecdict.csv
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'scripts/scene-words')
const dictDir = path.join(root, 'public/dicts/en/word')
const rankFile = path.join(srcDir, 'word-rank.json')
const listFiles = ['public/list/word.json', 'public/list/recommend_word.json'].map(f => path.join(root, f))

const scenes = [
  { file: 'restaurant', id: 103, name: '场景·餐厅', description: '订座、点菜、口味、结账等餐厅常用词' },
  { file: 'shopping', id: 102, name: '场景·商场购物', description: '商场购物、试穿、付款、退换货常用词' },
  { file: 'supermarket', id: 123, name: '场景·超市买菜', description: '超市、菜市场买菜和日用品常用词' },
  { file: 'cafe', id: 124, name: '场景·咖啡奶茶店', description: '点咖啡、奶茶、甜度冰量、外带常用词' },
  { file: 'social', id: 116, name: '场景·社交寒暄', description: '打招呼、自我介绍、邀约、道谢道歉常用词' },
  { file: 'feelings', id: 128, name: '场景·情绪感受', description: '开心、难过、紧张、生气等表达情绪的词' },
  { file: 'family', id: 127, name: '场景·家庭关系', description: '家人、亲戚、婚恋关系常用词' },
  { file: 'time', id: 129, name: '场景·时间日期', description: '几点、星期、日期、早晚等时间表达' },
  { file: 'numbers', id: 130, name: '场景·数字与钱', description: '数字、价格、花钱、借钱常用词' },
  { file: 'transport', id: 107, name: '场景·交通出行', description: '公交、地铁、打车、开车、停车常用词' },
  { file: 'directions', id: 111, name: '场景·问路', description: '方向、位置、路线、地标常用词' },
  { file: 'phone', id: 113, name: '场景·手机和网络', description: '打电话、发消息、充电、上网、账号常用词' },
  { file: 'computer', id: 136, name: '场景·电脑办公软件', description: '文件、保存、打印、安装、上传下载常用词' },
  { file: 'bank', id: 101, name: '场景·银行', description: '银行开户、存取款、转账、换汇等常用词' },
  { file: 'hospital', id: 105, name: '场景·医院看病', description: '描述症状、挂号、看医生、检查常用词' },
  { file: 'pharmacy', id: 106, name: '场景·药店', description: '买药、用法用量、常见小病常用词' },
  { file: 'body', id: 126, name: '场景·身体部位', description: '头、手、背、膝盖等身体部位词' },
  { file: 'home', id: 122, name: '场景·家务厨房', description: '做饭、洗碗、洗衣、打扫常用词' },
  { file: 'housing', id: 110, name: '场景·租房住宅', description: '看房、租房合同、房东、维修常用词' },
  { file: 'delivery', id: 112, name: '场景·邮局快递', description: '寄件、收件、快递单号、运费常用词' },
  { file: 'clothing', id: 125, name: '场景·衣服穿着', description: '衣服、鞋帽、尺码、面料常用词' },
  { file: 'weather', id: 117, name: '场景·天气', description: '天气、温度、季节常用词' },
  { file: 'colours', id: 131, name: '场景·颜色形状', description: '颜色、形状、大小常用词' },
  { file: 'school', id: 104, name: '场景·学校', description: '上课、作业、考试、校园生活常用词' },
  { file: 'office', id: 114, name: '场景·办公室', description: '会议、邮件、报告、同事、请假常用词' },
  { file: 'interview', id: 115, name: '场景·求职面试', description: '简历、面试问答、薪资、录用常用词' },
  { file: 'hotel', id: 109, name: '场景·酒店', description: '订房、入住退房、客房服务常用词' },
  { file: 'airport', id: 108, name: '场景·机场', description: '值机、安检、登机、转机、海关常用词' },
  { file: 'travel', id: 121, name: '场景·旅游观光', description: '景点、门票、导游、纪念品常用词' },
  { file: 'entertainment', id: 134, name: '场景·电影娱乐', description: '电影、音乐、剧集、演唱会常用词' },
  { file: 'festivals', id: 135, name: '场景·节日庆祝', description: '节日、派对、礼物、祝福常用词' },
  { file: 'fitness', id: 118, name: '场景·健身运动', description: '健身房、跑步、球类运动、比赛常用词' },
  { file: 'salon', id: 119, name: '场景·理发美容', description: '理发、染发、发型、美甲常用词' },
  { file: 'animals', id: 132, name: '场景·动物', description: '宠物、家畜、野生动物常用词' },
  { file: 'nature', id: 133, name: '场景·自然环境', description: '山川河海、植物、环保常用词' },
  { file: 'emergency', id: 120, name: '场景·紧急求助', description: '报警、求救、丢失被盗、事故常用词' },
]

// ECDICT 里查不到（多为新词或复合词）的单词，手动给一个大致的常用度排名
const RANK_OVERRIDES = {
  app: 3000,
  email: 1500,
  wifi: 4000,
  online: 2500,
  screenshot: 9000,
  username: 9000,
  sim: 9000,
  earphones: 9000,
  decaf: 15000,
  latte: 12000,
  mooncake: 15000,
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

// 从 ecdict.csv 提取所需单词的排名：取 BNC 与 COCA 排名中较小的非零值；
// 复数、变形词查不到排名时用原形（exchange 字段里的 0:lemma）的排名
async function buildRanks(csvPath, wanted) {
  const rows = new Map()
  const rl = readline.createInterface({ input: fs.createReadStream(csvPath, 'utf8'), crlfDelay: Infinity })
  let header = true
  for await (const line of rl) {
    if (header) {
      header = false
      continue
    }
    const [word, , , , , , , , bnc, frq, exchange] = parseCsvLine(line)
    const key = word.toLowerCase()
    const r = [Number(bnc) || 0, Number(frq) || 0].filter(Boolean)
    const rank = r.length ? Math.min(...r) : 0
    const lemma = (exchange || '').split('/').find(x => x.startsWith('0:'))?.slice(2)
    const prev = rows.get(key)
    if (!prev || (!prev.rank && rank)) rows.set(key, { rank, lemma })
  }
  const lookup = w => {
    const row = rows.get(w.toLowerCase())
    if (row?.rank) return row.rank
    const lemma = row?.lemma || w.replace(/(ies)$/, 'y').replace(/(es|s)$/, '')
    return rows.get(lemma.toLowerCase())?.rank || 0
  }
  const ranks = {}
  for (const w of [...wanted].sort()) {
    const r = lookup(w)
    if (r) ranks[w] = r
  }
  fs.writeFileSync(rankFile, JSON.stringify(ranks, null, 1) + '\n')
  console.log(`word-rank.json: ${Object.keys(ranks).length}/${wanted.size} words ranked`)
}

function readLines(file) {
  return fs
    .readFileSync(path.join(srcDir, `${file}.txt`), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
}

const ecdictArg = process.argv.indexOf('--ecdict')
if (ecdictArg > 0) {
  const wanted = new Set(scenes.flatMap(s => readLines(s.file).map(l => l.split('|')[0].trim())))
  await buildRanks(process.argv[ecdictArg + 1], wanted)
}
const ranks = { ...JSON.parse(fs.readFileSync(rankFile, 'utf8')), ...RANK_OVERRIDES }
const rankOf = w => ranks[w] || 99999

function splitPair(s) {
  const i = s.indexOf(':')
  return i < 0 ? ['', s.trim()] : [s.slice(0, i).trim(), s.slice(i + 1).trim()]
}

function parse(file, baseId) {
  const lines = readLines(file)
  const seen = new Set()
  const words = lines.map(line => {
    const [word, uk, us, trans, sentence, sentenceCn, phrase] = line.split('|').map(s => s.trim())
    if (!word || !uk || !us || !trans || !sentence || !sentenceCn) {
      throw new Error(`${file}.txt: incomplete line: ${line}`)
    }
    if (seen.has(word)) throw new Error(`${file}.txt: duplicate word "${word}"`)
    seen.add(word)
    const [pc, pcn] = phrase ? splitPair(phrase) : []
    return {
      word,
      phonetic0: uk,
      phonetic1: us,
      trans: trans.split(';').map(t => {
        const [pos, cn] = splitPair(t)
        return { pos, cn }
      }),
      sentences: [{ c: sentence, cn: sentenceCn }],
      phrases: phrase ? [{ c: pc, cn: pcn }] : [],
      synos: [],
      relWords: { root: '', rels: [] },
      etymology: [],
    }
  })
  // 稳定排序：词频高的在前，同频保持文件顺序
  return words
    .map((w, i) => ({ w, i }))
    .sort((a, b) => rankOf(a.w.word) - rankOf(b.w.word) || a.i - b.i)
    .map(({ w }, i) => ({ id: baseId * 10000 + i + 1, ...w }))
}

const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
const entries = scenes.map(s => {
  const words = parse(s.file, s.id)
  const url = `Scene_${s.file[0].toUpperCase()}${s.file.slice(1)}.json`
  fs.writeFileSync(path.join(dictDir, url), JSON.stringify(words, null, 2) + '\n')
  console.log(`${url}: ${words.length} words`)
  return {
    id: s.id,
    enName: `scene-${s.file}`,
    name: s.name,
    description: s.description,
    categoryId: 2,
    url,
    length: words.length,
    language: 'en',
    translateLanguage: 'zh_CN',
    version: 1,
    type: 'word',
    isDefault: false,
    recommended: true,
    userId: '00000000-0000-0000-0000-000000000001',
    createdAt: now,
    updatedAt: now,
    cover: null,
    hidden: false,
    category: '日常场景',
    tags: ['生活英语'],
  }
})

for (const f of listFiles) {
  const list = JSON.parse(fs.readFileSync(f, 'utf8'))
  const old = new Map(list.filter(d => d.enName?.startsWith('scene-')).map(d => [d.enName, d]))
  const kept = list.filter(d => !d.enName?.startsWith('scene-'))
  // 保留已有条目的 createdAt，内容有变化时版本号 +1
  const merged = entries.map(e => {
    const prev = old.get(e.enName)
    if (!prev) return e
    const changed = prev.length !== e.length || prev.description !== e.description
    return { ...e, createdAt: prev.createdAt, version: changed ? prev.version + 1 : prev.version, updatedAt: changed ? e.updatedAt : prev.updatedAt }
  })
  fs.writeFileSync(f, JSON.stringify([...kept, ...merged], null, 2) + '\n')
}
