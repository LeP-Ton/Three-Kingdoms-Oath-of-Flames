/**
 * 三国志·烈火之誓 - GBA 风格像素艺术与纯正三国名将立绘生成引擎
 * 提供零外部网络依赖的确定性像素画生成与三国历史名将专属面容刻画
 */

import { TerrainType, UnitClass, Faction } from '../types';
import { ART_ASSETS } from './imageAssets';

// 调色板定义 (纯正汉末三国色彩与 GBA 火纹 16 色调色风格)
export const PALETTE = {
  // 肤色系
  skinFair: ['#fff7ed', '#ffedd5', '#fed7aa', '#fba872', '#b45309'],
  skinPeach: ['#ffffff', '#fff1f2', '#fecdd3', '#fda4af', '#be123c'],
  skinGuanYu: ['#f87171', '#dc2626', '#b91c1c', '#7f1d1d', '#450a0a'], // 面如重枣
  skinZhangFei: ['#d97706', '#b45309', '#78350f', '#451a03', '#270e02'], // 赤铜黑面
  skinDongZhuo: ['#fde047', '#eab308', '#ca8a04', '#854d0e', '#422006'], // 油亮横肉
  skinGeneral: ['#ffedd5', '#fed7aa', '#fb923c', '#c2410c', '#7c2d12'],
  skinDiaochan: ['#ffffff', '#fff5f5', '#fed7d7', '#feb2b2', '#9b2c2c'], // 闭月玉容

  // 发色胡须系
  hairBlack: ['#383838', '#212121', '#141414', '#0a0a0a', '#000000'],
  hairBrown: ['#8d6e63', '#6d4c41', '#4e342e', '#2e1910', '#170c08'],
  hairWhite: ['#ffffff', '#f1f5f9', '#cbd5e1', '#64748b', '#334155'],
  hairAmber: ['#f59e0b', '#d97706', '#92400e', '#451a03', '#1e0a02'],

  // 汉代经典阵营与服饰系
  shuGreen: ['#86efac', '#22c55e', '#15803d', '#14532d', '#052e16'], // 蜀锦青翠
  weiPurple: ['#d8b4fe', '#a855f7', '#6b21a8', '#3b0764', '#1f0337'], // 魏王玄紫
  wuCrimson: ['#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d', '#450a0a'], // 吴国赤焰
  hanGold: ['#fef08a', '#facc15', '#ca8a04', '#854d0e', '#422006'], // 汉室赤金
  yellowTurban: ['#fef08a', '#eab308', '#a16207', '#713f12', '#361e06'], // 黄巾道黄
  ironArmor: ['#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#0f172a'], // 玄铁重铠
  silverArmor: ['#ffffff', '#cbd5e1', '#64748b', '#334155', '#0f172a'], // 白银狮铠
  bronzeArmor: ['#d7ccc8', '#bcaaa4', '#8d6e63', '#4e342e', '#23120b'], // 青铜兜鍪
  scholarBlue: ['#bfdbfe', '#60a5fa', '#1d4ed8', '#1e3a8a', '#0f172a'], // 智谋策士蓝
  diaochanPink: ['#fbcfe8', '#f472b6', '#db2777', '#831843', '#4a0429'], // 绝代闭月粉
};

// 预渲染肖像缓存
const portraitCache = new Map<string, string>();
const mapTileCache = new Map<string, string>();
const unitSpriteCache = new Map<string, string>();

/**
 * 绘制纯正三国风格 GBA 角色头像 (128 x 128 高规格像素)
 */
export function getPortraitDataUrl(
  characterId: string,
  expression: 'normal' | 'smile' | 'angry' = 'normal',
  faction: Faction = Faction.Player
): string {
  const cacheKey = `${characterId}_${expression}_${faction}`;
  if (portraitCache.has(cacheKey)) {
    return portraitCache.get(cacheKey)!;
  }

  // 1. 若拥有专项重制的顶级神将立绘资产，优先直接使用
  if (ART_ASSETS.portraits[characterId]) {
    const assetUrl = ART_ASSETS.portraits[characterId];
    portraitCache.set(cacheKey, assetUrl);
    return assetUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  // 1. 背景渐变 (GBA 火纹古战场景深)
  const bgGrad = ctx.createLinearGradient(0, 0, 128, 128);
  if (characterId === 'caocao' || characterId === 'simayi') {
    bgGrad.addColorStop(0, '#2e1065');
    bgGrad.addColorStop(1, '#090314');
  } else if (characterId === 'sunce' || characterId === 'zhouyu') {
    bgGrad.addColorStop(0, '#450a0a');
    bgGrad.addColorStop(1, '#170404');
  } else if (characterId === 'zhangjiao') {
    bgGrad.addColorStop(0, '#422006');
    bgGrad.addColorStop(1, '#1a0b02');
  } else if (characterId === 'diaochan') {
    bgGrad.addColorStop(0, '#4a044e');
    bgGrad.addColorStop(1, '#1a031e');
  } else if (faction === Faction.Enemy) {
    bgGrad.addColorStop(0, '#3b0d0c');
    bgGrad.addColorStop(1, '#140404');
  } else {
    // 蜀汉与主角：墨绿与玄青
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(1, '#021f17');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 128, 128);

  // 背景古典云气 / 战尘
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(10 + i * 18, 16 + (i % 3) * 24, 28, 4);
    ctx.fillRect(18 + i * 16, 20 + (i % 3) * 24, 18, 3);
  }

  // 2. 绘制专属三国名将容貌 (汉代冠冕、美髯胡须、交领汉服、明光铁铠)
  drawAuthenticThreeKingdomsHero(ctx, characterId, expression, faction);

  // 3. GBA 经典仿古双层镂金边框与汉代回纹角标
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#b45309'; // 外铜金
  ctx.strokeRect(2, 2, 124, 124);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#fde047'; // 亮金内嵌线
  ctx.strokeRect(4, 4, 120, 120);

  ctx.strokeStyle = '#78350f'; // 暗阴影线
  ctx.strokeRect(6, 6, 116, 116);

  // 四角汉代云雷纹装饰 (Corner Filigree)
  const drawCorner = (x: number, y: number, sx: number, sy: number) => {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x, y, sx * 8, sy * 2);
    ctx.fillRect(x, y, sx * 2, sy * 8);
    ctx.fillRect(x + sx * 4, y + sy * 4, sx * 4, sy * 2);
    ctx.fillRect(x + sx * 4, y + sy * 4, sx * 2, sy * 4);
  };
  drawCorner(7, 7, 1, 1);
  drawCorner(121, 7, -1, 1);
  drawCorner(7, 121, 1, -1);
  drawCorner(121, 121, -1, -1);

  // 阵营印鉴标记 (右上角蜀、魏、吴、汉、贼)
  let factionBadge = '蜀';
  let badgeBg = '#15803d';
  if (['caocao', 'simayi', 'xiahoudun', 'zhangliao', 'xuhuang', 'xiahouyuan', 'caoren'].includes(characterId)) {
    factionBadge = '魏';
    badgeBg = '#6b21a8';
  } else if (['sunce', 'zhouyu', 'taishici', 'ganning', 'luxun'].includes(characterId)) {
    factionBadge = '吴';
    badgeBg = '#b91c1c';
  } else if (['zhangjiao', 'bandit'].includes(characterId)) {
    factionBadge = '巾';
    badgeBg = '#a16207';
  } else if (['dongzhuo', 'lubu'].includes(characterId)) {
    factionBadge = '雄';
    badgeBg = '#451a03';
  } else if (['huatuo', 'zuoci'].includes(characterId)) {
    factionBadge = '仙';
    badgeBg = '#0284c7';
  } else if (characterId === 'protagonist') {
    factionBadge = '汉';
    badgeBg = '#b45309';
  }

  // 绘制印章
  ctx.fillStyle = badgeBg;
  ctx.fillRect(98, 8, 22, 18);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#fde047';
  ctx.strokeRect(98, 8, 22, 18);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(factionBadge, 109, 17);

  const dataUrl = canvas.toDataURL('image/png');
  portraitCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * 依据三国历史画卷与经典 SRPG 设定，绘制每位英雄的专属神韵面容
 */
function drawAuthenticThreeKingdomsHero(
  ctx: CanvasRenderingContext2D,
  charId: string,
  expression: 'normal' | 'smile' | 'angry',
  faction: Faction
) {
  // 基础骨架参数
  let skinTone = PALETTE.skinFair;
  let hairColor = PALETTE.hairBlack;
  let robePrimary = PALETTE.shuGreen;
  let robeTrim = PALETTE.hanGold;
  let isFemale = false;
  let hasMustache = false;
  let hasBeard = false;
  let beardStyle: 'flowing' | 'wild' | 'short' | 'sage' = 'short';
  let eyeType: 'phoenix' | 'tiger' | 'eagle' | 'wise' | 'beauty' | 'hero' = 'hero';
  let headwear: 'liang_guan' | 'tongtian_guan' | 'beast_band' | 'lady_hair' | 'wizard_hat' | 'iron_helmet' | 'silver_lion' | 'turbans' | 'scholar_hat' | 'general_hood' = 'general_hood';
  let eyePatch = false;

  // 1. 角色个性化设定
  switch (charId) {
    case 'liubei': // 刘备：双梁亲王进贤冠，美髯，双耳垂肩，仁德温润
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.shuGreen;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'flowing';
      headwear = 'liang_guan';
      eyeType = 'wise';
      break;

    case 'zhangfei': // 张飞：豹头环眼，怒发冲天，燕颔虎须，金兽抹额
      skinTone = PALETTE.skinZhangFei;
      robePrimary = PALETTE.ironArmor;
      robeTrim = PALETTE.hairAmber;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'wild';
      headwear = 'beast_band';
      eyeType = 'tiger';
      break;

    case 'caocao': // 曹操：通天紫冠，细长凤眼鹰视，长髯如墨，玄黑朱红双龙衮服
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.weiPurple;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'flowing';
      headwear = 'tongtian_guan';
      eyeType = 'eagle';
      break;

    case 'diaochan': // 貂蝉：闭月之貌，垂云高髻，金步摇桃花钿，粉罗绮裳
      skinTone = PALETTE.skinDiaochan;
      robePrimary = PALETTE.diaochanPink;
      robeTrim = PALETTE.hanGold;
      isFemale = true;
      headwear = 'lady_hair';
      eyeType = 'beauty';
      break;

    case 'dongzhuo': // 董卓：满脸油亮横肉，粗恶浓眉，铜铃凶眼，金蟒朝服
      skinTone = PALETTE.skinDongZhuo;
      robePrimary = PALETTE.wuCrimson;
      robeTrim = PALETTE.hanGold;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'wild';
      headwear = 'tongtian_guan';
      eyeType = 'tiger';
      break;

    case 'zhangjiao': // 张角：黄巾教主，黄布朱符，两鬓凌乱白发，狂热金芒
      skinTone = PALETTE.skinGeneral;
      hairColor = PALETTE.hairWhite;
      robePrimary = PALETTE.yellowTurban;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'sage';
      headwear = 'turbans';
      eyeType = 'eagle';
      break;

    case 'zhouyu': // 周瑜：美周郎，羽衣锦带，白玉簪，俊美无俦
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.wuCrimson;
      robeTrim = PALETTE.silverArmor;
      headwear = 'scholar_hat';
      eyeType = 'phoenix';
      break;

    case 'sunce': // 孙策：小霸王，剑眉星目，金狮抹额，火红锦披
      skinTone = PALETTE.skinFair;
      hairColor = PALETTE.hairAmber;
      robePrimary = PALETTE.wuCrimson;
      headwear = 'beast_band';
      eyeType = 'hero';
      break;

    case 'huatuo': // 华佗：悬壶济世，白眉三尺，慈颜鹤发，青布方巾
      skinTone = PALETTE.skinFair;
      hairColor = PALETTE.hairWhite;
      robePrimary = PALETTE.scholarBlue;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'sage';
      headwear = 'scholar_hat';
      eyeType = 'wise';
      break;

    case 'zuoci': // 左慈：乌角道人，太极道髻，白发半瞑，紫霞云纹
      skinTone = PALETTE.skinFair;
      hairColor = PALETTE.hairWhite;
      robePrimary = PALETTE.weiPurple;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'sage';
      headwear = 'wizard_hat';
      eyeType = 'wise';
      break;

    case 'xiahoudun': // 夏侯惇：独眼猛将，斜向铁铆钉眼罩，颊带刀疤，短须如钢
      skinTone = PALETTE.skinGeneral;
      robePrimary = PALETTE.ironArmor;
      eyePatch = true;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'short';
      headwear = 'iron_helmet';
      eyeType = 'tiger';
      break;

    case 'zhangliao': // 张辽：威震逍遥津，雁翎铁盔，目光深沉，大将威严
      skinTone = PALETTE.skinGeneral;
      robePrimary = PALETTE.ironArmor;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'short';
      headwear = 'iron_helmet';
      eyeType = 'eagle';
      break;

    case 'huangzhong': // 黄忠：老当益壮，长眉白髯，金雕战盔，目若寒星
      skinTone = PALETTE.skinGeneral;
      hairColor = PALETTE.hairWhite;
      robePrimary = PALETTE.shuGreen;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'sage';
      headwear = 'iron_helmet';
      eyeType = 'eagle';
      break;

    case 'machao': // 马超：锦马超，白银狮子盔插双羽，面若冠玉
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.silverArmor;
      robeTrim = PALETTE.shuGreen;
      headwear = 'silver_lion';
      eyeType = 'hero';
      break;

    case 'weiyan': // 魏延：桀骜悍将，冷面如铁，短发粗须
      skinTone = PALETTE.skinZhangFei;
      robePrimary = PALETTE.ironArmor;
      hasMustache = true;
      hasBeard = true;
      beardStyle = 'short';
      headwear = 'general_hood';
      eyeType = 'tiger';
      break;

    case 'jiangwei': // 姜维：天水麒麟，束发银冠，英气勃勃青年都尉
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.shuGreen;
      robeTrim = PALETTE.silverArmor;
      headwear = 'general_hood';
      eyeType = 'hero';
      break;

    case 'protagonist': // 原创主角 (玄霄)：少侠束发朱绦，剑眉星目，藏青龙纹轻甲
    default:
      skinTone = PALETTE.skinFair;
      robePrimary = PALETTE.scholarBlue;
      robeTrim = PALETTE.hanGold;
      headwear = 'general_hood';
      eyeType = 'hero';
      break;
  }

  // --- 步骤 1: 绘制躯干、披风与交领汉服 (Y: 78 - 120) ---
  // 披风底衬
  ctx.fillStyle = robePrimary[3];
  ctx.beginPath();
  ctx.moveTo(18, 90);
  ctx.lineTo(8, 124);
  ctx.lineTo(120, 124);
  ctx.lineTo(110, 90);
  ctx.closePath();
  ctx.fill();

  // 汉服主躯干
  ctx.fillStyle = robePrimary[2];
  ctx.fillRect(24, 82, 80, 42);

  // 肩膀与兽面吞肩铠 (Pauldrons)
  ctx.fillStyle = robePrimary[1];
  ctx.fillRect(16, 86, 24, 34);
  ctx.fillRect(88, 86, 24, 34);

  // 肩吞金饰 / 虎首纹
  ctx.fillStyle = robeTrim[1];
  ctx.fillRect(14, 84, 26, 5);
  ctx.fillRect(88, 84, 26, 5);
  ctx.fillRect(20, 96, 12, 10);
  ctx.fillRect(96, 96, 12, 10);

  // 汉服交领右衽 (Crossed Collar: 左压右)
  ctx.fillStyle = robeTrim[1]; // 外金边
  ctx.beginPath();
  ctx.moveTo(42, 78);
  ctx.lineTo(64, 114);
  ctx.lineTo(68, 114);
  ctx.lineTo(48, 78);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff'; // 中层雪白内衬交领
  ctx.beginPath();
  ctx.moveTo(46, 78);
  ctx.lineTo(64, 106);
  ctx.lineTo(66, 106);
  ctx.lineTo(50, 78);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = robePrimary[0]; // 右侧交领
  ctx.beginPath();
  ctx.moveTo(86, 78);
  ctx.lineTo(58, 114);
  ctx.lineTo(54, 114);
  ctx.lineTo(80, 78);
  ctx.closePath();
  ctx.fill();

  // 胸前护心镜 / 祥云龙纹
  ctx.fillStyle = robeTrim[1];
  ctx.beginPath();
  ctx.arc(64, 104, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = robeTrim[0];
  ctx.beginPath();
  ctx.arc(64, 104, 6, 0, Math.PI * 2);
  ctx.fill();

  // --- 步骤 2: 绘制颈项 (Y: 66 - 82) ---
  ctx.fillStyle = skinTone[3]; // 颈底阴影
  ctx.fillRect(52, 68, 24, 16);
  ctx.fillStyle = skinTone[2]; // 颈部中调
  ctx.fillRect(54, 70, 20, 14);
  ctx.fillStyle = skinTone[1]; // 喉结/颈部高光
  ctx.fillRect(58, 72, 12, 10);

  // --- 步骤 3: 绘制面容轮廓与下巴 (Y: 34 - 72, X: 42 - 86) ---
  // 耳朵
  ctx.fillStyle = skinTone[2];
  ctx.fillRect(38, 48, 6, 16);
  ctx.fillRect(84, 48, 6, 16);
  ctx.fillStyle = skinTone[1];
  ctx.fillRect(40, 50, 3, 10);
  ctx.fillRect(85, 50, 3, 10);

  if (charId === 'liubei') {
    // 刘备大耳垂肩
    ctx.fillStyle = skinTone[1];
    ctx.fillRect(38, 62, 7, 7);
    ctx.fillRect(83, 62, 7, 7);
  }

  // 面颊底色
  ctx.fillStyle = skinTone[2];
  ctx.fillRect(42, 36, 44, 34);

  // 面部三级光影立体感 (颌骨与下巴收紧)
  ctx.fillStyle = skinTone[1];
  ctx.fillRect(44, 38, 40, 28);
  ctx.fillStyle = skinTone[0];
  ctx.fillRect(48, 40, 32, 22); // 额头与面中高光

  // 下颌骨收口
  ctx.fillStyle = skinTone[3];
  ctx.fillRect(46, 68, 36, 4);
  ctx.fillRect(52, 72, 24, 3);

  // 貂蝉腮红
  if (isFemale) {
    ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.fillRect(46, 54, 8, 4);
    ctx.fillRect(74, 54, 8, 4);
  }

  // --- 步骤 4: 眉毛与双眼刻画 (Eye and Brows) ---
  const browY = expression === 'angry' ? 44 : 45;
  const eyeY = 49;

  // 眉毛绘制 (根据性格特色)
  ctx.fillStyle = hairColor[2];
  if (eyeType === 'tiger' || expression === 'angry') {
    // 粗浓倒八字怒眉 (张飞、董卓、夏侯惇)
    ctx.fillRect(44, browY + 3, 13, 4);
    ctx.fillRect(53, browY, 5, 4);
    ctx.fillRect(71, browY, 5, 4);
    ctx.fillRect(72, browY + 3, 13, 4);
  } else if (eyeType === 'beauty') {
    // 柳叶弯眉 (貂蝉)
    ctx.fillStyle = '#262626';
    ctx.fillRect(46, browY, 11, 2);
    ctx.fillRect(44, browY + 1, 4, 2);
    ctx.fillRect(71, browY, 11, 2);
    ctx.fillRect(80, browY + 1, 4, 2);
  } else if (eyeType === 'phoenix' || eyeType === 'eagle') {
    // 丹凤眼 / 卧蚕眉 (周瑜、曹操、诸葛亮)
    ctx.fillRect(45, browY, 13, 3);
    ctx.fillRect(43, browY - 1, 4, 3);
    ctx.fillRect(70, browY, 13, 3);
    ctx.fillRect(81, browY - 1, 4, 3);
  } else {
    // 英武挺拔剑眉 (主角、刘备、孙策)
    ctx.fillRect(45, browY, 12, 3);
    ctx.fillRect(71, browY, 12, 3);
  }

  // 眼睛绘制
  if (eyePatch) {
    // 夏侯惇黑铁铆钉斜皮眼罩
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(43, eyeY - 2, 15, 12);
    ctx.fillStyle = '#cbd5e1'; // 银色铆钉
    ctx.fillRect(45, eyeY, 2, 2);
    ctx.fillRect(54, eyeY + 6, 2, 2);
    // 斜绑带
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(38, eyeY - 6);
    ctx.lineTo(60, eyeY + 12);
    ctx.lineTo(58, eyeY + 14);
    ctx.lineTo(36, eyeY - 4);
    ctx.closePath();
    ctx.fill();

    // 刀疤
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(52, 42, 3, 16);

    // 健在的右眼：怒目圆睁
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(72, eyeY, 10, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(74, eyeY + 1, 6, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(74, eyeY + 1, 2, 2); // 高光
  } else {
    // 双眼结构
    ctx.fillStyle = '#ffffff'; // 眼白
    ctx.fillRect(46, eyeY, 10, 6);
    ctx.fillRect(72, eyeY, 10, 6);

    // 瞳孔与眼神
    ctx.fillStyle = '#171717';
    if (eyeType === 'tiger') {
      // 铜铃大眼，黑睛如墨
      ctx.fillRect(48, eyeY + 1, 6, 5);
      ctx.fillRect(74, eyeY + 1, 6, 5);
    } else if (eyeType === 'beauty') {
      // 灵动杏眼带黛黑眼线
      ctx.fillRect(49, eyeY + 1, 5, 4);
      ctx.fillRect(74, eyeY + 1, 5, 4);
      // 上眼线
      ctx.fillStyle = '#09090b';
      ctx.fillRect(45, eyeY - 1, 12, 2);
      ctx.fillRect(71, eyeY - 1, 12, 2);
    } else {
      // 坚毅双眸
      ctx.fillRect(49, eyeY + 1, 5, 5);
      ctx.fillRect(74, eyeY + 1, 5, 5);
    }

    // 眼神高光 (Eye Specular)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(49, eyeY + 1, 2, 2);
    ctx.fillRect(74, eyeY + 1, 2, 2);
  }

  // --- 步骤 5: 鼻梁与鼻准 (Nose) ---
  ctx.fillStyle = skinTone[3];
  ctx.fillRect(63, 50, 3, 11); // 鼻梁侧影
  ctx.fillStyle = skinTone[2];
  ctx.fillRect(60, 59, 8, 3); // 鼻翼
  ctx.fillStyle = skinTone[0];
  ctx.fillRect(62, 51, 2, 8); // 鼻梁亮线

  // --- 步骤 6: 嘴唇与微表情 (Lips) ---
  ctx.fillStyle = isFemale ? '#e11d48' : '#7f1d1d';
  if (expression === 'smile') {
    ctx.fillRect(57, 66, 14, 2);
    ctx.fillRect(55, 65, 3, 2);
    ctx.fillRect(70, 65, 3, 2);
  } else if (expression === 'angry') {
    ctx.fillRect(57, 66, 14, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(59, 66, 10, 1); // 咬牙露齿
  } else {
    ctx.fillRect(58, 66, 12, 2);
    ctx.fillRect(61, 68, 6, 1); // 下唇阴影
  }

  // --- 步骤 7: 胡须系统 (Beard and Mustache) ---
  if (hasMustache) {
    ctx.fillStyle = hairColor[2];
    ctx.fillRect(54, 63, 20, 3);
    ctx.fillRect(52, 65, 4, 3);
    ctx.fillRect(72, 65, 4, 3);
  }

  if (hasBeard) {
    ctx.fillStyle = hairColor[2];
    if (beardStyle === 'wild') {
      // 张飞狂放短络腮虎须
      ctx.fillRect(44, 62, 10, 14);
      ctx.fillRect(74, 62, 10, 14);
      ctx.fillRect(50, 69, 28, 14);
      ctx.fillRect(48, 78, 32, 10);
      ctx.fillRect(54, 88, 20, 6);
    } else if (beardStyle === 'sage') {
      // 华佗/左慈/黄忠飘逸三尺长须
      ctx.fillStyle = hairColor[1];
      ctx.fillRect(52, 69, 24, 18);
      ctx.fillRect(54, 87, 20, 24);
      ctx.fillRect(56, 111, 16, 14);
      ctx.fillStyle = hairColor[0]; // 银髯高光
      ctx.fillRect(56, 75, 4, 40);
      ctx.fillRect(66, 75, 4, 40);
    } else if (beardStyle === 'flowing') {
      // 曹操/刘备端庄儒雅长须
      ctx.fillRect(54, 69, 20, 16);
      ctx.fillRect(56, 85, 16, 18);
      ctx.fillRect(59, 103, 10, 12);
    } else {
      // 短须
      ctx.fillRect(54, 69, 20, 8);
      ctx.fillRect(56, 77, 16, 6);
    }
  }

  // --- 步骤 8: 汉代头冠与发式 (Authentic Han Headwear) ---
  if (headwear === 'liang_guan') {
    // 刘备：东汉亲王双梁进贤冠 (带白玉珠簪与金簪)
    ctx.fillStyle = PALETTE.hairBlack[3];
    ctx.fillRect(46, 14, 36, 24);
    ctx.fillStyle = PALETTE.hanGold[1];
    ctx.fillRect(50, 12, 28, 6); // 冠梁金顶
    ctx.fillRect(54, 10, 6, 8); // 左梁
    ctx.fillRect(68, 10, 6, 8); // 右梁
    ctx.fillStyle = '#ffffff'; // 冠顶白玉珠
    ctx.fillRect(62, 8, 4, 4);
    // 垂发带
    ctx.fillStyle = PALETTE.shuGreen[1];
    ctx.fillRect(44, 30, 4, 36);
    ctx.fillRect(80, 30, 4, 36);
  } else if (headwear === 'tongtian_guan') {
    // 曹操/董卓：巍峨通天冠 (紫金多梁高冠)
    ctx.fillStyle = PALETTE.weiPurple[4];
    ctx.fillRect(44, 8, 40, 28);
    ctx.fillStyle = PALETTE.hanGold[1];
    ctx.fillRect(42, 28, 44, 6); // 金额箍
    ctx.fillRect(52, 6, 24, 6); // 金顶宝珠
    // 冠后长巾
    ctx.fillStyle = PALETTE.weiPurple[2];
    ctx.fillRect(40, 22, 5, 40);
    ctx.fillRect(83, 22, 5, 40);
  } else if (headwear === 'beast_band') {
    // 张飞/孙策：赤金狮蛮兽面抹额，冲天短发
    ctx.fillStyle = hairColor[1];
    // 怒发冲天
    for (let x = 38; x <= 86; x += 6) {
      ctx.fillRect(x, 14, 5, 20);
      ctx.fillRect(x + 2, 8, 3, 10);
    }
    // 赤金兽面抹额
    ctx.fillStyle = PALETTE.hanGold[1];
    ctx.fillRect(36, 28, 56, 10);
    ctx.fillStyle = '#dc2626'; // 额心红玛瑙
    ctx.fillRect(61, 30, 6, 6);
  } else if (headwear === 'lady_hair') {
    // 貂蝉：绝代垂云髻，金步摇桃花钿
    ctx.fillStyle = PALETTE.hairBlack[3];
    ctx.beginPath();
    ctx.arc(64, 26, 22, 0, Math.PI * 2);
    ctx.fill();
    // 垂云侧髻
    ctx.beginPath();
    ctx.arc(42, 34, 12, 0, Math.PI * 2);
    ctx.arc(86, 34, 12, 0, Math.PI * 2);
    ctx.fill();
    // 金凤步摇 (Golden Tassel Hairpin)
    ctx.fillStyle = PALETTE.hanGold[0];
    ctx.fillRect(30, 18, 16, 4);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(28, 22, 3, 16); // 垂珠流苏
    ctx.fillRect(32, 22, 3, 12);
    // 额心粉红花钿
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(62, 42, 4, 4);
  } else if (headwear === 'scholar_hat') {
    // 周瑜/华佗：高雅名士冠，白玉簪
    ctx.fillStyle = robePrimary[3];
    ctx.fillRect(48, 12, 32, 24);
    ctx.fillStyle = PALETTE.silverArmor[0]; // 白玉簪横贯
    ctx.fillRect(38, 24, 52, 4);
    ctx.fillStyle = PALETTE.silverArmor[1];
    ctx.fillRect(36, 22, 4, 8);
    // 飘带
    ctx.fillStyle = robePrimary[1];
    ctx.fillRect(44, 30, 4, 40);
    ctx.fillRect(80, 30, 4, 40);
  } else if (headwear === 'iron_helmet') {
    // 夏侯惇/张辽/黄忠：东汉名将寒铁战盔
    ctx.fillStyle = PALETTE.ironArmor[3];
    ctx.fillRect(38, 14, 52, 20);
    ctx.fillStyle = PALETTE.ironArmor[1];
    ctx.fillRect(42, 10, 44, 10);
    // 盔顶红缨
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(61, 2, 6, 12);
    ctx.fillRect(59, 6, 10, 6);
    // 护颊护耳
    ctx.fillStyle = PALETTE.ironArmor[2];
    ctx.fillRect(34, 28, 8, 24);
    ctx.fillRect(86, 28, 8, 24);
  } else if (headwear === 'silver_lion') {
    // 马超：白银狮面盔插双白翎
    ctx.fillStyle = PALETTE.silverArmor[0];
    ctx.fillRect(38, 14, 52, 20);
    // 双羽冲天
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(42, 2, 4, 16);
    ctx.fillRect(82, 2, 4, 16);
    // 狮面金雕
    ctx.fillStyle = PALETTE.hanGold[1];
    ctx.fillRect(56, 20, 16, 10);
    ctx.fillRect(62, 16, 4, 6);
  } else if (headwear === 'turbans') {
    // 张角：黄巾抹额朱砂符
    ctx.fillStyle = hairColor[1];
    ctx.fillRect(38, 18, 52, 16);
    // 黄布抹额
    ctx.fillStyle = PALETTE.yellowTurban[1];
    ctx.fillRect(36, 28, 56, 10);
    // 朱砂符咒
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(58, 30, 12, 6);
  } else {
    // 少侠/武将束发银冠 (主角玄霄等)
    ctx.fillStyle = hairColor[2];
    ctx.fillRect(40, 20, 48, 16);
    // 银发冠
    ctx.fillStyle = PALETTE.silverArmor[0];
    ctx.fillRect(56, 8, 16, 14);
    // 朱红发带飘飞
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(60, 6, 8, 4);
    ctx.fillRect(36, 16, 4, 38);
    ctx.fillRect(88, 16, 4, 38);
  }
}

/**
 * 绘制地图地形 32x32 经典棋盘瓦片
 */
export function getTerrainTileUrl(terrain: TerrainType): string {
  if (mapTileCache.has(terrain)) {
    return mapTileCache.get(terrain)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  switch (terrain) {
    case TerrainType.Plains:
      ctx.fillStyle = '#557a1d'; // 平原中草绿
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6b9a24';
      ctx.fillRect(2, 2, 12, 10);
      ctx.fillRect(16, 14, 14, 12);
      ctx.fillStyle = '#446214';
      ctx.fillRect(4, 18, 10, 8);
      ctx.fillRect(18, 4, 8, 6);
      break;

    case TerrainType.Forest:
      ctx.fillStyle = '#3f5d13';
      ctx.fillRect(0, 0, 32, 32);
      // 树冠深绿与松柏感
      ctx.fillStyle = '#1b4414';
      ctx.beginPath();
      ctx.arc(12, 14, 9, 0, Math.PI * 2);
      ctx.arc(22, 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d6521';
      ctx.beginPath();
      ctx.arc(10, 12, 7, 0, Math.PI * 2);
      ctx.arc(20, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      // 树干
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(10, 22, 4, 8);
      ctx.fillRect(20, 24, 4, 6);
      break;

    case TerrainType.Mountain:
    case TerrainType.Peak:
      ctx.fillStyle = '#5c4838';
      ctx.fillRect(0, 0, 32, 32);
      // 险峻山石
      ctx.fillStyle = '#826852';
      ctx.beginPath();
      ctx.moveTo(16, 3);
      ctx.lineTo(2, 30);
      ctx.lineTo(30, 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9e8065';
      ctx.beginPath();
      ctx.moveTo(16, 3);
      ctx.lineTo(8, 30);
      ctx.lineTo(16, 30);
      ctx.closePath();
      ctx.fill();
      // 积雪或尖峰石角
      ctx.fillStyle = '#ede5db';
      ctx.fillRect(14, 3, 4, 4);
      break;

    case TerrainType.River:
      ctx.fillStyle = '#1d5e87';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#2f82ba';
      ctx.fillRect(0, 5, 32, 7);
      ctx.fillRect(0, 19, 32, 7);
      ctx.fillStyle = '#7ac9ff';
      ctx.fillRect(3, 7, 14, 2);
      ctx.fillRect(17, 21, 12, 2);
      break;

    case TerrainType.Bridge:
      ctx.fillStyle = '#1d5e87';
      ctx.fillRect(0, 0, 32, 32);
      // 木桥板
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(4, 0, 24, 32);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(6, 0, 2, 32);
      ctx.fillRect(24, 0, 2, 32);
      // 桥板横纹
      ctx.fillStyle = '#3e2723';
      for (let y = 3; y < 32; y += 6) {
        ctx.fillRect(6, y, 20, 1);
      }
      break;

    case TerrainType.Castle:
    case TerrainType.Fort:
    case TerrainType.Gate:
      ctx.fillStyle = '#424242';
      ctx.fillRect(0, 0, 32, 32);
      // 城墙青砖
      ctx.fillStyle = '#616161';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#212121';
      ctx.fillRect(0, 10, 32, 2);
      ctx.fillRect(0, 20, 32, 2);
      ctx.fillRect(14, 0, 2, 10);
      ctx.fillRect(8, 10, 2, 10);
      ctx.fillRect(22, 10, 2, 10);
      // 箭垛
      ctx.fillStyle = '#9e9e9e';
      ctx.fillRect(3, 2, 6, 6);
      ctx.fillRect(23, 2, 6, 6);
      // 战旗
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(12, 5, 9, 6);
      ctx.fillStyle = '#171717';
      ctx.fillRect(10, 3, 2, 15);
      break;

    case TerrainType.Village:
      ctx.fillStyle = '#6b9a24';
      ctx.fillRect(0, 0, 32, 32);
      // 茅草汉舍
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(4, 12, 24, 16);
      ctx.fillStyle = '#a1887f';
      ctx.fillRect(8, 6, 16, 6);
      ctx.fillStyle = '#bcaaa4';
      ctx.fillRect(12, 2, 8, 4);
      // 门扉
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(12, 20, 8, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 15, 4, 4);
      ctx.fillRect(22, 15, 4, 4);
      break;

    case TerrainType.Throne:
      ctx.fillStyle = '#4a044e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(2, 2, 28, 28);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(5, 5, 22, 22);
      // 龙椅
      ctx.fillStyle = '#eab308';
      ctx.fillRect(10, 8, 12, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(12, 10, 8, 8);
      break;

    case TerrainType.Desert:
      ctx.fillStyle = '#d4a34b';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#b98730';
      ctx.fillRect(4, 12, 16, 4);
      ctx.fillRect(12, 24, 16, 4);
      break;

    case TerrainType.Snow:
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(4, 6, 12, 6);
      ctx.fillRect(16, 18, 12, 6);
      break;

    case TerrainType.Fire:
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(4, 4, 24, 24);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 8, 16, 16);
      break;

    default:
      ctx.fillStyle = '#404040';
      ctx.fillRect(0, 0, 32, 32);
      break;
  }

  // 棋盘微弱线
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.strokeRect(0, 0, 32, 32);

  const dataUrl = canvas.toDataURL('image/png');
  mapTileCache.set(terrain, dataUrl);
  return dataUrl;
}

/**
 * 绘制地图 32x32 兵种小人 (带呼吸待机帧)
 */
export function getUnitSpriteUrl(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
): string {
  let unitClass: UnitClass = UnitClass.Lord;
  let faction: Faction = Faction.Player;
  let frame: number = 0;
  let hasActed: boolean = false;

  if (typeof arg2 === 'string' && Object.values(Faction).includes(arg2 as Faction)) {
    unitClass = arg1 as UnitClass;
    faction = arg2 as Faction;
    frame = typeof arg3 === 'number' ? arg3 : 0;
    hasActed = Boolean(arg4);
  } else if (typeof arg3 === 'string' && Object.values(Faction).includes(arg3 as Faction)) {
    unitClass = arg2 as UnitClass;
    faction = arg3 as Faction;
    frame = typeof arg4 === 'number' ? arg4 : 0;
  } else {
    unitClass = (arg1 as UnitClass) || UnitClass.Lord;
    faction = (arg2 as Faction) || Faction.Player;
    frame = typeof arg3 === 'number' ? arg3 : 0;
  }

  const cacheKey = `${unitClass}_${faction}_${frame}_${hasActed}`;
  if (unitSpriteCache.has(cacheKey)) {
    return unitSpriteCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  const bounce = frame % 2 === 1 ? -1 : 0;

  // 阵营着色 (我方蓝绿汉服、敌方赤红重铠、友方草绿、待机灰色)
  let mainColor = '#1d4ed8';
  let darkColor = '#1e3a8a';
  let lightColor = '#93c5fd';

  if (hasActed) {
    mainColor = '#64748b';
    darkColor = '#334155';
    lightColor = '#cbd5e1';
  } else if (faction === Faction.Enemy) {
    mainColor = '#dc2626';
    darkColor = '#991b1b';
    lightColor = '#fca5a5';
  } else if (faction === Faction.Ally) {
    mainColor = '#16a34a';
    darkColor = '#166534';
    lightColor = '#86efac';
  }

  const baseY = 8 + bounce;

  switch (unitClass) {
    case UnitClass.Lord:
    case UnitClass.GreatLord:
    case UnitClass.Myrmidon:
    case UnitClass.Swordmaster:
      // 剑圣/英杰：汉末佩剑儒将
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(13, baseY, 6, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, baseY - 3, 8, 4); // 束发冠
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(11, baseY + 1, 10, 2); // 赤红头巾
      // 战袍
      ctx.fillStyle = mainColor;
      ctx.fillRect(11, baseY + 6, 10, 8);
      // 披风
      ctx.fillStyle = darkColor;
      ctx.fillRect(8, baseY + 8, 3, 7);
      // 汉剑
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(22, baseY + 2, 2, 11);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(20, baseY + 9, 6, 2); // 剑格
      // 战靴
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, baseY + 14, 3, 6);
      ctx.fillRect(17, baseY + 14, 3, 6);
      break;

    case UnitClass.Cavalier:
    case UnitClass.Paladin:
      // 铁骑：战马与长矛
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, baseY + 8, 18, 10);
      ctx.fillRect(20, baseY + 4, 8, 8); // 马首
      ctx.fillStyle = '#451a03';
      ctx.fillRect(24, baseY + 2, 3, 4);
      // 马腿
      ctx.fillStyle = '#451a03';
      ctx.fillRect(7, baseY + 18, 3, 5);
      ctx.fillRect(12, baseY + 18, 3, 5);
      ctx.fillRect(19, baseY + 18, 3, 5);
      // 骑将头盔与胸甲
      ctx.fillStyle = lightColor;
      ctx.fillRect(11, baseY - 2, 7, 6);
      ctx.fillStyle = mainColor;
      ctx.fillRect(10, baseY + 4, 9, 6);
      // 丈八长矛 / 青龙戟
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(20, baseY - 4, 2, 16);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(19, baseY + 1, 4, 2); // 红缨
      break;

    case UnitClass.Knight:
    case UnitClass.General:
      // 虎卫重步兵：巨盾与面甲
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, baseY - 2, 12, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, baseY + 2, 8, 2);
      ctx.fillStyle = mainColor;
      ctx.fillRect(8, baseY + 6, 16, 11);
      // 巨盾
      ctx.fillStyle = darkColor;
      ctx.fillRect(4, baseY + 4, 5, 14);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(5, baseY + 8, 3, 6);
      // 钢枪
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(24, baseY + 2, 2, 14);
      // 重靴
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, baseY + 17, 4, 4);
      ctx.fillRect(18, baseY + 17, 4, 4);
      break;

    case UnitClass.Fighter:
    case UnitClass.Warrior:
      // 猛士：狂野体魄与宣花大斧
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(12, baseY, 8, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(11, baseY - 2, 10, 4);
      ctx.fillStyle = mainColor;
      ctx.fillRect(10, baseY + 6, 12, 8);
      // 战斧
      ctx.fillStyle = '#78350f';
      ctx.fillRect(22, baseY + 2, 2, 13);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(20, baseY + 3, 6, 5);
      // 腿
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, baseY + 14, 4, 6);
      ctx.fillRect(17, baseY + 14, 4, 6);
      break;

    case UnitClass.Archer:
    case UnitClass.Sniper:
      // 神射手：落日神弓
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(13, baseY, 6, 6);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(12, baseY - 2, 8, 4);
      ctx.fillStyle = mainColor;
      ctx.fillRect(11, baseY + 6, 10, 8);
      // 雕弓
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(24, baseY + 9, 7, -Math.PI / 2, Math.PI / 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#451a03';
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, baseY + 14, 3, 6);
      ctx.fillRect(17, baseY + 14, 3, 6);
      break;

    case UnitClass.Mage:
    case UnitClass.Sage:
    case UnitClass.Tactician:
      // 军师：纶巾羽扇
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(13, baseY, 6, 6);
      ctx.fillStyle = darkColor;
      ctx.fillRect(10, baseY - 4, 12, 6); // 智者纶巾
      ctx.fillStyle = mainColor;
      ctx.fillRect(10, baseY + 6, 12, 13);
      // 白羽扇
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(21, baseY + 5, 6, 6);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(10, baseY + 17, 12, 2);
      break;

    case UnitClass.Cleric:
    case UnitClass.Bishop:
      // 医官：仙草与治愈杖
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(13, baseY, 6, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(10, baseY + 6, 12, 13);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(23, baseY, 2, 18);
      ctx.beginPath();
      ctx.arc(24, baseY + 1, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      break;

    default:
      ctx.fillStyle = mainColor;
      ctx.fillRect(11, baseY + 4, 10, 12);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(13, baseY - 2, 6, 6);
      break;
  }

  const dataUrl = canvas.toDataURL('image/png');
  unitSpriteCache.set(cacheKey, dataUrl);
  return dataUrl;
}
