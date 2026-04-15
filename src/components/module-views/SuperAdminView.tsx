import React from 'react';
import { DataTable } from '../DataTable';
import { cn } from '../../lib/utils';
import { Trash2, Building2, Mail, Phone, Globe, MapPin, Calendar, CreditCard, Shield, Sparkles } from 'lucide-react';
import { AcademicModules, AdmissionsModules, ExamModules } from './SchoolAdminView';
import { FinanceModules } from './FinanceView';
import { HRModules } from './HRView';
import { OperationsModules } from './OperationsView';
import { AIModules } from './AIView';
import { ELearningModules, StorageModules } from './StaffView';
import { LibraryModules } from './LibrarianView';
import { StudentModules } from './StudentView';

export {
  AcademicModules,
  AdmissionsModules,
  ExamModules,
  FinanceModules,
  HRModules,
  OperationsModules,
  AIModules,
  ELearningModules,
  StorageModules,
  LibraryModules,
  StudentModules
};

export const SuperAdminModules = {
  Organizations: ({ data, onAdd, onEdit, onDelete, onApprove }: { data?: any[]; onAdd?: () => void, onEdit?: (item: any) => void, onDelete?: (item: any) => void, onApprove?: (item: any) => void }) => (
    <DataTable
      title="All Organizations"
      data={data || []}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      detailsMaxWidth="max-w-3xl"
      renderDetails={(item: any) => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Header Card */}
          <div className="relative p-8 rounded-[2.5rem] overflow-hidden group border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />
            <div className="relative flex items-center gap-6 z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden border-4 border-white dark:border-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-500">
                {item.logo ? (
                  <img src={item.logo} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-9 h-9" />
                )}
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-sm flex items-center gap-2 border",
                    item.status === 'Active' ? "bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-800" :
                    item.status === 'Pending' ? "bg-amber-50/80 text-amber-600 border-amber-200/50 dark:bg-amber-900/30 dark:border-amber-800" :
                    "bg-red-50/80 text-red-600 border-red-200/50 dark:bg-red-900/30 dark:border-red-800"
                  )}>
                    <Shield className="w-3 h-3" />
                    {item.status}
                  </span>
                  {item.plan && (
                    <span className="px-4 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-200/50 dark:border-indigo-800 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {item.plan}
                    </span>
                  )}
                  {item.type && (
                    <span className="px-4 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50">
                      {item.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Admin Email', value: item.email, icon: <Mail className="w-3 h-3" /> },
              { label: 'Contact Number', value: item.contact_number, icon: <Phone className="w-3 h-3" /> },
              { label: 'Custom Domain', value: item.custom_domain, icon: <Globe className="w-3 h-3" /> },
              { label: 'Physical Address', value: item.address, icon: <MapPin className="w-3 h-3" /> },
              { label: 'Subscription Plan', value: item.plan, icon: <CreditCard className="w-3 h-3" /> },
              { label: 'Created', value: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined, icon: <Calendar className="w-3 h-3" /> },
            ].filter(f => f.value).map(({ label, value, icon }) => (
              <div key={label} className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-start gap-4 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 shadow-sm">
                <span className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors shrink-0">
                  {icon}
                </span>
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">{label}</p>
                  <p className="font-black text-zinc-900 dark:text-white text-sm break-words">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Request & Expiry info */}
          {(item.demo_requested || item.expiry_date) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.demo_requested && (
                <div className="p-5 rounded-[1.5rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 flex items-center gap-4">
                  <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">Demo Status</p>
                    <p className="font-black text-emerald-600 text-sm">Requested</p>
                  </div>
                </div>
              )}
              {item.expiry_date && (
                <div className="p-5 rounded-[1.5rem] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30 flex items-center gap-4">
                  <span className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 shrink-0">
                    <Calendar className="w-3 h-3" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">Subscription Expiry</p>
                    <p className="font-black text-amber-600 text-sm">{new Date(item.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logo & Signature preview */}
          {(item.logo || item.signature) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.logo && (
                <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">School Logo</p>
                  <div className="flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <img src={item.logo} alt="Logo" className="max-h-20 object-contain" />
                  </div>
                </div>
              )}
              {item.signature && (
                <div className="p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-3">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Principal Signature</p>
                  <div className="flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <img src={item.signature} alt="Signature" className="max-h-20 object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      columns={[
        { header: 'Name', accessor: 'name', className: 'font-bold' },
        { header: 'Plan', accessor: 'plan' },
        {
          header: 'Demo',
          accessor: (item: any) => item.demo_requested ? (
            <span className="text-emerald-500 font-bold text-[10px] uppercase flex items-center gap-1">
              Requested
            </span>
          ) : <span className="text-zinc-400">—</span>
        },
        {
          header: 'Status',
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : 
              item.status === 'Pending' ? "bg-amber-50 text-amber-600" :
              "bg-red-50 text-red-600"
            )}>
              {item.status}
            </span>
          )
        },
      ]}
      extraActions={(item: any) => item.status === 'Pending' && (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onApprove?.(item)}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm font-bold rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            Approve Referral
          </button>
          <button
            onClick={() => onDelete?.(item)}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm font-bold rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            Reject & Delete
          </button>
        </div>
      )}
    />
  ),

  ModuleControl: ({ data, onAdd, onToggle, onDelete }: { data?: any[]; onAdd?: () => void, onToggle?: (mod: any) => void, onDelete?: (mod: any) => void }) => (
    <DataTable
      title="System Module Control"
      onAdd={onAdd}
      data={data || []}
      itemsPerPage={50}
      columns={[
        { header: 'Module Name', accessor: 'name', className: 'font-bold' },
        { header: 'Category', accessor: 'category' },
        {
          header: 'Status',
          accessor: (item: any) => (
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", item.status === 'Enabled' ? "bg-emerald-500" : "bg-zinc-300")} />
              <span className="text-sm">{item.status}</span>
            </div>
          )
        }
      ]}
      onDelete={onDelete}
      extraActions={(item: any) => (
        <button
          onClick={() => onToggle?.(item)}
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2 text-sm font-bold rounded-lg transition-colors",
            item.status === 'Enabled'
              ? "text-red-600 hover:bg-red-50"
              : "text-emerald-600 hover:bg-emerald-50"
          )}
        >
          {item.status === 'Enabled' ? 'Disable' : 'Enable'}
        </button>
      )}
    />
  ),

  Subscriptions: ({ data, onAdd }: { data?: any[]; onAdd?: () => void }) => (
    <DataTable
      title="Organization Subscriptions"
      data={data || []}
      onAdd={onAdd}
      columns={[
        { header: 'Organization', accessor: 'org_name', className: 'font-bold' },
        { header: 'Plan', accessor: 'plan' },
        {
          header: 'Status',
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {item.status}
            </span>
          )
        },
      ]}
    />
  ),

  AuditLogs: ({ data }: { data?: any[] }) => (
    <DataTable
      title="System Audit Logs"
      data={data || []}
      itemsPerPage={20}
      columns={[
        { header: 'User', accessor: 'user_name', className: 'font-bold' },
        { 
          header: 'Role', 
          accessor: (item: any) => (
            <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-bold text-zinc-600 uppercase">
              {item.user_role || 'User'}
            </span>
          ) 
        },
        { header: 'Action', accessor: 'action', className: 'text-primary font-semibold' },
        { header: 'Details', accessor: 'details' },
        { header: 'IP Address', accessor: 'ip_address', className: 'text-xs text-zinc-400' },
        { 
          header: 'Timestamp', 
          accessor: (item: any) => new Date(item.created_at || item.timestamp).toLocaleString(),
          className: 'text-xs whitespace-nowrap'
        },
      ]}
    />
  ),
};
