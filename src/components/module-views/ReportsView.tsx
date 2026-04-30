import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  BarChart2,
  PieChart,
  Activity
} from "lucide-react";
import { fetchDetailedAttendanceReport, fetchDetailedFinanceReport } from '../../lib/api';
import { DataTable } from '../DataTable';
import { cn } from '../../lib/utils';

interface ReportsViewProps {
  initialType?: 'attendance' | 'finance';
}

const ReportsView: React.FC<ReportsViewProps> = ({ initialType }) => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'attendance' | 'finance' | 'student' | null>(initialType || null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);

  const generateReport = async (type: 'attendance' | 'finance') => {
    setLoading(true);
    setReportType(type);
    try {
      let data;
      if (type === 'attendance') {
        data = await fetchDetailedAttendanceReport(startDate, endDate);
        setReportData(data);
      } else if (type === 'finance') {
        data = await fetchDetailedFinanceReport(startDate, endDate);
        setReportData(data.income); // Default to income for preview
      }
      (window as any).showToast?.(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated`, 'success');
    } catch (error) {
      (window as any).showToast?.("Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate report if initialType is provided
  React.useEffect(() => {
    if (initialType) {
      generateReport(initialType);
    }
  }, [initialType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6 pb-20 max-w-7xl mx-auto">
      {/* Header section with glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 dark:border-zinc-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Reports Central</h1>
          <p className="text-zinc-500 mt-1 text-lg">One-click enterprise reporting and analytics</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button 
            className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-full font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        {/* Quick Report Cards */}
        <div 
          className="cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 group overflow-hidden relative" 
          onClick={() => generateReport('attendance')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center text-blue-700 dark:text-blue-400 font-bold mb-2">
              <Users className="w-5 h-5 mr-2" /> Attendance
            </div>
            <p className="text-sm text-zinc-500">Term-wide staff/student attendance tracking</p>
          </div>
        </div>

        <div 
          className="cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 group overflow-hidden relative" 
          onClick={() => generateReport('finance')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-16 h-16 text-green-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center text-green-700 dark:text-green-400 font-bold mb-2">
              <DollarSign className="w-5 h-5 mr-2" /> Finance Audit
            </div>
            <p className="text-sm text-zinc-500">Comprehensive income vs expense breakdown</p>
          </div>
        </div>

        <div className="cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16 text-purple-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center text-purple-700 dark:text-purple-400 font-bold mb-2">
              <TrendingUp className="w-5 h-5 mr-2" /> Academic Perf.
            </div>
            <p className="text-sm text-zinc-500">Aggregated grade trends and results</p>
          </div>
        </div>

        <div className="cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="w-16 h-16 text-orange-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center text-orange-700 dark:text-orange-400 font-bold mb-2">
              <Activity className="w-5 h-5 mr-2" /> HR Analytics
            </div>
            <p className="text-sm text-zinc-500">Staff performance and workload reports</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="no-print bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4">
          <h3 className="text-white font-bold flex items-center">
            <Filter className="w-4 h-4 mr-2" /> Report Configuration
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Filter By Class/Dept</label>
              <select className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white">
                <option>All Sections</option>
                <option>Science Dept</option>
                <option>Maths Dept</option>
              </select>
            </div>
            <button 
              className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl h-10 hover:opacity-90 transition-all shadow-md active:scale-[0.98]" 
              onClick={() => generateReport(reportType === 'finance' ? 'finance' : 'attendance')}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Preview */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden min-h-[600px] print:shadow-none print:border-none">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {reportType === 'attendance' ? 'Detailed Attendance Audit' : 
                 reportType === 'finance' ? 'Financial Performance Statement' : 
                 'Select a Report to Generate'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-bold uppercase tracking-widest">
                Data scope: {startDate} to {endDate}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                Live Data
              </div>
            </div>
          </div>
        </div>
        <div className="p-0">
          {reportData.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {reportType === 'attendance' && (
                <DataTable<any>
                  data={reportData}
                  columns={[
                    { accessor: 'staff_name', header: 'Staff Name' },
                    { accessor: 'department_name', header: 'Department' },
                    { accessor: 'present_days', header: 'Present' },
                    { accessor: 'absent_days', header: 'Absent' },
                    { accessor: 'leave_days', header: 'On Leave' },
                    { 
                      header: 'Attendance %',
                      accessor: (row) => (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                parseFloat(row.present_days) / parseFloat(row.total_days) > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'
                              )} 
                              style={{ width: `${(parseFloat(row.present_days) / parseFloat(row.total_days)) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                            {Math.round((parseFloat(row.present_days) / parseFloat(row.total_days)) * 100)}%
                          </span>
                        </div>
                      )
                    },
                  ]}
                  title="Attendance Analysis"
                />
              )}
              {reportType === 'finance' && (
                <DataTable<any>
                  data={reportData}
                  columns={[
                    { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
                    { header: 'Student/Entity', accessor: 'student_name' },
                    { header: 'Payment Method', accessor: 'method' },
                    { header: 'Reference', accessor: 'transaction_id' },
                    { 
                      header: 'Amount',
                      accessor: (row) => <span className="font-bold text-emerald-600">+ ${parseFloat(row.amount).toLocaleString()}</span> 
                    },
                  ]}
                  title="Income Statement"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-zinc-400">
              <BarChart2 className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">Select a report type above to preview data</p>
              <p className="text-sm opacity-60">Complete audit logs will be generated in real-time</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
          .Card { border: none !important; box-shadow: none !important; }
          @page { margin: 1cm; }
        }
      `}} />
    </div>
  );
};

export default ReportsView;
