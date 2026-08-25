export type DailyStats = {
  date: string;
  keyPresses: number;
  keyPressCounts: Record<string, number>;
  leftClicks?: number;
  rightClicks?: number;
  middleClicks?: number;
  sideBackClicks?: number;
  sideForwardClicks?: number;
  mouseDistance?: number;
  scrollDistance?: number;
  peakKPS?: number;
  peakCPS?: number;
  appStats?: Record<string, unknown>;
};

export type KeyStatsExport = {
  version: number;
  scope?: string;
  exportedAt?: string;
  currentStats: DailyStats;
  history: Record<string, DailyStats>;
};

export type ParsedDay = {
  date: string;
  totalKeyPresses: number;
  keyCounts: Record<string, number>;
  rawCounts: Record<string, number>;
};

function toDateKey(value: string | Date | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return value;
  }
  return value.toISOString().slice(0, 10);
}

function normalizeHeatmapKey(rawKey: string): string | null {
  const trimmed = (rawKey ?? "").trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.length === 1) return upper;

  if (upper.startsWith("F") && /^\d+$/.test(upper.slice(1))) {
    return upper;
  }

  if (upper.startsWith("NUM")) {
    const suffix = upper.slice(3);
    if (suffix.length === 1 && /\d/.test(suffix)) return `Num${suffix}`;
    if (suffix === ".") return "Num.";
    if (suffix === "+") return "Num+";
    if (suffix === "-") return "Num-";
    if (suffix === "/") return "Num/";
    if (suffix === "*") return "Num*";
    if (suffix === "ENTER") return "NumEnter";
  }

  const aliases: Record<string, string> = {
    CMD: "Cmd",
    COMMAND: "Cmd",
    WIN: "Cmd",
    LWIN: "LWin",
    RWIN: "RWin",
    CTRL: "Ctrl",
    CONTROL: "Ctrl",
    LCTRL: "LCtrl",
    LCTL: "LCtrl",
    LCONTROL: "LCtrl",
    RCTRL: "RCtrl",
    RCTL: "RCtrl",
    RCONTROL: "RCtrl",
    OPTION: "Option",
    OPT: "Option",
    ALT: "Option",
    MENU: "Option",
    LALT: "LAlt",
    LMENU: "LAlt",
    RALT: "RAlt",
    RMENU: "RAlt",
    SHIFT: "Shift",
    LSHIFT: "Shift",
    RSHIFT: "Shift",
    FN: "Fn",
    FUNCTION: "Fn",
    APPS: "Apps",
    APPLICATION: "Apps",
    CONTEXTMENU: "Apps",
    SPACE: "Space",
    SPACEBAR: "Space",
    ESC: "Esc",
    ESCAPE: "Esc",
    ENTER: "Return",
    RETURN: "Return",
    TAB: "Tab",
    BACKSPACE: "Backspace",
    BKSP: "Backspace",
    DELETE: "Delete",
    DEL: "Delete",
    FORWARDDELETE: "Delete",
    INSERT: "Insert",
    INS: "Insert",
    CAPSLOCK: "CapsLock",
    PAGEUP: "PageUp",
    PGUP: "PageUp",
    PRIOR: "PageUp",
    PAGEDOWN: "PageDown",
    PGDN: "PageDown",
    NEXT: "PageDown",
    HOME: "Home",
    END: "End",
    PRINTSCREEN: "PrintScreen",
    PRTSC: "PrintScreen",
    PRTSCN: "PrintScreen",
    SNAPSHOT: "PrintScreen",
    SCROLLLOCK: "ScrollLock",
    SCROLL: "ScrollLock",
    NUMLOCK: "NumLock",
    PAUSE: "Pause",
    BREAK: "Pause",
    LEFT: "Left",
    ARROWLEFT: "Left",
    LEFTARROW: "Left",
    RIGHT: "Right",
    ARROWRIGHT: "Right",
    RIGHTARROW: "Right",
    UP: "Up",
    ARROWUP: "Up",
    UPARROW: "Up",
    DOWN: "Down",
    ARROWDOWN: "Down",
    DOWNARROW: "Down",
    OEM_3: "`",
    OEM_MINUS: "-",
    OEM_PLUS: "=",
    OEM_4: "[",
    OEM_6: "]",
    OEM_5: "\\",
    OEM_1: ";",
    OEM_7: "'",
    OEM_COMMA: ",",
    OEM_PERIOD: ".",
    OEM_2: "/",
  };

  return aliases[upper] ?? null;
}

export function aggregateKeyboardHeatmapCounts(
  keyPressCounts: Record<string, number>
): Record<string, number> {
  const aggregated: Record<string, number> = {};

  const add = (key: string, count: number) => {
    aggregated[key] = (aggregated[key] ?? 0) + count;
  };

  for (const [rawKey, rawCount] of Object.entries(keyPressCounts ?? {})) {
    const count = Math.max(0, Number(rawCount) || 0);
    if (count <= 0) continue;

    const exact = normalizeHeatmapKey(rawKey);
    if (exact) {
      add(exact, count);
      continue;
    }

    if (rawKey.toLowerCase().includes("num+")) {
      add("Num+", count);
    }

    const components = rawKey
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean);

    const parts = components.length > 0 ? components : [rawKey.trim()];
    for (const part of parts) {
      const normalized = normalizeHeatmapKey(part);
      if (normalized) add(normalized, count);
    }
  }

  return aggregated;
}

function normalizeDailyStats(raw: Partial<DailyStats> | null | undefined): DailyStats | null {
  if (!raw) return null;
  const date = toDateKey(raw.date as string);
  if (!date) return null;

  return {
    date,
    keyPresses: Math.max(0, Number(raw.keyPresses) || 0),
    keyPressCounts: raw.keyPressCounts ?? {},
    leftClicks: raw.leftClicks,
    rightClicks: raw.rightClicks,
    middleClicks: raw.middleClicks,
    sideBackClicks: raw.sideBackClicks,
    sideForwardClicks: raw.sideForwardClicks,
    mouseDistance: raw.mouseDistance,
    scrollDistance: raw.scrollDistance,
    peakKPS: raw.peakKPS,
    peakCPS: raw.peakCPS,
    appStats: raw.appStats,
  };
}

export function parseKeyStatsExport(input: unknown): KeyStatsExport {
  if (!input || typeof input !== "object") {
    throw new Error("无效的 JSON：根节点必须是对象");
  }

  const data = input as Record<string, unknown>;

  // Direct daily_stats.json / history.json fallbacks
  if (
    data.keyPressCounts &&
    typeof data.keyPressCounts === "object" &&
    !data.history &&
    !data.currentStats
  ) {
    const daily = normalizeDailyStats(data as Partial<DailyStats>);
    if (!daily) throw new Error("无法解析日统计文件");
    return {
      version: 1,
      scope: "currentDevice",
      exportedAt: new Date().toISOString(),
      currentStats: daily,
      history: { [daily.date]: daily },
    };
  }

  if (
    !data.currentStats &&
    data.history == null &&
    Object.values(data).every(
      (value) =>
        value &&
        typeof value === "object" &&
        "keyPressCounts" in (value as object)
    )
  ) {
    const history: Record<string, DailyStats> = {};
    for (const [key, value] of Object.entries(data)) {
      const daily = normalizeDailyStats(value as Partial<DailyStats>);
      if (daily) history[toDateKey(key) || daily.date] = daily;
    }
    const dates = Object.keys(history).sort();
    if (dates.length === 0) throw new Error("历史记录为空");
    const latest = history[dates[dates.length - 1]];
    return {
      version: 1,
      scope: "currentDevice",
      exportedAt: new Date().toISOString(),
      currentStats: latest,
      history,
    };
  }

  const currentStats = normalizeDailyStats(data.currentStats as Partial<DailyStats>);
  const historyRaw = (data.history ?? {}) as Record<string, Partial<DailyStats>>;
  const history: Record<string, DailyStats> = {};

  for (const [key, value] of Object.entries(historyRaw)) {
    const daily = normalizeDailyStats(value);
    if (daily) history[toDateKey(key) || daily.date] = daily;
  }

  if (currentStats) {
    history[currentStats.date] = currentStats;
  }

  if (!currentStats && Object.keys(history).length === 0) {
    throw new Error("未找到 currentStats 或 history 数据");
  }

  const fallback =
    currentStats ??
    history[
      Object.keys(history).sort().at(-1)!
    ];

  return {
    version: Number(data.version) || 1,
    scope: typeof data.scope === "string" ? data.scope : "currentDevice",
    exportedAt:
      typeof data.exportedAt === "string"
        ? data.exportedAt
        : new Date().toISOString(),
    currentStats: fallback,
    history,
  };
}

export function listAvailableDates(payload: KeyStatsExport): string[] {
  return Object.keys(payload.history).sort();
}

export function getDayFromExport(
  payload: KeyStatsExport,
  date: string
): ParsedDay {
  const daily = payload.history[date] ?? payload.currentStats;
  const rawCounts = daily.keyPressCounts ?? {};
  const keyCounts = aggregateKeyboardHeatmapCounts(rawCounts);
  const summed = Object.values(keyCounts).reduce((a, b) => a + b, 0);

  return {
    date: daily.date || date,
    totalKeyPresses: Math.max(daily.keyPresses || 0, summed),
    keyCounts,
    rawCounts,
  };
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function dayOrdinal(dates: string[], selected: string): number {
  const index = dates.indexOf(selected);
  return index >= 0 ? index + 1 : dates.length;
}

export function topKeys(
  keyCounts: Record<string, number>,
  limit = 3
): Array<{ key: string; count: number }> {
  return Object.entries(keyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}
