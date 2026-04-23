import React from 'react';
import { DataTable } from '../DataTable';
import { cn } from '../../lib/utils';
import { Trash2, Building2, Mail, Phone, Globe, MapPin, Calendar, CreditCard, Shield, Sparkles, MessageSquare, Settings, Save, AlertCircle } from 'lucide-react';
import { Modal } from '../UI';
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
  Organizations: ({ data, onAdd, onEdit, onDelete, onApprove, onDistributeSMS }: { data?: any[]; onAdd?: () => void, onEdit?: (item: any) => void, onDelete?: (item: any) => void, onApprove?: (item: any) => void, onDistributeSMS?: (orgId: string, amount: number, price: number) => Promise<void> }) => {
    const [smsModalItem, setSmsModalItem] = React.useState<any>(null);
    const [distributing, setDistributing] = React.useState(false);

    return (
      <>
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
          extraActions={(item: any) => (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSmsModalItem(item)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-bold rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Manage SMS
              </button>
              {item.status === 'Pending' && (
                <>
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
                </>
              )}
            </div>
          )}
        />

        <Modal
          isOpen={!!smsModalItem}
          onClose={() => !distributing && setSmsModalItem(null)}
          title={`SMS Management - ${smsModalItem?.name}`}
        >
          <form className="p-6 space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const amount = parseInt(formData.get('amount') as string);
            const price = parseFloat(formData.get('price') as string);

            if (onDistributeSMS && smsModalItem) {
              setDistributing(true);
              try {
                await onDistributeSMS(smsModalItem.id, amount, price);
                setSmsModalItem(null);
              } finally {
                setDistributing(false);
              }
            }
          }}>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Available Credits</p>
                <p className="text-xl font-black text-indigo-600">{smsModalItem?.sms_balance || 0} SMS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Credits to Add</label>
                <input
                  type="number"
                  name="amount"
                  defaultValue="1000"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Unit Price (per SMS)</span>
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">GHS Base</span>
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.0001"
                  defaultValue={smsModalItem?.sms_unit_price || "0.1000"}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setSmsModalItem(null)}
                className="flex-1 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                disabled={distributing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                disabled={distributing}
              >
                {distributing ? "Processing..." : "Confirm Distribution"}
              </button>
            </div>
          </form>
        </Modal>
      </>
    )
  },

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

  SMSSettings: ({ config, onSave }: { config: any, onSave: (data: any) => Promise<void> }) => {
    const [saving, setSaving] = React.useState(false);

    return (
      <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-top-4">
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Custom SMS API Gateway</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Configure your own SMS provider endpoint</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setSaving(true);
            try {
              await onSave({
                custom_url: formData.get('custom_url'),
                api_key: formData.get('api_key'),
                sender_id: formData.get('sender_id')
              });
            } finally {
              setSaving(false);
            }
          }}>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">API Gateway URL (Custom URL)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="url"
                    name="custom_url"
                    placeholder="https://api.provider.com/v1/sms"
                    defaultValue={config?.custom_url}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-400 italic font-bold">The full URL of your SMS API endpoint.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">API Key / Authentication Token</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    name="api_key"
                    placeholder="••••••••••••••••"
                    defaultValue={config?.api_key}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Default Sender ID</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    name="sender_id"
                    placeholder="SCH-ADMIN"
                    defaultValue={config?.sender_id}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none flex items-center gap-2"
                disabled={saving}
              >
                {saving ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl flex gap-4">
          <div className="p-2 h-fit rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Custom Gateway Security</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">Ensure your custom API endpoint supports secure HTTPS requests. Any SMS sent from the platform will be routed through this URL using the provided credentials.</p>
          </div>
        </div>
      </div>
    );
  }
};
