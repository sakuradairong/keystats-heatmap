import { interpolateRgb } from "d3-interpolate";
import { scaleLinear } from "d3-scale";

/**
 * Pastel heat stops matching the Bilibili keyboard viz:
 * soft sky blue → pale cream → peach → vivid orange.
 * Kept deliberately light — no navy/charcoal midtones.
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
      return interpolateRgb(aC, bC)(local);
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export function createHeatScale(maxCount: number) {
  const domainMax = Math.max(1, maxCount);
  // Sqrt domain spreads mid-frequency keys into warmer tones like the reference
  return scaleLinear()
    .domain([0, Math.sqrt(domainMax)])
    .range([0, 1])
    .clamp(true);
}

export function heatColor(count: number, maxCount: number): string {
  if (count <= 0) return "#e8f0f8";
  const t = createHeatScale(maxCount)(Math.sqrt(count)) as number;
  return sampleHeat(t);
}

export function darkenHex(hex: string, amount = 0.22): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const factor = 1 - amount;
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * factor)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Reference uses dark ink on pastel keycaps */
export function contrastText(_bg: string): string {
  return "#2b3340";
}
