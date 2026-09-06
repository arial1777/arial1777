import type { Body, Engine, IEventCollision } from "matter-js";

/**
 * ろぼとダイブの中身。React も DOM も canvas も知らない。
 * 描くのは draw.ts、画面とつなぐのは RobotoDive.tsx。
 *
 * matter-js を触るのはこのファイルだけで、しかも動的 import にしてある
 * （gzip で約26KB）。/play を開いただけの人には配らず、「あそぶ」を
 * 押した人にだけ配る。
 */

/**
 * 世界の「高さ」を固定して、幅を画面の形から決める。
 *
 * 物の大きさはすべて高さ基準なので、スマホでもパソコンでも、画面に対する
 * ろぼとや隙間の比率は変わらない。変わるのは横に見渡せる範囲だけ。
 *
 * そのぶんスクロールの速さを幅から逆算してある。「障害物が現れてから
 * 手前に届くまでの歩数」を決め打ちにしているので、横に広い画面でも
 * 狭い画面でも、間に合うかどうかは同じになる。
 */
export const WORLD_H = 600;
export const WORLD_W_MIN = 390;
export const WORLD_W_MAX = 1240;

/** ろぼとが居座る横位置。世界の幅に対する割合で決める */
const HOME_RATIO = 0.26;
/** 当たり判定の半径。見た目の絵より小さめ——惜しい当たりは許す側に倒す */
const ROBOT_R = 26;
/** 障害物を出す位置。右端よりすこし外 */
const SPAWN_MARGIN = 140;

/** 1歩 = 1/60秒。可変にすると 120Hz の端末だけ難易度が変わる */
export const STEP_MS = 1000 / 60;

/**
 * 距離の見立て。端末で幅が違うので、実距離ではなく「画面何個ぶん進んだか」で
 * 数える。こうしないと、横に広い画面ほど記録が伸びてしまう。
 */
const M_PER_SCREEN = 30;

/**
 * 障害物が現れてからろぼとに届くまでの歩数。これが難易度そのもの。
 * 速さは距離ではなくここから逆算する。
 */
const REACT_START = 150;
const REACT_MIN = 94;
/** 関門と関門の間隔も、距離ではなく歩数で決める */
const GATE_STEPS_START = 108;
const GATE_STEPS_MIN = 78;

const GAP_START = 250;
const GAP_MIN = 172;
/** 難易度が上がりきるまでの歩数（およそ30秒）。これ以上は詰めない */
const DIFFICULTY_RAMP = 1800;
/** 速さが上がりきるまでの歩数（およそ45秒） */
const SPEED_RAMP = 2700;

/** 岩の柱の幅と、海藻の幅 */
const COLUMN_W = 104;
const KELP_W = 68;
/** 関門の上下に残す余白。狭くしすぎると天井際・海底際が理不尽になる */
const MARGIN = 34;

/**
 * 噴射で得る上向きの速さ。押すたびに入れ直す（積み増さない）ので、
 * 連打しても上がる高さは一定。1回でおよそ 75px、画面の高さの1割強ぶん浮く。
 */
const JET_V = 7.4;
/** 押しっぱなしで上がり続けないよう、噴射に間隔を空ける */
const JET_COOLDOWN = 7;

/** 力尽きてから「もう一度」を受け付けるまで。連打で事故らないように */
const DYING_STEPS = 52;
const OVER_LOCK_STEPS = 20;

export type Status = "ready" | "playing" | "dying" | "over";
export type ItemKind = "rock" | "kelp" | "vortex" | "drift" | "note";

export type Item = {
  body: Body;
  kind: ItemKind;
  w: number;
  h: number;
  /** 岩の柱のどちら側が尖っているか。柱でないものは null */
  tip: "up" | "down" | null;
  /** 揺れ・回転の位相。生成時にずらして、全部が同じ動きにならないようにする */
  phase: number;
  /** 海藻が回る軸（根元）の高さ。中心で回すと根が浮いてしまう */
  pivotY: number;
  taken: boolean;
};

export type Bubble = {
  x: number;
  y: number;
  r: number;
  vy: number;
  life: number;
  max: number;
};

export type World = {
  status: Status;
  /** この世界の幅。高さは WORLD_H で固定 */
  width: number;
  /** 進んだ距離（ワールドpx）。表示用のメートルは distanceM() で出す */
  travelled: number;
  notes: number;
  speed: number;
  robot: Body;
  /** 0 より大きいあいだは噴射中。絵を噴射の姿に差し替える目印 */
  jetting: number;
  items: Item[];
  bubbles: Bubble[];
  /** ぶつかったときの揺れ。描画側で減衰させながら使う */
  shake: number;
  /** 経過した歩数。揺れと回転の位相に使う（実時間だと歩と揃わない） */
  tick: number;
  reducedMotion: boolean;
};

export type Dive = {
  world: World;
  /** 1歩進める。RobotoDive.tsx が固定タイムステップで呼ぶ */
  step: () => void;
  /** タップ・クリック・Space。状態に応じて開始／噴射／再開に振り分ける */
  input: () => void;
  destroy: () => void;
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 画面の形から世界の幅を決める。極端な比のときだけ頭打ちにする */
export function worldWidthFor(boxW: number, boxH: number): number {
  const raw = WORLD_H * (boxW / Math.max(boxH, 1));
  return clamp(Math.round(raw), WORLD_W_MIN, WORLD_W_MAX);
}

/** 画面何個ぶん進んだかで数えるので、幅の違う端末でも記録を並べられる */
export function distanceM(world: World): number {
  return Math.floor((world.travelled / world.width) * M_PER_SCREEN);
}

export async function createDive(options: {
  width: number;
  reducedMotion: boolean;
}): Promise<Dive> {
  // ここで初めて物理エンジンが飛んでくる
  const Matter = await import("matter-js");
  const { Bodies, Body, Composite, Engine, Events } = Matter;

  const W = clamp(Math.round(options.width), WORLD_W_MIN, WORLD_W_MAX);
  const HOME_X = W * HOME_RATIO;
  /** 障害物が出てから手前に届くまでに進む距離。速さはこれを歩数で割って出す */
  const REACH = W + SPAWN_MARGIN - HOME_X;

  const engine = Engine.create();
  engine.gravity.y = 0.45;
  // 速い相手を抜けにくくしておく。取りこぼすと理不尽になる
  engine.positionIterations = 8;
  engine.velocityIterations = 6;

  /**
   * matter の重力は force に直接足される（mass × gravity.y × gravity.scale）。
   * 浮力はその打ち消しなので、同じ形で符号を逆にして入れる。
   * ratio 1 で重力とちょうど釣り合う。
   */
  function buoyancy(body: Body, ratio: number) {
    Body.applyForce(body, body.position, {
      x: 0,
      y: -body.mass * engine.gravity.y * engine.gravity.scale * ratio,
    });
  }

  const robot = Bodies.circle(HOME_X, WORLD_H * 0.4, ROBOT_R, {
    label: "robot",
    // 水の抵抗。これが効いていないと「落下」になって、水中に見えない
    frictionAir: 0.055,
    restitution: 0.4,
    friction: 0.02,
    density: 0.0016,
  });

  const WALL = 400;
  const ceiling = Bodies.rectangle(W / 2, -WALL / 2, W * 4, WALL, {
    isStatic: true,
    label: "ceiling",
    restitution: 0.5,
  });
  const floor = Bodies.rectangle(W / 2, WORLD_H + WALL / 2, W * 4, WALL, {
    isStatic: true,
    label: "floor",
  });

  Composite.add(engine.world, [robot, ceiling, floor]);

  const world: World = {
    status: "ready",
    width: W,
    travelled: 0,
    notes: 0,
    speed: REACH / REACT_START,
    robot,
    jetting: 0,
    items: [],
    bubbles: [],
    shake: 0,
    tick: 0,
    reducedMotion: options.reducedMotion,
  };

  /** body.id から Item を引く。衝突イベントが返してくるのは body だけなので */
  const byBody = new Map<number, Item>();
  let jetCooldown = 0;
  let vortexCooldown = 0;
  let lockLeft = 0;
  /** 次の関門までの残り歩数。1枚目は間を空けて、操作を試す時間を作る */
  let untilGate = 105;
  let gateIndex = 0;
  /** 直前の関門の隙間の高さ。次をここから離しすぎないために覚えておく */
  let lastCenter = WORLD_H * 0.4;
  /** 難易度は遊んでいる歩数で決める。距離だと端末の幅で変わってしまう */
  let played = 0;

  function progress(over: number): number {
    return Math.min(played / over, 1);
  }

  function addItem(item: Item) {
    world.items.push(item);
    byBody.set(item.body.id, item);
    Composite.add(engine.world, item.body);
  }

  function dropItem(item: Item) {
    item.taken = true;
    byBody.delete(item.body.id);
    Composite.remove(engine.world, item.body);
  }

  function base(kind: ItemKind, body: Body, w: number, h: number): Item {
    return {
      body,
      kind,
      w,
      h,
      tip: null,
      phase: Math.random() * Math.PI * 2,
      pivotY: 0,
      taken: false,
    };
  }

  /** 天井または海底から生える岩の柱 */
  function spawnColumn(x: number, top: number, bottom: number, tip: "up" | "down") {
    const h = bottom - top;
    const body = Bodies.rectangle(x, top + h / 2, COLUMN_W, h, {
      isStatic: true,
      label: "rock",
      chamfer: { radius: 16 },
    });
    addItem({ ...base("rock", body, COLUMN_W, h), tip });
  }

  function spawnKelp(x: number, height: number) {
    const body = Bodies.rectangle(x, WORLD_H - height / 2, KELP_W, height, {
      isStatic: true,
      label: "kelp",
      chamfer: { radius: KELP_W / 2 },
    });
    addItem({ ...base("kelp", body, KELP_W, height), pivotY: WORLD_H });
  }

  function spawnVortex(x: number, y: number) {
    const r = 50;
    const body = Bodies.circle(x, y, r, { isStatic: true, label: "vortex" });
    addItem(base("vortex", body, r * 2, r * 2));
  }

  function spawnDrift(x: number, y: number) {
    const w = 42 + Math.random() * 16;
    const body = Bodies.circle(x, y, w / 2, {
      label: "drift",
      // 押しのけられてほしいので軽く。回りっぱなしにならない程度に抵抗を入れる
      density: 0.0004,
      frictionAir: 0.03,
      restitution: 0.7,
    });
    addItem(base("drift", body, w, w));
  }

  function spawnNote(x: number, y: number) {
    const r = 21;
    const body = Bodies.circle(x, y, r, {
      isStatic: true,
      isSensor: true,
      label: "note",
    });
    addItem(base("note", body, r * 2, r * 2));
  }

  /** 関門をひとつ作る。上下で隙間をつくり、順番ごとに味付けを変える */
  function spawnGate() {
    const t = progress(DIFFICULTY_RAMP);
    const gap = lerp(GAP_START, GAP_MIN, t);
    const lo = MARGIN + gap / 2;
    const hi = WORLD_H - MARGIN - gap / 2;

    /*
     * 前の関門から縦に離しすぎない。端から端に振られると、横に流れてくる
     * あいだに届かず、腕前ではなく運になる。1回の噴射で高さの1割強ぶん浮くので、
     * 関門のあいだに動ける範囲をそこから見積もって頭を押さえる。
     *
     * 1枚目だけは、ろぼとが浮かんでいる高さのすぐ近くに出す。開始直後に
     * 端まで振られると、操作を覚える前に終わってしまう。
     */
    const reach = gateIndex === 0 ? 70 : WORLD_H * 0.42;
    const center = clamp(
      lastCenter + (Math.random() * 2 - 1) * reach,
      lo,
      Math.max(lo, hi),
    );
    lastCenter = center;

    const top = center - gap / 2;
    const bottom = center + gap / 2;
    const x = W + SPAWN_MARGIN;

    spawnColumn(x, -40, top, "down");

    // 3回に1回は下を海藻にする。揺れて隙間が動くので、通る間合いが変わる
    if (gateIndex % 3 === 2) {
      spawnKelp(x, WORLD_H - bottom + 40);
    } else {
      spawnColumn(x, bottom, WORLD_H + 40, "up");
    }

    if (gateIndex % 2 === 0) spawnNote(x, center);
    // 渦と漂流物は関門の先に置く。抜けた直後に姿勢を崩される
    if (gateIndex % 4 === 3) {
      const y = clamp(center + (Math.random() - 0.5) * 110, 70, WORLD_H - 70);
      spawnVortex(x + world.speed * 34, y);
    }
    if (gateIndex % 5 === 1) spawnDrift(x + world.speed * 22, center);

    gateIndex += 1;
  }

  function spawnBubbles(count: number, spread: number) {
    if (world.reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const max = 22 + Math.random() * 20;
      world.bubbles.push({
        x: robot.position.x + (Math.random() - 0.5) * spread,
        y: robot.position.y + ROBOT_R * 0.8 + Math.random() * 6,
        r: 2 + Math.random() * 4,
        vy: 0.7 + Math.random() * 1.5,
        life: max,
        max,
      });
    }
  }

  function kill() {
    if (world.status !== "playing") return;
    world.status = "dying";
    world.shake = 16;
    lockLeft = DYING_STEPS;
    // 力尽きた感じを出すため、ひと回ししてから沈ませる
    Body.setAngularVelocity(robot, (Math.random() - 0.5) * 0.5 + 0.22);
  }

  const onCollision = (event: IEventCollision<Engine>) => {
    if (world.status !== "playing") return;

    for (const pair of event.pairs) {
      const other =
        pair.bodyA === robot ? pair.bodyB : pair.bodyB === robot ? pair.bodyA : null;
      if (!other) continue;

      if (other.label === "rock" || other.label === "kelp" || other.label === "floor") {
        kill();
        return;
      }

      if (other.label === "note") {
        const item = byBody.get(other.id);
        if (item && !item.taken) {
          world.notes += 1;
          dropItem(item);
        }
        continue;
      }

      if (other.label === "vortex" && vortexCooldown <= 0) {
        // 渦は殺さない。代わりに弾いて姿勢を崩す
        const dx = robot.position.x - other.position.x;
        const dy = robot.position.y - other.position.y;
        const len = Math.hypot(dx, dy) || 1;
        Body.setVelocity(robot, {
          x: robot.velocity.x + (dx / len) * 3.8 - (dy / len) * 1.2,
          y: robot.velocity.y + (dy / len) * 3.8 + (dx / len) * 1.2,
        });
        Body.setAngularVelocity(robot, robot.angularVelocity + 0.3);
        world.shake = 11;
        vortexCooldown = 24;
      }
    }
  };

  Events.on(engine, "collisionStart", onCollision);

  function jet() {
    if (jetCooldown > 0) return;
    jetCooldown = JET_COOLDOWN;
    world.jetting = 10;
    // 積み増さずに入れ直す。連打しても上がる高さが一定になる
    Body.setVelocity(robot, { x: robot.velocity.x, y: -JET_V });
    Body.setAngularVelocity(robot, robot.angularVelocity - 0.06);
    spawnBubbles(5, ROBOT_R * 1.2);
  }

  function reset() {
    for (const item of world.items) {
      if (!item.taken) Composite.remove(engine.world, item.body);
    }
    world.items = [];
    world.bubbles = [];
    byBody.clear();
    world.travelled = 0;
    world.notes = 0;
    world.speed = REACH / REACT_START;
    world.shake = 0;
    world.jetting = 0;
    jetCooldown = 0;
    vortexCooldown = 0;
    untilGate = 105;
    gateIndex = 0;
    played = 0;
    lastCenter = WORLD_H * 0.4;
    Body.setPosition(robot, { x: HOME_X, y: WORLD_H * 0.4 });
    Body.setVelocity(robot, { x: 0, y: 0 });
    Body.setAngle(robot, 0);
    Body.setAngularVelocity(robot, 0);
  }

  function input() {
    if (world.status === "playing") {
      jet();
      return;
    }
    // 力尽きている途中と、その直後のひと呼吸は受け付けない
    if (world.status === "dying" || lockLeft > 0) return;
    reset();
    world.status = "playing";
    jet();
  }

  /** ろぼとを定位置に引き戻すばね。ぶつかって流されても戻ってこられる */
  function holdHome() {
    const dx = HOME_X - robot.position.x;
    Body.applyForce(robot, robot.position, {
      x: (dx * 0.0016 - robot.velocity.x * 0.006) * robot.mass,
      y: 0,
    });
  }

  /**
   * 進む向きに合わせて機体を傾ける。角度を直接入れると物理と喧嘩するので、
   * 目標角へ向かうトルクを掛けて、行き過ぎを角速度で抑える（PD制御）。
   */
  function tilt() {
    const target = clamp(robot.velocity.y * 0.09, -0.5, 0.5);
    robot.torque = (target - robot.angle) * 0.0022 - robot.angularVelocity * 0.0016;
  }

  function stepItems() {
    const t = world.tick / 60;

    for (const item of world.items) {
      if (item.taken) continue;

      if (item.kind === "drift") {
        // 押しのけられてほしいので、速度を固定せず弱い力で流す
        const dv = -world.speed - item.body.velocity.x;
        Body.applyForce(item.body, item.body.position, {
          x: dv * item.body.mass * 0.02,
          y: 0,
        });
        buoyancy(item.body, 0.94);
        continue;
      }

      Body.translate(item.body, { x: -world.speed, y: 0 });

      if (item.kind === "kelp") {
        // 根元を軸に揺らす。中心で回すと根が浮くので、軸のぶんだけ位置を戻す
        const angle = Math.sin(t * 1.3 + item.phase) * 0.17;
        Body.setAngle(item.body, angle);
        Body.setPosition(item.body, {
          x: item.body.position.x + Math.sin(angle) * (item.h / 2),
          y: item.pivotY - Math.cos(angle) * (item.h / 2),
        });
      } else if (item.kind === "vortex") {
        Body.setAngle(item.body, t * 2.4 + item.phase);
      } else if (item.kind === "note") {
        Body.setPosition(item.body, {
          x: item.body.position.x,
          y: item.body.position.y + Math.sin(t * 2 + item.phase) * 0.5,
        });
      }
    }

    // 流れ去ったものを捨てる。放っておくと剛体が増え続ける
    let swept = false;
    for (const item of world.items) {
      if (!item.taken && item.body.position.x < -260) {
        dropItem(item);
        swept = true;
      } else if (item.taken) {
        swept = true;
      }
    }
    if (swept) world.items = world.items.filter((item) => !item.taken);
  }

  function stepBubbles() {
    let expired = false;
    for (const bubble of world.bubbles) {
      bubble.y -= bubble.vy;
      bubble.x -= world.speed * 0.35;
      bubble.life -= 1;
      if (bubble.life <= 0) expired = true;
    }
    if (expired) world.bubbles = world.bubbles.filter((bubble) => bubble.life > 0);
  }

  function step() {
    world.tick += 1;
    if (jetCooldown > 0) jetCooldown -= 1;
    if (vortexCooldown > 0) vortexCooldown -= 1;
    if (world.jetting > 0) world.jetting -= 1;
    if (world.shake > 0.2) world.shake *= 0.88;
    else world.shake = 0;

    if (world.status === "playing") {
      played += 1;
      // 難しくなるとは、届くまでの歩数が縮むということ
      world.speed = REACH / lerp(REACT_START, REACT_MIN, progress(SPEED_RAMP));
      world.travelled += world.speed;

      untilGate -= 1;
      if (untilGate <= 0) {
        spawnGate();
        untilGate = Math.round(
          lerp(GATE_STEPS_START, GATE_STEPS_MIN, progress(DIFFICULTY_RAMP)),
        );
      }

      holdHome();
      tilt();
      /*
       * 深いほど押し返す。海底の手前が少し粘って、立て直す余地が残る。
       * ただし強すぎると、ふつうの連打で上がり続けて天井に張り付き、
       * 天井の高さには隙間が出ないので必ず柱に当たる——という詰みになる。
       * 高さを保てる連打の速さが毎秒2回前後に収まるところまで弱めてある。
       */
      const depth = Math.max(0, (robot.position.y - WORLD_H * 0.45) / (WORLD_H * 0.55));
      buoyancy(robot, depth * 0.25);
      if (world.jetting > 5) spawnBubbles(1, ROBOT_R);
    } else if (world.status === "dying") {
      lockLeft -= 1;
      if (lockLeft <= 0) {
        world.status = "over";
        lockLeft = OVER_LOCK_STEPS;
      }
    } else if (world.status === "over") {
      if (lockLeft > 0) lockLeft -= 1;
    } else {
      // ready のあいだは、その場でゆっくり漂わせておく
      buoyancy(robot, 1);
      Body.applyForce(robot, robot.position, {
        x: 0,
        y: Math.sin(world.tick / 42) * 0.00004 * robot.mass,
      });
      holdHome();
      tilt();
    }

    // 終わったあとは景色も止める。裏で流れ続ける必要がない
    if (world.status === "playing" || world.status === "dying") stepItems();
    stepBubbles();

    Engine.update(engine, STEP_MS);
  }

  function destroy() {
    Events.off(engine, "collisionStart", onCollision);
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    byBody.clear();
    world.items = [];
    world.bubbles = [];
  }

  return { world, step, input, destroy };
}
