"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — customer
// analytics dashboard. Reads the real, aggregated `/api/analytics/summary`
// endpoint — no mock numbers. The daily-pageviews chart is a handful of
// plain divs (bar heights from real counts), not a charting library —
// this is one chart, once, not a reason to add a new dependency.

import { useEffect, useState } from "react";
import { Users, Eye, MousePointerClick, Inbox, ShoppingBag, Smartphone, Tablet, Monitor } from "lucide-react";

interface Summary {
  days: number;
  totalPageviews: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  dailyPageviews: { date: string; count: number }[];
  formSubmissions: number;
  orders: { count: number; revenue: number };
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="text-[18px] font-black text-gray-900">{value}</p>
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Pageviews over time</p>
      <div className="flex items-end gap-[2px] h-20 border-b border-gray-100">
        {data.map((d) => (
          <div key={d.date} className="flex-1 bg-[#6344d4]/70 rounded-t-sm hover:bg-[#6344d4] transition-colors" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }} title={`${d.date}: ${d.count}`} />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({ icon, label, count, total }: { icon: React.ReactNode; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="w-14 shrink-0 text-gray-600">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#6344d4] rounded-full" style={{ width: `${pct}%` }} /></div>
      <span className="w-9 shrink-0 text-right text-gray-500 font-semibold">{pct}%</span>
    </div>
  );
}

export default function AnalyticsPanel({ projectId }: { projectId: string }) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/analytics/summary?projectId=${projectId}&days=${days}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSummary(d))
      .finally(() => setLoading(false));
  }, [projectId, days]);

  const deviceIcon: Record<string, React.ReactNode> = { mobile: <Smartphone size={12} />, tablet: <Tablet size={12} />, desktop: <Monitor size={12} /> };
  const deviceTotal = summary?.deviceBreakdown.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last</span>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-2 py-1 text-[11px] font-semibold border border-gray-200 rounded-md bg-white">
          {[7, 30, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-[12px] text-gray-400">Loading…</div>
      ) : !summary ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Eye size={22} className="text-gray-300" />
          <p className="text-[12px] text-gray-400">No analytics yet — data appears once your site gets real visits.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={<Eye size={12} />} label="Pageviews" value={summary.totalPageviews} />
            <StatCard icon={<Users size={12} />} label="Visitors" value={summary.uniqueVisitors} />
            <StatCard icon={<MousePointerClick size={12} />} label="Sessions" value={summary.uniqueSessions} />
            <StatCard icon={<Inbox size={12} />} label="Form leads" value={summary.formSubmissions} />
          </div>

          {summary.orders.count > 0 && (
            <StatCard icon={<ShoppingBag size={12} />} label="Orders / revenue" value={`${summary.orders.count} · $${summary.orders.revenue.toFixed(2)}`} />
          )}

          <DailyChart data={summary.dailyPageviews} />

          {summary.deviceBreakdown.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Devices</p>
              {(["desktop", "tablet", "mobile"] as const).map((dev) => {
                const found = summary.deviceBreakdown.find((d) => d.device === dev);
                return <DeviceRow key={dev} icon={deviceIcon[dev]} label={dev} count={found?.count ?? 0} total={deviceTotal} />;
              })}
            </div>
          )}

          {summary.topPages.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Top pages</p>
              <div className="space-y-1">
                {summary.topPages.map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-[11.5px] border-b border-gray-50 pb-1">
                    <span className="text-gray-700 truncate">{p.path || "/"}</span>
                    <span className="text-gray-400 font-semibold shrink-0 ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.topReferrers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Top referrers</p>
              <div className="space-y-1">
                {summary.topReferrers.map((r) => (
                  <div key={r.referrer} className="flex items-center justify-between text-[11.5px] border-b border-gray-50 pb-1">
                    <span className="text-gray-700 truncate">{r.referrer}</span>
                    <span className="text-gray-400 font-semibold shrink-0 ml-2">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
