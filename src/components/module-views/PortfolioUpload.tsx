import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Plus, 
  X, 
  Check, 
  Search,
  User,
  GraduationCap,
  Sparkles,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { fetchStudents, createPortfolioItem } from '../../lib/api';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const PortfolioUpload: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      (window as any).showToast?.("Failed to load students", "error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (!supabase) {
      return (window as any).showToast?.("Supabase storage not configured. Please add environment variables.", "error");
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setFileUrls(prev => [...prev, ...newUrls]);
      (window as any).showToast?.(`Uploaded ${newUrls.length} image(s)!`, "success");
    } catch (error: any) {
      console.error('Upload error:', error);
      (window as any).showToast?.(error.message || "Failed to upload images", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return (window as any).showToast?.("Please select a student", "error");
    if (!title) return (window as any).showToast?.("Please enter a title", "error");

    setLoading(true);
    try {
      // Store URLs as a JSON string or comma-separated list
      const combinedUrls = fileUrls.length > 0 ? JSON.stringify(fileUrls) : '';

      await createPortfolioItem({
        student_id: selectedStudent === 'all' ? null : selectedStudent.id,
        title,
        description,
        file_url: combinedUrls || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop'
      });

      (window as any).showToast?.("Gallery entry published successfully!", "success");
      setTitle('');
      setDescription('');
      setFileUrls([]);
      setSelectedStudent(null);
    } catch (error) {
      (window as any).showToast?.("Failed to upload portfolio item", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.admission_no || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 bg-gradient-to-r from-purple-500 to-indigo-600 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-4 opacity-10">
          <Sparkles className="w-40 h-40" />
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
          <Plus className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">New Gallery Entry</h1>
          <p className="text-white/80">Highlight achievements and moments with photos and notes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Student Selector */}
        <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm h-fit overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Select Student</h3>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                placeholder="Search students..." 
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2 p-4 pt-0 custom-scrollbar">
            {/* Special "All Students" option */}
            <div 
              className={cn(
                "flex items-center p-3 rounded-xl cursor-pointer transition-all border",
                selectedStudent === 'all' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border-transparent'
              )}
              onClick={() => setSelectedStudent('all')}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-purple-200 dark:shadow-none">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate text-zinc-900 dark:text-white">All Students</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">School-Wide Gallery</p>
              </div>
              {selectedStudent === 'all' && (
                <Check className="w-4 h-4 text-purple-600 ml-auto" />
              )}
            </div>

            {filteredStudents.length > 0 ? filteredStudents.map(student => (
              <div 
                key={student.id}
                className={cn(
                  "flex items-center p-3 rounded-xl cursor-pointer transition-all border",
                  selectedStudent?.id === student.id 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border-transparent'
                )}
                onClick={() => setSelectedStudent(student)}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-3 shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate text-zinc-900 dark:text-white">{student.name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{student.class_name} • {student.admission_no}</p>
                </div>
                {selectedStudent?.id === student.id && (
                  <Check className="w-4 h-4 text-purple-600 ml-auto" />
                )}
              </div>
            )) : (
              <p className="text-center py-8 text-sm text-zinc-500 italic">No students found</p>
            )}
          </div>

        </div>

        {/* Upload Form */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Achievement Details</h3>
            <p className="text-xs text-zinc-500 mt-1">Fill in the details for the gallery entry.</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Achievement Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Science Fair Winner, Excellent Math Project..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Description / Feedback</label>
                <textarea 
                  placeholder="Tell the story behind this achievement..." 
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl min-h-[150px] focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Gallery Images</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                <div 
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300",
                    fileUrls.length > 0 ? "border-purple-500/30 p-4" : "border-zinc-200 dark:border-zinc-800 h-40 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {fileUrls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {fileUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group/item shadow-sm">
                          <img src={url} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileUrls(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-1 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                        <Plus className="w-5 h-5 text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Add More</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-sm font-medium text-zinc-500">Uploading to storage...</p>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-purple-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">Click to upload photos</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-0.5">PNG, JPG, WEBP (Multiple allowed)</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading || uploading}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? "Processing..." : "Publish to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioUpload;
