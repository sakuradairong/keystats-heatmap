import { interpolateRgbBasis } from "d3-interpolate";
import { scaleSequential } from "d3-scale";

/**
 * Soft blue → peach → warm orange, matching the Bilibili keyboard heatmap look.
 * Unused keys stay near-white outside this scale.
 */
const HEAT_COLORS = [
  "#b7d4ef",
  "#c9dff2",
  "#dce8f0",
  "#ebe4c8",
  "#f3d9a0",
  "#f2c06a",
  "#ef9f3d",
  "#ea7d28",
  "#e2641d",
];

const interpolator = interpolateRgbBasis(HEAT_COLORS);

export function createHeatScale(maxCount: number) {
  const domainMax = Math.max(1, maxCount);
  return scaleSequential(interpolator).domain([0, domainMax]);
}

export function heatColor(count: number, maxCount: number): string {
  if (count <= 0) return "#f7f8fa";
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
  return luminance > 0.58 ? "#2a3340" : "#f8fafc";
}
