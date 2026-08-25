"use client";

import { useMemo, useState } from "react";
import {
  KEYBOARD_HEIGHT_U,
  KEYBOARD_LAYOUT,
  KEYBOARD_UNIT,
  KEYBOARD_WIDTH_U,
  KEY_GAP,
  resolveKeyCount,
  type KeyDef,
} from "@/lib/keyboard-layout";
import { contrastText, darkenHex, heatColor } from "@/lib/heatmap-color";
import { formatCount } from "@/lib/keystats";

type Props = {
  keyCounts: Record<string, number>;
};

function KeyCap({
  keyDef,
  count,
  maxCount,
  unit,
  gap,
  hovered,
  onHover,
}: {
  keyDef: KeyDef;
  count: number;
  maxCount: number;
  unit: number;
  gap: number;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const h = keyDef.h ?? 1;
  const width = keyDef.w * unit - gap;
  const height = h * unit - gap;
  const depth = Math.max(8, unit * 0.16);
  const color = heatColor(count, maxCount);
  const side = darkenHex(color, 0.28);
  const front = darkenHex(color, 0.18);
  const text = contrastText(color);
  const showCount = count > 0;

  return (
    <button
      type="button"
      className="keycap absolute origin-bottom border-0 bg-transparent p-0 text-left"
      style={{
        left: keyDef.x * unit,
        top: keyDef.y * unit,
        width,
        height,
        transformStyle: "preserve-3d",
        zIndex: hovered ? 20 : Math.round(keyDef.y * 10),
      }}
      onMouseEnter={() => onHover(keyDef.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(keyDef.id)}
      onBlur={() => onHover(null)}
      aria-label={`${keyDef.label}: ${count}`}
    >
      <span
        className="keycap-solid absolute inset-0 transition-transform duration-200"
        style={{
          transformStyle: "preserve-3d",
          transform: hovered
            ? `translateZ(${depth + 6}px) translateY(-2px)`
            : `translateZ(${depth}px)`,
        }}
      >
        {/* top face */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          style={{
            background: `linear-gradient(160deg, ${color} 0%, ${darkenHex(color, 0.08)} 100%)`,
            color: text,
            transform: "translateZ(0)",
            boxShadow: hovered
              ? `0 10px 24px rgba(15, 23, 42, 0.22)`
              : `0 4px 10px rgba(15, 23, 42, 0.12)`,
          }}
        >
          <span
            className="font-display leading-none tracking-wide"
            style={{
              fontSize:
                keyDef.w >= 2
                  ? Math.max(9, unit * 0.17)
                  : Math.max(10, unit * 0.2),
              opacity: 0.92,
            }}
          >
            {keyDef.label}
          </span>
          {showCount && (
            <span
              className="mt-0.5 font-mono tabular-nums leading-none"
              style={{
                fontSize: Math.max(8, unit * 0.145),
                fontWeight: 600,
              }}
            >
              {formatCount(count)}
            </span>
          )}
        </span>

        {/* front face */}
        <span
          className="absolute left-0 right-0 rounded-b-[7px]"
          style={{
            height: depth,
            top: "100%",
            background: front,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />

        {/* right face */}
        <span
          className="absolute top-0 bottom-0 rounded-r-[6px]"
          style={{
            width: depth,
            left: "100%",
            background: side,
            transformOrigin: "left",
            transform: "rotateY(90deg)",
          }}
        />
      </span>
    </button>
  );
}

export function KeyboardHeatmap({ keyCounts }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const key of KEYBOARD_LAYOUT) {
      max = Math.max(max, resolveKeyCount(key.id, keyCounts));
    }
    return max;
  }, [keyCounts]);

  const unit = KEYBOARD_UNIT;
  const gap = KEY_GAP;
  const width = KEYBOARD_WIDTH_U * unit;
  const height = KEYBOARD_HEIGHT_U * unit;

  const hoveredKey: KeyDef | undefined = KEYBOARD_LAYOUT.find(
    (k) => k.id === hovered
  );
  const hoveredCount = hoveredKey
    ? resolveKeyCount(hoveredKey.id, keyCounts)
    : 0;

  return (
    <div className="keyboard-stage relative mx-auto w-full max-w-[1280px]">
      <div className="keyboard-viewport relative mx-auto overflow-visible px-2 pb-16 pt-8 sm:px-6">
        <div
          className="keyboard-scene relative mx-auto"
          style={{
            width: "100%",
            maxWidth: 1100,
            aspectRatio: `${width} / ${height * 0.78}`,
            perspective: "1800px",
          }}
        >
          <div
            className="keyboard-plate absolute left-1/2 top-[8%] origin-center"
            style={{
              width,
              height,
              transform:
                "translateX(-50%) rotateX(58deg) rotateZ(-28deg) scale(0.86)",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute -inset-4 rounded-[28px]"
              style={{
                background:
                  "linear-gradient(145deg, #f4f6f8 0%, #e6ebf0 45%, #d5dde6 100%)",
                transform: "translateZ(-14px)",
                boxShadow:
                  "0 40px 80px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            />

            {KEYBOARD_LAYOUT.map((keyDef) => (
              <KeyCap
                key={keyDef.id}
                keyDef={keyDef}
                count={resolveKeyCount(keyDef.id, keyCounts)}
                maxCount={maxCount}
                unit={unit}
                gap={gap}
                hovered={hovered === keyDef.id}
                onHover={setHovered}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 w-[min(92%,420px)] -translate-x-1/2 text-center">
        <div
          className={`rounded-full px-4 py-2 text-sm shadow-sm backdrop-blur transition-all duration-300 ${
            hovered
              ? "translate-y-0 bg-white/90 opacity-100"
              : "translate-y-1 bg-transparent opacity-0"
          }`}
        >
          {hoveredKey && (
            <span className="font-display text-slate-700">
              {hoveredKey.label}
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {formatCount(hoveredCount)}
              </span>
              <span className="ml-1 text-slate-500">次</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
