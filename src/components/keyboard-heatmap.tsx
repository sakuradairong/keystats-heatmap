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
  const depth = Math.max(6, unit * 0.12);
  const color = heatColor(count, maxCount);
  const side = darkenHex(color, 0.16);
  const front = darkenHex(color, 0.1);
  const text = contrastText(color);
  const pad = Math.max(4, unit * 0.09);

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
            ? `translateZ(${depth + 4}px)`
            : `translateZ(${depth}px)`,
        }}
      >
        <span
          className="absolute inset-0 rounded-[5px]"
          style={{
            background: color,
            color: text,
            transform: "translateZ(0)",
            boxShadow: hovered
              ? "0 10px 18px rgba(40, 55, 75, 0.16)"
              : "0 2px 5px rgba(40, 55, 75, 0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
        >
          <span
            className="absolute font-display leading-none"
            style={{
              left: pad,
              top: pad * 0.75,
              fontSize:
                keyDef.w >= 2
                  ? Math.max(8, unit * 0.15)
                  : Math.max(9, unit * 0.175),
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {keyDef.label}
          </span>
          <span
            className="absolute font-mono tabular-nums leading-none"
            style={{
              right: pad * 0.9,
              bottom: pad * 0.7,
              fontSize: Math.max(7, unit * 0.125),
              fontWeight: 600,
            }}
          >
            {formatCount(count)}
          </span>
        </span>

        <span
          className="absolute left-0 right-0 rounded-b-[5px]"
          style={{
            height: depth,
            top: "100%",
            background: front,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />

        <span
          className="absolute top-0 bottom-0 rounded-r-[4px]"
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
      <div className="keyboard-viewport relative mx-auto overflow-x-auto overflow-y-hidden px-1 pb-4 pt-1 sm:overflow-visible sm:px-4 sm:pb-12 sm:pt-2">
        <div
          className="keyboard-scene relative mx-auto"
          style={{
            width: "100%",
            maxWidth: 1180,
            aspectRatio: "var(--kb-aspect, 2.05 / 1)",
            perspective: "1600px",
          }}
        >
          <div
            className="keyboard-plate absolute left-1/2 top-[6%] origin-center"
            style={{
              width,
              height,
              transform:
                "translateX(-50%) rotateX(var(--kb-tilt, 60deg)) rotateZ(var(--kb-yaw, -32deg)) scale(var(--kb-scale, 0.88))",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute -inset-[20px] rounded-[22px]"
              style={{
                background:
                  "linear-gradient(155deg, #ffffff 0%, #f3f5f7 60%, #e8ecf0 100%)",
                transform: "translateZ(-10px)",
                boxShadow:
                  "0 55px 100px rgba(60, 75, 95, 0.18), 0 20px 40px rgba(60, 75, 95, 0.08)",
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
