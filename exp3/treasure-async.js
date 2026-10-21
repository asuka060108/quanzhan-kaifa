'use strict';

/**
 * 「星尘遗迹」寻宝故事数据层。
 *
 * 对比原始 treasure.js：
 * - 原始版本使用 Promise.then() 链式调用；
 * - 本版本使用 async/await 顺序等待每一步异步任务；
 * - 每一步仍然基于 Promise + setTimeout，只是写法更接近同步流程。
 *
 * 浏览器中通过全局 TreasureMap 使用，Node.js 中也可以 require 后测试。
 */
(function (global) {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  class TreasureMap {
    /** 第一章：机械萤火虫送来缺角的星图。 */
    static async getInitialClue() {
      await wait(1150);

      return {
        id: 1,
        stage: 1,
        progress: 14,
        eyebrow: '第一章 · 潮汐邮差',
        title: '缺角的星图',
        caption: '风之灯塔 · 第一浮岛',
        text:
          '小烛抖落翅膀上的星尘，一张黄铜星图在你掌心展开。' +
          '七颗星连成通往「第三浮岛」的虚线，可最后一角被撕走了。',
        log: '获得「黄铜星图」×1',
        firefly: 0.1,
      };
    }

    /** 第二章：用星座和潮汐刻度补全坐标。 */
    static async decodeAncientScript(clue) {
      await wait(1450);

      return {
        id: 2,
        stage: 2,
        progress: 31,
        eyebrow: '第二章 · 失落的星座',
        title: '把星星读成路',
        caption: '星图台 · 坐标正在浮现',
        text:
          '你转动星图外环，猎户座的腰带与潮汐刻度重合。' +
          '星尘浮到半空，拼出一句话：「当月影落进风眼，门就会醒来。」' +
          '你补全了星图缺失的那一角，坐标指向「风之回廊」。',
        log: '解锁坐标「风之回廊」',
        firefly: 0.28,
      };
    }

    /** 第三章：穿越风之回廊。随机顺风或逆风，但两条支线都会成功。 */
    static async crossWindCorridor(location) {
      await wait(1550);

      const headwind = Math.random() < 0.5;

      return {
        id: 3,
        stage: 3,
        progress: 48,
        eyebrow: '第三章 · 风之回廊',
        title: headwind ? '逆风而行' : '乘着上升气流',
        caption: headwind ? '风之回廊 · 逆风' : '风之回廊 · 顺风',
        text: headwind
          ? '狂风从回廊深处倒灌。你把星图护在胸前，小烛咬住你的袖口，' +
            '一寸一寸拖过断桥。风停时，第三浮岛就在眼前。'
          : '小烛展开光翼，你们乘着上升气流越过断桥。' +
            '云层在脚下裂开，第三浮岛像一枚沉睡的指环缓缓升起。',
        log: headwind
          ? '在逆风中抵达第三浮岛'
          : '乘着顺风抵达第三浮岛',
        firefly: 0.48,
        variant: headwind ? 'headwind' : 'tailwind',
        location: location.title,
      };
    }

    /** 第四章：石像守门人的谜题。 */
    static async wakeGuardian() {
      await wait(1500);

      return {
        id: 4,
        stage: 4,
        progress: 64,
        eyebrow: '第四章 · 沉睡的守门人',
        title: '石像的谜题',
        caption: '月影神庙 · 石门之前',
        text:
          '神庙门前，石像睁开一只由星砂组成的眼睛。' +
          '它低声问：「什么越分越多，越藏越亮？」' +
          '小烛在你肩头闪了三下。你回答：「是星光。」石门缓缓下沉。',
        log: '守门人让开了路',
        firefly: 0.64,
      };
    }

    /** 第五章：在倒悬的月影湖里取得钥匙。 */
    static async findMoonKey() {
      await wait(1350);

      return {
        id: 5,
        stage: 5,
        progress: 80,
        eyebrow: '第五章 · 月影湖',
        title: '捞起一枚月光',
        caption: '月影湖 · 水下有光',
        text:
          '门后没有金山，只有一汪倒悬的月影湖。' +
          '小烛俯冲入水，衔起一枚透明的钥匙。' +
          '湖面荡开一圈星纹，整座浮岛开始轻轻震动。',
        log: '获得「星辉钥匙」',
        firefly: 0.8,
      };
    }

    /** 终章：打开石匣，发现真正的宝藏。 */
    static async openTreasureBox() {
      await wait(1650);

      return {
        id: 6,
        stage: 6,
        progress: 100,
        eyebrow: '终章 · 星之种',
        title: '宝藏不是金子',
        caption: '星尘遗迹 · 灯塔重新点亮',
        text:
          '钥匙插入石匣，机关像呼吸一样亮起。' +
          '箱中没有金币，只有一粒微小的光——星之种。' +
          '它升上夜空，炸开成一条新的银河。熄灭百年的灯塔，重新亮了。',
        log: '找到宝藏「星之种」',
        firefly: 1,
      };
    }
  }

  const api = { TreasureMap, wait };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.TreasureMap = TreasureMap;
  global.treasureWait = wait;
})(typeof globalThis !== 'undefined' ? globalThis : this);
