import { useCsv } from "@/lib/useCsv";
import type {
  MonthTotal,
  MomChange,
  TopService,
  CategoryCost,
} from "@/lib/types";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Premium compact currency formatter (e.g. $300k instead of $300000)
const formatCompactCurrency = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
};

const formatFullCurrency = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value || 0);
  return `$${(isNaN(num) ? 0 : num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Vision UI neon vibrant color palette
const VISION_COLORS = [
  "#0075ff", // Electric Blue
  "#00c5ff", // Cyan
  "#7551ff", // Purple
  "#01b574", // Emerald
  "#ffb547", // Amber
  "#2cd9ff", // Ice
  "#e31a1a", // Red
  "#a0aec0", // Slate
  "#38bdf8", // Sky
  "#c084fc", // Lavender
];

interface ChartsSectionProps {
  selectedMonth: string;
  basePath?: string;
}

export function ChartsSection({ selectedMonth, basePath = "/data" }: ChartsSectionProps) {
  const { data: monthly } = useCsv<MonthTotal>(
    `${basePath}/monthly_totals_last_6_months.csv`,
  );
  const { data: mom } = useCsv<MomChange>(`${basePath}/mom_change.csv`);
  const { data: topServices } = useCsv<TopService>(`${basePath}/top_10_services.csv`);
  const { data: categories } = useCsv<CategoryCost>(
    `${basePath}/category_monthly_costs.csv`,
  );

  // Filter AWS monthly totals strictly to the last 6 months
  const monthlyLast6 = useMemo(() => {
    const sorted = [...(monthly || [])]
      .filter((m) => m && m.Month)
      .sort((a, b) => a.Month.localeCompare(b.Month));
    return sorted.slice(-6);
  }, [monthly]);

  const trendData = useMemo(() => {
    return monthlyLast6.map((m) => {
      const momRow = (mom || []).find((x) => x && x.Month === m.Month);
      return {
        Month: m.Month,
        "Total Cost": Number(m["Total Cost"]) || 0,
        "MoM % Change": momRow ? Number(momRow["MoM % Change"]) || 0 : 0,
      };
    });
  }, [monthlyLast6, mom]);

  const isSelectedMonthInTrend = useMemo(() => {
    return trendData.some((d) => d.Month === selectedMonth);
  }, [trendData, selectedMonth]);

  // Normalize top 10 services data
  const normalizedTopServices = useMemo(() => {
    return (topServices || [])
      .filter((s) => s && s.Service)
      .map((s) => ({
        Service: String(s.Service),
        Cost: Number(s.Cost ?? (s as any)["Total Cost"] ?? 0),
      }))
      .sort((a, b) => b.Cost - a.Cost)
      .slice(0, 8);
  }, [topServices]);

  // Normalize and group category monthly costs
  const { latestCategoryMonth, activeCategoryMonthName, totalCategoryCost } = useMemo(() => {
    if (!categories || categories.length === 0) {
      return { latestCategoryMonth: [], activeCategoryMonthName: "Latest Month", totalCategoryCost: 0 };
    }

    const availableMonths = [...new Set(categories.map((c) => c.Month).filter(Boolean))].sort();
    const effectiveCategoryMonth = selectedMonth && availableMonths.includes(selectedMonth)
      ? selectedMonth
      : availableMonths[availableMonths.length - 1];

    const currentRows = categories.filter((c) => c.Month === effectiveCategoryMonth);
    const total = currentRows.reduce((sum, c) => sum + (Number(c.Cost) || 0), 0);

    const formatMonthName = (mStr: string) => {
      if (!mStr) return "Latest Month";
      const parts = mStr.split("-");
      if (parts.length < 2) return mStr;
      const [year, month] = parts;
      const date = new Date(Number(year), Number(month) - 1, 1);
      if (isNaN(date.getTime())) return mStr;
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    };

    return {
      latestCategoryMonth: currentRows.sort((a, b) => Number(b.Cost) - Number(a.Cost)),
      activeCategoryMonthName: formatMonthName(effectiveCategoryMonth),
      totalCategoryCost: total,
    };
  }, [categories, selectedMonth]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* 1. Monthly Spend Trend (Area Chart) */}
      <div className="vision-card p-6 flex flex-col justify-between">
        <div className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Monthly Spend Overview</h3>
              <p className="text-xs text-[#a0aec0] mt-0.5">Historical trajectory over last 6 months</p>
            </div>
            <span className="text-xs font-bold text-[#01b574] px-2 py-0.5 rounded-full bg-[#01b574]/15 border border-[#01b574]/30">
              Live
            </span>
          </div>
        </div>
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="visionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0075ff" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#0075ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis dataKey="Month" stroke="#a0aec0" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#a0aec0" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(6, 11, 40, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "14px",
                  backdropFilter: "blur(20px)",
                  fontSize: "12px",
                  color: "#ffffff",
                }}
                formatter={(value) => [formatFullCurrency(value), "Total Spend"]}
              />
              {isSelectedMonthInTrend && (
                <ReferenceLine
                  x={selectedMonth}
                  stroke="#00c5ff"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                />
              )}
              <Area
                type="monotone"
                dataKey="Total Cost"
                stroke="#0075ff"
                fill="url(#visionAreaGradient)"
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#00c5ff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top Services (Bar Chart) */}
      <div className="vision-card p-6 flex flex-col justify-between">
        <div className="pb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Top Services by Spend</h3>
          <p className="text-xs text-[#a0aec0] mt-0.5">Highest cost drivers across accounts</p>
        </div>
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={normalizedTopServices}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="visionBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0075ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#00c5ff" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" horizontal={false} />
              <XAxis
                type="number"
                stroke="#a0aec0"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
                dy={5}
              />
              <YAxis
                type="category"
                dataKey="Service"
                width={110}
                stroke="#a0aec0"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(t) => (t && typeof t === "string" && t.length > 13) ? `${t.slice(0, 13)}...` : String(t || "")}
                dx={-5}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(6, 11, 40, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "14px",
                  backdropFilter: "blur(20px)",
                  fontSize: "12px",
                  color: "#ffffff",
                }}
                formatter={(value) => [formatFullCurrency(value), "Cost"]}
              />
              <Bar dataKey="Cost" fill="url(#visionBarGradient)" radius={[0, 8, 8, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Cost by Category (Donut Chart + Legend) */}
      <div className="vision-card p-6 flex flex-col justify-between">
        <div className="pb-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            Cost by Category ({activeCategoryMonthName})
          </h3>
          <p className="text-xs text-[#a0aec0] mt-0.5">Distribution by service domain</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 flex-1">
          <div className="w-full sm:w-1/2 flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={latestCategoryMonth}
                  dataKey="Cost"
                  nameKey="Category"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {latestCategoryMonth.map((c, i) => (
                    <Cell
                      key={i}
                      fill={VISION_COLORS[i % VISION_COLORS.length]}
                      className="outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(6, 11, 40, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "14px",
                    backdropFilter: "blur(20px)",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                  formatter={(value) => [formatFullCurrency(value), "Cost"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full sm:w-1/2 flex flex-col justify-center">
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1 select-none scrollbar-thin">
              {latestCategoryMonth.map((c, i) => {
                const pct = totalCategoryCost > 0 ? (c.Cost / totalCategoryCost) * 100 : 0;
                const color = VISION_COLORS[i % VISION_COLORS.length];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-slate-300 truncate" title={c.Category}>
                        {c.Category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right shrink-0">
                      <span className="font-bold text-white text-[11px]">
                        {formatFullCurrency(c.Cost)}
                      </span>
                      <span className="text-[10px] text-[#a0aec0] font-mono">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
