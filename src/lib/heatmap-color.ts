import { interpolateRgbBasis } from "d3-interpolate";
import { scaleSequential } from "d3-scale";

/** Bright soft blue → cream → amber → orange (reference heatmap) */
const HEAT_COLORS = [
  "#9ec9ef",
  "#b5d7f3",
  "#d2e4f2",
  "#e8e6d4",
  "#f3e2b0",
  "#f5cf72",
  "#f2b045",
  "#ef8f2c",
  "#ea6f1c",
  "#e45a14",
];

const interpolator = interpolateRgbBasis(HEAT_COLORS);

export function createHeatScale(maxCount: number) {
  const domainMax = Math.max(1, maxCount);
  // Slight power curve so mid-high keys warm up sooner like the reference
  return scaleSequential((t) => interpolator(Math.pow(t, 0.85))).domain([
    0,
    domainMax,
  ]);
}

export function heatColor(count: number, maxCount: number): string {
  if (count <= 0) return "#ffffff";
  return createHeatScale(maxCount)(count);
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

export function contrastText(bg: string): string {
  const normalized = bg.replace("#", "");
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
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#3a4553" : "#ffffff";
}
