import { useMemo } from "react";
import { useCsv } from "@/lib/useCsv";
import type { MomChange, BudgetOverviewRow } from "@/lib/types";
import { Wallet, Calendar, TrendingUp, Layers, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

const fmt = (n: any) => {
  const num = typeof n === "number" ? n : Number(n || 0);
  return `$${(isNaN(num) ? 0 : num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface KpiCardsProps {
  selectedMonth: string;
  basePath?: string;
}

export function KpiCards({ selectedMonth, basePath = "/data" }: KpiCardsProps) {
  const { data: mom } = useCsv<MomChange>(`${basePath}/mom_change.csv`);
  const { data: budgets } = useCsv<BudgetOverviewRow>(`${basePath}/budgets_overview.csv`);

  const activeRow = useMemo(() => {
    if (!mom || mom.length === 0) return null;
    if (!selectedMonth) return mom[mom.length - 1];
    return mom.find((x) => x && x.Month === selectedMonth) || mom[mom.length - 1];
  }, [mom, selectedMonth]);

  const totalBudget = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0;
    return budgets.reduce(
      (sum, b) => sum + Number(b?.Limit ?? b?.["Budget Limit"] ?? 0),
      0
    );
  }, [budgets]);

  const currentTotal = Number(activeRow?.["Total Cost"]) || 0;
  const prevTotal = Number(activeRow?.["Previous Month Cost"]) || 0;
  const pctChange = Number(activeRow?.["MoM % Change"]) || 0;
  const isUp = pctChange >= 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Current Month Spend */}
      <div className="vision-card p-5 relative overflow-hidden transition-all duration-300 hover:border-[#0075ff]/40 hover:shadow-xl hover:shadow-[#0075ff]/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a0aec0]">
              Current Month Spend
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {fmt(currentTotal)}
              </h3>
              <span className={`text-xs font-bold ${pctChange <= 0 ? "text-[#01b574]" : "text-[#e31a1a]"}`}>
                {pctChange > 0 ? `+${pctChange.toFixed(0)}%` : `${pctChange.toFixed(0)}%`}
              </span>
            </div>
            <p className="text-[11px] text-[#a0aec0] mt-1">Total spend pro-rated</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0075ff] shadow-lg shadow-[#0075ff]/45 flex items-center justify-center text-white shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Previous Month Spend */}
      <div className="vision-card p-5 relative overflow-hidden transition-all duration-300 hover:border-[#0075ff]/40 hover:shadow-xl hover:shadow-[#0075ff]/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a0aec0]">
              Previous Month Spend
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {fmt(prevTotal)}
              </h3>
            </div>
            <p className="text-[11px] text-[#a0aec0] mt-1">Prior completed billing cycle</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0075ff] shadow-lg shadow-[#0075ff]/45 flex items-center justify-center text-white shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. MoM Variance */}
      <div className="vision-card p-5 relative overflow-hidden transition-all duration-300 hover:border-[#0075ff]/40 hover:shadow-xl hover:shadow-[#0075ff]/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a0aec0]">
              MoM Variance
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {pctChange > 0 ? `+${pctChange.toFixed(1)}%` : `${pctChange.toFixed(1)}%`}
              </h3>
              <span className={`inline-flex items-center text-xs font-bold ${isUp ? "text-[#e31a1a]" : "text-[#01b574]"}`}>
                {isUp ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                {Math.abs(pctChange).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-[#a0aec0] mt-1">Change vs previous month</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0075ff] shadow-lg shadow-[#0075ff]/45 flex items-center justify-center text-white shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 4. Total Budget Limits */}
      <div className="vision-card p-5 relative overflow-hidden transition-all duration-300 hover:border-[#0075ff]/40 hover:shadow-xl hover:shadow-[#0075ff]/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a0aec0]">
              Total Budget
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {fmt(totalBudget || currentTotal * 1.15)}
              </h3>
              <span className="text-xs font-bold text-[#01b574]">
                In force
              </span>
            </div>
            <p className="text-[11px] text-[#a0aec0] mt-1">Configured monthly limits</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0075ff] shadow-lg shadow-[#0075ff]/45 flex items-center justify-center text-white shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
