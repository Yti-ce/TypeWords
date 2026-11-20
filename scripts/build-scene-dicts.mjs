// 从 scripts/scene-words/*.txt 生成「日常场景」词典，并登记到词典列表。
// 用法：node scripts/build-scene-dicts.mjs
// txt 每行：word | 英音 | 美音 | 词性:释义; 词性:释义 | 例句 | 例句翻译 | 短语:释义
// 行的顺序就是学习顺序（越常用越靠前）。
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'scripts/scene-words')
const dictDir = path.join(root, 'public/dicts/en/word')
const listFiles = ['public/list/word.json', 'public/list/recommend_word.json'].map(f => path.join(root, f))

const scenes = [
  { file: 'restaurant', id: 103, name: '场景·餐厅', description: '订座、点菜、口味、结账等餐厅常用词' },
  { file: 'shopping', id: 102, name: '场景·商场购物', description: '商场、超市购物、试穿、付款、退换货常用词' },
  { file: 'social', id: 116, name: '场景·社交寒暄', description: '打招呼、自我介绍、邀约、道谢道歉常用词' },
  { file: 'transport', id: 107, name: '场景·交通出行', description: '公交、地铁、打车、开车、停车常用词' },
  { file: 'directions', id: 111, name: '场景·问路', description: '方向、位置、路线、地标常用词' },
  { file: 'phone', id: 113, name: '场景·手机和网络', description: '打电话、发消息、充电、上网、账号常用词' },
  { file: 'bank', id: 101, name: '场景·银行', description: '银行开户、存取款、转账、换汇等常用词' },
  { file: 'hospital', id: 105, name: '场景·医院看病', description: '描述症状、挂号、看医生、检查常用词' },
  { file: 'pharmacy', id: 106, name: '场景·药店', description: '买药、用法用量、常见小病常用词' },
  { file: 'home', id: 122, name: '场景·家务厨房', description: '做饭、洗碗、洗衣、打扫、买菜常用词' },
  { file: 'housing', id: 110, name: '场景·租房住宅', description: '看房、租房合同、房东、维修常用词' },
  { file: 'delivery', id: 112, name: '场景·邮局快递', description: '寄件、收件、快递单号、运费常用词' },
  { file: 'weather', id: 117, name: '场景·天气', description: '天气、温度、季节常用词' },
  { file: 'school', id: 104, name: '场景·学校', description: '上课、作业、考试、校园生活常用词' },
  { file: 'office', id: 114, name: '场景·办公室', description: '会议、邮件、报告、同事、请假常用词' },
  { file: 'interview', id: 115, name: '场景·求职面试', description: '简历、面试问答、薪资、录用常用词' },
  { file: 'hotel', id: 109, name: '场景·酒店', description: '订房、入住退房、客房服务常用词' },
  { file: 'airport', id: 108, name: '场景·机场', description: '值机、安检、登机、转机、海关常用词' },
  { file: 'travel', id: 121, name: '场景·旅游观光', description: '景点、门票、导游、纪念品常用词' },
  { file: 'fitness', id: 118, name: '场景·健身运动', description: '健身房、跑步、球类运动、比赛常用词' },
  { file: 'salon', id: 119, name: '场景·理发美容', description: '理发、染发、发型、美甲常用词' },
  { file: 'emergency', id: 120, name: '场景·紧急求助', description: '报警、求救、丢失被盗、事故常用词' },
]

function splitPair(s) {
  const i = s.indexOf(':')
  return i < 0 ? ['', s.trim()] : [s.slice(0, i).trim(), s.slice(i + 1).trim()]
}

function parse(file, baseId) {
  const lines = fs
    .readFileSync(path.join(srcDir, `${file}.txt`), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
  const seen = new Set()
  return lines.map((line, i) => {
    const [word, uk, us, trans, sentence, sentenceCn, phrase] = line.split('|').map(s => s.trim())
    if (!word || !uk || !us || !trans || !sentence || !sentenceCn) {
      throw new Error(`${file}.txt: incomplete line ${i + 1}: ${line}`)
    }
    if (seen.has(word)) throw new Error(`${file}.txt: duplicate word "${word}"`)
    seen.add(word)
    const [pc, pcn] = phrase ? splitPair(phrase) : []
    return {
      id: baseId * 10000 + i + 1,
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
