import { interpolateRgbBasis } from "d3-interpolate";
import { scaleSequential } from "d3-scale";

/** Cool blue → warm yellow → hot orange, matching the reference heatmap */
const HEAT_COLORS = [
  "#7eb6e8",
  "#8ec8ef",
  "#a8d8c0",
  "#d4e87a",
  "#f0d84a",
  "#f5b83d",
  "#f08a2e",
  "#e85d1f",
  "#d94816",
];

const interpolator = interpolateRgbBasis(HEAT_COLORS);

export function createHeatScale(maxCount: number) {
  const domainMax = Math.max(1, maxCount);
  return scaleSequential(interpolator).domain([0, domainMax]);
}

export function heatColor(count: number, maxCount: number): string {
  if (count <= 0) return "#c9d7e8";
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
  return luminance > 0.62 ? "#1a2332" : "#f7fafc";
}
