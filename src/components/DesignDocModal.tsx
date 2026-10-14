/**
 * 三国志·烈火之誓 - 游戏策划设计全案与通关攻略文档 (Game Design Document & Guide)
 * 涵盖数值公式、数据结构、30大关卡详表、隐藏要素触发机制与神将收服条件
 */

import React, { useState } from 'react';

interface DesignDocModalProps {
  onClose: () => void;
}

export const DesignDocModal: React.FC<DesignDocModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const markdownContent = `# 《三国志·烈火之誓》全量策划设计文档与通关白皮书

## 一、 核心玩法与系统设计说明（对标 GBA 火焰纹章原版数值）

### 1. 武器三角相克系统 (Weapon Triangle System)
- **物理三角**：剑 > 斧 > 枪 > 剑
  * 优势方：攻击力 +1，命中率 +15%
  * 劣势方：攻击力 -1，命中率 -15%
- **魔法三角**：理 > 光 > 暗 > 理
  * 优势方：攻击力 +1，命中率 +15%
  * 劣势方：攻击力 -1，命中率 -15%
- **弓箭与杖**：处于相克体系之外，弓箭对飞行兵种享有3倍武器威力（Might × 3）特攻；杖用于战地救治与状态驱散。

### 2. 攻防核心公式 (Combat Numerical Formulas)
- **攻击速度 (AS)**：
  \`AS = 速度 - max(0, 武器重量 - 体格)\`
- **追击判定 (Pursuit / Follow-up Attack)**：
  攻速差 \`ΔAS ≥ 4\` 时，高速方触发第二次追击攻击！
- **回避率 (Avoid)**：
  \`回避 = 攻速 × 2 + 幸运 + 地形回避\`
- **命中率 (Hit Rate)**：
  \`最终命中 = 武器命中 + 技巧 × 2 + 幸运 / 2 + 三角补正 - 敌方回避\`
- **必杀率 (Critical Rate)**：
  \`必杀 = 武器必杀 + 技巧 / 2 - 敌方幸运\`（必杀发动造成 3 倍总伤害）
- **伤害计算 (Damage)**：
  \`物理伤害 = 力量 + 武器威力(特攻×3) + 三角补正 - 敌方守备 - 地形防守\`
  \`魔法伤害 = 魔力 + 魔法威力 + 三角补正 - 敌方魔防 - 地形防守\`

### 3. 经验与升级摇点系统 (EXP & Level Up)
- 每次交战造成伤害基础获得 \`10 + (敌Lv - 自Lv)×2\` 经验。
- 击破敌军斩获击杀加成 \`30 + (敌Lv - 自Lv)×4 + Boss加成(40)\`。
- 每满 100 EXP 升级，各属性根据成长率（0%~100%+）执行随机摇点。

---

## 二、 30 大战役关卡全景配置表 (25 主线 + 5 隐藏)

### 【第一章：黄巾起义】
- **1-1 涿县募兵**：平原/桥梁战，敌全灭。教学武器三角与移动走位。
- **1-2 黄巾来袭**：坚守营地 6 回合。教学森林/要塞地形回避加成与恢复。
- **1-3 广宗城外**：击破首个重甲 Boss 高升，护城河架桥强攻。
- **1-4 夜袭粮仓**：制压关卡，教学隐藏村庄访问与转职道具《英雄之证》。
- **1-5 黄巾主力决战**：Boss 张角登场，风雷法坛妖术对决。

### 【第二章：群雄逐鹿】
- **2-1 虎牢关前**：天下无双吕布登场！坚持 6 回合不可冒进强攻。
- **2-2 界桥之战**：赵云加入！骑兵与神射手跨河穿插。
- **2-3 宛城之夜**：夜间火攻突围，贾诩伏兵，护送全员撤离东门。
- **2-4 下邳围城**：决水淹城，浅水阻滞骑兵，步兵云梯制压。
- **2-5 白门楼**：飞将吕布败亡之役，击破吕布完成第二章收尾。

### 【第三章：赤壁之战】
- **3-1 长坂坡**：赵子龙单骑护幼主，张翼德当阳桥断喝退追兵。
- **3-2 江夏集结**：卧龙诸葛亮正式拜军师入阵，扫荡魏军探马。
- **3-3 舌战群儒**：柴桑大营群儒舌战，以法系智慧击破东吴主和派。
- **3-4 草船借箭**：浓雾天气江上借箭，回避乱箭诱敌。
- **3-5 火烧赤壁**：火攻地图事件，铁索连环火海突击，决战魏武帝曹操。

### 【第四章：三足鼎立】
- **4-1 荆州争夺**：三方势力混战，夺取战略枢纽南郡城。
- **4-2 汉中攻防**：定军山高山险隘，黄汉升神弓斩敌，坚守 6 回合。
- **4-3 合肥之战**：威震逍遥津！全面强化的战神张辽死守要冲。
- **4-4 夷陵之火**：陆逊火烧连营，避开火海迷阵撤往白帝城。
- **4-5 白帝城托孤**：先主托孤遗志，阻击朱然追军，汉室义气相传。

### 【第五章：三分归一】
- **5-1 剑阁天险**：蜀道难于上青天，一夫当关狭道制压战。
- **5-2 邓艾偷渡**：阴平绝壁滚毡奇兵从后方袭来，回身防守营寨。
- **5-3 成都攻防**：多波晋魏中军狂攻，城门全歼敌军。
- **5-4 最后的名将**：决战洛阳雄关，突破荆州名帅羊祜防线。
- **5-5 天下归一**：皇宫大殿终焉决战！玄冥化身司马懿多阶段决斗，海内一统！

---

## 三、 5 大隐藏关卡触发条件与限定神将收服攻略

1. **隐藏关 1「太平要术」**
   - **进入条件**：1-4 访问西北隐秘村庄，且 1-5 决战无任何我方阵亡。
   - **专属奖励**：击败幻影天公获得《大师之证》；5回合内访问草庐收服隐藏绝代角色【貂蝉】。

2. **隐藏关 2「辕门射戟」**
   - **进入条件**：2-3 宛城之夜全员生还 + 2-5 白门楼用刘备或少主完成击破。
   - **专属奖励**：与天下第一武将单挑胜出后，【吕布】（专属神兵方天画戟）诚心加入我军队伍！

3. **隐藏关 3「借东风」**
   - **进入条件**：3-4 撑满回合且 3-5 在 8 回合以内速破曹操大阵。
   - **专属奖励**：七星坛神仙关，解锁诸葛亮隐藏绝技，神医【华佗】加入，解锁全图治疗圣术！

4. **隐藏关 4「五丈原」**
   - **进入条件**：4-3 用关羽击破张辽 + 4-5 与诸葛亮达成 B 级以上支援。
   - **专属奖励**：七星灯续命改命，乌角道人【左慈】加入军中，掌握阴阳玄冥道术！

5. **最终隐藏关「英灵殿」**
   - **进入条件**：收齐上述 4 位隐藏角色 + 主线零死亡通关 5-5。
   - **挑战内容**：穿越古今与关羽、赵云、吕布等武圣始祖神将英灵切磋！达成真·万民归一大团圆结局！
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="design-doc-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="gba-window w-full max-w-4xl p-5 rounded-md border-2 border-amber-400 max-h-[88vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-amber-500/40 mb-3">
          <div>
            <h2 className="text-xl font-bold text-amber-300 pixel-font">
              《三国志·烈火之誓》全案设计书与战役白皮书
            </h2>
            <p className="text-xs text-stone-400">完整记录火纹核心数值法则、30 关战役配置与隐藏名将攻略</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 text-xs font-bold rounded cursor-pointer"
            >
              {copied ? '✓ 已复制 Markdown' : '复制全案文档'}
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 text-sm font-bold cursor-pointer"
            >
              ✕ 关闭
            </button>
          </div>
        </div>

        {/* 滚动阅读区 */}
        <div className="flex-1 overflow-y-auto pr-3 gba-scroll text-stone-200 text-xs md:text-sm leading-relaxed space-y-4 font-sans bg-stone-950/60 p-4 rounded border border-stone-800">
          <section>
            <h3 className="text-base font-bold text-amber-300 border-b border-amber-500/30 pb-1 mb-2">
              一、 核心系统数值设计（对标 GBA 火焰纹章原版）
            </h3>
            <ul className="list-disc list-inside space-y-1 text-stone-300">
              <li><strong className="text-amber-200">武器三角相克</strong>：剑 &gt; 斧 &gt; 枪 &gt; 剑；理 &gt; 光 &gt; 暗 &gt; 理。优势方 +1 攻击、+15% 命中；劣势方 -1 攻击、-15% 命中。</li>
              <li><strong className="text-amber-200">攻速追击</strong>：攻速 = 速度 - max(0, 武器重量 - 体格)。攻速差 ≥ 4 时触发追击二连击！</li>
              <li><strong className="text-amber-200">命中与回避</strong>：回避 = 攻速×2 + 幸运 + 地形回避；最终命中 = 武器命中 + 技×2 + 运/2 + 三角加成 - 敌回避。</li>
              <li><strong className="text-amber-200">必杀暴击</strong>：必杀率 = 武器必杀 + 技巧/2 - 敌方幸运。触发暴击造成 300% 致命伤害！</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-amber-300 border-b border-amber-500/30 pb-1 mb-2">
              二、 30 大关卡完整编年史 (25 主线 + 5 隐藏关)
            </h3>
            <p className="text-stone-400 mb-2">包含第一章黄巾起义、第二章群雄逐鹿、第三章赤壁之战、第四章三足鼎立、第五章三分归一，以及 5 个极具深度的隐藏关。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-stone-900 rounded border border-stone-800">
                <span className="font-bold text-amber-400">第一章 (1-1 至 1-5):</span> 涿县募兵、黄巾来袭、广宗城外、夜袭粮仓、黄巾主力决战。
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-800">
                <span className="font-bold text-amber-400">第二章 (2-1 至 2-5):</span> 虎牢关前、界桥之战、宛城之夜、下邳围城、白门楼。
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-800">
                <span className="font-bold text-amber-400">第三章 (3-1 至 3-5):</span> 长坂坡、江夏集结、舌战群儒、草船借箭、火烧赤壁。
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-800">
                <span className="font-bold text-amber-400">第四章 (4-1 至 4-5):</span> 荆州争夺、汉中攻防、合肥之战、夷陵之火、白帝城托孤。
              </div>
              <div className="p-2 bg-stone-900 rounded border border-stone-800">
                <span className="font-bold text-amber-400">第五章 (5-1 至 5-5):</span> 剑阁天险、邓艾偷渡、成都攻防、最后的名将、天下归一。
              </div>
              <div className="p-2 bg-red-950/60 rounded border border-red-800">
                <span className="font-bold text-red-300">5 大隐藏秘境:</span> 太平要术 (貂蝉)、辕门射戟 (吕布单挑加入)、借东风 (华佗)、五丈原 (左慈)、英灵殿 (全英雄终极对决)。
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-amber-300 border-b border-amber-500/30 pb-1 mb-2">
              三、 隐藏角色加入与真结局条件
            </h3>
            <ul className="list-disc list-inside space-y-1 text-stone-300">
              <li><strong className="text-amber-200">貂蝉</strong>：在隐藏关 1「太平要术」访问深处草庐即可加入，擅长鼓舞与连环之策。</li>
              <li><strong className="text-amber-200">吕布</strong>：在隐藏关 2「辕门射戟」完成一对一比武单挑获胜，温侯飞将归心。</li>
              <li><strong className="text-amber-200">华佗</strong>：在隐藏关 3「借东风」中登场，提供全地图治愈圣术。</li>
              <li><strong className="text-amber-200">左慈</strong>：在隐藏关 4「五丈原」七星续命成功后加入，掌握极高魔法奥义。</li>
              <li><strong className="text-amber-200">真结局</strong>：全隐藏角色齐聚，通关最终隐藏关「英灵殿」，解锁万民安居、四海升平之旷世真结局！</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
