"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { WeeklyStat, GenreStat } from "@/types";

const PALETTE = ["#C07D1C", "#28543E", "#132238", "#853333", "#D98E28", "#57534E", "#4A3B32"];

export function WeeklyMinutesChart({ data, dailyGoal = 25 }: { data: WeeklyStat[]; dailyGoal?: number }) {
  const chartData = data.map((d) => ({
    day: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }),
    minutes: d.minutes,
    goal: dailyGoal,
  }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D98E28" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#C07D1C" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(28, 25, 23, 0.08)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#57534E" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#57534E" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: "#FDFBF7",
            border: "1px solid rgba(192, 125, 28, 0.3)",
            borderRadius: 10,
            boxShadow: "0 8px 16px rgba(19, 34, 56, 0.1)",
            fontSize: 12,
            fontWeight: 500,
          }}
          formatter={(v) => [`${v} mins read`, "Reading Session"]}
        />
        <Bar dataKey="minutes" radius={[6, 6, 2, 2]} fill="url(#barGradient)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GenreDonutChart({ data }: { data: GenreStat[] }) {
  if (!data || !data.length) {
    return <p className="text-xs text-ink-muted py-12 text-center">Log reading sessions to map your literary genre mix.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="minutes"
          nameKey="genre"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          stroke="#FDFBF7"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value) => <span className="text-[11px] font-medium text-ink-soft">{value}</span>}
        />
        <Tooltip
          contentStyle={{
            background: "#FDFBF7",
            border: "1px solid rgba(28, 25, 23, 0.12)",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(v, name) => [`${v} mins`, `${name}`]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
