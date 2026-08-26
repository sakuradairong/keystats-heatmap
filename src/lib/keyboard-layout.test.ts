import { describe, expect, it } from "vitest";
import { KEYBOARD_LAYOUT, resolveKeyCount } from "./keyboard-layout";

describe("keyboard layout", () => {
  it("contains unique physical key ids", () => {
    const ids = KEYBOARD_LAYOUT.map((key) => key.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("maps generic modifiers only to the left physical key", () => {
    const counts = { Shift: 9, Ctrl: 7, Option: 5, Cmd: 3 };

    expect(resolveKeyCount("Shift", counts)).toBe(9);
    expect(resolveKeyCount("RShift", counts)).toBe(0);
    expect(resolveKeyCount("LCtrl", counts)).toBe(7);
    expect(resolveKeyCount("RCtrl", counts)).toBe(0);
    expect(resolveKeyCount("LAlt", counts)).toBe(5);
    expect(resolveKeyCount("RAlt", counts)).toBe(0);
    expect(resolveKeyCount("LWin", counts)).toBe(3);
    expect(resolveKeyCount("RWin", counts)).toBe(0);
  });

  it("uses explicit right-side modifier counts when available", () => {
    const counts = { Shift: 9, RShift: 2, Ctrl: 7, RCtrl: 3 };
    expect(resolveKeyCount("RShift", counts)).toBe(2);
    expect(resolveKeyCount("RCtrl", counts)).toBe(3);
  });

  it("resolves Enter and Menu aliases", () => {
    expect(resolveKeyCount("Return", { Enter: 4 })).toBe(4);
    expect(resolveKeyCount("Apps", { Menu: 2 })).toBe(2);
  });
});
