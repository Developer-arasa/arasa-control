"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";


const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("id-ID");

type Session = {
  id: string;
  group_name: string | null;
  status: string | null;
  created_at: string;
  tour_leaders?: { name: string | null } | { name: string | null }[] | null;
  tour_orders?: {
    id: string;
    tour_order_items?: { qty: number | null; price_at_checkout: number | null }[] | null;
  }[] | null;
};

type Stats = {
  revenue: number;
  activeRevenue: number;
  activeSessions: number;
  activeLeaders: number;
  orders: number;
  participants: number;
  todaySessions: number;
};

const initialStats: Stats = {
  revenue: 0,
  activeRevenue: 0,
  activeSessions: 0,
  activeLeaders: 0,
  orders: 0,
  participants: 0,
  todaySessions: 0,
};

function getLeaderName(session: Session) {
  if (Array.isArray(session.tour_leaders)) {
    return session.tour_leaders[0]?.name || "-";
  }

  return session.tour_leaders?.name || "-";
}

function getSessionRevenue(session: Session) {
  return (session.tour_orders || []).reduce((total, order) => {
    return (
      total +
      (order.tour_order_items || []).reduce(
        (orderTotal, item) =>
          orderTotal + Number(item.qty || 0) * Number(item.price_at_checkout || 0),
        0,
      )
    );
  }, 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMessage("");

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const selection = `
        id, group_name, status, created_at,
        tour_leaders(name),
        tour_orders(id, tour_order_items(qty, price_at_checkout))
      `;

      const [recentResult, activeResult, leaderResult, orderResult, itemResult, todayResult] =
        await Promise.all([
          supabase
            .from("tour_sessions")
            .select(selection)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase.from("tour_sessions").select(selection).eq("status", "active"),
          supabase
            .from("tour_leaders")
            .select("*", { count: "exact", head: true })
            .eq("is_active", 1),
          supabase.from("tour_orders").select("*", { count: "exact", head: true }),
          supabase.from("tour_order_items").select("qty, price_at_checkout"),
          supabase
            .from("tour_sessions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", todayStart.toISOString()),
        ]);

      const queryError = [
        recentResult.error,
        activeResult.error,
        leaderResult.error,
        orderResult.error,
        itemResult.error,
        todayResult.error,
      ].find(Boolean);

      if (queryError) throw queryError;

      const recentSessions = (recentResult.data || []) as Session[];
      const activeSessions = (activeResult.data || []) as Session[];
      const revenue = (itemResult.data || []).reduce(
        (total, item) => total + Number(item.qty || 0) * Number(item.price_at_checkout || 0),
        0,
      );

      setSessions(recentSessions);
      setStats({
        revenue,
        activeRevenue: activeSessions.reduce(
          (total, session) => total + getSessionRevenue(session),
          0,
        ),
        activeSessions: activeSessions.length,
        activeLeaders: leaderResult.count || 0,
        orders: orderResult.count || 0,
        participants: recentSessions.reduce(
          (total, session) => total + (session.tour_orders?.length || 0),
          0,
        ),
        todaySessions: todayResult.count || 0,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Gagal narik data dashboard:", error);
      setErrorMessage("Data belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const healthPercentage = stats.orders
    ? Math.min(
        100,
        Math.round(
          (stats.activeSessions / Math.max(stats.activeSessions + stats.todaySessions, 1)) * 100,
        ),
      )
    : 0;

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 flex flex-col justify-between gap-5 lg:mb-9 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
              <span>Arasa Control</span>
              <ChevronRight size={12} />
              <span className="text-neutral-900">Ringkasan</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-950">{greeting}, Admin.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Pusat kendali untuk memantau pendapatan, rombongan aktif, dan kesiapan operasional Arasa secara waktu nyata.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Sinkronisasi terakhir</p>
              <p className="mt-1 text-xs font-semibold text-neutral-900">
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "—"} WIB
              </p>
            </div>
            <button
              onClick={() => fetchDashboard(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 shadow-sm transition hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isRefreshing ? "Menyinkronkan" : "Segarkan"}</span>
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
            <span>{errorMessage}</span>
            <button onClick={() => fetchDashboard()} className="shrink-0 font-bold underline">Muat ulang</button>
          </div>
        )}

        <section className="relative mb-6 overflow-hidden rounded-[26px] bg-neutral-950 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)] sm:p-8">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[30px] border-white/10" />
          <div className="absolute -bottom-36 right-40 h-64 w-64 rounded-full border-[24px] border-white/5" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Ringkasan operasional aktif
              </div>
              <h2 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                Bisnis bergerak. Tim siap. Data terkendali.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-300">
                Satu ruang kendali untuk memastikan setiap perjalanan dan pesanan rombongan berjalan lancar.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/order" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-neutral-950 transition hover:bg-neutral-200">
                  Buka papan pesanan <ArrowUpRight size={15} />
                </Link>
                <Link href="/tour-leader" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10">
                  Kelola pemandu tur <UserRound size={15} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <DarkStat icon={Activity} label="AKTIF" value={isLoading ? "—" : number.format(stats.activeSessions)} text="sesi berjalan" />
              <DarkStat icon={Zap} label="HARI INI" value={isLoading ? "—" : number.format(stats.todaySessions)} text="sesi dibuat hari ini" />
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total pendapatan" value={isLoading ? "—" : currency.format(stats.revenue)} helper="Akumulasi seluruh pesanan" icon={Wallet} tone="neutral" tag="PENDAPATAN" />
          <MetricCard label="Pendapatan berjalan" value={isLoading ? "—" : currency.format(stats.activeRevenue)} helper="Nilai pesanan yang sedang berjalan" icon={TrendingUp} tone="neutral" tag="AKTIF" />
          <MetricCard label="Pemandu tur aktif" value={isLoading ? "—" : `${number.format(stats.activeLeaders)} orang`} helper="Personel siap menerima perjalanan" icon={Users} tone="neutral" tag="KAPASITAS" />
          <MetricCard label="Total pesanan" value={isLoading ? "—" : number.format(stats.orders)} helper={`${number.format(stats.participants)} peserta di sesi terbaru`} icon={PackageCheck} tone="neutral" tag="VOLUME" />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="overflow-hidden rounded-[22px] border border-[#E4D7C5] bg-white shadow-[0_10px_35px_rgba(74,14,23,0.05)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E5E5] px-5 py-5 sm:items-center sm:px-6">
              <div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-neutral-900" /><h2 className="text-xl font-bold text-neutral-950">Sesi terbaru</h2></div>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Rombongan yang baru masuk ke pusat kendali.</p>
              </div>
              <Link href="/order" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.11em] text-neutral-900 transition hover:bg-neutral-100">Lihat semua <ArrowUpRight size={14} /></Link>
            </div>
            <div className="md:hidden">
              {isLoading ? <MobileLoadingCards /> : sessions.length === 0 ? <div className="px-5 py-14 text-center text-sm text-[#88766F]">Belum ada aktivitas rombongan.</div> : <div className="space-y-3 p-4">{sessions.map((session) => <MobileSessionCard key={session.id} session={session} />)}</div>}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead><tr className="border-b border-[#E5E5E5] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A8981]"><th className="px-6 py-4">Rombongan</th><th className="px-4 py-4">Tour leader</th><th className="px-4 py-4 text-center">Peserta</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Waktu</th></tr></thead>
                <tbody className="divide-y divide-[#F1EAE1]">
                  {isLoading ? <LoadingRows /> : sessions.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-[#88766F]">Belum ada aktivitas rombongan.</td></tr> : sessions.map((session) => <SessionRow key={session.id} session={session} />)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="mb-6 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Kesehatan operasional</p><h2 className="mt-1 text-xl font-bold text-neutral-900">Status sistem</h2></div><div className="rounded-xl bg-neutral-100 p-2.5 text-neutral-900"><ShieldCheck size={20} /></div></div>
              <div className="mb-5 flex items-end justify-between"><div><p className="text-3xl font-bold text-neutral-900">{isLoading ? "—" : `${healthPercentage}%`}</p><p className="mt-1 text-xs text-neutral-500">rasio operasi aktif</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-700">SEHAT</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-900 transition-all duration-700" style={{ width: `${Math.max(healthPercentage, isLoading ? 0 : 8)}%` }} /></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><PulseItem icon={CheckCircle2} label="Basis data" value="Terhubung" good /><PulseItem icon={Clock3} label="Pembaruan otomatis" value="60 detik" /></div>
            </div>
            <div className="rounded-[22px] bg-neutral-200 p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-white p-2.5 text-neutral-900"><BarChart3 size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Ringkasan cepat</p><h3 className="text-lg font-bold text-neutral-900">Metrik utama</h3></div></div><div className="space-y-4"><InsightRow icon={CalendarDays} label="Sesi hari ini" value={`${number.format(stats.todaySessions)} sesi`} /><InsightRow icon={Timer} label="Pendapatan berjalan" value={currency.format(stats.activeRevenue)} /><InsightRow icon={Eye} label="Peserta terpantau" value={`${number.format(stats.participants)} orang`} /></div></div>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-neutral-300 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 sm:flex-row"><span>Arasa Control · Sistem operasional internal</span><span>Ruang kerja aman · v1.0</span></footer>
      </div>
    </div>
  );
}

function DarkStat({ icon: Icon, label, value, text }: { icon: LucideIcon; label: string; value: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"><div className="mb-5 flex items-center justify-between text-neutral-300"><Icon size={18} /><span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-white/60">{text}</p></div>;
}

function MetricCard({ label, value, helper, icon: Icon, tone, tag }: { label: string; value: string; helper: string; icon: LucideIcon; tone: "neutral"; tag: string }) {
  return <div className="group rounded-[20px] border border-neutral-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]"><div className="mb-6 flex items-start justify-between"><div className="rounded-xl bg-neutral-100 p-3 text-neutral-900"><Icon size={20} /></div><span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">{tag}</span></div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">{label}</p><p className="mt-2 truncate text-xl font-bold tracking-tight text-neutral-900">{value}</p><p className="mt-2 text-xs text-neutral-500">{helper}</p></div>;
}

function SessionRow({ session }: { session: Session }) {
  const active = session.status === "active";
  const participants = session.tour_orders?.length || 0;
  return <tr className="group transition hover:bg-neutral-50"><td className="px-6 py-4"><Link href={`/order/${session.id}`} className="block"><p className="max-w-[210px] truncate text-sm font-bold text-neutral-900 group-hover:underline">{session.group_name || "Tanpa nama"}</p><p className="mt-1 font-mono text-[10px] text-neutral-400">{session.id.slice(0, 8).toUpperCase()}</p></Link></td><td className="px-4 py-4 text-sm font-medium text-neutral-600">{getLeaderName(session)}</td><td className="px-4 py-4 text-center"><span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900"><Users size={14} className="text-neutral-500" />{participants}</span></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-white" : "bg-neutral-400"}`} />{active ? "Berjalan" : "Selesai"}</span></td><td className="px-6 py-4 text-right"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-neutral-500"><Clock3 size={13} />{isToday(session.created_at) ? formatDate(session.created_at).split(", ")[1] : formatDate(session.created_at)}</span></td></tr>;
}

function MobileSessionCard({ session }: { session: Session }) {
  const active = session.status === "active";
  const participants = session.tour_orders?.length || 0;

  return (
    <Link
      href={`/order/${session.id}`}
      className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition active:scale-[0.99] hover:border-neutral-400 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-neutral-900">{session.group_name || "Tanpa nama"}</p>
          <p className="mt-1 font-mono text-[10px] text-neutral-400">{session.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-white" : "bg-neutral-400"}`} />
          {active ? "Berjalan" : "Selesai"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 text-xs text-neutral-500">
        <span className="flex min-w-0 items-center gap-2"><UserRound size={14} className="shrink-0 text-neutral-500" /><span className="truncate">{getLeaderName(session)}</span></span>
        <span className="flex shrink-0 items-center gap-1.5 font-bold text-neutral-900"><Users size={14} className="text-neutral-500" />{participants} peserta</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500"><Clock3 size={13} />{isToday(session.created_at) ? formatDate(session.created_at).split(", ")[1] : formatDate(session.created_at)}<ChevronRight size={14} className="ml-auto text-neutral-500" /></div>
    </Link>
  );
}

function MobileLoadingCards() {
  return <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <div key={row} className="h-[126px] animate-pulse rounded-2xl bg-neutral-200" />)}</div>;
}

function LoadingRows() {
  return <>{[1, 2, 3, 4].map((row) => <tr key={row}><td colSpan={5} className="px-6 py-4"><div className="h-10 animate-pulse rounded-lg bg-neutral-200" /></td></tr>)}</>;
}

function PulseItem({ icon: Icon, label, value, good = false }: { icon: LucideIcon; label: string; value: string; good?: boolean }) {
  return <div className="rounded-xl bg-neutral-100 p-3"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500"><Icon size={13} className={good ? "text-neutral-900" : "text-neutral-500"} />{label}</div><p className="mt-2 text-xs font-bold text-neutral-900">{value}</p></div>;
}

function InsightRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-neutral-300 pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-2.5 text-xs font-medium text-neutral-600"><Icon size={15} className="text-neutral-500" />{label}</div><span className="text-xs font-bold text-neutral-900">{value}</span></div>;
}