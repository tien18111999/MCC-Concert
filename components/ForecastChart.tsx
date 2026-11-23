"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FORECAST_COLORS } from "@/components/ForecastColors";
import type { ForecastResult, TimelinePoint } from "@/lib/payments/services/ForecastService";

const TOTAL_COLOR = "#7df9ff";

type SeriesKey = "earlyBird" | "general" | "discounted" | "atDoor" | "vendors" | "total";

const SERIES: { key: SeriesKey; name: string; color: string }[] = [
  { key: "total", name: "Total", color: TOTAL_COLOR },
  { key: "earlyBird", name: "Early Bird", color: FORECAST_COLORS.earlyBird },
  { key: "general", name: "General", color: FORECAST_COLORS.general },
  { key: "discounted", name: "With discount", color: FORECAST_COLORS.discounted },
  { key: "atDoor", name: "At the door", color: FORECAST_COLORS.atDoor },
  { key: "vendors", name: "Vendors", color: FORECAST_COLORS.vendors },
];

const DRAW_MS = 3800; // how long the chart takes to build itself

const W = 900;
const H = 520;
const PAD = { left: 74, right: 28, top: 28, bottom: 52 };

const dollars = (cents: number) => "$" + Math.round(cents / 100).toLocaleString("en-US");

// Round the top of the axis up to a tidy number so the gridlines read well.
function niceMax(cents: number) {
  const value = Math.max(cents / 100, 1000);
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / step) * step * 100;
}

export function ForecastChart({ result, replayKey = 0 }: { result: ForecastResult; replayKey?: number }) {
  const gradientId = useId();
  const [progress, setProgress] = useState(0); // 0..1: how much of the timeline has been drawn
  const [replays, setReplays] = useState(0);
  const frame = useRef(0);

  // Build the chart over time on load and whenever the replay key changes (Random, Replay).
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DRAW_MS)); // the frame time can be a hair before start
      setProgress(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease in and out
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    setProgress(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [replayKey, replays]);

  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [hover, setHover] = useState<number | null>(null);

  const points = result.timeline;
  const yMax = niceMax(result.totals.grandTotal);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const y = (cents: number) => PAD.top + innerH - (cents / yMax) * innerH;

  const paths = useMemo(() => {
    const out = {} as Record<SeriesKey, string>;
    for (const { key } of SERIES) {
      out[key] = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
    }
    return out;
    // x and y only depend on these values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, yMax]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const xTicks = points.map((p, i) => ({ p, i })).filter(({ i }) => i === points.length - 1 || (points.length - 1 - i) % 7 === 0 || (i === 0 && (points.length - 1) % 7 >= 5));
  const visible = SERIES.filter((s) => !hidden.has(s.key));
  const active = hover === null ? null : points[hover];
  const last = points.length - 1;
  const headIndex = Math.min(last, Math.max(0, progress * last)); // fractional position of the drawing head
  const headX = PAD.left + (headIndex / Math.max(last, 1)) * innerW;
  const lo = Math.floor(headIndex);
  const hi = Math.min(last, lo + 1);
  const frac = headIndex - lo;
  const headValue = (key: SeriesKey) => points[lo][key] + (points[hi][key] - points[lo][key]) * frac;
  const drawing = progress < 1;
  const uid = gradientId.replace(/[^a-zA-Z0-9]/g, "");
  const milestoneIndex = points.findIndex((p) => p.date === result.phases.generalOpens);
  const milestone = milestoneIndex > 0 && milestoneIndex < last ? milestoneIndex : null;
  const headLabel = points[Math.round(headIndex)]?.label ?? "";

  function toggle(key: SeriesKey) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * last);
    setHover(Math.min(last, Math.max(0, i)));
  }

  return (
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.04] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-200/70">Total tickets</p>
          <p className="mt-1 text-3xl font-bold text-white sm:text-4xl">{result.totals.attendees.toLocaleString("en-US")}</p>
          <p className="text-xs text-white/45">
            {result.totals.onlineTicketCount.toLocaleString("en-US")} online · {result.input.atDoor.toLocaleString("en-US")} at the door
          </p>
        </div>
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.04] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-200/70">Total money</p>
          <p className="mt-1 text-3xl font-bold sm:text-4xl" style={{ color: TOTAL_COLOR, textShadow: "0 0 18px rgba(125,249,255,0.45)" }}>
            {dollars(result.totals.grandTotal)}
          </p>
          <p className="text-xs text-white/45">tickets + vendors, before card fees</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
          Projected revenue build-up
          <button
            type="button"
            onClick={() => setReplays((n) => n + 1)}
            className="ml-1 rounded-full border border-cyan-300/30 px-2.5 py-0.5 text-[10px] tracking-[0.2em] text-cyan-100/80 hover:bg-cyan-300/10"
          >
            ↻ Replay
          </button>
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Show or hide lines">
          {SERIES.map((s) => {
            const off = hidden.has(s.key);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-pressed={!off}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${off ? "border-white/10 text-white/35" : "border-white/25 text-white"}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: off ? "transparent" : s.color, boxShadow: off ? `inset 0 0 0 1px ${s.color}` : `0 0 8px ${s.color}` }} />
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-300/15 bg-[#030a14]">
        {["left-1.5 top-1.5 border-l border-t", "right-1.5 top-1.5 border-r border-t", "bottom-1.5 left-1.5 border-b border-l", "bottom-1.5 right-1.5 border-b border-r"].map((corner) => (
          <span key={corner} aria-hidden className={`pointer-events-none absolute z-10 h-4 w-4 border-cyan-300/70 ${corner}`} />
        ))}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 3px)" }}
        />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full touch-pan-y"
          role="img"
          aria-label={`Line chart of the projected revenue from ${points[0]?.label} to ${points[last]?.label}. The total reaches ${dollars(result.totals.grandTotal)}.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity="0.28" />
              <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-total`} x1={PAD.left} x2={W - PAD.right} y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38d5ff" />
              <stop offset="60%" stopColor="#7df9ff" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
            <linearGradient id={`${gradientId}-band`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity="0" />
              <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity="0.22" />
            </linearGradient>
            <radialGradient id={`${gradientId}-bg`} cx="50%" cy="100%" r="90%">
              <stop offset="0%" stopColor="#0b4a6e" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#06182a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#04070f" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${gradientId}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#38d5ff" fillOpacity="0.16" />
            </pattern>
            <filter id={`${gradientId}-soft`} x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`${gradientId}-glow`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <style>{`
            @keyframes fc-flow-${uid} { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -100 } }
            @keyframes fc-ping-${uid} { 0% { r: 5; opacity: 0.9 } 100% { r: 20; opacity: 0 } }
          `}</style>
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill={`url(#${gradientId}-bg)`} />
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill={`url(#${gradientId}-dots)`} />

          {/* grid */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#38d5ff" strokeOpacity={tick === 0 ? 0.55 : 0.12} strokeDasharray={tick === 0 ? undefined : "2 6"} />
              <line x1={PAD.left - 6} x2={PAD.left} y1={y(tick)} y2={y(tick)} stroke="#38d5ff" strokeOpacity="0.7" />
              <text x={PAD.left - 12} y={y(tick) + 4} textAnchor="end" fontSize="14" fill="#7fb6d6" fontFamily="ui-monospace, monospace">
                {dollars(tick)}
              </text>
            </g>
          ))}
          {xTicks.map(({ p, i }) => (
            <g key={p.date}>
              <line x1={x(i)} x2={x(i)} y1={PAD.top} y2={PAD.top + innerH} stroke="#38d5ff" strokeOpacity="0.07" />
              <text x={x(i)} y={H - 20} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} fontSize="14" fill="#7fb6d6" fontFamily="ui-monospace, monospace">
                {i === last ? "Festival day" : p.label}
              </text>
            </g>
          ))}

          {milestone !== null ? (
            <g pointerEvents="none">
              <line x1={x(milestone)} x2={x(milestone)} y1={PAD.top + 22} y2={PAD.top + innerH} stroke="#ff2d95" strokeOpacity="0.55" strokeDasharray="4 5" />
              <rect x={x(milestone) - 56} y={PAD.top + 4} width="112" height="20" rx="3" fill="#2a0a1c" stroke="#ff2d95" strokeOpacity="0.6" />
              <text x={x(milestone)} y={PAD.top + 18} textAnchor="middle" fontSize="11" fill="#ff8ac4" fontFamily="ui-monospace, monospace" letterSpacing="1.5">
                GENERAL OPENS
              </text>
            </g>
          ) : null}

          <clipPath id={`${gradientId}-clip`}>
            <rect x={PAD.left - 2} y={0} width={Math.max(0, headX - PAD.left + 2)} height={H} />
          </clipPath>

          <g clipPath={`url(#${gradientId}-clip)`}>
          {/* area under the total */}
          {!hidden.has("total") ? <path d={`${paths.total} L${x(last)} ${y(0)} L${x(0)} ${y(0)} Z`} fill={`url(#${gradientId})`} /> : null}

          {/* lines: the total last so it sits on top */}
          {[...visible].reverse().map((s) => (
            <path
              key={s.key}
              d={paths[s.key]}
              fill="none"
              stroke={s.key === "total" ? `url(#${gradientId}-total)` : s.color}
              strokeWidth={s.key === "total" ? 3.4 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter={s.key === "total" ? `url(#${gradientId}-glow)` : `url(#${gradientId}-soft)`}
              opacity={hover !== null && s.key !== "total" ? 0.9 : 1}
              style={{ transition: drawing ? undefined : "d 400ms ease" }}
            />
          ))}
          {!drawing && !hidden.has("total") ? (
            <path
              d={paths.total}
              pathLength={100}
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeDasharray="3 97"
              pointerEvents="none"
              style={{ animation: `fc-flow-${uid} 3.2s linear infinite`, filter: "drop-shadow(0 0 5px #fff)" }}
            />
          ) : null}
          </g>

          {/* the drawing head: a scanning line with a glowing dot on every curve */}
          {drawing ? (
            <g pointerEvents="none">
              <rect x={Math.max(PAD.left, headX - 110)} y={PAD.top} width={Math.min(110, headX - PAD.left)} height={innerH} fill={`url(#${gradientId}-band)`} />
              <line x1={headX} x2={headX} y1={PAD.top} y2={PAD.top + innerH} stroke={TOTAL_COLOR} strokeOpacity="0.8" />
              <text x={headX} y={PAD.top - 10} textAnchor={progress > 0.85 ? "end" : "middle"} fontSize="14" fill={TOTAL_COLOR} fontFamily="ui-monospace, monospace">
                {progress > 0.985 ? "Festival day" : headLabel}
              </text>
            </g>
          ) : null}
          {visible.map((s) => (
            <circle
              key={s.key}
              cx={headX}
              cy={y(headValue(s.key))}
              r={s.key === "total" ? 5 : 3.5}
              fill={s.color}
              style={s.key === "total" ? { filter: `drop-shadow(0 0 6px ${s.color})` } : undefined}
            />
          ))}

          {visible.some((s) => s.key === "total") ? (
            <circle
              cx={headX}
              cy={y(headValue("total"))}
              r="5"
              fill="none"
              stroke={TOTAL_COLOR}
              strokeWidth="1.5"
              pointerEvents="none"
              style={{ animation: `fc-ping-${uid} 1.8s ease-out infinite` }}
            />
          ) : null}

          {/* HUD callout on the end of the total line (below the point when the line ends near the top) */}
          {!drawing && !hidden.has("total") ? (
            (() => {
              const ey = y(points[last].total);
              const below = ey - 56 < PAD.top + 28;
              const boxY = below ? ey + 18 : ey - 56;
              return (
                <g pointerEvents="none">
                  <line x1={x(last)} y1={ey} x2={x(last) - 38} y2={below ? ey + 30 : ey - 34} stroke={TOTAL_COLOR} strokeOpacity="0.7" />
                  <rect x={x(last) - 160} y={boxY} width="122" height="44" rx="4" fill="#04141f" stroke={TOTAL_COLOR} strokeOpacity="0.7" />
                  <text x={x(last) - 150} y={boxY + 16} fontSize="10" fill="#7fb6d6" fontFamily="ui-monospace, monospace" letterSpacing="2">
                    PROJECTED
                  </text>
                  <text x={x(last) - 150} y={boxY + 35} fontSize="18" fill={TOTAL_COLOR} fontFamily="ui-monospace, monospace" fontWeight="700">
                    {dollars(points[last].total)}
                  </text>
                </g>
              );
            })()
          ) : null}

          {/* hover crosshair */}
          {active && hover !== null && !drawing ? (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#ffffff" strokeOpacity="0.35" strokeDasharray="3 4" />
              {visible.map((s) => (
                <circle key={s.key} cx={x(hover)} cy={y(active[s.key])} r="4" fill="#05020c" stroke={s.color} strokeWidth="2" />
              ))}
            </g>
          ) : null}
        </svg>

        {active && hover !== null && !drawing ? <Tooltip point={active} visible={visible} left={(x(hover) / W) * 100} /> : null}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/40">
        A model, not real sales: Early Bird sells evenly while it is on sale, General and discounted tickets evenly once General opens, vendors join evenly, and door tickets all land on festival day.
      </p>
    </div>
  );
}

function Tooltip({ point, visible, left }: { point: TimelinePoint; visible: { key: SeriesKey; name: string; color: string }[]; left: number }) {
  const flip = left > 62;
  return (
    <div
      className="pointer-events-none absolute top-2 min-w-40 rounded-lg border border-cyan-300/30 bg-[#04101c]/90 px-3 py-2 text-xs shadow-[0_0_24px_rgba(56,213,255,0.15)] backdrop-blur"
      style={flip ? { right: `${100 - left + 2}%` } : { left: `${left + 2}%` }}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-cyan-200/80">{point.label}</p>
      <ul className="mt-1 space-y-0.5">
        {visible.map((s) => (
          <li key={s.key} className="flex justify-between gap-4 text-white/85">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
            <span className="font-mono">{dollars(point[s.key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
