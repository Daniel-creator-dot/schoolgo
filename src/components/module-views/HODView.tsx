import React from 'react';
import { AcademicModules, ExamModules } from './SchoolAdminView';
import { HRModules } from './HRView';

export const HODModules = {
  StudentManagement: AcademicModules.StudentManagement,
  DepartmentManagement: AcademicModules.DepartmentManagement,
  ClassManagement: AcademicModules.ClassManagement,
  SubjectManagement: AcademicModules.SubjectManagement,
  Timetable: AcademicModules.Timetable,
  Attendance: AcademicModules.Attendance,
  ExamSchedules: ExamModules.ExamSchedules,
  ResultsManagement: ExamModules.ResultsManagement,
  GradingScale: ExamModules.GradingScale,
  ReportCardBuilder: ExamModules.ReportCardBuilder,
  RemarksTemplate: ExamModules.RemarksTemplate,
  StaffAttendance: HRModules.StaffAttendance,
  TeachersOnDuty: HRModules.TeachersOnDuty,
  LessonNotes: HRModules.LessonNotes,
  Performance: HRModules.Performance,
};
