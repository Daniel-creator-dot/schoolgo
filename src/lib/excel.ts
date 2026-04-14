import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ExcelStudentRow {
  'Full Name': string;
  'Admission No'?: string;
  'Gender'?: string;
  'Date of Birth'?: string;
  'Parent Name'?: string;
  'Parent Phone'?: string;
  'Parent Email'?: string;
  'Religion'?: string;
  'Grade'?: string;
  'Class Name'?: string;
}

/**
 * Downloads a template for student enrollment
 */
export const downloadStudentTemplate = (classes: any[] = []) => {
  const headers = [
    'Full Name',
    'Admission No',
    'Gender',
    'Date of Birth',
    'Parent Name',
    'Parent Phone',
    'Parent Email',
    'Religion',
    'Grade',
    'Class Name'
  ];

  const exampleRow = [
    'John Doe',
    'ADM-101',
    'Male',
    '2010-05-15',
    'Jane Doe',
    '0244123456',
    'jane@email.com',
    'Christian',
    'JHS 1',
    classes[0] ? `${classes[0].name} ${classes[0].section || ''}`.trim() : 'Primary 1'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  
  // Add a helper sheet for valid class names
  const classesSheetData = [['Valid Class Names'], ...classes.map(c => [`${c.name} ${c.section || ''}`.trim()])];
  const wsClasses = XLSX.utils.aoa_to_sheet(classesSheetData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student Enrollment');
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Available Classes');

  XLSX.writeFile(wb, 'SchoolGo_Student_Enrollment_Template.xlsx');
};

/**
 * Parses the uploaded Excel file into student records
 */
export const parseStudentExcel = async (file: File, classes: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelStudentRow[];

        const records = jsonData.map((row, index) => {
          // Find matching class ID by name
          const className = row['Class Name']?.toString().trim();
          const matchedClass = classes.find(c => 
            `${c.name} ${c.section || ''}`.trim().toLowerCase() === className?.toLowerCase()
          );

          return {
            id: `temp-${Date.now()}-${index}`,
            name: row['Full Name'],
            admission_no: row['Admission No']?.toString(),
            gender: row['Gender'],
            date_of_birth: row['Date of Birth'],
            parent_name: row['Parent Name'],
            contact: row['Parent Phone']?.toString(),
            parent_email: row['Parent Email'],
            religion: row['Religion'],
            grade: row['Grade']?.toString(),
            class_id: matchedClass?.id,
            class_name: className, // For display in preview
            decision: 'Enrolled', // Default for this view
            status: 'Accepted'
          };
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Downloads a template for fee management (billing or payments)
 * Pre-filled with active student list to prevent identification errors
 */
export const downloadFeeTemplate = (
  type: 'payment' | 'invoice',
  students: Student[] = [],
  feeStructures: any[] = []
) => {
  const headers = type === 'payment' 
    ? ['Admission No', 'Full Name', 'Class', 'Amount Paid', 'Payment Method', 'Date', 'Transaction ID', 'Description']
    : ['Admission No', 'Full Name', 'Class', 'Fee Type', 'Amount (Optional Override)', 'Due Date', 'Academic Year', 'Term'];

  const data = students.map(s => {
    if (type === 'payment') {
      return [
        s.admission_no || s.admissionNo || '',
        s.name,
        s.class,
        '', // Amount
        'Cash', // Method
        new Date().toISOString().split('T')[0], // Date
        '', // Transaction ID
        'Fee Payment'
      ];
    } else {
      return [
        s.admission_no || s.admissionNo || '',
        s.name,
        s.class,
        feeStructures[0]?.name || '',
        '', // Override amount
        new Date((new Date()).getTime() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days later
        '', // Academic Year
        '' // Term
      ];
    }
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Add a helper sheet for valid fee types if it's billing mode
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === 'payment' ? 'Payment Recording' : 'Bulk Billing');

  if (type === 'invoice') {
    const feeSheetData = [['Valid Fee Types', 'Default Amount'], ...feeStructures.map(f => [f.name, f.amount])];
    const wsFees = XLSX.utils.aoa_to_sheet(feeSheetData);
    XLSX.utils.book_append_sheet(wb, wsFees, 'Valid Fees');
  }

  const filename = type === 'payment' ? 'Fee_Payments_Upload_Template.xlsx' : 'Bulk_Billing_Upload_Template.xlsx';
  XLSX.writeFile(wb, filename);
};

/**
 * Parses financial Excel files
 */
export const parseFeeExcel = async (
  file: File, 
  type: 'payment' | 'invoice',
  students: Student[] = [],
  feeStructures: any[] = []
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const [headers, ...rows] = jsonData;
        
        const records = rows.map((row, index) => {
          if (!row[0]) return null; // Skip empty rows

          const admissionNo = row[0]?.toString().trim();
          const matchedStudent = students.find(s => 
            (s.admission_no || s.admissionNo || '').trim() === admissionNo
          );

          if (type === 'payment') {
            return {
              tempId: `p-${index}`,
              student_id: matchedStudent?.id,
              student_name: matchedStudent?.name || row[1],
              admission_no: admissionNo,
              amount: row[3],
              method: row[4] || 'Cash',
              date: row[5] || new Date().toISOString().split('T')[0],
              transaction_id: row[6]?.toString(),
              description: row[7] || 'Fee Payment',
              isValid: !!matchedStudent && !!row[3]
            };
          } else {
            const feeName = row[3]?.toString().trim();
            const matchedFee = feeStructures.find(f => f.name.trim().toLowerCase() === feeName.toLowerCase());

            return {
              tempId: `i-${index}`,
              student_id: matchedStudent?.id,
              student_name: matchedStudent?.name || row[1],
              admission_no: admissionNo,
              fee_structure_id: matchedFee?.id,
              fee_name: matchedFee?.name || feeName,
              amount: row[4] || matchedFee?.amount,
              due_date: row[5],
              academic_year: row[6],
              term: row[7],
              isValid: !!matchedStudent && !!matchedFee
            };
          }
        }).filter(r => r !== null);

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Downloads a template for marking exam results
 */
export const downloadResultTemplate = (exam: any, students: any[], columns: string[]) => {
  const columnLabels: Record<string, string> = {
    showClassScore: 'Class Score',
    showExamScore: 'Exam Score',
    showTotalScore: 'Total Score'
  };

  const headers = ['Admission No', 'Full Name', ...columns.map(c => columnLabels[c] || c), 'Remarks'];
  
  const data = students.map(s => [
    s.admission_no || s.admissionNo || '',
    s.name,
    ...columns.map(() => ''),
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marks Entry');

  XLSX.writeFile(wb, `${exam.title || 'Exam'}_Marks_Entry.xlsx`);
};

/**
 * Parses exam result Excel files
 */
export const parseResultExcel = async (file: File, columns: string[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const [headers, ...rows] = jsonData;
        const columnLabels: Record<string, string> = {
          'Class Score': 'showClassScore',
          'Exam Score': 'showExamScore',
          'Total Score': 'showTotalScore'
        };

        const records = rows.map((row, index) => {
          if (!row[0]) return null;

          const scores: any = {};
          let totalScore = 0;

          headers.forEach((header, idx) => {
            const key = columnLabels[header] || header;
            if (columns.includes(key)) {
              const val = parseFloat(row[idx]) || 0;
              scores[key] = val;
              if (key === 'showClassScore' || key === 'showExamScore') {
                totalScore += val;
              }
            }
          });

          // Fallback if only total score is provided
          if (scores.showTotalScore && !scores.showClassScore && !scores.showExamScore) {
            totalScore = scores.showTotalScore;
          }

          return {
            admission_no: row[0]?.toString().trim(),
            student_name: row[1],
            score_details: scores,
            score: totalScore,
            remark: row[headers.length - 1] || ''
          };
        }).filter(r => r !== null);

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Library & Inventory Templates
 */
export const downloadLibraryTemplate = () => {
  const headers = ['Title', 'Author', 'ISBN', 'Category', 'Total Copies', 'Price (Lost Fee)'];
  const example = ['To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', '5', '25.00'];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  XLSX.writeFile(wb, 'Library_Import_Template.xlsx');
};

export const parseLibraryExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        resolve(jsonData.map((row: any) => ({
          title: row['Title'],
          author: row['Author'],
          isbn: row['ISBN']?.toString(),
          category: row['Category'] || 'Academic',
          total_copies: parseInt(row['Total Copies']) || 1,
          available_copies: parseInt(row['Total Copies']) || 1,
          price: parseFloat(row['Price (Lost Fee)']) || 0
        })));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const downloadInventoryTemplate = () => {
  const headers = ['Item Name', 'Category', 'Location', 'Status', 'Quantity', 'Unit Price', 'Next Maintenance'];
  const example = ['Laptops (Dell)', 'ICT Equipment', 'Lab 1', 'Good Condition', '20', '500.00', '2024-12-31'];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, 'Inventory_Import_Template.xlsx');
};

export const parseInventoryExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        resolve(jsonData.map((row: any) => ({
          item_name: row['Item Name'],
          category: row['Category'],
          location: row['Location'],
          status: row['Status'] || 'Good Condition',
          next_maintenance_date: row['Next Maintenance'],
          quantity: parseInt(row['Quantity']) || 0,
          price: parseFloat(row['Unit Price']) || 0
        })));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Attendance Template (Daily)
 */
export const downloadAttendanceTemplate = (students: any[], className: string) => {
  const headers = ['Admission No', 'Full Name', 'Status (Present/Absent/Late)', 'Remark'];
  const data = students.map(s => [s.admission_no || s.admissionNo || '', s.name, 'Present', '']);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `Attendance_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const parseAttendanceExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as any[][];
        const [, ...rows] = jsonData;
        resolve(rows.map(row => ({
          admission_no: row[0]?.toString().trim(),
          name: row[1],
          status: row[2] || 'Present',
          remark: row[3] || '',
          date: new Date().toISOString().split('T')[0]
        })).filter(r => r.admission_no));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};
