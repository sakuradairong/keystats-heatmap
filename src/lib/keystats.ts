export type DailyStats = {
  date: string;
  keyPresses: number | null;
  keyPressCounts: Record<string, number>;
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
  if (upper === "+") return "=";
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
    MENU: "Apps",
    LALT: "LAlt",
    LMENU: "LAlt",
    RALT: "RAlt",
    RMENU: "RAlt",
    SHIFT: "Shift",
    LSHIFT: "Shift",
    RSHIFT: "RShift",
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

function tokenizeShortcut(rawKey: string): string[] {
  const numPlusMarker = "__KEYSTATS_NUM_PLUS__";
  const protectedKey = rawKey.replace(/num\+/gi, numPlusMarker);
  const tokens = protectedKey
    .split("+")
    .map((part) => part.replaceAll(numPlusMarker, "Num+").trim())
    .filter(Boolean);

  if (protectedKey.includes("++")) tokens.push("+");
  return tokens;
}

export function aggregateKeyboardHeatmapCounts(
  keyPressCounts: Record<string, number>
): Record<string, number> {
  const aggregated: Record<string, number> = {};

  const add = (key: string, count: number) => {
    aggregated[key] = (aggregated[key] ?? 0) + count;
  };

  for (const [rawKey, rawCount] of Object.entries(keyPressCounts ?? {})) {
    const count = Number(rawCount);
    if (!Number.isFinite(count) || count <= 0) continue;

    const exact = normalizeHeatmapKey(rawKey);
    if (exact) {
      add(exact, count);
      continue;
    }

    for (const part of tokenizeShortcut(rawKey)) {
      const normalized = normalizeHeatmapKey(part);
      if (normalized) add(normalized, count);
    }
  }

  return aggregated;
}

function normalizeCountRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const normalized: Record<string, number> = {};
  for (const [key, rawCount] of Object.entries(value)) {
    if (
      typeof rawCount !== "number" ||
      !Number.isFinite(rawCount) ||
      rawCount < 0
    ) {
      return null;
    }
    normalized[key] = rawCount;
  }
  return normalized;
}

function normalizeDailyStats(
  raw: Partial<DailyStats> | null | undefined
): DailyStats | null {
  if (!raw) return null;
  const date = toDateKey(raw.date as string);
  if (!date) return null;

  const keyPressCounts = normalizeCountRecord(raw.keyPressCounts);
  if (!keyPressCounts) return null;

  const rawKeyPresses = (raw as { keyPresses?: unknown }).keyPresses;
  if (
    rawKeyPresses !== undefined &&
    rawKeyPresses !== null &&
    (typeof rawKeyPresses !== "number" ||
      !Number.isFinite(rawKeyPresses) ||
      rawKeyPresses < 0)
  ) {
    return null;
  }

  return {
    date,
    keyPresses: rawKeyPresses == null ? null : rawKeyPresses,
    keyPressCounts,
  };
}

export function parseKeyStatsExport(input: unknown): KeyStatsExport {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("无效的 JSON：根节点必须是对象");
  }

  const data = input as Record<string, unknown>;

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
        !Array.isArray(value) &&
        "keyPressCounts" in value
    )
  ) {
    const history: Record<string, DailyStats> = {};
    for (const [key, value] of Object.entries(data)) {
      const daily = normalizeDailyStats(value as Partial<DailyStats>);
      if (!daily) continue;
      const historyDate = toDateKey(key) || daily.date;
      if (historyDate !== daily.date) {
        throw new Error(`history 日期不一致：${historyDate} 与 ${daily.date}`);
      }
      history[historyDate] = daily;
    }
    const dates = Object.keys(history).sort();
    if (dates.length === 0) throw new Error("历史记录为空");
    const latest = history[dates[dates.length - 1]];
    return {
      version: 1,
      scope: "currentDevice",
      currentStats: latest,
      history,
    };
  }

  const currentStats = normalizeDailyStats(
    data.currentStats as Partial<DailyStats>
  );
  if (
    data.history != null &&
    (typeof data.history !== "object" || Array.isArray(data.history))
  ) {
    throw new Error("history 必须是以日期为键的对象");
  }
  const historyRaw = (data.history ?? {}) as Record<
    string,
    Partial<DailyStats>
  >;
  const history: Record<string, DailyStats> = {};

  for (const [key, value] of Object.entries(historyRaw)) {
    const daily = normalizeDailyStats(value);
    if (!daily) continue;
    const historyDate = toDateKey(key) || daily.date;
    if (historyDate !== daily.date) {
      throw new Error(`history 日期不一致：${historyDate} 与 ${daily.date}`);
    }
    history[historyDate] = daily;
  }

  if (currentStats) {
    history[currentStats.date] = currentStats;
  }

  if (!currentStats && Object.keys(history).length === 0) {
    throw new Error("未找到 currentStats 或 history 数据");
  }

  const fallback =
    currentStats ?? history[Object.keys(history).sort().at(-1)!];

  return {
    version: Number(data.version) || 1,
    scope: typeof data.scope === "string" ? data.scope : "currentDevice",
    exportedAt:
      typeof data.exportedAt === "string" ? data.exportedAt : undefined,
    currentStats: fallback,
    history,
  };
}

export function listAvailableDates(payload: KeyStatsExport): string[] {
  return Object.keys(payload.history).sort();
}

export function preferActiveDate(payload: KeyStatsExport): string {
  const dates = listAvailableDates(payload);
  if (dates.length === 0) return "";

  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const daily = payload.history[dates[i]];
    const presses = daily?.keyPresses ?? 0;
    const hasCounts = Object.values(daily?.keyPressCounts ?? {}).some(
      (count) => Number(count) > 0
    );
    if (presses > 0 || hasCounts) return dates[i];
  }

  const currentKey = toDateKey(payload.currentStats?.date);
  if (currentKey && dates.includes(currentKey)) return currentKey;
  return dates[dates.length - 1];
}

export function getDayFromExport(
  payload: KeyStatsExport,
  date: string
): ParsedDay {
  const daily = payload.history[date] ?? payload.currentStats;
  const rawCounts = daily.keyPressCounts ?? {};
  const keyCounts = aggregateKeyboardHeatmapCounts(rawCounts);
  const summed = Object.values(keyCounts).reduce((total, count) => total + count, 0);

  return {
    date: toDateKey(daily.date) || date,
    totalKeyPresses: daily.keyPresses ?? summed,
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
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}
