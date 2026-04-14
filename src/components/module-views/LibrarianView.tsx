import React, { useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { fetchBookContent } from '../../lib/api';
import { 
  Plus, 
  X, 
  Search, 
  Download, 
  FileText, 
  BookOpen, 
  History, 
  Globe,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole, Book, BorrowRecord, Student } from '../../types';
import { DataTable } from '../DataTable';
import { downloadLibraryTemplate, parseLibraryExcel } from '../../lib/excel';

export const LibraryModules = {
  BookManagement: ({ data, onSave, onDelete }: { data: Book[], onSave: (data: any) => void, onDelete: (item: any) => void }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState<any>(null);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const handleEdit = (book: Book) => {
      setEditingBook(book);
      setShowModal(true);
    };

    const handleAdd = () => {
      setEditingBook(null);
      setShowModal(true);
    };

    const handleDownloadTemplate = () => {
      downloadLibraryTemplate();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const parsed = await parseLibraryExcel(file);
        setPreviewData(parsed);
      } catch (err: any) {
        (window as any).showToast?.('Failed to parse Library Excel.', 'error');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };

    const confirmImport = async () => {
      if (!previewData || !onSave) return;
      
      try {
        for (const book of previewData) {
          await onSave(book);
        }
        setPreviewData(null);
        (window as any).showToast?.(`Successfully imported ${previewData.length} books.`, 'success');
      } catch (err) {
        (window as any).showToast?.('Error saving imported books.', 'error');
      }
    };

    return (
      <div className="space-y-6">
        <DataTable 
          title="Book Management" 
          data={data}
          columns={[
            { header: 'Title', accessor: (item: Book) => item.title, className: 'font-bold' },
            { header: 'Author', accessor: (item: Book) => item.author },
            { header: 'Category', accessor: (item: Book) => item.category },
            { header: 'ISBN', accessor: (item: Book) => item.isbn || 'N/A', className: 'font-mono text-[10px]' },
            { header: 'Price', accessor: (item: Book) => `$${item.price || 0}` },
            { header: 'Total Copies', accessor: (item: Book) => item.total_copies },
            { header: 'Available', accessor: (item: Book) => item.available_copies, className: 'font-bold text-emerald-600' },
          ]}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={onDelete}
          autoModal={false}
          actions={(
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
              <label className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Import Books
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        />

        {/* Library Import Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview Library Import</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Review the list of books before finalizing the addition to the catalog</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">ISBN</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Lost Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-bold">{row.title}</td>
                        <td className="px-4 py-3">{row.author}</td>
                        <td className="px-4 py-3 text-xs">{row.category}</td>
                        <td className="px-4 py-3 font-mono text-[10px]">{row.isbn}</td>
                        <td className="px-4 py-3">{row.total_copies}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600">${row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
                <button onClick={() => setPreviewData(null)} className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={confirmImport}
                  className="flex-3 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  Confirm & Import {previewData.length} Books
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const bookData = {
                  ...editingBook,
                  title: formData.get('title'),
                  author: formData.get('author'),
                  isbn: formData.get('isbn'),
                  category: formData.get('category'),
                  total_copies: parseInt(formData.get('total_copies') as string),
                  available_copies: editingBook ? editingBook.available_copies : parseInt(formData.get('total_copies') as string),
                  price: parseFloat(formData.get('price') as string) || 0,
                };
                onSave(bookData);
                setShowModal(false);
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-500">Book Title</label>
                  <input name="title" defaultValue={editingBook?.title} required type="text" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Author</label>
                    <input name="author" defaultValue={editingBook?.author} required type="text" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">ISBN</label>
                    <input name="isbn" defaultValue={editingBook?.isbn} type="text" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Category</label>
                    <select name="category" defaultValue={editingBook?.category} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm">
                      <option>Academic</option>
                      <option>Fiction</option>
                      <option>Science</option>
                      <option>History</option>
                      <option>Reference</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Total Copies</label>
                    <input name="total_copies" defaultValue={editingBook?.total_copies || 1} required type="number" min="1" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Price (Lost Fee)</label>
                    <input name="price" defaultValue={editingBook?.price || 0} required type="number" step="0.01" min="0" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Save Book</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  },
  BorrowReturn: ({ role, data, books, students, onSave, onReturn, onMarkAsLost }: { role?: string, data: BorrowRecord[], books: Book[], students: Student[], onSave: (data: any) => void, onReturn: (id: string) => void, onMarkAsLost: (id: string) => void }) => {
    const [showModal, setShowModal] = useState(false);

    return (
      <div className="space-y-6">
        <DataTable 
          title="Borrow & Return" 
          data={data}
          columns={[
            ...(role === 'STUDENT' ? [] : [{ header: 'Student', accessor: (item: BorrowRecord) => item.user_name || 'Unknown', className: 'font-bold' }]),
            { header: 'Book Title', accessor: (item: BorrowRecord) => item.book_title || 'Unknown', className: role === 'STUDENT' ? 'font-bold' : '' },
            { header: 'Issue Date', accessor: (item: BorrowRecord) => item.loan_date ? new Date(item.loan_date).toLocaleDateString() : 'N/A' },
            { header: 'Due Date', accessor: (item: BorrowRecord) => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' },
            { 
              header: 'Status', 
              accessor: (item: BorrowRecord) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit",
                  item.status === 'Returned' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
                  item.status === 'Lost' ? "bg-red-50 text-red-600 dark:bg-red-900/20" :
                  item.status === 'Overdue' ? "bg-red-50 text-red-600 dark:bg-red-900/20" :
                  "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                )}>
                  {item.status === 'Returned' ? <CheckCircle className="w-3 h-3" /> : 
                   item.status === 'Lost' ? <X className="w-3 h-3" /> :
                   item.status === 'Overdue' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {item.status}
                </span>
              )
            }
          ]}
          onAdd={role === 'STUDENT' ? undefined : () => setShowModal(true)}
          extraActions={role === 'STUDENT' ? undefined : ((item: BorrowRecord) => (
            <>
              {item.status !== 'Returned' && item.status !== 'Lost' && (
                <>
                  <button
                    onClick={() => onReturn(item.id)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Return Book
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to mark this book as lost? An invoice will be generated for the student.')) {
                        onMarkAsLost(item.id);
                      }
                    }}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Mark as Lost
                  </button>
                </>
              )}
            </>
          ))}
          autoModal={false}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Issue New Book</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                onSave({
                  book_id: formData.get('book_id'),
                  student_id: formData.get('student_id'),
                  issue_date: formData.get('issue_date'),
                  due_date: formData.get('due_date'),
                });
                setShowModal(false);
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-500">Select Book</label>
                  <select name="book_id" required className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm">
                    <option value="">Select a book...</option>
                    {books.filter(b => b.available_copies > 0).map(b => (
                      <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-500">Select Student</label>
                  <select name="student_id" required className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm">
                    <option value="">Select a student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.admission_no})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Issue Date</label>
                    <input name="issue_date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Due Date</label>
                    <input name="due_date" required type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Issue Book</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  },
  DigitalLibrary: ({ role, data, onSave }: { role?: UserRole, data: Book[], onSave: (data: any) => Promise<void> }) => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewingBook, setViewingBook] = useState<Book | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const canUpload = role === 'SCHOOL_ADMIN' || role === 'LIBRARIAN';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError('File size exceeds 10MB limit.');
          return;
        }
        setUploadError(null);
        
        const reader = new FileReader();
        reader.onload = () => {
          (e.target as any)._fileBase64 = reader.result;
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Digital Library</h2>
            <p className="text-zinc-500">Read available e-books and digital resources.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search digital resources..." 
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none"
              />
            </div>
            {canUpload && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> Upload
              </button>
            )}
          </div>
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Upload Digital Book</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                setIsUploading(true);
                try {
                  const formData = new FormData(e.target);
                  const fileInput = e.target.querySelector('input[type="file"]');
                  await onSave({
                    title: formData.get('title'),
                    author: formData.get('author'),
                    category: formData.get('category'),
                    is_digital: true,
                    digital_url: fileInput?._fileBase64 || null,
                    total_copies: 0,
                    available_copies: 0
                  });
                  setShowUploadModal(false);
                } finally {
                  setIsUploading(false);
                }
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-500">Book Title</label>
                  <input name="title" required type="text" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Author</label>
                    <input name="author" required type="text" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-zinc-500">Category</label>
                    <select name="category" className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm">
                      <option>Academic</option>
                      <option>Research</option>
                      <option>Reference</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-500">PDF File (Max 10MB)</label>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 text-center relative">
                    <Plus className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Click to upload PDF</p>
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {uploadError && <p className="text-[10px] text-red-500 mt-2">{uploadError}</p>}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" disabled={isUploading} onClick={() => setShowUploadModal(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={!!uploadError || isUploading} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingBook && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col p-4">
             <div className="flex items-center justify-between mb-4 px-4">
                <h3 className="text-white font-bold">Reading: {viewingBook.title}</h3>
                <button 
                  onClick={() => {
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setViewingBook(null);
                    setPdfUrl(null);
                  }} 
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 w-full max-w-5xl mx-auto bg-zinc-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
                {isLoadingPdf ? (
                  <div className="flex flex-col items-center gap-4 text-white">
                    <Clock className="w-12 h-12 animate-spin opacity-20" />
                    <p className="font-bold opacity-50">Loading document...</p>
                  </div>
                ) : pdfUrl ? (
                  <>
                    <iframe 
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                      className="w-full h-full border-none"
                      title="PDF Viewer"
                    />
                    <div className="absolute top-0 right-0 left-0 h-12 bg-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="text-white opacity-50">Failed to load document content.</div>
                )}
              </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item, i) => (
            <div key={i} className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{item.title}</h3>
              <p className="text-xs text-zinc-500 mb-4">{item.author} • {item.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Read Only</span>
                <button 
                  onClick={async () => {
                    setViewingBook(item);
                    setIsLoadingPdf(true);
                    try {
                      const blob = await fetchBookContent(item.id);
                      const url = URL.createObjectURL(blob);
                      setPdfUrl(url);
                    } catch (err) {
                      console.error('Failed to load PDF:', err);
                    } finally {
                      setIsLoadingPdf(false);
                    }
                  }}
                  className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-indigo-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-3 h-3" /> Read Now
                </button>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No digital resources available yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  },
  LibraryMembers: ({ students }: { students: Student[] }) => {
    // In a real app, library members might be a separate table, but here we show students
    return (
      <DataTable 
        title="Library Members" 
        data={students}
        columns={[
          { header: 'Name', accessor: (item: Student) => item.name, className: 'font-bold' },
          { header: 'Admission No', accessor: (item: Student) => item.admission_no },
          { header: 'Class', accessor: (item: Student) => item.class || 'N/A' },
          { header: 'Contact', accessor: (item: Student) => item.contact || 'N/A' },
        ]}
      />
    );
  },
  BorrowedBooks: ({ data, userId }: { data: BorrowRecord[], userId: string }) => {
    const userBorrowed = data.filter(record => record.user_id === userId || record.student_id === userId || record.staff_id === userId);
    
    return (
      <div className="space-y-6">
        <DataTable 
          title="My Borrowed Books" 
          data={userBorrowed}
          columns={[
            { header: 'Book Title', accessor: (item: BorrowRecord) => item.book_title || 'Unknown', className: 'font-bold' },
            { header: 'Issue Date', accessor: (item: BorrowRecord) => item.loan_date ? new Date(item.loan_date).toLocaleDateString() : 'N/A' },
            { header: 'Due Date', accessor: (item: BorrowRecord) => item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A' },
            { 
              header: 'Status', 
              accessor: (item: BorrowRecord) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === 'Returned' ? "bg-emerald-50 text-emerald-600" :
                  item.status === 'Overdue' ? "bg-red-50 text-red-600" :
                  "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              )
            }
          ]}
        />
        {userBorrowed.length === 0 && (
          <div className="py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You have no borrowed books at the moment.</p>
          </div>
        )}
      </div>
    );
  },
};
