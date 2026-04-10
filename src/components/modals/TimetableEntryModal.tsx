import React, { useState, useEffect } from 'react';
import { X, User, Building2 } from 'lucide-react';

interface TimetableEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  staff: any[];
  subjects: any[];
  days: string[];
  role: string;
  editingItem: any;
  selectedClassId: string | null;
}

const TimetableEntryModal: React.FC<TimetableEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staff,
  subjects,
  days,
  role,
  editingItem: initialItem,
  selectedClassId
}) => {
  const [editingItem, setEditingItem] = useState<any>(initialItem);

  useEffect(() => {
    setEditingItem(initialItem);
  }, [initialItem]);

  if (!isOpen) return null;

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      ...editingItem,
      type: formData.get('type'),
      day_of_week: formData.get('day_of_week'),
      subject_id: formData.get('subject_id'),
      teacher_id: formData.get('teacher_id'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      room: formData.get('room'),
      // Include class info if not present
      class_id: editingItem?.class_id || selectedClassId,
      org_id: editingItem?.org_id
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">{editingItem?.id ? 'Edit' : 'Add'} Timetable Entry</h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Class Schedule</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSave} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Entry Type</label>
            <select
              name="type"
              value={editingItem?.type || 'Lesson'}
              required
              onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all"
            >
              <option value="Lesson">Lesson / Period</option>
              <option value="Short Break">Short Break</option>
              <option value="Lunch Break">Lunch Break</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Day</label>
              <select
                name="day_of_week"
                defaultValue={editingItem?.day_of_week}
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all"
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject</label>
              <select
                name="subject_id"
                value={editingItem?.subject_id || ''}
                required={editingItem?.type === 'Lesson' || !editingItem?.type}
                onChange={(e) => {
                  const subId = e.target.value;
                  const selectedSubject = subjects.find(s => String(s.id).toLowerCase() === subId.toLowerCase());
                  
                  // Precision Teacher Lookup for HOD View
                  let teacherIdToSet = editingItem?.teacher_id || '';
                  if (selectedSubject?.teacher_id) {
                      const subTeacherRef = String(selectedSubject.teacher_id).toLowerCase();
                      const matchedStaff = staff.find(st => 
                          String(st.id).toLowerCase() === subTeacherRef || 
                          (st.email && String(st.email).toLowerCase() === subTeacherRef) ||
                          (st.name && String(st.name).toLowerCase() === subTeacherRef)
                      );
                      if (matchedStaff) teacherIdToSet = String(matchedStaff.id);
                  }

                  setEditingItem({ 
                    ...editingItem, 
                    subject_id: subId,
                    teacher_id: teacherIdToSet
                  });
                }}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all disabled:opacity-50"
                disabled={editingItem?.type && editingItem.type !== 'Lesson'}
              >
                <option value="">{editingItem?.type && editingItem.type !== 'Lesson' ? 'N/A' : 'Select Subject'}</option>
                {subjects
                  .filter(s => {
                    if (role === 'HOD') return true; // Subjects already pre-filtered by department in App.tsx
                    const matchesClass = s.classes?.some((c: any) => String(c.id).toLowerCase() === String(selectedClassId).toLowerCase()) || !selectedClassId;
                    return matchesClass;
                  })
                  .map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Start Time</label>
              <input
                type="time"
                name="start_time"
                required
                defaultValue={editingItem?.start_time || (editingItem?.time_slot ? editingItem.time_slot.split(' - ')[0] : '')}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">End Time</label>
              <input
                type="time"
                name="end_time"
                required
                defaultValue={editingItem?.end_time || (editingItem?.time_slot ? editingItem.time_slot.split(' - ')[1] : '')}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Teacher</label>
              <select
                name="teacher_id"
                value={editingItem?.teacher_id || ''}
                required={editingItem?.type === 'Lesson' || !editingItem?.type}
                onChange={(e) => setEditingItem({ ...editingItem, teacher_id: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all disabled:opacity-50"
                disabled={editingItem?.type && editingItem.type !== 'Lesson'}
              >
                <option value="">{editingItem?.type && editingItem.type !== 'Lesson' ? 'N/A' : 'Select Teacher'}</option>
                {staff
                  .filter(s => {
                    const selectedSubject = subjects.find(sub => String(sub.id).toLowerCase() === String(editingItem?.subject_id).toLowerCase());
                    const subjectDeptId = selectedSubject?.department_id ? String(selectedSubject.department_id).toLowerCase() : null;
                    if (subjectDeptId) {
                        return String(s.department_id).toLowerCase() === subjectDeptId;
                    }
                    return true;
                  })
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Room / Location</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  name="room"
                  defaultValue={editingItem?.room}
                  placeholder="e.g. Lab 1"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableEntryModal;
