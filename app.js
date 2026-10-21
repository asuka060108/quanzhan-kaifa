'use strict';

const sky = document.querySelector("#sky");
const ctx = sky.getContext("2d");

const scene = document.querySelector("#scene");
const sceneCaption = document.querySelector("#sceneCaption");
const firefly = document.querySelector("#firefly");
const journeyPath = document.querySelector("#journeyPath");

const story = document.querySelector(".story");
const storyText = document.querySelector("#storyText");
const stageEyebrow = document.querySelector("#stageEyebrow");
const stageTitle = document.querySelector("#stageTitle");
const chapterCounter = document.querySelector("#chapterCounter");
const progressFill = document.querySelector("#progressFill");
const logList = document.querySelector("#log");
const liveStatus = document.querySelector("#liveStatus");

const startBtn = document.querySelector("#startBtn");
const startLabel = document.querySelector("#startLabel");
const replayBtn = document.querySelector("#replayBtn");

const TreasureMap = window.TreasureMap;
const wait = window.treasureWait;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const TOTAL_CHAPTERS = 6;
const INTRO_TEXT =
  "云端群岛的灯塔熄灭了一百年。今晚，一只机械萤火虫落在你的窗台，" +
  "带来一张缺了角的星图。";

const STAGE_CLASSES = [
  ["has-observatory", 1],
  ["has-constellation", 2],
  ["has-wind", 3],
  ["has-temple", 4],
  ["has-key", 5],
  ["has-finale", 6],
];

let running = false;
let runToken = 0;
let fireflyCurrent = null;
let fireflyTween = null;
let finaleAmount = 0;
let finaleTarget = 0;
let stars = [];
let shootingStar = null;
let skyWidth = 0;
let skyHeight = 0;

/* ------------------------------------------------------------------ */
/* 场景状态                                                             */
/* ------------------------------------------------------------------ */

function setStage(stage) {
  scene.dataset.stage = String(stage);

  for (const [className, minStage] of STAGE_CLASSES) {
    scene.classList.toggle(className, stage >= minStage);
  }

  finaleTarget = stage >= 6 ? 1 : 0;
}

function setFirefly(progress, animate = true) {
  const totalLength = journeyPath.getTotalLength();
  const point = journeyPath.getPointAtLength(
    totalLength * Math.min(1, Math.max(0, progress))
  );
  const target = { x: point.x, y: point.y };

  if (!fireflyCurrent || !animate || reduceMotion.matches) {
    fireflyCurrent = target;
    fireflyTween = null;
    firefly.setAttribute("transform", `translate(${target.x} ${target.y})`);
    return;
  }

  fireflyTween = {
    from: { ...fireflyCurrent },
    to: target,
    startedAt: performance.now(),
    duration: 1400,
  };
}

function updateFirefly(now) {
  if (!fireflyTween) return;

  const raw = Math.min(1, (now - fireflyTween.startedAt) / fireflyTween.duration);
  const eased = 1 - Math.pow(1 - raw, 3);
  const x = fireflyTween.from.x + (fireflyTween.to.x - fireflyTween.from.x) * eased;
  const y = fireflyTween.from.y + (fireflyTween.to.y - fireflyTween.from.y) * eased;

  fireflyCurrent = { x, y };
  firefly.setAttribute("transform", `translate(${x} ${y})`);

  if (raw >= 1) {
    fireflyTween = null;
  }
}

/* ------------------------------------------------------------------ */
/* 故事呈现                                                             */
/* ------------------------------------------------------------------ */

function addLog(message) {
  const item = document.createElement("li");
  const text = document.createElement("span");
  text.textContent = message;
  item.append(text);
  logList.prepend(item);

  while (logList.children.length > 3) {
    logList.lastElementChild.remove();
  }
}

async function typeText(text, token) {
  storyText.textContent = "";
  story.classList.remove("is-complete");

  const characters = Array.from(text);

  if (reduceMotion.matches) {
    storyText.textContent = text;
    story.classList.add("is-complete");
    liveStatus.textContent = text;
    return;
  }

  for (const character of characters) {
    if (token !== runToken) return;

    storyText.textContent += character;

    let pause = 17;
    if ("。！？".includes(character)) pause = 150;
    else if ("，、；".includes(character)) pause = 55;

    await wait(pause);
  }

  if (token !== runToken) return;

  story.classList.add("is-complete");
  liveStatus.textContent = text;
}

async function showChapter(chapter, token) {
  if (token !== runToken) return;

  stageEyebrow.textContent = chapter.eyebrow;
  stageTitle.textContent = chapter.title;
  sceneCaption.textContent = chapter.caption;
  chapterCounter.textContent = `${String(chapter.id).padStart(2, "0")} / ${String(
    TOTAL_CHAPTERS
  ).padStart(2, "0")}`;
  progressFill.style.width = `${chapter.progress}%`;

  stageTitle.classList.remove("title-in");
  void stageTitle.offsetWidth;
  stageTitle.classList.add("title-in");

  setStage(chapter.stage);
  setFirefly(chapter.firefly);
  addLog(chapter.log);

  await typeText(chapter.text, token);
}

function resetExperience() {
  setStage(0);
  setFirefly(0, false);
  finaleAmount = 0;
  finaleTarget = 0;

  progressFill.style.width = "0%";
  chapterCounter.textContent = "00 / 06";
  stageEyebrow.textContent = "序章 · 风停之夜";
  stageTitle.textContent = "星尘遗迹";
  sceneCaption.textContent = "风停之夜 · 云端群岛";
  storyText.textContent = INTRO_TEXT;
  logList.replaceChildren();
  liveStatus.textContent = "";

  story.classList.remove("is-complete", "is-running");
  startBtn.hidden = false;
  startBtn.disabled = false;
  startLabel.textContent = "跟随小烛出发";
  replayBtn.hidden = true;
}

async function runAdventure() {
  if (running) return;

  const token = ++runToken;
  running = true;

  resetExperience();
  story.classList.add("is-running");
  startBtn.disabled = true;
  startLabel.textContent = "星尘正在汇聚…";
  replayBtn.hidden = true;

  try {
    const clue = await TreasureMap.getInitialClue();
    await showChapter(clue, token);

    const location = await TreasureMap.decodeAncientScript(clue);
    await showChapter(location, token);

    const crossing = await TreasureMap.crossWindCorridor(location);
    await showChapter(crossing, token);

    const guardian = await TreasureMap.wakeGuardian();
    await showChapter(guardian, token);

    const key = await TreasureMap.findMoonKey();
    await showChapter(key, token);

    const treasure = await TreasureMap.openTreasureBox();
    await showChapter(treasure, token);

    if (token !== runToken) return;

    await wait(650);
    if (token !== runToken) return;

    startBtn.hidden = true;
    replayBtn.hidden = false;
    replayBtn.focus({ preventScroll: true });
    liveStatus.textContent =
      "寻宝完成。你找到了星之种，星尘遗迹重新点亮。";
  } catch (error) {
    console.error(error);

    if (token === runToken) {
      storyText.textContent =
        "星图被雾气打湿了。别担心，再试一次，星光会重新指路。";
      story.classList.add("is-complete");
      startLabel.textContent = "重新出发";
      startBtn.disabled = false;
    }
  } finally {
    if (token === runToken) {
      running = false;
      story.classList.remove("is-running");
      if (!startBtn.hidden) {
        startBtn.disabled = false;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 星空背景                                                             */
/* ------------------------------------------------------------------ */

function createStars() {
  const count = window.innerWidth < 700 ? 110 : 190;
  const colors = ["255, 255, 255", "170, 252, 231", "255, 228, 168"];

  stars = Array.from({ length: count }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.3 + 0.35,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.8 + 0.25,
    color: colors[index % colors.length],
    depth: Math.random() * 0.8 + 0.2,
  }));
}

function resizeSky() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  skyWidth = window.innerWidth;
  skyHeight = window.innerHeight;

  sky.width = Math.floor(skyWidth * dpr);
  sky.height = Math.floor(skyHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawSky(now) {
  const time = now / 1000;

  ctx.clearRect(0, 0, skyWidth, skyHeight);
  ctx.globalCompositeOperation = "lighter";

  for (const star of stars) {
    const twinkle =
      0.28 + 0.72 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
    const x = star.x * skyWidth;
    const y = star.y * skyHeight;
    const radius = star.radius * (0.75 + star.depth * 0.5);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${star.color}, ${twinkle * 0.9})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (star.radius > 1.15) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${star.color}, ${twinkle * 0.12})`;
      ctx.arc(x, y, radius * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!shootingStar && Math.random() < 0.0007) {
    shootingStar = {
      x: Math.random() * skyWidth * 0.7,
      y: Math.random() * skyHeight * 0.32,
      vx: 6 + Math.random() * 3,
      vy: 2.4 + Math.random() * 1.6,
      life: 1,
    };
  }

  if (shootingStar) {
    const { x, y, vx, vy } = shootingStar;
    const gradient = ctx.createLinearGradient(
      x,
      y,
      x - vx * 15,
      y - vy * 15
    );
    gradient.addColorStop(0, `rgba(255, 247, 214, ${shootingStar.life})`);
    gradient.addColorStop(1, "rgba(255, 247, 214, 0)");

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.moveTo(x, y);
    ctx.lineTo(x - vx * 15, y - vy * 15);
    ctx.stroke();

    shootingStar.x += vx;
    shootingStar.y += vy;
    shootingStar.life -= 0.018;

    if (
      shootingStar.life <= 0 ||
      shootingStar.x > skyWidth + 100 ||
      shootingStar.y > skyHeight + 100
    ) {
      shootingStar = null;
    }
  }

  finaleAmount += (finaleTarget - finaleAmount) * 0.025;

  if (finaleAmount > 0.015) {
    const originX = skyWidth * 0.705;
    const originY = skyHeight * 0.56;

    for (let i = 0; i < 34; i++) {
      const angle = time * 0.17 + i * 2.399;
      const radius =
        70 + (i % 7) * 28 + Math.sin(time * 0.9 + i * 1.7) * 12;
      const x = originX + Math.cos(angle) * radius * 1.15;
      const y = originY + Math.sin(angle) * radius * 0.55;
      const alpha =
        finaleAmount * (0.18 + 0.5 * Math.abs(Math.sin(time + i * 0.8)));

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 226, 153, ${alpha})`;
      ctx.arc(x, y, 1.2 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalCompositeOperation = "source-over";

  updateFirefly(now);
  requestAnimationFrame(drawSky);
}

/* ------------------------------------------------------------------ */
/* 启动                                                                 */
/* ------------------------------------------------------------------ */

startBtn.addEventListener("click", runAdventure);
replayBtn.addEventListener("click", runAdventure);

window.addEventListener("resize", () => {
  resizeSky();
  createStars();
});

resizeSky();
createStars();
setStage(0);
setFirefly(0, false);
requestAnimationFrame(drawSky);
