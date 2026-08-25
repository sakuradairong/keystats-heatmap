import { interpolateRgb } from "d3-interpolate";

/**
 * Pastel heat stops: soft sky blue → pale cream → peach → orange.
 */
const STOPS: Array<[number, string]> = [
  [0, "#b9d6f2"],
  [0.12, "#c5ddf4"],
  [0.28, "#d7e5ef"],
  [0.42, "#e6e4d4"],
  [0.55, "#f0dfb0"],
  [0.68, "#f3c978"],
  [0.8, "#f0a84a"],
  [0.9, "#eb8630"],
  [1, "#e56a1c"],
];

function sampleHeat(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const [aT, aC] = STOPS[i];
    const [bT, bC] = STOPS[i + 1];
    if (x >= aT && x <= bT) {
      const local = (x - aT) / (bT - aT || 1);
      return rgbToHex(interpolateRgb(aC, bC)(local));
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function parseColor(input: string): { r: number; g: number; b: number } {
  const value = (input || "").trim();
  const rgbMatch = value.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  const normalized = value.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6);
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) {
    return { r: 200, g: 210, b: 220 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(input: string | { r: number; g: number; b: number }): string {
  const { r, g, b } =
    typeof input === "string" ? parseColor(input) : input;
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function heatColor(count: number, maxCount: number): string {
  if (count <= 0) return "#e4eef6";
  const domainMax = Math.max(1, maxCount);
  const t = Math.sqrt(count / domainMax);
  return sampleHeat(t);
}

export function darkenHex(color: string, amount = 0.22): string {
  const { r, g, b } = parseColor(color);
  const factor = 1 - amount;
  return rgbToHex({ r: r * factor, g: g * factor, b: b * factor });
}

/** Reference uses dark ink on pastel keycaps */
export function contrastText(): string {
  return "#2b3340";
}
