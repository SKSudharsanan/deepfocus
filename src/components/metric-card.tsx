import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import type { ReactNode, CSSProperties } from "react";

export type SparkPoint = { x: number; y: number };

type Accent = "primary" | "emerald" | "sky" | "amber" | "rose" | "zinc";
type Tone = "subtle" | "tinted" | "solid";
type Dots = "none" | "all" | "last";
type Fill = "none" | "soft";

function accentToCssVar(accent: Accent): string {
  switch (accent) {
    case "primary": return "hsl(var(--primary))";
    case "emerald": return "rgb(16 185 129)";  // emerald-500
    case "sky":     return "rgb(14 165 233)";  // sky-500
    case "amber":   return "rgb(245 158 11)";  // amber-500
    case "rose":    return "rgb(244 63 94)";   // rose-500
    case "zinc":    return "rgb(161 161 170)"; // zinc-400
  }
}

function toneClasses(tone: Tone) {
  if (tone === "solid")  return "bg-neutral-900 text-white border-neutral-800";
  if (tone === "tinted") return "bg-muted/40";
  return ""; // subtle = default card
}


function makeLastDot(dataLen: number, stroke: string) {
  // Recharts will pass cx, cy, index, etc.
  return function LastDot(props: any) {
    const { cx, cy, index } = props;
    if (index !== dataLen - 1 || cx == null || cy == null) {
      return <g />;                // ✅ return an SVG element, not null
    }
    return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} />;
  };
}

export function MetricCard({
  title,
  value,
  hint,
  data,
  accent = "primary",
  tone = "subtle",
  dots = "last",          // default: show only last data point
  fill = "none",          // "soft" gives a faint area fill
  strokeWidth = 2,
  action,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  data?: SparkPoint[];
  accent?: Accent;
  tone?: Tone;
  dots?: Dots;
  fill?: Fill;
  strokeWidth?: number;
  action?: ReactNode;
}) {
  const stroke = accentToCssVar(accent);
  const cssVars = { "--stroke": stroke } as CSSProperties;

  const dotProp =
  dots === "none"
    ? false
    : dots === "all"
    ? { r: 2, strokeWidth: 0, fill: stroke }
    : data && data.length
    ? makeLastDot(data.length, stroke)   // ✅ always returns an SVG element
    : false;

  return (
    <Card className={`rounded-2xl ${toneClasses(tone)}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          {action}
        </div>
        <div className="text-3xl font-semibold leading-tight">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </CardHeader>

      {data && data.length ? (
        <CardContent className="pt-2">
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                {/* pad the y-range so the line isn’t glued to edges */}
                <YAxis dataKey="y" hide domain={["dataMin - 1", "dataMax + 1"]} />
                {fill === "soft" && (
                  <defs>
                    <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={stroke} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                )}
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="var(--stroke)"
                  strokeOpacity={0.95}
                  strokeWidth={strokeWidth}
                  fill={fill === "soft" ? "url(#sparkFill)" : "transparent"}
                  dot={dotProp}
                  activeDot={false}
                  isAnimationActive={false}
                  style={cssVars}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
