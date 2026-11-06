import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Cloud,
  BarChart3,
  Layers,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

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
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const pathname = location.pathname;
  const isAwsRoute =
    activeProvider === "aws" ||
    pathname.startsWith("/aws") ||
    pathname.startsWith("/linked-accounts");
  const isAzureRoute =
    activeProvider === "azure" ||
    pathname.startsWith("/azure");

  const effectiveProvider: Provider =
    isAzureRoute && !pathname.startsWith("/aws") && !pathname.startsWith("/linked-accounts")
      ? "azure"
      : "aws";

  const isAwsAnalytics = pathname === "/aws" || pathname === "/dashboard" || pathname === "/";
  const isAzureAnalytics = pathname === "/azure";
  const isAwsAccounts = pathname.startsWith("/linked-accounts");
  const isAzureSubscriptions =
    pathname.startsWith("/azure/subscriptions") || pathname.startsWith("/azure/linked-accounts");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060b26]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1720px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link
            to={effectiveProvider === "azure" ? "/azure" : "/aws"}
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
            title="Cloud Dashboard"
          >
            <div
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all ${
                effectiveProvider === "azure"
                  ? "bg-gradient-to-tr from-[#0075ff] to-[#00c5ff] shadow-[0_4px_14px_rgba(0,117,255,0.45)]"
                  : "bg-gradient-to-tr from-[#0075ff] to-[#7928ca] shadow-[0_4px_14px_rgba(0,117,255,0.45)]"
              }`}
            >
              <Cloud className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Cloud Dashboard
            </span>
          </Link>
        </div>

        {/* Center Navigation Links: ONLY show links for the connected provider */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
          {effectiveProvider === "aws" ? (
            <>
              <Link
                to="/aws"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                  isAwsAnalytics
                    ? "bg-[#0075ff] text-white shadow-[0_4px_12px_rgba(0,117,255,0.35)] font-bold"
                    : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>AWS Analytics</span>
              </Link>

              <Link
                to="/linked-accounts"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                  isAwsAccounts
                    ? "bg-[#0075ff] text-white shadow-[0_4px_12px_rgba(0,117,255,0.35)] font-bold"
                    : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Linked Accounts</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/azure"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                  isAzureAnalytics
                    ? "bg-[#0075ff] text-white shadow-[0_4px_12px_rgba(0,117,255,0.35)] font-bold"
                    : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Azure Analytics</span>
              </Link>

              <Link
                to="/azure/subscriptions"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                  isAzureSubscriptions
                    ? "bg-[#0075ff] text-white shadow-[0_4px_12px_rgba(0,117,255,0.35)] font-bold"
                    : "text-[#a0aec0] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Subscriptions</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Landing Page Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-xs font-semibold text-[#a0aec0] hover:text-white transition-all cursor-pointer shadow-sm"
            title="Go to Cloud Zero Landing Page"
          >
            <span>Website</span>
          </Link>

          {/* Switch / Connect Account Button */}
          <button
            onClick={() => navigate("/connect")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:border-[#0075ff]/50 px-3.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            title="Connect a different account or switch provider"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00c5ff]" />
            <span>Switch / Connect Account</span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
            <div className="vision-icon-box h-8 w-8 text-xs font-bold text-white">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                {user?.name || "FinOps Lead"}
                <Shield className="w-3 h-3 text-[#0075ff]" />
              </span>
              <span className="text-[10px] text-[#a0aec0] truncate max-w-[140px]">
                {user?.email || "admin@coforge.com"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Compact Subnav for smaller screens */}
      <div className="flex md:hidden overflow-x-auto border-t border-white/10 px-4 py-2 gap-2 scrollbar-none bg-[#060b26]/90">
        {effectiveProvider === "aws" ? (
          <>
            <Link
              to="/aws"
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
                isAwsAnalytics
                  ? "bg-[#0075ff] text-white"
                  : "text-[#a0aec0] hover:bg-white/[0.05]"
              }`}
            >
              AWS Analytics
            </Link>
            <Link
              to="/linked-accounts"
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
                isAwsAccounts
                  ? "bg-[#0075ff] text-white"
                  : "text-[#a0aec0] hover:bg-white/[0.05]"
              }`}
            >
              Linked Accounts
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/azure"
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
                isAzureAnalytics
                  ? "bg-[#0075ff] text-white"
                  : "text-[#a0aec0] hover:bg-white/[0.05]"
              }`}
            >
              Azure Analytics
            </Link>
            <Link
              to="/azure/subscriptions"
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 ${
                isAzureSubscriptions
                  ? "bg-[#0075ff] text-white"
                  : "text-[#a0aec0] hover:bg-white/[0.05]"
              }`}
            >
              Subscriptions
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
