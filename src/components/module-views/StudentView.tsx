import React, { useState } from 'react';
import { 
  X, Search, Bell, User, ChevronDown, LogOut, 
  Settings, Sun, Moon, Globe, ChevronRight, ShieldCheck,
  GraduationCap, Users, FileText, UserCircle, Calendar,
  ClipboardCheck, Clock, TrendingUp, BookOpen, Building2,
  AlertCircle, CheckCircle, Smartphone, Mail, MapPin,
  Briefcase, ArrowRight, Shield, Download, Filter, Plus,
  MoreVertical, Edit2, Trash2, Save, DownloadCloud, UploadCloud,
  FileCheck, FileX, Info, ExternalLink, HelpCircle, MessageSquare,
  Zap, Heart, Layout, History, Ruler, Package, Star, 
  ArrowUpRight, ArrowDownRight, Printer, Share2, FilterX,
  RefreshCw, RotateCcw, SearchX, Sliders, ListFilter,
  School, Layers, Shirt, Send, Phone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { Modal } from '../UI';
import { useLanguage } from '../../lib/LanguageContext';

export const StudentModules = {
  UniformRequests: ({ uniforms, data, studentId, onSave, role }: { uniforms: any[], data: any[], studentId?: string | null, onSave: (data: any) => void, role?: string }) => {
    const { currency, t } = useLanguage();
    const renderRequestForm = (item?: any) => (
      <div className="space-y-4">
        <input type="hidden" name="student_id" value={studentId || ""} />
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Uniform Item</label>
          <select 
            name="item_id" 
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={item?.item_id || ""}
            onChange={(e) => {
              const selected = uniforms.find(u => u.id === e.target.value);
              if (selected) {
                const nameInput = document.getElementsByName('item_name')[0] as HTMLInputElement;
                const priceInput = document.getElementsByName('total_price')[0] as HTMLInputElement;
                if (nameInput) nameInput.value = `${selected.item_name} (${selected.size})`;
                if (priceInput) priceInput.value = selected.price;
              }
            }}
          >
            <option value="">Choose Uniform...</option>
            {uniforms.map(u => (
              <option key={u.id} value={u.id}>{u.item_name} (Size: {u.size}) - {currency} {u.price}</option>
            ))}
          </select>
          <input type="hidden" name="item_name" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantity</label>
            <input 
              type="number" 
              name="quantity" 
              defaultValue={item?.quantity || 1} 
              min="1"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => {
                const itemId = (document.getElementsByName('item_id')[0] as HTMLSelectElement).value;
                const selected = uniforms.find(u => u.id === itemId);
                if (selected) {
                  const priceInput = document.getElementsByName('total_price')[0] as HTMLInputElement;
                  if (priceInput) priceInput.value = (selected.price * parseInt(e.target.value || '0')).toString();
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('total_price')} ({currency})</label>
            <input 
              type="number" 
              name="total_price" 
              readOnly
              className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-bold text-indigo-600" 
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            name="add_to_fees"
            id="add_to_fees_request"
            defaultChecked={true}
            className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="add_to_fees_request" className="text-sm text-zinc-600 dark:text-zinc-400">
            Add to my fees (Pay Later)
          </label>
        </div>
      </div>
    );

    if (role === 'PARENT') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Uniform Requests</h3>
            <button 
              onClick={() => (window as any).showModal?.('Request', renderRequestForm(), onSave)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              New Request
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data || []).map((item: any, i: number) => (
              <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm group hover:border-indigo-500 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{item.item_name}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    item.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {item.status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Total Price</p>
                    <p className="text-lg font-black text-indigo-600">{currency} {item.total_price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Request Date</p>
                    <p className="text-xs font-bold text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <DataTable
        title="My Uniform Requests"
        modalTitle="Request"
        addLabel="Request"
        data={data || []}
        onSave={onSave}
        columns={[
          { header: 'Item', accessor: 'item_name', className: 'font-bold' },
          { header: 'Qty', accessor: 'quantity' },
          { header: 'Total', accessor: (item: any) => `${currency} ${item.total_price}`, className: 'font-bold text-indigo-600' },
          { header: 'Date', accessor: (item: any) => new Date(item.created_at).toLocaleDateString() },
          { 
            header: 'Status', 
            accessor: (item: any) => (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              )}>
                {item.status || 'Pending'}
              </span>
            )
          }
        ]}
        onAdd={() => {}}
        renderForm={renderRequestForm}
      />
    );
  },
  PersonalInformation: ({ currentUser, students = [] }: { currentUser: any, students: any[] }) => {
    const student = students.find((s: any) => s.email === currentUser?.email);
    if (!student) return <div className="p-8 text-center text-zinc-500">Student personal information not found.</div>;

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
          <div className="w-32 h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-indigo-50 dark:border-indigo-900/20 flex-shrink-0">
            {student.profile_pic || student.previous_school_profile_pic || currentUser?.profile_pic ? (
              <img 
                src={student.profile_pic || student.previous_school_profile_pic || currentUser?.profile_pic} 
                alt={student.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-4xl font-black">
                {student.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{student.name}</h2>
            <p className="text-zinc-500 font-medium">Admission No: {student.admission_no || student.admissionNo || 'N/A'}</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {student.status || 'Active Student'}
              </span>
              <span className="px-3 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {student.class || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-indigo-500" />
              Personal Details
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: student.name },
                { label: 'Parent Name', value: student.parent_name || student.parentName || 'N/A' },
                { label: 'Entrance Exam Score', value: student.entrance_exam_score || 'N/A' },
                { label: 'Date of Birth', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A' },
                { label: 'Gender', value: student.gender || 'N/A' },
                { label: 'Previous School', value: student.previous_school || 'N/A' },
                { label: 'Date Enrolled', value: student.date_enrolled ? new Date(student.date_enrolled).toLocaleDateString() : 'N/A' },
                { label: 'GPA', value: student.gpa || '0.00' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-500">{item.label}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Contact Information
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Email Address', value: student.email || currentUser?.email || 'N/A' },
                { label: 'Phone Number', value: student.contact || 'N/A' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-500">{item.label}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
                </div>
              ))}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Note</p>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  Additional contact information and residential details can be updated through the administration office.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  AcademicInformation: ({ currentUser, students = [], subjects = [], classes = [], role }: { currentUser: any, students: any[], subjects: any[], classes: any[], role?: string }) => {
    const student = students.find((s: any) => s.email === currentUser?.email);
    if (!student) return <div className="p-8 text-center text-zinc-500">Academic information not found.</div>;

    const studentClassId = student?.class_id || currentUser?.class_id;
    const myClass = classes.find((c: any) => String(c.id) === String(studentClassId));
    
    const mySubjects = subjects.filter((s: any) => {
      if (String(s.class_id) === String(studentClassId)) return true;
      if (Array.isArray(s.classes) && s.classes.some((c: any) => String(c.id) === String(studentClassId))) return true;
      return false;
    });

    return (
      <div className="space-y-8">
        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Academic Profile</h2>
                <p className="text-zinc-500 font-medium">Your current enrollment and academic standing.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {[
                { label: 'Current Class', value: myClass ? `${myClass.name} ${myClass.section || ''}` : student.class || 'N/A', icon: School },
                { label: 'Admission No', value: student.admission_no || student.admissionNo || 'N/A', icon: Layers },
                { label: 'GPA', value: student.gpa || '0.00', icon: TrendingUp },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
                  </div>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {role === 'PARENT' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Enrolled Subjects</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mySubjects.map((sub: any, i: number) => (
                  <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:border-indigo-500 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">{sub.code}</span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1">{sub.name}</h4>
                    <p className="text-xs text-zinc-500 mb-4">{sub.department_name || 'General Studies'}</p>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-3 h-3 text-zinc-400" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{sub.teacher_name || 'No Teacher Assigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <DataTable 
              title="Enrolled Subjects" 
              data={mySubjects}
              columns={[
                { header: 'Subject', accessor: 'name', className: 'font-bold' },
                { header: 'Code', accessor: 'code', className: 'font-mono text-xs' },
                { header: 'Teacher', accessor: 'teacher_name' },
                { 
                  header: 'Department', 
                  accessor: 'department_name'
                },
              ]}
            />
          )}
        </div>
      </div>
    );
  },
  TeacherList: ({ students = [], staff = [], subjects = [], classes = [], currentUser, studentId }: any) => {
    const [viewingTeacher, setViewingTeacher] = useState<any>(null);
    const [messagingTeacher, setMessagingTeacher] = useState<any>(null);
    const [messageContent, setMessageContent] = useState('');

    const student = studentId 
      ? students.find((s: any) => String(s.id) === String(studentId))
      : students.find((s: any) => s.email === currentUser?.email);
    const studentClassId = student?.class_id || currentUser?.class_id;
    
    // Get subjects for this class
    const mySubjects = subjects.filter((s: any) => {
      // Check legacy class_id
      if (String(s.class_id) === String(studentClassId)) return true;
      // Check new classes array (from subject_assignments)
      if (Array.isArray(s.classes) && s.classes.some((c: any) => String(c.id) === String(studentClassId))) return true;
      return false;
    });
    
    // Get class teacher
    const studentClass = classes.find((c: any) => String(c.id) === String(studentClassId));
    const classTeacherId = studentClass?.class_teacher_id;
    
    // Get unique teacher IDs from subjects (considering both subject.teacher_id and class assignment teacher_id)
    const teacherIdsFromSubjects = mySubjects.flatMap((s: any) => {
      const ids = [];
      if (s.teacher_id) ids.push(String(s.teacher_id));
      if (Array.isArray(s.classes)) {
        s.classes.forEach((c: any) => {
          if (String(c.id) === String(studentClassId) && c.teacher_id) {
            ids.push(String(c.teacher_id));
          }
        });
      }
      return ids;
    });

    const teacherIds = Array.from(new Set([
      ...teacherIdsFromSubjects,
      classTeacherId ? String(classTeacherId) : null
    ].filter(Boolean)));
    
    // Match against staff directory to get full details
    const myTeachers = staff.filter((s: any) => teacherIds.includes(String(s.id))).map((teacher: any) => {
      // Find the primary subject they teach this student
      const subjectTaught = mySubjects.find((s: any) => String(s.teacher_id) === String(teacher.id))?.name;
      const isClassTeacher = String(teacher.id) === String(classTeacherId);
      
      let displaySubject = teacher.role;
      if (isClassTeacher && subjectTaught) {
        displaySubject = `Class Teacher • ${subjectTaught}`;
      } else if (isClassTeacher) {
        displaySubject = 'Class Teacher';
      } else if (subjectTaught) {
        displaySubject = subjectTaught;
      }
      
      return {
        ...teacher,
        displaySubject,
        displayOffice: teacher.department_name || 'General Faculty'
      };
    });

    return (
      <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Teachers</h2>
            <p className="text-zinc-500 text-sm">Connect with your subject instructors.</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {myTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTeachers.map((teacher: any, i: number) => (
              <div key={i} className="group p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-2xl font-black">
                    {teacher.avatar || teacher.profile_picture || teacher.photo || teacher.profile_pic ? (
                      <img src={teacher.avatar || teacher.profile_picture || teacher.photo || teacher.profile_pic} alt={teacher.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      teacher.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">{teacher.name}</h3>
                    <p className="text-xs text-indigo-600 font-bold">{teacher.displaySubject}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <Globe className="w-3 h-3" />
                    </div>
                    {teacher.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <Building2 className="w-3 h-3" />
                    </div>
                    {teacher.displayOffice}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <Phone className="w-3 h-3" />
                    </div>
                    {teacher.phone || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMessagingTeacher(teacher)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Send Message
                  </button>
                  <button 
                    onClick={() => setViewingTeacher(teacher)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-bold text-zinc-400">No teachers found</h3>
            <p className="text-sm text-zinc-500 mt-2">There are currently no teachers assigned to your subjects.</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!viewingTeacher} onClose={() => setViewingTeacher(null)} title="Teacher Profile">
        {viewingTeacher && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-zinc-700 bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl">
                {viewingTeacher.avatar || viewingTeacher.profile_picture || viewingTeacher.photo || viewingTeacher.profile_pic ? (
                  <img src={viewingTeacher.avatar || viewingTeacher.profile_picture || viewingTeacher.photo || viewingTeacher.profile_pic} className="w-full h-full object-cover" />
                ) : (
                  viewingTeacher.name.charAt(0)
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{viewingTeacher.name}</h3>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{viewingTeacher.displaySubject}</p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase">Active Faculty</span>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">• {viewingTeacher.displayOffice}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Email Address</p>
                  <p className="font-bold text-zinc-900 dark:text-white truncate text-xs">{viewingTeacher.email || 'N/A'}</p>
               </div>
               <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Department</p>
                  <p className="font-bold text-zinc-900 dark:text-white text-xs">{viewingTeacher.displayOffice}</p>
               </div>
               <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Contact Number</p>
                  <p className="font-bold text-zinc-900 dark:text-white text-xs">{viewingTeacher.phone || 'N/A'}</p>
               </div>
            </div>

            <div className="space-y-3">
               <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Professional Bio</h4>
               <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium italic">
                    "{viewingTeacher.bio || `Specialist in ${viewingTeacher.displaySubject} with professional focus on student academic excellence and behavioral guidance.`}"
                  </p>
               </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setViewingTeacher(null)}
                className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!messagingTeacher} onClose={() => setMessagingTeacher(null)} title={`New Message to ${messagingTeacher?.name}`}>
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Composition</label>
            <textarea 
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
            />
          </div>

          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-start gap-3">
             <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl text-indigo-600 shadow-sm shrink-0">
                <Bell className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold leading-relaxed uppercase tracking-tight">
                Your message will be sent directly to the teacher's official portal. You'll receive a notification once they reply.
             </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => {
                setMessagingTeacher(null);
                setMessageContent('');
              }}
              className="px-6 py-3 text-zinc-500 font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (!messageContent.trim()) {
                   (window as any).showToast?.("Message cannot be empty", "error");
                   return;
                }
                (window as any).showToast?.(`Message sent to ${messagingTeacher?.name}!`, "success");
                setMessagingTeacher(null);
                setMessageContent('');
              }}
              className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </div>
      </Modal>
      </>
    );
  },
  AcademicCalendar: () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Academic Calendar</h2>
          <p className="text-zinc-500 text-sm">Stay updated with school events and holidays.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            Subscribe to Calendar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">March 2024</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-7 gap-4 text-center mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const hasEvent = [5, 12, 15, 22, 28].includes(day);
                  return (
                    <div key={i} className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold relative transition-all cursor-pointer",
                      day === 6 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      hasEvent && "after:absolute after:bottom-2 after:w-1 after:h-1 after:bg-rose-500 after:rounded-full"
                    )}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-lg font-bold">Upcoming Events</h3>
          <div className="space-y-4">
            {[
              { title: 'Mid-term Exams', date: 'Mar 12 - Mar 15', type: 'Academic', color: 'bg-rose-500' },
              { title: 'Science Fair 2024', date: 'Mar 22', type: 'Event', color: 'bg-indigo-500' },
              { title: 'Easter Break', date: 'Mar 28 - Apr 5', type: 'Holiday', color: 'bg-emerald-500' },
            ].map((event, i) => (
              <div key={i} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-4">
                <div className={cn("w-1 h-10 rounded-full", event.color)} />
                <div>
                  <p className="font-bold text-sm">{event.title}</p>
                  <p className="text-[10px] text-zinc-500">{event.date} • {event.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
  ParentGuardianDetails: ({ currentUser, students = [] }: { currentUser: any, students: any[] }) => {
    const student = students.find((s: any) => s.email === currentUser?.email);
    
    if (!student) {
      return (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
          <UserCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profile Not Found</h3>
          <p className="text-sm text-zinc-500 mt-1">We couldn't retrieve your student profile details.</p>
        </div>
      );
    }

    const parentData = [
      { 
        role: 'Primary Guardian', 
        name: student.parent_name || student.parentName || 'Not Specified', 
        phone: student.contact || 'Not Specified', 
        email: 'Not Specified', // Not explicitly in Student interface
        occupation: 'Not Specified',
        address: 'Same as student'
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {parentData.map((parent, i) => (
          <div key={i} className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{parent.role}</p>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{parent.name}</h3>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Phone', value: parent.phone },
                { label: 'Email', value: parent.email },
                { label: 'Occupation', value: parent.occupation },
                { label: 'Address', value: parent.address },
              ].map((detail, j) => (
                <div key={j} className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-500">{detail.label}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  },
  Documents: () => (
    <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
      <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
      <p className="text-sm text-zinc-500 mt-1">Your certificates and other official documents will appear here once uploaded by the administration.</p>
    </div>
  ),
  EditProfile: () => (
    <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
      <Settings className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profile Settings</h3>
      <p className="text-sm text-zinc-500 mt-1">Please contact the school administration to update your official record information.</p>
    </div>
  ),
};
