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
  const depth = Math.max(7, unit * 0.14);
  const color = heatColor(count, maxCount);
  const side = darkenHex(color, count > 0 ? 0.22 : 0.1);
  const front = darkenHex(color, count > 0 ? 0.14 : 0.06);
  const text = contrastText(color);
  const showCount = count > 0;
  const pad = Math.max(4, unit * 0.1);

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
            ? `translateZ(${depth + 5}px) translateY(-1px)`
            : `translateZ(${depth}px)`,
        }}
      >
        <span
          className="absolute inset-0 rounded-[6px]"
          style={{
            background: `linear-gradient(165deg, ${color} 0%, ${darkenHex(color, 0.06)} 100%)`,
            color: text,
            transform: "translateZ(0)",
            boxShadow: hovered
              ? "0 12px 22px rgba(40, 55, 75, 0.18)"
              : "0 3px 8px rgba(40, 55, 75, 0.1), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >
          <span
            className="absolute font-display leading-none tracking-wide"
            style={{
              left: pad,
              top: pad * 0.85,
              fontSize:
                keyDef.w >= 2
                  ? Math.max(9, unit * 0.16)
                  : Math.max(10, unit * 0.19),
              opacity: 0.88,
              fontWeight: 500,
            }}
          >
            {keyDef.label}
          </span>
          {showCount && (
            <span
              className="absolute font-mono tabular-nums leading-none"
              style={{
                right: pad,
                bottom: pad * 0.85,
                fontSize: Math.max(8, unit * 0.135),
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
              {formatCount(count)}
            </span>
          )}
          {hovered && (
            <span
              className="pointer-events-none absolute left-1/2 top-0 z-30 whitespace-nowrap rounded-md bg-slate-800/90 px-2 py-1 font-mono text-[11px] font-semibold text-white shadow-lg"
              style={{
                transform: "translate3d(-50%, calc(-100% - 8px), 48px)",
              }}
            >
              {keyDef.label} · {formatCount(count)}
            </span>
          )}
        </span>

        <span
          className="absolute left-0 right-0 rounded-b-[6px]"
          style={{
            height: depth,
            top: "100%",
            background: front,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />

        <span
          className="absolute top-0 bottom-0 rounded-r-[5px]"
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

  return (
    <div className="keyboard-stage relative mx-auto w-full max-w-[1320px]">
      <div className="keyboard-viewport relative mx-auto overflow-x-auto overflow-y-visible px-1 pb-6 pt-2 sm:overflow-visible sm:px-4 sm:pb-10">
        <div
          className="keyboard-scene relative mx-auto min-w-[640px] sm:min-w-0"
          style={{
            width: "100%",
            maxWidth: 1180,
            aspectRatio: `${width} / ${height * 0.72}`,
            perspective: "2200px",
          }}
        >
          <div
            className="keyboard-plate absolute left-1/2 top-[4%] origin-center"
            style={{
              width,
              height,
              transform:
                "translateX(-50%) rotateX(52deg) rotateZ(-24deg) scale(var(--kb-scale, 0.9))",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute -inset-[18px] rounded-[26px]"
              style={{
                background:
                  "linear-gradient(160deg, #fbfcfd 0%, #eef1f4 55%, #e2e7ec 100%)",
                transform: "translateZ(-12px)",
                boxShadow:
                  "0 48px 90px rgba(55, 70, 90, 0.16), 0 18px 36px rgba(55, 70, 90, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
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
    </div>
  );
}
