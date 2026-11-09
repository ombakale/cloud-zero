import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useCsv } from "@/lib/useCsv";
import type { ServiceCost, RecurringRow } from "@/lib/types";
import { Search, ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface DataTablesProps {
  selectedMonth: string;
  basePath?: string;
}

export function DataTables({ selectedMonth, basePath = "/data" }: DataTablesProps) {
  // 1. Cost by Service (Monthly) - we prefer wide pivot if available, or fall back to single month
  const { data: wideServices } = useCsv<any>(`${basePath}/cost_by_service_last_6_months.csv`);
  const { data: services } = useCsv<ServiceCost>(`${basePath}/cost_by_service.csv`);

  // 2. Service Usage Frequency (Recurring vs Onetime)
  const { data: recurring } = useCsv<RecurringRow>(`${basePath}/recurring_vs_onetime.csv`);

  // Extract available months from wideServices to determine default/latest and previous month
  const { availableMonths, isServiceFirst } = useMemo(() => {
    if (!wideServices || wideServices.length === 0) {
      return { availableMonths: [], isServiceFirst: false };
    }

    const firstRow = wideServices[0];
    const isServiceFirstFormat = "Service" in firstRow;

    if (isServiceFirstFormat) {
      // Shape A: Columns are months (e.g. Service, 2026-04, 2026-05)
      const keys = Object.keys(firstRow).filter((k) => k !== "Service" && k !== "Total Cost");
      const sortedMonths = keys.filter((k) => /^\d{4}-\d{2}/.test(k)).sort();
      return { availableMonths: sortedMonths, isServiceFirst: true };
    } else {
      // Shape B: Rows are months (e.g. Month, EC2, S3, RDS)
      const monthsFromRows = wideServices
        .map((r) => r.Month)
        .filter((m) => Boolean(m) && /^\d{4}-\d{2}/.test(m))
        .sort();
      return { availableMonths: monthsFromRows, isServiceFirst: false };
    }
  }, [wideServices]);

  // Determine effective current month and previous month for comparison
  const { effectiveMonth, prevMonth } = useMemo(() => {
    if (availableMonths.length === 0) {
      return { effectiveMonth: selectedMonth || null, prevMonth: null };
    }

    const curr = selectedMonth && availableMonths.includes(selectedMonth)
      ? selectedMonth
      : availableMonths[availableMonths.length - 1];

    const currIdx = availableMonths.indexOf(curr);
    const prev = currIdx > 0 ? availableMonths[currIdx - 1] : null;

    return { effectiveMonth: curr, prevMonth: prev };
  }, [availableMonths, selectedMonth]);

  // Transform wideServices into comparison list: { Service, CurrentCost, PreviousCost }
  const serviceComparisons = useMemo(() => {
    if (!wideServices || wideServices.length === 0) {
      if (services && services.length > 0) {
        return services.map((s) => ({
          Service: s ? s.Service : "",
          CurrentCost: Number(s?.Cost ?? 0),
          PreviousCost: 0,
        }));
      }
      return [];
    }

    const list: Array<{ Service: string; CurrentCost: number; PreviousCost: number }> = [];

    if (isServiceFirst) {
      // Each row is a service, with months as columns
      for (const row of wideServices) {
        if (!row || !row.Service) continue;
        const currentCost = effectiveMonth ? Number(row[effectiveMonth]) : 0;
        const previousCost = prevMonth ? Number(row[prevMonth]) : 0;

        const cleanCurrent = isNaN(currentCost) ? 0 : currentCost;
        const cleanPrevious = isNaN(previousCost) ? 0 : previousCost;

        if (cleanCurrent > 0 || cleanPrevious > 0) {
          list.push({
            Service: row.Service,
            CurrentCost: cleanCurrent,
            PreviousCost: cleanPrevious,
          });
        }
      }
    } else {
      // Each row is a month, with services as columns
      const currentMonthRow = wideServices.find((r) => r && r.Month === effectiveMonth);
      const previousMonthRow = prevMonth ? wideServices.find((r) => r && r.Month === prevMonth) : null;

      const rowKeys = currentMonthRow ? Object.keys(currentMonthRow) : [];
      const serviceKeys = rowKeys.filter((k) => k !== "Month" && k !== "Total Cost");

      for (const service of serviceKeys) {
        const currentCost = currentMonthRow ? Number(currentMonthRow[service]) : 0;
        const previousCost = previousMonthRow ? Number(previousMonthRow[service]) : 0;

        const cleanCurrent = isNaN(currentCost) ? 0 : currentCost;
        const cleanPrevious = isNaN(previousCost) ? 0 : previousCost;

        if (cleanCurrent > 0 || cleanPrevious > 0) {
          list.push({
            Service: service,
            CurrentCost: cleanCurrent,
            PreviousCost: cleanPrevious,
          });
        }
      }
    }

    if (list.length === 0 && services && services.length > 0) {
      return services.map((s) => ({
        Service: s ? s.Service : "",
        CurrentCost: Number(s?.Cost ?? 0),
        PreviousCost: 0,
      }));
    }

    return list.sort((a, b) => b.CurrentCost - a.CurrentCost || b.PreviousCost - a.PreviousCost);
  }, [services, wideServices, effectiveMonth, prevMonth, isServiceFirst]);

  // Search states
  const [searchServices, setSearchServices] = useState("");
  const [searchRecurring, setSearchRecurring] = useState("");

  // Pagination states
  const [pageServices, setPageServices] = useState(1);
  const [pageRecurring, setPageRecurring] = useState(1);

  const ITEMS_PER_PAGE = 8;

  // Filter & Paginate 1: Services
  const filteredServices = serviceComparisons.filter((s) =>
    s && s.Service && String(s.Service).toLowerCase().includes(searchServices.toLowerCase())
  );
  const totalPagesServices = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice(
    (pageServices - 1) * ITEMS_PER_PAGE,
    pageServices * ITEMS_PER_PAGE
  );

  // Filter & Paginate 2: Service Usage Frequency
  const filteredRecurring = (recurring || []).filter((r) =>
    r && r.Service && String(r.Service).toLowerCase().includes(searchRecurring.toLowerCase())
  );
  const totalPagesRecurring = Math.ceil(filteredRecurring.length / ITEMS_PER_PAGE);
  const paginatedRecurring = filteredRecurring.slice(
    (pageRecurring - 1) * ITEMS_PER_PAGE,
    pageRecurring * ITEMS_PER_PAGE
  );

  // Helper to handle search change & reset page
  const handleSearchServices = (val: string) => {
    setSearchServices(val);
    setPageServices(1);
  };
  const handleSearchRecurring = (val: string) => {
    setSearchRecurring(val);
    setPageRecurring(1);
  };

  // Format month name for headers display
  const formatMonthName = (mStr: string) => {
    if (!mStr || typeof mStr !== "string") return "";
    const parts = mStr.split("-");
    if (parts.length < 2) return mStr;
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(date.getTime())) return mStr;
    return date.toLocaleString("default", { month: "long" });
  };

  // Format short month name for headers display
  const formatShortMonthName = (mStr: string | null) => {
    if (!mStr || typeof mStr !== "string") return "-";
    const parts = mStr.split("-");
    if (parts.length < 2) return "-";
    const [year, month] = parts;
    const date = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("default", { month: "short" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Cost by Service */}
      <Card className="vision-card flex flex-col h-full border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#84cc16]" />
                Cost by Service
              </CardTitle>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                {effectiveMonth ? formatMonthName(effectiveMonth) : (selectedMonth ? formatMonthName(selectedMonth) : "Latest Month")} vs previous period
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pb-4">
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchServices}
              onChange={(e) => handleSearchServices(e.target.value)}
              className="w-full bg-[#141414]/90 pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 text-white placeholder-[#a1a1aa] focus:border-[#84cc16] focus:outline-none transition-all"
            />
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-[360px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] max-w-[200px]">Service</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right whitespace-nowrap w-[100px]">
                    {prevMonth ? formatShortMonthName(prevMonth) : "Prev"}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right whitespace-nowrap w-[100px]">
                    {effectiveMonth ? formatShortMonthName(effectiveMonth) : (selectedMonth ? formatShortMonthName(selectedMonth) : "Curr")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedServices.length > 0 ? (
                  paginatedServices.map((s, i) => (
                    <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <TableCell className="max-w-[200px] truncate font-medium text-white py-2.5 text-xs" title={s.Service}>
                        {s.Service}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap w-[100px] py-2.5 text-[#a1a1aa] text-xs font-medium">
                        ${Number(s.PreviousCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white whitespace-nowrap w-[100px] py-2.5 text-xs">
                        ${Number(s.CurrentCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[#a1a1aa] py-8 text-xs">
                      No services found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <span className="text-xs text-[#a1a1aa]">
              Page {pageServices} of {Math.max(1, totalPagesServices)} ({filteredServices.length} items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPageServices((p) => Math.max(1, p - 1))}
                disabled={pageServices <= 1}
                className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPageServices((p) => Math.min(totalPagesServices, p + 1))}
                disabled={pageServices >= totalPagesServices || totalPagesServices === 0}
                className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Usage Frequency (Recurring vs Onetime) */}
      <Card className="vision-card flex flex-col h-full border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#a3e635]" />
                Service Usage Frequency
              </CardTitle>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Recurring infrastructure vs ad-hoc usage
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 pb-4">
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search recurring services..."
              value={searchRecurring}
              onChange={(e) => handleSearchRecurring(e.target.value)}
              className="w-full bg-[#141414]/90 pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 text-white placeholder-[#a1a1aa] focus:border-[#84cc16] focus:outline-none transition-all"
            />
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-[360px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] max-w-[200px]">Service</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-center w-[120px]">Months Active</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa] text-right w-[100px]">Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecurring.length > 0 ? (
                  paginatedRecurring.map((r, i) => (
                    <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <TableCell className="max-w-[200px] truncate font-medium text-white py-2.5 text-xs" title={r.Service}>
                        {r.Service}
                      </TableCell>
                      <TableCell className="text-center py-2.5 text-xs">
                        <span className="font-bold text-white">
                          {r["Months Active"] ?? 0}
                        </span>
                        <span className="text-[#a1a1aa]">/{r["Total Months"] ?? 6}</span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <span
                          className={
                            r.Classification === "Recurring"
                              ? "vision-badge-green text-[10px] font-semibold py-0.5 px-2"
                              : "vision-badge-red text-[10px] font-semibold py-0.5 px-2"
                          }
                        >
                          {r.Classification || "Onetime"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[#a1a1aa] py-8 text-xs">
                      No classification data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <span className="text-xs text-[#a1a1aa]">
              Page {pageRecurring} of {Math.max(1, totalPagesRecurring)} ({filteredRecurring.length} items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPageRecurring((p) => Math.max(1, p - 1))}
                disabled={pageRecurring <= 1}
                className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPageRecurring((p) => Math.min(totalPagesRecurring, p + 1))}
                disabled={pageRecurring >= totalPagesRecurring || totalPagesRecurring === 0}
                className="p-1.5 rounded-lg border border-white/10 bg-[#141414] text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
