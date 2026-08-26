import { interpolateLab } from "d3-interpolate";

export const IDLE_KEY_COLOR = "#d6dadc";
export const HEAT_RAMP = ["#d6966d", "#c6683b", "#a33f19", "#6d250e"] as const;

const HEAT_STOPS: Array<[number, string]> = [
  [0, HEAT_RAMP[0]],
  [0.36, HEAT_RAMP[1]],
  [0.7, HEAT_RAMP[2]],
  [1, HEAT_RAMP[3]],
];

type Rgb = { r: number; g: number; b: number };

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function parseColor(input: string): Rgb | null {
  const value = (input || "").trim();
  const rgbMatch = value.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i
  );
  if (rgbMatch) {
    const channels = rgbMatch.slice(1, 4).map(Number);
    if (channels.every(Number.isFinite)) {
      return {
        r: clamp(channels[0], 0, 255),
        g: clamp(channels[1], 0, 255),
        b: clamp(channels[2], 0, 255),
      };
    }
  }

  const hex = value.replace(/^#/, "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  const numeric = Number.parseInt(full, 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function rgbToHex(color: Rgb): string {
  const toHex = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function sampleHeat(normalized: number): string {
  const value = clamp(normalized);
  for (let index = 0; index < HEAT_STOPS.length - 1; index += 1) {
    const [startValue, startColor] = HEAT_STOPS[index];
    const [endValue, endColor] = HEAT_STOPS[index + 1];
    if (value >= startValue && value <= endValue) {
      const segment = (value - startValue) / (endValue - startValue || 1);
      const parsed = parseColor(interpolateLab(startColor, endColor)(segment));
      return parsed ? rgbToHex(parsed) : startColor;
    }
  }
  return HEAT_STOPS.at(-1)![1];
}

export function heatDomain(counts: number[], percentile = 0.95): number {
  const positive = counts
    .filter((count) => Number.isFinite(count) && count > 0)
    .sort((a, b) => a - b);
  if (positive.length === 0) return 1;

  const rank = Math.ceil(clamp(percentile) * positive.length) - 1;
  return Math.max(1, positive[clamp(rank, 0, positive.length - 1)]);
}

export function normalizeHeatCount(count: number, domainMax: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  const domain = Math.max(1, Number.isFinite(domainMax) ? domainMax : 1);
  const logarithmic = clamp(Math.log1p(count) / Math.log1p(domain));
  return logarithmic ** 1.45;
}

export function heatColor(count: number, domainMax: number): string {
  if (!Number.isFinite(count) || count <= 0) return IDLE_KEY_COLOR;
  return sampleHeat(normalizeHeatCount(count, domainMax));
}

export function darkenHex(color: string, amount = 0.22): string {
  const parsed = parseColor(color);
  if (!parsed) return color;
  const factor = 1 - clamp(amount);
  return rgbToHex({
    r: parsed.r * factor,
    g: parsed.g * factor,
    b: parsed.b * factor,
  });
}

function relativeLuminance(color: Rgb): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastText(background: string): string {
  const color = parseColor(background);
  if (!color) return "#121920";
  const dark = parseColor("#121920")!;
  const light = parseColor("#fffaf5")!;
  return contrastRatio(color, dark) >= contrastRatio(color, light)
    ? "#121920"
    : "#fffaf5";
}

export function contrastForTesting(a: string, b: string): number {
  const first = parseColor(a);
  const second = parseColor(b);
  return first && second ? contrastRatio(first, second) : 0;
}
