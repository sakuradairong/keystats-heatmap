import { describe, expect, it } from "vitest";
import {
  contrastForTesting,
  contrastText,
  heatColor,
  heatDomain,
  IDLE_KEY_COLOR,
  normalizeHeatCount,
} from "./heatmap-color";

describe("heat scale", () => {
  it("keeps zero counts neutral and positive counts in the heat ramp", () => {
    expect(heatColor(0, 100)).toBe(IDLE_KEY_COLOR);
    expect(heatColor(1, 100)).not.toBe(IDLE_KEY_COLOR);
  });

  it("uses a robust percentile instead of a single extreme maximum", () => {
    const counts = [...Array.from({ length: 19 }, (_, index) => index + 1), 10_000];
    expect(heatDomain(counts)).toBe(19);
  });

  it("normalizes monotonically and clamps outliers", () => {
    const values = [0, 1, 10, 100, 10_000].map((count) =>
      normalizeHeatCount(count, 100)
    );
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(1);
  });

  it("keeps the generated text color readable", () => {
    for (const count of [0, 1, 25, 50, 100]) {
      const background = heatColor(count, 100);
      const text = contrastText(background);
      expect(contrastForTesting(background, text)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
