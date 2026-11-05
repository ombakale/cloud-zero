import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Cloud,
  LayoutGrid,
  BarChart3,
  Layers,
  PlusCircle,
  Inbox,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAccountRequests } from "@/lib/useAccountRequests";
import { useState } from "react";
import { AdminRequestsModal } from "./AdminRequestsModal";

export type Provider = "aws" | "azure";

export interface AccountOption {
  id: string;
  name: string;
  path: string;
  accountId?: string;
  accountName?: string;
}

export interface NavbarProps {
  activeProvider?: Provider;
  onProviderChange?: (provider: Provider) => void;
  months?: string[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  awsAccounts?: AccountOption[];
  selectedAwsAccount?: string;
  onAwsAccountChange?: (accountId: string) => void;
  azureAccounts?: AccountOption[];
  selectedAzureAccount?: string;
  onAzureAccountChange?: (accountId: string) => void;
}

export function Navbar({
  activeProvider = "aws",
  onProviderChange = () => {},
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { records } = useAccountRequests();
  const [isAdminRequestsOpen, setIsAdminRequestsOpen] = useState(false);

  const pendingRequestsCount = records.filter(
    (r) => (r.status || "pending") === "pending"
  ).length;

  const pathname = location.pathname;
  const isMultiCloud = pathname === "/" || pathname === "/overview";
  const isAwsAnalytics = pathname === "/aws" || pathname === "/dashboard";
  const isAzureAnalytics = pathname === "/azure";
  const isAwsAccounts = pathname.startsWith("/linked-accounts");
  const isAzureSubscriptions =
    pathname.startsWith("/azure/subscriptions") ||
    pathname.startsWith("/azure/linked-accounts");
  const isNewRequest = pathname.startsWith("/newrequest");

  const handleProviderToggle = (prov: Provider) => {
    onProviderChange(prov);
    if (prov === "azure") {
      if (isAwsAccounts) {
        navigate("/azure/subscriptions");
      } else {
        navigate("/azure");
      }
    } else {
      if (isAzureSubscriptions) {
        navigate("/linked-accounts");
      } else {
        navigate("/aws");
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-[1720px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group flex items-center gap-3 transition-opacity hover:opacity-90"
              title="Return to Multi-Cloud Command Center"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
                <Cloud className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Cloud Cost Intelligence
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/80">
                    <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                    FinOps Suite
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Enterprise Multi-Cloud Governance
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isMultiCloud
                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Multi-Cloud</span>
              </Link>

              <Link
                to="/aws"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isAwsAnalytics
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
                <span>AWS Analytics</span>
              </Link>

              <Link
                to="/azure"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isAzureAnalytics
                    ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold border border-sky-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-sky-500" />
                <span>Azure Analytics</span>
              </Link>

              <Link
                to="/linked-accounts"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isAwsAccounts
                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                <span>AWS Accounts</span>
              </Link>

              <Link
                to="/azure/subscriptions"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isAzureSubscriptions
                    ? "bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-sky-500" />
                <span>Azure Subscriptions</span>
              </Link>

              <Link
                to="/newrequest"
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isNewRequest
                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Provisioning</span>
              </Link>
            </nav>
          </div>

          {/* Right: Cloud Toggle, Request Actions & Profile Badge */}
          <div className="flex items-center gap-3">
            {/* Quick AWS / Azure Switcher Pill */}
            {(isAwsAnalytics || isAzureAnalytics || isAwsAccounts || isAzureSubscriptions) && (
              <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => handleProviderToggle("aws")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeProvider === "aws"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  AWS
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderToggle("azure")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeProvider === "azure"
                      ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Azure
                </button>
              </div>
            )}

            {/* Quick Request Button */}
            <button
              onClick={() => navigate("/newrequest")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>New Request</span>
            </button>

            {/* Admin Requests Review */}
            <button
              onClick={() => setIsAdminRequestsOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Review Provisioning Requests"
            >
              <Inbox className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            {/* User Profile Badge (Direct Access - No Login barrier) */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900 text-white font-bold text-xs ring-1 ring-indigo-500/30 shadow-2xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {user?.name || "FinOps Lead"}
                  <Shield className="w-3 h-3 text-indigo-500" />
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {user?.email || "admin@coforge.com"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / Compact Subnav for smaller screens */}
        <div className="flex xl:hidden overflow-x-auto border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 gap-2 scrollbar-none bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            to="/"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isMultiCloud
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Multi-Cloud
          </Link>
          <Link
            to="/aws"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isAwsAnalytics
                ? "bg-amber-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            AWS Analytics
          </Link>
          <Link
            to="/azure"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isAzureAnalytics
                ? "bg-sky-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Azure Analytics
          </Link>
          <Link
            to="/linked-accounts"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isAwsAccounts
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            AWS Accounts
          </Link>
          <Link
            to="/azure/subscriptions"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isAzureSubscriptions
                ? "bg-sky-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Azure Subs
          </Link>
          <Link
            to="/newrequest"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 ${
              isNewRequest
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Provisioning
          </Link>
        </div>
      </header>

      {/* Admin Requests Governance Modal */}
      <AdminRequestsModal
        isOpen={isAdminRequestsOpen}
        onClose={() => setIsAdminRequestsOpen(false)}
      />
    </>
  );
}
