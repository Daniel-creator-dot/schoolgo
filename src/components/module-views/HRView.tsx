import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../../lib/LanguageContext";
import {
  Users,
  Plus,
  X,
  Briefcase,
  Calendar,
  ClipboardCheck,
  FileText,
  Wallet,
  Zap,
  Download,
  ShieldCheck,
  Layers,
  User,
  BookOpen,
  UserPlus,
  UserCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  UserMinus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CalendarDays,
  XCircle,
  Award,
  ClipboardList,
  Clock,
  RefreshCw,
  Search,
  Settings,
  ChevronDown,
  Mail,
  Phone,
  Send,
  Palette,
  Target,
  Star,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { UserRole, Student } from "../../types";
import { DataTable } from "../DataTable";
import { ConfirmationModal, Modal } from "../UI";
import { DocumentBuilder } from "../AdminModules";

export const HRModules = {
  Organogram: ({
    staff = [],
    departments = [],
    organization,
    scopedDeptId,
    strictDepartmentView = false,
    isReadOnly = false,
    onSaveStaff,
    onSaveDepartment,
  }: {
    staff?: any[];
    departments?: any[];
    organization?: any;
    scopedDeptId?: string | null;
    strictDepartmentView?: boolean;
    isReadOnly?: boolean;
    onSaveStaff?: (data: any) => void;
    onSaveDepartment?: (data: any) => void;
  }) => {
    const { t } = useLanguage();

    // Build hierarchy dynamically
    const buildHierarchy = () => {
      if (staff.length === 0) return [];

      // Track which staff IDs have already been placed in the hierarchy
      const placedStaffIds = new Set<string>();
      const nodes: any[] = [];

      // 1. Find Principal
      const principal =
        staff.find(
          (s) =>
            s.role?.toLowerCase().includes("principal") &&
            !s.role?.toLowerCase().includes("vice"),
        ) || staff[0];

      // 2. Find Admins (Level 0 / Root)
      const admins = staff.filter(
        (s) =>
          s.role?.toLowerCase().includes("admin") &&
          !s.role?.toLowerCase().includes("assistant") &&
          !placedStaffIds.has(s.id),
      );

      // Add Admins at Level 0
      admins.forEach((admin) => {
        nodes.push({
          id: admin.id,
          name: admin.name,
          role: admin.role,
          level: 0,
          subordinates: [],
        });
        placedStaffIds.add(admin.id);

        // Link Principal to the first Admin (Principal reports to Admin)
        if (principal) {
          const adminNode = nodes.find(n => n.id === admin.id);
          if (adminNode && !adminNode.subordinates.includes(principal.id)) {
            adminNode.subordinates.push(principal.id);
          }
        }
      });

      // 4. Principal Node (Level 1)
      nodes.push({
        id: principal.id,
        name: principal.name,
        role: principal.role,
        level: 1,
        subordinates: [],
      });
      placedStaffIds.add(principal.id);

      // 5. Independent Staff (Level 1 - reports to first Admin)
      const independentStaff = staff.filter(
        (s) =>
          !placedStaffIds.has(s.id) &&
          (!s.reports_to || s.reports_to === "")
      );

      const firstAdminId = admins[0]?.id;
      independentStaff.forEach((s) => {
        if (firstAdminId) {
          const adminNode = nodes.find(n => n.id === firstAdminId);
          if (adminNode) adminNode.subordinates.push(s.id);
        }
        
        nodes.push({
          id: s.id,
          name: s.name,
          role: s.role,
          level: 1,
          subordinates: [],
        });
        placedStaffIds.add(s.id);
      });

      // If no admin exists, we start with Principal at Level 0
      if (admins.length === 0) {
        const principalNode = nodes.find(n => n.id === principal.id);
        if (principalNode) principalNode.level = 0;
      }

      // Level 1 (continued): Vice Principals and direct reports to Principal
      const level1Staff = staff.filter(
        (s) =>
          s.id !== principal.id &&
          !placedStaffIds.has(s.id) &&
          (s.reports_to === principal.id ||
            s.role?.toLowerCase().includes("vice principal")),
      );

      level1Staff.forEach((s) => {
        const principalNode = nodes.find((n) => n.id === principal.id);
        if (principalNode) principalNode.subordinates.push(s.id);
        nodes.push({
          id: s.id,
          name: s.name,
          role: s.role,
          level: 1,
          subordinates: [],
        });
        placedStaffIds.add(s.id);
      });

      // Level 2: Departments
      const filteredDepartments = scopedDeptId 
        ? departments.filter(d => String(d.id) === String(scopedDeptId))
        : departments;

      filteredDepartments.forEach((dept) => {
        const deptId = `dept-${dept.id}`;
        const hod = staff.find((s) => s.id === dept.hod_id);

        // Find who the HOD reports to, or default to Principal
        const parentId = hod?.reports_to || principal.id;
        const parentNode = nodes.find((n) => n.id === parentId) || nodes.find(n => n.id === principal.id);
        
        if (parentNode) {
          parentNode.subordinates.push(deptId);
        }

        // Mark the HOD as placed so they don't appear again under the department
        if (hod) placedStaffIds.add(hod.id);

        nodes.push({
          id: deptId,
          name: dept.name,
          role: hod ? `HOD: ${hod.name}` : "No HOD assigned",
          isDepartment: true,
          deptData: dept,
          level: 2,
          subordinates: [],
        });

        // Level 3: Staff in this department (skip already-placed staff)
        const deptStaff = staff.filter(
          (s) => s.department_id === dept.id && !placedStaffIds.has(s.id),
        );
        deptStaff.forEach((s) => {
          const deptNode = nodes.find((n) => n.id === deptId);
          if (deptNode) {
            deptNode.subordinates.push(s.id);
            nodes.push({
              id: s.id,
              name: s.name,
              role: s.role,
              level: 3,
              subordinates: [],
            });
            placedStaffIds.add(s.id);
          }
        });
      });

      // If scoped to a department, we only want nodes relevant to that department
      if (scopedDeptId) {
        const deptNodeId = `dept-${scopedDeptId}`;
        const deptNode = nodes.find(n => n.id === deptNodeId);
        if (deptNode) {
          // Find the lineage to the root
          const relevantNodeIds = new Set<string>();
          relevantNodeIds.add(deptNodeId);
          
          // Add all descendants of the dept node
          const addDescendants = (nId: string) => {
            const n = nodes.find(x => x.id === nId);
            if (n) {
              relevantNodeIds.add(nId);
              n.subordinates.forEach(addDescendants);
            }
          };
          addDescendants(deptNodeId);

          // Add ancestors only if NOT strictDepartmentView
          if (!strictDepartmentView) {
            let current: any = deptNode;
            while (current) {
              const parent = nodes.find(p => p.subordinates.includes(current.id));
              if (parent) {
                relevantNodeIds.add(parent.id);
                current = parent;
              } else {
                current = null;
              }
            }
          }

          // Return only relevant nodes but clear extra subordinates of ancestors
          return nodes.filter(n => relevantNodeIds.has(n.id)).map(n => {
            if (!n.id.startsWith("dept-") && n.level < 2) {
               return { ...n, subordinates: n.subordinates.filter((sId: string) => relevantNodeIds.has(sId)) };
            }
            return n;
          });
        }
      }

      return nodes;
    };

    const hierarchy = buildHierarchy();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingNode, setEditingNode] = useState<any>(null);

    const minLevel = Math.min(...hierarchy.map(h => h.level));
    const rootNodes = hierarchy.filter((h) => h.level === minLevel);

    const handleSaveNode = async (formData: any) => {
      if (editingNode.isDepartment) {
        onSaveDepartment?.({
          ...editingNode.deptData,
          name: formData.name,
          hod_id: formData.hod_id,
        });
      } else {
        const originalStaff = staff.find((s) => s.id === editingNode.id);
        onSaveStaff?.({
          ...originalStaff,
          reports_to: formData.reports_to,
          department_id: formData.department_id,
        });
      }
      setEditingNode(null);
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {scopedDeptId ? t('department_organogram') : t('school_organogram')}
            </h1>
            <p className="text-zinc-500">
              {scopedDeptId 
                ? "Departmental reporting structure and staff hierarchy."
                : "Visual hierarchy of school administration and staff structure."}
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-lg",
                isEditMode
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20",
              )}
            >
              {isEditMode ? (
                <>
                  <X className="w-4 h-4" />
                  {t('exit_edit_mode')}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  {t('configure_organogram')}
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-4 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2rem] overflow-x-auto relative custom-scrollbar">
          {hierarchy.length > 0 ? (
            <div className="min-w-max flex flex-col items-center gap-12 py-4 px-2">
              {/* Root Level (-1 or 0) */}
              <div className="flex justify-center gap-12">
                {rootNodes.map((rootNode) => (
                  <div key={rootNode.id} className={cn(
                    "group relative p-6 rounded-2xl shadow-xl w-64 text-center",
                    rootNode?.level === -1 
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" 
                      : "bg-indigo-600 text-white"
                  )}>
                    {isEditMode && !isReadOnly && (
                      <button
                        onClick={() => setEditingNode(rootNode)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white text-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-indigo-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest opacity-80 mb-1",
                      rootNode?.level === -1 ? "text-indigo-400" : ""
                    )}>
                      {rootNode?.role || t('principal')}
                    </p>
                    <p className="font-bold text-lg">{rootNode?.name}</p>
                  </div>
                ))}
              </div>

              {/* Level 1 & 2 & 3 Rendering */}
              {rootNodes.some(rn => rn.subordinates?.length > 0) && (
                <>
                  <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-zinc-200 dark:bg-zinc-800" />
                  </div>

                  <div className="flex justify-center gap-12">
                    {rootNodes.flatMap(rn => rn.subordinates || []).map((nodeId: string) => {
                      const node = hierarchy.find((h) => h.id === nodeId);
                      if (!node) return null;
                      return (
                        <div
                          key={node.id}
                          className="flex flex-col items-center gap-12"
                        >
                          <div
                            className={cn(
                              "group relative p-5 rounded-2xl shadow-lg w-64 text-center border",
                              node.isDepartment
                                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                : "bg-white dark:bg-zinc-800 border-indigo-100 dark:border-indigo-900/30",
                            )}
                          >
                                    {isEditMode && !isReadOnly && (
                              <button
                                onClick={() => setEditingNode(node)}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-indigo-100 dark:border-indigo-900/30"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-zinc-200 dark:bg-zinc-800" />
                            <p
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest mb-1",
                                node.isDepartment
                                  ? "text-amber-600"
                                  : "text-indigo-600 dark:text-indigo-400",
                              )}
                            >
                              {node.role}
                            </p>
                            <p className="font-bold text-zinc-900 dark:text-white">
                              {node.name}
                            </p>
                          </div>

                          {node.subordinates.length > 0 && (
                            <>
                              <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px bg-zinc-200 dark:bg-zinc-800" />
                              </div>
                              <div className="flex gap-8">
                                {node.subordinates.map((subId: string) => {
                                  const sub = hierarchy.find(
                                    (h) => h.id === subId,
                                  );
                                  if (!sub) return null;
                                  return (
                                    <div
                                      key={sub.id}
                                      className="flex flex-col items-center gap-8"
                                    >
                                      <div
                                        className={cn(
                                          "group relative p-4 rounded-xl w-48 text-center border",
                                          sub.isDepartment
                                            ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30"
                                            : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700",
                                        )}
                                      >
                                        {isEditMode && (
                                          <button
                                            onClick={() => setEditingNode(sub)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-zinc-100 dark:border-zinc-700"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                        )}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                                          {sub.role}
                                        </p>
                                        <p className="font-bold text-xs text-zinc-900 dark:text-white">
                                          {sub.name}
                                        </p>
                                      </div>

                                      {sub.subordinates.length > 0 && (
                                        <>
                                          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 relative">
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-zinc-200 dark:bg-zinc-800" />
                                          </div>
                                          <div className="flex gap-4">
                                            {sub.subordinates.map(
                                              (leafId: string) => {
                                                const leaf = hierarchy.find(
                                                  (h) => h.id === leafId,
                                                );
                                                if (!leaf) return null;
                                                return (
                                                  <div
                                                    key={leaf.id}
                                                    className="group relative p-3 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 rounded-lg w-32 text-center"
                                                  >
                                                    {isEditMode && (
                                                      <button
                                                        onClick={() =>
                                                          setEditingNode(leaf)
                                                        }
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-zinc-800 text-zinc-400 rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform border border-zinc-200 dark:border-zinc-700"
                                                      >
                                                        <Edit className="w-2.5 h-2.5" />
                                                      </button>
                                                    )}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                                                    <p className="text-[7px] font-bold uppercase text-zinc-400">
                                                      {leaf.role}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                                      {leaf.name}
                                                    </p>
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500">
              No staff members found to build the organogram.
            </div>
          )}
        </div>

        <Modal
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          title={
            editingNode?.isDepartment
              ? t('edit_record_title').replace('{title}', editingNode.name)
              : t('edit_record_title').replace('{title}', editingNode?.name)
          }
        >
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveNode(Object.fromEntries(formData));
            }}
          >
            {editingNode?.isDepartment ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('department_name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingNode.name}
                    required
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('hod_label')}
                  </label>
                  <select
                    name="hod_id"
                    defaultValue={editingNode.deptData?.hod_id || ""}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{t('select_hod_placeholder')}</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('reports_to')}
                  </label>
                  <select
                    name="reports_to"
                    defaultValue={
                      staff.find((s) => s.id === editingNode?.id)?.reports_to ||
                      ""
                    }
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('no_manager_root')}</option>
                    {staff
                      .filter((s) => s.id !== editingNode?.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('department')}
                  </label>
                  <select
                    name="department_id"
                    defaultValue={
                      staff.find((s) => s.id === editingNode?.id)
                        ?.department_id || ""
                    }
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('no_department')}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('save_changes')}
              </button>
            </div>
          </form>
        </Modal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-400 mb-2">
              Automated Hierarchy
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300/70">
              The hierarchy is automatically generated based on "Reports To"
              assignments and Department associations in Staff Management.
            </p>
          </div>
          <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl">
            <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-2">
              Departmental Structure
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300/70">
              Departments are displayed as functional nodes, grouping all staff
              members assigned to them under the respective Head of Department.
            </p>
          </div>
        </div>
      </div>
    );
  },
  LessonNotes: ({
    role,
    data,
    staffList,
    currentStaff,
    currentUser,
    subjects = [],
    classes = [],
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentStaff?: any;
    currentUser?: any;
    subjects?: any[];
    classes?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { t } = useLanguage();
    const isApprover =
      role === "SCHOOL_ADMIN" || role === "HOD" || role === "HR";
    const [markingNote, setMarkingNote] = useState<any>(null);
    const [viewingNote, setViewingNote] = useState<any>(null);

    const LessonNoteForm = ({
      item,
      isViewOnly,
    }: {
      item?: any;
      isViewOnly?: boolean;
    }) => {
      const teacherId = item?.teacher_id || currentStaff?.id;
      const teacherSubjects = subjects.filter((s) => {
        if (isApprover) return true;
        return (
          s.teacher_id === teacherId ||
          (s.classes || []).some((c: any) => c.teacher_id === teacherId)
        );
      });
      const [selectedSub, setSelectedSub] = useState(item?.subject || "");
      const currentSubjectData = teacherSubjects.find(
        (s) => s.name === selectedSub,
      );
      const assignedClassIds = currentSubjectData
        ? (currentSubjectData.classes || []).map((c: any) => c.id)
        : [];
      const filteredClasses = isApprover
        ? classes
        : selectedSub && currentSubjectData && assignedClassIds.length > 0
          ? classes.filter((c) => assignedClassIds.includes(c.id))
          : classes; // show all pre-filtered classes when no subject selected

      return (
        <div className="space-y-4">
          {isApprover ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('teacher')}
              </label>
              <select
                name="teacher_id"
                defaultValue={item?.teacher_id || currentStaff?.id || ""}
                required
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="">Select Teacher...</option>
                {(staffList || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="hidden"
              name="teacher_id"
              value={item?.teacher_id || currentStaff?.id || ""}
            />
          )}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('subject')}
              </label>
              <select
                name="subject"
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                required
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="">Select Subject...</option>
                {teacherSubjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between">
                {item ? "Class" : "Select Class(es)"}
                {!item && filteredClasses.length > 0 && (
                  <span className="text-[10px] text-indigo-600 lowercase font-medium italic">
                    You can select multiple sections
                  </span>
                )}
              </label>
              {item ? (
                <select
                  name="class_id"
                  defaultValue={item?.class_id}
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                >
                  <option value="">{t('select_option_placeholder')}</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl max-h-48 overflow-y-auto">
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((c) => (
                      <label 
                        key={c.id} 
                        className="flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-all group"
                      >
                        <input
                          type="checkbox"
                          name="class_id"
                          value={c.id}
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">
                          {c.name} {c.section}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="col-span-full text-center py-4 text-xs text-zinc-400 italic">
                      No classes available for this subject.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              {t('topic')}
            </label>
            <input
              type="text"
              name="topic"
              defaultValue={item?.topic}
              required
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">
              {t('content')}
            </label>
            <textarea
              name="content"
              defaultValue={item?.content}
              rows={5}
              required
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
            />
          </div>
          {isApprover && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('status')}
              </label>
              <select
                name="status"
                defaultValue={item?.status || "Pending"}
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
              >
                <option value="Pending">{t('pending')}</option>
                <option value="Approved">{t('approved')}</option>
                <option value="Rejected">{t('rejected')}</option>
              </select>
            </div>
          )}
        </div>
      );
    };

    const groupedData = React.useMemo(() => {
      const groups = new Map();
      (data || []).forEach(note => {
         const key = `${note.teacher_id}_${note.subject}_${note.topic}_${note.status}_${note.created_at ? note.created_at.slice(0, 10) : ''}`;
         if (!groups.has(key)) {
            groups.set(key, { 
              ...note, 
              grouped_ids: [note.id], 
              classes: [{ id: note.class_id, name: note.class_name, section: note.class_section }] 
            });
         } else {
            const existing = groups.get(key);
            existing.grouped_ids.push(note.id);
            existing.classes.push({ id: note.class_id, name: note.class_name, section: note.class_section });
         }
      });
      return Array.from(groups.values());
    }, [data]);

    return (
      <div className="space-y-6">
        <DataTable
          title={t('lesson_notes')}
          data={groupedData}
          onSave={async (itemData) => {
            if (itemData && itemData.grouped_ids && itemData.grouped_ids.length > 1) {
              for (const id of itemData.grouped_ids) {
                await onSave?.({ ...itemData, id });
              }
            } else {
              await onSave?.(itemData);
            }
          }}
          onDelete={role === "STAFF" ? undefined : onDelete}
          onAdd={onSave ? () => {} : undefined}
          onView={(item) => setViewingNote(item)}
          autoModal={true}
          columns={[
            ...(isApprover
              ? [
                  {
                    header: "Teacher",
                    accessor: (item: any) => item.teacher_name,
                    className: "font-bold",
                  },
                ]
              : []),
            {
              header: "Class",
              accessor: (item: any) =>
                item.classes && item.classes.length > 0
                  ? item.classes
                      .map((c: any) => `${c.name} ${c.section || ""}`.trim())
                      .filter((n: string) => n !== "N/A" && n !== "")
                      .join(", ") || "N/A"
                  : item.class_name
                  ? `${item.class_name} ${item.class_section || ""}`
                  : "N/A",
            },
            { header: "Subject", accessor: (item: any) => item.subject },
            { header: "Topic", accessor: (item: any) => item.topic },
            {
              header: "Date Submitted",
              accessor: (item: any) =>
                item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "N/A",
            },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : item.status === "Draft"
                          ? "bg-zinc-100 text-zinc-500"
                          : "bg-red-50 text-red-600",
                  )}
                >
                  {item.status}
                </span>
              ),
            },
            {
              header: "Marks",
              accessor: (item: any) =>
                item.marks ? (
                  <span className="font-bold text-amber-600 tracking-tight">
                    {item.marks}%
                  </span>
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
          ]}
          extraActions={(item: any) => {
            const handleBulkAction = async (status: string) => {
              if (item.grouped_ids && item.grouped_ids.length > 1) {
                for (const id of item.grouped_ids) {
                  await onSave?.({ ...item, id, status });
                }
              } else {
                await onSave?.({ ...item, status });
              }
            };

            return (
              <>
                {!isApprover && item.status === "Draft" && (
                  <button
                    onClick={() => handleBulkAction("Pending")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send to Admin
                  </button>
                )}
                {isApprover && item.status !== "Approved" && (
                  <button
                    onClick={() => handleBulkAction("Approved")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                )}
                {isApprover && item.status !== "Rejected" && (
                  <button
                    onClick={() => handleBulkAction("Rejected")}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
                {isApprover && (
                  <button
                    onClick={() => setMarkingNote(item)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    Add Marks
                  </button>
                )}
              </>
            );
          }}
          renderForm={(item: any, isViewOnly) => (
            <LessonNoteForm item={item} isViewOnly={isViewOnly} />
          )}
        />

        <Modal
          isOpen={!!viewingNote}
          onClose={() => setViewingNote(null)}
          title={t('view_lesson_note')}
        >
          <div className="space-y-6 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Teacher
                </p>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {viewingNote?.teacher_name}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Subject & Topic
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                    {viewingNote?.subject}
                  </span>
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {viewingNote?.topic}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                  Class(es)
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {viewingNote?.classes && viewingNote.classes.length > 0 ? (
                    viewingNote.classes.map((c: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-bold">
                        {c.name} {c.section || ""}
                      </span>
                    ))
                  ) : viewingNote?.class_name ? (
                    <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-bold">
                      {viewingNote.class_name} {viewingNote.class_section || ""}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">N/A</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right">
                  Status
                </p>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider block text-center",
                    viewingNote?.status === "Approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : viewingNote?.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600",
                  )}
                >
                  {viewingNote?.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('lesson_content')}
                </h3>
                <button
                  onClick={() => {
                    const printClasses = viewingNote?.classes && viewingNote.classes.length > 0 
                      ? viewingNote.classes.map((c: any) => `${c.name} ${c.section || ''}`).join(', ') 
                      : viewingNote?.class_name 
                        ? `${viewingNote.class_name} ${viewingNote.class_section || ''}` 
                        : 'N/A';

                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Lesson Note: ${viewingNote.topic}</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.8; color: #111; }
                              .header { border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 20px; }
                              .meta { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
                              h1 { font-size: 28px; margin-bottom: 10px; }
                              .content { white-space: pre-wrap; font-size: 16px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Lesson Note: ${viewingNote.topic}</h1>
                              <div class="meta">
                                <span><strong>Teacher:</strong> ${viewingNote.teacher_name}</span>
                                <span><strong>Class(es):</strong> ${printClasses}</span>
                                <span><strong>Subject:</strong> ${viewingNote.subject}</span>
                                <span><strong>Date:</strong> ${new Date(viewingNote.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div class="content">${viewingNote.content}</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Download className="w-3 h-3" />
                  {t('download_pdf')}
                </button>
              </div>
              <div className="text-base text-zinc-800 dark:text-zinc-200 leading-loose whitespace-pre-wrap font-serif bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 min-h-[400px] shadow-inner">
                {viewingNote?.content || "No content provided."}
              </div>
            </div>

            {viewingNote?.feedback && (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-800/50 space-y-2">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Supervisor Feedback & Marks ({viewingNote.marks}%)
                </h4>
                <p className="text-sm italic text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  "{viewingNote.feedback}"
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setViewingNote(null)}
                className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg"
              >
                Close Reader
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!markingNote}
          onClose={() => setMarkingNote(null)}
          title={t('appraise_lesson_note')}
        >
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onSave?.({
                ...markingNote,
                marks: Number(formData.get("marks")),
                feedback: formData.get("feedback"),
                status: "Approved",
              });
              setMarkingNote(null);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('award_marks')}
              </label>
              <input
                type="number"
                name="marks"
                defaultValue={markingNote?.marks}
                required
                min="0"
                max="100"
                placeholder="e.g. 85"
                className="w-full px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm font-bold text-amber-600 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                {t('supervisor_feedback')}
              </label>
              <textarea
                name="feedback"
                defaultValue={markingNote?.feedback}
                rows={4}
                placeholder="Optional feedback..."
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMarkingNote(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('save_marks_approve')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  RolesPermissions: ({
    staff = [],
    onSave,
  }: {
    staff?: any[];
    onSave?: (data: any) => void;
  }) => {
    const { t } = useLanguage();
    const [editingStaff, setEditingStaff] = useState<any | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedAdditionalRoles, setSelectedAdditionalRoles] = useState<
      string[]
    >([]);
    const [primaryRole, setPrimaryRole] = useState("");

    const availableRoles = [
      "SCHOOL_ADMIN",
      "STAFF",
      "HOD",
      "FINANCE",
      "LIBRARIAN",
      "NON_STAFF",
      "PARENT",
      "STUDENT",
    ];

    const handleOpenModal = (item: any) => {
      setEditingStaff(item);
      setPrimaryRole(item.role || "");
      setSelectedAdditionalRoles(item.additional_roles || []);
      setIsRoleModalOpen(true);
    };

    const handleSaveRoles = async () => {
      if (editingStaff && onSave) {
        await onSave({
          ...editingStaff,
          role: primaryRole,
          additional_roles: selectedAdditionalRoles,
        });
        setIsRoleModalOpen(false);
      }
    };

    const toggleAdditionalRole = (role: string) => {
      setSelectedAdditionalRoles((prev) =>
        prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {t('roles_permissions_mgmt')}
              </h2>
              <p className="text-sm text-zinc-500">
                Assign multiple roles to staff members to enable role switching.
              </p>
            </div>
          </div>

          <DataTable<any>
            title={t('staff_role_assignments')}
            data={staff}
            columns={[
              {
                header: "Staff Name",
                accessor: "name",
                className: "font-bold",
              },
              {
                header: "Primary Role",
                accessor: (item: any) => (
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {item.role}
                  </span>
                ),
              },
              {
                header: "Additional Roles",
                accessor: (item: any) => (
                  <div className="flex flex-wrap gap-1">
                    {item.additional_roles &&
                    item.additional_roles.length > 0 ? (
                      item.additional_roles.map((role: string) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">None</span>
                    )}
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: (item: any) => (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      item.status === "Active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600",
                    )}
                  >
                    {item.status}
                  </span>
                ),
              },
            ]}
            onEdit={handleOpenModal}
          />
        </div>

        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title={`Manage Roles for ${editingStaff?.name}`}
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
              >
                {t('save_permissions')}
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Primary Role (Default Login)
              </label>
              <select
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Additional Authorized Roles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableRoles
                  .filter((r) => r !== primaryRole)
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleAdditionalRole(role)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all",
                        selectedAdditionalRoles.includes(role)
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400",
                      )}
                    >
                      <span>{role}</span>
                      {selectedAdditionalRoles.includes(role) && (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                **Security Note:** Assigning additional roles allows the staff
                member to switch contexts without logging out. Ensure they have
                the necessary clearances for each selected role.
              </p>
            </div>
          </div>
        </Modal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
              Role Switching Logic
            </h3>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>
                  Staff with multiple roles will see a "Switch Role" option in
                  their profile menu.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>
                  Permissions are dynamically updated based on the currently
                  active role.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                <span>Primary role remains the default login role.</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 transition-colors">
                Audit Permissions
              </button>
              <button className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 transition-colors">
                Reset All Roles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  StaffManagement: ({
    role,
    data,
    departments = [],
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data: any[];
    departments?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { t } = useLanguage();
    const [showSalary, setShowSalary] = useState(false);
    const isStaff = role === "STAFF";

    return (
      <DataTable
        title={isStaff ? "My Profile" : "Staff Management"}
        data={data}
        onSave={onSave}
        onEdit={onSave}
        onDelete={onDelete}
        onAdd={onSave ? () => {} : undefined}
        initialViewItem={isStaff && data.length === 1 ? data[0] : undefined}
        renderForm={(item, isViewOnly) => {
          if (isViewOnly && item) {
            return (
              <div className="space-y-8 p-2">
                <div className="flex items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                      <User className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                          {item.role}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            item.status === "Active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600",
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isStaff && (
                    <button
                      onClick={() => setShowSalary(!showSalary)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 transition-all shadow-sm"
                    >
                      {showSalary ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      {showSalary
                        ? t('hide_sensitive_info')
                        : t('view_sensitive_info')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        {t('contact_information')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            Email Address
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.email}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            Phone Number
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            Date of Birth
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.date_of_birth
                              ? new Date(item.date_of_birth).toLocaleDateString(
                                  undefined,
                                  { dateStyle: "medium" },
                                )
                              : "Not Set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        {t('organizational_role')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('department')}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.department_name || t('no_department')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('reports_to')}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.reports_to_name || t('no_manager')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('monthly_salary')}
                          </span>
                          <span className="font-bold text-emerald-600">
                            {!isStaff || showSalary
                              ? item.salary
                                ? `GH₵${Number(item.salary).toLocaleString()}`
                                : t('not_set')
                              : "GH₵xxxxxx"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('allowances')}
                          </span>
                          <span className="font-bold text-indigo-600">
                            {!isStaff || showSalary
                              ? item.allowances
                                ? `GH₵${Number(item.allowances).toLocaleString()}`
                                : "GH₵0"
                              : "GH₵xxxxxx"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('deductions')}
                          </span>
                          <span className="font-bold text-red-600">
                            {!isStaff || showSalary
                              ? item.deductions
                                ? `GH₵${Number(item.deductions).toLocaleString()}`
                                : "GH₵0"
                              : "GH₵xxxxxx"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-zinc-50 dark:border-zinc-800 pt-2 mt-2">
                          <span className="font-bold text-zinc-500">
                            {t('annual_leave_limit')}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {item.annual_leave_limit || 20} {t('days')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('current_leave_balance')}
                          </span>
                          <span className="font-bold text-amber-600">
                            {item.leave_balance ??
                              (item.annual_leave_limit || 20)}{" "}
                            {t(item.leave_limit_unit?.toLowerCase() || 'days')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500">
                            {t('carried_over')}
                          </span>
                          <span className="font-bold text-indigo-600">
                            {item.carried_over_balance || 0}{" "}
                            {t(item.leave_limit_unit?.toLowerCase() || 'days')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        System Access
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-zinc-500 text-xs font-bold block mb-2 uppercase opacity-60">
                            Additional Authorized Roles
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.additional_roles &&
                            item.additional_roles.length > 0 ? (
                              item.additional_roles.map((r: string) => (
                                <span
                                  key={r}
                                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                >
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-400 italic">
                                None assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
                        Date Joined
                      </p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {new Date(item.created_at).toLocaleDateString(
                          undefined,
                          { dateStyle: "long" },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          // Form rendering logic continues...

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('full_name')}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={item?.name}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('email_address')}
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={item?.email}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('phone_number')}
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={item?.phone}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  defaultValue={
                    item?.date_of_birth
                      ? new Date(item.date_of_birth).toISOString().split("T")[0]
                      : ""
                  }
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('designation')}
                </label>
                <select
                  name="role"
                  defaultValue={item?.role || "STAFF"}
                  disabled={isViewOnly}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="HOD">HOD</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="NON_STAFF">NON_STAFF</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('additional_roles')} ({t('select_multiple_hint')})
                </label>
                <select
                  name="additional_roles"
                  multiple
                  defaultValue={item?.additional_roles || []}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] disabled:opacity-50"
                >
                  <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="HOD">HOD</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="NON_STAFF">NON_STAFF</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Department
                </label>
                <select
                  name="department_id"
                  defaultValue={item?.department_id}
                  disabled={isViewOnly}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const dept = departments.find((d: any) => d.id === deptId);
                    if (dept && dept.hod_id) {
                      const reportsToSelect = document.querySelector(
                        'select[name="reports_to"]',
                      ) as HTMLSelectElement;
                      if (reportsToSelect) {
                        reportsToSelect.value = dept.hod_id;
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">{t('no_department')}</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Reports To
                </label>
                <select
                  name="reports_to"
                  defaultValue={item?.reports_to}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">No Manager</option>
                  {data
                    .filter((s) => s.id !== item?.id)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={item?.status || "Active"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Active">{t('active')}</option>
                  <option value="Inactive">{t('inactive')}</option>
                  <option value="On Leave">{t('on_leave')}</option>
                </select>
              </div>
              {!item && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {t('default_password')}
                  </label>
                  <input
                    type="text"
                    name="password"
                    readOnly
                    value="zxcv123$$"
                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm outline-none cursor-not-allowed text-zinc-500"
                  />
                  <p className="text-[10px] text-zinc-400">
                    This password will be assigned to the new teacher account by
                    default.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('monthly_salary')} (GH₵)
                </label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={item?.salary || ""}
                  disabled={isViewOnly}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('allowances')} (GH₵)
                </label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={item?.allowances || ""}
                  disabled={isViewOnly}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {t('deductions')} (GH₵)
                </label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={item?.deductions || ""}
                  disabled={isViewOnly}
                  placeholder="e.g. 200"
                  className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2 col-span-2">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4">
                  {t('leave_configuration')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Leave Limit Unit
                    </label>
                    <select
                      name="leave_limit_unit"
                      defaultValue={item?.leave_limit_unit || "Days"}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {t('annual_leave_limit')}
                    </label>
                    <input
                      type="number"
                      name="annual_leave_limit"
                      defaultValue={item?.annual_leave_limit || 20}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Current Leave Balance
                    </label>
                    <input
                      type="number"
                      name="leave_balance"
                      defaultValue={
                        item?.leave_balance ?? (item?.annual_leave_limit || 20)
                      }
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Carried Over Balance
                    </label>
                    <input
                      type="number"
                      name="carried_over_balance"
                      defaultValue={item?.carried_over_balance || 0}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }}
        columns={[
          { header: t('name'), accessor: "name", className: "font-bold" },
          { header: t('role'), accessor: "role" },
          { header: t('department'), accessor: "department_name" },
          {
            header: t('salary'),
            accessor: (item: any) =>
              item.salary ? (
                <span className="font-bold text-emerald-600">
                  GH₵{Number(item.salary).toLocaleString()}
                </span>
              ) : (
                <span className="text-zinc-300">—</span>
              ),
          },
          {
            header: t('status'),
            accessor: (item: any) => (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  item.status === "Active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600",
                )}
              >
                {t(item.status?.toLowerCase() || 'active')}
              </span>
            ),
          },
        ]}
        extraActions={(item) => (
          <>
            {item.status === "Active" ? (
              <button
                onClick={() => onSave?.({ ...item, status: "Inactive" })}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                Deactivate Account
              </button>
            ) : (
              <button
                onClick={() => onSave?.({ ...item, status: "Active" })}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Activate Account
              </button>
            )}
          </>
        )}
      />
    );
  },
  StaffAttendance: ({
    role,
    data,
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { t } = useLanguage();
    return (
      <DataTable
      title={`Staff Attendance`}
      data={data}
      onSave={onSave}
      onDelete={onDelete}
      columns={[
        {
          header: "Staff Name",
          accessor: (item: any) => item.staff_name,
          className: "font-bold",
        },
        { header: t('date'), accessor: (item: any) => item.date },
        { header: "In", accessor: (item: any) => item.check_in },
        { header: "Out", accessor: (item: any) => item.check_out },
        {
          header: t('status'),
          accessor: (item: any) => (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.status === "Present"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              {item.status}
            </span>
          ),
        },
      ]}
      onAdd={onSave ? () => {} : undefined}
    />
    );
  },
  Recruitment: ({
    role,
    data,
    onSave,
    onDelete,
    departments = [],
    onHire,
    onFetchOfferLetter,
    organization,
    documentTemplates,
    onRefreshTemplates,
  }: {
    role?: UserRole;
    data: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    departments?: any[];
    onHire?: (id: string, data: any) => void;
    onFetchOfferLetter?: (id: string) => Promise<any>;
    organization?: any;
    documentTemplates?: any[];
    onRefreshTemplates?: () => Promise<void>;
  }) => {
    const { t } = useLanguage();
    const [hiringApplicant, setHiringApplicant] = useState<any | null>(null);
    const [qualifyingApplicant, setQualifyingApplicant] = useState<any | null>(
      null,
    );
    const [viewingOfferLetter, setViewingOfferLetter] = useState<any | null>(
      null,
    );
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    const handleHire = async (id: string, formData: any) => {
      if (onHire) {
        await onHire(id, formData);
        setHiringApplicant(null);
      }
    };

    const handleQualify = async (id: string, formData: any) => {
      if (onSave) {
        await onSave({
          ...qualifyingApplicant,
          status: "Qualified",
          salary: Number(formData.salary),
          allowances: Number(formData.allowances),
          deductions: Number(formData.deductions),
          department_id: formData.department_id,
        });
        setQualifyingApplicant(null);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsDesignerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Palette className="w-4 h-4" />
            Design Offer Letter Template
          </button>
        </div>
        <DataTable
          title={t('recruitment_portal')}
          data={data}
          onSave={onSave}
          onEdit={() => {}}
          onDelete={onDelete}
          columns={[
            { header: t('applicant'), accessor: "name", className: "font-bold" },
            { header: t('position'), accessor: "position" },
            { header: t('email'), accessor: "email" },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Hired"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Qualified"
                        ? "bg-indigo-50 text-indigo-600"
                        : item.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-zinc-50 text-zinc-600",
                  )}
                >
                  {t(item.status?.toLowerCase().replace(' ', '_') || 'status')}
                </span>
              ),
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('full_name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={item?.name}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('position')}
                  </label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={item?.position}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={item?.email}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={item?.phone}
                    required
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={item?.status || "In Review"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                >
                  <option value="In Review">{t('in_review')}</option>
                  <option value="Interviewed">{t('interviewed')}</option>
                  <option value="Qualified">{t('qualified')}</option>
                  <option value="Hired">{t('hired')}</option>
                  <option value="Rejected">{t('rejected')}</option>
                </select>
              </div>
              {item?.status === "Qualified" && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400">
                    Proposed Package
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">
                        Basic Salary
                      </label>
                      <input
                        type="number"
                        name="salary"
                        defaultValue={item?.salary}
                        disabled={isViewOnly}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">
                        Allowances
                      </label>
                      <input
                        type="number"
                        name="allowances"
                        defaultValue={item?.allowances}
                        disabled={isViewOnly}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">
                        Deductions
                      </label>
                      <input
                        type="number"
                        name="deductions"
                        defaultValue={item?.deductions}
                        disabled={isViewOnly}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          extraActions={(item) => (
            <>
              {item.status !== "Qualified" && item.status !== "Hired" && (
                <button
                  onClick={() => setQualifyingApplicant(item)}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('mark_qualified')}
                </button>
              )}
              {item.status === "Qualified" && (
                <button
                  onClick={() => setHiringApplicant(item)}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  {t('hire_candidate')}
                </button>
              )}
              {(item.status === "Qualified" || item.status === "Hired") && (
                <button
                  onClick={async () => {
                    const res = await onFetchOfferLetter?.(item.id);
                    setViewingOfferLetter(res);
                  }}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {t('view_offer_letter')}
                </button>
              )}
            </>
          )}
        />

        {/* Qualify Modal */}
        <Modal
          isOpen={!!qualifyingApplicant}
          onClose={() => setQualifyingApplicant(null)}
          title={`${t('mark_qualified')}: ${qualifyingApplicant?.name}`}
        >
          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleQualify(
                qualifyingApplicant.id,
                Object.fromEntries(formData),
              );
            }}
          >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                {t('qualify_candidate_desc').replace('{name}', qualifyingApplicant?.name || t('candidate'))}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Department
              </label>
              <select
                name="department_id"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Basic Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={qualifyingApplicant?.salary || 0}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Allowances
                </label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={qualifyingApplicant?.allowances || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Deductions
                </label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={qualifyingApplicant?.deductions || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setQualifyingApplicant(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
              >
                {t('mark_qualified')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Hire Modal */}
        <Modal
          isOpen={!!hiringApplicant}
          onClose={() => setHiringApplicant(null)}
          title={`${t('hire_candidate_title').replace('{name}', hiringApplicant?.name || t('candidate'))}`}
        >
          <form
            className="p-6 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleHire(hiringApplicant.id, Object.fromEntries(formData));
            }}
          >
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('hire_candidate_desc').replace('{name}', hiringApplicant?.name || t('candidate'))}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Department
              </label>
              <select
                name="department_id"
                defaultValue={hiringApplicant?.department_id}
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Basic Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={hiringApplicant?.salary || 0}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Allowances
                </label>
                <input
                  type="number"
                  name="allowances"
                  defaultValue={hiringApplicant?.allowances || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-indigo-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  Deductions
                </label>
                <input
                  type="number"
                  name="deductions"
                  defaultValue={hiringApplicant?.deductions || 0}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setHiringApplicant(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {t('confirm_hire')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Offer Letter Modal */}
        <Modal
          isOpen={!!viewingOfferLetter}
          onClose={() => setViewingOfferLetter(null)}
          title={t('offer_letter')}
        >
          <div className="p-6 space-y-6">
            <div className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-inner max-h-[500px] overflow-y-auto whitespace-pre-wrap font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {viewingOfferLetter?.letter}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const template = (documentTemplates || [])
                    .filter((t) => t.type === "OfferLetter")
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                    )[0];

                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    let printHtml = "";

                    if (template) {
                      const config = template.layout_config || {};
                      let body =
                        config.content || viewingOfferLetter.letter || "";

                      const replacements: Record<string, string> = {
                        "{{staff_name}}":
                          viewingOfferLetter?.name || "Candidate Name",
                        "{{position}}": viewingOfferLetter?.position || "Staff",
                        "{{salary}}": viewingOfferLetter?.salary
                          ? `GH₵${viewingOfferLetter.salary}`
                          : "N/A",
                        "{{join_date}}": new Date().toLocaleDateString(),
                        "{{department}}":
                          departments.find(
                            (d: any) =>
                              d.id === viewingOfferLetter?.department_id,
                          )?.name || "N/A",
                        "{{school_name}}": organization?.name || "The School",
                        "{{school_logo}}": organization?.logo
                          ? `<img src="${organization.logo}" style="max-height: 80px; display: block; margin: 0 auto;" alt="Logo" />`
                          : "",
                        "{{principal_signature}}": organization?.signature
                          ? `<img src="${organization.signature}" style="max-height: 50px;" alt="Signature" />`
                          : "",
                      };

                      Object.entries(replacements).forEach(([key, value]) => {
                        body = body.split(key).join(value);
                      });

                      printHtml = `
                        <html>
                          <head>
                            <title>Offer Letter</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                              .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                              .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
                              ${config.styles || ""}
                            </style>
                          </head>
                          <body>
                            <div class="header">${config.headerText || ""}</div>
                            <div class="letter-body">${body}</div>
                            <div class="footer">${config.footerText || ""}</div>
                          </body>
                        </html>
                      `;
                    } else {
                      // Standard Fallback
                      printHtml = `
                        <html>
                          <head>
                            <title>Offer Letter</title>
                            <style>
                              body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                              .header { display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 40px; padding-bottom: 20px; }
                              .logo { max-height: 100px; margin-bottom: 10px; }
                              .school-name { font-size: 24px; font-bold; color: #1e1b4b; margin: 0; }
                              .school-info { font-size: 12px; color: #666; margin: 2px 0; }
                              .letter-body { white-space: pre-wrap; font-size: 16px; min-height: 400px; }
                              .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
                              .signature-box { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
                              .signature-img { max-height: 60px; object-fit: contain; }
                              .signatory-name { font-weight: bold; margin: 0; }
                              .signatory-title { font-size: 14px; color: #444; margin: 0; }
                              @media print { body { padding: 0; } .header { margin-top: 20px; } }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                              <h1 class="school-name">${organization?.name || "School Offer Letter"}</h1>
                              <p class="school-info">${organization?.support_email || ""}</p>
                            </div>
                            
                            <div class="letter-body">${viewingOfferLetter.letter}</div>
                            
                            <div class="footer">
                              <div class="signature-box">
                                <p>Sincerely,</p>
                                ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" alt="Signature" />` : '<div style="height: 60px;"></div>'}
                                <p class="signatory-name">The Principal</p>
                                <p class="signatory-title">${organization?.name || "School Administration"}</p>
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
                }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                  <Download className="w-4 h-4" />
                  {t('print_download_pdf')}
                </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDesignerOpen}
          onClose={() => setIsDesignerOpen(false)}
          title={t('offer_letter_designer')}
          maxWidth="max-w-5xl"
          maxHeight="max-h-[90vh]"
        >
          <div className="p-6">
            <DocumentBuilder
              data={documentTemplates}
              onRefresh={onRefreshTemplates}
              organization={organization}
              lockedType="OfferLetter"
              hideTypeSelect={true}
            />
          </div>
        </Modal>
      </div>
    );
  },

  LeaveManagement: ({
    role,
    data,
    staffList,
    currentUser,
    organization,
    onSave,
    onDelete,
    onResetBalances,
    onUpdateOrganization,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentUser?: any;
    organization?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    onResetBalances?: () => void;
    onUpdateOrganization?: (data: any) => void;
  }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<"requests" | "settings">(
      "requests",
    );
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const canApprove =
      role === "SCHOOL_ADMIN" || role === "HR" || role === "HOD";
    const isStaff = role === "STAFF";

    // Filter data based on role
    const hodStaffRecord = (staffList || []).find(
      (s) =>
        String(s.email).toLowerCase().trim() ===
        String(currentUser?.email).toLowerCase().trim(),
    );
    const hodDeptId = hodStaffRecord?.department_id
      ? String(hodStaffRecord.department_id).toLowerCase()
      : null;
    const hodDeptStaffIds = new Set(
      (staffList || [])
        .filter(
          (s) =>
            s.department_id &&
            hodDeptId &&
            String(s.department_id).toLowerCase() === hodDeptId,
        )
        .map((s) => String(s.id).toLowerCase()),
    );

    const filteredData =
      isStaff && !canApprove
        ? (data || []).filter(
            (item) =>
              String(item.user_id) === String(currentUser?.id) ||
              String(item.staff_id) === String(currentUser?.id) ||
              String(item.email) === String(currentUser?.email),
          )
        : role === "HOD"
          ? (data || []).filter((item) => {
              // HOD sees their own requests + requests from their department staff
              const isOwn =
                String(item.user_id) === String(currentUser?.id) ||
                String(item.staff_id) === String(currentUser?.id) ||
                String(item.email) === String(currentUser?.email);
              const isFromDept =
                item.staff_id &&
                hodDeptStaffIds.has(String(item.staff_id).toLowerCase());
              return isOwn || isFromDept;
            })
          : data || [];

    const staffMember = (staffList || []).find(
      (s) =>
        String(s.id) === String(currentUser?.id) ||
        String(s.email) === String(currentUser?.email),
    );

    const stats = [
      {
        label: isStaff ? t('my_requests') : t('total_requests'),
        value: filteredData.length,
        icon: ClipboardList,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Pending",
        value: filteredData.filter((item) => item.status === "Pending").length,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "Approved",
        value: filteredData.filter((item) => item.status === "Approved").length,
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: t('rejected'),
        value: filteredData.filter((item) => item.status === "Rejected").length,
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              {t('leave_management')}
            </h2>
            <p className="text-sm text-zinc-500">
              {t('leave_management_desc')}
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === "requests"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              {t('requests')}
            </button>
            {(role === "SCHOOL_ADMIN" || role === "HR") && (
              <button
                onClick={() => setActiveTab("settings")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "settings"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
                )}
              >
                {t('settings')}
              </button>
            )}
          </div>
        </div>

        {activeTab === "requests" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "requests" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              {(role === "SCHOOL_ADMIN" || role === "HR") && (
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('year_reset')}
                </button>
              )}
            </div>
            <DataTable
              title={isStaff ? t('my_leave_history') : t('leave_requests')}
              data={filteredData}
              onSave={onSave}
              onDelete={isStaff ? undefined : onDelete}
              onEdit={isStaff ? undefined : () => {}}
              columns={[
                {
                  header: t('requester'),
                  accessor: (item: any) => item.staff_name,
                  className: "font-bold",
                },
                { header: t('leave_type_label'), accessor: (item: any) => item.leave_type },
                {
                  header: t('duration'),
                  accessor: (item: any) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {item.leave_days || 0}{" "}
                        {item.leave_days === 1 ? t('day') : t('days')}
                      </span>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {item.start_date
                          ? new Date(item.start_date).toLocaleDateString()
                          : ""}{" "}
                        -{" "}
                        {item.end_date
                          ? new Date(item.end_date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Relief Staff",
                  accessor: (item: any) => (
                    <div className="flex items-center gap-2">
                      {item.relief_staff_name ? (
                        <>
                          <User className="w-3 h-3 text-zinc-400" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">
                            {item.relief_staff_name}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          No relief assigned
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  header: t('status'),
                  accessor: (item: any) => (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        item.status === "Approved"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          : item.status === "Pending"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                            : "bg-red-50 text-red-600 dark:bg-red-900/20",
                      )}
                    >
                      {item.status}
                    </span>
                  ),
                },
              ]}
              extraActions={(item: any) => (
                <div className="flex flex-col gap-1">
                  {canApprove && item.status === "Pending" && (
                    <>
                      <button
                        onClick={() =>
                          onSave?.({ ...item, status: "Approved" })
                        }
                        className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Request
                      </button>
                      <button
                        onClick={() =>
                          onSave?.({ ...item, status: "Rejected" })
                        }
                        className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Request
                      </button>
                    </>
                  )}
                </div>
              )}
              onAdd={onSave ? () => {} : undefined}
              renderForm={(item: any, isViewOnly) => (
                <div className="space-y-4">
                  {!isStaff || canApprove ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Requester (On Leave)
                      </label>
                      <select
                        name="staff_id"
                        defaultValue={
                          item?.staff_id || (isStaff ? currentUser?.id : "")
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      >
                        <option value="">Select Staff...</option>
                        {(staffList || []).map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.department_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Requester
                      </label>
                      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-900 dark:text-white">
                        {staffMember?.name || currentUser?.name}
                      </div>
                      <input
                        type="hidden"
                        name="staff_id"
                        value={item?.staff_id || currentUser?.id}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Relief Staff (Stepping In)
                    </label>
                    <select
                      name="relief_staff_id"
                      defaultValue={item?.relief_staff_id}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      <option value="">No Relief Assigned (Optional)</option>
                      {(staffList || [])
                        .filter((s: any) => {
                          // Current staff user lookup (either the one in item or current user)
                          const currentReqId = item?.staff_id || item?.user_id || currentUser?.id;
                          const currentReqEmail =
                            item?.email || currentUser?.email;

                          const requester = (staffList || []).find(
                            (r) =>
                              (r.email &&
                                currentReqEmail &&
                                r.email === currentReqEmail) ||
                              (r.staff_id &&
                                currentReqId &&
                                String(r.staff_id) === String(currentReqId)) ||
                              (r.user_id &&
                                currentReqId &&
                                String(r.user_id) === String(currentReqId)) ||
                              (r.id &&
                                currentReqId &&
                                String(r.id) === String(currentReqId)),
                          );

                          if (!requester || !requester.department_id)
                            return true;

                          // Show staff from the same department, excluding the requester
                          return (
                            String(s.department_id) ===
                              String(requester.department_id) &&
                            String(s.id) !== String(requester.id)
                          );
                        })
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.department_name})
                          </option>
                        ))}
                    </select>
                  </div>
                  {(canApprove || item?.status) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={item?.status || "Pending"}
                        disabled={isViewOnly || !canApprove}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  )}
                  {isStaff && !canApprove && !item?.status && (
                    <input type="hidden" name="status" value="Pending" />
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Leave Type
                    </label>
                    <select
                      name="leave_type"
                      defaultValue={item?.leave_type}
                      required
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      <option value="">Select Type...</option>
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                      <option value="Paternity Leave">Paternity Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={
                          item?.start_date
                            ? new Date(item.start_date)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={
                          item?.end_date
                            ? new Date(item.end_date)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        required
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Reason
                    </label>
                    <textarea
                      name="reason"
                      defaultValue={item?.reason}
                      rows={3}
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Leave Defaults
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Configure global leave settings for all staff members.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  onUpdateOrganization?.({
                    default_leave_limit: parseInt(
                      formData.get("default_leave_limit") as string,
                    ),
                    default_leave_limit_unit: formData.get(
                      "default_leave_limit_unit",
                    ) as string,
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Default Annual Limit
                    </label>
                    <input
                      type="number"
                      name="default_leave_limit"
                      defaultValue={organization?.default_leave_limit || 20}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Leave Unit
                    </label>
                    <select
                      name="default_leave_limit_unit"
                      defaultValue={
                        organization?.default_leave_limit_unit || "Days"
                      }
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={() => onResetBalances?.()}
          title={t('year_reset')}
          message={t('reset_confirm_msg')}
          confirmText={t('reset_confirm_btn')}
          type="warning"
        />
      </div>
    );
  },
  Payroll: ({
    role,
    data = [],
    staffList = [],
    currentUser,
    organization,
    onSave,
    onDelete,
    onRunPayroll,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentUser?: any;
    organization?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    onRunPayroll?: (monthYear: string) => void;
  }) => {
    const { t } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [showSalary, setShowSalary] = useState(false);

    const handlePrintPayslip = (item: any) => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payslip - ${item.name} - ${item.month}</title>
              <style>
                body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; border-radius: 12px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { max-height: 60px; }
                .school-info h1 { font-size: 20px; font-weight: 800; margin: 0; color: #1e1b4b; }
                .school-info p { font-size: 12px; color: #6b7280; margin: 2px 0; }
                .payslip-title { text-align: center; margin-bottom: 30px; }
                .payslip-title h2 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
                .payslip-title p { font-size: 14px; color: #6b7280; font-weight: 600; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 10px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; }
                .info-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .info-label { font-weight: 600; color: #4b5563; }
                .info-value { font-weight: 700; color: #111827; }
                .total-row { display: flex; justify-content: space-between; padding: 15px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
                .total-label { font-size: 16px; font-weight: 800; }
                .total-value { font-size: 18px; font-weight: 900; color: #4f46e5; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
                .signature-box { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; width: 200px; }
                .signature-img { max-height: 50px; margin-bottom: 5px; }
                @media print { body { padding: 0; } .container { border: none; } }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="school-info">
                    <h1>${organization?.name || "School Management System"}</h1>
                    <p>${organization?.support_email || ""}</p>
                    <p>${organization?.address || ""}</p>
                  </div>
                  ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                </div>

                <div class="payslip-title">
                  <h2>${t('pay_advice')}</h2>
                  <p>${t('period_for')} ${item.month}</p>
                </div>

                <div class="grid">
                  <div>
                    <div class="section-title">${t('employee_information')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('full_name')}:</span>
                      <span class="info-value">${item.name}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('employee_id')}:</span>
                      <span class="info-value">${String(item.id).slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div class="section-title">${t('payment_details')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('date')}:</span>
                      <span class="info-value">${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('status')}:</span>
                      <span class="info-value" style="color: ${item.status === "Paid" ? "#059669" : "#d97706"}">${item.status}</span>
                    </div>
                  </div>
                </div>

                <div class="grid">
                  <div>
                    <div class="section-title">${t('earnings')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('basic_salary')}:</span>
                      <span class="info-value">GH₵${Number(item.salary || 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${t('allowances')}:</span>
                      <span class="info-value">GH₵${Number(item.allowance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div class="section-title">${t('deductions')}</div>
                    <div class="info-item">
                      <span class="info-label">${t('total_deductions') || t('deductions')}:</span>
                      <span class="info-value">GH₵${Number(item.deductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div class="total-row">
                  <span class="total-label">${t('net_salary_payout')}:</span>
                  <span class="total-value">GH₵${Number(item.net || 0).toLocaleString()}</span>
                </div>

                <div class="footer">
                  <div>
                    <p style="font-size: 10px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">System Generated Document</p>
                  </div>
                  <div class="signature-box">
                    ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" />` : '<div style="height: 50px;"></div>'}
                    <p style="font-size: 12px; font-weight: 800; margin: 0;">${t('authorized_signature')}</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    // Map backend data (from /hr/payroll) into UI-friendly rows
    const mappedData = (
      data && data.length > 0
        ? data.map((item: any) => ({
            id: item.id,
            name: item.name,
            salary: item.basic_salary,
            allowance: item.allowances,
            deductions: item.deductions,
            net: item.net_salary,
            status: item.status,
            month: item.month_year,
          }))
        : []
    ) as any[];

    // Group data for summary
    const months = Array.from(new Set(mappedData.map((p) => p.month))).filter(
      Boolean,
    );
    const summaryData = months.map((m) => {
      const monthStaff = mappedData.filter((p) => p.month === m);
      return {
        id: m,
        month: m,
        staffCount: monthStaff.length,
        totalNet: monthStaff.reduce(
          (sum, p) => sum + parseFloat(p.net || 0),
          0,
        ),
      };
    });

    const isStaff = role === "STAFF";
    const staffName = currentUser ? currentUser.name : "John Doe";

    if (isStaff) {
      // Staff view (existing or simplified)
      const myPayroll = mappedData.filter((p) => p.name === staffName);
      return (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowSalary(!showSalary)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              {showSalary ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showSalary ? t('hide_salaries') : t('view_salaries')}
            </button>
          </div>
          <DataTable
            title={t('my_payroll_salary')}
            data={myPayroll}
            onView={(item) => handlePrintPayslip(item)}
            columns={[
              { header: "Month", accessor: "month", className: "font-bold" },
              {
                header: "Basic Salary",
                accessor: (item: any) =>
                  showSalary
                    ? `GH₵${Number(item.salary).toLocaleString()}`
                    : "GH₵xxxxxx",
              },
              {
                header: "Allowance",
                accessor: (item: any) =>
                  showSalary
                    ? `GH₵${Number(item.allowance).toLocaleString()}`
                    : "GH₵xxxxxx",
              },
              {
                header: "Deductions",
                accessor: (item: any) =>
                  showSalary
                    ? `GH₵${Number(item.deductions).toLocaleString()}`
                    : "GH₵xxxxxx",
              },
              {
                header: "Net Salary",
                accessor: (item: any) =>
                  showSalary
                    ? `GH₵${Number(item.net).toLocaleString()}`
                    : "GH₵xxxxxx",
                className: "font-bold text-indigo-600",
              },
              {
                header: "Payslip",
                accessor: (item: any) => (
                  <button
                    onClick={() => handlePrintPayslip(item)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (!selectedMonth) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {t('staff_payroll')}
                </h2>
                <p className="text-sm text-zinc-500">
                  {t('manage_view_records')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const now = new Date();
                const monthStr = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
                onRunPayroll?.(monthStr);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Zap className="w-4 h-4" />
              {t('run_payroll')}
            </button>
          </div>

          <DataTable
            title={t('payroll_history')}
            data={summaryData}
            onView={(item: any) => setSelectedMonth(item.month)}
            autoModal={false}
            columns={[
              {
                header: "Month / Year",
                accessor: "month",
                className: "font-bold",
              },
              { header: "Staff Count", accessor: "staffCount" },
              {
                header: "Total Net Payout",
                accessor: (item: any) => (
                  <span className="font-bold text-emerald-600">
                    GH₵{item.totalNet.toLocaleString()}
                  </span>
                ),
              },
              {
                header: "Status",
                accessor: () => (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                    Processed
                  </span>
                ),
              },
            ]}
          />
        </div>
      );
    }

    // DETAIL VIEW
    const filteredData = mappedData.filter((p) => p.month === selectedMonth);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMonth("")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                View Staff Records
              </h2>
              <p className="text-sm text-zinc-500">
                {selectedMonth} — {filteredData.length} records found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                (window as any).showToast?.(
                  `Generating PDF report for ${selectedMonth}...`,
                  "success",
                )
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" />
              {t('download_report')}
            </button>
          </div>
        </div>

        <DataTable
          title={t('staff_records')}
          data={filteredData}
          onSave={onSave}
          onDelete={onDelete}
          onEdit={() => {}}
          onView={() => {}}
          columns={[
            { header: "Staff Name", accessor: "name", className: "font-bold" },
            {
              header: "Basic Salary",
              accessor: (item: any) =>
                item.salary ? (
                  `GH₵${Number(item.salary).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Allowance",
              accessor: (item: any) =>
                item.allowance ? (
                  `GH₵${Number(item.allowance).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Deductions",
              accessor: (item: any) =>
                item.deductions ? (
                  `GH₵${Number(item.deductions).toLocaleString()}`
                ) : (
                  <span className="text-zinc-300">—</span>
                ),
            },
            {
              header: "Net Salary",
              accessor: (item: any) =>
                item.net ? `GH₵${Number(item.net).toLocaleString()}` : "GH₵0",
              className: "font-bold text-indigo-600",
            },
            {
              header: "Status",
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  )}
                >
                  {t(item.status?.toLowerCase() || 'pending')}
                </span>
              ),
            },
            {
              header: "Payslip",
              accessor: (item: any) => (
                <button
                  onClick={() => handlePrintPayslip(item)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              ),
            },
          ]}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              {!item && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Staff Member
                    </label>
                    <select
                      name="staff_id"
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    >
                      <option value="">Select Staff...</option>
                      {(staffList || []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">
                      Month/Year
                    </label>
                    <input
                      type="text"
                      name="month_year"
                      defaultValue={selectedMonth}
                      placeholder="e.g. March 2026"
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={item?.status || "Pending"}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Basic Salary (GH₵)
                  </label>
                  <input
                    type="number"
                    name="basic_salary"
                    defaultValue={item?.salary}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Allowance (GH₵)
                  </label>
                  <input
                    type="number"
                    name="allowances"
                    defaultValue={item?.allowance}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Deductions (GH₵)
                  </label>
                  <input
                    type="number"
                    name="deductions"
                    defaultValue={item?.deductions}
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Net Salary (GH₵)
                  </label>
                  <input
                    type="text"
                    defaultValue={
                      item?.net
                        ? `GH₵${Number(item.net).toLocaleString()}`
                        : "GH₵0"
                    }
                    disabled
                    className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-sm font-bold text-indigo-600 opacity-70"
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
  Performance: ({
    data,
    role,
    staffList = [],
    onSave,
    onDelete,
  }: {
    data?: any[];
    role?: UserRole;
    staffList?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { t } = useLanguage();
    const [isAddingReview, setIsAddingReview] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const stats = useMemo(() => {
      const records = data || [];
      if (records.length === 0) return null;
      
      const avgAppraisal = records.reduce((acc, r) => acc + (Number(r.appraisal_score) || 0), 0) / records.length;
      const avgLessonNote = records.reduce((acc, r) => acc + (Number(r.lesson_note_avg) || 0), 0) / records.length;
      
      const deptScores: Record<string, { total: number, count: number }> = {};
      records.forEach(r => {
        if (!r.department_name) return;
        if (!deptScores[r.department_name]) deptScores[r.department_name] = { total: 0, count: 0 };
        deptScores[r.department_name].total += (Number(r.appraisal_score) || 0);
        deptScores[r.department_name].count++;
      });
      
      let topDept = "N/A";
      let topScore = -1;
      Object.entries(deptScores).forEach(([name, s]) => {
        const avg = s.total / s.count;
        if (avg > topScore) {
          topScore = avg;
          topDept = name;
        }
      });

      return { avgAppraisal, avgLessonNote, topDept };
    }, [data]);

    return (
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-indigo-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('avg_appraisal')}</p>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{stats.avgAppraisal.toFixed(1)}%</h3>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${stats.avgAppraisal}%` }} />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('lesson_note_avg')}</p>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{stats.avgLessonNote.toFixed(1)}%</h3>
                </div>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${stats.avgLessonNote}%` }} />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Star className="w-24 h-24 text-amber-600" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('top_department')}</p>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate" title={stats.topDept}>{stats.topDept}</h3>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">{t('based_on_current_scores')}</p>
            </div>
          </div>
        )}
        <DataTable
          title={t('staff_performance')}
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          onView={() => {}}
          onAdd={() => setIsAddingReview(true)}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('staff_name')}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={item?.name}
                  disabled={true}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    {t('appraisal_score')}
                  </label>
                  <input
                    type="number"
                    name="score"
                    defaultValue={item?.appraisal_score}
                    disabled={isViewOnly}
                    placeholder="e.g. 85"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Appraisal Review
                </label>
                <textarea
                  name="comments"
                  defaultValue={item?.appraisal_review}
                  disabled={isViewOnly}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
            </div>
          )}
          columns={[
            {
              header: "Staff Name",
              accessor: (item: any) => item.name,
              className: "font-bold",
            },
            {
              header: "Department",
              accessor: (item: any) => item.department_name,
            },
            {
              header: "Lesson Note Avg",
              accessor: (item: any) =>
                item.lesson_note_avg ? (
                  <span className="font-bold text-indigo-600">
                    {Number(item.lesson_note_avg).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
            {
              header: "Appraisal Score",
              accessor: (item: any) =>
                item.appraisal_score ? (
                  <span className="font-bold text-amber-600">
                    {item.appraisal_score}%
                  </span>
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
            {
              header: "Latest Review",
              accessor: (item: any) =>
                item.appraisal_review || (
                  <span className="text-zinc-400">{t('no_review')}</span>
                ),
            },
            {
              header: "Date",
              accessor: (item: any) =>
                item.last_review_date ? (
                  new Date(item.last_review_date).toLocaleDateString()
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
            },
          ]}
        />
        <Modal
          isOpen={isAddingReview}
          onClose={() => {
            setIsAddingReview(false);
            setSelectedStaff(null);
          }}
          title={t('add_performance_review')}
        >
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onSave?.({
                staff_id: formData.get("staff_id"),
                score: Number(formData.get("score")),
                comments: formData.get("comments"),
              });
              setIsAddingReview(false);
              setSelectedStaff(null);
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Select Staff Member
              </label>
              <select
                name="staff_id"
                required
                value={selectedStaff || ""}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="">{t('choose_placeholder')}</option>
                {(staffList || []).map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.department_name})
                  </option>
                ))}
              </select>
            </div>

            {selectedStaff && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                    {t('current_lesson_note_avg')}:
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    {Number(
                      (data || []).find((s: any) => s.id === selectedStaff)
                        ?.lesson_note_avg || 0,
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Appraisal Score (%)
              </label>
              <input
                type="number"
                name="score"
                required
                min="0"
                max="100"
                placeholder="e.g. 85"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Review Comments
              </label>
              <textarea
                name="comments"
                required
                rows={4}
                placeholder={t('feedback')}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingReview(false);
                  setSelectedStaff(null);
                }}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {t('submit_review')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  TeachersOnDuty: ({
    role,
    data = [],
    staffList = [],
    currentStaff,
    onSave,
    onDelete,
  }: {
    role?: UserRole;
    data?: any[];
    staffList?: any[];
    currentStaff?: any;
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
  }) => {
    const { t } = useLanguage();
    const isStaff = role === "STAFF";
    const canManage = role === "SCHOOL_ADMIN" || role === "HR";
    const [view, setView] = useState<"table" | "week" | "month">("table");
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => {
      const newDate = new Date(currentDate);
      if (view === "week") newDate.setDate(newDate.getDate() - 7);
      else if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    };

    const handleNext = () => {
      const newDate = new Date(currentDate);
      if (view === "week") newDate.setDate(newDate.getDate() + 7);
      else if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    };

    const getWeekDays = (date: Date) => {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    };

    const getMonthDays = (date: Date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const days = [];
      const startDay = start.getDay();

      // Prefix with empty days from prev month
      for (let i = 0; i < startDay; i++) days.push(null);

      for (let i = 1; i <= end.getDate(); i++) {
        days.push(new Date(date.getFullYear(), date.getMonth(), i));
      }
      return days;
    };

    const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "table"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <List className="w-4 h-4" />
              {t('table')}
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "week"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {t('weekly')}
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                view === "month"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              <CalendarDays className="w-4 h-4" />
              {t('monthly')}
            </button>
          </div>

          {view !== "table" && (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-lg min-w-[150px] text-center capitalize">
                {view === "week"
                  ? `Week of ${getWeekDays(currentDate)[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                  : currentDate.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
              </h3>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {view === "table" ? (
          <DataTable
            title={t('teachers_on_duty_list')}
            data={
              isStaff && currentStaff
                ? data.filter((d) => d.teacher_id === currentStaff.id)
                : data
            }
            onSave={onSave}
            onDelete={isStaff ? undefined : onDelete}
            onEdit={canManage ? () => {} : undefined}
            onView={() => {}}
            columns={[
              ...(!isStaff
                ? [
                    {
                      header: "Teacher",
                      accessor: (item: any) => item.teacher_name,
                      className: "font-bold",
                    },
                  ]
                : []),
              {
                header: "Date",
                accessor: (item: any) =>
                  item.date ? new Date(item.date).toLocaleDateString() : "N/A",
              },
              { header: "Shift", accessor: (item: any) => item.shift },
            ]}
            onAdd={canManage ? () => {} : undefined}
            renderForm={
              canManage
                ? (item, isViewOnly) => (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">
                          Teacher
                        </label>
                        <select
                          name="teacher_id"
                          defaultValue={item?.teacher_id || ""}
                          required
                          disabled={isViewOnly}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">Select Teacher...</option>
                          {(staffList || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">
                            Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            defaultValue={
                              item?.date
                                ? new Date(item.date)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            required
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">
                            Shift
                          </label>
                          <select
                            name="shift"
                            defaultValue={item?.shift || "Morning"}
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            <option value="Morning">{t('morning')}</option>
                            <option value="Afternoon">{t('afternoon')}</option>
                            <option value="Evening">{t('evening')}</option>
                            <option value="Full Day">{t('full_day')}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                : undefined
            }
          />
        ) : view === "week" ? (
          <div className="grid grid-cols-7 gap-4">
            {getWeekDays(currentDate).map((day, idx) => {
              const dayAssigned = data.filter(
                (d) => formatDateKey(new Date(d.date)) === formatDateKey(day),
              );
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[150px]"
                >
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p className="text-xl font-bold mb-3">{day.getDate()}</p>
                  <div className="space-y-2">
                    {dayAssigned.length > 0 ? (
                      dayAssigned.map((a, i) => (
                        <div
                          key={i}
                          className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50"
                        >
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {a.teacher_name}
                          </p>
                          <p className="text-[10px] text-indigo-400">
                            {a.shift}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-400 italic">
                        No duty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
            {getMonthDays(currentDate).map((day, idx) => {
              if (!day)
                return (
                  <div
                    key={idx}
                    className="aspect-square bg-zinc-50/50 dark:bg-zinc-800/10 rounded-2xl"
                  />
                );
              const dayAssigned = data.filter(
                (d) => formatDateKey(new Date(d.date)) === formatDateKey(day),
              );
              const isToday = formatDateKey(new Date()) === formatDateKey(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "aspect-square p-2 bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm transition-all hover:border-indigo-300 relative group",
                    isToday
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full mb-1",
                      isToday
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-900 dark:text-white",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                    {dayAssigned.map((a, i) => (
                      <div
                        key={i}
                        className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800/50"
                      >
                        <p className="text-[9px] font-bold text-indigo-600 truncate">
                          {a.teacher_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },

  RolesAndPermissions: () =>
    // Replaced by RolesPermissions or handled above
    null,

  ExitManagement: ({
    role,
    data,
    onSave,
    onDelete,
    staffList,
    onFetchLetter,
    organization,
    documentTemplates,
    onRefreshTemplates,
  }: {
    role?: UserRole;
    data?: any[];
    onSave?: (data: any) => void;
    onDelete?: (item: any) => void;
    staffList?: any[];
    onFetchLetter?: (id: string) => Promise<any>;
    organization?: any;
    documentTemplates?: any[];
    onRefreshTemplates?: () => Promise<void>;
  }) => {
    const { t } = useLanguage();
    const [viewingLetter, setViewingLetter] = useState<any | null>(null);
    const [editableLetter, setEditableLetter] = useState("");
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);

    const handleFetchLetter = async (id: string) => {
      if (onFetchLetter) {
        try {
          const res = await onFetchLetter(id);
          setViewingLetter(res);
          setEditableLetter(res.letter);
        } catch (err) {
          console.error("Failed to fetch letter:", err);
        }
      }
    };

    const handlePrint = () => {
      const template = (documentTemplates || [])
        .filter((t) => t.type === "ExitLetter")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        let printHtml = "";

        if (template) {
          const config = template.layout_config || {};
          let body = config.content || editableLetter || "";

          const replacements: Record<string, string> = {
            "{{staff_name}}": viewingLetter?.staff_name || "Staff Name",
            "{{exit_date}}": viewingLetter?.exit_date
              ? new Date(viewingLetter.exit_date).toLocaleDateString()
              : "N/A",
            "{{reason}}": viewingLetter?.reason || "N/A",
            "{{school_name}}": organization?.name || "The School",
            "{{school_logo}}": organization?.logo
              ? `<img src="${organization.logo}" style="max-height: 80px; display: block; margin: 0 auto;" alt="Logo" />`
              : "",
            "{{principal_signature}}": organization?.signature
              ? `<img src="${organization.signature}" style="max-height: 50px;" alt="Signature" />`
              : "",
          };

          Object.entries(replacements).forEach(([key, value]) => {
            body = body.split(key).join(value);
          });

          printHtml = `
            <html>
              <head>
                <title>Exit Letter</title>
                <style>
                  body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                  .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                  .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
                  ${config.styles || ""}
                </style>
              </head>
              <body>
                <div class="header">${config.headerText || ""}</div>
                <div class="letter-body">${body}</div>
                <div class="footer">${config.footerText || ""}</div>
              </body>
            </html>
          `;
        } else {
          // Standard Fallback
          printHtml = `
            <html>
              <head>
                <title>Exit Letter</title>
                <style>
                  body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.8; color: #1a1a1a; }
                  .header { display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 40px; padding-bottom: 20px; }
                  .logo { max-height: 100px; margin-bottom: 10px; }
                  .school-name { font-size: 24px; font-bold; color: #1e1b4b; margin: 0; }
                  .school-info { font-size: 12px; color: #666; margin: 2px 0; }
                  .letter-body { white-space: pre-wrap; font-size: 16px; min-height: 400px; }
                  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
                  .signature-box { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
                  .signature-img { max-height: 60px; object-fit: contain; }
                  .signatory-name { font-weight: bold; margin: 0; }
                  .signatory-title { font-size: 14px; color: #444; margin: 0; }
                  @media print { body { padding: 0; } .header { margin-top: 20px; } }
                </style>
              </head>
              <body>
                <div class="header">
                  ${organization?.logo ? `<img src="${organization.logo}" class="logo" alt="Logo" />` : ""}
                  <h1 class="school-name">${organization?.name || "School Exit Letter"}</h1>
                  <p class="school-info">${organization?.support_email || ""}</p>
                </div>

                <div class="letter-body">${editableLetter}</div>

                <div class="footer">
                  <div class="signature-box">
                    <p>${t('sincerely')},</p>
                    ${organization?.signature ? `<img src="${organization.signature}" class="signature-img" alt="Signature" />` : '<div style="height: 60px;"></div>'}
                    <p class="signatory-name">${t('the_principal')}</p>
                    <p class="signatory-title">${organization?.name || "School Administration"}</p>
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

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsDesignerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Palette className="w-4 h-4" />
            Design Exit Letter Template
          </button>
        </div>
        <DataTable
          title="Exit Management"
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          onView={() => {}}
          onEdit={() => {}}
          columns={[
            {
              header: "Staff Name",
              accessor: (item: any) => item.staff_name,
              className: "font-bold",
            },
            {
              header: t('exit_date'),
              accessor: (item: any) =>
                item.exit_date
                  ? new Date(item.exit_date).toLocaleDateString()
                  : "N/A",
            },
            { header: t('reason'), accessor: (item: any) => item.reason },
            {
              header: t('status'),
              accessor: (item: any) => (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.status === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600",
                  )}
                >
                  {t(item.status?.toLowerCase().replace(' ', '_') || 'pending')}
                </span>
              ),
            },
            {
              header: "Actions",
              accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFetchLetter(item.id)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t('letter')}
                  </button>
                  {item.status !== "Completed" && onSave && (
                    <button
                      onClick={() => onSave({ ...item, status: "Completed" })}
                      className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('approve_action')}
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('staff')}
                </label>
                <select
                  name="staff_id"
                  defaultValue={item?.staff_id || ""}
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">{t('select_staff_placeholder')}</option>
                  {(staffList || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('exit_date')}
                </label>
                <input
                  type="date"
                  name="exit_date"
                  defaultValue={
                    item?.exit_date
                      ? new Date(item.exit_date).toISOString().split("T")[0]
                      : ""
                  }
                  required
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {t('reason')}
                </label>
                <select
                  name="reason"
                  defaultValue={item?.reason || "Resignation"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Resignation">{t('resignation')}</option>
                  <option value="Retirement">{t('retirement')}</option>
                  <option value="Termination">{t('termination')}</option>
                  <option value="Contract Ended">{t('contract_ended')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={item?.status || "Pending"}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="Pending">{t('pending_clearance')}</option>
                  <option value="Completed">{t('completed')}</option>
                  <option value="Cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>
          )}
        />

        <Modal
          isOpen={!!viewingLetter}
          onClose={() => setViewingLetter(null)}
          title={t('exit_letter_preview')}
        >
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {t('letter_content_editable')}
              </label>
              <textarea
                value={editableLetter}
                onChange={(e) => setEditableLetter(e.target.value)}
                className="w-full h-[400px] p-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-serif leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setViewingLetter(null)}
                className="px-6 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t('close')}
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('print_letter')}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDesignerOpen}
          onClose={() => setIsDesignerOpen(false)}
          title={t('exit_letter_designer')}
          maxWidth="max-w-5xl"
          maxHeight="max-h-[90vh]"
        >
          <div className="p-6">
            <DocumentBuilder
              data={documentTemplates}
              onRefresh={onRefreshTemplates}
              organization={organization}
              lockedType="ExitLetter"
              hideTypeSelect={true}
            />
          </div>
        </Modal>
      </div>
    );
  },
  ParentManagement: ({
    students = [],
    onSave,
  }: {
    students?: Student[];
    onSave?: (data: any) => void;
  }) => {
    const { t } = useLanguage();
    const [viewingStudent, setViewingStudent] = React.useState<Student | null>(null);

    return (
      <div className="space-y-6">
        <DataTable
          title={t('parent_management')}
          data={students}
          onSave={onSave}
          columns={[
            { header: t('student'), accessor: "name", className: "font-bold" },
            { header: t('class'), accessor: (item: any) => `${item.class || 'N/A'} ${item.section || ''}` },
            { 
              header: t('primary_parent'), 
              accessor: (item: any) => (
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{item.parent_name || 'N/A'}</span>
                  <span className="text-[10px] text-zinc-500">{item.contact || 'N/A'}</span>
                </div>
              )
            },
            { 
              header: t('secondary_parent'), 
              accessor: (item: any) => (
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{item.secondary_parent_name || 'N/A'}</span>
                  <span className="text-[10px] text-zinc-500">{item.secondary_parent_contact || 'N/A'}</span>
                </div>
              )
            },
          ]}
          onView={(item) => setViewingStudent(item)}
          renderForm={(item) => (
            <div className="space-y-8 max-h-[70vh] overflow-y-auto px-1">
              {/* Primary Parent section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2 flex items-center gap-2">
                  <UserCircle className="w-3.5 h-3.5" />
                  Primary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t('full_name')}</label>
                    <input
                      type="text"
                      name="parent_name"
                      defaultValue={item?.parent_name}
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t('contact_number')}</label>
                    <input
                      type="text"
                      name="contact"
                      defaultValue={item?.contact}
                      required
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">{t('email')}</label>
                  <input
                    type="email"
                    name="parent_email"
                    value={item?.parent_email}
                    readOnly
                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Secondary Parent section */}
              <div className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Secondary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Name</label>
                    <input
                      type="text"
                      name="secondary_parent_name"
                      defaultValue={item?.secondary_parent_name}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Contact</label>
                    <input
                      type="text"
                      name="secondary_parent_contact"
                      defaultValue={item?.secondary_parent_contact}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Secondary Parent Email</label>
                  <input
                    type="email"
                    name="secondary_parent_email"
                    value={item?.secondary_parent_email}
                    readOnly
                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Additional Information</h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">{t('religion')}</label>
                  <select
                    name="religion"
                    defaultValue={item?.religion || ""}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Religion...</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Sikhism">Sikhism</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        />

        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title={t('parent_details')}
        >
          {viewingStudent && (
            <div className="p-6 space-y-8 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                  {viewingStudent.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewingStudent.name}</h3>
                  <p className="text-sm text-zinc-500">{viewingStudent.class} | {viewingStudent.admission_no}</p>
                </div>
              </div>

              {/* Primary Parent Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  Primary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('full_name')}</p>
                    <p className="text-sm font-bold">{viewingStudent.parent_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('contact_number')}</p>
                    <p className="text-sm font-bold">{viewingStudent.contact || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl md:col-span-2">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('email')}</p>
                    <p className="text-sm font-bold">{viewingStudent.parent_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Secondary Parent Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Secondary Parent / Guardian
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('full_name')}</p>
                    <p className="text-sm font-bold">{viewingStudent.secondary_parent_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('contact_number')}</p>
                    <p className="text-sm font-bold">{viewingStudent.secondary_parent_contact || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl md:col-span-2">
                    <p className="text-[10px] font-black uppercase text-zinc-400">{t('email')}</p>
                    <p className="text-sm font-bold">{viewingStudent.secondary_parent_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400">{t('religion')}</p>
                  <p className="text-sm font-bold">{viewingStudent.religion || 'N/A'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setViewingStudent(null)}
                  className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg"
                >
                  {t('close_details')}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  },

};
