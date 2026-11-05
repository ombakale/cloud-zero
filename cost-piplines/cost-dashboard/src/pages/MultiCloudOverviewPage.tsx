import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Navbar, type AccountOption } from "@/components/Navbar";
import { AdminRequestsModal } from "@/components/AdminRequestsModal";
import { useAccountRequests } from "@/lib/useAccountRequests";
import { useCsv } from "@/lib/useCsv";
import type {
  MonthTotal,
  AzureMonthlyTotal,
  GovernanceSummary,
  UnbudgetedAccountRow,
  BudgetOverviewRow,
} from "@/lib/types";
import {
  Cloud,
  ArrowRight,
  Layers,
  Plus,
  Inbox,
  Shield,
  Building2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AzureGovernanceSummary {
  totalAccounts?: number;
  budgetedAccounts?: number;
  unbudgetedAccounts?: number;
  permissionDeniedAccounts?: number;
  totalBudgetedSpend?: number;
  activeSpend?: number;
}

interface AzureBudgetRow {
  "Linked Account": string;
  "Account ID": string;
  "Budget Name": string;
  "Budget Limit": number;
  "Actual Spend": number;
  "% Utilized": number;
  Status: string;
  "Permission Error"?: string;
}

const DEFAULT_AWS_ACCOUNTS: AccountOption[] = [
  {
    id: "account-1",
    name: "AWS Account 1 (5076-7238-5186)",
    accountId: "5076-7238-5186",
    accountName: "AWS Account 1",
    path: "/data",
  },
  {
    id: "account-2",
    name: "AWS Account 2 (5131-6780-3309)",
    accountId: "5131-6780-3309",
    accountName: "AWS Account 2",
    path: "/data/accounts/account-2",
  },
];

const formatAwsAccount = (acc: AccountOption): AccountOption => {
  const rawName = (acc.name || "")
    .replace(/\s*\(Primary\)/gi, "")
    .replace(/\s*\(Secondary\)/gi, "")
    .trim();
  let accountName = acc.accountName
    ? acc.accountName
        .replace(/\s*\(Primary\)/gi, "")
        .replace(/\s*\(Secondary\)/gi, "")
        .trim()
    : "";
  let accountId = acc.accountId || "";

  const match = rawName.match(/\(([^)]+)\)/);
  if (match) {
    accountId = match[1];
    accountName = rawName.replace(/\s*\([^)]+\)/, "").trim();
  } else if (!accountName) {
    accountName = rawName;
  }

  return {
    ...acc,
    name: accountId && accountName ? `${accountName} (${accountId})` : rawName,
    accountName: accountName || rawName,
    accountId: accountId || acc.id,
  };
};

/** Clean SVG Donut Gauge for Budget Coverage */
function CoverageGauge({
  percentage,
  colorClass,
  size = 64,
}: {
  percentage: number;
  colorClass: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const strokeWidth = 6.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
}

export function MultiCloudOverviewPage() {
  const navigate = useNavigate();
  const { records } = useAccountRequests();
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = useState(false);

  // AWS Account State
  const [awsAccounts, setAwsAccounts] = useState<AccountOption[]>(DEFAULT_AWS_ACCOUNTS);
  const [selectedAwsAccount, setSelectedAwsAccount] = useState<string>("account-1");

  useEffect(() => {
    fetch("/api/aws/accounts")
      .then((res) => {
        if (res.ok) return res.json();
        return fetch("/data/accounts.json").then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(formatAwsAccount);
          setAwsAccounts(formatted);
          if (!formatted.some((a) => a.id === selectedAwsAccount)) {
            setSelectedAwsAccount(formatted[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentAwsAccount = useMemo(
    () => awsAccounts.find((a) => a.id === selectedAwsAccount) || awsAccounts[0],
    [awsAccounts, selectedAwsAccount]
  );
  const awsBasePath = currentAwsAccount?.path || "/data";

  // Latest months for AWS & Azure
  const { data: awsMonthly } = useCsv<MonthTotal>(
    `${awsBasePath}/monthly_totals_last_6_months.csv`
  );
  const { data: azureMonthly } = useCsv<AzureMonthlyTotal>(
    `/data/azure/azure_usage_monthly_totals.csv`
  );

  const awsLatestMonth = useMemo(() => {
    const sorted = (awsMonthly || [])
      .filter((m) => m && m.Month)
      .map((m) => m.Month)
      .sort();
    return sorted.length > 0 ? sorted[sorted.length - 1] : "";
  }, [awsMonthly]);

  const azureLatestMonth = useMemo(() => {
    const sorted = (azureMonthly || [])
      .filter((m) => m && m.Month)
      .map((m) => m.Month)
      .sort();
    return sorted.length > 0 ? sorted[sorted.length - 1] : "";
  }, [azureMonthly]);

  const formatMonthName = (mStr: string) => {
    if (!mStr) return "Current Month";
    const parts = mStr.split("-");
    if (parts.length < 2) return mStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    if (isNaN(date.getTime())) return mStr;
    return date.toLocaleString("default", { month: "long" });
  };

  const awsMonthLabel = formatMonthName(awsLatestMonth);
  const azureMonthLabel = formatMonthName(azureLatestMonth);

  // AWS Governance Data
  const [awsSummary, setAwsSummary] = useState<GovernanceSummary | null>(null);

  useEffect(() => {
    let active = true;
    const monthParam = awsLatestMonth ? `&month=${encodeURIComponent(awsLatestMonth)}` : "";
    const apiUrl = `/api/aws/dataset/governance_summary?account=${encodeURIComponent(
      selectedAwsAccount
    )}${monthParam}`;

    fetch(apiUrl)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(`API ${res.status}`);
      })
      .then((data) => {
        if (!active) return;
        if (data) setAwsSummary(Array.isArray(data) ? data[0] : data);
      })
      .catch(() => {
        fetch(`${awsBasePath}/governance_summary.json`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (active && data) setAwsSummary(data);
          })
          .catch(() => {
            if (active) setAwsSummary(null);
          });
      });

    return () => {
      active = false;
    };
  }, [awsBasePath, selectedAwsAccount, awsLatestMonth]);

  const unbudgetedPath = awsLatestMonth
    ? `${awsBasePath}/unbudgeted_accounts.csv?month=${encodeURIComponent(awsLatestMonth)}`
    : `${awsBasePath}/unbudgeted_accounts.csv`;
  const { data: awsUnbudgeted } = useCsv<UnbudgetedAccountRow>(unbudgetedPath);

  const budgetsPath = awsLatestMonth
    ? `${awsBasePath}/budgets_overview.csv?month=${encodeURIComponent(awsLatestMonth)}`
    : `${awsBasePath}/budgets_overview.csv`;
  const { data: awsBudgets } = useCsv<BudgetOverviewRow>(budgetsPath);

  // Pagination states
  const [pageAwsUnbudgeted, setPageAwsUnbudgeted] = useState(1);
  const [pageAwsBudgets, setPageAwsBudgets] = useState(1);
  const [pageAzureBudgets, setPageAzureBudgets] = useState(1);
  const itemsPerPage = 5;

  const validAwsUnbudgeted = useMemo(
    () => (awsUnbudgeted || []).filter((a) => a && a["Account Name"]),
    [awsUnbudgeted]
  );
  const totalPagesAwsUnbudgeted = Math.max(
    1,
    Math.ceil(validAwsUnbudgeted.length / itemsPerPage)
  );

  const paginatedAwsUnbudgeted = useMemo(
    () =>
      validAwsUnbudgeted.slice(
        (pageAwsUnbudgeted - 1) * itemsPerPage,
        pageAwsUnbudgeted * itemsPerPage
      ),
    [validAwsUnbudgeted, pageAwsUnbudgeted, itemsPerPage]
  );

  const validAwsBudgets = useMemo(
    () => (awsBudgets || []).filter((b) => b && b["Budget Name"]),
    [awsBudgets]
  );
  const totalPagesAwsBudgets = Math.max(
    1,
    Math.ceil(validAwsBudgets.length / itemsPerPage)
  );

  const paginatedAwsBudgets = useMemo(
    () =>
      validAwsBudgets.slice(
        (pageAwsBudgets - 1) * itemsPerPage,
        pageAwsBudgets * itemsPerPage
      ),
    [validAwsBudgets, pageAwsBudgets, itemsPerPage]
  );

  // Azure Governance Data
  const [azureSummary, setAzureSummary] = useState<AzureGovernanceSummary | null>(null);
  const [azureBudgets, setAzureBudgets] = useState<AzureBudgetRow[]>([]);
  const [azureUnbudgetedCount, setAzureUnbudgetedCount] = useState(0);
  const [syncingAzure, setSyncingAzure] = useState(false);

  const loadAzureData = () => {
    const monthParam = azureLatestMonth
      ? `?month=${encodeURIComponent(azureLatestMonth)}`
      : "";
    Promise.all([
      fetch(`/api/azure/dataset/governance_summary${monthParam}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/azure/dataset/budgets_overview${monthParam}`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/azure/dataset/unbudgeted_accounts${monthParam}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([summaryData, budgetsData, unbudgetedData]) => {
        if (summaryData) setAzureSummary(summaryData);
        if (Array.isArray(budgetsData)) setAzureBudgets(budgetsData);
        if (Array.isArray(unbudgetedData)) setAzureUnbudgetedCount(unbudgetedData.length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAzureData();
  }, [azureLatestMonth]);

  const handleSyncAzureBudgets = async () => {
    setSyncingAzure(true);
    try {
      const res = await fetch("/api/azure/budgets/sync", { method: "POST" });
      if (res.ok) loadAzureData();
    } catch {
      // ignore
    } finally {
      setSyncingAzure(false);
    }
  };

  const activeAzureBudgets = useMemo(
    () =>
      azureBudgets.filter(
        (b) => b.Status !== "Permission Denied" && b.Status !== "Unbudgeted"
      ),
    [azureBudgets]
  );
  const totalPagesAzureBudgets = Math.max(
    1,
    Math.ceil(activeAzureBudgets.length / itemsPerPage)
  );

  const paginatedAzureBudgets = useMemo(
    () =>
      activeAzureBudgets.slice(
        (pageAzureBudgets - 1) * itemsPerPage,
        pageAzureBudgets * itemsPerPage
      ),
    [activeAzureBudgets, pageAzureBudgets, itemsPerPage]
  );

  const azureTotalAccounts =
    azureSummary?.totalAccounts || azureBudgets.length || azureUnbudgetedCount || 0;
  const azureBudgetedAccounts =
    azureSummary?.budgetedAccounts ||
    azureBudgets.filter(
      (b) => b.Status === "On Track" || b.Status === "Warning" || b.Status === "Exceeded"
    ).length;
  const azurePermissionDenied =
    azureSummary?.permissionDeniedAccounts ||
    azureBudgets.filter((b) => b.Status === "Permission Denied").length;
  const azureCoveragePct =
    azureTotalAccounts > 0
      ? Math.round((azureBudgetedAccounts / azureTotalAccounts) * 100)
      : 0;

  const awsBudgetedSpendPct = useMemo(() => {
    if (!awsSummary || !awsSummary.activeSpendTotal) return 50;
    return Math.max(
      5,
      Math.min(
        95,
        Math.round((awsSummary.spendUnderBudget / awsSummary.activeSpendTotal) * 100)
      )
    );
  }, [awsSummary]);

  // Combined totals
  const totalAwsSpend = awsSummary?.activeSpendTotal || 0;
  const totalAzureSpend = azureSummary?.activeSpend || 0;
  // Note: Azure is in INR, AWS in USD. For executive presentation, show both clearly.

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
        {/* Unified Top Navigation */}
        <Navbar />

        {/* ================================================================= */}
        {/* EXECUTIVE FINOPS HERO STRIP                                      */}
        {/* ================================================================= */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 py-5 sm:px-6 lg:px-8 shadow-2xs">
          <div className="mx-auto max-w-[1720px]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Multi-Cloud Executive Command Center
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800 text-[11px] font-bold"
                  >
                    Global FinOps
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Unified visibility, cross-cloud budget governance &amp; risk tracking for AWS &amp; Microsoft Azure
                </p>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/aws"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-3 py-2 text-xs font-bold hover:bg-amber-500/20 transition-all shadow-2xs"
                >
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>AWS Analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  to="/azure"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-3 py-2 text-xs font-bold hover:bg-sky-500/20 transition-all shadow-2xs"
                >
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Azure Analytics</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>

                <Link
                  to="/newrequest"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Request</span>
                </Link>
              </div>
            </div>

            {/* Top KPI Cards Ribbon */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: AWS Month Spend */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-amber-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    AWS {awsMonthLabel} Spend
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-black text-xs">
                    AWS
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ${totalAwsSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {awsSummary?.budgetCoveragePct || 0}% covered
                  </span>
                  <span>•</span>
                  <span>{awsSummary?.totalAccounts || 0} org accounts</span>
                </div>
              </div>

              {/* Card 2: Azure Month Spend */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-sky-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Azure {azureMonthLabel} Spend
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 font-black text-xs">
                    AZ
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{totalAzureSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">
                    {azureCoveragePct}% budgeted
                  </span>
                  <span>•</span>
                  <span>{azureTotalAccounts} subscriptions</span>
                </div>
              </div>

              {/* Card 3: Governance & Unbudgeted Risk */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-rose-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Unbudgeted Exposure
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {awsSummary?.accountsWithNoBudget || 0}
                  </span>
                  <span className="text-xs text-slate-500">AWS accounts without limit</span>
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 truncate">
                  ${(awsSummary?.spendWithNoBudget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} unprotected spend
                </div>
              </div>

              {/* Card 4: Azure RBAC & Access Status */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:border-purple-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Azure Access / RBAC
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {azurePermissionDenied}
                  </span>
                  <span className="text-xs text-slate-500">Subs missing Cost RBAC</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {azureBudgetedAccounts} of {azureTotalAccounts} active budgets monitored
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN DUAL-CLOUD COMMAND SPLIT                                     */}
        {/* ================================================================= */}
        <main className="mx-auto w-full max-w-[1720px] flex-1 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ============================================================= */}
            {/* LEFT PORTAL: AWS GOVERNANCE & BUDGETS                         */}
            {/* ============================================================= */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/5 via-white to-transparent dark:from-amber-500/10 dark:via-slate-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black text-sm shadow-2xs">
                    AWS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        AWS Governance &amp; Budgets
                      </h2>
                      <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 text-[10px] font-bold">
                        {awsMonthLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Organizational inventory, active budget tracking &amp; unbudgeted spend
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Account Switcher */}
                  {awsAccounts.length > 1 && (
                    <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
                      {awsAccounts.map((acc, idx) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedAwsAccount(acc.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            acc.id === selectedAwsAccount
                              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Account {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <Link
                    to={`/aws?account=${encodeURIComponent(selectedAwsAccount)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-all"
                  >
                    <span>Enter AWS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                {/* Stats & Donut Gauge Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Gauge */}
                  <div className="sm:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 flex items-center gap-4">
                    <CoverageGauge
                      percentage={awsSummary?.budgetCoveragePct || 0}
                      colorClass="text-emerald-500"
                      size={64}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Budget Coverage
                      </div>
                      <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {awsSummary ? awsSummary.totalAccounts : "--"} Total Org Accounts
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="text-emerald-600 font-bold">
                          {awsSummary ? awsSummary.accountsWithBudget : "--"} budgeted
                        </span>
                        <span>•</span>
                        <span className="text-amber-600 font-bold">
                          {awsSummary ? awsSummary.accountsWithNoBudget : "--"} unbudgeted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spend Breakdown */}
                  <div className="sm:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Active Spend
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          ${awsSummary?.activeSpendTotal?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "--"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Budget Limits
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                          ${awsSummary?.sumBudgetLimits?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "--"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Suspended Spend
                        </div>
                        <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          ${awsSummary?.suspendedAccountsSpendTotal?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar: Under Budget vs Unbudgeted */}
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ${awsSummary?.spendUnderBudget?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0} covered
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          ${awsSummary?.spendWithNoBudget?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0} unbudgeted
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 rounded-l-full"
                          style={{ width: `${awsBudgetedSpendPct}%` }}
                        />
                        <div
                          className="h-full bg-rose-500 rounded-r-full"
                          style={{ width: `${100 - awsBudgetedSpendPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Tables: Unbudgeted Accounts & Active Budgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Unbudgeted Accounts Card */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            Top Unbudgeted Accounts
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-600">
                          {validAwsUnbudgeted.length} accounts
                        </span>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                        {paginatedAwsUnbudgeted.length > 0 ? (
                          paginatedAwsUnbudgeted.map((acc, i) => (
                            <div key={i} className="py-2 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {acc["Account Name"]}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {acc["Account ID"]}
                                </div>
                              </div>
                              <span className="text-xs font-black text-rose-600 shrink-0">
                                ${Number(acc["Current Month Spend"] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No unbudgeted accounts
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagination */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Page {pageAwsUnbudgeted} of {totalPagesAwsUnbudgeted}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPageAwsUnbudgeted((p) => Math.max(1, p - 1))}
                          disabled={pageAwsUnbudgeted <= 1}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPageAwsUnbudgeted((p) => Math.min(totalPagesAwsUnbudgeted, p + 1))}
                          disabled={pageAwsUnbudgeted >= totalPagesAwsUnbudgeted}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Budgets Card */}
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            AWS Budgets Tracking
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600">
                          {validAwsBudgets.length} active
                        </span>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                        {paginatedAwsBudgets.length > 0 ? (
                          paginatedAwsBudgets.map((b, i) => {
                            const limit = Number(b.Limit ?? b["Budget Limit"] ?? 0);
                            const used = Number(b["Current Used"] ?? b["Current Spend"] ?? 0);
                            const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
                            const isExceeded = pct >= 100;

                            return (
                              <div key={i} className="py-2 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                                    {b["Budget Name"]}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    ${used.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isExceeded
                                          ? "bg-rose-500"
                                          : pct >= 80
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-500 w-8 text-right">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No active budgets
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagination */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Page {pageAwsBudgets} of {totalPagesAwsBudgets}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPageAwsBudgets((p) => Math.max(1, p - 1))}
                          disabled={pageAwsBudgets <= 1}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPageAwsBudgets((p) => Math.min(totalPagesAwsBudgets, p + 1))}
                          disabled={pageAwsBudgets >= totalPagesAwsBudgets}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-2 flex justify-end">
                  <Link
                    to="/linked-accounts"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>View all AWS Linked Accounts</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* RIGHT PORTAL: AZURE BUDGETS & GOVERNANCE                      */}
            {/* ============================================================= */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-500/5 via-white to-transparent dark:from-sky-500/10 dark:via-slate-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 font-black text-sm shadow-2xs">
                    AZ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Azure Budgets &amp; Subscriptions
                      </h2>
                      <Badge className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200/80 text-[10px] font-bold">
                        {azureMonthLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Management-configured limits, consumption &amp; RBAC compliance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncAzureBudgets}
                    disabled={syncingAzure}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingAzure ? "animate-spin text-sky-600" : ""}`} />
                    <span>{syncingAzure ? "Syncing..." : "Sync Budgets"}</span>
                  </button>

                  <Link
                    to="/azure"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-all"
                  >
                    <span>Enter Azure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                {/* Stats & Gauge */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Gauge */}
                  <div className="sm:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 flex items-center gap-4">
                    <CoverageGauge
                      percentage={azureCoveragePct}
                      colorClass="text-sky-500"
                      size={64}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Azure Coverage
                      </div>
                      <div className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                        {azureBudgetedAccounts} of {azureTotalAccounts} Subscriptions
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-bold">
                        <Lock className="w-3 h-3" />
                        <span>{azurePermissionDenied} missing Cost RBAC</span>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Card */}
                  <div className="sm:col-span-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Total Budget Allocated
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          ₹{(azureSummary?.totalBudgetedSpend || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-bold mt-1">
                          Across {azureBudgetedAccounts} subscriptions
                        </div>
                      </div>

                      <div className="border-l border-slate-200/80 dark:border-slate-700/80 pl-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Active Month Spend
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          ₹{(azureSummary?.activeSpend || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          Live across enterprise tenant
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscriptions Budget Tracking List */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Azure Subscriptions Budget Tracking
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-600">
                        {activeAzureBudgets.length} configured
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                      {paginatedAzureBudgets.length > 0 ? (
                        paginatedAzureBudgets.map((b, idx) => {
                          const isExceeded = b.Status === "Exceeded";
                          const isWarning = b.Status === "Warning";

                          return (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                    {b["Linked Account"]}
                                  </span>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    ({b["Budget Name"]})
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {b["Account ID"]}
                                </div>
                              </div>

                              <div className="text-right shrink-0 w-36">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  ₹{(b["Actual Spend"] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                                  <span className="text-[10px] font-normal text-slate-400">
                                    / ₹{(b["Budget Limit"] || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isExceeded
                                          ? "bg-rose-500"
                                          : isWarning
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${Math.min(100, b["% Utilized"] || 0)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-500">
                                    {b["% Utilized"]}%
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 w-20 text-right">
                                <Badge
                                  className={`text-[10px] px-2 py-0.5 border ${
                                    isExceeded
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                      : isWarning
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                  }`}
                                >
                                  {b.Status || "On Track"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No active Azure budgets
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Page {pageAzureBudgets} of {totalPagesAzureBudgets}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPageAzureBudgets((p) => Math.max(1, p - 1))}
                        disabled={pageAzureBudgets <= 1}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPageAzureBudgets((p) => Math.min(totalPagesAzureBudgets, p + 1))}
                        disabled={pageAzureBudgets >= totalPagesAzureBudgets}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-2 flex justify-end">
                  <Link
                    to="/azure/subscriptions"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>View all Azure Subscriptions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Requests Modal */}
        <AdminRequestsModal
          isOpen={isAdminRequestsOpen}
          onClose={() => setIsAdminRequestsOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
