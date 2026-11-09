import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar, type AccountOption } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PieChart,
} from "lucide-react";

interface LinkedAccountItem {
  linkedAccountId: string;
  accountName: string;
  status: string;
  selectedMonth: string;
  currentSpend: number;
  previousSpend: number;
  momChangePercent: number;
  hasBudget: boolean;
  budgetStatus: "Budgeted" | "Unbudgeted";
  topCostDriver: string;
}

interface ApiResponse {
  rootAccount: {
    id: string;
    name: string;
    awsAccountId: string;
  };
  selectedMonth: string;
  totalLinkedAccounts: number;
  activeAccountsCount: number;
  suspendedAccountsCount: number;
  budgetedCount: number;
  unbudgetedCount: number;
  totalSpend: number;
  accounts: LinkedAccountItem[];
}

const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function LinkedAccountsPage() {
  const [awsAccounts, setAwsAccounts] = useState<AccountOption[]>([
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
  ]);
  const [selectedAwsAccount, setSelectedAwsAccount] = useState<string>("account-1");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [budgetFilter, setBudgetFilter] = useState<"ALL" | "BUDGETED" | "UNBUDGETED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 12;

  // Available months
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // 1. Fetch AWS Accounts
  useEffect(() => {
    fetch("/api/aws/accounts")
      .then((res) => (res.ok ? res.json() : []))
      .then((accs) => {
        if (Array.isArray(accs) && accs.length > 0) {
          setAwsAccounts(accs);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch available months
  useEffect(() => {
    fetch(`/api/aws/dataset/monthly_totals_last_6_months?account=${selectedAwsAccount}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((resData) => {
        if (Array.isArray(resData) && resData.length > 0) {
          const mList = resData.map((r: any) => r.Month).filter(Boolean).sort();
          setAvailableMonths(mList);
          if (!selectedMonth || !mList.includes(selectedMonth)) {
            setSelectedMonth(mList[mList.length - 1] || "");
          }
        }
      })
      .catch(() => {});
  }, [selectedAwsAccount]);

  // 3. Fetch Linked Accounts
  const fetchLinkedAccounts = () => {
    setLoading(true);
    setError(null);
    const monthQuery = selectedMonth ? `&month=${encodeURIComponent(selectedMonth)}` : "";
    Promise.all([
      fetch(`/api/aws/linked-accounts?account=${encodeURIComponent(selectedAwsAccount)}${monthQuery}`).then(
        async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Failed to fetch accounts (HTTP ${res.status})`);
          }
          return res.json();
        }
      ),
      fetch(`/api/aws/dataset/budgets_overview?account=${encodeURIComponent(selectedAwsAccount)}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`/api/aws/dataset/governance_summary?account=${encodeURIComponent(selectedAwsAccount)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([json, budgetsList, govSummary]: [ApiResponse, any[], any]) => {
        const govItem = Array.isArray(govSummary) ? govSummary[0] : govSummary;
        const hasAnyOrgBudgets =
          Array.isArray(budgetsList) &&
          budgetsList.length > 0 &&
          (govItem ? Number(govItem.accountsWithBudget ?? 1) > 0 : true);

        const normalizedAccounts = (json.accounts || []).map((acc) => {
          const isActive = acc.status?.toUpperCase() === "ACTIVE";
          const hasBudget = isActive && hasAnyOrgBudgets && acc.hasBudget;
          return {
            ...acc,
            hasBudget,
            budgetStatus: !isActive ? "Closed" : hasBudget ? "Budgeted" : "Unbudgeted",
          };
        });

        const activeList = normalizedAccounts.filter((a) => a.status?.toUpperCase() === "ACTIVE");
        const budgetedCount = activeList.filter((a) => a.hasBudget).length;
        const unbudgetedCount = activeList.filter((a) => !a.hasBudget).length;

        setData({
          ...json,
          accounts: normalizedAccounts,
          activeAccountsCount: activeList.length,
          budgetedCount,
          unbudgetedCount,
        });
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load linked accounts.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, [selectedAwsAccount, selectedMonth]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    let list = [...data.accounts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.accountName.toLowerCase().includes(q) ||
          a.linkedAccountId.includes(q) ||
          a.topCostDriver.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status.toUpperCase() === statusFilter);
    }

    if (budgetFilter === "BUDGETED") {
      list = list.filter((a) => a.hasBudget && a.status.toUpperCase() === "ACTIVE");
    } else if (budgetFilter === "UNBUDGETED") {
      list = list.filter((a) => !a.hasBudget && (statusFilter !== "ALL" || a.status.toUpperCase() === "ACTIVE"));
    }

    return list;
  }, [data, searchQuery, statusFilter, budgetFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE));
  const paginatedAccounts = useMemo(() => {
    return filteredAccounts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  const formatMonthName = (mStr: string) => {
    if (!mStr) return "Current Month";
    const parts = mStr.split("-");
    if (parts.length < 2) return mStr;
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(date.getTime())) return mStr;
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased selection:bg-[#84cc16] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeProvider="aws"
        awsAccounts={awsAccounts}
        selectedAwsAccount={selectedAwsAccount}
        onAwsAccountChange={setSelectedAwsAccount}
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="vision-icon-box h-10 w-10 shrink-0 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                AWS Linked Accounts Directory
              </h2>
              <p className="text-xs text-[#a1a1aa]">
                Member account inventory, billing trajectory, and budget enforcement
              </p>
            </div>
          </div>

          {/* Account and Month Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/90 px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa]">Payer:</span>
              <select
                value={selectedAwsAccount}
                onChange={(e) => setSelectedAwsAccount(e.target.value)}
                className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
              >
                {awsAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#0a0a0a] text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {availableMonths.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/90 px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa]">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-[#0a0a0a] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={fetchLinkedAccounts}
              disabled={loading}
              title="Refresh Accounts"
              className="p-2 rounded-xl border border-white/10 bg-[#141414] hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        {data && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Org Accounts */}
            <Card className="vision-card border-none p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    ORG ACCOUNTS
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {data.totalLinkedAccounts}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#a1a1aa] pt-0.5">
                    <span className="text-[#01b574] font-medium">
                      {data.activeAccountsCount} active
                    </span>
                    <span>•</span>
                    <span className="text-[#a1a1aa]">
                      {data.suspendedAccountsCount} closed
                    </span>
                  </div>
                </div>
                <div className="vision-icon-box h-10 w-10 text-[#0a0a0a]">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Card 2: Total Month Spend */}
            <Card className="vision-card border-none p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    {formatMonthName(data.selectedMonth).toUpperCase()} SPEND
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {fmt(data.totalSpend)}
                  </h3>
                  <p className="text-xs text-[#a1a1aa] pt-0.5">
                    Across {data.activeAccountsCount} member accounts
                  </p>
                </div>
                <div className="vision-icon-box h-10 w-10 text-[#0a0a0a]">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Card 3: Budget Coverage */}
            <Card className="vision-card border-none p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    BUDGET COVERAGE
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {data.activeAccountsCount > 0
                      ? `${Math.min(100, (data.budgetedCount / data.activeAccountsCount) * 100).toFixed(1)}%`
                      : "0%"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs pt-0.5">
                    <span className="text-[#01b574] font-medium">
                      {data.budgetedCount} budgeted
                    </span>
                    <span>•</span>
                    <span className="text-[#e31a1a] font-medium">
                      {data.unbudgetedCount} unbudgeted
                    </span>
                  </div>
                </div>
                <div className="vision-icon-box h-10 w-10 text-[#0a0a0a]">
                  <PieChart className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Card 4: Top Cost Account */}
            <Card className="vision-card border-none p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0 pr-2">
                  <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    TOP CONTRIBUTOR
                  </p>
                  <h3 className="text-lg font-bold text-white tracking-tight truncate" title={data.accounts[0]?.accountName}>
                    {data.accounts[0]?.accountName || "N/A"}
                  </h3>
                  <p className="text-xs text-[#a3e635] font-semibold pt-0.5">
                    {fmt(data.accounts[0]?.currentSpend || 0)}
                  </p>
                </div>
                <div className="vision-icon-box h-10 w-10 text-[#0a0a0a] shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Directory Card with Search, Filter & Table */}
        <Card className="vision-card border-none">
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white tracking-tight">
                  Member Accounts Inventory
                </CardTitle>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Detailed billing, active governance status, and direct deep-dive analysis
                </p>
              </div>

              {/* Status & Budget Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Toggle */}
                <div className="flex items-center bg-[#141414]/90 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      statusFilter === "ALL"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setStatusFilter("ACTIVE"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      statusFilter === "ACTIVE"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => { setStatusFilter("SUSPENDED"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      statusFilter === "SUSPENDED"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    Suspended
                  </button>
                </div>

                {/* Budget Toggle */}
                <div className="flex items-center bg-[#141414]/90 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => { setBudgetFilter("ALL"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      budgetFilter === "ALL"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setBudgetFilter("BUDGETED"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      budgetFilter === "BUDGETED"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    Budgeted
                  </button>
                  <button
                    onClick={() => { setBudgetFilter("UNBUDGETED"); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      budgetFilter === "UNBUDGETED"
                        ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    Unbudgeted
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search by account name, 12-digit ID, or service driver..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#141414]/90 pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 text-white placeholder-[#a1a1aa] focus:border-[#84cc16] focus:outline-none transition-all"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-[#84cc16] animate-spin mx-auto" />
                <p className="text-xs font-medium text-[#a1a1aa]">
                  Loading member accounts from live telemetry...
                </p>
              </div>
            ) : error ? (
              <div className="py-16 text-center space-y-3 px-4">
                <AlertTriangle className="w-8 h-8 text-[#e31a1a] mx-auto" />
                <p className="text-xs font-semibold text-[#e31a1a]">{error}</p>
                <button
                  onClick={fetchLinkedAccounts}
                  className="vision-button-primary px-3 py-1.5 text-xs font-bold rounded-xl text-[#0a0a0a] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : paginatedAccounts.length === 0 ? (
              <div className="py-16 text-center text-[#a1a1aa] text-xs space-y-2">
                <p>No member accounts found matching your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setBudgetFilter("ALL");
                  }}
                  className="text-xs text-[#84cc16] underline font-medium cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Account Name & ID
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right w-[120px]">
                      Current Spend
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right w-[120px]">
                      Prior Spend
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right w-[110px]">
                      MoM Variance
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] w-[120px]">
                      Governance
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Top Cost Driver
                    </TableHead>
                    <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-center w-[120px]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAccounts.map((acc) => {
                    const isPositiveMoM = acc.momChangePercent > 0;
                    const isNegativeMoM = acc.momChangePercent < 0;

                    return (
                      <TableRow key={acc.linkedAccountId} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                        {/* Name and ID */}
                        <TableCell className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-white">
                              {acc.accountName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[#a1a1aa] text-[11px] font-mono">
                              <span>{acc.linkedAccountId}</span>
                              <button
                                onClick={() => copyToClipboard(acc.linkedAccountId)}
                                title="Copy Account ID"
                                className="hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedId === acc.linkedAccountId ? (
                                  <Check className="w-3 h-3 text-[#01b574]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 px-4">
                          {acc.status === "ACTIVE" ? (
                            <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="vision-badge-red text-[10px] font-semibold py-0.5 px-2">
                              {acc.status}
                            </span>
                          )}
                        </TableCell>

                        {/* Current Spend */}
                        <TableCell className="py-3 px-4 text-right font-bold whitespace-nowrap text-xs text-white font-mono">
                          {fmt(acc.currentSpend)}
                        </TableCell>

                        {/* Previous Spend */}
                        <TableCell className="py-3 px-4 text-right whitespace-nowrap text-[#a1a1aa] text-xs font-medium font-mono">
                          {fmt(acc.previousSpend)}
                        </TableCell>

                        {/* MoM Variance */}
                        <TableCell className="py-3 px-4 text-right font-medium whitespace-nowrap text-xs">
                          {acc.previousSpend > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 ${
                                isPositiveMoM
                                  ? "text-[#e31a1a] font-bold"
                                  : isNegativeMoM
                                  ? "text-[#01b574] font-bold"
                                  : "text-[#a1a1aa]"
                              }`}
                            >
                              {isPositiveMoM && <TrendingUp className="w-3.5 h-3.5" />}
                              {isNegativeMoM && <TrendingDown className="w-3.5 h-3.5" />}
                              {isPositiveMoM ? "+" : ""}
                              {acc.momChangePercent}%
                            </span>
                          ) : (
                            <span className="text-[#a1a1aa]">—</span>
                          )}
                        </TableCell>

                        {/* Budget Status */}
                        <TableCell className="py-3 px-4">
                          {acc.status.toUpperCase() !== "ACTIVE" ? (
                            <span className="vision-badge-blue text-[10px] font-semibold py-0.5 px-2">
                              Closed
                            </span>
                          ) : acc.hasBudget ? (
                            <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3 h-3" />
                              Budgeted
                            </span>
                          ) : (
                            <span className="vision-badge-red text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              No Budget
                            </span>
                          )}
                        </TableCell>

                        {/* Top Cost Driver */}
                        <TableCell className="py-3 px-4 text-[#a1a1aa] text-xs font-medium truncate max-w-[160px]">
                          {acc.topCostDriver}
                        </TableCell>

                        {/* Action: Open in Current Tab */}
                        <TableCell className="py-3 px-4 text-center">
                          <Link
                            to={`/linked-accounts/${encodeURIComponent(acc.linkedAccountId || "")}?account=${encodeURIComponent(selectedAwsAccount)}${selectedMonth ? `&month=${encodeURIComponent(selectedMonth)}` : ""}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:border-[#84cc16]/50 text-white transition-all cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 text-[#a1a1aa]" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <div className="text-xs text-[#a1a1aa]">
                {filteredAccounts.length > 0 ? (
                  `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredAccounts.length
                  )} of ${filteredAccounts.length} accounts`
                ) : (
                  "0 of 0 accounts"
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-medium min-w-[32px] text-center text-white">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default LinkedAccountsPage;
