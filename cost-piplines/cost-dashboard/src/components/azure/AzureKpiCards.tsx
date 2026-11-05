import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useCsv } from "@/lib/useCsv";
import type { AzureKpiMonth, AzureMomChange } from "@/lib/types";
import { ArrowUpRight, ArrowDownRight, IndianRupee, Calendar, TrendingUp } from "lucide-react";

const fmt = (n: number) =>
    `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMonthName = (mStr: string) => {
    if (!mStr) return "Current Month";
    const parts = mStr.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const formatPrevMonthName = (mStr: string) => {
    if (!mStr) return "Previous Month";
    const parts = mStr.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 2, 1);
    return date.toLocaleDateString("default", { month: "long", year: "numeric" });
};

const getPreviousMonth = (monthStr: string): string => {
    const parts = monthStr.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

interface AzureKpiCardsProps {
    selectedMonth: string;
    basePath?: string;
}

export function AzureKpiCards({ selectedMonth, basePath = "/data/azure" }: AzureKpiCardsProps) {
    const { data: kpiRows } = useCsv<AzureKpiMonth>(`${basePath}/azure_usage_kpis_by_month.csv`);
    const { data: mom } = useCsv<AzureMomChange>(`${basePath}/azure_usage_mom_change.csv`);

    const activeRow = useMemo(() => {
        if (mom.length === 0) return null;
        if (!selectedMonth) return mom[mom.length - 1];
        return mom.find((x) => x.Month === selectedMonth) || mom[mom.length - 1];
    }, [mom, selectedMonth]);

    const pctChange = Number(activeRow?.["MoM % Change"]) || 0;
    const isUp = pctChange >= 0;

    const months = useMemo(() => [...new Set(kpiRows.map((d) => d.Month))].sort(), [kpiRows]);
    const effectiveMonth = selectedMonth || months[months.length - 1] || "";
    const previousMonth = getPreviousMonth(effectiveMonth);

    const current = useMemo(
        () => kpiRows.find((d) => d.Month === effectiveMonth),
        [kpiRows, effectiveMonth]
    );
    const previous = useMemo(
        () => kpiRows.find((d) => d.Month === previousMonth),
        [kpiRows, effectiveMonth]
    );

    const displayMonth = formatMonthName(effectiveMonth);
    const prevDisplayMonth = formatPrevMonthName(effectiveMonth);
    const totalCost = current?.["Total Cost"] ?? 0;
    const previousTotalCost = previous?.["Total Cost"] ?? 0;

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Cost */}
            <Card className="vision-card border-none p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">
                            ALLOCATION FOR PERIOD ({displayMonth})
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{fmt(totalCost)}</h3>
                        <p className="text-xs text-[#a0aec0]">Total Azure spend, pro-rated</p>
                    </div>
                    <div className="vision-icon-box h-10 w-10 text-white">
                        <IndianRupee className="h-5 w-5" />
                    </div>
                </div>
            </Card>

            {/* Previous Month Total Cost */}
            <Card className="vision-card border-none p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">PREVIOUS PERIOD SPEND ({prevDisplayMonth})</p>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{fmt(previousTotalCost)}</h3>
                        <p className="text-xs text-[#a0aec0]">Prior month total</p>
                    </div>
                    <div className="vision-icon-box h-10 w-10 text-white">
                        <Calendar className="h-5 w-5" />
                    </div>
                </div>
            </Card>

            {/* MoM % Change */}
            <Card className="vision-card border-none p-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">MOM VARIANCE</p>
                        <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-1.5 ${isUp ? "text-[#e31a1a]" : "text-[#01b574]"}`}>
                            {activeRow?.["MoM % Change"] !== "" ? (
                                <>
                                    {isUp ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                    {Math.abs(pctChange).toFixed(1)}%
                                </>
                            ) : (
                                "—"
                            )}
                        </h3>
                        <p className="text-xs text-[#a0aec0]">{isUp ? "Increased vs prior month" : "Decreased vs prior month"}</p>
                    </div>
                    <div className="vision-icon-box h-10 w-10 text-white">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                </div>
            </Card>
        </div>
    );
}
