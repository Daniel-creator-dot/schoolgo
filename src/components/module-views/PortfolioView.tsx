import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  FileText, 
  ExternalLink, 
  Clock, 
  User, 
  Award,
  Grid,
  List as ListIcon,
  Trash2,
  Filter
} from "lucide-react";
import { fetchPortfolioItems, deletePortfolioItem } from '../../lib/api';
import { cn } from '../../lib/utils';

const PortfolioView: React.FC<{ role: string }> = ({ role }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const data = await fetchPortfolioItems();
      setItems(data);
    } catch (error) {
      (window as any).showToast?.("Failed to load portfolio items", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      await deletePortfolioItem(id);
      (window as any).showToast?.("Item deleted", "success");
      loadPortfolio();
    } catch (error) {
      (window as any).showToast?.("Failed to delete item", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-zinc-500">Loading amazing achievements...</div>;
  }

  return (
    <div className="space-y-6 p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Student Progress Portfolio</h1>
          <p className="text-zinc-500 mt-1">A visual journey of academic and extra-curricular growth</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button 
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-white dark:bg-zinc-700 shadow-sm text-purple-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-purple-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            )}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-zinc-300" />
          </div>
          <h3 className="text-xl font-bold text-zinc-600 dark:text-zinc-400">No portfolio items yet</h3>
          <p className="text-zinc-400 max-w-xs text-center mt-2">Teachers will upload photos and documents of student work here.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
          {items.map((item) => (
            <div key={item.id} className={cn(
              "group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex",
              viewMode === 'grid' ? 'flex-col' : 'flex-row h-48'
            )}>
              <div className={cn(
                "relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0",
                viewMode === 'grid' ? 'aspect-video w-full' : 'w-72 h-full'
              )}>
                {item.file_url ? (
                  <img 
                    src={item.file_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <FileText className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex gap-2 w-full">
                    <button 
                      className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold hover:bg-white/40 transition-all flex items-center justify-center gap-2"
                      onClick={() => window.open(item.file_url, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Full
                    </button>
                    {(role === 'SCHOOL_ADMIN' || role === 'STAFF') && (
                      <button 
                        className="p-2 bg-rose-500/80 backdrop-blur-md text-white rounded-xl hover:bg-rose-600 transition-all"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[10px] font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-800">
                    {item.student_name}
                  </span>
                  <div className="flex items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white line-clamp-1 mb-2 group-hover:text-purple-600 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">
                  {item.description || "No description provided."}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800 mt-auto">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-2 border border-zinc-200 dark:border-zinc-700">
                      <User className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Uploaded by</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.teacher_name || "School Admin"}</span>
                    </div>
                  </div>
                  <Award className="w-5 h-5 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioView;
