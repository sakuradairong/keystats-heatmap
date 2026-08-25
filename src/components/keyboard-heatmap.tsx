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
  const depth = Math.max(14, unit * 0.26);
  const color = heatColor(count, maxCount);
  const side = darkenHex(color, 0.32);
  const front = darkenHex(color, 0.2);
  const text = contrastText(color);
  const pad = Math.max(4, unit * 0.09);
  // Extrude hot keys higher so the heatmap reads in depth, not just color
  const heatLift =
    maxCount > 0 ? Math.sqrt(Math.max(0, count) / maxCount) * unit * 0.55 : 0;
  const baseLift = depth + 4;
  const lift = hovered ? baseLift + heatLift + 10 : baseLift + heatLift;

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
        zIndex: hovered ? 30 : Math.round(keyDef.y * 10 + keyDef.x),
      }}
      onMouseEnter={() => onHover(keyDef.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(keyDef.id)}
      onBlur={() => onHover(null)}
      aria-label={`${keyDef.label}: ${count}`}
    >
      {/* contact shadow on plate */}
      <span
        className="absolute inset-0 rounded-[6px]"
        style={{
          background: "rgba(40, 55, 75, 0.22)",
          transform: "translateZ(1px) translateY(2px)",
          filter: "blur(3px)",
        }}
      />

      <span
        className="keycap-solid absolute inset-0 transition-transform duration-200"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${lift}px)`,
        }}
      >
        {/* top face */}
        <span
          className="absolute inset-0 rounded-[6px]"
          style={{
            background: `linear-gradient(155deg, ${color} 0%, ${darkenHex(color, 0.08)} 100%)`,
            color: text,
            transform: "translateZ(0)",
            boxShadow: hovered
              ? "0 18px 28px rgba(30, 45, 65, 0.28)"
              : "0 6px 14px rgba(30, 45, 65, 0.14), inset 0 1px 0 rgba(255,255,255,0.5)",
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

        {/* front face */}
        <span
          className="absolute left-0 right-0 rounded-b-[6px]"
          style={{
            height: depth,
            top: "100%",
            background: `linear-gradient(180deg, ${front} 0%, ${darkenHex(color, 0.28)} 100%)`,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />

        {/* right face */}
        <span
          className="absolute top-0 bottom-0 rounded-r-[5px]"
          style={{
            width: depth,
            left: "100%",
            background: `linear-gradient(90deg, ${side} 0%, ${darkenHex(color, 0.4)} 100%)`,
            transformOrigin: "left",
            transform: "rotateY(90deg)",
          }}
        />

        {/* left face (visible with strong yaw) */}
        <span
          className="absolute top-0 bottom-0 rounded-l-[5px]"
          style={{
            width: depth,
            right: "100%",
            background: darkenHex(color, 0.12),
            transformOrigin: "right",
            transform: "rotateY(-90deg)",
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
  const chassisDepth = 28;

  return (
    <div className="keyboard-stage relative mx-auto w-full max-w-[1320px]">
      <div className="keyboard-viewport relative mx-auto overflow-x-auto overflow-y-hidden px-1 pb-6 pt-2 sm:overflow-visible sm:px-4 sm:pb-16 sm:pt-4">
        <div
          className="keyboard-scene relative mx-auto"
          style={{
            width: "100%",
            maxWidth: 1180,
            aspectRatio: "var(--kb-aspect, 1.85 / 1)",
            perspective: "var(--kb-perspective, 1100px)",
            perspectiveOrigin: "50% 35%",
          }}
        >
          <div
            className="keyboard-plate absolute left-1/2 top-[8%] origin-center"
            style={{
              width,
              height,
              transform:
                "translateX(-50%) rotateX(var(--kb-tilt, 62deg)) rotateZ(var(--kb-yaw, -36deg)) scale(var(--kb-scale, 0.86))",
              transformStyle: "preserve-3d",
            }}
          >
            {/* chassis body */}
            <div
              className="absolute -inset-[22px] rounded-[24px]"
              style={{
                background:
                  "linear-gradient(155deg, #ffffff 0%, #f4f6f8 45%, #e4e9ee 100%)",
                transform: `translateZ(-${chassisDepth}px)`,
                boxShadow:
                  "0 70px 120px rgba(40, 55, 75, 0.28), 0 28px 48px rgba(40, 55, 75, 0.14)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* chassis front edge */}
              <div
                className="absolute left-0 right-0 rounded-b-[24px]"
                style={{
                  height: chassisDepth,
                  top: "100%",
                  background:
                    "linear-gradient(180deg, #d8dee6 0%, #c5ced8 100%)",
                  transformOrigin: "top",
                  transform: "rotateX(-90deg)",
                }}
              />
              {/* chassis right edge */}
              <div
                className="absolute top-0 bottom-0 rounded-r-[20px]"
                style={{
                  width: chassisDepth,
                  left: "100%",
                  background:
                    "linear-gradient(90deg, #cfd6de 0%, #b8c2cd 100%)",
                  transformOrigin: "left",
                  transform: "rotateY(90deg)",
                }}
              />
            </div>

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
