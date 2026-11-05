import { useState, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountRequestForm } from "@/components/AccountRequestForm";
import { useAccountRequests } from "@/lib/useAccountRequests";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  ListOrdered,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function NewRequestPage() {
  const { records, addRecord } = useAccountRequests();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"form" | "my-requests">("form");

  const myRequests = useMemo(() => {
    return records;
  }, [records]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
        {/* Unified Top Navbar */}
        <Navbar />

        {/* Sub-Header Ribbon */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 py-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Cloud Account Provisioning &amp; Requests
                </h1>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 text-[10px] font-bold"
                >
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                  Self-Service FinOps
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit and track AWS accounts, environments, and budget approval requests
              </p>
            </div>

            {/* View Switcher: Submit Form vs All Requests */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveView("form")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === "form"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <PlusCircle size={14} />
                  <span>Request Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("my-requests")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeView === "my-requests"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <ListOrdered size={14} />
                  <span>Submissions ({myRequests.length})</span>
                </button>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Overview</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
          {activeView === "form" ? (
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
              <AccountRequestForm onSubmit={addRecord} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Cloud Account Requests &amp; Approval Status
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track approvals, FinOps reviews, and provisioned environments.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView("form")}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Submit Another Request</span>
                </button>
              </div>

              {myRequests.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 shadow-sm">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                    No requests found
                  </h3>
                  <p className="text-xs max-w-md mx-auto mb-4 text-slate-400">
                    No account provisioning requests have been submitted yet. Click below to start a new request.
                  </p>
                  <button
                    onClick={() => setActiveView("form")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    <span>Create New Account Request</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myRequests.map((req) => {
                    const status = req.status || "pending";
                    return (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3 transition-all hover:border-indigo-500/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                {req.projectName}
                              </h3>
                              <Badge variant="outline" className="text-[11px] font-semibold">
                                {req.accountEnvironment}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Division: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.division}</span> • Contact: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.pointOfContact}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize font-bold px-2.5 py-0.5 ${
                                status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : status === "rejected"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                  : status === "under_review"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {status === "approved" && <CheckCircle className="w-3 h-3 mr-1 inline" />}
                              {status === "rejected" && <XCircle className="w-3 h-3 mr-1 inline" />}
                              {status === "under_review" && <Clock className="w-3 h-3 mr-1 inline" />}
                              {status === "pending" && <Clock className="w-3 h-3 mr-1 inline" />}
                              {status.replace("_", " ")}
                            </Badge>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {req.adminNotes && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                              Admin Feedback ({req.reviewedBy || "FinOps"}):
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 italic">"{req.adminNotes}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Est. Monthly Cost</span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              ${req.estimatedMonthlyCost || "0"}/mo
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Managed By</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {req.managedByCoforge}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Account Manager</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {req.accountManager}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Charged Back</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {req.costChargedBack}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
