"use client";

import { useMemo, useRef, useState } from "react";

/* Validated chart palette (dataviz six-checks, surface #fffdf8):
   #9c2434 maroon-red · #b47a1d gold · #0e8f7e teal · #5865c0 indigo */
export const CHART_COLORS = ["#9c2434", "#b47a1d", "#0e8f7e", "#5865c0"];

export type Point = { label: string; value: number };

const fmtINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatValue(v: number, currency: boolean): string {
  return currency ? fmtINR.format(v) : String(v);
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

type TooltipState = { x: number; y: number; label: string; value: string } | null;

function Tooltip({ tip }: { tip: TooltipState }) {
  if (!tip) return null;
  return (
    <div
      className="chart-tooltip"
      style={{ left: tip.x, top: tip.y }}
      role="status"
    >
      <span className="chart-tooltip-label">{tip.label}</span>
      <span className="chart-tooltip-value">{tip.value}</span>
    </div>
  );
}

/* ---------- Area / line chart (single series, time on x) ---------- */

export function AreaChart({
  data,
  color = CHART_COLORS[0],
  currency = false,
  height = 220,
}: {
  data: Point[];
  color?: string;
  currency?: boolean;
  height?: number;
}) {
  const [tip, setTip] = useState<TooltipState>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 640;
  const H = height;
  const PAD = { top: 14, right: 12, bottom: 24, left: 46 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const pts = useMemo(
    () =>
      data.map((d, i) => ({
        x: PAD.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw),
        y: PAD.top + ih - (d.value / max) * ih,
        ...d,
      })),
    [data, iw, ih, max, PAD.left, PAD.top],
  );

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${(PAD.left + iw).toFixed(1)},${PAD.top + ih} L${PAD.left},${PAD.top + ih} Z`;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    const p = pts[nearest];
    setActiveIdx(nearest);
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (wrap) {
      setTip({
        x: (p.x / W) * wrap.width,
        y: (p.y / H) * wrap.height - 10,
        label: p.label,
        value: formatValue(p.value, currency),
      });
    }
  }

  const yTicks = [0, 0.5, 1].map((t) => ({
    v: max * t,
    y: PAD.top + ih - t * ih,
  }));
  const xEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={onMove}
        onMouseLeave={() => {
          setTip(null);
          setActiveIdx(null);
        }}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t.y}>
            <line x1={PAD.left} x2={PAD.left + iw} y1={t.y} y2={t.y} stroke="rgba(33,24,22,0.08)" />
            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="10.5" fill="#6b625d">
              {currency && t.v >= 1000 ? `₹${Math.round(t.v / 1000)}k` : currency ? `₹${Math.round(t.v)}` : Math.round(t.v)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % xEvery === 0 ? (
            <text
              key={i}
              x={pts[i].x}
              y={H - 6}
              textAnchor="middle"
              fontSize="10.5"
              fill="#6b625d"
            >
              {d.label}
            </text>
          ) : null,
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {activeIdx !== null ? (
          <>
            <line
              x1={pts[activeIdx].x}
              x2={pts[activeIdx].x}
              y1={PAD.top}
              y2={PAD.top + ih}
              stroke="rgba(33,24,22,0.2)"
              strokeDasharray="3 3"
            />
            <circle cx={pts[activeIdx].x} cy={pts[activeIdx].y} r="4.5" fill={color} stroke="#fffdf8" strokeWidth="2" />
          </>
        ) : null}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/* ---------- Vertical bars (counts by day) ---------- */

export function BarChart({
  data,
  color = CHART_COLORS[1],
  currency = false,
  height = 220,
}: {
  data: Point[];
  color?: string;
  currency?: boolean;
  height?: number;
}) {
  const [tip, setTip] = useState<TooltipState>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 640;
  const H = height;
  const PAD = { top: 14, right: 12, bottom: 24, left: 34 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = iw / Math.max(data.length, 1);
  const barW = Math.max(3, Math.min(22, slot - 2));
  const xEvery = Math.max(1, Math.ceil(data.length / 6));

  const yTicks = [0, 0.5, 1].map((t) => ({ v: max * t, y: PAD.top + ih - t * ih }));

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => {
          setTip(null);
          setActiveIdx(null);
        }}
        role="img"
        aria-label="Bar chart"
      >
        {yTicks.map((t) => (
          <g key={t.y}>
            <line x1={PAD.left} x2={PAD.left + iw} y1={t.y} y2={t.y} stroke="rgba(33,24,22,0.08)" />
            <text x={PAD.left - 7} y={t.y + 4} textAnchor="end" fontSize="10.5" fill="#6b625d">
              {Math.round(t.v)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const h = (d.value / max) * ih;
          const y = PAD.top + ih - h;
          return (
            <g key={i}>
              {/* invisible hit target wider than the mark */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={ih}
                fill="transparent"
                onMouseEnter={(e) => {
                  setActiveIdx(i);
                  const wrap = wrapRef.current?.getBoundingClientRect();
                  const svgRect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  if (wrap && svgRect) {
                    setTip({
                      x: ((x + barW / 2) / W) * wrap.width,
                      y: (y / H) * wrap.height - 10,
                      label: d.label,
                      value: formatValue(d.value, currency),
                    });
                  }
                }}
              />
              {d.value > 0 ? (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill={color}
                  opacity={activeIdx === null || activeIdx === i ? 1 : 0.45}
                  style={{ pointerEvents: "none" }}
                />
              ) : null}
              {i % xEvery === 0 ? (
                <text
                  x={PAD.left + i * slot + slot / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="#6b625d"
                >
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/* ---------- Horizontal bars (category / status breakdowns) ---------- */

export function HBarChart({
  data,
  colors,
  color = CHART_COLORS[0],
  currency = false,
}: {
  data: Point[];
  colors?: string[]; // per-row colors (status use); omit for single hue
  color?: string;
  currency?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="hbar-list">
      {data.map((d, i) => (
        <div key={d.label} className="hbar-row" title={`${d.label}: ${formatValue(d.value, currency)}`}>
          <span className="hbar-label">{d.label}</span>
          <span className="hbar-track">
            <span
              className="hbar-fill"
              style={{
                width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
                background: colors?.[i] ?? color,
              }}
            />
          </span>
          <span className="hbar-value">{formatValue(d.value, currency)}</span>
        </div>
      ))}
      {!data.length ? <p className="chart-empty">No data yet.</p> : null}
    </div>
  );
}

/* ---------- Sparkline (stat tiles) ---------- */

export function Sparkline({ data, color = CHART_COLORS[0] }: { data: number[]; color?: string }) {
  const W = 120;
  const H = 34;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
    y: H - 3 - (v / max) * (H - 6),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 120, height: 34 }} aria-hidden>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}
