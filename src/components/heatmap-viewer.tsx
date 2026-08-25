"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { KeyboardHeatmap } from "@/components/keyboard-heatmap";
import {
  dayOrdinal,
  formatCount,
  getDayFromExport,
  listAvailableDates,
  parseKeyStatsExport,
  preferActiveDate,
  type KeyStatsExport,
  type ParsedDay,
} from "@/lib/keystats";

type Status = "loading" | "ready" | "error";

export function HeatmapViewer() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<KeyStatsExport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const applyPayload = useCallback((data: KeyStatsExport) => {
    const dates = listAvailableDates(data);
    if (dates.length === 0) {
      throw new Error("导出文件中没有可用的日期数据");
    }
    setPayload(data);
    setSelectedDate(preferActiveDate(data));
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
          applyPayload(parseKeyStatsExport(json));
          return;
        }

        const fallback = await fetch("/sample-keystats.json");
        if (!fallback.ok) throw new Error("无法加载 KeyStats 数据");
        const json = await fallback.json();
        if (cancelled) return;
        applyPayload(parseKeyStatsExport(json));
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

  const onFile = async (file: File | null) => {
    if (!file) return;
    setStatus("loading");
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      applyPayload(parseKeyStatsExport(json));
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#f4f6f8_0%,#e8edf2_48%,#dde4eb_100%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-5 pb-8 pt-8 sm:px-10 sm:pt-10">
        <div className="mb-2 flex items-start justify-end gap-3">
          <select
            aria-label="选择日期"
            className="h-8 rounded-md border border-slate-200/80 bg-white/70 px-2.5 text-sm text-slate-600 outline-none backdrop-blur transition hover:bg-white focus:border-slate-300"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={status !== "ready"}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-2.5 text-sm text-slate-600 backdrop-blur transition hover:bg-white">
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <Upload className="size-3.5" />
            导入
          </label>
        </div>

        {status === "loading" && (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="animate-pulse text-slate-400">正在加载键盘热力图…</div>
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto mt-20 max-w-md text-center">
            <p className="font-display text-lg text-slate-700">无法显示数据</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <label className="mt-5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-slate-800 px-3 text-sm text-white">
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="size-3.5" />
              重新选择文件
            </label>
          </div>
        )}

        {status === "ready" && day && (
          <>
            <section className="mb-4 flex flex-col gap-6 sm:mb-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="font-display text-[22px] leading-tight tracking-tight text-slate-500 sm:text-[26px]">
                  {day.date}
                </div>
                <div className="mt-1 font-display text-[22px] leading-tight tracking-tight text-slate-500 sm:text-[26px]">
                  第 {dayOrdinal(dates, selectedDate)} 天
                </div>
                <div className="mt-1 font-display text-[56px] font-semibold leading-none tracking-tight text-slate-700 sm:text-[72px]">
                  {formatCount(day.totalKeyPresses)}
                </div>
              </div>

              <h1 className="max-w-[14em] font-display text-[22px] leading-snug tracking-tight text-slate-600 sm:pb-3 sm:text-right sm:text-[28px]">
                个人日常键盘使用频次数据可视化
              </h1>
            </section>

            <div className="flex flex-1 flex-col justify-center">
              <KeyboardHeatmap keyCounts={day.keyCounts} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
