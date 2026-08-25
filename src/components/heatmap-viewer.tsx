"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload, CalendarDays, Flame, Keyboard } from "lucide-react";
import { KeyboardHeatmap } from "@/components/keyboard-heatmap";
import {
  dayOrdinal,
  formatCount,
  getDayFromExport,
  listAvailableDates,
  parseKeyStatsExport,
  preferActiveDate,
  topKeys,
  type KeyStatsExport,
  type ParsedDay,
} from "@/lib/keystats";
import { heatColor } from "@/lib/heatmap-color";

type Status = "loading" | "ready" | "error";

function displayKeyName(key: string): string {
  const map: Record<string, string> = {
    Space: "空格",
    Backspace: "退格",
    Return: "回车",
    Enter: "回车",
    Shift: "Shift",
    Ctrl: "Ctrl",
    LAlt: "Alt",
    W: "W",
    A: "A",
    D: "D",
  };
  return map[key] ?? key;
}

export function HeatmapViewer() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<KeyStatsExport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fileName, setFileName] = useState("KeyStats-Export-2026-08-25.json");

  const applyPayload = useCallback((data: KeyStatsExport, name: string) => {
    const dates = listAvailableDates(data);
    if (dates.length === 0) {
      throw new Error("导出文件中没有可用的日期数据");
    }
    setPayload(data);
    setSelectedDate(preferActiveDate(data));
    setFileName(name);
    setError(null);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const primary = await fetch("/KeyStats-Export-2026-08-25.json");
        if (primary.ok) {
          const json = await primary.json();
          if (cancelled) return;
          applyPayload(
            parseKeyStatsExport(json),
            "KeyStats-Export-2026-08-25.json"
          );
          return;
        }

        const fallback = await fetch("/sample-keystats.json");
        if (!fallback.ok) throw new Error("无法加载 KeyStats 数据");
        const json = await fallback.json();
        if (cancelled) return;
        applyPayload(parseKeyStatsExport(json), "示例数据 sample-keystats.json");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPayload]);

  const dates = useMemo(
    () => (payload ? listAvailableDates(payload) : []),
    [payload]
  );

  const day: ParsedDay | null = useMemo(() => {
    if (!payload || !selectedDate) return null;
    return getDayFromExport(payload, selectedDate);
  }, [payload, selectedDate]);

  const tops = useMemo(() => {
    if (!day) return [];
    const layoutCounts: Record<string, number> = {};
    for (const [key, count] of Object.entries(day.keyCounts)) {
      // Fold Option/Alt aliases into LAlt for ranking display
      const displayKey =
        key === "Option" || key === "Alt" ? "LAlt" : key === "Enter" ? "Return" : key;
      layoutCounts[displayKey] = (layoutCounts[displayKey] ?? 0) + count;
    }
    return topKeys(layoutCounts, 3);
  }, [day]);

  const maxCount = useMemo(() => {
    if (!day) return 1;
    return Math.max(1, ...Object.values(day.keyCounts));
  }, [day]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setStatus("loading");
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      applyPayload(parseKeyStatsExport(json), file.name);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "无法解析该 JSON，请确认是 KeyStats 导出文件"
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#eef3f8_0%,#dfe7ef_42%,#d2dbe6_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 pb-10 pt-6 sm:px-8">
        <header className="mb-2 flex flex-col gap-4 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <Keyboard className="size-4" />
              <span>KeyStats Heatmap</span>
              <span className="text-slate-300">/</span>
              <span className="truncate text-slate-600">{fileName}</span>
            </div>
            <h1 className="font-display text-2xl tracking-tight text-slate-800 sm:text-3xl">
              个人日常键盘使用频次数据可视化
            </h1>
          </div>

          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white/80 px-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <Upload className="size-4" />
            导入 KeyStats JSON
          </label>
        </header>

        {status === "loading" && (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="animate-pulse text-slate-500">正在加载键盘热力图…</div>
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-red-200 bg-white/90 p-6 text-center shadow-sm">
            <p className="font-display text-lg text-red-700">无法显示数据</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <label className="mt-5 inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="size-4" />
              重新选择文件
            </label>
          </div>
        )}

        {status === "ready" && day && (
          <>
            <section className="relative mb-1 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div className="space-y-2 sm:justify-self-start">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm text-slate-600 shadow-sm backdrop-blur">
                  <Flame className="size-3.5 text-orange-500" />
                  <span>
                    高频：
                    {tops
                      .map((item) => displayKeyName(item.key))
                      .join("、")}
                  </span>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                  颜色越暖表示按键越频繁。支持完整 KeyStats 导出文件，也可读取单日
                  daily_stats / history JSON。
                </p>
              </div>

              <div className="text-center">
                <div className="font-mono text-sm tracking-wide text-slate-500">
                  {day.date}
                  <span className="mx-2 text-slate-300">·</span>
                  第 {dayOrdinal(dates, selectedDate)} 天
                </div>
                <div className="mt-1 font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                  {formatCount(day.totalKeyPresses)}
                </div>
                <div className="mt-1 text-sm text-slate-500">当日总按键次数</div>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end sm:justify-self-end">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="size-4" />
                  选择日期
                </label>
                <select
                  className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white/90 px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-400"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {dates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <KeyboardHeatmap keyCounts={day.keyCounts} />

            <footer className="mt-2 flex flex-col items-center gap-3 sm:mt-0">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="text-xs text-slate-500">低</span>
                <div
                  className="h-2.5 flex-1 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg,#7eb6e8,#a8d8c0,#f0d84a,#f08a2e,#d94816)",
                  }}
                />
                <span className="text-xs text-slate-500">高</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                {tops.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 shadow-sm"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: heatColor(item.count, maxCount) }}
                    />
                    {displayKeyName(item.key)} {formatCount(item.count)}
                  </span>
                ))}
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
