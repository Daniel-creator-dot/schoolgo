import * as XLSX from 'xlsx';

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
