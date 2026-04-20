import React, { useState, useEffect } from 'react';
import {
  Plus,
  Wallet,
  CreditCard,
  Coffee,
  Shirt,
  ShoppingCart,
  FileText,
  GraduationCap,
  TrendingUp,
  History,
  Eye,
  ArrowLeft,
  Award,
  BarChart3,
  PieChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
  Download,
  FileUp,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Star,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { downloadFeeTemplate, parseFeeExcel } from '../../lib/excel';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { cn } from '../../lib/utils';
import { Student, UserRole, Ward } from '../../types';
import { DataTable } from '../DataTable';
import { SearchableSelect, Modal } from '../UI';
import { DocumentBuilder } from '../AdminModules';


export const FinanceModules = {
  FeeStructure: ({ classes, students, data, onSave, onDelete, role, organization }: { classes: any[], students: Student[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, role?: string, organization?: any }) => {
    const { t, currency } = useLanguage();
    const [targetType, setTargetType] = useState<'none' | 'class' | 'students'>('none');

    const renderFeeStructureForm = (item?: any, isViewOnly?: boolean) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('fee_name')}</label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            disabled={isViewOnly}
            placeholder={t('fee_name')}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('amount_label')} ({currency})</label>
            <input
              type="number"
              name="amount"
              defaultValue={item?.amount}
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('frequency')}</label>
            <select
              name="period"
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              defaultValue={item?.period || "Termly"}
            >
              <option value="Monthly">{t('monthly')}</option>
              <option value="Termly">{t('termly')}</option>
              <option value="Yearly">{t('yearly')}</option>
              <option value="One-time">{t('one_time')}</option>
            </select>
          </div>
        </div>

        {isViewOnly && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assigned_classes')}</label>
              <div className="flex flex-wrap gap-2">
                {item?.assigned_classes && item.assigned_classes.length > 0 ? (
                  item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium">
                      {c.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-400 itallic">{t('no_classes_assigned')}</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assigned_students')}</label>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t('students_assigned_count').replace('{count}', (item?.assignment_count || 0).toString())}
              </p>
            </div>
          </div>
        )}

        {!isViewOnly && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-3">{t('instant_assignment')}</label>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('assign_to')}</label>
                <select
                  name="target_type"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">{t('dont_assign_yet')}</option>
                  <option value="class">{t('entire_class')}</option>
                  <option value="students">{t('specific_students')}</option>
                </select>
              </div>

              {targetType === 'class' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class(es)</label>
                  <SearchableSelect
                    name="class_ids"
                    multiple
                    placeholder="Choose Class(es)..."
                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                    disabled={isViewOnly}
                  />
                </div>
              )}

              {targetType === 'students' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Students</label>
                  <select
                    name="student_ids"
                    multiple
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-32 disabled:opacity-50"
                  >
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                  </select>
                  <p className="text-[10px] text-zinc-400">Hold Ctrl/Cmd to select multiple students</p>
                </div>
              )}

              {targetType !== 'none' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                      <input
                        type="text"
                        name="academic_year"
                        defaultValue={organization?.academic_year || ""}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                      <select
                        name="term"
                        defaultValue={organization?.current_term || ""}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Term...</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('due_date')}</label>
                    <input
                      type="date"
                      name="due_date"
                      disabled={isViewOnly}
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <DataTable
        title={t('fees_assignment')}
        data={data || []}
        onSave={onSave}
        onDelete={onDelete}
        renderDetails={(item) => (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {item.period}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('fee_structure')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('amount_label')}</p>
                <p className="text-2xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('assigned_students')}</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.assignment_count || 0}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('assigned_classes')}</label>
                <div className="flex flex-wrap gap-2">
                  {item.assigned_classes && item.assigned_classes.length > 0 ? item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {c.name}
                    </span>
                  )) : <span className="text-xs text-zinc-400 italic">No classes assigned</span>}
                </div>
              </div>
            </div>
          </div>
        )}
        columns={[
          { header: 'Name', accessor: 'name', className: 'font-bold' },
          { 
            header: 'Amount', 
            accessor: (item) => `${currency} ${parseFloat(item.amount).toLocaleString()}` 
          },
          { header: 'Period', accessor: 'period' },
          { 
            header: 'Assigned Classes', 
            accessor: (item) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {item.assigned_classes && Array.isArray(item.assigned_classes) && item.assigned_classes.length > 0 ? (
                  item.assigned_classes.map((c: any) => (
                    <span key={c.id} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {c.name}
                    </span>
                  ))
                ) : '-'}
              </div>
            )
          },
          ...(role === 'STUDENT' ? [] : [{ 
            header: 'Students', 
            accessor: (item: any) => item.assignment_count,
            className: 'text-center'
          }])
        ]}
        onAdd={onSave ? () => setTargetType('none') : undefined}
        renderForm={renderFeeStructureForm}
      />
    );
  },
  ClassFees: ({ classes, feeStructures, onGenerate, organization }: { classes: any[], feeStructures: any[], onGenerate: (data: any) => void, organization?: any }) => {
    const { t, currency } = useLanguage();
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
    const [academicYear, setAcademicYear] = useState(organization?.academic_year || "");
    const [term, setTerm] = useState(organization?.current_term || "");
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    const feeOptions = feeStructures.map(f => ({
      value: f.id,
      label: f.name,
      sublabel: `${currency} ${f.amount}`
    }));

    const classOptions = classes.map(c => ({
      value: c.id,
      label: c.name
    }));

    return (
      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
        <h2 className="text-xl font-bold mb-6">{t('generate_class_fees')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Class(es)</label>
            <SearchableSelect
              name="class_ids"
              options={classOptions}
              multiple={true}
              onValueChange={(val) => setSelectedClassIds(val as string[])}
              placeholder="Choose Class(es)..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fee Types</label>
            <SearchableSelect
              name="fee_structure_id"
              options={feeOptions}
              multiple={true}
              onValueChange={(val) => setSelectedFeeIds(val as string[])}
              placeholder="Choose Fee(s)..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Term...</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            if (selectedFeeIds.length === 0) return;
            onGenerate({ 
              class_ids: selectedClassIds, 
              fee_structure_ids: selectedFeeIds, 
              due_date: dueDate,
              term: term,
              academic_year: academicYear
            });
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
          disabled={selectedFeeIds.length === 0}
        >
          {selectedClassIds.length > 0 
            ? `Generate Invoices for ${selectedClassIds.length} Selected Class(es)`
            : `Generate Invoices using Assigned Classes`}
        </button>
      </div>
    );
  },
  FeeManagement: ({ students, feeStructures, data, invoices, payments, scholarships, onSave, onDelete, onRecordPayment, organization, documentTemplates, onRefreshTemplates }: { students: Student[], feeStructures: any[], data?: any[], invoices?: any[], payments?: any[], scholarships?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRecordPayment?: (data: any) => void, organization?: any, documentTemplates?: any[], onRefreshTemplates?: () => Promise<void> }) => {
    const { t, currency } = useLanguage();
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState<any>(null);
    const [bulkMode, setBulkMode] = useState<'payment' | 'invoice'>('payment');
    const [importPreviewItems, setImportPreviewItems] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const handlePrintInvoice = (invoice: any) => {
      const template = (documentTemplates || [])
        .filter(t => t.type === 'Invoice')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let printHtml = '';

        const isPaid = invoice.status === 'Paid' || invoice.status === 'Full';
        const docTitle = isPaid ? 'RECEIPT' : 'INVOICE';
        const statusLabel = isPaid ? 'PAID IN FULL' : 'PAYMENT DUE';
        const accentGradient = isPaid ? 'linear-gradient(90deg, #10b981, #3b82f6)' : 'linear-gradient(90deg, #f59e0b, #ef4444)';
        const statusBadgeBg = isPaid ? '#dcfce7' : '#fef3c7';
        const statusBadgeColor = isPaid ? '#10b981' : '#b45309';
        const statusBadgeBorder = isPaid ? '#bbf7d0' : '#fde68a';

        if (false && template) {
          const config = template.layout_config || {};
          let body = config.content || '';
          
          const replacements: Record<string, string> = {
            '{{student_name}}': selectedStudent?.name || 'N/A',
            '{{admission_no}}': selectedStudent?.admission_no || 'N/A',
            '{{class_name}}': selectedStudent?.class_name || 'N/A',
            '{{date}}': new Date().toLocaleDateString(),
            '{{due_date}}': invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A',
            '{{total_amount}}': `${currency}${invoice.amount}`,
            '{{outstanding_amount}}': `${currency}${selectedStudent?.outstanding_amount || 0}`,
            '{{school_name}}': organization?.name || 'The School',
            '{{school_address}}': organization?.address || 'School Address',
            '{{school_logo}}': organization?.logo ? `<img src="${organization.logo}" style="max-height: 80px; display: block; margin: 0 auto;" alt="Logo" />` : '',
            '{{principal_signature}}': organization?.signature ? `<img src="${organization.signature}" style="max-height: 50px;" alt="Signature" />` : ''
          };

          Object.entries(replacements).forEach(([key, value]) => {
            body = body.split(key).join(value);
          });

          // Apply page settings
          const pageStyles = `
            @page { margin: ${config.pageSettings?.margin || 20}px; }
            .paper { 
              padding: ${config.pageSettings?.padding || 60}px; 
              line-height: ${config.pageSettings?.lineHeight || 1.6}; 
              font-family: ${config.pageSettings?.fontFamily || 'serif'};
              color: ${config.pageSettings?.textColor || '#18181b'};
            }
          `;

          printHtml = `
            <html>
              <head>
                <title>${docTitle} - ${invoice.id}</title>
                <style>
                  ${pageStyles}
                  ${config.styles || ''}
                </style>
              </head>
              <body class="paper">
                <div class="header">${config.headerText || ''}</div>
                <div class="content">${body}</div>
                <div class="footer">${config.footerText || ''}</div>
              </body>
            </html>
          `;
        } else {
          // Fallback basic invoice
          printHtml = `
            <html>
              <head>
                <title>${docTitle} - ${invoice.id.split('-')[0].toUpperCase()}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                  body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                  .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                  .receipt-container::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: ${accentGradient}; }
                  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                  .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                  .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                  .receipt-title { text-align: right; }
                  .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                  .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                  .status-badge { display: inline-block; padding: 6px 12px; background: ${statusBadgeBg}; color: ${statusBadgeColor}; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid ${statusBadgeBorder}; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                  .info-block label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                  .info-block p { margin: 0; font-size: 15px; font-weight: 600; color: #1e293b; }
                  .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                  .table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; border-radius: 8px 8px 0 0; }
                  .table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
                  .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: #f8fafc; border-radius: 12px; margin-top: 32px; border: 1px solid #e2e8f0; }
                  .amount-row .label { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                  .amount-row .value { font-size: 28px; font-weight: 800; color: ${isPaid ? '#059669' : '#ea580c'}; }
                  .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                  .signature-box { text-align: center; }
                  .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                  .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                  .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
                </style>
              </head>
              <body>
                <div class="receipt-container">
                  <div class="header">
                    <div class="school-info">
                      ${organization?.logo ? `<img src="${organization.logo}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
                      <h2>${organization?.name || 'School Name'}</h2>
                      <p>${organization?.address || 'School Address'}</p>
                    </div>
                    <div class="receipt-title">
                      <h1>${docTitle}</h1>
                      <p>#${invoice.id.split('-')[0].toUpperCase()}</p>
                      <div class="status-badge">${statusLabel}</div>
                    </div>
                  </div>
                  <div class="info-grid">
                    <div class="info-block">
                      <label>Billed To</label>
                      <p>${selectedStudent?.name}</p>
                      <p style="font-size: 13px; color: #64748b; font-weight: 400; margin-top: 2px;">Class: ${selectedStudent?.class_name || 'N/A'}</p>
                    </div>
                    <div class="info-block" style="text-align: right;">
                      <label>${isPaid ? 'Payment Date' : 'Due Date'}</label>
                      <p>${new Date(isPaid ? (invoice.paid_at || new Date()) : invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div class="info-grid" style="margin-top: -12px;">
                    <div class="info-block">
                      <label>Academic Year</label>
                      <p>${invoice.academic_year || organization?.academic_year || 'N/A'}</p>
                    </div>
                    <div class="info-block" style="text-align: right;">
                      <label>Term</label>
                      <p>${invoice.term || organization?.current_term || 'N/A'}</p>
                    </div>
                  </div>
                  <table class="table">
                    <thead><tr><th>Description</th><th style="text-align: right;">Amount</th></tr></thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong style="color: #1e293b;">${invoice.description || 'General School Fee'}</strong>
                        </td>
                        <td style="text-align: right; font-weight: 600;">${currency} ${parseFloat(invoice.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="amount-row">
                    <div class="label">${isPaid ? 'Amount Paid' : 'Total Due'}</div>
                    <div class="value">${currency} ${parseFloat(invoice.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  <div class="footer">
                    <div class="thank-you">${isPaid ? 'Thank you for your payment!' : 'Please pay by the due date. Thank you!'}</div>
                    <div class="signature-box">
                      ${organization?.signature ? `<img src="${organization.signature}" style="max-height: 48px; margin-bottom: 8px;" />` : '<div style="height: 48px;"></div>'}
                      <div class="signature-line"></div>
                      <div class="signature-label">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;
        }

        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.print();
      }
    };

    const renderFeeAssignmentForm = (item?: any) => {
      const studentOptions = students.map(s => ({
        value: s.id,
        label: s.name,
        sublabel: s.class
      }));

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Student</label>
            <SearchableSelect
              name="student_id"
              options={studentOptions}
              defaultValue={item?.id}
              placeholder="Choose Student..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Fee Type</label>
            <select
              name="fee_structure_id"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose Fee...</option>
              {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name} ({currency} {f.amount})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
              <input
                type="text"
                name="academic_year"
                defaultValue={organization?.academic_year || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
              <select
                name="term"
                defaultValue={organization?.current_term || ""}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Term...</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              name="due_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input type="hidden" name="target_type" value="students" />
        </div>
      );
    };

    if (selectedStudent) {
      const studentInvoices = (invoices || []).filter(inv => inv.student_id === selectedStudent.id);
      const studentPayments = (payments || []).filter(p => p.student_id === selectedStudent.id);

      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedStudent(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Summary
          </button>

          <div className="p-4 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2.5rem]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white">{selectedStudent.name}</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedStudent.class_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('outstanding_balance')}</p>
                <h3 className={cn(
                  "text-3xl font-black mt-1",
                  parseFloat(selectedStudent.outstanding_amount) > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {currency} {parseFloat(selectedStudent.outstanding_amount).toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <FileText className="w-4 h-4 text-indigo-600" /> {t('invoices')}
                </h4>
                <div className="space-y-2">
                  {studentInvoices.length > 0 ? studentInvoices.map((inv: any) => (
                    <div key={inv.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{currency} {parseFloat(inv.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{inv.description || "General Fee"} • Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase h-fit",
                          inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {inv.status}
                        </span>
                        {inv.status !== 'Paid' && onRecordPayment && (
                          <button 
                            onClick={() => setPaymentModalData(inv)}
                            className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            {t('pay')}
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintInvoice(inv)}
                          className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {inv.status === 'Paid' || inv.status === 'Full' ? t('print_receipt') : t('print_invoice')}
                        </button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-zinc-400 py-4">No invoices found</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <History className="w-4 h-4 text-emerald-600" /> {t('payment_history')}
                </h4>
                <div className="space-y-2">
                  {studentPayments.length > 0 ? studentPayments.map((p: any) => (
                    <div key={p.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-sm font-bold text-emerald-600">+ {currency} {parseFloat(p.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{p.method} • {p.description || "Payment"} • {new Date(p.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.transaction_id && <span className="text-[10px] text-zinc-400 font-mono">#{p.transaction_id}</span>}
                      </div>
                    </div>
                  )) : <p className="text-sm text-zinc-400 py-4">No payments recorded</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Award className="w-4 h-4 text-amber-500" /> {t('scholarships')}
                </h4>
                <div className="space-y-2">
                  {selectedStudent.total_scholarships > 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex justify-between items-center border border-amber-100 dark:border-amber-900/20">
                      <div>
                        <p className="text-sm font-bold text-amber-600">Active Scholarships</p>
                        <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Total Credit Applied</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">- {currency} {parseFloat(selectedStudent.total_scholarships).toLocaleString()}</span>
                    </div>
                  ) : <p className="text-sm text-zinc-400 py-4">No active scholarships</p>}
                </div>
              </div>
            </div>

            <Modal
              isOpen={!!paymentModalData}
              onClose={() => setPaymentModalData(null)}
              title={t('record_payment')}
            >
              <form className="space-y-4 p-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (onRecordPayment) {
                  onRecordPayment({
                    student_id: selectedStudent?.id,
                    amount: formData.get('amount'),
                    method: formData.get('method'),
                    date: formData.get('date'),
                    transaction_id: formData.get('transaction_id'),
                    description: paymentModalData?.description || 'Fees Payment',
                    academic_year: formData.get('academic_year'),
                    term: formData.get('term')
                  });
                  setPaymentModalData(null);
                }
              }}>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('paying_for')}</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{paymentModalData?.description || t('school_fee')}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t('invoice_amount')}: {currency} {parseFloat(paymentModalData?.amount || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('amount_paying')} ({currency})</label>
                  <input type="number" name="amount" defaultValue={paymentModalData?.amount} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
                  <select name="method" defaultValue="Cash" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                  <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                    <input type="text" name="academic_year" defaultValue={paymentModalData?.academic_year || organization?.academic_year} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                    <input type="text" name="term" defaultValue={paymentModalData?.term || organization?.current_term} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID (Optional)</label>
                  <input type="text" name="transaction_id" placeholder="Optional" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setPaymentModalData(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">{t('cancel')}</button>
                  <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">{t('record_payment')}</button>
                </div>
              </form>
            </Modal>
          </div>
        </div>
      );
    }

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setIsImporting(true);
        const records = await parseFeeExcel(file, bulkMode, students, feeStructures);
        setImportPreviewItems(records);
      } catch (err) {
        (window as any).showToast?.('Failed to parse Excel file.', 'error');
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };

    const confirmBulkOperation = async () => {
      const validRecords = importPreviewItems.filter(r => r.isValid);
      if (validRecords.length === 0) return;

      setIsImporting(true);
      try {
        let successCount = 0;
        for (const record of validRecords) {
          if (bulkMode === 'payment') {
            if (onRecordPayment) {
              await onRecordPayment({
                student_id: record.student_id,
                amount: record.amount,
                method: record.method,
                date: record.date,
                transaction_id: record.transaction_id,
                description: record.description,
                academic_year: organization?.academic_year,
                term: organization?.current_term
              });
              successCount++;
            }
          } else {
            if (onSave) {
              await onSave({
                student_id: record.student_id,
                fee_structure_id: record.fee_structure_id,
                amount: record.amount,
                due_date: record.due_date,
                academic_year: record.academic_year || organization?.academic_year,
                term: record.term || organization?.current_term,
                target_type: 'students'
              });
              successCount++;
            }
          }
        }
        (window as any).showToast?.(`Successfully processed ${successCount} records!`, 'success');
        setImportPreviewItems([]);
        onRefreshTemplates?.(); // Refresh data
      } catch (err) {
        (window as any).showToast?.('Some records failed to process.', 'error');
      } finally {
        setIsImporting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bulk Operations</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Smarter fee management via Excel</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setBulkMode('payment')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  bulkMode === 'payment' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Record Payments
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('invoice')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  bulkMode === 'invoice' ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Bulk Billing
              </button>
            </div>

            <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => downloadFeeTemplate(bulkMode, students, feeStructures)}
                className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 transition-colors"
                title="Download current student list as template"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Template
              </button>
              
              <label className="relative cursor-pointer">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileImport} className="hidden" />
                <div className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none">
                  Upload & Preview
                </div>
              </label>
            </div>
          </div>
        </div>

        <DataTable
          title={t('student_fees_overview')}
          data={data || []}
          onSave={onSave}
          autoViewModal={false}
          columns={[
            { header: 'Student', accessor: 'name', className: 'font-bold' },
            { header: 'Class', accessor: 'class_name' },
            { header: 'Total Invoiced', accessor: (item: any) => `${currency} ${parseFloat(item.total_invoiced || 0).toLocaleString()}` },
            { header: 'Total Paid', accessor: (item: any) => `${currency} ${parseFloat(item.total_paid || 0).toLocaleString()}` },
            { header: 'Scholarships', accessor: (item: any) => `${currency} ${parseFloat(item.total_scholarships || 0).toLocaleString()}` },
            { 
              header: 'Outstanding', 
              accessor: (item: any) => (
                <span className={cn(
                  "font-bold",
                  parseFloat(item.outstanding_amount) > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {currency} {parseFloat(item.outstanding_amount || 0).toLocaleString()}
                </span>
              ) 
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderFeeAssignmentForm}
          extraActions={(item) => (
            <button
              onClick={() => setSelectedStudent(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              {t('view_breakdown')}
            </button>
          )}
        />

        <Modal
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          title={t('record_payment')}
        >
          <form className="space-y-4 p-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (onRecordPayment) {
              onRecordPayment({
                student_id: selectedStudent?.id,
                invoice_id: paymentModalData?.id,
                amount: formData.get('amount'),
                method: formData.get('method'),
                date: formData.get('date'),
                transaction_id: formData.get('transaction_id'),
                description: paymentModalData?.description || 'Fees Payment',
                term: formData.get('term'),
                academic_year: formData.get('academic_year')
              });
              setPaymentModalData(null);
            }
          }}>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Paying For</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{paymentModalData?.description || 'School Fee'}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Invoice Amount: {currency} {parseFloat(paymentModalData?.amount || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount Paying ({currency})</label>
              <input type="number" name="amount" defaultValue={paymentModalData?.amount} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
              <select name="method" defaultValue="Cash" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                <input type="text" name="academic_year" defaultValue={paymentModalData?.academic_year || organization?.academic_year} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                <input type="text" name="term" defaultValue={paymentModalData?.term || organization?.current_term} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID (Optional)</label>
              <input type="text" name="transaction_id" placeholder="Optional" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setPaymentModalData(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">Record Payment</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={importPreviewItems.length > 0}
          onClose={() => setImportPreviewItems([])}
          title={bulkMode === 'payment' ? "Review Payment Upload" : "Review Bulk Billing"}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Verify Records</p>
                <p className="text-[10px] font-bold text-indigo-700/70 dark:text-indigo-400">Total {importPreviewItems.length} records detected. Rows with errors will be skipped.</p>
              </div>
            </div>

            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Student</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">{bulkMode === 'payment' ? 'Amount' : 'Fee Type'}</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Identification</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {importPreviewItems.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-bold">{item.student_name}</td>
                      <td className="px-4 py-3">
                        {bulkMode === 'payment' ? (
                          <span className="text-emerald-600 font-bold">{currency} {item.amount}</span>
                        ) : (
                          <span className="font-bold">{item.fee_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.student_id ? (
                          <span className="text-zinc-600 dark:text-zinc-400">ID: {item.admission_no}</span>
                        ) : (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Unknown Admission No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.isValid ? (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Ready</span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setImportPreviewItems([])}
                className="flex-1 py-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkOperation}
                className="flex-[2] bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                disabled={isImporting || !importPreviewItems.some(s => s.isValid)}
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                Confirm & Process {importPreviewItems.filter(s => s.isValid).length} Records
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  DailyCollections: ({ students, data, onSave, onDelete, organization, documentTemplates, onRefreshTemplates }: { students: Student[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, organization?: any, documentTemplates?: any[], onRefreshTemplates?: () => Promise<void> }) => {
    const { t, currency } = useLanguage();
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const renderCollectionForm = (item?: any) => {
      const studentOptions = students.map(s => ({
        value: s.id,
        label: s.name,
        sublabel: s.class
      }));

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
            <SearchableSelect
              name="student_id"
              options={studentOptions}
              defaultValue={item?.student_id}
              placeholder="Select Student..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={item?.date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Method</label>
              <select
                name="method"
                defaultValue={item?.method || "Cash"}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</label>
              <input
                type="number"
                name="amount"
                defaultValue={item?.amount}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID</label>
              <input
                type="text"
                name="transaction_id"
                defaultValue={item?.transaction_id}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>
      );
    };

    const handlePrint = (receipt: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printHtml = `
            <html>
              <head>
                <title>Receipt - ${receipt.transaction_id || receipt.id.split('-')[0].toUpperCase()}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                  body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
                  .receipt-container { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                  .receipt-container::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #4f46e5, #ec4899); }
                  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                  .school-info h2 { margin: 0 0 4px 0; font-weight: 800; font-size: 24px; color: #1e1b4b; }
                  .school-info p { margin: 0; color: #64748b; font-size: 14px; }
                  .receipt-title { text-align: right; }
                  .receipt-title h1 { margin: 0; font-size: 36px; font-weight: 800; color: #e2e8f0; letter-spacing: 2px; text-transform: uppercase; }
                  .receipt-title p { margin: 8px 0 0 0; font-size: 14px; color: #475569; font-weight: 600; }
                  .status-badge { display: inline-block; padding: 6px 12px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; border: 1px solid #bbf7d0; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                  .info-block label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
                  .info-block p { margin: 0; font-size: 15px; font-weight: 600; color: #1e293b; }
                  .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                  .table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                  .table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }
                  .table tr:last-child td { border-bottom: none; }
                  .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: #f8fafc; border-radius: 12px; margin-top: 32px; border: 1px solid #e2e8f0; }
                  .amount-row .label { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                  .amount-row .value { font-size: 28px; font-weight: 800; color: #4f46e5; }
                  .footer { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
                  .signature-box { text-align: center; }
                  .signature-line { width: 200px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
                  .signature-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                  .thank-you { font-size: 14px; color: #64748b; font-style: italic; }
                </style>
              </head>
              <body>
                <div class="receipt-container">
                  <div class="header">
                    <div class="school-info">
                      ${organization?.logo ? `<img src="${organization.logo}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
                      <h2>${organization?.name || 'School Name'}</h2>
                      <p>${organization?.address || 'School Address'}</p>
                    </div>
                    <div class="receipt-title">
                      <h1>RECEIPT</h1>
                      <p>#${receipt.transaction_id || receipt.id.split('-')[0].toUpperCase()}</p>
                      <div class="status-badge">PAID IN FULL</div>
                    </div>
                  </div>
                  <div class="info-grid">
                    <div class="info-block">
                      <label>Billed To</label>
                      <p>${receipt.student_name}</p>
                      <p style="font-size: 13px; color: #64748b; font-weight: 400; margin-top: 2px;">Class: ${receipt.class_name}</p>
                    </div>
                    <div class="info-block" style="text-align: right;">
                      <label>Payment Date</label>
                      <p>${new Date(receipt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <label style="margin-top: 12px;">Academic Year / Term</label>
                      <p>${receipt.academic_year || organization?.academic_year || 'N/A'} - ${receipt.term || organization?.current_term || 'N/A'}</p>
                      <label style="margin-top: 12px;">Payment Method</label>
                      <p>${receipt.method}</p>
                    </div>
                  </div>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong style="color: #1e293b;">${receipt.description || 'School Fees Payment'}</strong>
                        </td>
                        <td style="text-align: right; font-weight: 600; color: #334155;">${currency} ${parseFloat(receipt.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="amount-row">
                    <div class="label">Total Paid</div>
                    <div class="value">${currency} ${parseFloat(receipt.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                  </div>
                  <div class="footer">
                    <div class="thank-you">Thank you for your payment!</div>
                    <div class="signature-box">
                      ${organization?.signature ? `<img src="${organization.signature}" style="max-height: 48px; margin-bottom: 8px;" />` : '<div style="height: 48px;"></div>'}
                      <div class="signature-line"></div>
                      <div class="signature-label">Authorized Signatory</div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="space-y-6">
        <DataTable
          title={t('daily_collections')}
          data={data || []}
          onSave={onSave}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name || 'Walk-in Collection'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {item.method}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Collection Amount</p>
                  <p className="text-2xl font-black text-emerald-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Status</p>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase">
                    {item.status || 'Received'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Transaction ID</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-black font-mono">#{item.transaction_id || 'N/A'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Reference</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
          onEdit={(item) => {}}
          columns={[
            { header: 'Student', accessor: 'student_name', className: 'font-bold' },
            { header: 'Class', accessor: 'class_name' },
            { header: `Amount (${currency})`, accessor: 'amount' },
            { header: 'Date', accessor: (item: any) => new Date(item.date).toLocaleDateString() },
            { header: 'Method', accessor: 'method' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderCollectionForm}
          extraActions={(item) => (
            <button
              onClick={() => handlePrint(item)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Print Receipt
            </button>
          )}
        />
      </div>
    );
  },
  Inventory: ({ students, data, onSave, onDelete }: { students: Student[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { t, currency } = useLanguage();
    const [viewItem, setViewItem] = useState<any | null>(null);

    const renderUniformForm = (item?: any, isViewOnly?: boolean) => {
      const studentOptions = students.map(s => ({
        value: s.id,
        label: s.name,
        sublabel: s.class
      }));

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                name="item_name"
                defaultValue={item?.item_name}
                readOnly={isViewOnly}
                placeholder="e.g. School Blazer"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category / Size</label>
              <input
                type="text"
                name="size"
                defaultValue={item?.size}
                readOnly={isViewOnly}
                placeholder="e.g. Stationery, M, L"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Available Stock</label>
              <input
                type="number"
                name="stock"
                defaultValue={item?.stock}
                readOnly={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unit Price ({currency})</label>
              <input
                type="number"
                name="price"
                defaultValue={item?.price}
                readOnly={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

        </div>
      );
    };

    return (
      <>
        <DataTable
          title={t('stock')}
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.item_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {item.size || 'Standard'}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('inventory_item')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Available Stock</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.stock} Units</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Unit Price</p>
                  <p className="text-2xl font-black text-indigo-600">{currency}{parseFloat(item.price).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Total Inventory Value</p>
                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 font-serif">
                  {currency}{(parseFloat(item.stock) * parseFloat(item.price)).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          onEdit={() => {}}
          columns={[
            { header: 'Item', accessor: 'item_name', className: 'font-bold' },
            { header: 'Category/Size', accessor: 'size' },
            { header: 'Stock', accessor: 'stock' },
            { header: 'Price', accessor: (item: any) => `${currency} ${item.price}` },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderUniformForm}
        />
      </>
    );
  },
  InventorySales: ({ students, inventoryItems, data, onSave, onDelete, organization }: { students: Student[], inventoryItems: any[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, organization?: any }) => {
    const { t, currency } = useLanguage();
    const renderSaleForm = (item?: any, isViewOnly?: boolean) => {
      const studentOptions = students.map(s => ({
        value: s.id,
        label: s.name,
        sublabel: s.class
      }));

      const inventoryOptions = (inventoryItems || []).map(inv => ({
        value: inv.id,
        label: inv.item_name,
        sublabel: `Stock: ${inv.stock} | Price: ${currency} ${inv.price}`
      }));

      const handleItemSelect = (val: string | string[]) => {
        const selectedId = Array.isArray(val) ? val[0] : val;
        const selectedItem = inventoryItems.find(i => i.id === selectedId);
        if (selectedItem) {
          // Find the form and set hidden fields/inputs
          const form = document.querySelector('form');
          if (form) {
            const itemNameInput = form.querySelector('input[name="item_name"]') as HTMLInputElement;
            const totalPriceInput = form.querySelector('input[name="total_price"]') as HTMLInputElement;
            const quantityInput = form.querySelector('input[name="quantity"]') as HTMLInputElement;
            
            if (itemNameInput) itemNameInput.value = selectedItem.item_name;
            if (totalPriceInput && quantityInput) {
              totalPriceInput.value = (parseFloat(selectedItem.price || 0) * parseInt(quantityInput.value || '1')).toString();
            }
          }
        }
      };

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Item from Inventory</label>
            <SearchableSelect
              name="item_id"
              options={inventoryOptions}
              defaultValue={item?.item_id}
              disabled={isViewOnly}
              placeholder="Start typing item name..."
              onValueChange={handleItemSelect}
            />
          </div>
          
          {/* Hidden input to keep item_name for legacy/reporting if needed, though backend uses item_id now */}
          <input type="hidden" name="item_name" defaultValue={item?.item_name} />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">How many will the person buy?</label>
            <input
              type="number"
              name="quantity"
              defaultValue={item?.quantity || 1}
              readOnly={isViewOnly}
              onChange={(e) => {
                const form = e.target.closest('form');
                const itemIdInput = form?.querySelector('input[name="item_id"]');
                const selectedId = itemIdInput instanceof HTMLInputElement ? itemIdInput.value : '';
                const selectedItem = inventoryItems.find(i => i.id === selectedId);
                if (selectedItem) {
                  const totalPriceInput = form?.querySelector('input[name="total_price"]') as HTMLInputElement;
                  if (totalPriceInput) {
                    totalPriceInput.value = (parseFloat(selectedItem.price || 0) * parseInt(e.target.value || '1')).toString();
                  }
                }
              }}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
          
          <input
            type="hidden"
            name="total_price"
            defaultValue={item?.total_price}
          />

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-3">Buyer Information</label>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assign to Student (Mandatory for Fees)</label>
                <SearchableSelect
                  name="student_id"
                  options={studentOptions}
                  defaultValue={item?.student_id}
                  disabled={isViewOnly}
                  placeholder="Select Student..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Or Walk-in Buyer Name</label>
                <input
                  type="text"
                  name="buyer_name"
                  defaultValue={item?.buyer_name}
                  readOnly={isViewOnly}
                  placeholder="e.g. Parent Name"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    defaultValue={item?.academic_year || organization?.academic_year || ""}
                    readOnly={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                  <select
                    name="term"
                    defaultValue={item?.term || organization?.current_term || ""}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select Term (Optional)</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="add_to_fees"
                  id="sale_add_to_fees"
                  defaultChecked={item?.add_to_fees}
                  disabled={isViewOnly}
                  className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  onChange={(e) => {
                    const form = e.target.closest('form');
                    const studentIdInput = form?.querySelector('input[name="student_id"]');
                    const studentId = studentIdInput instanceof HTMLInputElement ? studentIdInput.value : '';
                    if (e.target.checked && !studentId) {
                      (window as any).showToast?.("Please select a student buyer for 'Pay Later' items", "warning");
                      e.target.checked = false;
                    }
                  }}
                />
                <label htmlFor="sale_add_to_fees" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {isViewOnly 
                    ? (item?.add_to_fees ? "Added to student fees (Pay Later)" : "Paid Immediately") 
                    : "Add to student fees (Pay Later)"}
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <DataTable
          title={t('inventory_sales')}
          data={data || []}
          onSave={onSave}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100 dark:shadow-none">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.item_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Total Sale Value</p>
                  <p className="text-2xl font-black text-amber-600 font-serif">{currency}{parseFloat(item.total_price).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Buyer Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.add_to_fees ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase">Unpaid / Invoiced</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Paid Immediately</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Assigned Buyer</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs font-black">
                    {item.student_name?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{item.student_name || item.buyer_name || 'Walk-in Customer'}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{item.class_name || 'Individual'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          onEdit={() => {}}
          columns={[
            { header: 'Date', accessor: (item: any) => new Date(item.created_at).toLocaleDateString() },
            { header: 'Item', accessor: 'item_name', className: 'font-bold' },
            { header: 'Qty', accessor: 'quantity' },
            { header: 'Total', accessor: (item: any) => `${currency} ${item.total_price}` },
            { header: 'Buyer', accessor: (item: any) => item.student_name || item.buyer_name || 'Walk-in' },
            {
              header: 'Pay Later',
              accessor: (item: any) => item.add_to_fees ?
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">Yes</span> :
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Paid</span>
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderSaleForm}
        />
      </>
    );
  },
  InvoicesPayments: ({ role, students, wards, data, feeStructures, organization, onSave, onDelete }: { role?: UserRole, students?: Student[], wards?: any[], data?: any[], feeStructures?: any[], organization?: any, onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { t, currency } = useLanguage();
    const [selectedWardId, setSelectedWardId] = useState(wards?.[0]?.id || "");
    const filteredData = role === 'PARENT' ? (data || []).filter(d => d.wardId === selectedWardId) : (data || []);

    const handlePrintReceipt = (item: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payment Receipt - ${item.id}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
              <style>
                @page { size: portrait; margin: 0; }
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; background: #fff; }
                .receipt-container { 
                  border: 1px solid #e5e7eb; 
                  padding: 60px; 
                  max-width: 800px; 
                  margin: auto; 
                  position: relative;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  border-radius: 4px;
                }
                .header { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: flex-start; 
                  margin-bottom: 60px; 
                  border-bottom: 4px solid #4f46e5;
                  padding-bottom: 20px;
                }
                .school-logo { 
                  width: 60px; 
                  height: 60px; 
                  background: #4f46e5; 
                  border-radius: 12px; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 900;
                  font-size: 24px;
                }
                .receipt-title { 
                  text-align: right; 
                }
                .receipt-title h1 { 
                  margin: 0; 
                  font-size: 32px; 
                  color: #4f46e5; 
                  font-weight: 900; 
                  letter-spacing: -0.025em;
                  text-transform: uppercase;
                }
                .info-grid { 
                  display: grid; 
                  grid-cols: 2; 
                  gap: 40px; 
                  margin-bottom: 60px;
                  display: flex;
                  justify-content: space-between;
                }
                .info-block label { 
                  display: block; 
                  font-size: 10px; 
                  font-weight: 900; 
                  color: #9ca3af; 
                  text-transform: uppercase; 
                  letter-spacing: 0.1em;
                  margin-bottom: 8px;
                }
                .info-block p { 
                  margin: 0; 
                  font-size: 14px; 
                  font-weight: 700;
                  color: #111827;
                }
                .amount-card { 
                  background: #f9fafb; 
                  padding: 30px; 
                  border-radius: 12px; 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center;
                  margin-bottom: 40px;
                  border: 1px solid #f3f4f6;
                }
                .amount-label { font-weight: 900; font-size: 14px; color: #6b7280; text-transform: uppercase; }
                .amount-value { font-size: 32px; font-weight: 900; color: #111827; }
                .status-stamp {
                  position: absolute;
                  top: 250px;
                  right: 100px;
                  border: 4px solid #10b981;
                  color: #10b981;
                  padding: 10px 40px;
                  font-size: 40px;
                  font-weight: 900;
                  text-transform: uppercase;
                  border-radius: 12px;
                  opacity: 0.2;
                  transform: rotate(-15deg);
                }
                .footer { 
                  margin-top: 80px; 
                  padding-top: 20px;
                  border-top: 1px solid #f3f4f6;
                  text-align: center; 
                  font-size: 12px; 
                  color: #9ca3af; 
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                <div class="status-stamp">PAID</div>
                <div class="header">
                  <div style="display: flex; align-items: center; gap: 20px;">
                    <div class="school-logo">${(organization?.name || 'S')[0]}</div>
                    <div>
                      <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #111827;">${organization?.name || 'School Management System'}</h2>
                      <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Official Payment Receipt</p>
                    </div>
                  </div>
                  <div class="receipt-title">
                    <h1>Receipt</h1>
                    <p style="margin:4px 0 0 0; font-size:12px; color:#6b7280; font-weight:700;">#${item.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div class="info-grid">
                  <div class="info-block">
                    <label>Date Issued</label>
                    <p>${new Date(item.payment_date || item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div class="info-block">
                    <label>Academic Year</label>
                    <p>${item.academic_year || organization?.academic_year || 'N/A'}</p>
                  </div>
                  <div class="info-block">
                    <label>Term</label>
                    <p>${item.term || organization?.current_term || 'N/A'}</p>
                  </div>
                  <div class="info-block" style="text-align: right;">
                    <label>Payment Method</label>
                    <p>${item.payment_method || 'Direct Payment'}</p>
                  </div>
                </div>

                <div style="margin-bottom: 40px;">
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Bill To</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                      <p style="margin: 0; font-size: 18px; font-weight: 900; color: #111827;">${item.student_name}</p>
                      <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 500; color: #6b7280;">${item.student_class || 'General'}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; font-size: 12px; font-weight: 700; color: #6b7280;">Admission No</p>
                      <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 900; color: #111827;">${item.student_admission_no || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #f3f4f6; border-radius: 12px;">
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">For Items</label>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #374151;">${item.invoice_description || 'N/A'}</p>
                </div>

                <div class="amount-card">
                  <span class="amount-label">Total Amount Paid</span>
                  <span class="amount-value">${currency} ${item.amount}</span>
                </div>

                <div class="footer">
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; text-align: left;">
                    <div>
                      <p style="margin: 0; font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Issued By</p>
                      <p style="margin: 8px 0 0 0; font-family: 'Dancing Script', cursive; font-size: 24px; color: #111827;">${organization?.principal_name || 'The Principal'}</p>
                      <div style="width: 200px; border-top: 1px solid #e5e7eb; margin-top: 4px;"></div>
                      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; color: #6b7280;">Principal / Administrator</p>
                    </div>
                    <div style="text-align: right;">
                      <div style="width: 100px; height: 100px; border: 2px double #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f3f4f6; font-weight: 900; font-size: 10px; text-transform: uppercase; transform: rotate(-15deg);">School Stamp</div>
                    </div>
                  </div>
                  <p>Thank you for your timely payment. This receipt is computer-generated and is valid without a physical signature.</p>
                  <p style="margin-top: 8px; font-weight: 700;">${organization?.name || 'School Management System'}</p>
                </div>
              </div>
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

      const renderInvoiceForm = (item?: any, isViewOnly?: boolean) => {
        const [selectedFee, setSelectedFee] = useState<any>(null);
        const [selectedDebt, setSelectedDebt] = useState<any>(null);
        const [selectedStudent, setSelectedStudent] = useState<any>(null);

        useEffect(() => {
          if (item?.student_id) {
            const student = (students || []).find(s => s.id === item.student_id);
            setSelectedStudent(student || null);
          }
        }, [item]);

        const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const student = (students || []).find(s => s.id === e.target.value);
          setSelectedStudent(student || null);
          setSelectedDebt(null);
          setSelectedFee(null);
        };

        const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const val = e.target.value;
          if (val.startsWith('debt_')) {
            const debtId = val.replace('debt_', '');
            const debt = (data || []).find(d => String(d.id) === String(debtId));
            setSelectedDebt(debt || null);
            setSelectedFee(null);
          } else {
            const fee = (feeStructures || []).find(f => f.id === val);
            setSelectedFee(fee || null);
            setSelectedDebt(null);
          }
        };

        const studentPendingDebts = selectedStudent 
          ? (data || []).filter(inv => {
              const studentIdMatch = String(inv.student_id) === String(selectedStudent.id);
              const statusMatch = String(inv.status).toLowerCase().trim() === 'pending';
              return studentIdMatch && statusMatch;
            })
          : [];

        if (isViewOnly && item) {
          const isPaid = item.status === 'Paid' || item.status === 'Completed';
          return (
            <div className="space-y-8 p-4">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-indigo-600 tracking-tight uppercase">
                    {isPaid ? 'Official Receipt' : 'Invoice'}
                  </h1>
                  <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                    ID: {item.id ? item.id.substring(0, 8).toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                  isPaid ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                )}>
                  {item.status}
                </div>
              </div>

              {/* Document Body */}
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{t('billed_to')}</label>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{item.student_name}</p>
                    <p className="text-sm text-zinc-500 font-medium">Class: {item.student_class || 'N/A'}</p>
                    <p className="text-sm text-zinc-500 font-medium">Admission No: {item.student_admission_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">{t('description')}</label>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.invoice_description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Issue Date</label>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Due Date</label>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Payment Method</label>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{item.payment_method || 'N/A'}</p>
                    {item.payment_reference && (
                      <p className="text-xs text-zinc-500 mt-0.5 font-medium">Ref: {item.payment_reference}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Section */}
              <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-sm font-black text-zinc-500 uppercase tracking-wider">Total Amount</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{currency} {item.amount}</span>
              </div>

              {/* Footer / Actions */}
              <div className="flex justify-between items-center pt-4">
                <p className="text-[10px] text-zinc-400 italic">This is an official document of the school.</p>
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(item)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Print Document
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
              <select
                name="student_id"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={item?.student_id || ""}
                onChange={handleStudentChange}
              >
                <option value="">Select Student...</option>
                {(students || []).map(s => <option key={s.id} value={s.id}>{s.name} — {s.class || "No Class"}</option>)}
              </select>
            </div>

            {selectedStudent && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Student Info</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-white mt-0.5">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Class</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-white mt-0.5">{selectedStudent.class || "N/A"}</p>
                  </div>
                  {studentPendingDebts.length > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pending Items</p>
                      <p className="text-sm font-black text-rose-600 mt-0.5">{studentPendingDebts.length} Unpaid</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Paying For</label>
              <select
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleItemChange}
                defaultValue=""
              >
                <option value="">Choose item / specific debt...</option>
                {studentPendingDebts.length > 0 && (
                  <optgroup label="Pending Invoices / Inventory Debts">
                    {studentPendingDebts.map(d => (
                      <option key={d.id} value={`debt_${d.id}`}>
                        {d.invoice_description || 'Unnamed Debt'} — {currency} {d.amount}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Fees Structures">
                  {(feeStructures || []).map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {currency} {f.amount}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Academic Year</label>
                <input
                  type="text"
                  name="academic_year"
                  placeholder="e.g. 2023/2024"
                  defaultValue={item?.academic_year || organization?.academic_year || ""}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Term</label>
                <select
                  name="term"
                  defaultValue={item?.term || organization?.current_term || ""}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Term (Optional)</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
              <input
                type="text"
                name="description"
                placeholder="e.g. Tuition Fee - Term 1"
                defaultValue={item?.invoice_description || selectedDebt?.invoice_description || selectedFee?.name || ""}
                key={`${selectedDebt?.id}-${selectedFee?.id}`}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount ({currency})</label>
                <input
                  type="number"
                  name="amount"
                  defaultValue={selectedDebt?.amount || selectedFee?.amount || item?.amount}
                  key={`amount-${selectedDebt?.id}-${selectedFee?.id}`}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  defaultValue={selectedDebt?.due_date ? new Date(selectedDebt.due_date).toISOString().split('T')[0] : (item?.due_date ? new Date(item.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-4">Payment Recording</label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
                  <select
                    name="payment_method"
                    className="w-full px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    defaultValue="Cash"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reference / ID</label>
                  <input
                    type="text"
                    name="payment_reference"
                    placeholder="Optional"
                    className="w-full px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                <select
                  name="status"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  defaultValue={item?.status || "Paid"}
                >
                  <option value="Pending">Pending / Invoiced Only</option>
                  <option value="Paid">Mark as Paid Immediately</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Hidden field to link to existing debt if selected */}
            <input type="hidden" name="id" value={selectedDebt?.id || item?.id || ""} />
          </div>
        );
      };

    return (
      <div className="space-y-4">
        {role === 'PARENT' && wards && wards.length > 1 && (
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
            <span className="text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Ward:</span>
            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none pr-4"
            >
              {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <DataTable
          title={t('invoices_and_payments')}
          data={filteredData}
          onSave={onSave}
          onDelete={onDelete}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.invoice_description || 'General Invoice'}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                      item.status === 'Paid' || item.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.student_name}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Invoice Amount</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Billing Date</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">{new Date(item.created_at || item.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Item ID</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-black font-mono">#{item.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Transaction ID</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.transaction_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          onEdit={role === 'STUDENT' ? undefined : (item) => {}}
          columns={[
            { header: 'Client/Student', accessor: 'student_name', className: 'font-bold' },
            { header: 'Item / Description', accessor: 'invoice_description' },
            { header: `Amount (${currency})`, accessor: 'amount' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Paid' || item.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                )}>
                  {item.status}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderInvoiceForm}
          extraActions={(item) => (
            (item.status === 'Paid' || item.status === 'Completed') && (
              <button
                onClick={() => handlePrintReceipt(item)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                title="Print Receipt"
              >
                <FileText className="w-4 h-4" />
                Print Receipt
              </button>
            )
          )}
        />
      </div>
    );
  },
  Scholarships: ({ students, scholarshipTypes, data, onSave, onDelete, onSaveType, onDeleteType }: { students: Student[], scholarshipTypes: any[], data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onSaveType?: (data: any) => void, onDeleteType?: (item: any) => void }) => {
    const { t, currency } = useLanguage();
    const renderScholarshipTypeForm = (item?: any) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type Name</label>
          <input
            type="text"
            name="name"
            defaultValue={item?.name}
            placeholder="e.g. Academic Excellence"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Default Amount</label>
          <input
            type="number"
            name="amount"
            defaultValue={item?.amount}
            placeholder="e.g. 1000"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    );

    const renderScholarshipForm = (item?: any) => (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</label>
          <select
            name="student_id"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.student_id || ""}
          >
            <option value="">Select Student...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Scholarship Type</label>
          <select
            name="type_id"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.type_id || ""}
            onChange={(e) => {
              const type = scholarshipTypes.find(t => t.id === e.target.value);
              if (type) {
                const amountInput = e.target.closest('form')?.querySelector('input[name="amount"]') as HTMLInputElement;
                if (amountInput) {
                  amountInput.value = type.amount;
                }
              }
            }}
          >
            <option value="">Select Type...</option>
            {scholarshipTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({currency} {t.amount})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount ({currency})</label>
          <input
            type="number"
            name="amount"
            defaultValue={item?.amount}
            placeholder="Override default amount..."
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
          <select
            name="status"
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.status || "Active"}
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        <DataTable
          title={t('scholarship_types')}
          data={scholarshipTypes || []}
          onSave={onSaveType}
          onDelete={onDeleteType}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scholarship Classification</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Standard Disbursement Amount</p>
                <p className="text-3xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2 italic">Eligibility Criteria / Description</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium"> This scholarship type defines a predefined financial aid package that can be assigned to eligible students during billing cycles.</p>
              </div>
            </div>
          )}
          onEdit={() => {}}
          columns={[
            { header: 'Type Name', accessor: 'name', className: 'font-bold' },
            { header: 'Default Amount', accessor: (item: any) => `${currency} ${item.amount}`, className: 'text-indigo-600 font-bold' },
          ]}
          onAdd={onSaveType ? () => {} : undefined}
          renderForm={renderScholarshipTypeForm}
        />

        <DataTable
          title={t('scholarships_and_financial_aid')}
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                      item.status === 'Active' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {item.status || 'Active'}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.type_name || 'Assigned Aid'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Awarded Amount</p>
                  <p className="text-2xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.amount).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Application Date</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{new Date(item.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Award Status & Notes</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">This student has been granted {item.type_name || 'financial aid'} covering {currency} {parseFloat(item.amount).toLocaleString()} of their billable fees.</p>
              </div>
            </div>
          )}
          onEdit={(item) => {}}
          columns={[
            { header: 'Student', accessor: 'student_name', className: 'font-bold' },
            { header: 'Scholarship Type', accessor: (item: any) => item.type_name || item.type },
            { header: 'Amount', accessor: (item: any) => `${currency} ${item.amount}`, className: 'text-indigo-600 font-bold' },
            {
              header: 'Status',
              accessor: (item: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : 
                  item.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-600"
                )}>
                  {item.status || 'Active'}
                </span>
              )
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={renderScholarshipForm}
        />
      </div>
    );
  },
  ExpensesBudget: ({ data, budgets, organization, onSave, onDelete, onSaveBudget }: { data?: any[], budgets?: any[], organization?: any, onSave?: (data: any) => void, onDelete?: (item: any) => void, onSaveBudget?: (data: any) => void }) => {
    const { t, currency } = useLanguage();
    const categories = ['Salary', 'Utilities', 'Maintenance', 'Supplies', 'Marketing', 'Other'];
    const totalSpent = (data || []).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalBudget = (budgets || []).reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const [isManagingBudget, setIsManagingBudget] = useState(false);

    const getCategorySpent = (cat: string) => 
      (data || []).filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const getCategoryBudget = (cat: string) => 
      (budgets || []).find(b => b.category === cat)?.amount || 0;

    const handlePrintVoucher = (item: any) => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Expenditure Voucher - ${item.id || 'NEW'}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
              <style>
                @page { size: portrait; margin: 0; }
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; background: #fff; }
                .voucher-container { 
                  border: 2px solid #1f2937; 
                  padding: 40px; 
                  max-width: 800px; 
                  margin: auto; 
                  position: relative;
                }
                .header { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  margin-bottom: 40px; 
                  border-bottom: 2px solid #1f2937;
                  padding-bottom: 20px;
                }
                .header h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
                .info-grid { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 30px; 
                  margin-bottom: 40px;
                }
                .info-item { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                .info-item label { display: block; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
                .info-item p { margin: 0; font-size: 14px; font-weight: 700; }
                .amount-box {
                  border: 2px solid #1f2937;
                  padding: 20px;
                  text-align: center;
                  margin-bottom: 40px;
                }
                .amount-box h2 { margin: 0; font-size: 32px; font-weight: 900; }
                .sig-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 20px;
                  margin-top: 60px;
                }
                .sig-item { text-align: center; border-top: 1px solid #1f2937; padding-top: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
                .principal-sig {
                  font-family: 'Dancing Script', cursive;
                  font-size: 20px;
                  color: #1f2937;
                  margin-bottom: -10px;
                }
              </style>
            </head>
            <body>
              <div class="voucher-container">
                <div class="header">
                  <div>
                    <h2 style="margin: 0; font-size: 14px; font-weight: 900;">${organization?.name || 'School Management'}</h2>
                    <h1>Payment Voucher</h1>
                    <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; color: #6b7280;">Voucher No: VO-${(item.id || 'TEMP').substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-size: 14px; font-weight: 900;">Expenditure Authorization</p>
                    <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">Financial Year 2024</p>
                  </div>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <label>Payment Date</label>
                    <p>${new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div class="info-item">
                    <label>Category</label>
                    <p>${item.category}</p>
                  </div>
                  <div class="info-item" style="grid-column: span 2;">
                    <label>Expenditure Description</label>
                    <p>${item.description || 'General School Expense'}</p>
                  </div>
                </div>

                <div class="amount-box">
                  <p style="font-size: 10px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; color: #6b7280;">Amount Authorized</p>
                  <h2>${currency} ${parseFloat(item.amount).toLocaleString()}</h2>
                </div>

                <div style="font-size: 12px; font-style: italic; color: #4b5563; margin-bottom: 40px;">
                  Being payment for the items/services described above as authorized by the school administration.
                </div>

                <div class="sig-grid">
                  <div class="sig-item">Prepared By</div>
                  <div class="sig-item">
                    <div class="principal-sig">${organization?.principal_name || 'Principal'}</div>
                    Authorized By
                  </div>
                  <div class="sig-item">Receiver's Signature</div>
                </div>
              </div>
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('total_budget')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {totalBudget.toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-2 opacity-60">Allocated Funds</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-3xl shadow-lg shadow-rose-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowDownRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('spent_to_date')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {totalSpent.toLocaleString()}</h3>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (totalSpent/totalBudget)*100)}%` }} />
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-4 opacity-80">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t('remaining')}</p>
            </div>
            <h3 className="text-2xl font-black">{currency} {Math.max(0, totalBudget - totalSpent).toLocaleString()}</h3>
            <p className="text-[10px] font-bold mt-2 opacity-60">Available Balance</p>
          </div>

          <div className="p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col justify-center">
            <button 
              onClick={() => setIsManagingBudget(true)}
              className="group w-full h-full p-6 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-900 dark:hover:bg-white text-zinc-900 dark:text-white hover:text-white dark:hover:text-zinc-900 rounded-[1.4rem] transition-all duration-300 flex flex-col items-center justify-center gap-2"
            >
              <div className="p-3 bg-white dark:bg-zinc-900 group-hover:bg-white/20 rounded-2xl shadow-sm transition-colors">
                <Target className="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-sm">{t('manage_budgets')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable
              title={t('recent_expenses')}
              data={data || []}
              onSave={onSave}
              onDelete={onDelete}
              onEdit={(item) => {}}
              columns={[
                { header: 'Date', accessor: (item: any) => new Date(item.date).toLocaleDateString() },
                { header: 'Category', accessor: 'category', className: 'font-bold' },
                { header: 'Description', accessor: 'description' },
                { 
                  header: 'Amount', 
                  accessor: (item: any) => (
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-rose-600">{currency} {parseFloat(item.amount).toLocaleString()}</span>
                      {item.isAuto && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-1 rounded-sm mt-0.5">System Generated</span>
                      )}
                    </div>
                  ) 
                },
              ]}
              onAdd={onSave ? () => {} : undefined}
              renderForm={(item, isViewOnly) => {
                if (isViewOnly && item) {
                  return (
                    <div className="space-y-8 p-4">
                      {/* Expenditure Voucher Header */}
                      <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-6">
                        <div>
                          <h1 className="text-2xl font-black text-rose-600 tracking-tight uppercase">Payment Voucher</h1>
                          <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                            Ref: VO-${item.id ? item.id.substring(0, 8).toUpperCase() : 'TEMP'}
                          </p>
                        </div>
                        <div className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-black uppercase tracking-widest">
                          Authorized
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Expenditure Date</label>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Expense Category</label>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.category}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Description / Purpose</label>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                          "{item.description || 'No description provided'}"
                        </p>
                      </div>

                      <div className="bg-zinc-900 dark:bg-white p-6 rounded-2xl flex justify-between items-center text-white dark:text-zinc-900">
                        <span className="text-sm font-black uppercase tracking-wider opacity-60">Total Amount Payable</span>
                        <span className="text-3xl font-black tracking-tight">{currency} {parseFloat(item.amount).toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] text-zinc-400 italic">This expenditure record is system-tracked and authorized.</p>
                        <button
                          type="button"
                          onClick={() => handlePrintVoucher(item)}
                          className="px-6 py-2 bg-zinc-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Print Voucher
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                      <select
                        name="category"
                        defaultValue={item?.category || 'Other'}
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.filter(c => c !== 'Salary').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('amount_label')} ({currency})</label>
                      <input
                        type="number"
                        name="amount"
                        defaultValue={item?.amount}
                        disabled={isViewOnly}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                      <input
                        type="date"
                        name="date"
                        defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        disabled={isViewOnly}
                        required
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('description')}</label>
                      <textarea
                        name="description"
                        defaultValue={item?.description}
                        disabled={isViewOnly}
                        rows={3}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 dark:shadow-none">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                {t('budget_utilization')}
              </h3>
              <div className="space-y-8">
                {categories.map(cat => {
                  const spent = getCategorySpent(cat);
                  const budget = getCategoryBudget(cat);
                  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                  const isOver = spent > budget && budget > 0;
                  const isCritical = percent > 85;

                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-wider text-zinc-400">{cat}</p>
                          <p className="text-xs font-bold">
                            {currency} {spent.toLocaleString()} <span className="opacity-40">/ {budget.toLocaleString()}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-lg font-black tracking-tighter leading-none",
                            isOver ? "text-rose-400" : isCritical ? "text-amber-400" : "text-white"
                          )}>
                            {Math.round(percent)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 flex justify-end items-center px-1",
                            isOver ? "bg-gradient-to-r from-rose-600 to-rose-400" : 
                            isCritical ? "bg-gradient-to-r from-amber-600 to-amber-400" : 
                            "bg-gradient-to-r from-indigo-600 to-indigo-400"
                          )}
                          style={{ width: `${percent}%` }}
                        >
                           {percent > 20 && <div className="w-1 h-1 bg-white rounded-full opacity-50 shadow-sm" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isManagingBudget && (
          <Modal 
            isOpen={isManagingBudget}
            title={t('manage_budgets')} 
            onClose={() => setIsManagingBudget(false)}
          >
            <div className="space-y-4 p-1">
              {categories.map(cat => (
                <form 
                  key={cat} 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    onSaveBudget?.({ category: cat, amount: formData.get('amount') });
                  }}
                  className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                  <label className="flex-1 text-sm font-bold text-zinc-700 dark:text-zinc-300">{cat}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">{currency}</span>
                    <input 
                      type="number" 
                      name="amount" 
                      defaultValue={getCategoryBudget(cat)}
                      className="w-32 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      type="submit"
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  },
  FinancialReports: ({ invoices, payments, expenses, budgets }: { invoices?: any[], payments?: any[], expenses?: any[], budgets?: any[] }) => {
    const { t, currency } = useLanguage();
    const totalPayments = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalInvoiced = (invoices || []).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netPosition = totalPayments - totalExpenses;
    const collectionRate = totalInvoiced > 0 ? (totalPayments / totalInvoiced) * 100 : 0;

    // Monthly Data Aggregation
    const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    const monthlyData = last6Months.map((month, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('default', { month: 'short' });
      const mNum = d.getMonth();
      const yNum = d.getFullYear();

      const mPayments = (payments || []).filter(p => {
        const pd = new Date(p.date || p.created_at);
        return pd.getMonth() === mNum && pd.getFullYear() === yNum;
      }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const mExpenses = (expenses || []).filter(e => {
        const ed = new Date(e.date || e.created_at);
        return ed.getMonth() === mNum && ed.getFullYear() === yNum;
      }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      return { name: mLabel, income: mPayments, expenses: mExpenses };
    }).reverse();

    const expenseByCategory = (expenses || []).reduce((acc: any, curr: any) => {
      acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount || 0);
      return acc;
    }, {});

    const pieData = Object.keys(expenseByCategory).map(cat => ({
      name: cat,
      value: expenseByCategory[cat]
    }));

    // Student Payment Status Data
    const studentStatusMap: Record<string, { invoiced: number, paid: number }> = {};
    (invoices || []).forEach(inv => {
      if (!studentStatusMap[inv.student_id]) studentStatusMap[inv.student_id] = { invoiced: 0, paid: 0 };
      studentStatusMap[inv.student_id].invoiced += parseFloat(inv.amount || 0);
    });
    (payments || []).forEach(pay => {
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

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const PAYMENT_COLORS = ['#10b981', '#f59e0b'];

    const downloadCSV = (title: string, data: any[]) => {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleDownload = (type: string) => {
      let reportData: any[] = [];
      let title = "";

      if (type === 'income') {
        title = "Income Statement";
        reportData = (payments || []).map(p => ({
          Date: new Date(p.date || p.created_at).toLocaleDateString(),
          Student: p.student_name || 'N/A',
          Amount: p.amount,
          Method: p.method,
          Reference: p.transaction_id
        }));
      } else if (type === 'balance') {
        title = "Balance Sheet Summary";
        reportData = [
          { Item: 'Total Revenue', Amount: totalPayments },
          { Item: 'Total Expenses', Amount: totalExpenses },
          { Item: 'Net Position', Amount: netPosition },
          { Item: 'Invoiced Amount', Amount: totalInvoiced },
          { Item: 'Collection Rate', Amount: `${Math.round(collectionRate)}%` }
        ];
      } else if (type === 'variance') {
        title = "Budget Variance Report";
        reportData = (budgets || []).map(b => {
          const spent = (expenses || []).filter(e => e.category === b.category).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          return {
            Category: b.category,
            Budget: b.amount,
            Actual: spent,
            Variance: b.amount - spent,
            Utilization: `${Math.round((spent / b.amount) * 100)}%`
          };
        });
      }

      if (reportData.length > 0) {
        downloadCSV(title, reportData);
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('total_revenue')}</p>
            <h3 className="text-2xl font-black text-emerald-600">{currency} {totalPayments.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">From {payments?.length || 0} Transactions</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('total_expenses')}</p>
            <h3 className="text-2xl font-black text-rose-600">{currency} {totalExpenses.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">{expenses?.length || 0} Records Found</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('net_position')}</p>
            <h3 className={cn(
              "text-2xl font-black",
              netPosition >= 0 ? "text-indigo-600" : "text-rose-600"
            )}>
              {currency} {netPosition.toLocaleString()}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-widest">{netPosition >= 0 ? 'Surplus' : 'Deficit'} Balance</p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('collection_rate')}</p>
            <h3 className="text-2xl font-black text-amber-500">{Math.round(collectionRate)}%</h3>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('income_vs_expenses')}
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('expense_distribution')}
              <PieChart className="w-5 h-5 text-rose-600" />
            </h3>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 flex items-center justify-between">
              {t('fee_collection_status')}
              <Users className="w-5 h-5 text-emerald-600" />
            </h3>
            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </RePieChart>
              </ResponsiveContainer>
              <div className="hidden sm:block pl-8 space-y-4">
                <div className="space-y-1">
                  <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Students Paid</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black text-amber-500">{owingCount}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Students Owing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              {t('downloadable_reports')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <button 
                onClick={() => handleDownload('income')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Income Statement</h4>
                    <p className="text-xs text-zinc-500">Detailed P&L for the current period.</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
              <button 
                onClick={() => handleDownload('balance')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Balance Sheet</h4>
                    <p className="text-xs text-zinc-500">Assets vs Liabilities overview.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
              <button 
                onClick={() => handleDownload('variance')}
                className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold mb-1">Budget Variance</h4>
                    <p className="text-xs text-zinc-500">Analysis of budget vs actual spend.</p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
