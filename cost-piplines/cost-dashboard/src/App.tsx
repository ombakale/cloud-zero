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
        <div className="p-8 text-center rounded-2xl border border-rose-500/30 bg-rose-500/10 my-8 shadow-lg backdrop-blur-md">
          <h2 className="text-base font-bold text-rose-400 mb-2">
            Something went wrong rendering this section
          </h2>
          <p className="text-xs text-[#a1a1aa] mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="vision-button-primary px-4 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer"
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
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased selection:bg-[#84cc16] selection:text-white">
        {/* Modern Top Navbar */}
        <Navbar
          activeProvider={activeProvider}
          onProviderChange={handleProviderChange}
        />

        {/* ================================================================= */}
        {/* VISION UI CONTROL RIBBON (Account + Billing Period + Quick Actions) */}
        {/* ================================================================= */}
        <div className="border-b border-white/10 bg-[#141414]/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
            {/* Left: Active Provider Badge & Context Title */}
            <div className="flex items-center gap-3">
              <div className="vision-icon-box h-10 w-10 shrink-0 font-black text-sm text-white">
                {activeProvider === "aws" ? "AWS" : "AZ"}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-base font-bold tracking-tight text-white">
                    {activeProvider === "aws"
                      ? "Amazon Web Services FinOps"
                      : "Microsoft Azure FinOps"}
                  </h1>
                  <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#01b574] animate-pulse" />
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-[#a1a1aa]">
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
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/90 px-3 py-1.5 shadow-sm">
                  <Layers className="h-4 w-4 text-[#84cc16] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Root Account
                    </span>
                    <div className="relative">
                      <select
                        value={selectedAwsAccount}
                        onChange={(e) => setSelectedAwsAccount(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                        title="Select AWS Account"
                      >
                        {awsAccounts.map((acc) => (
                          <option
                            key={acc.id}
                            value={acc.id}
                            className="bg-[#0a0a0a] text-white font-medium"
                          >
                            {acc.accountName || acc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a1a1aa]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Dropdown for Azure */}
              {activeProvider === "azure" && azureAccounts.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/90 px-3 py-1.5 shadow-sm">
                  <Layers className="h-4 w-4 text-[#a3e635] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Billing Account
                    </span>
                    <div className="relative">
                      <select
                        value={selectedAzureAccount}
                        onChange={(e) => setSelectedAzureAccount(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
                        title="Select Azure Account"
                      >
                        {azureAccounts.map((acc) => (
                          <option
                            key={acc.id}
                            value={acc.id}
                            className="bg-[#0a0a0a] text-white font-medium"
                          >
                            {acc.accountName || acc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a1a1aa]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Period Selector */}
              {months.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/90 px-3 py-1.5 shadow-sm">
                  <CalendarDays className="h-4 w-4 text-[#84cc16] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Billing Period
                    </span>
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none bg-transparent pr-5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                        title="Select Billing Month"
                      >
                        {months.map((m) => (
                          <option
                            key={m}
                            value={m}
                            className="bg-[#0a0a0a] text-white font-medium"
                          >
                            {formatMonthName(m)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a1a1aa]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Jump Action Link */}
              <Link
                to={activeProvider === "aws" ? "/linked-accounts" : "/azure/subscriptions"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:border-[#84cc16]/50 px-3 py-2 text-xs font-semibold text-white transition-all shadow-sm"
              >
                <span>{activeProvider === "aws" ? "Linked Accounts" : "Subscriptions"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#a1a1aa]" />
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
