/** 游戏内说明与复制文本使用同一份规则、战役和军职数据。 */
import React, { useState } from 'react';
import { ALL_STAGES } from '../data/stagesData';
import { MILITARY_RANKS } from '../data/campaignData';

const RULES = [
  ['玄霄入世', '玩家扮演从未来穿越到东汉末年的玄霄，携带便携脉冲枪、纳米急救包和战术终端。初始没有任何下属，随刘备义军起步，帮助其逐鹿三国。'],
  ['可控范围', '蓝色单位为玄霄及直属部队，可移动、攻击、使用道具、访问村庄与制压据点。绿色历史名将在友军阶段自主行动，保有自身阵营与军令。回合顺序：玄霄军→友军→敌军。'],
  ['科技与限制', '脉冲枪射程1—2格，每战30发；纳米急救包自疗15点，每战3次。终端每战6点能量：纳米急救治疗三格内己方或友军15点，脉冲压制对三格内敌军造成8点伤害；每次均耗2能量和玄霄的一次行动。科技无法复活人物或无限复制军械。'],
  ['战功与部曲', '每关首次完成获得100—200战功与1500军资，军职按累计战功自动晋升。晋升开放直属部队名额，再花军资招揽长枪队、弓弩队或刀盾队。名将不进入直属编制。'],
  ['任务与历史', '主线按《三国演义》编排，玄霄负责护民、阻援、断后等局部任务。关羽斩华雄、三英战吕布、赵云救主、周瑜赤壁火攻等功业归于原人物。麦城与夷陵任务完成只代表撤离成功。'],
  ['人物命运与结局', '保留吕布白门楼遇害、关羽败走麦城、张飞遇害、夷陵大败、白帝托孤、诸葛亮五丈原病逝。没有吕布归顺、七星灯续命或蜀汉统一分支。征程之后以蜀汉亡、魏为晋代、吴降及三分归晋收束。'],
  ['战损与存档', '玄霄倒下即任务失败，可重试整备起点。经典模式下直属部队阵亡后在战后移出，轻松模式下战后恢复。历史友军重伤只撤出本关，后续出场依演义时序。存档记录整备起点、战功、军资、直属部队与已完成任务，读取后重新部署。'],
  ['战棋规则', '保留剑克斧、斧克枪、枪克剑，以及攻速差达到4时追击的规则。脉冲枪沿用远程伤害计算，不参与近战武器相克。胜利目标以每关任务说明为准。'],
] as const;

export const DesignDocModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const markdown = [
    '# 三国志·烈火之誓：玄霄征程',
    ...RULES.map(([title, description]) => `## ${title}\n\n${description}`),
    '## 战功军职\n\n' + MILITARY_RANKS.map((rank) => `- ${rank.name}：${rank.merit}战功，${rank.capacity}支直属部队`).join('\n'),
    '## 战役任务\n\n' + ALL_STAGES.map((stage) => `### ${stage.title} · ${stage.subtitle}\n\n${stage.description}\n\n任务：${stage.objective}\n\n演义主线：${stage.historicalNote}`).join('\n\n'),
    '## 参考\n\n《三国演义》毛宗岗本：https://zh.wikisource.org/zh-hans/三國演義',
  ].join('\n\n');
  return (
    <div id="design-doc-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="gba-window w-full max-w-4xl p-5 border-2 border-amber-400 rounded max-h-[88vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-amber-300">玄霄征程 · 背景与玩法</h2>
          <div className="flex gap-3 text-xs">
            <button className="gba-btn px-3 py-2 cursor-pointer" onClick={async () => { await navigator.clipboard.writeText(markdown); setCopied(true); }}>{copied ? '已复制' : '复制说明'}</button>
            <button className="cursor-pointer" onClick={onClose}>关闭</button>
          </div>
        </div>
        <div className="overflow-y-auto gba-scroll space-y-5 text-sm leading-relaxed">
          {RULES.map(([title, description]) => <section key={title}><h3 className="text-amber-300 font-bold mb-1">{title}</h3><p className="text-stone-300">{description}</p></section>)}
          <section><h3 className="text-amber-300 font-bold mb-2">战功军职</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{MILITARY_RANKS.map((rank) => <div key={rank.name} className="p-2 bg-stone-900 rounded text-xs">{rank.name} · {rank.merit}战功 · {rank.capacity}支部队</div>)}</div></section>
          <section><h3 className="text-amber-300 font-bold mb-2">25场战役任务</h3><div className="space-y-2">{ALL_STAGES.map((stage) => <div key={stage.id} className="p-3 bg-stone-900 rounded border border-stone-700"><p className="text-amber-200 font-bold">{stage.title} · {stage.subtitle}</p><p className="text-xs text-cyan-200">{stage.objective}</p><p className="text-xs text-stone-400">{stage.historicalNote}</p></div>)}</div></section>
          <p className="text-xs text-stone-400">主线参考：<a href="https://zh.wikisource.org/zh-hans/三國演義" target="_blank" rel="noreferrer" className="text-amber-300 underline">《三国演义》毛宗岗本</a>。剧情对话为游戏改编。</p>
        </div>
      </div>
    </div>
  );
};
