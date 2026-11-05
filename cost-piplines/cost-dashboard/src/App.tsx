import { useState, useEffect, useMemo, Component, ReactNode, ErrorInfo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar, type Provider, type AccountOption } from "@/components/Navbar";
import { KpiCards } from "@/components/KpiCards";
import { DataTables } from "@/components/DataTables";
import { OrganizationGovernanceSection } from "@/components/OrganizationGovernanceSection";
import { ChartsSection } from "@/components/ChartsSection";
import { AzureDashboard } from "@/components/azure/AzureDashboard";
import { useCsv } from "@/lib/useCsv";
import type { MonthTotal, AzureMonthlyTotal } from "@/lib/types";
import {
  CalendarDays,
  Layers,
  ChevronDown,
  ArrowRight,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center rounded-2xl border border-rose-500/30 bg-rose-500/10 my-8 shadow-sm">
          <h2 className="text-base font-bold text-rose-600 mb-2">
            Something went wrong rendering this section
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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

const DEFAULT_AZURE_ACCOUNTS: AccountOption[] = [
  {
    id: "account-1",
    name: "Coforge Global IT (da60cf86-4c9b-4a5c-b60d-ffcfff067740)",
    accountId: "da60cf86-4c9b-4a5c-b60d-ffcfff067740",
    accountName: "Coforge Global IT",
    path: "/data/azure",
  },
  {
    id: "account-2",
    name: "Coforge Secondary (b727a530-a0d5-4fb8-bd40-d8f9763e97db)",
    accountId: "b727a530-a0d5-4fb8-bd40-d8f9763e97db",
    accountName: "Coforge Secondary",
    path: "/data/azure/accounts/account-2",
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAzure =
    location.pathname.startsWith("/azure") ||
    new URLSearchParams(location.search).get("provider") === "azure";
  const [activeProvider, setActiveProvider] = useState<Provider>(
    isAzure ? "azure" : "aws"
  );

  useEffect(() => {
    const isAzureRoute =
      location.pathname.startsWith("/azure") ||
      new URLSearchParams(location.search).get("provider") === "azure";
    setActiveProvider(isAzureRoute ? "azure" : "aws");
  }, [location.pathname, location.search]);

  const [awsAccounts, setAwsAccounts] = useState<AccountOption[]>(DEFAULT_AWS_ACCOUNTS);
  const initialAwsAcc =
    new URLSearchParams(location.search).get("account") || "account-1";
  const [selectedAwsAccount, setSelectedAwsAccount] = useState<string>(initialAwsAcc);
  const [azureAccounts, setAzureAccounts] = useState<AccountOption[]>(DEFAULT_AZURE_ACCOUNTS);
  const [selectedAzureAccount, setSelectedAzureAccount] = useState<string>("account-1");

  // Fetch AWS accounts from API
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

  // Fetch Azure accounts from API
  useEffect(() => {
    fetch("/api/azure/accounts")
      .then((res) => {
        if (res.ok) return res.json();
        return fetch("/data/azure/accounts.json").then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAzureAccounts(data);
          if (!data.some((a) => a.id === selectedAzureAccount)) {
            setSelectedAzureAccount(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentAwsAccount = useMemo(() => {
    return awsAccounts.find((a) => a.id === selectedAwsAccount) || awsAccounts[0];
  }, [awsAccounts, selectedAwsAccount]);

  const currentAzureAccount = useMemo(() => {
    return azureAccounts.find((a) => a.id === selectedAzureAccount) || azureAccounts[0];
  }, [azureAccounts, selectedAzureAccount]);

  const awsBasePath = currentAwsAccount?.path || "/data";
  const azureBasePath = currentAzureAccount?.path || "/data/azure";

  // Monthly totals
  const { data: awsMonthly } = useCsv<MonthTotal>(
    `${awsBasePath}/monthly_totals_last_6_months.csv`
  );
  const { data: azureMonthly } = useCsv<AzureMonthlyTotal>(
    `${azureBasePath}/azure_usage_monthly_totals.csv`
  );

  const awsMonths = useMemo(() => {
    const sorted = awsMonthly
      .filter((m) => m && m.Month)
      .map((m) => m.Month)
      .sort();
    return sorted.slice(-6);
  }, [awsMonthly]);

  const azureMonths = useMemo(
    () => azureMonthly.map((m) => m.Month).sort(),
    [azureMonthly]
  );

  const months = activeProvider === "aws" ? awsMonths : azureMonths;
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [months, selectedMonth]);

  const handleProviderChange = (provider: Provider) => {
    setActiveProvider(provider);
    setSelectedMonth("");
  };

  const formatMonthName = (mStr: string) => {
    if (!mStr) return "Latest Billing Period";
    const [year, month] = mStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        {/* Modern Top Navbar */}
        <Navbar
          activeProvider={activeProvider}
          onProviderChange={handleProviderChange}
        />

        {/* ================================================================= */}
        {/* MODERN CONTROL RIBBON (Account + Billing Period + Quick Actions) */}
        {/* ================================================================= */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 lg:px-8 shadow-2xs">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
            {/* Left: Active Provider Badge & Context Title */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-2xs ${
                  activeProvider === "aws"
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                }`}
              >
                {activeProvider === "aws" ? "AWS" : "AZ"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {activeProvider === "aws"
                      ? "Amazon Web Services FinOps"
                      : "Microsoft Azure FinOps"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeProvider === "aws"
                    ? "Detailed cost breakdowns, utilization, MoM fluctuations & budgets"
                    : "Subscriptions, resource groups, meters & budget compliance"}
                </p>
              </div>
            </div>

            {/* Right: Modern Dropdowns for Account & Period */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Account Dropdown for AWS */}
              {activeProvider === "aws" && awsAccounts.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5 shadow-2xs">
                  <Layers className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Root Account
                    </span>
                    <div className="relative">
                      <select
                        value={selectedAwsAccount}
                        onChange={(e) => setSelectedAwsAccount(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                        title="Select AWS Account"
                      >
                        {awsAccounts.map((acc) => (
                          <option
                            key={acc.id}
                            value={acc.id}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                          >
                            {acc.accountName || acc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Dropdown for Azure */}
              {activeProvider === "azure" && azureAccounts.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5 shadow-2xs">
                  <Layers className="h-4 w-4 text-sky-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Billing Account
                    </span>
                    <div className="relative">
                      <select
                        value={selectedAzureAccount}
                        onChange={(e) => setSelectedAzureAccount(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[200px] truncate"
                        title="Select Azure Account"
                      >
                        {azureAccounts.map((acc) => (
                          <option
                            key={acc.id}
                            value={acc.id}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                          >
                            {acc.accountName || acc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Period Selector */}
              {months.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5 shadow-2xs">
                  <CalendarDays className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Billing Period
                    </span>
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                        title="Select Billing Month"
                      >
                        {months.map((m) => (
                          <option
                            key={m}
                            value={m}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                          >
                            {formatMonthName(m)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Jump Action Link */}
              <Link
                to={activeProvider === "aws" ? "/linked-accounts" : "/azure/subscriptions"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                <span>{activeProvider === "aws" ? "Linked Accounts" : "Subscriptions"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN ANALYTICS DASHBOARD BODY                                     */}
        {/* ================================================================= */}
        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <ErrorBoundary>
            {activeProvider === "aws" ? (
              <>
                <KpiCards selectedMonth={selectedMonth} basePath={awsBasePath} />
                <ChartsSection selectedMonth={selectedMonth} basePath={awsBasePath} />
                <DataTables selectedMonth={selectedMonth} basePath={awsBasePath} />
                <OrganizationGovernanceSection
                  selectedMonth={selectedMonth}
                  basePath={awsBasePath}
                />
              </>
            ) : (
              <AzureDashboard selectedMonth={selectedMonth} basePath={azureBasePath} />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </TooltipProvider>
  );
}
