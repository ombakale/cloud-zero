import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Cloud,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Server,
  Layers,
  Activity,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CloudProvider = "aws" | "azure";

interface ConnectStatus {
  isConnected: boolean;
  activeProvider: CloudProvider | null;
  accountName?: string;
  accountId?: string;
  hasAwsData: boolean;
  hasAzureData: boolean;
}

export function ConnectCloudPage() {
  const navigate = useNavigate();

  // Navigation steps: 'select-provider' | 'credentials' | 'fetching'
  const [step, setStep] = useState<"select-provider" | "credentials" | "fetching">("select-provider");
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);

  // Status check
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form states - AWS
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccountName, setAwsAccountName] = useState("");
  const [showAwsSecret, setShowAwsSecret] = useState(false);

  // Form states - Azure
  const [azureTenantId, setAzureTenantId] = useState("");
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");
  const [azureSubscriptionId, setAzureSubscriptionId] = useState("");
  const [showAzureSecret, setShowAzureSecret] = useState(false);

  // Submission / Loading / Error
  const [fetchProgressStep, setFetchProgressStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if server already has connected data
  useEffect(() => {
    fetch("/api/connect/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus(data);
        }
      })
      .catch((err) => {
        console.warn("Could not query connect status:", err.message);
      })
      .finally(() => {
        setCheckingStatus(false);
      });
  }, []);

  const handleSelectProvider = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setErrorMessage(null);
    setStep("credentials");
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep("select-provider");
  };

  const handleSubmitAws = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim()) {
      setErrorMessage("Please enter both AWS Access Key ID and Secret Access Key.");
      return;
    }

    setErrorMessage(null);
    setStep("fetching");
    setFetchProgressStep("Validating IAM credentials with AWS...");

    try {
      setTimeout(() => {
        setFetchProgressStep("Querying AWS Cost Explorer & Budgets API...");
      }, 1200);

      setTimeout(() => {
        setFetchProgressStep("Computing FinOps analytics, Pareto & anomaly detection...");
      }, 2500);

      const res = await fetch("/api/connect/aws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessKeyId: awsAccessKeyId.trim(),
          secretAccessKey: awsSecretAccessKey.trim(),
          region: awsRegion.trim(),
          accountName: awsAccountName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to fetch AWS cost data.");
      }

      setFetchProgressStep("Success! Redirecting to live AWS dashboard...");
      setTimeout(() => {
        navigate("/aws");
      }, 800);
    } catch (err: any) {
      console.error("AWS Connect Error:", err);
      setErrorMessage(err.message || "Failed to connect to AWS. Please check credentials and IAM permissions.");
      setStep("credentials");
    }
  };

  const handleSubmitAzure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!azureTenantId.trim() || !azureClientId.trim() || !azureClientSecret.trim()) {
      setErrorMessage("Please fill in Tenant ID, Client ID, and Client Secret.");
      return;
    }

    setErrorMessage(null);
    setStep("fetching");
    setFetchProgressStep("Authenticating via Azure Active Directory...");

    try {
      setTimeout(() => {
        setFetchProgressStep("Connecting to Azure Cost Management API...");
      }, 1200);

      setTimeout(() => {
        setFetchProgressStep("Crunching multi-month subscription & service reports...");
      }, 2500);

      const res = await fetch("/api/connect/azure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: azureTenantId.trim(),
          clientId: azureClientId.trim(),
          clientSecret: azureClientSecret.trim(),
          subscriptionId: azureSubscriptionId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to fetch Azure cost data.");
      }

      setFetchProgressStep("Success! Redirecting to live Azure dashboard...");
      setTimeout(() => {
        navigate("/azure");
      }, 800);
    } catch (err: any) {
      console.error("Azure Connect Error:", err);
      setErrorMessage(err.message || "Failed to connect to Azure. Please verify Azure App Registration permissions.");
      setStep("credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between selection:bg-[#84cc16] selection:text-[#0a0a0a]">
      {/* Background ambient decorative glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#84cc16]/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[300px] bg-[#84cc16]/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[300px] bg-[#a3e635]/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84cc16] flex items-center justify-center shadow-[0_4px_16px_rgba(132,204,22,0.35)] text-[#0a0a0a]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Cloud Cost Intelligence</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#84cc16]/30 text-[#a3e635] bg-[#84cc16]/10">
                  FinOps Engine
                </Badge>
              </div>
              <p className="text-xs text-[#a1a1aa]">Live multi-cloud monitoring & analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {status?.isConnected && (
              <button
                onClick={() => navigate(status.activeProvider === "azure" ? "/azure" : "/aws")}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border border-white/10 hover:border-[#84cc16]/40 bg-[#141414] text-white transition-all cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-[#84cc16] animate-pulse" />
                <span>Active: {status.accountName || status.activeProvider?.toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#a1a1aa]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* STEP 1: Select Cloud Provider */}
        {step === "select-provider" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#84cc16]/15 border border-[#84cc16]/30 text-[#a3e635] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Select Environment
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Which Cloud Provider do you want to monitor?
              </h1>
              <p className="text-sm sm:text-base text-[#a1a1aa]">
                Choose your cloud provider to securely enter your credentials, fetch live cost data, and view real-time spend analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* AWS Option */}
              <div
                onClick={() => handleSelectProvider("aws")}
                className="group relative wm-block p-7 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-[#a3e635] group-hover:scale-105 group-hover:bg-[#84cc16] group-hover:text-[#0a0a0a] transition-all">
                    <Server className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#a3e635] transition-colors">
                      Amazon Web Services (AWS)
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                      Connect via IAM Access Keys to pull AWS Cost Explorer metrics, Linked Accounts breakdown, MoM variance, and budget tracking.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between">
                  <span className="text-xs text-[#a1a1aa] font-mono">AWS_ACCESS_KEY_ID</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a3e635] group-hover:translate-x-1 transition-transform">
                    <span>Connect AWS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Azure Option */}
              <div
                onClick={() => handleSelectProvider("azure")}
                className="group relative wm-block p-7 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-[#a3e635] group-hover:scale-105 group-hover:bg-[#84cc16] group-hover:text-[#0a0a0a] transition-all">
                    <Globe className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#a3e635] transition-colors">
                      Microsoft Azure
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                      Connect via Azure Service Principal to pull Subscriptions, Resource Groups, Consumed Services, and 17 FinOps analytical reports.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between">
                  <span className="text-xs text-[#a1a1aa] font-mono">AZURE_TENANT_ID</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a3e635] group-hover:translate-x-1 transition-transform">
                    <span>Connect Azure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick jump to dashboard if data exists */}
            {(status?.hasAwsData || status?.hasAzureData) && (
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate(status.activeProvider === "azure" ? "/azure" : "/aws")}
                  className="text-xs text-[#a1a1aa] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Skip to previously loaded dashboard &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Credentials Form */}
        {step === "credentials" && selectedProvider === "aws" && (
          <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Provider Selection
            </button>

            <div className="wm-block p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#84cc16] flex items-center justify-center text-[#0a0a0a]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AWS Account Credentials</h2>
                  <p className="text-xs text-[#a1a1aa]">Enter IAM user credentials with Cost Explorer read access</p>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-200">Connection Failed</div>
                    <div className="mt-0.5 leading-relaxed">{errorMessage}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitAws} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    AWS_ACCESS_KEY_ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={awsAccessKeyId}
                      onChange={(e) => setAwsAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    AWS_SECRET_ACCESS_KEY <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3" />
                    <input
                      type={showAwsSecret ? "text" : "password"}
                      required
                      value={awsSecretAccessKey}
                      onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAwsSecret(!showAwsSecret)}
                      className="absolute right-3.5 top-2.5 text-[#a1a1aa] hover:text-white cursor-pointer"
                    >
                      {showAwsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                      AWS_REGION
                    </label>
                    <select
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    >
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-east-2">us-east-2 (Ohio)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                      <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                      Account Nickname (Optional)
                    </label>
                    <input
                      type="text"
                      value={awsAccountName}
                      onChange={(e) => setAwsAccountName(e.target.value)}
                      placeholder="e.g. Primary Production"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="vision-button-primary w-full py-3 px-4 rounded-xl font-bold text-xs text-[#0a0a0a] bg-[#84cc16] hover:bg-[#a3e635] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Connect & Fetch Cost Explorer Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: Azure Form */}
        {step === "credentials" && selectedProvider === "azure" && (
          <div className="max-w-xl mx-auto w-full space-y-6 animate-in fade-in duration-200">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Provider Selection
            </button>

            <div className="wm-block p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#84cc16] flex items-center justify-center text-[#0a0a0a]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Azure Service Principal</h2>
                  <p className="text-xs text-[#a1a1aa]">Enter your Azure App Registration credentials</p>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-200">Connection Failed</div>
                    <div className="mt-0.5 leading-relaxed">{errorMessage}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitAzure} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    AZURE_TENANT_ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    AZURE_CLIENT_ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Server className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    AZURE_CLIENT_SECRET <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-3" />
                    <input
                      type={showAzureSecret ? "text" : "password"}
                      required
                      value={azureClientSecret}
                      onChange={(e) => setAzureClientSecret(e.target.value)}
                      placeholder="Client secret value"
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAzureSecret(!showAzureSecret)}
                      className="absolute right-3.5 top-2.5 text-[#a1a1aa] hover:text-white cursor-pointer"
                    >
                      {showAzureSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                    Subscription ID (Optional, auto-discovered if blank)
                  </label>
                  <input
                    type="text"
                    value={azureSubscriptionId}
                    onChange={(e) => setAzureSubscriptionId(e.target.value)}
                    placeholder="Leave blank to auto-discover active subscription"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16] transition-all"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="vision-button-primary w-full py-3 px-4 rounded-xl font-bold text-xs text-[#0a0a0a] bg-[#84cc16] hover:bg-[#a3e635] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Connect & Fetch Azure Cost Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: Fetching / Ingestion Progress View */}
        {step === "fetching" && (
          <div className="max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-[#84cc16]/20 border-t-[#84cc16] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#a3e635]">
                <Cloud className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Fetching Cloud Cost Intelligence</h3>
              <p className="text-sm text-[#a3e635] font-medium animate-pulse">
                {fetchProgressStep || "Contacting cloud APIs..."}
              </p>
              <p className="text-xs text-[#a1a1aa] max-w-xs mx-auto pt-2">
                Aggregating multi-month historical spend, calculating service breakdowns, Pareto distributions, and budget alerts.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-[#a1a1aa]">
        Cloud Cost Intelligence Platform &bull; Zero Server Footprint &bull; Direct Cloud SDK Ingestion
      </footer>
    </div>
  );
}

export default ConnectCloudPage;
