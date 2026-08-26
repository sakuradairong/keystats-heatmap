"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  KEYBOARD_HEIGHT_U,
  KEYBOARD_LAYOUT,
  KEYBOARD_UNIT,
  KEYBOARD_WIDTH_U,
  KEY_GAP,
  resolveKeyCount,
  type KeyDef,
} from "@/lib/keyboard-layout";
import {
  contrastText,
  darkenHex,
  heatColor,
  heatDomain,
  normalizeHeatCount,
} from "@/lib/heatmap-color";
import { formatCount } from "@/lib/keystats";

type Props = {
  keyCounts: Record<string, number>;
};

type ActiveKey = {
  id: string;
  pinned: boolean;
};

type TooltipPosition = {
  left: number;
  top: number;
};

const TOOLTIP_ID = "keyboard-key-tooltip";
const VIEWPORT_INSET = 12;

function KeyCap({
  keyDef,
  count,
  domainMax,
  active,
  registerRef,
  onFocusKey,
  onBlurKey,
  onPin,
}: {
  keyDef: KeyDef;
  count: number;
  domainMax: number;
  active: boolean;
  registerRef: (id: string, node: HTMLButtonElement | null) => void;
  onFocusKey: (id: string) => void;
  onBlurKey: (id: string, relatedTarget: EventTarget | null) => void;
  onPin: (id: string) => void;
}) {
  const unit = KEYBOARD_UNIT;
  const gap = KEY_GAP;
  const keyHeightUnits = keyDef.h ?? 1;
  const width = keyDef.w * unit - gap;
  const height = keyHeightUnits * unit - gap;
  const normalized = normalizeHeatCount(count, domainMax);
  const baseDepth = 12;
  const dataDepth = normalized * unit * 0.24;
  const totalDepth = baseDepth + dataDepth;
  const color = heatColor(count, domainMax);
  const textColor = contrastText(color);
  const leftFace = darkenHex(color, 0.11);
  const frontFace = darkenHex(color, 0.21);
  const rightFace = darkenHex(color, 0.31);
  const pad = Math.max(5, unit * 0.1);
  const labelSize = keyDef.w >= 2 ? 11 : 12;
  const countSize = keyDef.w >= 4 ? 10 : 9;
  const baseZ = Math.round(keyDef.y * 100 + keyDef.x);

  return (
    <button
      ref={(node) => registerRef(keyDef.id, node)}
      type="button"
      className="keycap absolute border-0 bg-transparent p-0 text-left"
      data-active={count > 0 ? "true" : "false"}
      data-hover={active ? "true" : "false"}
      data-key-id={keyDef.id}
      style={{
        left: keyDef.x * unit,
        top: keyDef.y * unit,
        width,
        height,
        transformStyle: "preserve-3d",
        zIndex: baseZ,
      }}
      onFocus={() => onFocusKey(keyDef.id)}
      onBlur={(event) => onBlurKey(keyDef.id, event.relatedTarget)}
      onClick={() => onPin(keyDef.id)}
      aria-label={`${keyDef.label}，${formatCount(count)} 次`}
      aria-describedby={active ? TOOLTIP_ID : undefined}
    >
      <span
        className="keycap-contact pointer-events-none absolute inset-[3px] rounded-[6px]"
        style={{
          opacity: 0.12 + normalized * 0.1,
          transform: "translateZ(1px) translateY(2px)",
        }}
      />

      <span
        className="keycap-prism pointer-events-none absolute inset-0"
        style={{
          transform: `translateZ(${totalDepth}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        <span
          className="keycap-face keycap-top absolute inset-0 rounded-[8px]"
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${color} 82%, white) 0%, ${color} 58%, ${darkenHex(color, 0.08)} 100%)`,
            color: textColor,
            boxShadow: active
              ? "inset 0 0 0 2px rgba(37,49,60,.88), inset 0 1px 0 rgba(255,255,255,.44)"
              : "inset 0 1px 0 rgba(255,255,255,.42)",
          }}
        >
          <span
            className="keycap-label absolute overflow-hidden text-ellipsis whitespace-nowrap font-display leading-none"
            style={{
              left: pad,
              top: pad * 0.8,
              maxWidth: `calc(100% - ${pad * 1.5}px)`,
              fontSize: labelSize,
              fontWeight: 600,
              letterSpacing: "0.015em",
            }}
          >
            {keyDef.label}
          </span>
          {count > 0 && (
            <span
              className="keycap-count absolute overflow-hidden text-ellipsis whitespace-nowrap font-mono tabular-nums leading-none"
              style={{
                right: pad * 0.85,
                bottom: pad * 0.72,
                maxWidth: "82%",
                fontSize: countSize,
                fontWeight: 600,
              }}
            >
              {formatCount(count)}
            </span>
          )}
        </span>

        <span
          className="keycap-face keycap-face-front absolute left-0 right-0 rounded-b-[7px]"
          style={{
            height: totalDepth,
            top: "100%",
            background: `linear-gradient(180deg, ${frontFace}, ${darkenHex(frontFace, 0.1)})`,
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
          }}
        />
        <span
          className="keycap-face keycap-face-right absolute bottom-0 top-0 rounded-r-[6px]"
          style={{
            width: totalDepth,
            left: "100%",
            background: `linear-gradient(90deg, ${rightFace}, ${darkenHex(rightFace, 0.1)})`,
            transformOrigin: "left",
            transform: "rotateY(90deg)",
          }}
        />
        <span
          className="keycap-face keycap-face-left absolute bottom-0 top-0 rounded-l-[6px]"
          style={{
            width: totalDepth,
            right: "100%",
            background: leftFace,
            transformOrigin: "right",
            transform: "rotateY(-90deg)",
          }}
        />
      </span>
    </button>
  );
}

export function KeyboardHeatmap({ keyCounts }: Props) {
  const canUsePortal = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [activeKey, setActiveKey] = useState<ActiveKey | null>(null);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const keyRefs = useRef(new Map<string, HTMLButtonElement>());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const activeKeyRef = useRef<ActiveKey | null>(null);
  const clearHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  activeKeyRef.current = activeKey;

  const resolvedKeys = useMemo(
    () =>
      KEYBOARD_LAYOUT.map((keyDef) => ({
        keyDef,
        count: resolveKeyCount(keyDef.id, keyCounts),
      })),
    [keyCounts]
  );
  const domainMax = useMemo(
    () => heatDomain(resolvedKeys.map(({ count }) => count)),
    [resolvedKeys]
  );
  const activeEntry = activeKey
    ? resolvedKeys.find(({ keyDef }) => keyDef.id === activeKey.id) ?? null
    : null;

  const registerRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) keyRefs.current.set(id, node);
      else keyRefs.current.delete(id);
    },
    []
  );

  const keyIdFromPoint = useCallback((clientX: number, clientY: number) => {
    const plate = plateRef.current;
    if (!plate) return null;
    for (const node of document.elementsFromPoint(clientX, clientY)) {
      if (!(node instanceof Element)) continue;
      const key = node.closest<HTMLElement>("[data-key-id]");
      if (key && plate.contains(key)) {
        return key.dataset.keyId ?? null;
      }
    }
    return null;
  }, []);

  const updateTooltipPosition = useCallback(() => {
    if (!activeKey) return;
    const anchor = keyRefs.current.get(activeKey.id);
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const preferredTop = anchorRect.top - tooltipRect.height - 10;
    const top =
      preferredTop >= VIEWPORT_INSET
        ? preferredTop
        : Math.min(
            window.innerHeight - tooltipRect.height - VIEWPORT_INSET,
            anchorRect.bottom + 10
          );
    const left = Math.min(
      window.innerWidth - tooltipRect.width - VIEWPORT_INSET,
      Math.max(
        VIEWPORT_INSET,
        anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      )
    );
    setTooltipPosition((current) => {
      if (
        current &&
        Math.abs(current.left - left) < 0.5 &&
        Math.abs(current.top - top) < 0.5
      ) {
        return current;
      }
      return { left, top };
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updateTooltipPosition();
  }, [activeKey, updateTooltipPosition]);

  useEffect(() => {
    if (!activeKey) return;
    const update = () => requestAnimationFrame(updateTooltipPosition);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [activeKey, updateTooltipPosition]);

  useEffect(() => {
    if (!activeKey?.pinned) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const activeElement = keyRefs.current.get(activeKey.id);
      if (!activeElement?.contains(event.target as Node)) setActiveKey(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveKey(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeKey]);

  const cancelClearHover = useCallback(() => {
    if (clearHoverTimerRef.current !== null) {
      clearTimeout(clearHoverTimerRef.current);
      clearHoverTimerRef.current = null;
    }
  }, []);

  const scheduleClearHover = useCallback(() => {
    cancelClearHover();
    clearHoverTimerRef.current = setTimeout(() => {
      clearHoverTimerRef.current = null;
      setActiveKey((current) => (current && !current.pinned ? null : current));
    }, 48);
  }, [cancelClearHover]);

  useEffect(() => () => cancelClearHover(), [cancelClearHover]);

  const handlePlatePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (activeKeyRef.current?.pinned) return;
    const id = keyIdFromPoint(event.clientX, event.clientY);
    if (!id) {
      // Brief grace across key gaps; clear if resting on chassis / empty plate.
      scheduleClearHover();
      return;
    }
    cancelClearHover();
    setActiveKey((current) => {
      if (current?.pinned) return current;
      if (current?.id === id) return current;
      return { id, pinned: false };
    });
  };

  const handlePlatePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (activeKeyRef.current?.pinned) return;
    cancelClearHover();
    setActiveKey((current) => (current && !current.pinned ? null : current));
  };

  const handleFocus = (id: string) => {
    setActiveKey({ id, pinned: false });
  };

  const handleBlur = (id: string, relatedTarget: EventTarget | null) => {
    if (
      relatedTarget instanceof Element &&
      plateRef.current?.contains(relatedTarget)
    ) {
      return;
    }
    setActiveKey((current) =>
      current?.id === id && !current.pinned ? null : current
    );
  };

  const handlePin = (id: string) => {
    setActiveKey((current) =>
      current?.id === id && current.pinned ? null : { id, pinned: true }
    );
  };

  const width = KEYBOARD_WIDTH_U * KEYBOARD_UNIT;
  const height = KEYBOARD_HEIGHT_U * KEYBOARD_UNIT;
  const chassisDepth = 24;

  return (
    <div className="keyboard-stage relative mx-auto w-full max-w-[1320px]">
      <div className="keyboard-edge-fade keyboard-edge-fade-left" />
      <div className="keyboard-edge-fade keyboard-edge-fade-right" />
      <div className="keyboard-scroll mx-auto w-full overflow-x-auto overflow-y-hidden">
        <div
          className="keyboard-scene relative mx-auto"
          style={{
            width: "var(--kb-scene-width)",
            maxWidth: 1180,
            aspectRatio: "var(--kb-aspect)",
            perspective: "var(--kb-perspective)",
            perspectiveOrigin: "50% 45%",
          }}
        >
          <div
            ref={plateRef}
            className="keyboard-plate absolute left-1/2 origin-center"
            onPointerMove={handlePlatePointerMove}
            onPointerLeave={handlePlatePointerLeave}
            style={{
              width,
              height,
              transform:
                "translate3d(-50%, 0, 0) rotateX(var(--kb-tilt)) rotateZ(var(--kb-yaw)) scale(var(--kb-scale))",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="keyboard-ground-shadow pointer-events-none absolute -inset-[28px] rounded-[28px]" />
            <div
              className="keyboard-chassis pointer-events-none absolute -inset-[22px] rounded-[22px]"
              style={{
                transform: `translateZ(-${chassisDepth}px)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="keyboard-chassis-front absolute left-0 right-0 rounded-b-[22px]"
                style={{
                  height: chassisDepth,
                  top: "100%",
                  transformOrigin: "top",
                  transform: "rotateX(-90deg)",
                }}
              />
              <div
                className="keyboard-chassis-right absolute bottom-0 top-0 rounded-r-[18px]"
                style={{
                  width: chassisDepth,
                  left: "100%",
                  transformOrigin: "left",
                  transform: "rotateY(90deg)",
                }}
              />
            </div>

            {resolvedKeys.map(({ keyDef, count }) => (
              <KeyCap
                key={keyDef.id}
                keyDef={keyDef}
                count={count}
                domainMax={domainMax}
                active={activeKey?.id === keyDef.id}
                registerRef={registerRef}
                onFocusKey={handleFocus}
                onBlurKey={handleBlur}
                onPin={handlePin}
              />
            ))}
          </div>
        </div>
      </div>

      {canUsePortal && activeEntry
        ? createPortal(
            <div
              ref={tooltipRef}
              id={TOOLTIP_ID}
              role="tooltip"
              className="keyboard-tooltip pointer-events-none fixed z-[1000] rounded-md px-3 py-2 font-mono text-xs tabular-nums"
              style={{
                left: tooltipPosition?.left ?? 0,
                top: tooltipPosition?.top ?? 0,
                visibility: tooltipPosition ? "visible" : "hidden",
              }}
            >
              <span className="font-display font-semibold">
                {activeEntry.keyDef.label}
              </span>
              <span className="mx-1.5 opacity-45">/</span>
              {formatCount(activeEntry.count)} 次
              {activeKey?.pinned && (
                <span className="ml-2 opacity-55">Esc 关闭</span>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
