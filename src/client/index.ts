/**
 * dsh-qixi 浏览器半：七夕情人节彩蛋合集。
 * - 氛围换肤：theme.overrideTokens 叠加粉/玫瑰 token 层 + 祝福横幅 + 漂浮爱心 + 分享悬浮球
 * - 告白弹幕：输入暗号 520 触发全屏弹幕
 * - 藏头情书：输入暗号「情书」触发打字机情书
 * - 分享卡片：Canvas 绘制 1080×1440 卡片，下载 / 复制
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import * as React from 'react'

// shell.overlay 与 sidebar.footer.action 由内部 shell 包（ui-layout / ui-sidebar）声明，
// 不在 devDeps 里；这里手动合并 SlotMap，让 slots.register 认识这两个键。
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'shell.overlay': { kind: 'list'; scope: 'root' }
    'sidebar.footer.action': { kind: 'list'; scope: 'root'; owner: { wide: boolean } }
  }
}

/** 需要的客户端服务：slots（硬依赖）。 */
export const inject: string[] = ['slots']

/** theme 服务的最小结构视图（运行时由 shell 的 dsh-client-ui-theme 提供）。 */
interface QixiThemeService {
  overrideTokens(source: string, tokens: Record<string, { light: string; dark: string }>): () => void
}

// ── 常量 ──────────────────────────────────────────────
const LS_KEY = 'qixi-valentine-theme'
const BARRAGE_MSGS: string[] = [
  '七夕快乐 ❤',
  '愿得一人心',
  '白首不相离',
  '星河滚烫，你是人间理想',
  '我爱你 ·520',
  '鹊桥相会，如期而至',
  '山有木兮木有枝',
  '心悦君兮君不知',
  '金风玉露一相逢',
  '便胜却人间无数',
]

// ── 100 句七夕文案库（90 普通 + 10 隐藏款）── 第一人称「我 → 你」视角 ──
// 卡片是发给心爱的人的，所以每一句都是「我」对「你」说的话。
const QUOTES: string[] = [
  // —— 第一人称古诗词情诗（我 → 君 / 子 / 伊）——
  '我住长江头，君住长江尾。日日思君不见君，共饮长江水。\n——李之仪《卜算子》',
  '只愿君心似我心，定不负相思意。\n——李之仪《卜算子》',
  '山有木兮木有枝，心悦君兮君不知。\n——《越人歌》',
  '一日不见，如三秋兮。\n——《诗经·采葛》',
  '有美一人，清扬婉兮。邂逅相遇，适我愿兮。\n——《诗经·野有蔓草》',
  '既见君子，云胡不喜。\n——《诗经·风雨》',
  '宜言饮酒，与子偕老。\n——《诗经·女曰鸡鸣》',
  '琴瑟在御，莫不静好。\n——《诗经·女曰鸡鸣》',
  '桃之夭夭，灼灼其华。之子于归，宜其室家。\n——《诗经·桃夭》',
  '换我心，为你心，始知相忆深。\n——顾夐《诉衷情》',
  '玲珑骰子安红豆，入骨相思知不知。\n——温庭筠《南歌子词二首》',
  '入我相思门，知我相思苦。\n——李白《三五七言》',
  '相思相见知何日，此时此夜难为情。\n——李白《三五七言》',
  '长相思兮长相忆，短相思兮无穷极。\n——李白《三五七言》',
  '君当作磐石，妾当作蒲苇。蒲苇韧如丝，磐石无转移。\n——《孔雀东南飞》',
  '思君如满月，夜夜减清辉。\n——张九龄《赋得自君之出矣》',
  '思君如流水，何有穷已时。\n——徐干《室思》',
  '思君令人老，岁月忽已晚。\n——《古诗十九首·行行重行行》',
  '愿君多采撷，此物最相思。\n——王维《相思》',
  '相思一夜梅花发，忽到窗前疑是君。\n——卢仝《有所思》',
  '平生不会相思，才会相思，便害相思。\n——徐再思《折桂令·春情》',
  '衣带渐宽终不悔，为伊消得人憔悴。\n——柳永《蝶恋花》',
  '此情无计可消除，才下眉头，却上心头。\n——李清照《一剪梅》',
  '花自飘零水自流，一种相思，两处闲愁。\n——李清照《一剪梅》',
  '从别后，忆相逢，几回魂梦与君同。\n——晏几道《鹧鸪天》',
  '今宵剩把银釭照，犹恐相逢是梦中。\n——晏几道《鹧鸪天》',
  '结发为夫妻，恩爱两不疑。\n——苏武《留别妻》',
  '生当复来归，死当长相思。\n——苏武《留别妻》',
  '任凭弱水三千，我只取一瓢饮。\n——《红楼梦》',
  '这个妹妹我曾见过的。\n——《红楼梦》',
  '则为你如花美眷，似水流年。\n——汤显祖《牡丹亭》',
  '有缘千里来相会，无缘对面不相逢。\n——《增广贤文》',
  '十年修得同船渡，百年修得共枕眠。\n——《增广贤文》',
  '白首如新，倾盖如故。\n——《史记》',
  '人生若只如初见，何事秋风悲画扇。\n——纳兰性德《木兰花令》',
  '赌书消得泼茶香，当时只道是寻常。\n——纳兰性德《浣溪沙》',
  '众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。\n——辛弃疾《青玉案·元夕》',
  '身无彩凤双飞翼，心有灵犀一点通。\n——李商隐《无题》',
  // —— 第一人称原创情话（我 → 你）——
  '我想和你一起，从七夕到朝夕。',
  '山野万里，你是我藏在微风里的欢喜。',
  '你是我绕过山河错落，才找到的人间烟火。',
  '星河滚烫，你是我的人间理想。',
  '我把喜欢写进风里，从此整个世界都是你。',
  '愿有岁月可回首，且以深情共白头。',
  '愿我们朝朝暮暮，岁岁年年。',
  '想牵你的手，从心动到白头。',
  '我爱你，不只在七夕，而在朝朝暮暮。',
  '你是我目光所及，唯一的欢喜。',
  '遇见你，是我这辈子最幸运的事。',
  '我把你放在心上，从此山河都是你的名字。',
  '愿我的余生，处处都是你。',
  '你是我的软肋，也是我的铠甲。',
  '我想和你，看遍世间所有的日落。',
  '你是人间四月天，也是我的七月七。',
  '世界那么大，我只想赖在你身边。',
  '有你在，每天都是七夕。',
  '我的心很小，装下你就满了。',
  '你一笑，我的整个世界都亮了。',
  '我想把最好的自己，都给你。',
  '愿我们的爱，如星河般璀璨长久。',
  '牵着你的手，我就不怕未来。',
  '你是我不远万里，也要奔赴的人。',
  '我把所有的温柔，都留给了你。',
  '遇见你之前，我不懂什么是心动。',
  '你是我心里，永远的白月光。',
  '想和你，把日子过成诗。',
  '我爱你，是我最想说的情话。',
  '愿陪你，从青丝到白发。',
  '你是我这一生，最美好的意外。',
  '我的世界，因你而完整。',
  '想和你一起，数遍天上的星星。',
  '你是我的命中注定。',
  '我把思念，都写成了你的名字。',
  '愿我们的故事，没有结局。',
  '你在我心里，永远占据最重要的位置。',
  '我想一直一直，陪在你身边。',
  '你是我的四季，也是我的余生。',
  '爱你，是我做过最对的决定。',
  '愿每一年的今天，都是我和你。',
  '你是我，藏不住的欢喜。',
  '我想把整个世界，都捧到你面前。',
  '有你的地方，就是我的家。',
  '你是我，漫长岁月里唯一的心动。',
  '愿我们，永远像初见时那样心动。',
  '我把心交给了你，就再没想过收回。',
  '你是我，平凡生活里最亮的星。',
  '想和你一起慢慢变老。',
  '你是我，所有温柔和浪漫的起点。',
  '我爱你，像风走了八千里，不问归期。',
  '你是我的山河故人，也是我的来日方长。',
]

const HIDDEN_QUOTES: string[] = [
  '死生契阔，与子成说。执子之手，与子偕老。\n——《诗经·邶风·击鼓》',
  '山无陵，江水为竭，冬雷震震，夏雨雪，\n天地合，乃敢与君绝。\n——《上邪》',
  '愿我如星君如月，夜夜流光相皎洁。\n——范成大《车遥遥篇》',
  '曾经沧海难为水，除却巫山不是云。\n——元稹《离思五首·其四》',
  '两情若是久长时，又岂在朝朝暮暮。\n——秦观《鹊桥仙·纤云弄巧》',
  '在天愿作比翼鸟，在地愿为连理枝。\n——白居易《长恨歌》',
  '问世间，情为何物，直教生死相许。\n——元好问《摸鱼儿·雁丘词》',
  '情不知所起，一往而深。\n——汤显祖《牡丹亭》',
  '愿得一心人，白首不相离。\n——卓文君《白头吟》',
  '金风玉露一相逢，便胜却人间无数。\n——秦观《鹊桥仙·纤云弄巧》',
]

/** 随机抽取一句：10% 概率摇到隐藏款。 */
function randomQuote(): { text: string; hidden: boolean } {
  if (Math.random() < 0.1) {
    return { text: HIDDEN_QUOTES[Math.floor(Math.random() * HIDDEN_QUOTES.length)] ?? '', hidden: true }
  }
  return { text: QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? '', hidden: false }
}

const TOKENS: Record<string, { light: string; dark: string }> = {
  '--dsw-alias-brand-primary': { light: '#e0527d', dark: '#f4709d' },
  '--dsw-alias-bg-base': { light: '#fff7f9', dark: '#221220' },
  '--dsw-alias-bg-layer-1': { light: '#ffeef3', dark: '#2c1a27' },
  '--dsw-alias-bg-layer-2': { light: '#ffe3ec', dark: '#382230' },
  '--dsw-alias-bg-overlay': { light: '#fff3f6', dark: '#311f2b' },
  '--dsw-alias-border-l1': { light: '#f6d5e0', dark: '#553148' },
  '--dsw-alias-border-l2': { light: '#efc2d2', dark: '#6a3d56' },
  '--dsw-specific-sidebar-fill': { light: '#fbe4ec', dark: '#271522' },
  '--dsw-alias-label-primary': { light: '#5c2a42', dark: '#f8e7ee' },
  '--dsw-alias-label-secondary': { light: '#8a5568', dark: '#d8bcc8' },
}

const CSS: string = [
  '.qixi-toggle{display:inline-flex;align-items:center;gap:6px;padding:6px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit}',
  '.qixi-toggle:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
  '.qixi-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.qixi-toggle.is-on{color:#e0527d}',
  '.qixi-toggle-label{font-size:12px;letter-spacing:.02em}',
  '.qixi-banner{position:fixed;top:0;left:0;right:0;height:34px;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(90deg,#ffd3e0,#ff9ebc,#ffd3e0);color:#8a2a4d;font-size:13px;font-weight:600;letter-spacing:.05em;pointer-events:none;box-shadow:0 1px 0 rgba(224,82,125,.25);animation:qixi-slidedown .5s ease}',
  '.qixi-banner-hint{opacity:.7;font-weight:400;font-size:11px}',
  '.qixi-hearts{position:fixed;inset:0;overflow:hidden;pointer-events:none}',
  '.qixi-heart{position:absolute;bottom:-50px;color:#ff6f9e;animation:qixi-rise linear infinite;text-shadow:0 0 8px rgba(255,111,158,.5)}',
  '.qixi-barrage{position:fixed;inset:0;overflow:hidden;pointer-events:none}',
  '.qixi-barrage-item{position:absolute;left:100%;white-space:nowrap;color:rgba(255,255,255,.94);font-weight:600;text-shadow:0 0 12px rgba(224,82,125,.9),0 1px 2px rgba(0,0,0,.3);animation-name:qixi-barrage;animation-timing-function:linear;animation-fill-mode:forwards}',
  '.qixi-modal{position:fixed;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(20,8,18,.55);backdrop-filter:blur(4px);animation:qixi-fadein .25s ease;z-index:3000}',
  '.qixi-card{position:relative;width:min(460px,calc(100vw - 40px));background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);padding:24px;max-height:calc(100vh - 80px);overflow:auto;animation:qixi-pop .35s cubic-bezier(.2,1.4,.4,1)}',
  '.qixi-card.qixi-card-hidden{border:1px solid #f7d9a0;box-shadow:0 0 0 1px rgba(247,217,160,.4),0 24px 60px rgba(0,0,0,.35)}',
  '.qixi-card-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center}',
  '.qixi-card-close:hover{background:var(--dsw-alias-bg-layer-2)}',
  '.qixi-card-close:focus-visible{outline:2px solid var(--dsw-alias-brand-primary)}',
  '.qixi-letter-title{font-size:18px;font-weight:700;margin:4px 0 14px;display:flex;align-items:center;gap:8px}',
  '.qixi-hidden-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:linear-gradient(135deg,#f7d9a0,#e8b96f);color:#6b4a1f;font-size:11px;font-weight:700;letter-spacing:.05em}',
  '.qixi-letter-body{white-space:pre-wrap;line-height:1.9;font-size:15px;color:var(--dsw-alias-label-primary);min-height:120px;font-family:"STKaiti","KaiTi","Songti SC",Georgia,serif}',
  '.qixi-letter-caret{display:inline-block;width:2px;height:1em;background:#e0527d;margin-left:2px;vertical-align:-2px;animation:qixi-blink 1s steps(1) infinite}',
  '.qixi-actions{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}',
  '.qixi-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;cursor:pointer}',
  '.qixi-btn:hover{border-color:var(--dsw-alias-border-l2)}',
  '.qixi-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
  '.qixi-btn.primary{background:linear-gradient(135deg,#e0527d,#c23a66);color:#fff;border:none}',
  '.qixi-btn.primary:hover{filter:brightness(1.05)}',
  '.qixi-btn.loved{color:#e0527d;border-color:#e0527d}',
  '.qixi-field{margin-top:12px}',
  '.qixi-field label{display:block;font-size:12px;color:var(--dsw-alias-label-secondary);margin-bottom:6px;font-weight:600;letter-spacing:.02em}',
  '.qixi-field textarea,.qixi-field input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}',
  '.qixi-field textarea:focus,.qixi-field input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px;border-color:transparent}',
  '.qixi-share-preview{width:100%;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);display:block}',
  '.qixi-share-hint{font-size:12px;color:var(--dsw-alias-label-secondary);margin:10px 0 2px;text-align:center}',
  '.qixi-share-fab{position:fixed;right:22px;bottom:96px;pointer-events:auto;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#ff9ebc,#e0527d);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(224,82,125,.4);animation:qixi-pop .4s cubic-bezier(.2,1.4,.4,1);z-index:2000}',
  '.qixi-share-fab:hover{transform:translateY(-2px);filter:brightness(1.05)}',
  '.qixi-share-fab:focus-visible{outline:2px solid #fff;outline-offset:2px}',
  '@keyframes qixi-rise{0%{transform:translateY(0) rotate(-8deg) scale(.8);opacity:0}10%{opacity:1}100%{transform:translateY(-110vh) rotate(10deg) scale(1.1);opacity:0}}',
  '@keyframes qixi-barrage{from{transform:translateX(0)}to{transform:translateX(calc(-100vw - 100%))}}',
  '@keyframes qixi-pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}',
  '@keyframes qixi-fadein{from{opacity:0}to{opacity:1}}',
  '@keyframes qixi-slidedown{from{transform:translateY(-100%)}to{transform:translateY(0)}}',
  '@keyframes qixi-blink{50%{opacity:0}}',
].join('')

// ── 共享状态（模块级单例：换肤开关 + 弹幕 + 情书 + 分享卡片互相通信） ──
interface QixiState {
  themeOn: boolean
  barrage: string[]
  letterOpen: boolean
  shareOpen: boolean
  letterText: string
  letterHidden: boolean
  signature: string
}

const store = {
  listeners: new Set<() => void>(),
  state: {
    themeOn: false,
    barrage: [] as string[],
    letterOpen: false,
    shareOpen: false,
    letterText: '',
    letterHidden: false,
    signature: '',
  } as QixiState,
  set(patch: Partial<QixiState>): void {
    Object.assign(this.state, patch)
    for (const fn of Array.from(this.listeners)) fn()
  },
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  },
}

function useStore(): QixiState {
  const [, force] = React.useState(0)
  React.useEffect(() => store.subscribe(() => force((n) => n + 1)), [])
  return store.state
}

// ── 主题层管理（theme 服务引用在 apply 里注入） ──
let themeService: QixiThemeService | undefined
let themeDisposer: (() => void) | null = null

function setThemeLayer(on: boolean): void {
  if (themeService === undefined) return
  if (on) {
    if (themeDisposer === null) themeDisposer = themeService.overrideTokens('dsh-qixi', TOKENS)
  } else if (themeDisposer !== null) {
    themeDisposer()
    themeDisposer = null
  }
}

function readStored(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LS_KEY) === '1'
  } catch {
    return false
  }
}

function writeStored(on: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, on ? '1' : '0')
  } catch {
    // ignore
  }
}

// ── 动作 ──────────────────────────────────────────────
function toggleTheme(): void {
  const next = !store.state.themeOn
  store.set({ themeOn: next })
  writeStored(next)
  setThemeLayer(next)
}

let barrageTimer: number | null = null
function triggerBarrage(): void {
  if (store.state.barrage.length > 0) return
  store.set({ barrage: BARRAGE_MSGS.slice() })
  if (barrageTimer !== null) window.clearTimeout(barrageTimer)
  barrageTimer = window.setTimeout(() => store.set({ barrage: [] }), 6500)
}

function triggerLetter(): void {
  const q = randomQuote()
  store.set({ letterOpen: true, letterText: q.text, letterHidden: q.hidden })
}

function openShare(): void {
  store.set({ shareOpen: true, letterOpen: false })
}

// ── Canvas 绘制 ────────────────────────────────────────
function drawHeart(cc: CanvasRenderingContext2D, x: number, y: number, w: number, color: string): void {
  cc.save()
  cc.fillStyle = color
  cc.beginPath()
  const tch = w * 0.3
  cc.moveTo(x, y + tch)
  cc.bezierCurveTo(x, y, x - w / 2, y, x - w / 2, y + tch)
  cc.bezierCurveTo(x - w / 2, y + (w + tch) / 2, x, y + (w + tch) / 1.2, x, y + w)
  cc.bezierCurveTo(x, y + (w + tch) / 1.2, x + w / 2, y + (w + tch) / 2, x + w / 2, y + tch)
  cc.bezierCurveTo(x + w / 2, y, x, y, x, y + tch)
  cc.closePath()
  cc.fill()
  cc.restore()
}

/** 以 (cx, cy) 为中心、带旋转与透明度的爱心粒子（供 Canvas 实时合成背景用）。 */
function drawHeartAt(cc: CanvasRenderingContext2D, cx: number, cy: number, w: number, rot: number, alpha: number): void {
  cc.save()
  cc.globalAlpha = alpha
  cc.fillStyle = '#ff7ba0'
  cc.translate(cx, cy)
  cc.rotate(rot)
  const top = -w / 2
  const tch = w * 0.3
  cc.beginPath()
  cc.moveTo(0, top + tch)
  cc.bezierCurveTo(0, top, -w / 2, top, -w / 2, top + tch)
  cc.bezierCurveTo(-w / 2, top + (w + tch) / 2, 0, top + (w + tch) / 1.2, 0, top + w)
  cc.bezierCurveTo(0, top + (w + tch) / 1.2, w / 2, top + (w + tch) / 2, w / 2, top + tch)
  cc.bezierCurveTo(w / 2, top, 0, top, 0, top + tch)
  cc.closePath()
  cc.fill()
  cc.restore()
}

function wrapText(cc: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const paras = String(text || '').split('\n')
  for (const para of paras) {
    if (para === '') {
      lines.push('')
      continue
    }
    let line = ''
    for (const ch of para) {
      const test = line + ch
      if (cc.measureText(test).width > maxWidth && line !== '') {
        lines.push(line)
        line = ch
      } else {
        line = test
      }
    }
    lines.push(line)
  }
  return lines
}

/** 按标点智能折行：让诗句每行字数均衡（尽量在标点后断行，而非塞满宽度）。 */
function wrapPoem(cc: CanvasRenderingContext2D, para: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  let lastPunctIdx = -1
  for (const ch of para) {
    line += ch
    if ('，。！？；、：'.includes(ch)) lastPunctIdx = line.length
    if (cc.measureText(line).width > maxWidth) {
      if (lastPunctIdx > 0) {
        lines.push(line.slice(0, lastPunctIdx))
        line = line.slice(lastPunctIdx)
      } else {
        lines.push(line.slice(0, -1))
        line = line.slice(-1)
      }
      lastPunctIdx = -1
    }
  }
  if (line !== '') lines.push(line)
  return lines
}

interface CardTheme {
  name: string
  bg: [string, string, string]
  glow: string
  heart: string
  title: string
  label: string
  body: string
  accent: string
  divider: string
  watermark: string
}

/** 卡片配色主题：多套风格，一键换风格。 */
const CARD_THEMES: CardTheme[] = [
  {
    name: '玫紫星河',
    bg: ['#4a1740', '#8e2a63', '#e0577f'],
    glow: 'rgba(255,255,255,0.20)',
    heart: 'rgba(255,255,255,0.16)',
    title: '#fff6f8',
    label: '#f7d9a0',
    body: '#fff1f4',
    accent: '#f7d9a0',
    divider: 'rgba(255,255,255,0.35)',
    watermark: 'rgba(255,255,255,0.5)',
  },
  {
    name: '樱花粉白',
    bg: ['#ffe4ec', '#ffb6c8', '#f27ba0'],
    glow: 'rgba(255,255,255,0.55)',
    heart: 'rgba(214,69,120,0.16)',
    title: '#7a2440',
    label: '#c2185b',
    body: '#6d2a44',
    accent: '#c2185b',
    divider: 'rgba(122,36,64,0.25)',
    watermark: 'rgba(122,36,64,0.5)',
  },
  {
    name: '黛蓝星空',
    bg: ['#0b1d3a', '#1a3a6b', '#3d5a9e'],
    glow: 'rgba(160,200,255,0.18)',
    heart: 'rgba(200,220,255,0.16)',
    title: '#eaf2ff',
    label: '#f7d9a0',
    body: '#dbe7ff',
    accent: '#f7d9a0',
    divider: 'rgba(255,255,255,0.30)',
    watermark: 'rgba(255,255,255,0.5)',
  },
  {
    name: '赤金复古',
    bg: ['#3d0f1a', '#7a1f2b', '#c2453f'],
    glow: 'rgba(255,220,160,0.22)',
    heart: 'rgba(255,220,180,0.16)',
    title: '#fff3e6',
    label: '#ffd9a0',
    body: '#ffe8e0',
    accent: '#ffd9a0',
    divider: 'rgba(255,255,255,0.30)',
    watermark: 'rgba(255,255,255,0.5)',
  },
  {
    name: '墨青雅韵',
    bg: ['#0f2a2a', '#1d4a4a', '#3a7a7a'],
    glow: 'rgba(180,240,230,0.18)',
    heart: 'rgba(200,240,230,0.16)',
    title: '#eafaf6',
    label: '#f7d9a0',
    body: '#e2f4f0',
    accent: '#f7d9a0',
    divider: 'rgba(255,255,255,0.30)',
    watermark: 'rgba(255,255,255,0.5)',
  },
]

/** 简单的确定性伪随机（以 seed 生成，保证同一种子装饰爱心位置一致、不同种子布局不同）。 */
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function drawCard(canvas: HTMLCanvasElement, message: string, signature: string, theme: CardTheme): void {
  const W = 1080
  const H = 1440
  canvas.width = W
  canvas.height = H
  const cc = canvas.getContext('2d')
  if (cc === null) return

  const g = cc.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, theme.bg[0])
  g.addColorStop(0.45, theme.bg[1])
  g.addColorStop(1, theme.bg[2])
  cc.fillStyle = g
  cc.fillRect(0, 0, W, H)

  const rg = cc.createRadialGradient(W / 2, H * 0.24, 0, W / 2, H * 0.24, W * 0.62)
  rg.addColorStop(0, theme.glow)
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  cc.fillStyle = rg
  cc.fillRect(0, 0, W, H)

  // 装饰爱心：用主题名作种子，让不同主题的爱心分布不同
  const rnd = seeded(theme.name.length * 7919 + 13)
  const heartAlpha = theme.heart
  const dots: Array<[number, number, number, string]> = []
  for (let i = 0; i < 7; i++) {
    dots.push([60 + rnd() * (W - 120), 180 + rnd() * (H - 420), 22 + rnd() * 26, heartAlpha])
  }
  for (const d of dots) drawHeart(cc, d[0], d[1], d[2], d[3])

  cc.textAlign = 'center'
  cc.textBaseline = 'alphabetic'
  cc.fillStyle = theme.label
  cc.font = '400 34px "PingFang SC","Microsoft YaHei",sans-serif'
  cc.fillText('农历七月初七 · 鹊桥相会', W / 2, 156)

  cc.fillStyle = theme.title
  cc.font = '700 128px "STKaiti","KaiTi","PingFang SC",serif'
  cc.fillText('七夕快乐', W / 2, 336)

  drawHeart(cc, W / 2, 392, 44, theme.accent)

  // 正文与出处分离：正文白色居中按标点折行，出处金色小字号分层
  cc.fillStyle = theme.body
  cc.font = '400 44px "STSong","Songti SC",Georgia,serif'
  const bodyLines: string[] = []
  const creditLines: string[] = []
  for (const para of String(message || '').split('\n')) {
    const trimmed = para.trimStart()
    if (trimmed.startsWith('——')) {
      creditLines.push(trimmed)
    } else if (para === '') {
      bodyLines.push('')
    } else {
      for (const l of wrapPoem(cc, para, 700)) bodyLines.push(l)
    }
  }
  let shown = bodyLines
  if (shown.length > 6) {
    shown = shown.slice(0, 5)
    shown.push('…')
  }
  const startY = 540
  const lineH = 72
  let y = startY
  for (const line of shown) {
    cc.fillText(line ?? '', W / 2, y)
    y += lineH
  }
  if (creditLines.length > 0) {
    cc.fillStyle = theme.accent
    cc.font = '400 32px "STSong","Songti SC",Georgia,serif'
    for (const cl of creditLines) {
      cc.fillText(cl, W / 2, y)
      y += 58
    }
  }
  // 署名：与上文留足呼吸空间，两端对称装饰
  y += 70
  cc.fillStyle = theme.accent
  cc.font = '400 38px "STKaiti","KaiTi","PingFang SC",serif'
  cc.fillText('· ' + (signature || '你的小可爱') + ' ·', W / 2, y)

  cc.fillStyle = theme.divider
  cc.fillRect(W / 2 - 60, H - 320, 120, 1)

  cc.fillStyle = theme.title
  cc.font = '600 40px "PingFang SC","Microsoft YaHei",sans-serif'
  cc.fillText('#七夕告白', W / 2, H - 240)

  cc.fillStyle = theme.accent
  cc.font = '400 30px "PingFang SC","Microsoft YaHei",sans-serif'
  cc.fillText('输入暗号「情书」，领取你的告白', W / 2, H - 180)

  cc.fillStyle = theme.watermark
  cc.font = '400 26px "PingFang SC","Microsoft YaHei",sans-serif'
  cc.fillText('DeepSeek · Qixi', W / 2, H - 80)
}

// ── 组件 ──────────────────────────────────────────────
function HeartToggle(props: { wide: boolean }): React.ReactElement {
  const s = useStore()
  const on = s.themeOn
  return React.createElement(
    'button',
    {
      className: 'qixi-toggle' + (on ? ' is-on' : ''),
      type: 'button',
      'aria-pressed': on ? 'true' : 'false',
      title: on ? '关闭七夕主题' : '开启七夕主题',
      onClick: toggleTheme,
    },
    React.createElement(
      'svg',
      { viewBox: '0 0 24 24', width: 18, height: 18, fill: on ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }),
    ),
    props.wide ? React.createElement('span', { className: 'qixi-toggle-label' }, '七夕') : null,
  )
}

function Banner(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'qixi-banner', 'aria-hidden': true },
    React.createElement('span', null, '❤'),
    React.createElement('span', null, '七夕快乐 · 鹊桥相会'),
    React.createElement('span', { className: 'qixi-banner-hint' }, '暗号 520 / 情书'),
  )
}

interface Particle {
  kind: 'heart' | 'sparkle'
  x: number
  y: number
  vy: number
  size: number
  baseAlpha: number
  phase: number
  phaseSpeed: number
  rot: number
  vrot: number
}

function FloatingHearts(): React.ReactElement {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    let W = 0
    let H = 0
    const DPR = window.devicePixelRatio || 1
    let particles: Particle[] = []

    const resize = (): void => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.floor(W * DPR)
      canvas.height = Math.floor(H * DPR)
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    const spawn = (): void => {
      particles = []
      const heartCount = 24
      const sparkleCount = 40
      for (let i = 0; i < heartCount; i++) {
        particles.push({
          kind: 'heart',
          x: Math.random() * W,
          y: Math.random() * H,
          vy: 0.35 + Math.random() * 0.85,
          size: 8 + Math.random() * 16,
          baseAlpha: 0.18 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.008 + Math.random() * 0.02,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.012,
        })
      }
      for (let i = 0; i < sparkleCount; i++) {
        particles.push({
          kind: 'sparkle',
          x: Math.random() * W,
          y: Math.random() * H,
          vy: 0,
          size: 1 + Math.random() * 2.2,
          baseAlpha: 0.3 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.02 + Math.random() * 0.05,
          rot: 0,
          vrot: 0,
        })
      }
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number): void => {
      const dt = Math.min(now - last, 50) / 16.67
      last = now
      ctx.clearRect(0, 0, W, H)

      for (const p of particles) {
        p.phase += p.phaseSpeed * dt
        if (p.kind === 'heart') {
          p.y -= p.vy * dt
          p.rot += p.vrot * dt
          if (p.y < -30) {
            p.y = H + 30
            p.x = Math.random() * W
          }
          const a = p.baseAlpha * (0.55 + 0.45 * Math.sin(p.phase))
          drawHeartAt(ctx, p.x, p.y, p.size, p.rot, Math.max(0, a))
        } else {
          const a = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.phase))
          ctx.save()
          ctx.globalAlpha = Math.max(0, a)
          ctx.fillStyle = '#fff6e8'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
      raf = requestAnimationFrame(frame)
    }

    const onResize = (): void => {
      resize()
      spawn()
    }

    resize()
    spawn()
    window.addEventListener('resize', onResize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return React.createElement('canvas', {
    ref: canvasRef,
    style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1500 },
    'aria-hidden': true,
  })
}

function Barrage(props: { messages: string[] }): React.ReactElement {
  const items = props.messages.map((m, i) => ({
    text: m,
    top: 6 + (i % 6) * 15,
    delay: (i % 5) * 1.1,
    dur: 5.5 + (i % 4) * 1.8,
    size: 16 + (i % 3) * 7,
  }))
  return React.createElement(
    'div',
    { className: 'qixi-barrage', 'aria-hidden': true },
    items.map((t, i) =>
      React.createElement('div', { key: i, className: 'qixi-barrage-item', style: { top: t.top + '%', animationDelay: t.delay + 's', animationDuration: t.dur + 's', fontSize: t.size + 'px' } }, t.text),
    ),
  )
}

function ShareFloatButton(): React.ReactElement {
  return React.createElement(
    'button',
    { className: 'qixi-share-fab', type: 'button', title: '生成七夕分享卡片', 'aria-label': '生成七夕分享卡片', onClick: openShare },
    React.createElement(
      'svg',
      { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('path', { d: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7' }),
      React.createElement('polyline', { points: '16 6 12 2 8 6' }),
      React.createElement('line', { x1: 12, y1: 2, x2: 12, y2: 15 }),
    ),
  )
}

function LoveLetterModal(): React.ReactElement {
  const s = useStore()
  const [typed, setTyped] = React.useState('')
  const [done, setDone] = React.useState(false)
  const [loved, setLoved] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(s.letterText || '')

  React.useEffect(() => {
    const text = s.letterText || ''
    setTyped('')
    setDone(false)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTyped(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        setDone(true)
      }
    }, 32)
    return () => window.clearInterval(id)
  }, [s.letterText])

  // 快速生成文案：随机换一句，重新打字机展示
  const reroll = (): void => {
    const q = randomQuote()
    store.set({ letterText: q.text, letterHidden: q.hidden })
    setDraft(q.text)
  }

  return React.createElement(
    'div',
    { className: 'qixi-modal', role: 'dialog', 'aria-modal': true, 'aria-label': '一封情书' },
    React.createElement(
      'div',
      { className: 'qixi-card' + (s.letterHidden ? ' qixi-card-hidden' : '') },
      React.createElement('button', { className: 'qixi-card-close', type: 'button', 'aria-label': '关闭', onClick: () => store.set({ letterOpen: false }) }, '✕'),
      React.createElement('div', { className: 'qixi-letter-title' }, '💌', React.createElement('span', null, '一封情书'), s.letterHidden ? React.createElement('span', { className: 'qixi-hidden-badge' }, '✨ 隐藏款') : null),
      React.createElement('div', { className: 'qixi-letter-body' }, typed, done ? null : React.createElement('span', { className: 'qixi-letter-caret' })),
      React.createElement(
        'div',
        { className: 'qixi-actions' },
        React.createElement('button', { className: 'qixi-btn', type: 'button', onClick: reroll }, '🎲 换一句'),
        React.createElement('button', { className: 'qixi-btn primary', type: 'button', onClick: () => { store.set({ letterText: draft }); openShare() } }, '✨ 生成分享卡片'),
        React.createElement('button', { className: 'qixi-btn' + (loved ? ' loved' : ''), type: 'button', onClick: () => setLoved(!loved) }, loved ? '❤ 已收藏' : '🤍 收藏'),
        React.createElement('button', { className: 'qixi-btn', type: 'button', onClick: () => setEditing(!editing) }, editing ? '收起改写' : '✏️ 改写'),
      ),
      editing
        ? React.createElement(
            'div',
            { className: 'qixi-field' },
            React.createElement('label', null, '写下你的心里话'),
            React.createElement('textarea', { rows: 6, value: draft, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value) }),
          )
        : null,
    ),
  )
}

function ShareCardModal(): React.ReactElement {
  const s = useStore()
  const [signature, setSignature] = React.useState(s.signature || '你的小可爱')
  const [text, setText] = React.useState(s.letterText || '')
  const [copied, setCopied] = React.useState(false)
  const [themeIndex, setThemeIndex] = React.useState(() => Math.floor(Math.random() * CARD_THEMES.length))
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const theme = CARD_THEMES[themeIndex] ?? CARD_THEMES[0]!

  React.useEffect(() => {
    if (canvasRef.current !== null) drawCard(canvasRef.current, text, signature, theme)
  }, [text, signature, theme])

  const switchTheme = (): void => {
    setThemeIndex((i) => (i + 1) % CARD_THEMES.length)
  }

  function onDownload(): void {
    const c = canvasRef.current
    if (c === null || typeof document === 'undefined') return
    try {
      const a = document.createElement('a')
      a.href = c.toDataURL('image/png')
      a.download = 'qixi-love-' + Date.now() + '.png'
      a.click()
    } catch (e) {
      console.error(e)
    }
  }

  function onCopy(): void {
    const c = canvasRef.current
    if (c === null) return
    try {
      c.toBlob((blob) => {
        if (blob === null) return onDownload()
        if (navigator !== undefined && navigator.clipboard !== undefined && navigator.clipboard.write !== undefined) {
          navigator.clipboard
            .write([new ClipboardItem({ 'image/png': blob })])
            .then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => onDownload())
        } else {
          onDownload()
        }
      }, 'image/png')
    } catch {
      onDownload()
    }
  }

  return React.createElement(
    'div',
    { className: 'qixi-modal', role: 'dialog', 'aria-modal': true, 'aria-label': '七夕分享卡片' },
    React.createElement(
      'div',
      { className: 'qixi-card' },
      React.createElement('button', { className: 'qixi-card-close', type: 'button', 'aria-label': '关闭', onClick: () => store.set({ shareOpen: false }) }, '✕'),
      React.createElement('div', { className: 'qixi-letter-title' }, '✨', React.createElement('span', null, '七夕分享卡片')),
      React.createElement('canvas', { ref: canvasRef, className: 'qixi-share-preview', width: 1080, height: 1440 }),
      React.createElement('div', { className: 'qixi-share-hint' }, '把卡片分享给 TA，或发到朋友圈，传递七夕的浪漫'),
      React.createElement(
        'div',
        { className: 'qixi-actions' },
        React.createElement('button', { className: 'qixi-btn', type: 'button', onClick: switchTheme }, '🎨 换风格 · ' + theme.name),
      ),
      React.createElement('div', { className: 'qixi-field' }, React.createElement('label', null, '署名'), React.createElement('input', { type: 'text', value: signature, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSignature(e.target.value), placeholder: '你的名字或昵称' })),
      React.createElement('div', { className: 'qixi-field' }, React.createElement('label', null, '心里话'), React.createElement('textarea', { rows: 4, value: text, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value) })),
      React.createElement(
        'div',
        { className: 'qixi-actions' },
        React.createElement('button', { className: 'qixi-btn primary', type: 'button', onClick: onDownload }, '⬇ 下载图片'),
        React.createElement('button', { className: 'qixi-btn', type: 'button', onClick: onCopy }, copied ? '✓ 已复制' : '📋 复制图片'),
        React.createElement('button', { className: 'qixi-btn', type: 'button', onClick: () => store.set({ shareOpen: false }) }, '关闭'),
      ),
    ),
  )
}

function QixiOverlay(): React.ReactElement | null {
  const s = useStore()
  const parts: React.ReactNode[] = []
  if (s.themeOn) {
    parts.push(React.createElement(Banner, { key: 'banner' }))
    parts.push(React.createElement(FloatingHearts, { key: 'hearts' }))
    parts.push(React.createElement(ShareFloatButton, { key: 'fab' }))
  }
  if (s.barrage.length > 0) parts.push(React.createElement(Barrage, { key: 'barrage', messages: s.barrage }))
  if (s.letterOpen) parts.push(React.createElement(LoveLetterModal, { key: 'letter' }))
  if (s.shareOpen) parts.push(React.createElement(ShareCardModal, { key: 'share' }))
  if (parts.length === 0) return null
  return React.createElement('div', { style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2000 } }, parts)
}

// ── 输入暗号监听 ────────────────────────────────────────
function watchSecret(): () => void {
  if (typeof document === 'undefined') return () => {}
  let last = ''
  const handler = (e: Event): void => {
    if (!store.state.themeOn) return // 未点击七夕开关（未开启主题）时不触发暗号
    const t = e.target as HTMLElement | null
    if (t === null) return
    if (typeof t.closest === 'function' && t.closest('.qixi-modal') !== null) return
    const tag = (t.tagName || '').toLowerCase()
    if (tag !== 'textarea' && tag !== 'input' && !t.isContentEditable) return
    const el = t as HTMLTextAreaElement
    // trim 去除首尾空白/换行，兼容粘贴（Ctrl+V）带来的换行符
    const v = (el.value != null ? el.value : el.textContent || '').toString().trim()
    if (v === '') {
      last = '' // 清空输入框时重置，保证下次重新输入暗号能再次触发
      return
    }
    if (v === last) return
    if (v.endsWith('520')) {
      last = v
      triggerBarrage()
    } else if (v === '情书' || v.toLowerCase() === 'loveletter') {
      last = v
      triggerLetter()
    }
  }
  // Ctrl+A 全选 + Ctrl+X（剪切）清空 / Ctrl+V（粘贴）：重置 last，保证清空或粘贴后重新输入暗号能再次触发
  const onCut = (): void => {
    last = ''
  }
  const onPaste = (): void => {
    last = ''
  }
  document.addEventListener('input', handler, true)
  document.addEventListener('cut', onCut, true)
  document.addEventListener('paste', onPaste, true)
  return () => {
    document.removeEventListener('input', handler, true)
    document.removeEventListener('cut', onCut, true)
    document.removeEventListener('paste', onPaste, true)
  }
}

// ── 入口 ──────────────────────────────────────────────
export function apply(ctx: ClientContext): void {
  // 静态 CSS（幂等注入一次，不清理——bundle 插件常驻）
  const cssTagId = 'dsh-qixi/styles.css'
  if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + cssTagId + '"]') === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-qixi'
    tag.dataset.pluginCss = cssTagId
    tag.textContent = CSS
    document.head.appendChild(tag)
  }

  themeService = ctx.get('theme') as QixiThemeService | undefined

  // 输入暗号监听 + 主题恢复 + 卸载清理（都归当前 fiber 生命周期）
  ctx.effect(() => {
    const offInput = watchSecret()
    const wasOn = readStored()
    if (wasOn) {
      store.set({ themeOn: true })
      setThemeLayer(true)
    }
    return () => {
      offInput()
      if (barrageTimer !== null) {
        window.clearTimeout(barrageTimer)
        barrageTimer = null
      }
      if (themeDisposer !== null) {
        themeDisposer()
        themeDisposer = null
      }
    }
  })

  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register(
      { name: 'sidebar.footer.action', id: 'qixi-toggle', order: 10 },
      (props) => React.createElement(HeartToggle, { wide: props.wide }),
    ),
  )

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register({ name: 'shell.overlay', id: 'qixi-overlay', order: 5 }, QixiOverlay),
  )
}
