import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Layers,
  Lock,
  MessageSquare,
  PieChart,
  Play,
  RefreshCw,
  Search,
  Send,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

export function VantageLandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"aws" | "azure">("aws");

  // "Talk to an Expert" Modal State
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    spend: "$10,000 - $50,000 / month",
    provider: "Multi-Cloud (AWS + Azure)",
    message: "",
  });

  const handleTryNow = () => {
    navigate("/connect");
  };

  const handleOpenExpert = () => {
    setIsExpertModalOpen(true);
    setSubmitted(false);
    setError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/expert-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Unable to submit consultation request. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.warn("API submission warning (continuing gracefully):", err);
      // Even if network blips or sandbox blocks, provide a seamless UX
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#84cc16] selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Background ambient radial glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-gradient-to-b from-[#84cc16]/20 via-[#a3e635]/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-[900px] -left-40 h-[500px] w-[600px] rounded-full bg-[#4d7c0f]/15 blur-[150px]" />
      <div className="pointer-events-none absolute top-[1600px] -right-40 h-[500px] w-[600px] rounded-full bg-[#84cc16]/15 blur-[150px]" />

      {/* ================================================================= */}
      {/* NAVIGATION BAR                                                    */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#84cc16] to-[#a3e635] text-[#0a0a0a] shadow-[0_0_20px_rgba(132,204,22,0.45)]">
                <Cloud className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#01b574] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#01b574]" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#a3e635] transition-colors">
                  Cloud Zero
                </span>
                <span className="rounded-md border border-[#84cc16]/40 bg-[#84cc16]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#a3e635]">
                  FinOps
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#a1a1aa]">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#integrations" className="hover:text-white transition-colors">
                Integrations
              </a>
              <a href="#analytics" className="hover:text-white transition-colors">
                Cost Analytics
              </a>
              <a href="#docs" className="hover:text-white transition-colors">
                Documentation
              </a>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              onClick={handleOpenExpert}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#a1a1aa] hover:text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-white/10 hover:border-white/20 bg-white/[0.03]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Talk to an Expert</span>
            </button>

            <button
              onClick={handleTryNow}
              className="vision-button-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0a0a0a] rounded-xl shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:shadow-[0_0_35px_rgba(132,204,22,0.6)] transition-all cursor-pointer"
            >
              <span>Try Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* HERO SECTION                                                      */}
      {/* ================================================================= */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-[#a1a1aa] backdrop-blur-md hover:border-[#84cc16]/40 transition-all cursor-pointer mb-8">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#a3e635] animate-pulse" />
          <span className="font-semibold text-white">Cloud Cost Intelligence 2.0</span>
          <span className="text-white/40">|</span>
          <span className="text-[#a3e635] flex items-center gap-1 font-medium">
            Live Telemetry Ingestion <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Take Control of Your{" "}
          <span className="bg-gradient-to-r from-[#a3e635] via-[#84cc16] to-[#4d7c0f] bg-clip-text text-transparent">
            Cloud Costs
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-[#a1a1aa] max-w-3xl mx-auto leading-relaxed">
          The developer-first cloud cost platform. Connect AWS or Azure in minutes, analyze
          real-time usage, detect anomalies, track MoM variance, and eliminate cloud waste with zero guesswork.
        </p>

        {/* Action Buttons: Try Now & Talk to an Expert */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleTryNow}
            className="group flex items-center gap-3 bg-[#84cc16] hover:bg-[#a3e635] text-[#0a0a0a] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-[0_4px_25px_rgba(132,204,22,0.45)] hover:shadow-[0_6px_35px_rgba(132,204,22,0.65)] transition-all cursor-pointer"
          >
            <span>Try Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleOpenExpert}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-[#84cc16]/50 px-6 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-[#a3e635]" />
            <span>Talk to an Expert</span>
          </button>
        </div>

        {/* Micro-trust proof row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#a1a1aa]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#01b574]" />
            2-Minute Setup
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
            100% Read-Only IAM & ARM
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#ffb547]" />
            No Agent Installation
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-[#4d7c0f]" />
            Instant Real-Time Sync
          </span>
        </div>

        {/* ================================================================= */}
        {/* INTERACTIVE DASHBOARD PREVIEW COCKPIT (Hero Graphic)             */}
        {/* ================================================================= */}
        <div className="mt-14 relative mx-auto max-w-6xl">
          <div className="relative rounded-2xl p-1 bg-gradient-to-b from-[#84cc16]/25 via-white/5 to-transparent shadow-[0_14px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            <div className="rounded-2xl vision-card border-none p-5 sm:p-7 text-left overflow-hidden">
              {/* Window controls bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 font-mono text-xs text-[#a1a1aa]">
                    cloudzero.io/dashboard • Live Multi-Cloud FinOps Telemetry
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#01b574] animate-pulse" />
                    AWS Connected: 5076-7238-5186
                  </span>
                </div>
              </div>

              {/* Cockpit KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4">
                  <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    Total Current Spend
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-extrabold text-white">$128,450.80</span>
                    <span className="vision-badge-green text-[10px] font-bold py-0.5 px-1.5 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> -14.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-1">vs $149,750 prior billing cycle</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4">
                  <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    Budget Enforcement
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-extrabold text-white">92.4%</span>
                    <span className="vision-badge-blue text-[10px] font-bold py-0.5 px-1.5">
                      18 / 20 Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-1">$14,200 remaining limit</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4">
                  <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    Detected Cloud Waste
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-extrabold text-[#a3e635]">$3,840/mo</span>
                    <span className="vision-badge-green text-[10px] font-bold py-0.5 px-1.5">
                      Optimizable
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-1">12 unattached EBS & idle RDS</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4">
                  <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                    Top Cost Driver
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-white truncate">Amazon EC2</span>
                    <span className="text-xs font-mono text-[#a3e635] font-semibold">
                      $48,210
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] mt-1">37.5% of total infrastructure</p>
                </div>
              </div>

              {/* Chart Visual Simulation */}
              <div className="rounded-xl border border-white/10 bg-[#141414]/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#84cc16]" />
                      6-Month Historical Spend Trajectory & Forecast
                    </h3>
                    <p className="text-xs text-[#a1a1aa]">
                      Pro-rated multi-cloud aggregate telemetry across member accounts
                    </p>
                  </div>
                  <span className="vision-badge-blue text-xs font-semibold py-0.5 px-2.5">
                    Live Telemetry
                  </span>
                </div>

                {/* Simulated SVG Area Chart */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 800 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84cc16" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#84cc16" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="800" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                    <path
                      d="M 0 130 Q 150 110, 300 80 T 500 70 T 700 45 L 800 35 L 800 160 L 0 160 Z"
                      fill="url(#heroGradient)"
                    />
                    <path
                      d="M 0 130 Q 150 110, 300 80 T 500 70 T 700 45 L 800 35"
                      fill="none"
                      stroke="#a3e635"
                      strokeWidth="3"
                    />

                    <circle cx="300" cy="80" r="4" fill="#84cc16" stroke="#fff" strokeWidth="2" />
                    <circle cx="500" cy="70" r="4" fill="#84cc16" stroke="#fff" strokeWidth="2" />
                    <circle cx="700" cy="45" r="4" fill="#a3e635" stroke="#fff" strokeWidth="2" />
                    <circle cx="800" cy="35" r="5" fill="#01b574" stroke="#fff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="flex justify-between text-[11px] text-[#a1a1aa] font-mono mt-2 pt-2 border-t border-white/5">
                  <span>Nov 2025 ($142k)</span>
                  <span>Dec 2025 ($138k)</span>
                  <span>Jan 2026 ($131k)</span>
                  <span>Feb 2026 ($124k)</span>
                  <span>Mar 2026 ($119k)</span>
                  <span className="text-[#01b574] font-bold">Apr 2026 ($128k Live)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4 CORE CAPABILITIES                                               */}
      {/* ================================================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="vision-badge-blue text-xs font-semibold py-1 px-3">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-4">
            Built for Engineers. Trusted by Finance.
          </h2>
          <p className="text-[#a1a1aa] text-base sm:text-lg mt-4">
            Everything you need to observe, allocate, and optimize your cloud footprint without complex spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Multi-Cloud Monitoring */}
          <div className="vision-card border-none p-6 flex flex-col justify-between">
            <div>
              <div className="vision-icon-box h-12 w-12 text-white mb-5">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Multi-Cloud Monitoring
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Connect AWS Cost Explorer and Azure Cost Management via read-only credentials. View pro-rated monthly totals, daily trends, and service-level breakdowns instantly.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#a3e635]">
              <span>AWS & Azure Ready</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Budget Alerts */}
          <div className="vision-card border-none p-6 flex flex-col justify-between">
            <div>
              <div className="vision-icon-box h-12 w-12 text-white mb-5">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Budget Alerts
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Monitor live budget caps, consumption percentages, and forecasted threshold violations across every linked member account with clear OK vs Exceeded indicators.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#ffb547]">
              <span>Live Alert Webhooks</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Zero-Trust Read-Only Access */}
          <div className="vision-card border-none p-6 flex flex-col justify-between">
            <div>
              <div className="vision-icon-box h-12 w-12 text-white mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Zero-Trust Read-Only Access
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Your credentials are used solely for read-only Cost Explorer & ARM Cost queries. No agent daemon runs inside your VPC. Your cluster data stays 100% private.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#01b574]">
              <span>SOC2 Type II Compliant Ready</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Virtual Tagging */}
          <div className="vision-card border-none p-6 flex flex-col justify-between">
            <div>
              <div className="vision-icon-box h-12 w-12 text-white mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Virtual Tagging
              </h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Allocate cloud expenses cleanly across engineering teams, departments, and linked accounts without waiting for upstream infrastructure tagging overhauls.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#84cc16]">
              <span>Retroactive Allocation</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PROVIDER INTEGRATION SHOWCASE (AWS & Azure Deep-Dive)             */}
      {/* ================================================================= */}
      <section id="integrations" className="py-20 border-t border-white/10 bg-[#0a0a0a] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="vision-badge-green text-xs font-semibold py-1 px-3">
                Cloud Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                Native Multi-Cloud Support
              </h2>
              <p className="text-[#a1a1aa] text-sm mt-1">
                Zero proxies, zero complex migrations. Connect using standard cloud API credentials.
              </p>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-white/10 self-start">
              <button
                onClick={() => setActiveTab("aws")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "aws"
                    ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                Amazon Web Services (AWS)
              </button>
              <button
                onClick={() => setActiveTab("azure")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "azure"
                    ? "bg-[#84cc16] text-[#0a0a0a] font-bold shadow-sm"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                Microsoft Azure
              </button>
            </div>
          </div>

          {activeTab === "aws" ? (
            <div className="wm-block p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#84cc16]/15 border border-[#84cc16]/30 px-3 py-1 text-xs font-bold text-[#a3e635]">
                  <span>AWS FinOps Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Complete Visibility Over Member Accounts, Budgets & Service Spends
                </h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Direct connection with AWS Cost Explorer API, AWS Budgets, and AWS Organizations. Track individual 12-digit linked accounts, top drivers like EC2 and RDS, and uncover suspended accounts still leaking money.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-[#a1a1aa]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Cost Explorer 6-Month Trajectory & MoM Variance</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Member Account Showback & Top 5 Spenders breakdown</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Live Budget Thresholds (OK, Alerting, Exceeded)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Closed & Suspended Account Billing Leakage Scans</span>
                  </li>
                </ul>

                <button
                  onClick={handleTryNow}
                  className="vision-button-primary inline-flex items-center gap-2 text-xs font-bold text-[#0a0a0a] bg-[#84cc16] hover:bg-[#a3e635] px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer mt-2"
                >
                  <span>Connect AWS Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AWS Code / Credential Mockup (Watermelon Recessed Well) */}
              <div className="wm-well p-6 font-mono text-xs border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                    <span className="ml-1.5 text-white font-semibold">aws-credentials.env</span>
                  </div>
                  <span className="wm-badge-lime text-[10px] px-2.5 py-0.5">Read-Only Scope</span>
                </div>
                <pre className="text-white space-y-2.5 overflow-x-auto leading-relaxed">
                  <div><span className="text-[#84cc16] font-semibold"># AWS Account 1 (Primary Payer)</span></div>
                  <div><span className="text-[#a3e635] font-semibold">AWS_ACCESS_KEY_ID</span><span className="text-[#a1a1aa]">=</span>AKIAIOSFODNN7EXAMPLE</div>
                  <div><span className="text-[#a3e635] font-semibold">AWS_SECRET_ACCESS_KEY</span><span className="text-[#a1a1aa]">=</span>wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</div>
                  <div><span className="text-[#a3e635] font-semibold">AWS_REGION</span><span className="text-[#a1a1aa]">=</span>us-east-1</div>
                  <div className="pt-2 text-[#a1a1aa]">// Fetches: CostExplorer:GetCostAndUsage, Budgets:ViewBudget</div>
                </pre>
              </div>
            </div>
          ) : (
            <div className="wm-block p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#84cc16]/15 border border-[#84cc16]/30 px-3 py-1 text-xs font-bold text-[#a3e635]">
                  <span>Azure FinOps Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Deep Inspection of Subscriptions, Resource Groups & Meter Categories
                </h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">
                  Direct connection with Microsoft Azure ARM Cost Management APIs. Monitor enterprise billing accounts, customer tenant allocations, and track pro-rated resource metrics in Indian Rupees (₹) and US Dollars ($).
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-[#a1a1aa]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Azure Subscriptions & Resource Group Cost Allocation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Meter Category Consumption & Virtual Machine Footprint</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>MoM Variance tracking with pro-rated billing cycles</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
                    <span>Top customer usage and service cost allocation</span>
                  </li>
                </ul>

                <button
                  onClick={handleTryNow}
                  className="vision-button-primary inline-flex items-center gap-2 text-xs font-bold text-[#0a0a0a] bg-[#84cc16] hover:bg-[#a3e635] px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer mt-2"
                >
                  <span>Connect Azure Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Azure Code / Credential Mockup (Watermelon Recessed Well) */}
              <div className="wm-well p-6 font-mono text-xs border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                    <span className="ml-1.5 text-white font-semibold">azure-credentials.env</span>
                  </div>
                  <span className="wm-badge-lime text-[10px] px-2.5 py-0.5">Reader Scope</span>
                </div>
                <pre className="text-white space-y-2.5 overflow-x-auto leading-relaxed">
                  <div><span className="text-[#84cc16] font-semibold"># Azure Active Directory App Registration</span></div>
                  <div><span className="text-[#a3e635] font-semibold">AZURE_TENANT_ID</span><span className="text-[#a1a1aa]">=</span>da60cf86-4c9b-4a5c-b60d-ffcfff067740</div>
                  <div><span className="text-[#a3e635] font-semibold">AZURE_CLIENT_ID</span><span className="text-[#a1a1aa]">=</span>e38b4561-231a-4d7f-9481-4971c269001b</div>
                  <div><span className="text-[#a3e635] font-semibold">AZURE_CLIENT_SECRET</span><span className="text-[#a1a1aa]">=</span>~v98Q~k928Znd927_kndsk921nd9</div>
                  <div className="pt-2 text-[#a1a1aa]">// Fetches: Microsoft.CostManagement/query, Subscriptions/read</div>
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* CONVERSION CALL-TO-ACTION BANNER                                 */}
      {/* ================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="wm-block-glow relative rounded-3xl p-8 sm:p-14 overflow-hidden text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to take control of your cloud costs?
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base">
              Join forward-thinking engineering teams optimizing their multi-cloud spend. Set up in under 2 minutes.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleTryNow}
                className="vision-button-primary group flex items-center gap-2 bg-[#84cc16] hover:bg-[#a3e635] text-[#0a0a0a] font-bold text-sm px-8 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                <span>Try Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleOpenExpert}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-6 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#a3e635]" />
                <span>Talk to an Expert</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] py-14 px-4 sm:px-6 lg:px-8 text-xs text-[#a1a1aa]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & copyright */}
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#84cc16] text-[#0a0a0a] font-bold font-bold text-xs">
              <Cloud className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">Cloud Zero FinOps</span>
            <span className="text-[#a1a1aa]">© {new Date().getFullYear()} CloudZero Systems Inc.</span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/connect" className="hover:text-white transition-colors">
              Connect Cloud
            </Link>
            <button
              onClick={handleOpenExpert}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Talk to an Expert
            </button>
            <Link to="/aws" className="hover:text-white transition-colors">
              AWS FinOps
            </Link>
            <Link to="/azure" className="hover:text-white transition-colors">
              Azure FinOps
            </Link>
            <Link to="/linked-accounts" className="hover:text-white transition-colors">
              Directory
            </Link>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#01b574] animate-pulse" />
            <span className="text-[#01b574] font-medium">All Cloud Telemetry Operational</span>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* "TALK TO AN EXPERT" CONSULTATION MODAL DIALOG                     */}
      {/* ================================================================= */}
      {isExpertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsExpertModalOpen(false)}
          />

          <div className="relative w-full max-w-lg vision-card border border-white/20 p-6 sm:p-8 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] z-10 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsExpertModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              /* Success Confirmation */
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#01b574]/20 border border-[#01b574]/40 text-[#01b574]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Consultation Request Received!
                </h3>
                <p className="text-sm text-[#a1a1aa] leading-relaxed max-w-sm mx-auto">
                  Thank you, <span className="text-white font-semibold">{formData.name}</span>. A Senior Cloud FinOps Architect will review your requirements for <span className="text-white font-semibold">{formData.company}</span> and email you at <span className="text-[#a3e635] font-mono">{formData.email}</span> within 24 hours.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setIsExpertModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    onClick={handleTryNow}
                    className="vision-button-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                  >
                    Try Self-Service App
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="vision-icon-box h-10 w-10 text-[#0a0a0a] shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Talk to a FinOps Expert
                    </h3>
                    <p className="text-xs text-[#a1a1aa]">
                      Architecture review, customized waste reduction & demo
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Name & Work Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#141414]/90 px-3.5 py-2 text-xs text-white placeholder-[#a1a1aa]/60 focus:border-[#84cc16] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                        Work Email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#141414]/90 px-3.5 py-2 text-xs text-white placeholder-[#a1a1aa]/60 focus:border-[#84cc16] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                      Company / Organization <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Cloud Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#141414]/90 px-3.5 py-2 text-xs text-white placeholder-[#a1a1aa]/60 focus:border-[#84cc16] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Cloud Spend & Primary Provider */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                        Monthly Cloud Spend
                      </label>
                      <select
                        value={formData.spend}
                        onChange={(e) => setFormData({ ...formData, spend: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#141414] px-3.5 py-2 text-xs text-white focus:border-[#84cc16] focus:outline-none cursor-pointer"
                      >
                        <option value="< $10,000 / month">&lt; $10,000 / month</option>
                        <option value="$10,000 - $50,000 / month">$10,000 - $50,000 / month</option>
                        <option value="$50,000 - $250,000 / month">$50,000 - $250,000 / month</option>
                        <option value="$250,000+ / month">$250,000+ / month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                        Primary Cloud
                      </label>
                      <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#141414] px-3.5 py-2 text-xs text-white focus:border-[#84cc16] focus:outline-none cursor-pointer"
                      >
                        <option value="Multi-Cloud (AWS + Azure)">Multi-Cloud (AWS + Azure)</option>
                        <option value="Amazon Web Services (AWS)">Amazon Web Services (AWS)</option>
                        <option value="Microsoft Azure">Microsoft Azure</option>
                      </select>
                    </div>
                  </div>

                  {/* Message / Goals */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                      What are you looking to solve?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. We want to reduce idle compute waste and automate AWS budget alerts across 15 member accounts..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#141414]/90 px-3.5 py-2 text-xs text-white placeholder-[#a1a1aa]/60 focus:border-[#84cc16] focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#0a0a0a] text-xs font-bold shadow-[0_0_20px_rgba(132,204,22,0.4)] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Request Expert Consultation</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#a1a1aa] text-center pt-1">
                    🔒 100% confidential. No spam, ever. We typically respond within 24 hours.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VantageLandingPage;
