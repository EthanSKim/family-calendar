"use client";
import { useEffect, useRef } from "react";

export type Kind =
  "sun" | "part" | "cloud" | "fog" | "rain" | "shower" | "snow" | "storm";

// Weather code (WMO, from Open-Meteo) -> which picture + Korean label
export function kindFor(code: number): { kind: Kind; text: string } {
  if (code === 0) return { kind: "sun", text: "맑음" };
  if (code === 1) return { kind: "part", text: "대체로 맑음" };
  if (code === 2) return { kind: "part", text: "구름 많음" };
  if (code === 3) return { kind: "cloud", text: "흐림" };
  if (code <= 48) return { kind: "fog", text: "안개" };
  if (code <= 67) return { kind: "rain", text: "비" };
  if (code <= 77) return { kind: "snow", text: "눈" };
  if (code <= 82) return { kind: "shower", text: "소나기" };
  if (code <= 86) return { kind: "snow", text: "눈" };
  return { kind: "storm", text: "뇌우" };
}

/* ---- tiny 32x32 pixel scenes, redrawn ~8 times a second ---- */
const W = 32;
type C = string | null;
type Pal = { f: string; h: string; s: string; o: string };
let buf: C[] = [];
let t = 0;
let night = false;

const BG: Record<Kind, string> = {
  sun: "#CBE7F8",
  part: "#CBE7F8",
  cloud: "#B9C7D6",
  fog: "#CDD3D9",
  rain: "#9FB4C8",
  shower: "#A9BED2",
  snow: "#B3C6DA",
  storm: "#667790",
};
const BGN: Record<Kind, string> = {
  sun: "#2F3A4F",
  part: "#2F3A4F",
  cloud: "#3A4558",
  fog: "#3D4859",
  rain: "#2A3446",
  shower: "#2A3446",
  snow: "#3A4A60",
  storm: "#1B2331",
};

const put = (x: number, y: number, c: C) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && y >= 0 && x < W && y < W) buf[y * W + x] = c;
};
const disc = (cx: number, cy: number, r: number, c: C) => {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.6) put(cx + x, cy + y, c);
};
const bob = (p: number) => Math.round(Math.sin((t / p) * 2 * Math.PI));

const pal = (): { w: Pal; g: Pal; d: Pal } =>
  night
    ? {
        w: { f: "#C9D2DF", h: "#D8DFEA", s: "#A9B5C6", o: "#6B7A91" },
        g: { f: "#9AA6B8", h: "#A8B3C3", s: "#7F8CA1", o: "#566379" },
        d: { f: "#6F7B8F", h: "#7B879A", s: "#5A667A", o: "#39455A" },
      }
    : {
        w: { f: "#FFFFFF", h: "#FFFFFF", s: "#DDE6EF", o: "#9FB3C8" },
        g: { f: "#D3DCE6", h: "#DDE5EE", s: "#B4C0CE", o: "#7F90A5" },
        d: { f: "#8E9BAE", h: "#9DAABB", s: "#76849A", o: "#4D5A70" },
      };

function cloud(cx: number, cy: number, p: Pal) {
  const m = new Set<string>();
  const add = (x: number, y: number) => m.add(x + "," + y);
  const circ = (ox: number, oy: number, r: number) => {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r + r * 0.6) add(cx + ox + x, cy + oy + y);
  };
  circ(-6, 1, 4);
  circ(0, -2, 6);
  circ(6, 1, 4);
  for (let x = -9; x <= 9; x++)
    for (let y = 1; y <= 5; y++) add(cx + x, cy + y);
  m.forEach((k) => {
    const [x, y] = k.split(",").map(Number);
    const edge =
      !m.has(x + 1 + "," + y) ||
      !m.has(x - 1 + "," + y) ||
      !m.has(x + "," + (y + 1)) ||
      !m.has(x + "," + (y - 1));
    put(x, y, edge ? p.o : y >= cy + 3 ? p.s : y <= cy - 3 ? p.h : p.f);
  });
}

function sun(cx: number, cy: number, r: number) {
  const pulse = t % 8 < 4 ? 0 : 1; // the glow breathes
  for (let y = -r - 3; y <= r + 3; y++)
    for (let x = -r - 3; x <= r + 3; x++) {
      const d = x * x + y * y;
      if (
        d <= (r + 2 + pulse) ** 2 &&
        d > r * r &&
        (x + y + 2 * r + 10) % 2 === 0
      )
        put(cx + x, cy + y, "#FFF1B8"); // dithered halo
    }
  const diag = (t >> 1) & 1; // rays flip between + and x
  const a = r + 3;
  const s = diag ? Math.round(a * 0.72) : a;
  const dirs = diag
    ? [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]
    : [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
  dirs.forEach(([dx, dy]) => {
    for (let i = 0; i < 2; i++)
      put(cx + dx * (s + i), cy + dy * (s + i), "#FFC933");
  });
  disc(cx, cy, r, "#F2A81D");
  disc(cx, cy, r - 1, "#FFD54A");
  disc(cx - 1, cy - 1, Math.max(1, r - 3), "#FFE88A");
}

function moon(cx: number, cy: number, r: number) {
  disc(cx, cy, r, "#FFF2C2");
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if ((x - 3) ** 2 + (y + 2) ** 2 <= (r - 1) ** 2 + r * 0.6)
        put(cx + x, cy + y, null);
  put(cx - 3, cy + 2, "#E6D49A");
  put(cx - 2, cy + 3, "#E6D49A");
}

const STARS: [number, number][] = [
  [5, 6],
  [26, 8],
  [22, 4],
  [8, 24],
  [27, 24],
  [14, 3],
  [3, 15],
];
function stars() {
  STARS.forEach(([x, y], i) => {
    const k = (t + i * 2) % 6; // twinkle
    if (k < 2) {
      put(x, y, "#FFF6D8");
      put(x - 1, y, "#9AA7C0");
      put(x + 1, y, "#9AA7C0");
      put(x, y - 1, "#9AA7C0");
      put(x, y + 1, "#9AA7C0");
    } else put(x, y, k < 4 ? "#E8E2C8" : "#7A86A0");
  });
}

function body(cx: number, cy: number, r: number) {
  if (night) {
    stars();
    moon(cx, cy, r + 2);
  } else sun(cx, cy, r);
}

function drops(
  xs: number[],
  y0: number,
  sp: number,
  slant: boolean,
  col: string,
) {
  xs.forEach((x, i) => {
    const p = (t * sp + i * 5) % 13;
    const y = y0 + p;
    const sx = slant ? Math.floor(p / 3) : 0;
    if (y <= 30) {
      put(x + sx, y, col);
      put(x + sx, y + 1, col);
    }
    if (p === 12) {
      put(x - 1, 31, "#8FC1EA");
      put(x + 1, 31, "#8FC1EA");
    } // splash
  });
}

const SCENES: Record<Kind, () => void> = {
  sun: () => body(16, 16, 5),
  part: () => {
    body(11, 11, 4);
    cloud(18 + bob(16), 19, pal().w);
  },
  cloud: () => {
    cloud(21 - bob(24), 10, pal().g);
    cloud(13 + bob(16), 19, pal().w);
  },
  fog: () => {
    disc(22, 9, 4, night ? "#56627A" : "#EFE6C8");
    for (let i = 0; i < 5; i++) {
      const y = 10 + i * 4;
      const off = (t * (i % 2 ? 1 : -1) + i * 5 + 160) % 16;
      const c = night
        ? i % 2
          ? "#7C889C"
          : "#657188"
        : i % 2
          ? "#F4F7FA"
          : "#E6EBF0";
      for (let x = 0; x < W; x++)
        if ((x + off) % 16 < 11) {
          put(x, y, c);
          put(x, y + 1, c);
        }
    }
  },
  rain: () => {
    cloud(16, 11, pal().g);
    drops([7, 11, 15, 19, 23, 27], 18, 2, false, "#5B9BD5");
  },
  shower: () => {
    if (night) moon(9, 9, 4);
    else sun(9, 9, 3);
    cloud(18, 12, pal().g);
    drops([11, 15, 19, 23, 27, 13, 21, 25], 19, 2, true, "#5B9BD5");
  },
  snow: () => {
    for (let x = 0; x < W; x++) {
      const top = 30 - ((x * 7) % 3 === 0 ? 1 : 0);
      for (let y = top; y < W; y++) put(x, y, y === 31 ? "#DDE6EF" : "#FFFFFF");
    }
    cloud(16, 11, pal().g);
    [5, 9, 13, 17, 21, 25, 7, 15, 23, 28].forEach((x0, i) => {
      const p = (t + i * 3) % 13;
      const y = 18 + p;
      const x = x0 + Math.round(Math.sin((t + i * 2) / 3));
      put(x, y, "#FFFFFF");
      if (i % 3 === 0) {
        put(x - 1, y, "#FFFFFF");
        put(x + 1, y, "#FFFFFF");
        put(x, y - 1, "#FFFFFF");
        put(x, y + 1, "#FFFFFF");
      }
    });
  },
  storm: () => {
    cloud(16, 11, pal().d);
    drops([8, 24, 12], 18, 3, false, "#7FB6E8");
    const k = t % 12; // lightning flickers
    if (k === 0 || k === 1 || k === 3)
      (
        [
          [3, 0],
          [4, 0],
          [2, 1],
          [3, 1],
          [1, 2],
          [2, 2],
          [3, 2],
          [4, 2],
          [3, 3],
          [4, 3],
          [2, 4],
          [3, 4],
          [1, 5],
        ] as [number, number][]
      ).forEach(([x, y]) => put(14 + x, 17 + y, "#FFE45E"));
  },
};

export function renderWeather(
  ctx: CanvasRenderingContext2D,
  kind: Kind,
  isNight: boolean,
  frame: number,
) {
  night = isNight;
  t = frame;
  buf = new Array(W * W).fill(null);
  SCENES[kind]();
  const flash = kind === "storm" && t % 12 === 0; // the sky lights up with the bolt
  ctx.fillStyle = flash
    ? night
      ? "#55657F"
      : "#B9C4D6"
    : (night ? BGN : BG)[kind];
  ctx.fillRect(0, 0, W, W);
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (c) {
      ctx.fillStyle = c;
      ctx.fillRect(i % W, Math.floor(i / W), 1, 1);
    }
  }
}

// A 32x32 canvas that CSS scales up with crisp pixels. Moves ~8 times a second,
// pauses while the screen is hidden, and stays still if the device asks for less motion.
export default function PixelWeather({
  kind,
  night: isNight,
  className,
}: {
  kind: Kind;
  night: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    renderWeather(ctx, kind, isNight, frame);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      frame++;
      renderWeather(ctx, kind, isNight, frame);
    }, 125);
    return () => clearInterval(id);
  }, [kind, isNight]);
  return (
    <canvas
      ref={ref}
      width={W}
      height={W}
      className={className}
      aria-hidden="true"
    />
  );
}
