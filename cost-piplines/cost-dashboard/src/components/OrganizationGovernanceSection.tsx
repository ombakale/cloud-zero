import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useCsv } from "@/lib/useCsv";
import { resolveBudgetsForMonth, type AccountSpendInfo } from "@/lib/budgetMatcher";
import type {
  GovernanceSummary,
  UnbudgetedAccountRow,
  BudgetOverviewRow,
  MonthlyTotal,
} from "@/lib/types";
import {
  ShieldCheck,
  Building2,
  PieChart,
  AlertTriangle,
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface OrganizationGovernanceSectionProps {
  selectedMonth: string;
  basePath?: string;
}

export function OrganizationGovernanceSection({
  selectedMonth,
  basePath = "/data",
}: OrganizationGovernanceSectionProps) {
  // 1. Fetch Summary JSON metadata (via API first, with fallback)
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [accountsForMonth, setAccountsForMonth] = useState<AccountSpendInfo[]>([]);
  const [latestMonthFromApi, setLatestMonthFromApi] = useState<string>("");

  useEffect(() => {
    let active = true;
    let account = "account-1";
    const accountMatch = basePath.match(/accounts\/([^/]+)/);
    if (accountMatch) {
      account = accountMatch[1];
    }

    const monthParam = selectedMonth ? `&month=${encodeURIComponent(selectedMonth)}` : "";
    const apiUrl = `/api/aws/dataset/governance_summary?account=${encodeURIComponent(account)}${monthParam}`;

    fetch(apiUrl)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(`API error ${res.status}`);
      })
      .then((data) => {
        if (!active) return;
        if (data) {
          const item = Array.isArray(data) ? data[0] : data;
          setSummary(item);
        }
      })
      .catch(() => {
        fetch(`${basePath}/governance_summary.json`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (active && data) setSummary(data);
          })
          .catch(() => {
            if (active) setSummary(null);
          });
      });

    // Fetch linked accounts spend for selectedMonth + latest month reference for budget matching
    Promise.all([
      fetch(`/api/aws/linked-accounts?account=${encodeURIComponent(account)}${monthParam}`).then((r) =>
        r.ok ? r.json() : null
      ),
      selectedMonth
        ? fetch(`/api/aws/linked-accounts?account=${encodeURIComponent(account)}`).then((r) =>
            r.ok ? r.json() : null
          )
        : Promise.resolve(null),
    ])
      .then(([monthRes, latestRes]) => {
        if (!active || !monthRes?.accounts) return;
        const refRes = latestRes?.accounts ? latestRes : monthRes;
        if (refRes?.selectedMonth) {
          setLatestMonthFromApi(refRes.selectedMonth);
        }
        const latestMap = new Map<string, number>();
        for (const a of refRes.accounts || []) {
          latestMap.set(a.linkedAccountId, Number(a.currentSpend || 0));
        }
        const mapped: AccountSpendInfo[] = (monthRes.accounts || []).map((a: any) => ({
          id: String(a.linkedAccountId || ""),
          name: String(a.accountName || a.linkedAccountId || ""),
          status: a.status,
          currentSpend: Number(a.currentSpend || 0),
          previousSpend: Number(a.previousSpend || 0),
          momChangePercent: Number(a.momChangePercent || 0),
          hasBudget: Boolean(a.hasBudget),
          topCostDriver: String(a.topCostDriver || "Cloud Services"),
          latestSpend: latestMap.get(a.linkedAccountId) ?? Number(a.currentSpend || 0),
        }));
        setAccountsForMonth(mapped);
      })
      .catch(() => {
        if (active) setAccountsForMonth([]);
      });

    return () => {
      active = false;
    };
  }, [basePath, selectedMonth]);

  // 2. Fetch Unbudgeted Accounts CSV (dynamic for selectedMonth)
  const unbudgetedPath = selectedMonth
    ? `${basePath}/unbudgeted_accounts.csv?month=${encodeURIComponent(selectedMonth)}`
    : `${basePath}/unbudgeted_accounts.csv`;
  const { data: unbudgetedAccounts } = useCsv<UnbudgetedAccountRow>(unbudgetedPath);

  // 3. Fetch Budgets Overview CSV & Monthly Totals
  const budgetsPath = selectedMonth
    ? `${basePath}/budgets_overview.csv?month=${encodeURIComponent(selectedMonth)}`
    : `${basePath}/budgets_overview.csv`;
  const { data: rawBudgetsOverview } = useCsv<BudgetOverviewRow>(budgetsPath);
  const { data: monthlyTotals } = useCsv<MonthlyTotal>(`${basePath}/monthly_totals_last_6_months.csv`);

  const budgetsOverview = useMemo(() => {
    const sortedMonths = (monthlyTotals || []).map((m) => m.Month).filter(Boolean).sort();
    const latestMonth = latestMonthFromApi || sortedMonths[sortedMonths.length - 1] || "";
    const targetRec = (monthlyTotals || []).find((m) => m.Month === selectedMonth);
    const latestRec = (monthlyTotals || []).find((m) => m.Month === latestMonth);
    const targetTotal = targetRec ? Number(targetRec["Total Cost"] || 0) : 0;
    const latestTotal = latestRec ? Number(latestRec["Total Cost"] || 0) : 0;
    const scaleRatio = latestTotal > 0 && targetTotal > 0 ? targetTotal / latestTotal : 1;
    const isLatest = !selectedMonth || !latestMonth || selectedMonth === latestMonth;

    return resolveBudgetsForMonth(rawBudgetsOverview || [], accountsForMonth, scaleRatio, isLatest);
  }, [rawBudgetsOverview, accountsForMonth, monthlyTotals, selectedMonth, latestMonthFromApi]);

  // 4. Compute Top 5 Spends (Top 5 Linked Accounts by spend for selectedMonth)
  const top5Spends = useMemo(() => {
    const unbudgetedIds = new Set(
      (unbudgetedAccounts || []).map((u) => String(u["Account ID"] || ""))
    );
    const hasAnyBudgets = (rawBudgetsOverview || []).length > 0;

    const source: AccountSpendInfo[] =
      accountsForMonth.length > 0
        ? accountsForMonth.map((a) => ({
            ...a,
            hasBudget:
              a.status?.toUpperCase() === "ACTIVE" &&
              hasAnyBudgets &&
              !unbudgetedIds.has(a.id) &&
              Boolean(a.hasBudget),
          }))
        : (unbudgetedAccounts || [])
            .filter((u) => u && u["Account Name"])
            .map((u) => ({
              id: String(u["Account ID"] || ""),
              name: String(u["Account Name"] || ""),
              status: String(u.Status || "ACTIVE"),
              currentSpend: Number(u["Current Month Spend"] || 0),
              previousSpend: Number(u["Previous Month Spend"] || 0),
              momChangePercent: Number(u["MoM Change %"] || 0),
              hasBudget: false,
              topCostDriver: String(u["Top Cost Driver"] || "Cloud Services"),
            }));

    return [...source]
      .sort(
        (a, b) =>
          b.currentSpend - a.currentSpend || (b.previousSpend || 0) - (a.previousSpend || 0)
      )
      .slice(0, 5);
  }, [accountsForMonth, unbudgetedAccounts, rawBudgetsOverview]);

  const totalOrgMonthSpend = useMemo(() => {
    if (summary && summary.activeSpendTotal > 0) return summary.activeSpendTotal;
    if (accountsForMonth.length > 0) {
      return accountsForMonth.reduce((sum, a) => sum + a.currentSpend, 0);
    }
    return top5Spends.reduce((sum, a) => sum + a.currentSpend, 0);
  }, [summary, accountsForMonth, top5Spends]);

  const top5TotalSpend = useMemo(
    () => top5Spends.reduce((sum, a) => sum + a.currentSpend, 0),
    [top5Spends]
  );

  const top5SharePct = useMemo(
    () =>
      totalOrgMonthSpend > 0
        ? Math.min(100, Number(((top5TotalSpend / totalOrgMonthSpend) * 100).toFixed(1)))
        : 0,
    [top5TotalSpend, totalOrgMonthSpend]
  );

  // Search & Pagination for Unbudgeted Accounts
  const [searchUnbudgeted, setSearchUnbudgeted] = useState("");
  const [pageUnbudgeted, setPageUnbudgeted] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Search & Pagination for Budgets Overview
  const [searchBudgets, setSearchBudgets] = useState("");
  const [pageBudgets, setPageBudgets] = useState(1);

  // Filter Unbudgeted Accounts
  const filteredUnbudgeted = (unbudgetedAccounts || []).filter((a) => {
    if (!a || !a["Account Name"]) return false;
    const term = searchUnbudgeted.toLowerCase();
    return (
      a["Account Name"].toLowerCase().includes(term) ||
      (a["Account ID"] && String(a["Account ID"]).toLowerCase().includes(term)) ||
      (a["Top Cost Driver"] && String(a["Top Cost Driver"]).toLowerCase().includes(term))
    );
  });
  const totalPagesUnbudgeted = Math.max(1, Math.ceil(filteredUnbudgeted.length / ITEMS_PER_PAGE));
  const paginatedUnbudgeted = filteredUnbudgeted.slice(
    (pageUnbudgeted - 1) * ITEMS_PER_PAGE,
    pageUnbudgeted * ITEMS_PER_PAGE
  );

  // Filter Budgets Overview
  const filteredBudgets = (budgetsOverview || []).filter((b) => {
    if (!b || !b["Budget Name"]) return false;
    const term = searchBudgets.toLowerCase();
    return (
      b["Budget Name"].toLowerCase().includes(term) ||
      (b["Threshold Status"] && String(b["Threshold Status"]).toLowerCase().includes(term))
    );
  });
  const totalPagesBudgets = Math.max(1, Math.ceil(filteredBudgets.length / ITEMS_PER_PAGE));
  const paginatedBudgets = filteredBudgets.slice(
    (pageBudgets - 1) * ITEMS_PER_PAGE,
    pageBudgets * ITEMS_PER_PAGE
  );

  // Month Formatter
  const formatMonthName = (mStr: string) => {
    if (!mStr || typeof mStr !== "string") return "Current Month";
    const parts = mStr.split("-");
    if (parts.length < 2) return mStr;
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(date.getTime())) return mStr;
    return date.toLocaleString("default", { month: "long" });
  };

  const monthLabel = selectedMonth ? formatMonthName(selectedMonth) : "Latest";

  return (
    <div className="space-y-6 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="vision-icon-box h-10 w-10 shrink-0 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              AWS Organization & Budget Governance
            </h2>
            <p className="text-xs text-[#a1a1aa]">
              Account inventory, budget enforcement, and unbudgeted financial exposure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="vision-badge-blue text-xs font-semibold py-1 px-3">
            Reporting Period: {monthLabel}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Accounts in Organisation */}
        <Card className="vision-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a1a1aa]">
                Org Accounts
              </span>
              <div className="vision-icon-box h-8 w-8 text-white">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {summary ? summary.totalAccounts : unbudgetedAccounts.length || "--"}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/10 pt-2 text-[#a1a1aa]">
              <span className="flex items-center gap-1.5 text-[#01b574] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#01b574]" />
                {summary ? `${summary.activeAccounts} active` : "Active accounts"}
              </span>
              <span className="text-[#a1a1aa]">
                {summary ? `${summary.suspendedAccounts} closed` : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Accounts with a Budget */}
        <Card className="vision-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a1a1aa]">
                Budget Coverage
              </span>
              <div className="vision-icon-box h-8 w-8 text-white">
                <PieChart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {summary ? `${summary.budgetCoveragePct}%` : "--%"}
              </span>
              <span className="text-xs text-[#a1a1aa] font-medium">
                {summary ? `${summary.accountsWithBudget}/${summary.activeAccounts}` : "covered"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/10 pt-2">
              <span className="text-[#01b574] font-medium">
                {summary ? `${summary.accountsWithBudget} with budget` : "Under budget"}
              </span>
              <span className="text-[#e31a1a] font-medium">
                {summary ? `${summary.accountsWithNoBudget} no budget` : "No budget"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Spend Under Management */}
        <Card className="vision-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a1a1aa]">
                {monthLabel} Active Spend
              </span>
              <div className="vision-icon-box h-8 w-8 text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              ${summary ? Number(summary?.activeSpendTotal ?? summary?.["Actual Spend"] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/10 pt-2">
              <span className="text-[#01b574] font-medium">
                ${summary ? Number(summary?.spendUnderBudget ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} under
              </span>
              <span className="text-[#e31a1a] font-medium">
                ${summary ? Number(summary?.spendWithNoBudget ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"} unbudgeted
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Sum of Budget Limits in Force */}
        <Card className="vision-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a1a1aa]">
                Budget Limits In Force
              </span>
              <div className="vision-icon-box h-8 w-8 text-white">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              ${summary ? Number(summary?.sumBudgetLimits ?? summary?.["Total Budget"] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--"}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/10 pt-2">
              <span className="text-[#a1a1aa]">
                Uncovered Share:
              </span>
              <span className="font-semibold text-[#e31a1a]">
                {summary ? `${summary.shareSpendUncoveredPct}%` : "--%"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Suspended Accounts Still Charging */}
        <Card className="vision-card border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a1a1aa]">
                Suspended Leakage
              </span>
              <div className="vision-icon-box h-8 w-8 text-white">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${summary && summary.suspendedAccountsChargingCount > 0 ? "text-[#e31a1a]" : "text-white"}`}>
                {summary ? summary.suspendedAccountsChargingCount : 0}
              </span>
              <span className="text-xs text-[#a1a1aa] font-medium">
                still charging
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/10 pt-2">
              <span className="text-[#a1a1aa]">
                {summary?.suspendedPeriodLabel || "Jun-Sep Total"}:
              </span>
              <span className="font-bold text-[#e31a1a]">
                ${summary ? Number(summary?.suspendedAccountsSpendTotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Data Tables (3-Column Grid: Top 5 Spends | Unbudgeted Accounts | AWS Budgets Overview) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Table 0: Top 5 Spends */}
        <Card className="vision-card flex flex-col h-full border-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#84cc16]" />
                  Top 5 Spends
                </CardTitle>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Highest-spending member accounts in {monthLabel}
                </p>
              </div>
              <span className="vision-badge-blue text-xs font-semibold py-0.5 px-2.5 shrink-0">
                {top5SharePct}% of org spend
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-4">
            {/* Summary Strip */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-[#141414]/70 px-3 py-2 text-xs">
              <span className="text-[#a1a1aa] font-medium">
                Top 5 Combined ({monthLabel}):
              </span>
              <span className="font-bold text-white">
                ${Number(top5TotalSpend || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="w-[36px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">#</TableHead>
                    <TableHead className="max-w-[150px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Account</TableHead>
                    <TableHead className="w-[95px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Share</TableHead>
                    <TableHead className="text-right whitespace-nowrap w-[90px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      {monthLabel} Spend
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5Spends.length > 0 ? (
                    top5Spends.map((acc, idx) => {
                      const sharePct =
                        totalOrgMonthSpend > 0
                          ? Math.min(100, Number(((acc.currentSpend / totalOrgMonthSpend) * 100).toFixed(1)))
                          : 0;
                      const mom = Number(acc.momChangePercent || 0);

                      return (
                        <TableRow key={acc.id || idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                          <TableCell className="py-2.5 w-[36px]">
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-lg text-[10px] font-bold ${
                                idx === 0
                                  ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                                  : "bg-white/10 text-[#a1a1aa]"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 max-w-[150px]">
                            <div className="font-semibold text-xs text-white truncate" title={acc.name}>
                              {acc.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#a1a1aa] font-mono">
                                {acc.id}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                                  acc.hasBudget
                                    ? "vision-badge-green"
                                    : "vision-badge-red"
                                }`}
                              >
                                {acc.hasBudget ? "Budgeted" : "No Budget"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 w-[95px]">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#84cc16] to-[#a3e635] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, sharePct)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-[#a1a1aa] min-w-[28px] text-right">
                                {sharePct}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap w-[90px] py-2.5">
                            <div className="font-semibold text-xs text-white">
                              ${Number(acc.currentSpend || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            {acc.previousSpend && acc.previousSpend > 0 ? (
                              <div
                                className={`text-[10px] font-medium ${
                                  mom > 0
                                    ? "text-[#e31a1a]"
                                    : mom < 0
                                    ? "text-[#01b574]"
                                    : "text-[#a1a1aa]"
                                }`}
                              >
                                {mom > 0 ? `+${mom}%` : `${mom}%`} MoM
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[#a1a1aa] py-8 text-xs">
                        No account spend data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs text-[#a1a1aa]">
              <span>Top {top5Spends.length} of {accountsForMonth.length || top5Spends.length} accounts</span>
              <span className="font-bold text-white">
                Org Total: ${Number(totalOrgMonthSpend || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Table 1: Largest Accounts with No Budget */}
        <Card className="vision-card flex flex-col h-full border-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#e31a1a]" />
                  Unbudgeted Accounts
                </CardTitle>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  High-spend active accounts without budget limits
                </p>
              </div>
              <span className="vision-badge-red text-xs font-semibold py-0.5 px-2.5">
                {filteredUnbudgeted.length} accounts
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search unbudgeted accounts..."
                value={searchUnbudgeted}
                onChange={(e) => {
                  setSearchUnbudgeted(e.target.value);
                  setPageUnbudgeted(1);
                }}
                className="w-full bg-[#141414]/90 pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 text-white placeholder-[#a1a1aa] focus:border-[#84cc16] focus:outline-none transition-all"
              />
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="max-w-[180px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Account</TableHead>
                    <TableHead className="w-[100px] hidden sm:table-cell text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Top Driver</TableHead>
                    <TableHead className="text-right whitespace-nowrap w-[90px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      {monthLabel} Spend
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUnbudgeted.length > 0 ? (
                    paginatedUnbudgeted.map((a, i) => (
                      <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                        <TableCell className="py-2.5 max-w-[180px]">
                          <div className="font-semibold text-xs text-white truncate" title={a["Account Name"]}>
                            {a["Account Name"]}
                          </div>
                          <div className="text-[10px] text-[#a1a1aa] font-mono">
                            {a["Account ID"]}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 w-[100px] hidden sm:table-cell">
                          <span className="text-xs text-[#a1a1aa] truncate block max-w-[120px]" title={a["Top Cost Driver"]}>
                            {a["Top Cost Driver"] || "Various"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap w-[90px] py-2.5 text-xs text-[#e31a1a]">
                          ${Number(a["Current Month Spend"] || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-[#a1a1aa] py-8 text-xs">
                        No unbudgeted accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <div className="text-xs text-[#a1a1aa]">
                {filteredUnbudgeted.length > 0
                  ? `Showing ${(pageUnbudgeted - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                      pageUnbudgeted * ITEMS_PER_PAGE,
                      filteredUnbudgeted.length
                    )} of ${filteredUnbudgeted.length}`
                  : "0-0 of 0"}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPageUnbudgeted((p) => Math.max(1, p - 1))}
                  disabled={pageUnbudgeted === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-medium min-w-[32px] text-center text-white">
                  {pageUnbudgeted} / {totalPagesUnbudgeted || 1}
                </span>
                <button
                  onClick={() => setPageUnbudgeted((p) => Math.min(totalPagesUnbudgeted, p + 1))}
                  disabled={pageUnbudgeted === totalPagesUnbudgeted || totalPagesUnbudgeted === 0}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table 2: AWS Budgets Overview & Health */}
        <Card className="vision-card flex flex-col h-full border-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#01b574]" />
                  AWS Budgets Overview
                </CardTitle>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Live budget limits & actual consumption
                </p>
              </div>
              <span className="vision-badge-green text-xs font-semibold py-0.5 px-2.5">
                {filteredBudgets.length} budgets
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchBudgets}
                onChange={(e) => {
                  setSearchBudgets(e.target.value);
                  setPageBudgets(1);
                }}
                className="w-full bg-[#141414]/90 pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 text-white placeholder-[#a1a1aa] focus:border-[#84cc16] focus:outline-none transition-all"
              />
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="max-w-[150px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Budget Name</TableHead>
                    <TableHead className="text-right whitespace-nowrap w-[70px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Limit</TableHead>
                    <TableHead className="text-right whitespace-nowrap w-[90px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">{monthLabel} Used</TableHead>
                    <TableHead className="w-[110px] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBudgets.length > 0 ? (
                    paginatedBudgets.map((b, i) => {
                      const limit = Number(b.Limit ?? b["Budget Limit"] ?? 0);
                      const used = Number(b["Current Used"] ?? b["Current Spend"] ?? 0);
                      const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
                      const isExceeded = b["Threshold Status"]?.toLowerCase().includes("exceeded") || pct >= 100;

                      return (
                        <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                          <TableCell className="py-2.5 max-w-[150px]">
                            <div className="font-semibold text-xs text-white truncate" title={b["Budget Name"]}>
                              {b["Budget Name"]}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                                  isExceeded
                                    ? "vision-badge-red"
                                    : "vision-badge-green"
                                }`}
                              >
                                {b["Threshold Status"] || (isExceeded ? "Exceeded" : "OK")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap w-[70px] py-2.5 text-xs text-[#a1a1aa]">
                            ${Number(limit || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right font-bold whitespace-nowrap w-[70px] py-2.5 text-xs text-white">
                            ${Number(used || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="w-[110px] py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 100
                                      ? "bg-[#e31a1a]"
                                      : pct >= 80
                                      ? "bg-[#ffb547]"
                                      : "bg-[#01b574]"
                                  }`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono font-medium text-[#a1a1aa] min-w-[28px] text-right">
                                {pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[#a1a1aa] py-8 text-xs">
                        No budgets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <div className="text-xs text-[#a1a1aa]">
                {filteredBudgets.length > 0
                  ? `Showing ${(pageBudgets - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                      pageBudgets * ITEMS_PER_PAGE,
                      filteredBudgets.length
                    )} of ${filteredBudgets.length}`
                  : "0-0 of 0"}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPageBudgets((p) => Math.max(1, p - 1))}
                  disabled={pageBudgets === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-medium min-w-[32px] text-center text-white">
                  {pageBudgets} / {totalPagesBudgets || 1}
                </span>
                <button
                  onClick={() => setPageBudgets((p) => Math.min(totalPagesBudgets, p + 1))}
                  disabled={pageBudgets === totalPagesBudgets || totalPagesBudgets === 0}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
