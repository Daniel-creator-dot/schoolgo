import React from 'react';
import { AcademicModules, ExamModules } from './SchoolAdminView';
import { ExamModules as SimpleExamModules } from './StaffView';
import { FinanceModules } from './FinanceView';
import { NonStaffModules } from './NonStaffView';
import { OperationsModules } from './OperationsView';
import { UserRole, Ward } from '../../types';

export const ParentModules = {
  AcademicInformation: AcademicModules.StudentManagement, // We will use StudentManagement filtered by ward
  Attendance: AcademicModules.Attendance,
  Timetable: AcademicModules.Timetable,
  ExamSchedules: ExamModules.ExamSchedules,
  WardResults: ExamModules.ResultsManagement,
  ResultAnalysis: ExamModules.ResultAnalysis,
  InvoicesPayments: FinanceModules.InvoicesPayments,
  HealthMedical: OperationsModules.HealthMedical,
  Transport: OperationsModules.Transport,
  Hostel: OperationsModules.Hostel,
  BehaviorDiscipline: OperationsModules.BehaviorDiscipline,
};
