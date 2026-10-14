/**
 * 三国志·烈火之誓 - 艺术素材资产库
 * 全面统合对标 GBA 吕布风格的高精名将像素立绘（如同光荣三国志，每位三国名将皆有独立定制立绘）
 */

import titleBanner from '../assets/images/three_kingdoms_title_1789703242351.jpg';

// 蜀汉名将与元勋
import portraitGuanyu from '../assets/images/portrait_guanyu_clean_1791874983606.jpg';
import portraitZhugeliang from '../assets/images/portrait_zhugeliang_1789703271718.jpg';
import portraitZhaoyun from '../assets/images/portrait_zhaoyun_1789703317601.jpg';
import portraitLiubei from '../assets/images/portrait_liubei_1789704158183.jpg';
import portraitZhangfei from '../assets/images/portrait_zhangfei_1789704189042.jpg';
import portraitHuangzhong from '../assets/images/portrait_huangzhong_1791875011481.jpg';
import portraitMachao from '../assets/images/portrait_machao_1791876603755.jpg';
import portraitJiangwei from '../assets/images/portrait_jiangwei_1791876687650.jpg';
import portraitWeiyan from '../assets/images/portrait_weiyan_1791876870492.jpg';
import portraitSunqian from '../assets/images/portrait_sunqian_1791876908386.jpg';

// 曹魏名将与巨擘
import portraitCaocao from '../assets/images/portrait_caocao_1789704176248.jpg';
import portraitSimayi from '../assets/images/portrait_simayi_1791876733395.jpg';
import portraitZhangliao from '../assets/images/portrait_zhangliao_1791876711742.jpg';
import portraitXiahoudun from '../assets/images/portrait_xiahoudun_1791875064426.jpg';
import portraitXiahouyuan from '../assets/images/portrait_xiahouyuan_1791877097334.jpg';
import portraitCaoren from '../assets/images/portrait_caoren_1791877149258.jpg';

// 东吴英豪
import portraitSunce from '../assets/images/portrait_sunce_1791876763559.jpg';
import portraitZhouyu from '../assets/images/portrait_zhouyu_1791875040228.jpg';
import portraitLuxun from '../assets/images/portrait_luxun_1791877049245.jpg';
import portraitGanning from '../assets/images/portrait_ganning_1791876792406.jpg';
import portraitTaishici from '../assets/images/portrait_taishici_1791876832706.jpg';

// 群雄、异人与隐藏名将
import portraitLubu from '../assets/images/portrait_lubu_1789703290595.jpg';
import portraitDiaochan from '../assets/images/portrait_diaochan_1789704203635.jpg';
import portraitDongzhuo from '../assets/images/portrait_dongzhuo_1789704215425.jpg';
import portraitZhangjiao from '../assets/images/portrait_zhangjiao_1791875093980.jpg';
import portraitHuatuo from '../assets/images/portrait_huatuo_1791876947618.jpg';
import portraitZuoci from '../assets/images/portrait_zuoci_1791876994590.jpg';

// 穿越未来智能机器人主角 (代号: 天工-VII / 玄霄 Chronos-7)
import portraitProtagonist from '../assets/images/portrait_robot_protagonist_1791977121616.jpg';

// 直属小队精锐卫士
import portraitSquadGuard from '../assets/images/portrait_squad_guard_1791977140056.jpg';

export const ART_ASSETS = {
  titleBanner,
  portraits: {
    // 未来智能机器人主角 (天工·玄霄)
    protagonist: portraitProtagonist,
    p_hero: portraitProtagonist,
    robot: portraitProtagonist,
    chronos: portraitProtagonist,

    // 直属小队兵种
    squad_guard: portraitSquadGuard,
    squad_archer: portraitSquadGuard,
    squad_knight: portraitSquadGuard,
    squad_medic: portraitSquadGuard,

    // 蜀汉阵营 (全员独立专属立绘)
    liubei: portraitLiubei,
    p_liubei: portraitLiubei,
    guanyu: portraitGuanyu,
    p_guanyu: portraitGuanyu,
    zhangfei: portraitZhangfei,
    p_zhangfei: portraitZhangfei,
    zhaoyun: portraitZhaoyun,
    p_zhaoyun: portraitZhaoyun,
    zhugeliang: portraitZhugeliang,
    p_zhugeliang: portraitZhugeliang,
    huangzhong: portraitHuangzhong,
    p_huangzhong: portraitHuangzhong,
    machao: portraitMachao,
    p_machao: portraitMachao,
    weiyan: portraitWeiyan,
    p_weiyan: portraitWeiyan,
    jiangwei: portraitJiangwei,
    p_jiangwei: portraitJiangwei,
    sunqian: portraitSunqian,
    p_sunqian: portraitSunqian,
    cleric: portraitSunqian,

    // 曹魏阵营 (全员独立专属立绘)
    caocao: portraitCaocao,
    simayi: portraitSimayi,
    zhangliao: portraitZhangliao,
    p_zhangliao: portraitZhangliao,
    xiahoudun: portraitXiahoudun,
    p_xiahoudun: portraitXiahoudun,
    xiahouyuan: portraitXiahouyuan,
    caoren: portraitCaoren,
    xuhuang: portraitZhangliao,

    // 东吴阵营 (全员独立专属立绘)
    sunce: portraitSunce,
    p_sunce: portraitSunce,
    zhouyu: portraitZhouyu,
    p_zhouyu: portraitZhouyu,
    luxun: portraitLuxun,
    ganning: portraitGanning,
    p_ganning: portraitGanning,
    taishici: portraitTaishici,

    // 群雄与传奇人物 (全员独立专属立绘)
    lubu: portraitLubu,
    p_lubu: portraitLubu,
    diaochan: portraitDiaochan,
    p_diaochan: portraitDiaochan,
    dongzhuo: portraitDongzhuo,
    zhangjiao: portraitZhangjiao,
    huatuo: portraitHuatuo,
    p_huatuo: portraitHuatuo,
    zuoci: portraitZuoci,
    p_zuoci: portraitZuoci,

    // 战斗兵种与头目
    bandit: portraitDongzhuo,
    boss_generic: portraitDongzhuo,
    soldier: portraitLubu,
  } as Record<string, string>,
};
