import React from 'react';
import { DataTable } from '../DataTable';
import { cn } from '../../lib/utils';
import { Trash2 } from 'lucide-react';
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
