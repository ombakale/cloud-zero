import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Server,
  DollarSign,
  PieChart as PieChartIcon,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AccountDetailResponse {
  account: {
    linkedAccountId: string;
    accountName: string;
    status: string;
    rootAccount: {
      id: string;
      name: string;
      awsAccountId: string;
    };
    firstSeenAt?: string;
    lastSeenAt?: string;
  };
  selectedMonth: string;
  financials: {
    currentMonth: string;
    currentSpend: number;
    previousSpend: number;
    momChangePercent: number;
    historicalMonthlySpend: Array<{ month: string; cost: number }>;
  };
  variance: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    latestVsMeanPct: number;
    volatilityCategory: string;
  } | null;
  governance: {
    hasBudget: boolean;
    status: "Budgeted" | "Unbudgeted";
    topCostDriver: string;
  };
  liveAws?: {
    available: boolean;
    error?: string;
    orgDetails?: {
      name?: string;
      email?: string;
      status?: string;
      arn?: string;
      joinedMethod?: string;
      joinedTimestamp?: string;
    };
    services?: Array<{ service: string; cost: number; sharePct: number }>;
    regions?: Array<{ region: string; cost: number; sharePct: number }>;
  };
}

const fmt = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompactCurrency = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
  return `$${num}`;
};

const VISION_COLORS = [
  "#0075ff", // Electric Blue
  "#00c5ff", // Cyan Neon
  "#7928ca", // Purple
  "#01b574", // Emerald Glow
  "#ffb547", // Amber
  "#e31a1a", // Red Coral
];

export function LinkedAccountDetailPage() {
  const { linkedAccountId } = useParams<{ linkedAccountId: string }>();
  const [searchParams] = useSearchParams();
  const rootAccount = searchParams.get("account") || "account-1";
  const monthParam = searchParams.get("month") || "";

  const [data, setData] = useState<AccountDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDetails = () => {
    if (!linkedAccountId) return;
    setLoading(true);
    setError(null);

    const monthQuery = monthParam ? `&month=${encodeURIComponent(monthParam)}` : "";
    fetch(`/api/aws/linked-accounts/${encodeURIComponent(linkedAccountId)}?account=${encodeURIComponent(rootAccount)}${monthQuery}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to fetch account details (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((json: AccountDetailResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load account profile.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetails();
  }, [linkedAccountId, rootAccount, monthParam]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMonthName = (mStr: string) => {
    if (!mStr) return "Current Month";
    const parts = mStr.split("-");
    if (parts.length < 2) return mStr;
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(date.getTime())) return mStr;
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b26] flex flex-col items-center justify-center space-y-3 font-sans text-white">
        <RefreshCw className="w-8 h-8 text-[#0075ff] animate-spin" />
        <p className="text-sm font-semibold text-white">
          Loading 360° Account Analytics & Live AWS Cost Explorer...
        </p>
        <p className="text-xs text-[#a0aec0]">
          Querying cloud store and AWS Organizations for account {linkedAccountId}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#060b26] flex flex-col items-center justify-center p-6 space-y-4 font-sans text-white">
        <AlertTriangle className="w-10 h-10 text-[#e31a1a]" />
        <h2 className="text-xl font-bold tracking-tight text-white">Failed to Load Account Profile</h2>
        <p className="text-xs text-[#e31a1a] max-w-md text-center">{error}</p>
        <div className="flex gap-2.5 pt-2">
          <Link
            to="/linked-accounts"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all"
          >
            ← Back to Directory
          </Link>
          <button
            onClick={fetchDetails}
            className="vision-button-primary px-3 py-1.5 text-xs font-semibold rounded-xl text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { account, financials, variance, governance, liveAws } = data;
  const isPositiveMoM = financials.momChangePercent > 0;
  const isNegativeMoM = financials.momChangePercent < 0;

  const pieData = (liveAws?.services || []).slice(0, 5).map((s) => ({
    name: s.service,
    value: s.cost,
  }));

  return (
    <div className="min-h-screen bg-[#060b26] text-white font-sans antialiased pb-12 selection:bg-[#0075ff] selection:text-white">
      {/* Top Breadcrumb Header Bar */}
      <header className="sticky top-0 z-40 bg-[#060b26]/85 backdrop-blur-xl border-b border-white/10 px-6 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/linked-accounts?account=${rootAccount}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#a0aec0] hover:text-white px-3 py-1.5 rounded-xl border border-white/10 bg-[#080d28]/90 hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accounts Directory</span>
          </Link>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {account.accountName}
            </span>
            <span className="font-mono text-xs text-[#a0aec0] bg-[#080d28] px-2 py-0.5 rounded-lg border border-white/10">
              {account.linkedAccountId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDetails}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#0075ff]" />
            <span>Refresh Live AWS</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
        {/* Account Identity & Ownership Card */}
        <Card className="vision-card border-none">
          <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {account.accountName}
                </h1>
                {account.status === "ACTIVE" ? (
                  <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2">
                    ACTIVE
                  </span>
                ) : (
                  <span className="vision-badge-red text-[10px] font-semibold py-0.5 px-2">
                    {account.status}
                  </span>
                )}
                {governance.hasBudget ? (
                  <span className="vision-badge-green text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Budgeted
                  </span>
                ) : (
                  <span className="vision-badge-red text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Unbudgeted
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#a0aec0] pt-1">
                {/* 12-digit Account ID */}
                <div className="flex items-center gap-1.5 font-mono bg-[#080d28] px-2.5 py-1 rounded-lg border border-white/10">
                  <span className="text-[#a0aec0]">ID:</span>
                  <span className="font-semibold text-white">
                    {account.linkedAccountId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(account.linkedAccountId)}
                    title="Copy Account ID"
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === account.linkedAccountId ? (
                      <Check className="w-3 h-3 text-[#01b574]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Parent Root Payer */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a0aec0]">Payer Org:</span>
                  <span className="font-semibold text-white">
                    {account.rootAccount.name}
                  </span>
                </div>

                {/* Owner Email from Organizations */}
                {liveAws?.orgDetails?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0075ff]" />
                    <span className="text-[#a0aec0]">Owner:</span>
                    <span className="font-medium text-white font-mono">
                      {liveAws.orgDetails.email}
                    </span>
                  </div>
                )}

                {/* Joined Date */}
                {liveAws?.orgDetails?.joinedTimestamp && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#a0aec0]" />
                    <span className="text-[#a0aec0]">Created:</span>
                    <span className="font-medium text-white">
                      {new Date(liveAws.orgDetails.joinedTimestamp).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live AWS Sync Status Pill */}
            <div className="flex items-center gap-2 bg-[#080d28] px-3 py-1.5 rounded-xl border border-white/10 text-xs self-start">
              {liveAws?.available ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#01b574] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#01b574]"></span>
                  </span>
                  <span className="font-semibold text-[#01b574]">
                    Live AWS Data Synced
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#ffb547]"></span>
                  <span className="font-medium text-[#ffb547]">
                    Live Cloud Store Mode
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card className="vision-card border-none p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">
                  PERIOD SPEND ({formatMonthName(financials.currentMonth).toUpperCase()})
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {fmt(financials.currentSpend)}
                </h3>
                <p className="text-xs text-[#a0aec0] pt-0.5">
                  Billed in active billing cycle
                </p>
              </div>
              <div className="vision-icon-box h-10 w-10 text-white">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="vision-card border-none p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">
                  PREVIOUS PERIOD SPEND
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {financials.previousSpend ? fmt(financials.previousSpend) : "—"}
                </h3>
                <div className="flex items-center gap-1.5 text-xs pt-0.5">
                  {financials.previousSpend > 0 ? (
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        isPositiveMoM
                          ? "text-[#e31a1a]"
                          : isNegativeMoM
                          ? "text-[#01b574]"
                          : "text-[#a0aec0]"
                      }`}
                    >
                      {isPositiveMoM && <TrendingUp className="h-3.5 w-3.5" />}
                      {isNegativeMoM && <TrendingDown className="h-3.5 w-3.5" />}
                      {isPositiveMoM ? "+" : ""}
                      {financials.momChangePercent}% MoM
                    </span>
                  ) : (
                    <span className="text-[#a0aec0]">Prior month total</span>
                  )}
                </div>
              </div>
              <div className="vision-icon-box h-10 w-10 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="vision-card border-none p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">
                  6-MONTH AVERAGE SPEND
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {fmt(variance?.mean || financials.currentSpend)}
                </h3>
                <p className="text-xs text-[#a0aec0] pt-0.5">
                  Volatility:{" "}
                  <span className="font-semibold text-white">
                    {variance?.volatilityCategory || "Stable"}
                  </span>
                </p>
              </div>
              <div className="vision-icon-box h-10 w-10 text-white">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="vision-card border-none p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1 min-w-0 pr-2">
                <p className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">
                  PRIMARY COST DRIVER
                </p>
                <h3 className="text-lg font-bold text-white tracking-tight truncate" title={governance.topCostDriver}>
                  {governance.topCostDriver}
                </h3>
                <p className="text-xs text-[#a0aec0] pt-0.5">
                  Dominant service inside account
                </p>
              </div>
              <div className="vision-icon-box h-10 w-10 text-white shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Visual Charts Grid: 6-Month Spend Trend & Live Service Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: 6-Month Historical Spend Trajectory */}
          <Card className="vision-card border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold tracking-tight text-white">
                    Historical Monthly Spend Trend
                  </CardTitle>
                  <p className="text-xs text-[#a0aec0] mt-0.5">
                    6-month billing history
                  </p>
                </div>
                <span className="vision-badge-blue text-xs font-semibold py-0.5 px-2">
                  {financials.historicalMonthlySpend.length} Months
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {financials.historicalMonthlySpend.length > 0 ? (
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financials.historicalMonthlySpend}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#a0aec0"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#a0aec0"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatCompactCurrency}
                        width={50}
                      />
                      <Tooltip
                        formatter={(val: any) => [
                          `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                          "Total Spend",
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(6, 11, 40, 0.95)",
                          borderColor: "rgba(255, 255, 255, 0.12)",
                          borderRadius: "0.75rem",
                          color: "#fff",
                          fontSize: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}
                      />
                      <Bar dataKey="cost" fill="#0075ff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[#a0aec0] text-xs">
                  No historical cost data recorded for this account.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Top AWS Services inside this account */}
          <Card className="vision-card border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#0075ff]" />
                    Services Inside This Account
                  </CardTitle>
                  <p className="text-xs text-[#a0aec0] mt-0.5">
                    Live AWS Cost Explorer breakdown ({financials.currentMonth})
                  </p>
                </div>
                {liveAws?.services && (
                  <span className="vision-badge-blue text-xs font-semibold py-0.5 px-2">
                    {liveAws.services.length} Services
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 h-[280px] pt-2">
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={VISION_COLORS[index % VISION_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any) => [
                            `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            "Cost",
                          ]}
                          contentStyle={{
                            backgroundColor: "rgba(6, 11, 40, 0.95)",
                            borderColor: "rgba(255, 255, 255, 0.12)",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "12px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top 5 Service Legend List */}
                  <div className="space-y-2 text-xs pr-2 overflow-y-auto max-h-[250px]">
                    {pieData.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                VISION_COLORS[idx % VISION_COLORS.length],
                            }}
                          />
                          <span className="font-medium text-white truncate">
                            {s.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white shrink-0">
                          {fmt(s.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[#a0aec0] text-xs">
                  {liveAws?.error ? `Live AWS Notice: ${liveAws.error}` : "No live service breakdown available."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Live Services Table & Regional Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Services Table (2 Cols) */}
          <Card className="lg:col-span-2 vision-card border-none">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-base font-bold tracking-tight text-white">
                Granular Service Consumption
              </CardTitle>
              <p className="text-xs text-[#a0aec0]">
                All AWS service charges billed to account {account.linkedAccountId}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {liveAws?.services && liveAws.services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a0aec0]">
                        AWS Service
                      </TableHead>
                      <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a0aec0] text-right w-[140px]">
                        Cost
                      </TableHead>
                      <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-[#a0aec0] text-right w-[110px]">
                        Share %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveAws.services.map((s, idx) => (
                      <TableRow key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                        <TableCell className="py-2.5 px-4 font-medium text-xs text-white">
                          {s.service}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right font-mono font-bold text-xs text-white">
                          {fmt(s.cost)}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right font-bold text-xs text-[#00c5ff]">
                          {s.sharePct}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-[#a0aec0] py-8 text-center">
                  Service-level details could not be retrieved from AWS Cost Explorer.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Regional Footprint (1 Col) */}
          <Card className="vision-card border-none">
            <CardHeader className="pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0075ff]" />
                <div>
                  <CardTitle className="text-base font-bold tracking-tight text-white">
                    Regional Footprint
                  </CardTitle>
                  <p className="text-xs text-[#a0aec0]">
                    Geographic distribution of spend
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {liveAws?.regions && liveAws.regions.length > 0 ? (
                <div className="space-y-3">
                  {liveAws.regions.slice(0, 6).map((r, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white font-mono">
                          {r.region}
                        </span>
                        <span className="font-mono text-[#a0aec0]">
                          {fmt(r.cost)} ({r.sharePct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0075ff] to-[#00c5ff] rounded-full"
                          style={{ width: `${Math.min(r.sharePct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#a0aec0] py-8 text-center">
                  No regional data available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default LinkedAccountDetailPage;
