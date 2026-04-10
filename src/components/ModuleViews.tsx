import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { 
  Zap
} from 'lucide-react';

interface ModuleViewProps {
  title: string;
  icon: any;
  description: string;
  stats?: { label: string; value: string; trend?: string }[];
}

export function GenericModuleView({ title, icon: Icon, description, stats }: ModuleViewProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Icon className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{title}</h1>
          </div>
          <p className="text-zinc-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            {t('export_data')}
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            {t('action')}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</h3>
                {stat.trend && <span className="text-xs text-emerald-500 font-bold">{stat.trend}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
