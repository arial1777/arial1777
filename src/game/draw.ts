import { WORLD_H, type World } from "./dive";

/**
 * ろぼとダイブの見た目。物理（dive.ts）が決めた座標を、ワールド座標のまま描く。
 * 倍率・余白・高解像度画面のぶんは draw() が変換行列に入れるので、
 * 中身は world.width × 600 の世界にそのまま描けばよい。
 *
 * 絵は public/game/ の WebP。canvas は URL でしか画像を読めないので、
 * next/image を通さず、書き出し済みのものを置いてある（合計約150KB）。
 */

export const SPRITE_SRC = {
  roboto: "/game/roboto.webp",
  jet: "/game/roboto-jet.webp",
  dizzy: "/game/roboto-dizzy.webp",
  rock: "/game/rock-tip.webp",
  floorRock: "/game/rock-floor.webp",
  kelp: "/game/kelp.webp",
  vortex: "/game/vortex.webp",
  note: "/game/note.webp",
  drift: "/game/drift.webp",
  bg: "/game/deep-bg.webp",
} as const;

export type Sprites = Record<keyof typeof SPRITE_SRC, HTMLImageElement>;

/** ろぼとの見た目の幅。当たり判定の円より大きい——惜しい当たりは許す側に倒す */
const ROBOT_W = 76;

/**
 * 絵を読む。1枚も落とせないようにはしない——読めなかったものは
 * 塗りで代用する（drawSprite の分岐）。絵が無くても遊べるほうが大事。
 */
export function loadSprites(): Promise<Sprites> {
  const entries = Object.entries(SPRITE_SRC) as [keyof Sprites, string][];
  return Promise.all(
    entries.map(
      ([key, src]) =>
        new Promise<[keyof Sprites, HTMLImageElement]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([key, img]);
          img.onerror = () => resolve([key, img]);
          img.src = src;
        }),
    ),
  ).then((pairs) => Object.fromEntries(pairs) as Sprites);
}

function usable(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/** 中心と大きさを指定して1枚描く。読めていなければ岩色の角丸で代用する */
function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle = 0,
  flipY = false,
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (angle) ctx.rotate(angle);
  if (flipY) ctx.scale(1, -1);
  if (usable(img)) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = "#16336d";
    ctx.strokeStyle = "#071630";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, world: World, sprites: Sprites) {
  const W = world.width;
  const bg = sprites.bg;

  if (usable(bg)) {
    // 高さを世界に合わせる。横は左右ミラーで継ぎ目を消してあるので端で折り返せる
    const tile = WORLD_H * (bg.naturalWidth / bg.naturalHeight);
    // 手前より遅く流して奥行きを出す
    let x = -((world.travelled * 0.35) % tile);
    while (x < W) {
      ctx.drawImage(bg, x, 0, tile, WORLD_H);
      x += tile;
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grad.addColorStop(0, "#1c5ba8");
    grad.addColorStop(1, "#07102a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, WORLD_H);
  }

  // 深いほど暗く沈める。明るい素材とのコントラストもこれで確保している
  const tint = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  tint.addColorStop(0, "rgba(9, 20, 52, 0.10)");
  tint.addColorStop(0.55, "rgba(9, 20, 52, 0.42)");
  tint.addColorStop(1, "rgba(9, 20, 52, 0.78)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, WORLD_H);
}

/** 海底の飾り。当たり判定は持たない（海底に触れた時点で終わりなので） */
function drawSeabed(ctx: CanvasRenderingContext2D, world: World, sprites: Sprites) {
  const w = 240;
  const h = w * 0.58;
  const spacing = 320;
  let x = -((world.travelled * 0.85) % spacing);
  ctx.globalAlpha = 0.65;
  while (x < world.width + spacing) {
    drawSprite(ctx, sprites.floorRock, x, WORLD_H + h * 0.24, w, h);
    x += spacing;
  }
  ctx.globalAlpha = 1;
}

function drawItems(ctx: CanvasRenderingContext2D, world: World, sprites: Sprites) {
  for (const item of world.items) {
    if (item.taken) continue;
    const { x, y } = item.body.position;

    if (item.kind === "rock") {
      // 岩の柱は絵を縦に伸ばして使う。尖った岩なので、伸びても岩に見える
      drawSprite(ctx, sprites.rock, x, y, item.w * 1.32, item.h, 0, item.tip === "down");
    } else if (item.kind === "kelp") {
      drawSprite(ctx, sprites.kelp, x, y, item.w * 1.6, item.h, item.body.angle);
    } else if (item.kind === "vortex") {
      drawSprite(ctx, sprites.vortex, x, y, item.w * 1.18, item.h * 1.18, item.body.angle);
    } else if (item.kind === "note") {
      drawSprite(ctx, sprites.note, x, y, item.w, item.h * 1.32);
    } else {
      drawSprite(ctx, sprites.drift, x, y, item.w * 1.25, item.h * 1.25, item.body.angle);
    }
  }
}

function drawBubbles(ctx: CanvasRenderingContext2D, world: World) {
  ctx.fillStyle = "#bfe6ff";
  for (const bubble of world.bubbles) {
    ctx.globalAlpha = Math.min(0.55, (bubble.life / bubble.max) * 0.55);
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRobot(ctx: CanvasRenderingContext2D, world: World, sprites: Sprites) {
  const down = world.status === "dying" || world.status === "over";
  const img = down ? sprites.dizzy : world.jetting > 0 ? sprites.jet : sprites.roboto;
  const ratio = usable(img) ? img.naturalHeight / img.naturalWidth : 1.2;
  const { x, y } = world.robot.position;
  drawSprite(ctx, img, x, y, ROBOT_W, ROBOT_W * ratio, world.robot.angle);
}

/**
 * 1フレーム描く。
 *
 * scale はワールド1pxがCSS何pxになるか、dpr は端末の画素密度、
 * offset は極端な画面比のときに出る余白（ふだんは0）。
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  sprites: Sprites,
  scale: number,
  dpr: number,
  offsetX: number,
  offsetY: number,
) {
  // 余白ごと消したいので、いったん素の座標系に戻してから全面を塗る
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#060d24";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);

  if (world.shake > 0.2) {
    ctx.translate(
      (Math.random() - 0.5) * world.shake,
      (Math.random() - 0.5) * world.shake,
    );
  }

  drawBackground(ctx, world, sprites);
  drawSeabed(ctx, world, sprites);
  drawItems(ctx, world, sprites);
  drawBubbles(ctx, world);
  drawRobot(ctx, world, sprites);

  // 四隅を落として、画面の中心に目が行くようにする
  const vignette = ctx.createRadialGradient(
    world.width / 2,
    WORLD_H / 2,
    Math.min(world.width, WORLD_H) * 0.35,
    world.width / 2,
    WORLD_H / 2,
    Math.max(world.width, WORLD_H) * 0.72,
  );
  vignette.addColorStop(0, "rgba(9, 20, 52, 0)");
  vignette.addColorStop(1, "rgba(9, 20, 52, 0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, world.width, WORLD_H);
}
