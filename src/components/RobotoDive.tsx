"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playPage } from "@/content/site";
import {
  STEP_MS,
  WORLD_H,
  createDive,
  distanceM,
  worldWidthFor,
  type Dive,
  type Status,
} from "@/game/dive";
import { draw, loadSprites, type Sprites } from "@/game/draw";

/**
 * ゲームと画面のあいだ。canvas の大きさ、入力、ループ、記録の保存を持つ。
 * 物理は @/game/dive、絵は @/game/draw。
 *
 * 物理エンジンと画像は「あそぶ」を押すまで読み込まない。開いただけの人には
 * 配らないでおきたいので、ここが唯一の入口になっている。
 */

const BEST_KEY = "arial.dive.best";

type Best = { distance: number; notes: number };

/** 記録は端末ごと。読めない設定のブラウザもあるので、失敗しても素通りさせる */
function readBest(): Best | null {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { distance, notes } = parsed as Partial<Best>;
    if (typeof distance !== "number") return null;
    return { distance, notes: typeof notes === "number" ? notes : 0 };
  } catch {
    return null;
  }
}

function writeBest(best: Best) {
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // 保存できなくても遊べる。記録が残らないだけ
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RobotoDive() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const distRef = useRef<HTMLSpanElement | null>(null);
  const noteRef = useRef<HTMLSpanElement | null>(null);

  const diveRef = useRef<Dive | null>(null);
  const spritesRef = useRef<Sprites | null>(null);
  const rafRef = useRef(0);
  /** 描画に必要な採寸。ループの中で毎フレーム読む */
  const viewRef = useRef({ scale: 1, dpr: 1, offsetX: 0, offsetY: 0 });
  /** HUD は React を通さず直接書き換える。1秒に60回の再描画を避けるため */
  const shownRef = useRef({ dist: -1, notes: -1 });
  const statusRef = useRef<Status>("ready");

  const [phase, setPhase] = useState<"cold" | "loading" | "live">("cold");
  const [status, setStatus] = useState<Status>("ready");
  const [best, setBest] = useState<Best | null>(null);
  const [result, setResult] = useState<Best | null>(null);

  useEffect(() => setBest(readBest()), []);

  /** canvas の実ピクセル数と倍率を、いまの箱の大きさから決め直す */
  const measure = useCallback(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const dive = diveRef.current;
    if (!box || !canvas) return;

    const rect = box.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    // 3倍の端末で3倍のピクセルを塗るのは高くつく割に見た目が変わらない
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const worldW = dive ? dive.world.width : worldWidthFor(w, h);
    // ふつうは縦横どちらかがぴったり合う。極端な比のときだけ余白が出る
    const scale = Math.min(w / worldW, h / WORLD_H);
    viewRef.current = {
      scale,
      dpr,
      offsetX: (w - worldW * scale) / 2,
      offsetY: (h - WORLD_H * scale) / 2,
    };
  }, []);

  /** ワールドを作り直す。画面の形が大きく変わったときだけ呼ぶ */
  const build = useCallback(async () => {
    const box = boxRef.current;
    if (!box) return null;
    const rect = box.getBoundingClientRect();
    const dive = await createDive({
      width: worldWidthFor(rect.width, rect.height),
      reducedMotion: prefersReducedMotion(),
    });
    diveRef.current?.destroy();
    diveRef.current = dive;
    measure();
    return dive;
  }, [measure]);

  /** 押された。読み込み前なら読み込みから、あとは開始／噴射／再開 */
  const press = useCallback(() => {
    if (phase === "loading") return;
    if (phase === "live") {
      diveRef.current?.input();
      return;
    }

    setPhase("loading");
    void Promise.all([build(), loadSprites()]).then(([dive, sprites]) => {
      spritesRef.current = sprites;
      setPhase("live");
      dive?.input();
    });
  }, [build, phase]);

  // ループ。固定タイムステップで物理を進め、余りは次のフレームへ繰り越す
  useEffect(() => {
    if (phase !== "live") return;

    let last = performance.now();
    let acc = 0;

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const dive = diveRef.current;
      const sprites = spritesRef.current;
      const canvas = canvasRef.current;
      if (!dive || !sprites || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // タブに戻ってきたときに一気に進まないよう、遅れは切り捨てる
      const delta = Math.min(now - last, 250);
      last = now;
      acc += delta;

      let steps = 0;
      while (acc >= STEP_MS && steps < 5) {
        dive.step();
        acc -= STEP_MS;
        steps += 1;
      }
      if (steps >= 5) acc = 0;

      const { world } = dive;
      const dist = distanceM(world);
      if (dist !== shownRef.current.dist && distRef.current) {
        distRef.current.textContent = String(dist);
        shownRef.current.dist = dist;
      }
      if (world.notes !== shownRef.current.notes && noteRef.current) {
        noteRef.current.textContent = String(world.notes);
        shownRef.current.notes = world.notes;
      }

      if (world.status !== statusRef.current) {
        statusRef.current = world.status;
        setStatus(world.status);
        if (world.status === "over") {
          const run = { distance: dist, notes: world.notes };
          setResult(run);
          setBest((prev) => {
            if (prev && prev.distance >= run.distance) return prev;
            writeBest(run);
            return run;
          });
        }
      }

      const view = viewRef.current;
      draw(ctx, world, sprites, view.scale, view.dpr, view.offsetX, view.offsetY);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // 箱の大きさが変わったら測り直す。端末を回して形が大きく変わったときは、
  // 遊んでいないあいだに限ってワールドごと作り直す（縦長・横長でアリーナが変わる）
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    let timer = 0;
    const observer = new ResizeObserver(() => {
      measure();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const dive = diveRef.current;
        if (!dive) return;
        if (dive.world.status === "playing" || dive.world.status === "dying") return;
        const rect = box.getBoundingClientRect();
        const want = worldWidthFor(rect.width, rect.height);
        if (Math.abs(want - dive.world.width) / dive.world.width < 0.08) return;
        void build();
      }, 250);
    });

    observer.observe(box);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [build, measure]);

  // キーボード。遊んでいるあいだだけ拾って、ページのスクロールを止める
  useEffect(() => {
    if (phase !== "live") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "Enter") {
        return;
      }
      if (event.repeat) return;
      event.preventDefault();
      diveRef.current?.input();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  useEffect(() => () => diveRef.current?.destroy(), []);

  const showStart = phase !== "live";
  const showOver = phase === "live" && status === "over";

  return (
    <div className="dive">
      <div className="dive__hud" aria-hidden="true">
        <p className="dive__stat">
          <span ref={distRef}>0</span> m
        </p>
        <p className="dive__stat dive__stat--notes">
          ♪ <span ref={noteRef}>0</span>
        </p>
        {best ? (
          <p className="dive__stat dive__stat--best">
            さいこう {best.distance} m
          </p>
        ) : null}
      </div>

      <div className="dive__box" ref={boxRef}>
        <canvas
          className="dive__canvas"
          ref={canvasRef}
          onPointerDown={(event) => {
            event.preventDefault();
            press();
          }}
          onContextMenu={(event) => event.preventDefault()}
        />

        {showStart ? (
          <div className="dive__overlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="dive__poster"
              src="/game/roboto.webp"
              alt=""
              width={112}
              height={137}
            />
            <p className="dive__lead">{playPage.lead}</p>
            <button
              type="button"
              className="dive__button"
              onClick={press}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "よみこみ中…" : playPage.start}
            </button>
            <p className="dive__hint">{playPage.hint}</p>
          </div>
        ) : null}

        {showOver ? (
          <div className="dive__overlay dive__overlay--over">
            <p className="dive__resultHead">{playPage.over}</p>
            <p className="dive__result" role="status">
              {result ? `${result.distance} m ／ 音符 ${result.notes}` : null}
            </p>
            {best ? <p className="dive__hint">さいこう記録 {best.distance} m</p> : null}
            <button type="button" className="dive__button" onClick={press}>
              {playPage.retry}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
