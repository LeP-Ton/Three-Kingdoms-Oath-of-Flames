/**
 * 三国志·烈火之誓 (Three Kingdoms: Oath of Fire)
 * 对标 GBA 火焰纹章核心系列（封印/烈火/圣魔）
 * 主游戏容器与状态机核心驱动器
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Unit,
  StageConfig,
  Faction,
  VictoryCondition,
  LevelUpGain,
  TerrainType,
  WeaponType,
} from './types';
import { ALL_STAGES } from './data/stagesData';
import { INITIAL_PARTY } from './data/charactersData';
import { ITEMS_DATABASE } from './data/itemsData';
import { calculateMovementRange, calculateAttackRange, calculateDangerZone, ReachableTile, getDistance } from './game/pathfinding';
import { computeAiTurn } from './game/aiEngine';
import { audio } from './audio/retroAudio';
import { ART_ASSETS } from './graphics/imageAssets';
import { getPortraitDataUrl } from './graphics/pixelAssets';

import { GameCanvas } from './components/GameCanvas';
import { DialogueBox } from './components/DialogueBox';
import { CombatArena } from './components/CombatArena';
import { LevelUpModal } from './components/LevelUpModal';
import { PrepScreen } from './components/PrepScreen';
import { GbaControls } from './components/GbaControls';
import { SaveLoadModal, SaveSlotData } from './components/SaveLoadModal';
import { DebugPanel } from './components/DebugPanel';
import { DesignDocModal } from './components/DesignDocModal';
import { CharacterRosterModal } from './components/CharacterRosterModal';
import { DirectSquadModal } from './components/DirectSquadModal';
import { TechSkillModal } from './components/TechSkillModal';
import { ALL_CHARACTERS_ROSTER } from './data/charactersData';
import { TECH_SKILLS, TechSkillId, getRankByMerits } from './data/techSkillsData';

type GameMode =
  | 'title'
  | 'prep'
  | 'battle'
  | 'dialogue'
  | 'combat_duel'
  | 'stage_clear'
  | 'game_over'
  | 'victory_ending';

interface ActiveCombatData {
  attacker: Unit;
  defender: Unit;
  distance: number;
}

export default function App() {
  // 核心游戏状态
  const [mode, setMode] = useState<GameMode>('title');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [party, setParty] = useState<Unit[]>(INITIAL_PARTY);
  const [gold, setGold] = useState(1200);
  const [battleMerits, setBattleMerits] = useState(0); // 战功点数 (用于升职拜将与直属卫队扩编)
  const [casualMode, setCasualMode] = useState(false); // 经典/轻松模式
  const [showCharacterRoster, setShowCharacterRoster] = useState(false);
  const [rosterSelectedId, setRosterSelectedId] = useState<string | undefined>(undefined);
  const [showDirectSquad, setShowDirectSquad] = useState(false);
  const [showTechSkill, setShowTechSkill] = useState(false);

  // 当前关卡进行时状态
  const currentStage: StageConfig = ALL_STAGES[currentStageIndex] || ALL_STAGES[0];
  const [battleUnits, setBattleUnits] = useState<Unit[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [phase, setPhase] = useState<'player' | 'enemy'>('player');
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);

  // 战棋光标与选择状态
  const [cursorPos, setCursorPos] = useState({ x: 1, y: 6 });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [originalUnitPos, setOriginalUnitPos] = useState<{ x: number; y: number } | null>(null);
  const [movementRange, setMovementRange] = useState<Map<string, ReachableTile>>(new Map());
  const [attackRange, setAttackRange] = useState<Set<string>>(new Set());
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [dangerZone, setDangerZone] = useState<Set<string>>(new Set());

  // 行动指令菜单 (移动后弹出：攻击、道具、访问、制压、待机、取消、科技技能)
  const [actionMenu, setActionMenu] = useState<{
    unit: Unit;
    x: number;
    y: number;
    options: ('attack' | 'staff' | 'item' | 'visit' | 'seize' | 'wait' | 'cancel' | 'tech_skill')[];
  } | null>(null);

  // 攻击目标选择状态
  const [targetingEnemies, setTargetingEnemies] = useState<Unit[]>([]);

  // 弹窗与子系统状态
  const [activeDialogue, setActiveDialogue] = useState<StageConfig['preBattleDialogue'] | null>(null);
  const [onDialogueFinishCallback, setOnDialogueFinishCallback] = useState<(() => void) | null>(null);
  const [activeCombat, setActiveCombat] = useState<ActiveCombatData | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ unit: Unit; gain: LevelUpGain } | null>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showDesignDoc, setShowDesignDoc] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // 初始化或关卡切换时载入 BGM
  useEffect(() => {
    if (mode === 'battle' || mode === 'prep') {
      audio.startBgm(currentStage.bgmTheme);
    }
  }, [mode, currentStage.bgmTheme]);

  // 重新计算全图危险区
  const refreshDangerZone = useCallback((units: Unit[]) => {
    const enemies = units.filter((u) => u.isAlive && u.faction === Faction.Enemy);
    const dz = calculateDangerZone(enemies, currentStage.mapWidth, currentStage.mapHeight, currentStage.terrainGrid, units);
    setDangerZone(dz);
  }, [currentStage]);

  // 启动新战役章节
  const initStage = useCallback((stageToLoad: StageConfig, deployedParty: Unit[] = party) => {
    // 部署玩家选派的武将
    const placedPlayerUnits: Unit[] = [];
    const spawnPoints = stageToLoad.playerSpawnPoints;

    deployedParty.slice(0, spawnPoints.length).forEach((unit, idx) => {
      const sp = spawnPoints[idx];
      placedPlayerUnits.push({
        ...unit,
        x: sp.x,
        y: sp.y,
        hasActed: false,
        isAlive: true,
        faction: Faction.Player,
      });
    });

    // 载入敌军
    const enemies = stageToLoad.enemyUnits.map((e) => ({ ...e, isAlive: true, hasActed: false }));
    const all = [...placedPlayerUnits, ...enemies];

    setBattleUnits(all);
    setCurrentTurn(1);
    setPhase('player');
    setSelectedUnit(null);
    setActionMenu(null);
    setTargetingEnemies([]);
    setMovementRange(new Map());
    setAttackRange(new Set());
    setCursorPos({ x: placedPlayerUnits[0]?.x || 1, y: placedPlayerUnits[0]?.y || 1 });

    refreshDangerZone(all);

    // 播放战前剧情对话
    if (stageToLoad.preBattleDialogue && stageToLoad.preBattleDialogue.length > 0) {
      setMode('dialogue');
      setActiveDialogue(stageToLoad.preBattleDialogue);
      setOnDialogueFinishCallback(() => () => {
        setMode('battle');
        triggerPhaseBanner('PLAYER PHASE');
      });
    } else {
      setMode('battle');
      triggerPhaseBanner('PLAYER PHASE');
    }
  }, [party, refreshDangerZone]);

  // 回合横幅提示
  const triggerPhaseBanner = (text: string) => {
    setPhaseBanner(text);
    audio.playPhaseChange();
    setTimeout(() => {
      setPhaseBanner(null);
    }, 1200);
  };

  // 检查胜利与失败判定
  const checkBattleCondition = useCallback(
    (currentUnits: Unit[], turn: number) => {
      const alivePlayers = currentUnits.filter((u) => u.isAlive && u.faction === Faction.Player);
      const aliveEnemies = currentUnits.filter((u) => u.isAlive && u.faction === Faction.Enemy);

      // 失败：主将阵亡
      const protagonist = alivePlayers.find((u) => u.characterId === 'protagonist' || u.characterId === 'liubei');
      if (!protagonist || alivePlayers.length === 0) {
        audio.playGameOver();
        setMode('game_over');
        return;
      }

      // 胜利判定：
      let isVictory = false;

      if (currentStage.victoryCondition === VictoryCondition.Rout && aliveEnemies.length === 0) {
        isVictory = true;
      } else if (currentStage.victoryCondition === VictoryCondition.DefeatBoss) {
        const bossAlive = aliveEnemies.some((u) => u.isBoss);
        if (!bossAlive) isVictory = true;
      } else if (currentStage.victoryCondition === VictoryCondition.Survive) {
        if (turn >= (currentStage.surviveTurns || 6)) {
          isVictory = true;
        }
      }

      if (isVictory) {
        audio.playVictory();
        if (currentStage.postBattleDialogue && currentStage.postBattleDialogue.length > 0) {
          setMode('dialogue');
          setActiveDialogue(currentStage.postBattleDialogue);
          setOnDialogueFinishCallback(() => () => {
            handleStageVictoryFinish();
          });
        } else {
          handleStageVictoryFinish();
        }
      }
    },
    [currentStage]
  );

  // 关卡胜利结算
  const handleStageVictoryFinish = () => {
    setGold((prev) => prev + 1500);
    setBattleMerits((prev) => prev + 250);

    if (currentStageIndex >= ALL_STAGES.length - 1 || currentStage.id === 'stage_5_5') {
      setMode('victory_ending');
    } else {
      setMode('stage_clear');
    }
  };

  // 推进至下一关
  const proceedToNextStage = () => {
    audio.playMenuConfirm();
    const nextIdx = currentStageIndex + 1;
    if (nextIdx < ALL_STAGES.length) {
      setCurrentStageIndex(nextIdx);
      setMode('prep');
    } else {
      setMode('victory_ending');
    }
  };

  // 玩家棋盘交互逻辑
  const handleTileClick = (tx: number, ty: number) => {
    if (phase !== 'player' || mode !== 'battle') return;

    // 1. 如果处于攻击目标选取状态
    if (targetingEnemies.length > 0 && selectedUnit) {
      const targetEnemy = targetingEnemies.find((e) => e.x === tx && e.y === ty);
      if (targetEnemy) {
        audio.playMenuConfirm();
        const dist = getDistance(selectedUnit.x, selectedUnit.y, targetEnemy.x, targetEnemy.y);
        setActiveCombat({ attacker: selectedUnit, defender: targetEnemy, distance: dist });
        setTargetingEnemies([]);
        setMode('combat_duel');
        return;
      }
    }

    // 2. 如果已经选中了移动后单位并打开了菜单，点击其他区域取消
    if (actionMenu) {
      return;
    }

    // 3. 点击己方尚未行动的单位：选中并展开移动/攻击范围
    const clickedUnit = battleUnits.find((u) => u.isAlive && u.x === tx && u.y === ty);

    if (!selectedUnit) {
      if (clickedUnit) {
        audio.playUnitSelect();
        setCursorPos({ x: tx, y: ty });

        if (clickedUnit.faction === Faction.Player && !clickedUnit.hasActed) {
          setSelectedUnit(clickedUnit);
          setOriginalUnitPos({ x: tx, y: ty });
          const reachable = calculateMovementRange(
            clickedUnit,
            currentStage.mapWidth,
            currentStage.mapHeight,
            currentStage.terrainGrid,
            battleUnits
          );
          setMovementRange(reachable);

          const weapon = clickedUnit.inventory[clickedUnit.equippedWeaponIndex] || null;
          const atkRange = calculateAttackRange(reachable, weapon, currentStage.mapWidth, currentStage.mapHeight);
          setAttackRange(atkRange);
        } else {
          // 查看敌方或已行动单位的范围
          const weapon = clickedUnit.inventory[clickedUnit.equippedWeaponIndex] || null;
          const reachable = calculateMovementRange(
            clickedUnit,
            currentStage.mapWidth,
            currentStage.mapHeight,
            currentStage.terrainGrid,
            battleUnits
          );
          setMovementRange(reachable);
          setAttackRange(calculateAttackRange(reachable, weapon, currentStage.mapWidth, currentStage.mapHeight));
        }
      } else {
        // 点击空地重置高亮
        setSelectedUnit(null);
        setMovementRange(new Map());
        setAttackRange(new Set());
      }
    } else {
      // 4. 已有选中单位，点击目标格子进行位移
      const key = `${tx},${ty}`;
      if (movementRange.has(key)) {
        // 格子不能被其他存活队友或敌人占据
        const isOccupied = battleUnits.some(
          (u) => u.isAlive && u.id !== selectedUnit.id && u.x === tx && u.y === ty
        );

        if (!isOccupied) {
          audio.playMoveStep();
          // 更新单位位置
          const movedUnit = { ...selectedUnit, x: tx, y: ty };
          setBattleUnits((prev) => prev.map((u) => (u.id === selectedUnit.id ? movedUnit : u)));
          setSelectedUnit(movedUnit);
          setCursorPos({ x: tx, y: ty });
          setMovementRange(new Map());
          setAttackRange(new Set());

          // 计算可用行动指令
          const weapon = movedUnit.inventory[movedUnit.equippedWeaponIndex] || null;
          const options: ('attack' | 'staff' | 'item' | 'visit' | 'seize' | 'tech_skill' | 'wait' | 'cancel')[] = [];

          // 检查攻击范围内是否有存活敌军
          if (weapon && weapon.type !== WeaponType.Item && weapon.type !== WeaponType.Staff) {
            const enemiesInRange = battleUnits.filter((e) => {
              if (!e.isAlive || e.faction !== Faction.Enemy) return false;
              const d = getDistance(tx, ty, e.x, e.y);
              return d >= weapon.minRange && d <= weapon.maxRange;
            });
            if (enemiesInRange.length > 0) {
              options.push('attack');
            }
          }

          // 检查是否有可用消耗道具
          const hasUsableItem = movedUnit.inventory.some((it) => it.type === WeaponType.Item);
          if (hasUsableItem) {
            options.push('item');
          }

          // 检查访问村庄事件
          const terrain = currentStage.terrainGrid[ty]?.[tx];
          if (terrain === TerrainType.Village) {
            options.push('visit');
          }

          // 检查制压
          if (
            (terrain === TerrainType.Throne || terrain === TerrainType.Gate || terrain === TerrainType.Castle) &&
            currentStage.victoryCondition === VictoryCondition.Seize
          ) {
            options.push('seize');
          }

          // 检查未来科技技能 (若单位为机器人主角或具备科技技能)
          if (movedUnit.isRobot || movedUnit.characterId === 'protagonist') {
            options.push('tech_skill');
          }

          options.push('wait');
          options.push('cancel');

          setActionMenu({ unit: movedUnit, x: tx, y: ty, options });
        }
      } else {
        // 取消选定
        audio.playMenuCancel();
        setSelectedUnit(null);
        setMovementRange(new Map());
        setAttackRange(new Set());
      }
    }
  };

  // 行动指令处理
  const handleActionSelect = (action: string) => {
    if (!actionMenu) return;
    const { unit, x, y } = actionMenu;

    if (action === 'tech_skill') {
      audio.playMenuConfirm();
      setShowTechSkill(true);
      return;
    }

    if (action === 'cancel') {
      audio.playMenuCancel();
      // 回退至原始位置
      if (originalUnitPos) {
        setBattleUnits((prev) =>
          prev.map((u) => (u.id === unit.id ? { ...u, x: originalUnitPos.x, y: originalUnitPos.y } : u))
        );
        setCursorPos(originalUnitPos);
      }
      setSelectedUnit(null);
      setActionMenu(null);
      return;
    }

    if (action === 'wait') {
      audio.playMenuConfirm();
      const updatedUnits = battleUnits.map((u) => (u.id === unit.id ? { ...u, hasActed: true } : u));
      setBattleUnits(updatedUnits);
      setSelectedUnit(null);
      setActionMenu(null);
      checkTurnEnd(updatedUnits);
      return;
    }

    if (action === 'attack') {
      audio.playMenuConfirm();
      const weapon = unit.inventory[unit.equippedWeaponIndex] || null;
      if (!weapon) return;

      const enemies = battleUnits.filter((e) => {
        if (!e.isAlive || e.faction !== Faction.Enemy) return false;
        const d = getDistance(x, y, e.x, e.y);
        return d >= weapon.minRange && d <= weapon.maxRange;
      });

      setTargetingEnemies(enemies);
      setActionMenu(null);
      return;
    }

    if (action === 'visit') {
      audio.playLevelUp();
      const villageEvent = currentStage.events?.find(
        (ev) => ev.trigger === 'visit_village' && ev.villageX === x && ev.villageY === y
      );
      if (villageEvent) {
        if (villageEvent.rewardGold) {
          setGold((prev) => prev + (villageEvent.rewardGold || 0));
        }
        if (villageEvent.rewardItem && unit.inventory.length < 5) {
          unit.inventory.push({ ...villageEvent.rewardItem });
        }
        if (villageEvent.dialogue) {
          setMode('dialogue');
          setActiveDialogue(villageEvent.dialogue);
          setOnDialogueFinishCallback(() => () => {
            setMode('battle');
          });
        }
      }
      const updatedUnits = battleUnits.map((u) => (u.id === unit.id ? { ...u, hasActed: true } : u));
      setBattleUnits(updatedUnits);
      setSelectedUnit(null);
      setActionMenu(null);
      checkTurnEnd(updatedUnits);
      return;
    }

    if (action === 'seize') {
      audio.playVictory();
      handleStageVictoryFinish();
      return;
    }

    if (action === 'item') {
      // 快速使用药水
      audio.playItemUse();
      const itemIdx = unit.inventory.findIndex((it) => it.type === WeaponType.Item);
      if (itemIdx >= 0) {
        const item = unit.inventory[itemIdx];
        const healedHp = Math.min(unit.stats.maxHp, unit.stats.hp + 20);
        item.uses -= 1;
        if (item.uses <= 0) {
          unit.inventory.splice(itemIdx, 1);
        }
        const updatedUnits = battleUnits.map((u) =>
          u.id === unit.id ? { ...u, stats: { ...u.stats, hp: healedHp }, hasActed: true } : u
        );
        setBattleUnits(updatedUnits);
        setSelectedUnit(null);
        setActionMenu(null);
        checkTurnEnd(updatedUnits);
      }
      return;
    }
  };

  // 释放未来科技技能处理
  const handleExecuteTechSkill = (
    skillId: TechSkillId,
    targetUnit?: Unit,
    effectResult?: { message: string }
  ) => {
    setShowTechSkill(false);
    const actor = actionMenu?.unit || selectedUnit;
    if (!actor) return;
    const skill = TECH_SKILLS[skillId];

    let nextUnits = [...battleUnits];
    const currentActor = nextUnits.find((u) => u.id === actor.id);
    if (currentActor) {
      currentActor.energy = Math.max(0, (currentActor.energy ?? 60) - skill.energyCost);
      currentActor.hasActed = true;

      if (skillId === 'plasma_slash' && targetUnit) {
        const target = nextUnits.find((u) => u.id === targetUnit.id);
        if (target) {
          target.stats.hp = Math.max(0, target.stats.hp - 18);
          if (target.stats.hp <= 0) {
            target.isAlive = false;
            setBattleMerits((prev) => prev + (target.isBoss ? 80 : 20));
          }
        }
      } else if (skillId === 'nanite_repair' && targetUnit) {
        const target = nextUnits.find((u) => u.id === targetUnit.id);
        if (target) {
          target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + 22);
        }
      } else if (skillId === 'emp_shock' && targetUnit) {
        const target = nextUnits.find((u) => u.id === targetUnit.id);
        if (target) {
          target.stats.hp = Math.max(0, target.stats.hp - 12);
          target.stats.mov = Math.max(1, target.stats.mov - 2);
          if (target.stats.hp <= 0) {
            target.isAlive = false;
            setBattleMerits((prev) => prev + (target.isBoss ? 80 : 20));
          }
        }
      } else if (skillId === 'kinetic_shield') {
        currentActor.shieldHp = 25;
      } else if (skillId === 'orbital_strike' && targetUnit) {
        const target = nextUnits.find((u) => u.id === targetUnit.id);
        if (target) {
          target.stats.hp = Math.max(0, target.stats.hp - 26);
          if (target.stats.hp <= 0) {
            target.isAlive = false;
            setBattleMerits((prev) => prev + (target.isBoss ? 80 : 20));
          }
        }
      }
    }

    setBattleUnits(nextUnits);
    setSelectedUnit(null);
    setActionMenu(null);
    if (effectResult?.message) {
      triggerPhaseBanner(effectResult.message);
    }
    checkBattleCondition(nextUnits, currentTurn);
    checkTurnEnd(nextUnits);
  };

  // 战斗动画结算完毕回调
  const handleFinishCombat = (result: {
    attacker: Unit;
    defender: Unit;
    attackerDied: boolean;
    defenderDied: boolean;
    levelUpGain: LevelUpGain | null;
  }) => {
    setMode('battle');
    setActiveCombat(null);

    let nextUnits = battleUnits.map((u) => {
      if (u.id === result.attacker.id) return result.attacker;
      if (u.id === result.defender.id) return result.defender;
      return u;
    });

    if (result.attackerDied && !casualMode && result.attacker.faction === Faction.Player) {
      // 经典模式战死永久移出我方
      setParty((prev) => prev.filter((p) => p.id !== result.attacker.id));
    }
    if (result.defenderDied && !casualMode && result.defender.faction === Faction.Player) {
      setParty((prev) => prev.filter((p) => p.id !== result.defender.id));
    }

    // 斩杀敌兵或Boss获取战功
    if (result.defenderDied && result.defender.faction === Faction.Enemy) {
      setBattleMerits((prev) => prev + (result.defender.isBoss ? 80 : 20));
    }

    setBattleUnits(nextUnits);
    refreshDangerZone(nextUnits);

    if (result.levelUpGain) {
      setLevelUpData({ unit: result.attacker, gain: result.levelUpGain });
    }

    // 检查关卡胜负
    checkBattleCondition(nextUnits, currentTurn);

    // 若依然在玩家回合，检查全员是否都已行动
    if (phase === 'player') {
      checkTurnEnd(nextUnits);
    }
  };

  // 检查己方回合是否全员行动完毕
  const checkTurnEnd = (currentUnits: Unit[]) => {
    const unactedPlayers = currentUnits.filter(
      (u) => u.isAlive && u.faction === Faction.Player && !u.hasActed
    );
    if (unactedPlayers.length === 0) {
      // 开启敌方阶段
      startEnemyPhase(currentUnits);
    }
  };

  // 切换至敌方行动阶段
  const startEnemyPhase = (unitsBeforeAi: Unit[]) => {
    setPhase('enemy');
    triggerPhaseBanner('ENEMY PHASE');

    // 延迟逐个执行敌方 AI 行动
    setTimeout(() => {
      runEnemyAiSequence(unitsBeforeAi);
    }, 1200);
  };

  // 顺序执行敌兵 AI 战术决策
  const runEnemyAiSequence = async (initialUnits: Unit[]) => {
    let currentUnits = [...initialUnits];
    const enemies = currentUnits.filter((u) => u.isAlive && u.faction === Faction.Enemy);

    for (const enemy of enemies) {
      // 再次确认敌兵依然存活
      const latestEnemy = currentUnits.find((u) => u.id === enemy.id && u.isAlive);
      if (!latestEnemy) continue;

      const aiAction = computeAiTurn(
        latestEnemy,
        currentStage.mapWidth,
        currentStage.mapHeight,
        currentStage.terrainGrid,
        currentUnits
      );

      // 移动至目的地
      latestEnemy.x = aiAction.destination.x;
      latestEnemy.y = aiAction.destination.y;
      latestEnemy.hasActed = true;

      currentUnits = currentUnits.map((u) => (u.id === latestEnemy.id ? latestEnemy : u));
      setBattleUnits([...currentUnits]);

      // 若决定发动攻击
      if (aiAction.actionType === 'attack' && aiAction.targetUnit) {
        const dist = getDistance(latestEnemy.x, latestEnemy.y, aiAction.targetUnit.x, aiAction.targetUnit.y);
        setActiveCombat({ attacker: latestEnemy, defender: aiAction.targetUnit, distance: dist });
        setMode('combat_duel');
        return; // 交由 CombatArena 处理，并在结束后恢复
      }

      // 等待 250ms 模拟思考走位
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // 敌方全部行动完毕，交还玩家回合
    endEnemyPhase(currentUnits);
  };

  // 结束敌方回合，恢复玩家行动
  const endEnemyPhase = (finalUnits: Unit[]) => {
    const nextTurn = currentTurn + 1;
    setCurrentTurn(nextTurn);

    // 重置我方与敌方行动标志
    const refreshedUnits = finalUnits.map((u) => ({
      ...u,
      hasActed: false,
    }));

    setBattleUnits(refreshedUnits);
    setPhase('player');
    refreshDangerZone(refreshedUnits);
    triggerPhaseBanner(`PLAYER PHASE · 第 ${nextTurn} 回合`);

    // 检查坚持回合关卡
    checkBattleCondition(refreshedUnits, nextTurn);
  };

  // 手动结束己方回合按钮
  const handleManualEndTurn = () => {
    if (phase !== 'player' || mode !== 'battle') return;
    audio.playMenuConfirm();
    startEnemyPhase(battleUnits);
  };

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'battle') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, y: Math.max(0, prev.y - 1) }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, y: Math.min(currentStage.mapHeight - 1, prev.y + 1) }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, x: Math.max(0, prev.x - 1) }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCursorPos((prev) => ({ ...prev, x: Math.min(currentStage.mapWidth - 1, prev.x + 1) }));
      } else if (e.key === 'z' || e.key === 'Z') {
        // A 键 / 确定
        e.preventDefault();
        handleTileClick(cursorPos.x, cursorPos.y);
      } else if (e.key === 'x' || e.key === 'X') {
        // B 键 / 取消
        e.preventDefault();
        if (actionMenu) {
          handleActionSelect('cancel');
        } else {
          setSelectedUnit(null);
          setMovementRange(new Map());
          setAttackRange(new Set());
          setTargetingEnemies([]);
        }
      } else if (e.key === ' ') {
        // 空格键：切换全图敌军危险区
        e.preventDefault();
        setShowDangerZone((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorPos, mode, actionMenu, currentStage]);

  return (
    <div id="game-root" className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 flex flex-col font-sans scanlines">
      {/* 1. 游戏标题开场画面 (Title Screen) */}
      {mode === 'title' && (
        <div id="title-screen" className="relative flex-1 flex flex-col items-center p-3 sm:p-6 bg-radial from-amber-950/70 via-stone-950 to-black select-none overflow-y-auto gba-scroll">
          <div className="w-full max-w-4xl animate-fade-in my-auto py-2 sm:py-4 flex flex-col items-center">
            {/* 桃园结义与时空战枢史诗主视觉 Banner */}
            <div className="relative mx-auto mb-3 w-full max-w-2xl rounded-lg overflow-hidden border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-stone-950">
              <img
                src={ART_ASSETS.titleBanner}
                alt="三国志·烈火之誓 桃园结义与时空降临"
                className="w-full h-36 sm:h-48 md:h-56 object-cover pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute top-2 left-3 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/60 text-[10px] sm:text-xs font-mono text-cyan-300">
                CHRONOS PROTOCOL · 未来智能机器人穿越三国
              </div>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-amber-300/90 drop-shadow">
                <span>GBA FIRE EMBLEM ENGINE</span>
                <span>CHAPTER 1 - 30 COMPLETE SAGA</span>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase mb-1 font-mono">
              ★ 未来智能机体战枢降临 · 辅助刘备逐鹿三国 · 严格遵循《三国演义》★
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-400 pixel-font tracking-wider drop-shadow-2xl mb-2 text-center">
              三国志 · 烈火之誓
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4 max-w-2xl text-center px-2">
              玩家扮演意外穿越至东汉末年的未来智能机器人【天工·玄霄】，以高频等离子刃、量子战术雷达、纳米修复等科技协议参与经典战役。初始单机作战无直属部曲，随战功积累升职拜将、组建并扩编直属特种卫队，与自主行动的刘关张赵等三国名将协同作战！历史主线与结局严格遵循《三国演义》！
            </p>

            {/* 核心操作主按键群 */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xl mx-auto mb-5 z-20">
              <button
                id="start-game-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                    audio.startBgm('heroic');
                  } catch (err) {
                    console.warn(err);
                  }
                  setMode('prep');
                }}
                className="px-6 py-2.5 gba-btn font-bold text-sm sm:text-base text-amber-100 tracking-widest cursor-pointer shadow-xl active:scale-95 min-h-[42px]"
              >
                征战起兵 (开局) ▶
              </button>
              <button
                id="load-game-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                    audio.startBgm('heroic');
                  } catch (err) {
                    console.warn(err);
                  }
                  setSaveLoadMode('load');
                }}
                className="px-5 py-2.5 gba-window font-bold text-xs sm:text-sm text-amber-300 hover:text-amber-100 border border-amber-500/50 cursor-pointer active:scale-95 min-h-[42px]"
              >
                往昔卷宗 (读档)
              </button>
              <button
                onClick={() => {
                  audio.playMenuConfirm();
                  setShowDirectSquad(true);
                }}
                className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-400 font-bold text-xs sm:text-sm rounded cursor-pointer active:scale-95 min-h-[42px] shadow"
              >
                🛡️ 直属卫队整编 (战功升职)
              </button>
              <button
                onClick={() => {
                  audio.playMenuConfirm();
                  setShowCharacterRoster(true);
                }}
                className="px-5 py-2.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500 font-bold text-xs sm:text-sm rounded cursor-pointer active:scale-95 min-h-[42px] shadow"
              >
                📜 名将全录立绘大典 (28+名将)
              </button>
              <button
                id="open-design-doc-btn"
                onClick={() => {
                  try {
                    audio.playMenuConfirm();
                  } catch (err) {
                    console.warn(err);
                  }
                  setShowDesignDoc(true);
                }}
                className="px-4 py-2.5 gba-window font-bold text-xs text-stone-300 hover:text-amber-200 border border-stone-700 cursor-pointer active:scale-95 min-h-[42px]"
              >
                策划白皮书
              </button>
            </div>

            {/* 首页全人物立绘效果快速检视大典 (满足第2点：首页直接列出所有人物资料，方便检查立绘效果) */}
            <div className="w-full bg-[#120c08]/95 p-3 sm:p-4 rounded-xl border border-amber-500/50 shadow-2xl mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-amber-500/30 gap-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-xs sm:text-sm font-black text-amber-300 pixel-font tracking-wide">
                    【首页直观检视】三国群英人物资料与立绘效果展评
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  共收录 <span className="text-amber-300 font-mono font-bold">{ALL_CHARACTERS_ROSTER.length}</span> 位独立立绘人物 · 点击可开大图
                </div>
              </div>

              {/* 首页全名将卡片网格 (支持逐一检查立绘、纯净度与六维属性) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1 gba-scroll">
                {ALL_CHARACTERS_ROSTER.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      audio.playMenuSelect();
                      setRosterSelectedId(char.id);
                      setShowCharacterRoster(true);
                    }}
                    className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-700 hover:border-amber-400 transition-all cursor-pointer flex flex-col items-center group relative shadow-md"
                    title={`点击查看 ${char.name} 的详细传记与放大像素立绘`}
                  >
                    {/* 立绘微缩窗 */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden border border-amber-500/40 bg-stone-950 shadow-inner">
                      <img
                        src={getPortraitDataUrl(char.portraitId, 'normal')}
                        alt={char.name}
                        className="w-full h-full object-cover pixelated group-hover:scale-110 transition-transform"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="absolute bottom-0 right-0 px-1 text-[8px] bg-black/80 text-amber-300 font-bold rounded-tl border-t border-l border-amber-500/40">
                        {char.faction.slice(0, 1)}
                      </span>
                    </div>

                    <div className="mt-1 text-center w-full">
                      <div className="text-xs font-bold text-amber-200 truncate group-hover:text-amber-300">
                        {char.name}
                      </div>
                      <div className="text-[9px] text-stone-400 truncate">
                        {char.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between text-[10px] text-stone-400">
                <span>★ 画风统一标准：16-bit GBA 顶级像素立绘，严格对标吕布高规格，全员纯净无文字框杂质。</span>
                <button
                  onClick={() => {
                    audio.playMenuConfirm();
                    setShowCharacterRoster(true);
                  }}
                  className="text-amber-400 hover:text-amber-200 underline cursor-pointer font-bold ml-auto"
                >
                  打开完整立绘检视大典 (含生平原著考据) ▶
                </button>
              </div>
            </div>

            <div className="text-xs text-stone-400 flex items-center justify-center space-x-3 text-center">
              <span>关卡总量: 30 战役 (25 主线 + 5 隐藏)</span>
              <span>•</span>
              <span>武器三角相克与攻速追击</span>
              <span>•</span>
              <span>战功升职与直属小队统辖</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 战前整备界面 (Prep Screen) */}
      {mode === 'prep' && (
        <PrepScreen
          stage={currentStage}
          party={party}
          gold={gold}
          battleMerits={battleMerits}
          onUpdateParty={setParty}
          onUpdateGold={setGold}
          onOpenDirectSquad={() => setShowDirectSquad(true)}
          onOpenRoster={() => setShowCharacterRoster(true)}
          onStartBattle={(selectedUnits) => {
            initStage(currentStage, selectedUnits);
          }}
        />
      )}

      {/* 3. 战场主画面 (Battlefield Screen) */}
      {(mode === 'battle' || mode === 'dialogue') && (
        <div id="battlefield-container" className="relative flex-1 flex flex-col justify-between overflow-hidden">
          {/* 顶部战况状态栏 (适配移动端紧凑与自适应分栏) */}
          <header className="gba-window px-2 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between border-b border-amber-600/50 text-xs z-20 gap-1.5">
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <span className="font-bold text-amber-300 font-mono text-[11px] sm:text-xs">
                {currentStage.title}
              </span>
              <span className="bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-200 font-bold text-[10px] sm:text-xs font-mono">
                R{currentTurn}
              </span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                  phase === 'player' ? 'bg-blue-900/90 text-blue-200 border border-blue-400' : 'bg-red-900/90 text-red-200 border border-red-400'
                }`}
              >
                {phase === 'player' ? '我军回合' : '敌军回合'}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
              {phase === 'player' && (
                <button
                  id="end-player-turn-btn"
                  onClick={handleManualEndTurn}
                  className="px-2.5 py-1 min-h-[34px] bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-400 text-amber-100 font-bold rounded cursor-pointer text-[11px] active:scale-95 shadow"
                >
                  结回合
                </button>
              )}
              <button
                onClick={() => setShowDangerZone((prev) => !prev)}
                className={`px-2 py-1 min-h-[34px] rounded font-bold cursor-pointer border text-[11px] active:scale-95 ${
                  showDangerZone
                    ? 'bg-red-800 border-red-400 text-stone-100'
                    : 'bg-stone-900 border-stone-700 text-stone-300'
                }`}
                title="显示敌军威胁红格"
              >
                {showDangerZone ? '判敌:开' : '判敌'}
              </button>
              <button
                onClick={() => setShowControls((prev) => !prev)}
                className={`px-2 py-1 min-h-[34px] rounded font-bold cursor-pointer border text-[11px] active:scale-95 ${
                  showControls
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
                title="展开/隐藏虚拟手柄"
              >
                手柄
              </button>
              <button
                onClick={() => setSaveLoadMode('save')}
                className="px-2 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-200 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                存档
              </button>
              <button
                onClick={() => setShowCharacterRoster(true)}
                className="px-1.5 py-1 min-h-[34px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded border border-amber-600/80 cursor-pointer text-[11px] font-bold active:scale-95"
                title="查看全人物立绘资料大典"
              >
                图鉴
              </button>
              <button
                onClick={() => setShowDirectSquad(true)}
                className="px-1.5 py-1 min-h-[34px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 rounded border border-cyan-500/80 cursor-pointer text-[11px] font-bold active:scale-95"
                title="直属战术卫队整编与战功升职"
              >
                卫队
              </button>
              <button
                onClick={() => setShowDebug(true)}
                className="px-1.5 py-1 min-h-[34px] bg-purple-950/80 hover:bg-purple-900 text-purple-300 rounded border border-purple-700 cursor-pointer text-[11px] font-bold active:scale-95"
              >
                秘籍
              </button>
              <button
                onClick={() => setShowDesignDoc(true)}
                className="px-1.5 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                卷宗
              </button>
              <button
                onClick={() => audio.toggleMute()}
                className="px-1.5 py-1 min-h-[34px] bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer text-[11px] active:scale-95"
              >
                音效
              </button>
            </div>
          </header>

          {/* 阶段大横幅提示 */}
          {phaseBanner && (
            <div className="absolute inset-x-0 top-1/3 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-black/90 border-y-4 border-amber-500 py-3 px-12 text-2xl md:text-3xl font-black pixel-font text-amber-300 shadow-2xl tracking-widest animate-bounce">
                {phaseBanner}
              </div>
            </div>
          )}

          {/* 棋盘主渲染区 */}
          <div className="flex-1 relative flex items-center justify-center">
            <GameCanvas
              stage={currentStage}
              units={battleUnits}
              selectedUnit={selectedUnit}
              cursorPos={cursorPos}
              movementRange={movementRange}
              attackRange={attackRange}
              dangerZone={dangerZone}
              showDangerZone={showDangerZone}
              onTileClick={handleTileClick}
              onCursorChange={(x, y) => setCursorPos({ x, y })}
            />

            {/* 行动指令弹出菜单 (GBA 经典右侧弹出菜单) */}
            {actionMenu && (
              <div
                className="absolute z-30 gba-window p-2 rounded shadow-2xl border-2 border-amber-400 min-w-[120px]"
                style={{
                  left: `${Math.min(window.innerWidth - 135, Math.max(10, cursorPos.x * 32 + 36))}px`,
                  top: `${Math.min(window.innerHeight - 230, Math.max(50, cursorPos.y * 32 - 20))}px`,
                }}
              >
                <div className="text-[10px] text-amber-400 font-bold border-b border-amber-500/30 pb-1 mb-1 text-center">
                  行动军令
                </div>
                <div className="space-y-1 text-xs">
                  {actionMenu.options.includes('attack') && (
                    <button
                      onClick={() => handleActionSelect('attack')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-red-950/80 hover:bg-red-800 text-red-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      ⚔ 攻击
                    </button>
                  )}
                  {actionMenu.options.includes('tech_skill') && (
                    <button
                      onClick={() => handleActionSelect('tech_skill')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-cyan-950/90 hover:bg-cyan-800 text-cyan-200 font-bold cursor-pointer active:scale-95 flex items-center border border-cyan-500/60 shadow"
                    >
                      🤖 科技协议
                    </button>
                  )}
                  {actionMenu.options.includes('visit') && (
                    <button
                      onClick={() => handleActionSelect('visit')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      🏡 访问
                    </button>
                  )}
                  {actionMenu.options.includes('seize') && (
                    <button
                      onClick={() => handleActionSelect('seize')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-amber-900 hover:bg-amber-700 text-amber-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      👑 制压
                    </button>
                  )}
                  {actionMenu.options.includes('item') && (
                    <button
                      onClick={() => handleActionSelect('item')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded bg-blue-950/80 hover:bg-blue-800 text-blue-200 font-bold cursor-pointer active:scale-95 flex items-center"
                    >
                      🧪 道具
                    </button>
                  )}
                  {actionMenu.options.includes('wait') && (
                    <button
                      onClick={() => handleActionSelect('wait')}
                      className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded hover:bg-stone-800 text-stone-200 cursor-pointer active:scale-95 flex items-center"
                    >
                      🛡 待机
                    </button>
                  )}
                  <button
                    onClick={() => handleActionSelect('cancel')}
                    className="w-full text-left px-2.5 py-1.5 min-h-[36px] rounded text-stone-400 hover:bg-stone-800 cursor-pointer active:scale-95 flex items-center"
                  >
                    ✕ 取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 虚拟按键条 */}
          {showControls && (
            <GbaControls
              onDirection={(dx, dy) => {
                setCursorPos((prev) => ({
                  x: Math.max(0, Math.min(currentStage.mapWidth - 1, prev.x + dx)),
                  y: Math.max(0, Math.min(currentStage.mapHeight - 1, prev.y + dy)),
                }));
              }}
              onA={() => handleTileClick(cursorPos.x, cursorPos.y)}
              onB={() => {
                if (actionMenu) {
                  handleActionSelect('cancel');
                } else {
                  setSelectedUnit(null);
                  setMovementRange(new Map());
                  setAttackRange(new Set());
                  setTargetingEnemies([]);
                }
              }}
              onL={() => {
                const playerUnits = battleUnits.filter((u) => u.isAlive && u.faction === Faction.Player && !u.hasActed);
                if (playerUnits.length > 0) {
                  setCursorPos({ x: playerUnits[0].x, y: playerUnits[0].y });
                }
              }}
              onR={() => {
                const enemies = battleUnits.filter((u) => u.isAlive && u.faction === Faction.Enemy);
                if (enemies.length > 0) {
                  setCursorPos({ x: enemies[0].x, y: enemies[0].y });
                }
              }}
              onStart={handleManualEndTurn}
              onSelect={() => setShowDangerZone((prev) => !prev)}
            />
          )}
        </div>
      )}

      {/* 4. 剧情对话弹窗 (Dialogue Box) */}
      {mode === 'dialogue' && activeDialogue && (
        <DialogueBox
          dialogue={activeDialogue}
          onComplete={() => {
            setActiveDialogue(null);
            if (onDialogueFinishCallback) {
              onDialogueFinishCallback();
              setOnDialogueFinishCallback(null);
            }
          }}
        />
      )}

      {/* 5. GBA 1v1 格斗特写战斗视窗 (Combat Duel Arena) */}
      {mode === 'combat_duel' && activeCombat && (
        <CombatArena
          attacker={activeCombat.attacker}
          defender={activeCombat.defender}
          distance={activeCombat.distance}
          attackerTerrain={currentStage.terrainGrid[activeCombat.attacker.y]?.[activeCombat.attacker.x]}
          defenderTerrain={currentStage.terrainGrid[activeCombat.defender.y]?.[activeCombat.defender.x]}
          onFinishCombat={handleFinishCombat}
        />
      )}

      {/* 6. 升级弹窗 (Level Up Modal) */}
      {levelUpData && (
        <LevelUpModal
          unit={levelUpData.unit}
          gain={levelUpData.gain}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* 7. 关卡大捷通关结算 (Stage Clear Screen) */}
      {mode === 'stage_clear' && (
        <div id="stage-clear-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
          <div className="gba-window w-full max-w-lg p-6 rounded-md border-4 border-amber-400 text-center shadow-2xl animate-scale-up">
            <h2 className="text-3xl font-black text-amber-300 pixel-font tracking-widest mb-2">
              ★ 战 役 大 捷 ★
            </h2>
            <div className="text-sm font-bold text-amber-200/90 mb-4">
              {currentStage.title} · {currentStage.subtitle} 功成奏凯！
            </div>
            <div className="p-4 bg-stone-900 rounded border border-amber-500/30 text-xs space-y-2 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-300">战斗回合:</span>
                <span className="text-amber-300 font-bold">{currentTurn} 回合</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-300">击破敌军:</span>
                <span className="text-amber-300 font-bold">已肃清战场</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-300">赏金入库:</span>
                <span className="text-green-400 font-bold">+1500 金</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-300">战功斩获:</span>
                <span className="text-cyan-400 font-bold">+250 功勋</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-1.5">
                <span className="text-stone-300">累积战功 / 当前官阶:</span>
                <span className="text-amber-300 font-bold">
                  {battleMerits} 功勋 · 【{getRankByMerits(battleMerits).title}】
                </span>
              </div>
            </div>

            <button
              id="next-stage-btn"
              onClick={proceedToNextStage}
              className="w-full py-3 gba-btn font-bold text-amber-100 text-sm tracking-widest cursor-pointer"
            >
              整军备战 · 下一战役 ▶
            </button>
          </div>
        </div>
      )}

      {/* 8. 战败画面 (Game Over Screen) */}
      {mode === 'game_over' && (
        <div id="game-over-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
          <div className="gba-window w-full max-w-md p-6 rounded-md border-4 border-red-600 text-center shadow-2xl">
            <h2 className="text-3xl font-black text-red-500 pixel-font tracking-widest mb-2">
              全 军 溃 败
            </h2>
            <p className="text-xs text-stone-300 mb-6">
              主将饮恨沙场，汉室风云未定……胜败乃兵家常事，大侠请重新来过！
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  initStage(currentStage);
                }}
                className="w-full py-2.5 bg-red-900 hover:bg-red-800 text-stone-100 font-bold rounded cursor-pointer text-sm"
              >
                重整旗鼓 (重玩本关)
              </button>
              <button
                onClick={() => setSaveLoadMode('load')}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded cursor-pointer text-sm"
              >
                读取往昔存档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. 真·大团圆终局通关画面 (Victory Ending Screen) */}
      {mode === 'victory_ending' && (
        <div id="victory-ending-screen" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950 p-6 select-none overflow-y-auto">
          <div className="max-w-2xl text-center space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-black text-amber-400 pixel-font tracking-widest">
              天 下 归 一
            </h2>
            <p className="text-sm md:text-base text-amber-200/90 leading-relaxed">
              三十战役，金戈铁马，关山万里尽归王道。
              <br />
              黄巾平、群雄服、赤壁焰、蜀道开、英灵定。
              <br />
              汉室重光，万民安居，三国纷争终告尘埃落定！
            </p>
            <div className="p-4 bg-stone-900/80 rounded-md border border-amber-500/40 text-xs text-stone-300 space-y-2">
              <div className="text-amber-300 font-bold">通关达成率: 100% · 英雄全员归一</div>
              <div>感谢体验《三国志·烈火之誓》全量战棋世界！</div>
            </div>
            <button
              onClick={() => setMode('title')}
              className="px-8 py-3 gba-btn font-bold text-amber-100 text-sm tracking-widest cursor-pointer shadow-2xl"
            >
              返回游戏主界面
            </button>
          </div>
        </div>
      )}

      {/* 存档/读档弹窗 */}
      {saveLoadMode && (
        <SaveLoadModal
          mode={saveLoadMode}
          currentStage={currentStage}
          currentTurn={currentTurn}
          currentGold={gold}
          currentParty={party}
          onClose={() => setSaveLoadMode(null)}
          onLoadData={(data: SaveSlotData) => {
            const stg = ALL_STAGES.find((s) => s.id === data.stageId) || ALL_STAGES[0];
            const idx = ALL_STAGES.findIndex((s) => s.id === data.stageId);
            if (idx >= 0) setCurrentStageIndex(idx);
            setParty(data.party);
            setGold(data.gold);
            initStage(stg, data.party);
          }}
        />
      )}

      {/* 开发者秘籍调试台 */}
      {showDebug && (
        <DebugPanel
          currentStage={currentStage}
          party={party}
          gold={gold}
          battleMerits={battleMerits}
          casualMode={casualMode}
          onClose={() => setShowDebug(false)}
          onJumpStage={(stg) => {
            const idx = ALL_STAGES.findIndex((s) => s.id === stg.id);
            if (idx >= 0) setCurrentStageIndex(idx);
            initStage(stg);
          }}
          onWinStage={handleStageVictoryFinish}
          onUpdateParty={setParty}
          onUpdateGold={setGold}
          onUpdateMerits={setBattleMerits}
          onToggleCasualMode={() => setCasualMode((prev) => !prev)}
        />
      )}

      {/* 策划设计案文档 */}
      {showDesignDoc && <DesignDocModal onClose={() => setShowDesignDoc(false)} />}

      {/* 10. 三国名将全录与全立绘检视大典 */}
      {showCharacterRoster && (
        <CharacterRosterModal
          initialSelectedId={rosterSelectedId}
          onClose={() => {
            setShowCharacterRoster(false);
            setRosterSelectedId(undefined);
          }}
        />
      )}

      {/* 11. 直属小队整编与战功授印晋阶界面 */}
      {showDirectSquad && (
        <DirectSquadModal
          battleMerits={battleMerits}
          gold={gold}
          party={party}
          onUpdateParty={setParty}
          onUpdateGold={setGold}
          onClose={() => setShowDirectSquad(false)}
        />
      )}

      {/* 12. 未来战枢科技协议释放视窗 */}
      {showTechSkill && (actionMenu?.unit || selectedUnit) && (
        <TechSkillModal
          actor={actionMenu?.unit || selectedUnit!}
          allUnits={battleUnits}
          battleMerits={battleMerits}
          onExecuteSkill={handleExecuteTechSkill}
          onClose={() => setShowTechSkill(false)}
        />
      )}
    </div>
  );
}
