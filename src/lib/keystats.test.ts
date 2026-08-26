import { describe, expect, it } from "vitest";
import {
  aggregateKeyboardHeatmapCounts,
  getDayFromExport,
  listAvailableDates,
  parseKeyStatsExport,
  preferActiveDate,
  topKeys,
} from "./keystats";

describe("parseKeyStatsExport", () => {
  it("accepts a direct daily record and discards unrelated telemetry", () => {
    const payload = parseKeyStatsExport({
      date: "2026-08-25T10:00:00Z",
      keyPresses: 12,
      keyPressCounts: { A: 4 },
      appStats: { editor: { keyPresses: 12 } },
      mouseDistance: 999,
    });

    expect(payload.currentStats).toEqual({
      date: "2026-08-25",
      keyPresses: 12,
      keyPressCounts: { A: 4 },
    });
    expect(payload.currentStats).not.toHaveProperty("appStats");
  });

  it("accepts a direct history map and sorts its dates", () => {
    const payload = parseKeyStatsExport({
      "2026-08-03": {
        date: "2026-08-03",
        keyPresses: 3,
        keyPressCounts: { C: 3 },
      },
      "2026-08-01": {
        date: "2026-08-01",
        keyPresses: 1,
        keyPressCounts: { A: 1 },
      },
    });

    expect(listAvailableDates(payload)).toEqual(["2026-08-01", "2026-08-03"]);
    expect(payload.currentStats.date).toBe("2026-08-03");
  });

  it("lets currentStats replace the same history date", () => {
    const payload = parseKeyStatsExport({
      version: 1,
      currentStats: {
        date: "2026-08-02",
        keyPresses: 8,
        keyPressCounts: { B: 8 },
      },
      history: {
        "2026-08-02": {
          date: "2026-08-02",
          keyPresses: 2,
          keyPressCounts: { A: 2 },
        },
      },
    });

    expect(payload.history["2026-08-02"].keyPressCounts).toEqual({ B: 8 });
  });

  it.each([null, [], "bad", 42])("rejects invalid roots: %j", (value) => {
    expect(() => parseKeyStatsExport(value)).toThrow("根节点必须是对象");
  });

  it("rejects empty wrapper exports", () => {
    expect(() => parseKeyStatsExport({ history: {} })).toThrow(
      "未找到 currentStats 或 history 数据"
    );
  });

  it("rejects malformed keyPressCounts instead of inventing counts", () => {
    for (const keyPressCounts of [[], { A: true }, { B: "12" }, { C: null }]) {
      expect(() =>
        parseKeyStatsExport({
          date: "2026-08-01",
          keyPresses: 100,
          keyPressCounts,
        })
      ).toThrow("无法解析日统计文件");
    }

    expect(() =>
      parseKeyStatsExport({
        currentStats: {
          date: "2026-08-01",
          keyPresses: 100,
          keyPressCounts: [],
        },
        history: {},
      })
    ).toThrow("未找到 currentStats 或 history 数据");
  });

  it("rejects array-shaped history", () => {
    expect(() =>
      parseKeyStatsExport({
        history: [
          {
            date: "2026-08-01",
            keyPresses: 1,
            keyPressCounts: { A: 1 },
          },
        ],
      })
    ).toThrow("history 必须是以日期为键的对象");
  });

  it("rejects coerced totals and mismatched history dates", () => {
    for (const keyPresses of [true, "12", -1, Number.NaN]) {
      expect(() =>
        parseKeyStatsExport({
          date: "2026-08-01",
          keyPresses,
          keyPressCounts: { A: 1 },
        })
      ).toThrow("无法解析日统计文件");
    }

    expect(() =>
      parseKeyStatsExport({
        history: {
          "2026-12-31": {
            date: "2026-01-01",
            keyPresses: 5,
            keyPressCounts: { A: 5 },
          },
        },
      })
    ).toThrow("history 日期不一致");
  });
});

describe("daily selection and totals", () => {
  it("selects the newest day with real activity", () => {
    const payload = parseKeyStatsExport({
      version: 1,
      currentStats: {
        date: "2026-08-03",
        keyPresses: 0,
        keyPressCounts: {},
      },
      history: {
        "2026-08-01": {
          date: "2026-08-01",
          keyPresses: 3,
          keyPressCounts: { A: 3 },
        },
        "2026-08-02": {
          date: "2026-08-02",
          keyPresses: 0,
          keyPressCounts: { B: 2 },
        },
      },
    });

    expect(preferActiveDate(payload)).toBe("2026-08-02");
  });

  it("keeps an explicit zero authoritative instead of using chord sums", () => {
    const payload = parseKeyStatsExport({
      date: "2026-08-01",
      keyPresses: 0,
      keyPressCounts: { "Ctrl+C": 5 },
    });

    const day = getDayFromExport(payload, "2026-08-01");
    expect(day.totalKeyPresses).toBe(0);
    expect(day.keyCounts).toMatchObject({ Ctrl: 5, C: 5 });
  });

  it("falls back to aggregated counts only when keyPresses is absent", () => {
    const payload = parseKeyStatsExport({
      date: "2026-08-01",
      keyPressCounts: { "Ctrl+C": 5 },
    });

    expect(getDayFromExport(payload, "2026-08-01").totalKeyPresses).toBe(10);
  });
});

describe("keyboard aggregation", () => {
  it("normalizes aliases and splits shortcuts", () => {
    expect(
      aggregateKeyboardHeatmapCounts({
        "Ctrl+C": 5,
        Enter: 2,
        OEM_MINUS: 3,
        RShift: 4,
      })
    ).toMatchObject({ Ctrl: 5, C: 5, Return: 2, "-": 3, RShift: 4 });
  });

  it("counts Num+ exactly once in direct and modified shortcuts", () => {
    expect(
      aggregateKeyboardHeatmapCounts({
        "Num+": 3,
        "Ctrl+Num+": 5,
      })
    ).toEqual({ "Num+": 8, Ctrl: 5 });
  });

  it("retains a literal plus key and maps Menu to the Apps key", () => {
    expect(
      aggregateKeyboardHeatmapCounts({
        "+": 2,
        "Ctrl++": 5,
        Menu: 2,
      })
    ).toEqual({ "=": 7, Ctrl: 5, Apps: 2 });
  });

  it("ignores negative, nonnumeric, and unknown counts", () => {
    expect(
      aggregateKeyboardHeatmapCounts({
        A: -1,
        B: Number.NaN,
        UnknownMediaKey: 8,
        C: 2,
      })
    ).toEqual({ C: 2 });
  });

  it("returns only positive ranked keys", () => {
    expect(topKeys({ A: 0, B: 4, C: 2 }, 2)).toEqual([
      { key: "B", count: 4 },
      { key: "C", count: 2 },
    ]);
  });
});
