import React, { useState, useMemo, useEffect } from 'react';
import { HRModules } from './module-views/HRView';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  School,
  GraduationCap,
  Briefcase,
  BookOpen,
  ClipboardCheck,
  Wallet,
  FileText,
  Calendar,
  Library,
  Bell,
  MapPin,
  Clock,
  Truck,
  Zap,
  CheckCircle,
  User,
  UserPlus,
  ChevronRight,
  Bot,
  Settings,
  Gift,
  Download,
  MessageSquare,
  Send
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Modal } from './UI';
import { DataTable } from './DataTable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Ward } from '../types';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const pieData = [
  { name: 'Active', value: 400 },
  { name: 'Suspended', value: 300 },
  { name: 'Pending', value: 300 },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}



function MessageAlert({ count, onNavigate }: { count: number, onNavigate?: (view: string) => void }) {
  const { t } = useLanguage();
  if (count <= 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onNavigate?.('Messages')}
      className="p-6 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl shadow-lg shadow-indigo-500/20 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">You have {count} new message{count > 1 ? 's' : ''}</h3>
            <p className="text-indigo-100 text-sm">Click here to view your inbox and respond.</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function PendingReferralAlert({ count, onNavigate }: { count: number, onNavigate?: (view: string) => void }) {
  if (count <= 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onNavigate?.('Organizations')}
      className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl shadow-lg cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
            <School className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              {count} Pending Referral{count > 1 ? 's' : ''}
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            </h3>
            <p className="text-amber-600 dark:text-amber-400/80 text-sm font-medium">New school applications require your review and approval.</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1">
          <ChevronRight className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
    </motion.div>
  );
}

export function SuperAdminDashboard({ stats, unreadMessagesCount = 0, onNavigate, organizations = [] }: { stats?: { totalOrganizations: string; activeSubscriptions: string; totalUsers: string; annualRevenue: string }, unreadMessagesCount?: number, onNavigate?: (view: string) => void, organizations?: any[] }) {
  const { currency, t } = useLanguage();
  const pendingCount = organizations.filter(o => o.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
        <PendingReferralAlert count={pendingCount} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('system_overview')}</h1>
          <p className="text-zinc-500 mt-1">{t('welcome_back_super')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            2025/2026
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            System Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_organizations')} value={stats?.totalOrganizations || "1,284"} change="+12.5%" trend="up" icon={Building2} color="bg-indigo-600" />
        <StatCard title={t('active_subscriptions')} value={stats?.activeSubscriptions || "842"} change="+3.2%" trend="up" icon={CreditCard} color="bg-emerald-600" />
        <StatCard title={t('total_users')} value={stats?.totalUsers || "45.2k"} change="-1.4%" trend="down" icon={Users} color="bg-amber-600" />
        <StatCard title={t('annual_revenue')} value={stats?.annualRevenue || `${currency} 1,494,000`} change="+18.7%" trend="up" icon={TrendingUp} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('revenue_growth')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('org_status')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-sm text-zinc-500">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SchoolAdminDashboard({ stats, invoices = [], payments = [], students = [], classes = [], organization, attendanceHistory = [], activities = [], unreadMessagesCount = 0, onNavigate, onUpdateOrganization, staffList = [], departments = [] }: { stats?: { totalStudents: string; totalStaff: string; attendanceRate: string; feesCollected: string }, invoices?: any[], payments?: any[], students?: any[], classes?: any[], organization?: any, attendanceHistory?: any[], activities?: any[], unreadMessagesCount?: number, onNavigate?: (view: string) => void, onUpdateOrganization?: (data: any) => void, staffList?: any[], departments?: any[] }) {
  const { currency, t } = useLanguage();
  const [showOwingModal, setShowOwingModal] = useState(false);
  const [modalType, setModalType] = useState<'paid' | 'owing'>('owing');

  // Calculate Attendance Trends from real history
  const attendanceTrendData = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return [];
    
    // Group by date
    const groups: Record<string, { total: number, present: number }> = {};
    attendanceHistory.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groups[date]) groups[date] = { total: 0, present: 0 };
      groups[date].total++;
      if (record.status === 'Present') groups[date].present++;
    });

    return Object.entries(groups)
      .map(([name, vals]) => ({
        name,
        value: Math.round((vals.present / vals.total) * 100)
      }))
      .slice(-7); // Last 7 unique days
  }, [attendanceHistory]);

  const downloadReport = (title: string, reportData: any[]) => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Student Payment Status
  const studentStatusMap: Record<string, { invoiced: number, paid: number }> = {};
  invoices.forEach(inv => {
    if (!studentStatusMap[inv.student_id]) studentStatusMap[inv.student_id] = { invoiced: 0, paid: 0 };
    studentStatusMap[inv.student_id].invoiced += parseFloat(inv.amount || 0);
  });
  payments.forEach(pay => {
    if (!studentStatusMap[pay.student_id]) studentStatusMap[pay.student_id] = { invoiced: 0, paid: 0 };
    studentStatusMap[pay.student_id].paid += parseFloat(pay.amount || 0);
  });

  let paidCount = 0;
  let owingCount = 0;
  Object.values(studentStatusMap).forEach(stats => {
    if (stats.invoiced > 0) {
      if (stats.paid >= stats.invoiced) paidCount++;
      else owingCount++;
    }
  });

  const paymentStatusData = [
    { name: 'Fully Paid', value: paidCount },
    { name: 'Owing', value: owingCount }
  ];

  const PAYMENT_COLORS = ['#10b981', '#f59e0b'];

  const daysRemaining = useMemo(() => {
    if (!organization?.expiry_date) return null;
    const expiry = new Date(organization.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [organization?.expiry_date]);

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('school_dashboard')}</h1>
          <p className="text-zinc-500 mt-1">{t('school_overview')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {organization?.academic_year || '—'}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest pl-1">
            <Zap className={cn(
              "w-4 h-4",
              daysRemaining === null ? "text-zinc-400" :
              daysRemaining < 5 ? "text-red-500" :
              daysRemaining < 15 ? "text-amber-500" :
              "text-emerald-500"
            )} />
            <div className="flex flex-col leading-none">
              <span className="text-zinc-900 dark:text-white">{organization?.plan || 'Free'} Plan</span>
              <span className={cn(
                "text-[9px] mt-0.5",
                daysRemaining === null ? "text-zinc-500" :
                daysRemaining < 5 ? "text-red-500" :
                daysRemaining < 15 ? "text-amber-500" :
                "text-zinc-500"
              )}>
                {daysRemaining === null ? 'No Expiry Set' : 
                 daysRemaining < 0 ? 'Expired' : 
                 `Expires in ${daysRemaining} days`}
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            {organization?.current_term || 'Term 1'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_students')} value={stats?.totalStudents || "0"} change="Active" trend="up" icon={GraduationCap} color="bg-blue-600" />
        <StatCard title={t('total_staff')} value={stats?.totalStaff || "0"} change="Verified" trend="up" icon={Briefcase} color="bg-purple-600" />
        <StatCard title={t('attendance_rate')} value={stats?.attendanceRate || "0%"} change="Live" trend="up" icon={ClipboardCheck} color="bg-teal-600" />
        <StatCard title={t('fees_collected')} value={stats?.feesCollected || `${currency} 0`} change="Target" trend="up" icon={Wallet} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Attendance Trends</h3>
              <p className="text-sm text-zinc-500 mt-1">Average student presence over time.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Attendance %</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {attendanceTrendData.length > 0 ? (
                <AreaChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#14b8a6' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={4} fillOpacity={0} />
                </AreaChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
                  <ClipboardCheck className="w-12 h-12 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Attendance Data Recorded</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Fees Collection</h3>
              <p className="text-sm text-zinc-500 mt-1">Status of student fee payments.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setModalType('owing');
                  setShowOwingModal(true);
                }}
                className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-indigo-600 transition-all hover:scale-110"
                title="View Owing Students"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {paymentStatusData.some(d => d.value > 0) ? (
              <div className="w-full h-full flex items-center">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data, index) => {
                          setModalType(index === 0 ? 'paid' : 'owing');
                          setShowOwingModal(true);
                        }}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="hidden sm:block pl-8 space-y-4">
                  <div 
                    className="space-y-1 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 p-2 rounded-xl transition-colors"
                    onClick={() => {
                      setModalType('paid');
                      setShowOwingModal(true);
                    }}
                  >
                    <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Paid Students</p>
                  </div>
                  <div 
                    className="space-y-1 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 p-2 rounded-xl transition-colors"
                    onClick={() => {
                      setModalType('owing');
                      setShowOwingModal(true);
                    }}
                  >
                    <p className="text-2xl font-black text-amber-500">{owingCount}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Owing Students</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center opacity-40">
                <CreditCard className="w-12 h-12 mb-4 text-zinc-300" />
                <p className="text-sm font-medium italic">No fee data recorded for this period.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-8">{t('recent_activities')}</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-6 p-4 bg-white dark:bg-zinc-800/20 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-600/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 bg-indigo-50 text-indigo-600")}>
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {activity.user_name || 'System'}
                        <span className="mx-2 text-zinc-400 font-normal">|</span>
                        <span className="text-zinc-500 font-medium">{activity.action_type || 'Activity'}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        {activity.details || 'System Log'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 bg-zinc-50 dark:bg-zinc-800/10 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                <Bot className="w-10 h-10 text-zinc-200 mx-auto" />
                <p className="text-zinc-400 font-bold italic text-xs">No recent activities recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showOwingModal}
        onClose={() => setShowOwingModal(false)}
        title={modalType === 'owing' ? "Students with Outstanding Balances" : "Students with Fully Paid Fees"}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {modalType === 'owing' ? 'Following is the list of students who have not completed their fee payments.' : 'Following is the list of students who have completed all their fee payments.'}
            </p>
            <button
              onClick={() => {
                const list = students.filter(s => {
                  const sStats = studentStatusMap[s.id];
                  if (!sStats || sStats.invoiced === 0) return false;
                  return modalType === 'owing' ? sStats.paid < sStats.invoiced : sStats.paid >= sStats.invoiced;
                }).map(s => {
                  const sStats = studentStatusMap[s.id];
                  const studentClass = classes.find((c: any) => c.id === s.class_id);
                  return {
                    'Student Name': s.name,
                    'Class': studentClass?.name || s.class_name || 'N/A',
                    'Section': studentClass?.section || s.class_section || '',
                    'Total Invoiced': sStats.invoiced,
                    'Total Paid': sStats.paid,
                    'Balance': (sStats.invoiced || 0) - (sStats.paid || 0)
                  };
                });
                downloadReport(modalType === 'owing' ? 'Owing Students' : 'Paid Students', list);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>

          <DataTable
            title={modalType === 'owing' ? "Owing Students" : "Paid Students"}
            data={students.filter(s => {
              const sStats = studentStatusMap[s.id];
              if (!sStats || sStats.invoiced === 0) return false;
              return modalType === 'owing' ? sStats.paid < sStats.invoiced : sStats.paid >= sStats.invoiced;
            })}
            columns={[
              { header: 'Student Name', accessor: 'name', className: 'font-bold' },
              { 
                header: 'Class', 
                accessor: (s: any) => {
                  const studentClass = classes.find((c: any) => c.id === s.class_id);
                  const className = studentClass?.name || s.class_name || 'N/A';
                  const classSection = studentClass?.section || s.class_section || '';
                  return `${className} ${classSection}`.trim();
                }
              },
              { 
                header: 'Status', 
                accessor: (s: any) => {
                  const sStats = studentStatusMap[s.id];
                  const balance = (sStats.invoiced || 0) - (sStats.paid || 0);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className="text-emerald-600">Paid: {currency} {(sStats.paid || 0).toLocaleString()}</span>
                        {balance > 0 && <span className="text-rose-600 text-right">Balance: {currency} {balance.toLocaleString()}</span>}
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all", balance > 0 ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min(100, ((sStats.paid || 0) / (sStats.invoiced || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              }
            ]}
            autoModal={false}
          />
        </div>
      </Modal>
      
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organization}
          scopedDeptId={null}
          strictDepartmentView={false}
          isReadOnly={false}
          onUpdateOrganization={onUpdateOrganization}
        />
      </div>
    </div>
  );
}

export function HODDashboard({ data, staffList = [], departments = [], organization, user, unreadMessagesCount = 0, onNavigate, onUpdateOrganization }: { data?: any, staffList?: any[], departments?: any[], organization?: any, user?: any, unreadMessagesCount?: number, onNavigate?: (view: string) => void, onUpdateOrganization?: (data: any) => void }) {
  const { t } = useLanguage();
  
  // Use real data or empty defaults
  const staffPerformanceData = data?.performanceHistory || [];
  const departmentMetrics = data?.metrics || [];
  const stats = data?.stats || {
    totalStaff: 0,
    totalStudents: 0,
    avgPerformance: 0,
    pendingTasks: 0
  };

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('department_overview')}</h1>
        <p className="text-zinc-500 mt-1">{data?.departmentName || t('science_dept_mgmt')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_staff')} value={stats.totalStaff.toString()} change="+1" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title={t('total_students')} value={stats.totalStudents.toString()} change="+12" trend="up" icon={GraduationCap} color="bg-indigo-600" />
        <StatCard title={t('avg_performance')} value={`${stats.avgPerformance}${stats.avgPerformance.toString().includes('%') ? '' : '%'}`} change="+2.4%" trend="up" icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title={t('pending_tasks')} value={stats.pendingTasks.toString()} change="-2" trend="up" icon={ClipboardCheck} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Staff Performance Chart */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('staff_performance')}</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                Performance
              </span>
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                Attendance
              </span>
              <span className="flex items-center gap-1 text-zinc-500">
                <div className="w-3 h-3 bg-amber-600 rounded"></div>
                Workload
              </span>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#9ca3af'}}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#9ca3af'}}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [`${value}%`, name === 'performance' ? 'Performance' : name === 'attendance' ? 'Attendance' : 'Workload']}
                />
                <Bar dataKey="performance" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="workload" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Metrics */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Department Metrics</h3>
          <div className="space-y-6">
            {departmentMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-900 dark:text-white">{metric.label}</span>
                  <span className="text-zinc-500">{metric.value}% / {metric.target}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${metric.value}%`,
                      backgroundColor: metric.color,
                      boxShadow: `0 0 10px ${metric.color}40`
                    }}
                  ></div>
                  <div 
                    className="absolute top-0 h-3 w-1 bg-white/50 rounded-full"
                    style={{ left: `${metric.target}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Top Performer</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0 
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.performance > current.performance) ? prev : current).name 
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Performance: {staffPerformanceData.length > 0 
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.performance > current.performance) ? prev : current).performance)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Best Attendance</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0 
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.attendance > current.attendance) ? prev : current).name 
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Attendance: {staffPerformanceData.length > 0 
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.attendance > current.attendance) ? prev : current).attendance)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Workload Balance</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">
                {staffPerformanceData.length > 0 
                  ? staffPerformanceData.reduce((prev: any, current: any) => (prev.workload > current.workload) ? prev : current).name 
                  : '—'}
              </p>
              <p className="text-sm text-zinc-500">
                Avg workload: {staffPerformanceData.length > 0 
                  ? Math.round(staffPerformanceData.reduce((prev: any, current: any) => (prev.workload > current.workload) ? prev : current).workload)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organization}
          scopedDeptId={user?.department_id}
          strictDepartmentView={true}
          isReadOnly={true}
          onUpdateOrganization={onUpdateOrganization}
        />
      </div>
    </div>
  );
}

export function StaffDashboard({ staffData, user, organization, onNavigate, staffList = [], departments = [], unreadMessagesCount = 0, onUpdateOrganization }: { staffData?: any, user?: any, organization?: any, onNavigate?: (view: string) => void, staffList?: any[], departments?: any[], unreadMessagesCount?: number, onUpdateOrganization?: (data: any) => void }) {
  const { t } = useLanguage();
  
  const stats = {
    classes: staffData?.classes?.length || 0,
    students: staffData?.students?.length || 0,
    attendance: staffData?.attendance?.length > 0
      ? `${Math.round((staffData.attendance.filter((a: any) => a.status === 'Present').length / staffData.attendance.length) * 100)}%`
      : '0%',
    lessonNotes: staffData?.lessonNotes?.length || 0
  };

  const upcomingClasses = staffData?.timetable
    ? staffData.timetable
        .filter((t: any) => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const today = days[new Date().getDay()];
          // Case-insensitive comparison and handling potential short forms
          return (t.day_of_week || '').toLowerCase() === today.toLowerCase() || 
                 (t.day_of_week || '').toLowerCase() === today.slice(0, 3).toLowerCase();
        })
        .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('staff_portal')}</h1>
          <p className="text-zinc-500 mt-1">{t('welcome_back')}, {user?.name || user?.username || 'Staff'}</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {organization?.academic_year || '—'}
          </div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            {organization?.current_term || 'Term 1'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title={t('my_classes')} value={stats.classes.toString()} change="0" trend="up" icon={BookOpen} color="bg-indigo-600" />
        <StatCard title={t('total_students')} value={stats.students.toString()} change="0" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title={t('avg_attendance')} value={stats.attendance} change="0" trend="up" icon={ClipboardCheck} color="bg-emerald-600" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Class Attendance Trend</h3>
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="h-[240px]">
            {staffData?.attendanceTrends && staffData.attendanceTrends.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={staffData.attendanceTrends}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} unit="%" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <BarChart className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500 italic">No attendance data available for the last 5 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('upcoming_classes')}</h3>
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? upcomingClasses.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{item.subject_name}</p>
                    <p className="text-xs text-zinc-500">{item.class_name} {item.class_section} {item.room ? `| ${item.room}` : ''}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-indigo-600">{item.start_time?.slice(0, 5)}</span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <Calendar className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500 italic">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <HRModules.Organogram
          staff={staffList}
          departments={departments}
          organization={organization}
          scopedDeptId={user?.department_id}
          strictDepartmentView={true}
          isReadOnly={true}
          onUpdateOrganization={onUpdateOrganization}
        />
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {staffData?.recentActivity && staffData.recentActivity.length > 0 ? (
            staffData.recentActivity.map((activity: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
                <div className={cn(
                  "p-2 rounded-lg",
                  activity.type === 'birthday' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/20" :
                  activity.type === 'leave' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                  activity.type === 'attendance' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20" : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                )}>
                  {activity.type === 'birthday' ? <Gift className="w-4 h-4" /> :
                   activity.type === 'leave' ? <Calendar className="w-4 h-4" /> :
                   activity.type === 'attendance' ? <ClipboardCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(activity.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <Zap className="w-8 h-8 text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-500 italic">No recent activity to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentDashboard({ 
  wards = [], 
  selectedWardId, 
  onWardSelect,
  organization,
  unreadMessagesCount = 0,
  onNavigate
}: { 
  wards?: any[], 
  selectedWardId: string | null, 
  onWardSelect: (id: string) => void,
  organization?: any,
  unreadMessagesCount?: number,
  onNavigate?: (view: string) => void
}) {
  const { currency, t } = useLanguage();
  const selectedWard = wards.find(w => w.id === selectedWardId) || wards[0];

  if (!selectedWard) return null;

  return (
    <div className="space-y-8">
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('parent_portal')}</h1>
          <p className="text-zinc-500 mt-1">{t('monitoring_progress').replace('{name}', selectedWard.name)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 dark:border-zinc-800 pr-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {organization?.academic_year || '—'}
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              {organization?.current_term || 'Term 1'}
            </div>
          </div>
          {wards.length > 1 && (
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">{t('select_ward')}:</span>
              <div className="flex gap-1">
                {wards.map(ward => (
                  <button
                    key={ward.id}
                    onClick={() => onWardSelect(ward.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      selectedWardId === ward.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    {ward.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('attendance')} value={selectedWard.attendance} change="+1%" trend="up" icon={ClipboardCheck} color="bg-emerald-600" />
        <StatCard title={t('avg_grade')} value={selectedWard.avgGrade} change="0" trend="up" icon={TrendingUp} color="bg-indigo-600" />
        <StatCard title={t('fees_paid')} value={`${currency} ${selectedWard.feesPaid}`} change="0" trend="up" icon={Wallet} color="bg-blue-600" />
        <StatCard title={t('notices')} value="3" change="+1" trend="up" icon={Bell} color="bg-amber-600" />
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('academic_performance')}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={selectedWard.performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function FinanceDashboard() {
  const { currency, t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('finance_portal')}</h1>
        <p className="text-zinc-500 mt-1">{t('manage_finance_ops')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_revenue')} value={`${currency} 425,000`} change="+8.2%" trend="up" icon={Wallet} color="bg-emerald-600" />
        <StatCard title={t('pending_fees')} value={`${currency} 12,400`} change="-2.1%" trend="up" icon={CreditCard} color="bg-amber-600" />
        <StatCard title={t('annual_expenses')} value={`${currency} 84,000`} change="+4.5%" trend="down" icon={TrendingUp} color="bg-rose-600" />
        <StatCard title={t('scholarships')} value="45" change="+5" trend="up" icon={GraduationCap} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('revenue_overview')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {[
              { desc: 'Term 2 Tuition - Grade 10', amount: `+${currency} 1,200`, date: 'Today', type: 'income' },
              { desc: 'Electricity Bill - Feb', amount: `-${currency} 850`, date: 'Yesterday', type: 'expense' },
              { desc: 'Stationery Supplies', amount: `-${currency} 320`, date: '2 days ago', type: 'expense' },
              { desc: 'Late Fee Payment', amount: `+${currency} 50`, date: '2 days ago', type: 'income' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.desc}</p>
                  <p className="text-xs text-zinc-500">{tx.date}</p>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                )}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusDriverDashboard() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('transport_portal')}</h1>
        <p className="text-zinc-500 mt-1">{t('route_north_sector')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_students')} value="45" change="0" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title={t('next_stop')} value="Oak Ridge" change="2.4km" trend="up" icon={MapPin} color="bg-amber-600" />
        <StatCard title={t('fuel_level')} value="85%" change="-5%" trend="down" icon={Zap} color="bg-emerald-600" />
        <StatCard title={t('schedule')} value="On Time" change="0" trend="up" icon={Clock} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('morning_route_stops')}</h3>
          <div className="space-y-4">
            {[
              { stop: 'School Gate', time: '07:00 AM', status: 'Completed' },
              { stop: 'Central Park', time: '07:15 AM', status: 'Completed' },
              { stop: 'Oak Ridge', time: '07:30 AM', status: 'Next' },
              { stop: 'Sunset Blvd', time: '07:45 AM', status: 'Pending' },
            ].map((stop, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  stop.status === 'Completed' ? "bg-emerald-500" : stop.status === 'Next' ? "bg-amber-500 animate-pulse" : "bg-zinc-300"
                )}></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{stop.stop}</p>
                  <p className="text-xs text-zinc-500">{stop.time}</p>
                </div>
                <span className="text-xs font-medium text-zinc-400">{stop.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Bus Notifications</h3>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Maintenance Alert</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Oil change due in 200km. Please schedule with the workshop.</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Route Update</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">Road closure on Main St. Use alternate route via 5th Ave.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibrarianDashboard() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('library_management')}</h1>
        <p className="text-zinc-500 mt-1">{t('central_library_overview')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_books')} value="12,450" change="+120" trend="up" icon={Library} color="bg-indigo-600" />
        <StatCard title={t('books_issued')} value="482" change="+12%" trend="up" icon={BookOpen} color="bg-emerald-600" />
        <StatCard title={t('overdue_books')} value="24" change="-5" trend="up" icon={Clock} color="bg-rose-600" />
        <StatCard title={t('active_members')} value="1,840" change="+45" trend="up" icon={Users} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('recent_issues')}</h3>
          <div className="space-y-4">
            {[
              { book: 'The Great Gatsby', user: 'Alice Johnson', date: 'Today', status: 'Issued' },
              { book: 'Advanced Physics', user: 'Bob Smith', date: 'Yesterday', status: 'Returned' },
              { book: 'World History', user: 'Charlie Brown', date: 'Yesterday', status: 'Issued' },
              { book: 'Calculus Vol 1', user: 'David Lee', date: '2 days ago', status: 'Overdue' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.book}</p>
                  <p className="text-xs text-zinc-500">{item.user}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Returned' ? "bg-emerald-50 text-emerald-600" : item.status === 'Overdue' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                )}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">New Acquisitions</h3>
          <div className="space-y-4">
            {[
              { title: 'Machine Learning Basics', author: 'A. Ng', category: 'Technology' },
              { title: 'Modern Architecture', author: 'Z. Hadid', category: 'Arts' },
              { title: 'Economics 101', author: 'P. Krugman', category: 'Social Science' },
            ].map((book, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{book.title}</p>
                  <p className="text-xs text-zinc-500">{book.author} • {book.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HRDashboard() {
  const { t } = useLanguage();
  
  const staffStats = [
    { label: 'Total Staff', value: '128', trend: '+2' },
    { label: 'On Leave', value: '5', trend: '0' },
    { label: 'Attendance', value: '96%', trend: '+1.5%' },
    { label: 'Pending Reviews', value: '12', trend: '+3' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">HR Overview</h1>
        <p className="text-zinc-500 mt-1">Manage staff, payroll, and recruitment.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Staff" value="128" change="+2" trend="up" icon={Users} color="bg-blue-600" />
        <StatCard title="Attendance Rate" value="96%" change="+1.5%" trend="up" icon={ClipboardCheck} color="bg-emerald-600" />
        <StatCard title="Pending Leave" value="5" change="0" trend="up" icon={Calendar} color="bg-amber-600" />
        <StatCard title="Open Positions" value="3" change="+1" trend="up" icon={Briefcase} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Staff Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Teaching Staff', value: 85, color: 'bg-indigo-600' },
              { label: 'Administrative', value: 25, color: 'bg-emerald-600' },
              { label: 'Support Staff', value: 18, color: 'bg-amber-600' },
            ].map((dept) => (
              <div key={dept.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{dept.label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{dept.value}</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                  <div className={cn("h-2 rounded-full", dept.color)} style={{ width: `${(dept.value / 128) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Activities</h3>
          <div className="space-y-6">
            {[
              { user: 'John Doe', action: 'applied for leave', time: '10 mins ago', icon: Calendar, color: 'text-amber-500' },
              { user: 'Admin', action: 'updated payroll for March', time: '1 hour ago', icon: Wallet, color: 'text-emerald-500' },
              { user: 'System', action: 'new applicant for Math Teacher', time: '3 hours ago', icon: UserPlus, color: 'text-blue-500' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={cn("mt-1", activity.color)}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NonStaffDashboard() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('support_staff_portal')}</h1>
        <p className="text-zinc-500 mt-1">{t('welcome_back_schedule')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('assigned_tasks')} value="8" change="+2" trend="up" icon={ClipboardCheck} color="bg-indigo-600" />
        <StatCard title={t('completed')} value="5" change="+1" trend="up" icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title={t('shift_hours')} value="08:00 - 16:00" change="On Time" trend="up" icon={Clock} color="bg-blue-600" />
        <StatCard title={t('notifications')} value="12" change="+3" trend="up" icon={Bell} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t('today_tasks')}</h3>
          <div className="space-y-4">
            {[
              { task: 'Check Inventory - Lab 1', time: '09:00 AM', priority: 'High' },
              { task: 'Setup Conference Room', time: '11:00 AM', priority: 'Medium' },
              { task: 'Deliver Mail to Admin', time: '02:00 PM', priority: 'Low' },
              { task: 'Inspect Playground Equipment', time: '03:30 PM', priority: 'Medium' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{item.task}</p>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase px-2 py-1 rounded-lg",
                  item.priority === 'High' ? "bg-red-50 text-red-600" : item.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>{item.priority}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Staff Announcements</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Monthly Staff Meeting</p>
                <p className="text-xs text-zinc-500 mt-1">Friday, March 6th at 3:00 PM in the Main Hall.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">New Uniform Distribution</p>
                <p className="text-xs text-zinc-500 mt-1">Collect your new uniforms from HR office this week.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentDashboard({ 
  onNavigate, 
  user, 
  students = [], 
  attendance = [], 
  invoices = [],
  timetable = [],
  organization,
  unreadMessagesCount = 0
}: { 
  onNavigate?: (view: string) => void,
  user?: any,
  students?: any[],
  attendance?: any[],
  invoices?: any[],
  timetable?: any[],
  organization?: any,
  unreadMessagesCount?: number
}) {
  const { currency, t } = useLanguage();
  
  const student = students.find(s => s.email === user?.email);
  const studentAttendance = attendance.filter(a => a.student_id === student?.id);
  const attendanceRate = studentAttendance.length > 0
    ? Math.round((studentAttendance.filter(a => a.status === 'Present').length / studentAttendance.length) * 100)
    : 0;

  const outstandingFees = invoices
    .filter(inv => inv.student_id === student?.id && (inv.status === 'Pending' || inv.status === 'Overdue'))
    .reduce((sum, inv) => {
      const amount = parseFloat(inv.amount.toString().replace(/[^\d.]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <MessageAlert count={unreadMessagesCount} onNavigate={onNavigate} />
      {/* Hero Welcome Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
               {(student?.profile_pic || student?.previous_school_profile_pic || user?.profile_pic) ? (
                <img 
                  src={student?.profile_pic || student?.previous_school_profile_pic || user?.profile_pic} 
                  alt={student?.name || user?.name} 
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center rounded-2xl">
                  <User className="w-16 h-16 text-zinc-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-zinc-900 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-0 py-1 bg-transparent rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border-none text-zinc-600 dark:text-zinc-400">
              <Zap className="w-3 h-3 text-amber-500" />
              {t('academic_year')} {organization?.academic_year || '—'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-zinc-900 dark:text-white">
              {t('welcome_back')}, {student?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-xl">
              You're doing great! Your attendance is at <span className="text-indigo-600 dark:text-indigo-400 font-bold">{attendanceRate}%</span> and your profile is <span className="text-indigo-600 dark:text-indigo-400 font-bold">up to date</span>.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <button 
                onClick={() => onNavigate?.('Personal Information')}
                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                {t('view_full_profile')}
              </button>
              <button 
                onClick={() => onNavigate?.('Ask AI')}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                {t('ask_omniai')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('attendance'), value: `${attendanceRate}%`, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: attendanceRate >= 90 ? 'Excellent' : 'Good' },
          { label: t('current_gpa'), value: student?.gpa || '0.0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: 'Academic' },
          { label: t('outstanding_fees'), value: `${currency} ${outstandingFees.toLocaleString()}`, icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', trend: outstandingFees > 0 ? 'Pending' : 'Cleared' },
          { label: t('upcoming_exams'), value: '0', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'View Schedule' },
        ].map((stat, i) => (
          <div key={i} className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight truncate max-w-[120px]">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
              <div className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", stat.bg, stat.color)}>
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          {/* Today's Schedule - Timeline Style */}
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('todays_schedule')}</h3>
                <p className="text-sm text-zinc-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => onNavigate?.('Timetable')}
                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                {t('full_timetable')}
              </button>
            </div>
            
            <div className="space-y-0 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
              {(() => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const today = days[new Date().getDay()];
                

                
                // We need timetable prop here. I'll add it to the component signature in the next step or here.
                // Assuming timetable is passed as part of props.
                
                const mySchedule = timetable?.filter((t: any) => 
                  t.day_of_week === today && String(t.class_id) === String(student?.class_id)
                ).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)) || [];

                if (mySchedule.length === 0) {
                  return (
                    <div className="pl-16 py-4 text-zinc-500 text-sm italic">
                      No classes scheduled for today.
                    </div>
                  );
                }

                return mySchedule.map((item: any, i: number) => {
                  const now = new Date();
                  const [startH, startM] = item.start_time.split(':').map(Number);
                  const [endH, endM] = item.end_time.split(':').map(Number);
                  
                  const start = new Date(); start.setHours(startH, startM, 0);
                  const end = new Date(); end.setHours(endH, endM, 0);
                  
                  let status = 'Upcoming';
                  if (now > end) status = 'Completed';
                  else if (now >= start && now <= end) status = 'Ongoing';
                  
                  return (
                    <div key={i} className="relative pl-16 pb-8 last:pb-0 group">
                      <div className={cn(
                        "absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900 z-10 transition-all group-hover:scale-125",
                        status === 'Completed' ? "bg-emerald-500" : 
                        status === 'Ongoing' ? "bg-indigo-600 animate-ping" : "bg-zinc-200 dark:bg-zinc-700"
                      )}></div>
                      {status === 'Ongoing' && (
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-indigo-600 z-10"></div>
                      )}
                      
                      <div className={cn(
                        "p-5 rounded-3xl border transition-all duration-300",
                        status === 'Ongoing' 
                          ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 shadow-sm" 
                          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{item.start_time} - {item.end_time}</span>
                            </div>
                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{item.subject_name || 'Subject'}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <Building2 className="w-3.5 h-3.5" />
                                {item.room || 'N/A'}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <User className="w-3.5 h-3.5" />
                                {item.teacher_name || 'Instructor'}
                              </div>
                            </div>
                          </div>
                          
                          {status === 'Ongoing' && (
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                              Join Class
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Assignments & Performance Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Assignments</h3>
                <button onClick={() => onNavigate?.('Assignments')} className="text-xs font-bold text-indigo-600">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Calculus Set 4', due: 'Tomorrow', color: 'bg-rose-500' },
                  { title: 'Physics Report', due: 'Mar 10', color: 'bg-amber-500' },
                  { title: 'History Essay', due: 'Mar 12', color: 'bg-indigo-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className={cn("w-2 h-10 rounded-full", item.color)}></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.title}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Due: {item.due}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Attendance Trend</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {[40, 70, 45, 90, 65, 85, 92].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-1000",
                        i === 6 ? "bg-indigo-600" : "bg-zinc-100 dark:bg-zinc-800"
                      )} 
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">This Week</span>
                </div>
                <span className="text-xs font-black text-zinc-900 dark:text-white">92.4% Avg</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {/* Exam Countdown Card */}
          <div className="relative p-8 bg-zinc-900 rounded-[2.5rem] text-white overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Exam Countdown</span>
              </div>
              
              <h3 className="text-2xl font-black mb-2 tracking-tight">Physics Mid-term</h3>
              <p className="text-zinc-400 text-sm mb-8">Review Chapter 4: Thermodynamics and Chapter 5: Electromagnetism.</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { val: '03', unit: 'Days' },
                  { val: '14', unit: 'Hours' },
                  { val: '42', unit: 'Mins' },
                ].map((t, i) => (
                  <div key={i} className="text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xl font-black">{t.val}</p>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t.unit}</p>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => onNavigate?.('Study Materials')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/40 active:scale-95"
              >
                Open Study Guide
              </button>
            </div>
          </div>

          {/* Announcements - Editorial Style */}
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Announcements</h3>
            <div className="space-y-8">
              {[
                { title: 'Sports Day Postponed', date: 'Mar 5', desc: 'Due to heavy rain forecast, the annual sports meet has been moved to next Friday.', category: 'Events' },
                { title: 'New Library Rules', date: 'Mar 1', desc: 'Starting next week, library hours will be extended until 8:00 PM on weekdays.', category: 'Library' },
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-2">{item.title}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate?.('Announcements')}
              className="w-full mt-8 py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              View All News
            </button>
          </div>

          {/* AI Tutor Quick Access */}
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-white tracking-tight">OmniAI Tutor</h4>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Online Now</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              "Hi Daniel! I noticed you're studying Physics. Need help with Thermodynamics equations?"
            </p>
            <div className="flex gap-2">
              <button onClick={() => onNavigate?.('Ask AI')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all">Chat Now</button>
              <button className="p-3 bg-white dark:bg-zinc-900 text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:text-indigo-600 transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function OldPartnerDashboard() {
  const { currency, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchool, setNewSchool] = React.useState({
    name: '', type: 'K-12', email: '', contact_number: '', admin_email: '', admin_password: ''
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { fetchPartnerDashboard } = await import('../lib/api');
      const res = await fetchPartnerDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { partnerCreateSchool } = await import('../lib/api');
      await partnerCreateSchool(newSchool);
      setShowAddModal(false);
      loadDashboard();
      (window as any).showToast?.('School added successfully', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err?.response?.data?.error || 'Failed to add school', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Partner Portal</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-zinc-500">{t('manage_your_referrals_and_provision_schools')}</p>
            {data?.partner?.company_name && (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">{data.partner.company_name}</span>
                <span className="text-[10px] text-zinc-400 font-medium">({data.partner.registration_number})</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Building2 className="w-5 h-5" />
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Earnings" value={`${currency} ${data?.partner?.total_earnings || 0}`} change="+0%" trend="up" icon={Wallet} color="bg-emerald-600" />
        <StatCard title="Referred Schools" value={data?.schools?.length || "0"} change="+1" trend="up" icon={School} color="bg-indigo-600" />
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest mb-2">Referral Code</p>
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-2xl font-black text-indigo-600 tracking-widest">{data?.partner?.referral_code}</span>
            <button onClick={() => {
              navigator.clipboard.writeText(data?.partner?.referral_code || '');
              (window as any).showToast?.('Copied!', 'success');
            }} className="p-2 text-indigo-400 hover:text-indigo-600">
              <ClipboardCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
        <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-8">Referred Schools</h3>
        {data?.schools?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-4">School Name</th>
                  <th className="py-4">Type</th>
                  <th className="py-4">Plan</th>
                  <th className="py-4">Created At</th>
                  <th className="py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.schools.map((school: any) => (
                  <tr key={school.id} className="text-sm border-zinc-100 dark:border-zinc-800">
                    <td className="py-4 font-bold text-zinc-900 dark:text-white">{school.name}</td>
                    <td className="py-4 text-zinc-500">{school.type}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                        {school.plan}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-500">{new Date(school.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Building2 className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 font-medium">You haven't referred any schools yet.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 font-bold hover:underline">Add your first school</button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Provision New School</h2>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">School Name</label>
                <input required type="text" value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Lincoln High" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Type</label>
                  <select value={newSchool.type} onChange={e => setNewSchool({...newSchool, type: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500">
                    <option>K-12</option>
                    <option>Primary</option>
                    <option>Secondary</option>
                    <option>University</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Contact Number</label>
                  <input required type="text" value={newSchool.contact_number} onChange={e => setNewSchool({...newSchool, contact_number: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">School General Email</label>
                <input required type="email" value={newSchool.email} onChange={e => setNewSchool({...newSchool, email: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-4">First Admin Account</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Admin Email</label>
                    <input required type="email" value={newSchool.admin_email} onChange={e => setNewSchool({...newSchool, admin_email: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Admin Password</label>
                    <input required type="password" value={newSchool.admin_password} onChange={e => setNewSchool({...newSchool, admin_password: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">Provision School</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
