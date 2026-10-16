/** 按《三国演义》编排的25场局部任务；通关不会改写历史战役结局。 */
import { DialogueLine, Faction, StageConfig, TerrainType, Unit, UnitClass, VictoryCondition, WeaponType, WeaponRank } from '../types';
import { createBaseUnit, createHistoricalAlly } from './charactersData';

type Episode = {
  subtitle: string; description: string; historicalNote: string;
  allies: string[]; enemy: string; condition: VictoryCondition;
  landscape: 'field' | 'river' | 'fort' | 'fire';
  before: [string, string, string][]; after: [string, string, string][];
};
const { Rout, Survive, Seize, Escape } = VictoryCondition;

export const CAMPAIGN_EPISODES: Episode[] = [
  {
    subtitle: '涿郡破贼', description: '未来穿越者玄霄独自携科技装备，协助刘关张击退黄巾前锋。',
    historicalNote: '桃园结义仍为刘关张三人；邓茂、程远志分别败于张飞、关羽。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '黄巾', condition: Rout, landscape: 'field',
    before: [['protagonist', '玄霄', '终端显示：东汉末年。我竟从未来来到了三国！眼下只有我一人，电量也有限，先用脉冲枪护住村民。'], ['liubei', '刘备', '备与关张二弟已结兄弟，愿救百姓于水火。壮士若有此心，便与义军同行。'], ['guanyu', '关羽', '前锋交予我兄弟。玄霄护住侧翼，莫令贼兵冲散百姓。']],
    after: [['zhangfei', '张飞', '邓茂已被俺挑落，二哥也斩了程远志！你那奇巧器械护人倒有用。'], ['liubei', '刘备', '玄霄护民有功，记入功簿。日后论功授职，方可自领部曲。']],
  },
  {
    subtitle: '青州解围', description: '随刘备救援青州，守住粮道六回合。', historicalNote: '刘备义军应邹靖之请救青州、解龚景之围；玄霄负责粮道。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '黄巾', condition: Survive, landscape: 'field',
    before: [['liubei', '刘备', '青州告急。我领义军破围，粮道托付于你。'], ['protagonist', '玄霄', '我带直属部队守路，终端可为三格内的友军提供纳米急救。']],
    after: [['liubei', '刘备', '城围已解。军粮未失，百姓得全，皆诸位之功。']],
  },
  {
    subtitle: '广宗救援', description: '广宗官军败退，守住渡口六回合，掩护伤兵。', historicalNote: '刘备救董卓而不受礼遇；张角病亡的主线保留。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '黄巾', condition: Survive, landscape: 'river',
    before: [['zhangfei', '张飞', '官军被贼兵追得紧！先救下来再说！'], ['liubei', '刘备', '救人岂问贵贱。玄霄，守桥接应伤兵。']],
    after: [['zhangfei', '张飞', '那董卓听说俺们无官，竟这般无礼！'], ['liubei', '刘备', '不可因一人轻慢便失救民之心。另投朱儁将军，继续讨贼。']],
  },
  {
    subtitle: '阳城追击', description: '在朱儁军中协助刘备追击张宝残部，占领外围营寨。', historicalNote: '张角病死，张宝终为部将所杀；不由玄霄取代关键人物。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '黄巾', condition: Seize, landscape: 'fort',
    before: [['liubei', '刘备', '贼势虽衰，余众尚据营垒。你取外围营寨，我军进逼阳城。']],
    after: [['protagonist', '玄霄', '张角病亡，张宝亦为部下所杀。外围营寨已定，黄巾余乱却尚未尽平。']],
  },
  {
    subtitle: '汜水关援战', description: '诸侯起兵讨董，协助守住盟军侧翼补给线。', historicalNote: '关羽温酒斩华雄；玄霄仅击退侧翼西凉兵。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '西凉', condition: Rout, landscape: 'fort',
    before: [['guanyu', '关羽', '华雄逞凶，某愿往取其首级。'], ['protagonist', '玄霄', '关将军自有决断。我守住侧翼，护盟军伤兵撤回。']],
    after: [['liubei', '刘备', '云长已斩华雄。侧翼亦定，当随诸侯进向虎牢。']],
  },
  {
    subtitle: '虎牢关前', description: '三英战吕布之际，坚守盟军后路六回合。', historicalNote: '三英战吕布后董卓迁都；吕布不会归顺玄霄。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '西凉', condition: Survive, landscape: 'fort',
    before: [['zhangfei', '张飞', '三姓家奴休走！燕人张翼德在此！'], ['protagonist', '玄霄', '三位将军已出阵。我守后路，不能让西凉骑兵包抄。']],
    after: [['liubei', '刘备', '吕布退回关内，董卓将西迁。诸侯各怀心思，天下未能就此太平。']],
  },
  {
    subtitle: '界桥相援', description: '随刘备支援公孙瓒，与初遇的赵云协同阻击袁军。', historicalNote: '赵云此时仍属公孙瓒；相识不等于加入玄霄直属编制。',
    allies: ['liubei', 'guanyu', 'zhaoyun'], enemy: '袁军', condition: Rout, landscape: 'river',
    before: [['zhaoyun', '赵云', '某乃常山赵子龙，今助公孙将军御敌！'], ['liubei', '刘备', '子龙忠勇，备心甚敬。先救眼前危局。']],
    after: [['zhaoyun', '赵云', '玄德公仁义，云铭记于心。眼下仍须回公孙将军军中复命。']],
  },
  {
    subtitle: '徐州救援', description: '曹军逼近徐州，协助刘备打通陶谦军民的补给道路。', historicalNote: '刘备救徐州，后受陶谦让州；玄霄不取代州牧身份。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '曹军', condition: Seize, landscape: 'field',
    before: [['liubei', '刘备', '徐州百姓有难，纵兵少亦当救。玄霄，先打通粮路。']],
    after: [['liubei', '刘备', '道路既通，军民可得接济。此后州事，当以百姓安危为先。']],
  },
  {
    subtitle: '下邳围城', description: '刘备与曹军共同围下邳，夺取城外据点。', historicalNote: '水淹下邳、吕布失众；保留曹刘合作围城的背景。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '吕布军', condition: Seize, landscape: 'river',
    before: [['guanyu', '关羽', '下邳水涨，不可深入孤地。取桥头据点，与主力相应。']],
    after: [['protagonist', '玄霄', '城外据点已取。吕布军心离散，白门楼的结局正在逼近。']],
  },
  {
    subtitle: '白门楼', description: '封锁下邳残军退路，配合主力完成围城。', historicalNote: '吕布被擒后由曹操处死；没有招降吕布分支。',
    allies: ['liubei', 'guanyu', 'zhangfei'], enemy: '吕布军', condition: Rout, landscape: 'fort',
    before: [['liubei', '刘备', '城中军心已散，守好退路，切勿扰民。']],
    after: [['protagonist', '玄霄', '吕布被擒，曹操终将其处死。手中的科技能救局部危难，却不能令所有英雄改换归宿。']],
  },
  {
    subtitle: '博望坡伏击', description: '孔明出山初次用兵，玄霄奉命截断侧翼追兵。', historicalNote: '三顾茅庐在前，火烧博望在后；计谋归于诸葛亮。',
    allies: ['liubei', 'zhaoyun', 'zhangfei'], enemy: '曹军', condition: Rout, landscape: 'fire',
    before: [['liubei', '刘备', '备三顾茅庐，得孔明先生相助。今军中当听军师号令。'], ['protagonist', '玄霄', '我按部署截住侧翼，终端只用来确认伏兵位置。']],
    after: [['zhaoyun', '赵云', '诱敌之计已成，曹军败退。军师用兵，果然高明。']],
  },
  {
    subtitle: '新野撤离', description: '掩护军民离开新野，玄霄抵达东面撤离点。', historicalNote: '火烧新野、刘备携民渡江；撤离不等于击败曹操主力。',
    allies: ['liubei', 'zhaoyun', 'sunqian'], enemy: '曹军', condition: Escape, landscape: 'fire',
    before: [['liubei', '刘备', '百姓相随，备何忍弃之！先护他们离城。'], ['protagonist', '玄霄', '我负责断后，通路安全后便到东面会合。']],
    after: [['liubei', '刘备', '离开新野，仍须南行。莫使老弱掉队。']],
  },
  {
    subtitle: '长坂坡', description: '赵云救主、张飞据桥，玄霄守住另一渡口六回合。', historicalNote: '赵云救阿斗、张飞喝断当阳桥；玄霄不取代二人功业。',
    allies: ['zhaoyun', 'zhangfei', 'sunqian'], enemy: '曹军', condition: Survive, landscape: 'river',
    before: [['zhaoyun', '赵云', '幼主尚在乱军之中，云当回身寻救！'], ['zhangfei', '张飞', '我乃燕人张翼德也！谁敢与我决一死战！'], ['protagonist', '玄霄', '我守另一渡口，接应伤员，给两位将军留出时间。']],
    after: [['zhaoyun', '赵云', '幼主已救出，当阳桥头追兵亦止。快往江夏会合！']],
  },
  {
    subtitle: '草船借箭', description: '孔明促成孙刘联盟后，玄霄守卫江岸接应点六回合。', historicalNote: '舌战群儒属于外交，不化为攻击东吴谋士的战斗；借箭仍为孔明之计。',
    allies: ['zhugeliang', 'zhaoyun'], enemy: '曹军', condition: Survive, landscape: 'river',
    before: [['zhugeliang', '诸葛亮', '孙刘已议定拒曹。今夜雾重，亮自有借箭之法；你且护好接应处。'], ['protagonist', '玄霄', '我用终端观测江岸，免得惊动曹营，坏了军师的计策。']],
    after: [['zhugeliang', '诸葛亮', '箭已足数，周都督可备火攻。往后行事，更须谨慎。']],
  },
  {
    subtitle: '火烧赤壁', description: '周瑜统筹、黄盖火攻，玄霄协助夺取岸边营垒。', historicalNote: '赤壁是孙刘联军之功；曹操败走华容道，关羽念旧放行。',
    allies: ['zhouyu', 'zhugeliang', 'zhaoyun'], enemy: '曹军', condition: Seize, landscape: 'fire',
    before: [['zhouyu', '周瑜', '诸军各守号令，待黄公覆举火，便一齐进兵！'], ['protagonist', '玄霄', '我清除岸边据点，为联军接应，火攻仍依都督部署。']],
    after: [['protagonist', '玄霄', '赤壁大捷，曹操败走。华容道上关羽念旧放行，三分之势由此渐成。']],
  },
  {
    subtitle: '荆南平定', description: '协助安定荆南，清除城外阻路兵卒。', historicalNote: '关羽战黄忠、魏延献长沙；黄忠魏延归刘备，不归玄霄直属。',
    allies: ['liubei', 'guanyu', 'zhaoyun'], enemy: '荆南', condition: Rout, landscape: 'field',
    before: [['guanyu', '关羽', '黄汉升老而弥坚，某自往会他。你护好城外百姓。']],
    after: [['liubei', '刘备', '得黄忠、魏延相助，荆南可定。务要安民，休使军士侵扰。']],
  },
  {
    subtitle: '葭萌关', description: '协助张飞守关六回合，等待局势明朗。', historicalNote: '张飞战马超；马超经劝说归刘备，不因被玄霄击败而入队。',
    allies: ['liubei', 'zhangfei', 'huangzhong'], enemy: '汉中', condition: Survive, landscape: 'fort',
    before: [['zhangfei', '张飞', '马孟起的枪，俺倒要领教！玄霄，替俺守稳关口。']],
    after: [['liubei', '刘备', '孟起愿相助，益州局势可望平定。日后当以诚相待。']],
  },
  {
    subtitle: '成都受降', description: '稳住外围营垒，清除不肯停战的散兵。', historicalNote: '刘璋出降、刘备入主益州；不要求攻杀刘璋。',
    allies: ['liubei', 'zhaoyun', 'machao'], enemy: '益州', condition: Seize, landscape: 'fort',
    before: [['liubei', '刘备', '益州百姓久困兵戈。取外围营垒即可，不得擅攻城中。']],
    after: [['zhaoyun', '赵云', '刘璋已出降。益州初定，田宅应还百姓，使其安业。']],
  },
  {
    subtitle: '定军山', description: '黄忠与法正谋取定军山，玄霄阻断援军道路。', historicalNote: '夏侯渊为黄忠所斩；玄霄只负责侧翼阻援。',
    allies: ['huangzhong', 'zhaoyun', 'weiyan'], enemy: '曹军', condition: Rout, landscape: 'field',
    before: [['huangzhong', '黄忠', '老夫尚能杀敌！待法孝直示意，自当直取敌将。'], ['protagonist', '玄霄', '援军交给我，绝不抢动老将军的战机。']],
    after: [['huangzhong', '黄忠', '夏侯渊已授首，定军山归我军！速报主公！']],
  },
  {
    subtitle: '汉水之战', description: '配合赵云据营退敌，坚守汉水粮道六回合。', historicalNote: '赵云一身是胆、刘备进位汉中王；不提前写成统一天下。',
    allies: ['liubei', 'zhaoyun', 'huangzhong'], enemy: '曹军', condition: Survive, landscape: 'river',
    before: [['zhaoyun', '赵云', '开营门，偃旗息鼓！敌军疑惧，自不敢轻进。'], ['protagonist', '玄霄', '我守侧翼渡口，待将军发令再出击。']],
    after: [['liubei', '刘备', '子龙一身都是胆！汉中既得，仍不可忘荆州与百姓。']],
  },
  {
    subtitle: '襄樊支援', description: '关羽围樊城，玄霄保护后方军粮与伤员通道。', historicalNote: '关羽水淹七军后东吴袭荆州；局部胜利不逆转荆州失守。',
    allies: ['guanyu', 'sunqian'], enemy: '曹军', condition: Rout, landscape: 'river',
    before: [['guanyu', '关羽', '七军虽破，樊城未下。军粮不可断，烦你护住后路。']],
    after: [['protagonist', '玄霄', '粮路暂保，荆州却传来东吴袭取的急报。眼前的胜利，挡不住整个战局骤变。']],
  },
  {
    subtitle: '麦城救民', description: '关羽败走麦城，玄霄带外围伤兵百姓抵达撤离点。', historicalNote: '关羽遇害；没有科技复活、救回关羽或令其参加夷陵的分支。',
    allies: [], enemy: '吴军', condition: Escape, landscape: 'fort',
    before: [['protagonist', '玄霄', '吴军已封锁要路，主力失散。我所能做的，是把眼前这些伤兵百姓带出去。']],
    after: [['protagonist', '玄霄', '撤离的人得以生还，关将军却终究遇害。护民之功，换不回故人的性命。']],
  },
  {
    subtitle: '夷陵撤退', description: '陆逊火攻破蜀军，玄霄掩护残军抵达东面撤离点。', historicalNote: '张飞已遇害；夷陵蜀军大败，刘备退白帝，任务完成不代表扭转败局。',
    allies: ['liubei', 'zhaoyun'], enemy: '吴军', condition: Escape, landscape: 'fire',
    before: [['liubei', '刘备', '二弟三弟皆已不在，朕又失却大军……悔不听劝！'], ['protagonist', '玄霄', '陛下先撤！我只求多救将士，无法凭有限电力扑灭连营大火。']],
    after: [['zhaoyun', '赵云', '接应已至，速护陛下退入白帝城。此番大败，当铭记于心。']],
  },
  {
    subtitle: '白帝托孤', description: '刘备病重，玄霄守卫外围六回合，保护伤兵与军需。', historicalNote: '刘备白帝托孤后病逝，诸葛亮辅佐刘禅；科技不能取消托孤。',
    allies: ['zhaoyun'], enemy: '山寇', condition: Survive, landscape: 'fort',
    before: [['zhaoyun', '赵云', '陛下病势沉重，军师正赶赴白帝。营外伤兵与军需，不可再有闪失。']],
    after: [['liubei', '刘备', '孔明，嗣子辅之。军民之事，愿卿尽心……'], ['zhugeliang', '诸葛亮', '臣敢竭股肱之力，效忠贞之节。'], ['protagonist', '玄霄', '先主病逝。此后辅佐丞相，只为不负当年救民的誓言。']],
  },
  {
    subtitle: '五丈秋风', description: '多年北伐后，与姜维坚守撤军通路六回合，完成最后的护军任务。', historicalNote: '街亭失守、诸次北伐与赵云病逝已发生；诸葛亮五丈原归天，最终三分归晋。',
    allies: ['jiangwei', 'weiyan'], enemy: '魏军', condition: Survive, landscape: 'field',
    before: [['jiangwei', '姜维', '自天水归汉，维深受丞相教诲。今丞相病重，军中务须谨守部署。'], ['protagonist', '玄霄', '这些年北伐往复，子龙将军亦已离世。终端所剩的力量，只够再护一段归路。']],
    after: [['protagonist', '玄霄', '七星灯终灭，丞相归天。撤军依遗令进行，魏延与杨仪的纷争亦未能避免。英雄的志业与遗憾，终被秋风收入史册。']],
  },
];

function createTerrain(landscape: Episode['landscape']): TerrainType[][] {
  const grid = Array.from({ length: 12 }, () => Array<TerrainType>(14).fill(TerrainType.Plains));
  for (const [x, y] of [[4, 3], [4, 4], [9, 8], [9, 9]]) grid[y][x] = TerrainType.Forest;
  grid[2][12] = TerrainType.Gate;
  grid[9][4] = TerrainType.Fort;
  grid[2][3] = TerrainType.Village;
  if (landscape === 'river') {
    for (let y = 0; y < 12; y++) grid[y][7] = TerrainType.River;
    grid[3][7] = grid[8][7] = TerrainType.Bridge;
  }
  if (landscape === 'fort') {
    for (let y = 0; y < 7; y++) grid[y][10] = TerrainType.Wall;
    grid[3][10] = TerrainType.Gate;
  }
  if (landscape === 'fire') for (let x = 5; x <= 9; x++) grid[5][x] = TerrainType.Fire;
  return grid;
}

function dialogue(lines: Episode['before']): DialogueLine[] {
  return lines.map(([speaker, speakerName, text]) => ({ speaker, speakerName, portraitId: speaker, text }));
}

function enemiesFor(episode: Episode, index: number): Unit[] {
  const level = 1 + Math.floor(index / 2);
  return [[8, 3], [9, 4], [11, 6], [12, 2]].map(([x, y], offset) => {
    const isBoss = offset === 3;
    const unitClass = offset === 1 ? UnitClass.Archer : UnitClass.Fighter;
    const type = offset === 1 ? WeaponType.Bow : WeaponType.Axe;
    const unit = createBaseUnit(
      `enemy_${index}_${offset}`, `${episode.enemy}${isBoss ? '督阵将' : offset === 1 ? '弓手' : '步卒'}`,
      isBoss ? '敌军指挥' : '敌军', unitClass, unitClass, level,
      { hp: 19 + level * 2 + (isBoss ? 6 : 0), str: 5 + level, mag: 0, skl: 4 + level, spd: 4 + Math.floor(level / 2), lck: 2, def: 3 + Math.floor(level / 2), res: 2, con: 8, mov: 5 },
      { hp: 50, str: 40, mag: 0, skl: 40, spd: 40, lck: 30, def: 30, res: 20 },
      [offset === 1 ? 'iron_bow' : 'iron_axe'], { [type]: WeaponRank.C },
    );
    return { ...unit, faction: Faction.Enemy, x, y, isBoss, aiType: isBoss ? 'boss' : 'attack' };
  });
}

export const ALL_STAGES: StageConfig[] = CAMPAIGN_EPISODES.map((episode, index) => {
  const chapter = Math.floor(index / 5) + 1;
  const stage = index % 5 + 1;
  const objective = episode.condition === Escape ? '玄霄抵达东面撤离点（12，10）'
    : episode.condition === Survive ? '玄霄存活，完成6个回合'
    : episode.condition === Seize ? '直属单位制压东北据点（12，2）' : '击退全部敌军';
  return {
    id: `stage_${chapter}_${stage}`, chapterNumber: chapter, stageNumber: stage,
    title: `第${chapter}章 第${stage}关`, subtitle: episode.subtitle,
    description: episode.description, historicalNote: episode.historicalNote,
    objective, meritReward: 100 + (chapter - 1) * 25,
    mapWidth: 14, mapHeight: 12, terrainGrid: createTerrain(episode.landscape),
    playerSpawnPoints: [{ x: 1, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 1, y: 10 }, { x: 2, y: 10 }],
    initialPlayerUnits: [], enemyUnits: enemiesFor(episode, index),
    allyUnits: episode.allies.map((id, i) => ({ ...createHistoricalAlly(id, 2 + Math.floor(index / 2)), x: 3, y: 7 + i })),
    victoryCondition: episode.condition, surviveTurns: 6,
    seizeTarget: { x: 12, y: 2 }, escapeTarget: { x: 12, y: 10 },
    preBattleDialogue: dialogue(episode.before), postBattleDialogue: dialogue(episode.after),
    events: [{ trigger: 'visit_village', villageX: 3, villageY: 2, rewardGold: 200,
      dialogue: [{ speaker: 'villager', speakerName: '乡老', portraitId: 'cleric', text: '多谢护住乡里！这些粮资请带给伤兵。' }] }],
    bgmTheme: episode.landscape === 'fire' ? 'crisis' : 'heroic',
  };
});
