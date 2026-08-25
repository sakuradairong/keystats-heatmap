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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#f4f6f8_0%,#e8edf2_48%,#dde4eb_100%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-4 pb-8 pt-5 sm:px-10 sm:pt-10">
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
            <section className="mb-3 sm:mb-1">
              <div className="mb-4 flex flex-wrap items-center justify-end gap-2 sm:mb-0 sm:justify-end">
                <select
                  aria-label="选择日期"
                  className="h-8 rounded-md border border-slate-200/70 bg-white/60 px-2.5 text-sm text-slate-500 outline-none backdrop-blur transition hover:bg-white/90 focus:border-slate-300"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {dates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200/70 bg-white/60 px-2.5 text-sm text-slate-500 backdrop-blur transition hover:bg-white/90">
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

              <div className="flex flex-col gap-4 sm:mt-[-2.25rem] sm:flex-row sm:items-end sm:justify-between sm:pr-[210px]">
                <div className="min-w-0 order-2 sm:order-1">
                  <div className="font-display text-[20px] leading-[1.15] tracking-tight text-[#6b7585] sm:text-[26px]">
                    {day.date}
                  </div>
                  <div className="font-display text-[20px] leading-[1.15] tracking-tight text-[#6b7585] sm:text-[26px]">
                    第 {dayOrdinal(dates, selectedDate)} 天
                  </div>
                  <div className="mt-1 font-display text-[48px] font-semibold leading-none tracking-tight text-[#4a5565] sm:text-[76px]">
                    {formatCount(day.totalKeyPresses)}
                  </div>
                </div>

                <h1 className="order-1 max-w-none font-display text-[18px] leading-snug tracking-tight text-[#6b7585] sm:order-2 sm:max-w-[13em] sm:pb-2 sm:text-right sm:text-[28px]">
                  个人日常键盘使用频次数据可视化
                </h1>
              </div>
            </section>

            <div className="mt-2 flex flex-1 flex-col justify-center sm:mt-0">
              <KeyboardHeatmap keyCounts={day.keyCounts} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
