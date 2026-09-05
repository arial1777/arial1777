"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * ページの「動き」のうち、CSS だけでは決められないところを受け持つ。
 * 画面には何も描かない（return null）。サイト共通レイアウトに一つ置く。
 *
 *  1. スクロールしてきた要素を出す（[data-reveal] → [data-revealed]）
 *  2. ヘッダーを縮める（html[data-scrolled]）
 *  3. ヒーローの光をポインタに追わせる（--mx / --my）
 *  4. 開幕アニメーションを飛ばす（触られたら html[data-intro="skip"]）
 *  5. ページを移ったときに本文をひと呼吸で入れ替える（#main[data-nav]）
 *
 * JS が動かない環境では何も起きない。出現前の状態は html[data-js="on"] が
 * 付いているときにしか作らないので（motion.css）、中身は最初から見えている。
 */

/** 幕（Intro）が退場しきるまでの目安。これを過ぎたら「飛ばす」操作は受け付けない */
const INTRO_MS = 1900;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MotionRuntime() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  // 1. スクロールで出す
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        el.setAttribute("data-revealed", "");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      // 画面に入りきる少し手前ではなく、下から12%ぶん入ってから出す。
      // 端に半分かかった状態で動き始めると、視線の外で終わってしまうため。
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    let queued = false;
    const scan = () => {
      queued = false;
      document
        .querySelectorAll("[data-reveal]:not([data-revealed])")
        .forEach((el) => observer.observe(el));
    };
    scan();

    // 曲のしぼりこみのように、後から現れる要素を取りこぼさないため。
    // 打鍵のたびに呼ばれるので、1フレームに1回へまとめる。
    const mutations = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  // 2. ヘッダー
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      document.documentElement.dataset.scrolled = window.scrollY > 24 ? "1" : "0";
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 3. ヒーローの光。指で触る端末には出さない（触れた場所に貼り付いて残るため）
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;

    let frame = 0;
    let x = "50%";
    let y = "40%";

    const onMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      x = `${((event.clientX - rect.left) / rect.width) * 100}%`;
      y = `${((event.clientY - rect.top) / rect.height) * 100}%`;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        hero.style.setProperty("--mx", x);
        hero.style.setProperty("--my", y);
      });
    };

    hero.addEventListener("pointermove", onMove);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // 4. 開幕を飛ばす
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro === "skip") return;

    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const stop = () => {
      for (const type of events) window.removeEventListener(type, skip);
      window.clearTimeout(timer);
    };
    // 幕が明けた後に skip を立てると、--intro-hold が変わって
    // 終わったはずのアニメーションが遅延ごと再生され直す。だから明けたら外す。
    const skip = () => {
      root.dataset.intro = "skip";
      stop();
    };
    const timer = window.setTimeout(stop, INTRO_MS);

    for (const type of events) {
      window.addEventListener(type, skip, { passive: true, once: true });
    }
    return stop;
  }, []);

  // 5. ページを移ったとき
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const main = document.getElementById("main");
    if (!main || prefersReducedMotion()) return;

    main.removeAttribute("data-nav");
    // 属性を付け直すだけでは同じアニメーションが再生されない。
    // レイアウトを一度読んで、ブラウザに「別の再生」だと分からせる。
    void main.offsetWidth;
    main.setAttribute("data-nav", "in");
  }, [pathname]);

  return null;
}
