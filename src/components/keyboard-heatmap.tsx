"use client";

import { useMemo, useState } from "react";
import {
  KEYBOARD_HEIGHT_U,
  KEYBOARD_LAYOUT,
  KEYBOARD_UNIT,
  KEYBOARD_WIDTH_U,
  KEY_GAP,
  resolveKeyCount,
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
  keyDef: (typeof KEYBOARD_LAYOUT)[number];
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
  const depth = Math.max(16, unit * 0.3);
  const color = heatColor(count, maxCount);
  const frontColor = darkenHex(color, 0.2);
  const sideColor = darkenHex(color, 0.32);
  const text = contrastText();
  const pad = Math.max(4, unit * 0.09);

  const normalized =
    maxCount > 0 ? Math.sqrt(Math.max(0, count) / maxCount) : 0;
  const heatLift = normalized * unit * 0.7;
  const baseLift = depth + 6;
  const lift = baseLift + heatLift;
  const finalLift = hovered ? lift + 8 : lift;

  const labelSize =
    keyDef.w >= 4
      ? Math.max(9, unit * 0.16)
      : keyDef.w >= 2
        ? Math.max(8, unit * 0.15)
        : Math.max(9, unit * 0.175);
  const countSize =
    keyDef.w >= 4
      ? Math.max(8, unit * 0.14)
      : Math.max(7, unit * 0.125);

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
        zIndex: hovered
          ? 80
          : Math.round(keyDef.y * 40 + keyDef.x + heatLift * 2),
      }}
      onMouseEnter={() => onHover(keyDef.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(keyDef.id)}
      onBlur={() => onHover(null)}
      aria-label={`${keyDef.label}: ${count}`}
    >
      <span
        className="pointer-events-none absolute inset-[2px] rounded-[5px]"
        style={{
          background: "rgba(40, 55, 75, 0.2)",
          transform: "translateZ(1px) translateY(3px)",
          filter: "blur(2.5px)",
        }}
      />

      <span
        className="keycap-solid pointer-events-none absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${finalLift}px)`,
          transition: "transform 200ms ease, filter 200ms ease",
        }}
      >
        <span
          className="absolute inset-0 overflow-hidden rounded-[6px]"
          style={{
            pointerEvents: "auto",
            background: `linear-gradient(155deg, ${color} 0%, ${darkenHex(color, 0.08)} 100%)`,
            color: text,
            transform: "translateZ(0)",
            boxShadow: hovered
              ? "0 16px 26px rgba(40, 55, 75, 0.22), inset 0 1px 0 rgba(255,255,255,0.5)"
              : "0 5px 12px rgba(40, 55, 75, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="absolute font-display leading-none"
            style={{
              left: pad,
              top: pad * 0.75,
              fontSize: labelSize,
              fontWeight: 500,
              letterSpacing: "0.01em",
              maxWidth: "calc(100% - 8px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {keyDef.label}
          </span>
          <span
            className="absolute font-mono tabular-nums leading-none"
            style={{
              right: pad * 0.85,
              bottom: pad * 0.65,
              fontSize: countSize,
              fontWeight: 600,
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formatCount(count)}
          </span>

          {hovered && (
            <span
              className="pointer-events-none absolute left-1/2 top-0 z-30 whitespace-nowrap rounded-md bg-slate-800/92 px-2 py-1 font-mono text-[11px] font-semibold text-white shadow-lg"
              style={{
                transform: "translate3d(-50%, calc(-100% - 10px), 56px)",
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
            background: `linear-gradient(180deg, ${frontColor} 0%, ${darkenHex(color, 0.28)} 100%)`,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />

        <span
          className="absolute top-0 bottom-0 rounded-r-[5px]"
          style={{
            width: depth,
            left: "100%",
            background: `linear-gradient(90deg, ${sideColor} 0%, ${darkenHex(color, 0.4)} 100%)`,
            transformOrigin: "left",
            transform: "rotateY(90deg)",
          }}
        />

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
  const chassisDepth = 32;

  return (
    <div className="keyboard-stage relative mx-auto w-full max-w-[1320px]">
      <div className="keyboard-scroll mx-auto w-full overflow-x-auto overflow-y-visible sm:overflow-visible">
        <div
          className="keyboard-scene relative mx-auto"
          style={{
            width: "max(100%, 720px)",
            maxWidth: 1180,
            aspectRatio: "var(--kb-aspect, 1.8 / 1)",
            perspective: "var(--kb-perspective, 1100px)",
            perspectiveOrigin: "50% 35%",
          }}
        >
          <div
            className="keyboard-plate absolute left-1/2 top-[10%] origin-center"
            style={{
              width,
              height,
              transform:
                "translateX(-50%) rotateX(var(--kb-tilt, 62deg)) rotateZ(var(--kb-yaw, -35deg)) scale(var(--kb-scale, 0.84))",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute -inset-[24px] rounded-[24px]"
              style={{
                background:
                  "linear-gradient(155deg, #ffffff 0%, #f4f6f8 45%, #e4e9ee 100%)",
                transform: `translateZ(-${chassisDepth}px)`,
                boxShadow:
                  "0 70px 120px rgba(40, 55, 75, 0.24), 0 28px 48px rgba(40, 55, 75, 0.14)",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute left-0 right-0 rounded-b-[24px]"
                style={{
                  height: chassisDepth,
                  top: "100%",
                  background:
                    "linear-gradient(180deg, #d5dce6 0%, #b9c3ce 100%)",
                  transformOrigin: "top",
                  transform: "rotateX(-90deg)",
                }}
              />
              <div
                className="absolute top-0 bottom-0 rounded-r-[20px]"
                style={{
                  width: chassisDepth,
                  left: "100%",
                  background:
                    "linear-gradient(90deg, #c8d1db 0%, #aeb8c4 100%)",
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
