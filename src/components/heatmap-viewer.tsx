"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { KeyboardHeatmap } from "@/components/keyboard-heatmap";
import { HEAT_RAMP, IDLE_KEY_COLOR } from "@/lib/heatmap-color";
import { KEYBOARD_LAYOUT, resolveKeyCount } from "@/lib/keyboard-layout";
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

type Status = "loading" | "ready" | "error";

const DEFAULT_FILE_NAME = "keystats-public.json";

const keyNameMap: Record<string, string> = {
  Space: "空格",
  Return: "回车",
  Backspace: "退格",
  Shift: "Shift",
  Ctrl: "Ctrl",
  Option: "Alt",
  Cmd: "Win",
};
const layoutLabels = Object.fromEntries(
  KEYBOARD_LAYOUT.map(({ id, label }) => [id, label])
);

function displayKeyName(key: string): string {
  return keyNameMap[key] ?? layoutLabels[key] ?? key;
}

export function HeatmapViewer() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<KeyStatsExport | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);

  const applyPayload = useCallback((data: KeyStatsExport, sourceName: string) => {
    const dates = listAvailableDates(data);
    if (dates.length === 0) {
      throw new Error("导出文件中没有可用的日期数据");
    }
    setPayload(data);
    setSelectedDate(preferActiveDate(data));
    setFileName(sourceName);
    setError(null);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDefaultData = async () => {
      try {
        const primary = await fetch("/keystats-public.json");
        if (primary.ok) {
          const parsed = parseKeyStatsExport(await primary.json());
          if (!cancelled) applyPayload(parsed, DEFAULT_FILE_NAME);
          return;
        }

        const fallback = await fetch("/sample-keystats.json");
        if (!fallback.ok) throw new Error("无法加载 KeyStats 数据");
        const parsed = parseKeyStatsExport(await fallback.json());
        if (!cancelled) applyPayload(parsed, "sample-keystats.json");
      } catch (loadError) {
        if (!cancelled) {
          setStatus("error");
          setError(
            loadError instanceof Error ? loadError.message : "加载失败"
          );
        }
      }
    };

    void loadDefaultData();
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
  const topThree = useMemo(() => {
    if (!day) return [];
    const physicalCounts = Object.fromEntries(
      KEYBOARD_LAYOUT.map(({ id }) => [id, resolveKeyCount(id, day.keyCounts)])
    );
    return topKeys(physicalCounts, 3);
  }, [day]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setStatus("loading");
    setError(null);
    try {
      const parsed = parseKeyStatsExport(JSON.parse(await file.text()));
      applyPayload(parsed, file.name);
    } catch (fileError) {
      setStatus("error");
      setError(
        fileError instanceof Error
          ? fileError.message
          : "无法解析该 JSON，请确认它是 KeyStats 导出文件"
      );
    }
  };

  return (
    <div className="studio-page relative min-h-screen overflow-x-hidden">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        {status === "loading" && (
          <div className="flex flex-1 items-center justify-center py-28" aria-live="polite">
            <div className="loading-mark flex items-center gap-3 text-sm text-[#68727b]">
              <span className="size-2 rounded-full bg-[#a33f19]" />
              正在整理键盘数据
            </div>
          </div>
        )}

        {status === "error" && (
          <div
            className="mx-auto my-auto max-w-lg border-l-2 border-[#a33f19] py-2 pl-5"
            role="alert"
          >
            <p className="font-sans text-xl font-semibold text-[#25313c]">
              数据没有加载成功
            </p>
            <p className="mt-2 text-sm leading-6 text-[#68727b]">{error}</p>
            <label className="control-button mt-6 inline-flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  void onFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
              <Upload className="size-4" aria-hidden="true" />
              选择另一份 JSON
            </label>
          </div>
        )}

        {status === "ready" && day && (
          <>
            <section className="viewer-header" data-testid="viewer-ready">
              <div className="masthead-grid">
                <div className="max-w-[42rem]">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a4b31]">
                    KeyStats / Personal telemetry
                  </p>
                  <h1 className="mt-3 max-w-[15em] font-sans text-[clamp(2rem,4.1vw,4.8rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#25313c]">
                    键盘使用频次
                    <span className="block text-[#717980]">以日常输入留下的形状</span>
                  </h1>
                  <p className="mt-4 max-w-[37rem] text-sm leading-6 text-[#68727b] sm:text-[15px]">
                    颜色深浅与键帽高度共同表示使用频次。按键统计只在当前浏览器中解析，不上传到服务器。
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor="heatmap-date">
                      选择日期
                    </label>
                    <select
                      id="heatmap-date"
                      data-testid="date-select"
                      className="control-button min-w-[10.5rem] pr-3 font-mono"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    >
                      {dates.map((date) => (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ))}
                    </select>
                    <label className="control-button inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="sr-only"
                        data-testid="file-input"
                        onChange={(event) => {
                          void onFile(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                      <Upload className="size-4" aria-hidden="true" />
                      导入 JSON
                    </label>
                  </div>
                  <div className="flex max-w-full items-center gap-2 text-xs text-[#7b838a]">
                    <FileJson className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate font-mono" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metric-strip">
                <div className="metric-primary">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#737b82]">
                    总按键次数
                  </p>
                  <p
                    className="metric-total mt-1 font-display text-[clamp(3.6rem,7vw,7.8rem)] font-semibold leading-none tracking-[-0.065em] text-[#25313c]"
                    data-testid="total-count"
                  >
                    {formatCount(day.totalKeyPresses)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-[#68727b]">
                    {day.date} · 第 {dayOrdinal(dates, selectedDate)} 天
                  </p>
                </div>

                <div className="metric-secondary">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#737b82]">
                    高频按键
                  </p>
                  <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {topThree.map(({ key, count }, index) => (
                      <li key={key} className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-[#9a684f]">
                          0{index + 1}
                        </span>
                        <span className="font-display text-lg font-semibold text-[#25313c]">
                          {displayKeyName(key)}
                        </span>
                        <span className="font-mono text-xs text-[#68727b]">
                          {formatCount(count)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="metric-legend" aria-label="按键频次图例">
                  <div className="flex items-center justify-between text-[11px] text-[#68727b]">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-[3px] border border-black/10"
                        style={{ background: IDLE_KEY_COLOR }}
                      />
                      未使用
                    </span>
                    <span>较少</span>
                    <span>频繁</span>
                  </div>
                  <div
                    className="mt-2 h-2.5 rounded-sm"
                    style={{
                      background: `linear-gradient(90deg, ${HEAT_RAMP.join(", ")})`,
                    }}
                  />
                  <p className="mt-2 text-[11px] leading-5 text-[#7b838a]">
                    同一暖色梯度表示频次；高度提供第二重编码。
                  </p>
                </div>
              </div>
            </section>

            <section className="keyboard-section mt-2 flex flex-1 flex-col justify-center">
              <div className="mb-2 flex items-center justify-between gap-4 px-1 text-[11px] text-[#7b838a] sm:hidden">
                <span>左右滑动查看完整键盘</span>
                <span className="font-mono">104 keys</span>
              </div>
              <KeyboardHeatmap keyCounts={day.keyCounts} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
