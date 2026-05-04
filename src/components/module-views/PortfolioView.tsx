import React, { useState, useEffect, useCallback } from 'react';
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
  Filter,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { fetchPortfolioItems, deletePortfolioItem } from '../../lib/api';
import { cn } from '../../lib/utils';

const PortfolioView: React.FC<{ role: string }> = ({ role }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Slideshow State
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, []);

  // Handle auto-play
  useEffect(() => {
    let interval: any;
    if (slideshowActive && isAutoPlaying && items.length > 1) {
      interval = setInterval(() => {
        handleNextSlide();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [slideshowActive, isAutoPlaying, currentSlide, items.length]);

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

  const getFlattenedItems = () => {
    return items.flatMap(item => {
      try {
        if (item.file_url?.startsWith('[')) {
          const urls = JSON.parse(item.file_url);
          if (Array.isArray(urls)) {
            return urls.map((url, idx) => ({ ...item, file_url: url, subIndex: idx, totalInGroup: urls.length }));
          }
        }
      } catch (e) {}
      return [{ ...item, subIndex: 0, totalInGroup: 1 }];
    });
  };

  const flattenedItems = getFlattenedItems();

  const handleNextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % flattenedItems.length);
  }, [flattenedItems.length]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + flattenedItems.length) % flattenedItems.length);
  }, [flattenedItems.length]);

  const startSlideshow = (indexInItems = 0) => {
    // Find the first occurrence of this item in the flattened list
    const itemToFind = items[indexInItems];
    const flatIndex = flattenedItems.findIndex(f => f.id === itemToFind.id);
    setCurrentSlide(flatIndex >= 0 ? flatIndex : 0);
    setSlideshowActive(true);
    setIsAutoPlaying(true);
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-zinc-500">Loading amazing achievements...</div>;
  }

  const currentItem = flattenedItems[currentSlide];

  return (
    <div className="space-y-6 p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">School Gallery</h1>
          <p className="text-zinc-500 mt-1">A visual showcase of achievements, moments and school-wide pride</p>
        </div>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <button 
              onClick={() => startSlideshow(0)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 transition-all font-bold text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Slideshow
            </button>
          )}
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
          {items.map((item, index) => (
            <div key={item.id} className={cn(
              "group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex",
              viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row md:h-48'
            )}>
              <div className={cn(
                "relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0",
                viewMode === 'grid' ? 'aspect-video w-full' : 'aspect-video w-full md:w-72 md:h-full'
              )}>

                {(() => {
                  let displayUrl = item.file_url;
                  let isArray = false;
                  let count = 0;
                  
                  try {
                    if (item.file_url?.startsWith('[')) {
                      const urls = JSON.parse(item.file_url);
                      if (Array.isArray(urls)) {
                        displayUrl = urls[0];
                        isArray = true;
                        count = urls.length;
                      }
                    }
                  } catch (e) {}

                  return (
                    <>
                      {displayUrl ? (
                        <img 
                          src={displayUrl} 
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
                      
                      {isArray && count > 1 && (
                        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-white/20 flex items-center gap-1.5 z-10 shadow-lg">
                          <ImageIcon className="w-3 h-3" />
                          {count} PHOTOS
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex gap-2 w-full">
                    <button 
                      className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold hover:bg-white/40 transition-all flex items-center justify-center gap-2"
                      onClick={() => startSlideshow(index)}
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> View Full
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
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    item.student_name 
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800"
                      : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-800"
                  )}>
                    {item.student_name || 'School Wide'}
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

      {/* Slideshow Modal */}
      {slideshowActive && flattenedItems.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
            <button 
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              {isAutoPlaying ? <PauseIcon className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setSlideshowActive(false)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <button 
            onClick={handlePrevSlide}
            className="absolute left-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="w-full h-full flex items-center justify-center p-12">
            <div className="relative max-w-5xl w-full max-h-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
              <img 
                src={currentItem?.file_url} 
                alt={currentItem?.title} 
                className="w-full h-full object-contain animate-in zoom-in-95 duration-500"
              />
              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {currentItem?.student_name || 'School Wide'}
                  </span>
                  {currentItem?.totalInGroup > 1 && (
                    <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Photo {currentItem.subIndex + 1} of {currentItem.totalInGroup}
                    </span>
                  )}
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {new Date(currentItem?.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white">{currentItem?.title}</h2>
                <p className="text-white/70 mt-2 line-clamp-2 max-w-3xl">{currentItem?.description}</p>
                <div className="mt-4 flex items-center text-white/50 text-[10px] font-bold uppercase tracking-widest gap-2">
                   <span>Slide {currentSlide + 1} of {flattenedItems.length}</span>
                   <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-500" 
                        style={{ width: `${((currentSlide + 1) / flattenedItems.length) * 100}%` }}
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleNextSlide}
            className="absolute right-6 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
};

const PauseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export default PortfolioView;
