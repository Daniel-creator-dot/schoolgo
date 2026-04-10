import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { UserRole, Ward } from '../../types';

export const NonStaffModules = {
  Inventory: () => (
    <DataTable 
      title="Inventory & Assets" 
      data={[
        { id: '1', item: 'Laptops', category: 'IT', stock: 50, status: 'In Stock' },
        { id: '2', item: 'Projectors', category: 'AV', stock: 12, status: 'Low Stock' },
        { id: '3', item: 'Whiteboards', category: 'Furniture', stock: 24, status: 'In Stock' },
      ]}
      columns={[
        { header: 'Item Name', accessor: (item: any) => item.item, className: 'font-bold' },
        { header: 'Category', accessor: (item: any) => item.category },
        { header: 'Current Stock', accessor: (item: any) => item.stock },
        { 
          header: 'Status', 
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.status === 'In Stock' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              {item.status}
            </span>
          )
        },
      ]}
    />
  ),
  Hostel: () => (
    <DataTable 
      title="Hostel Management" 
      data={[
        { id: '1', name: 'Everest Hall', type: 'Boys', capacity: 200, occupied: 185 },
        { id: '2', name: 'Victoria Hall', type: 'Girls', capacity: 150, occupied: 142 },
        { id: '3', name: 'Newton Hall', type: 'Boys', capacity: 100, occupied: 98 },
      ]}
      columns={[
        { header: 'Hostel Name', accessor: (item: any) => item.name, className: 'font-bold' },
        { header: 'Type', accessor: (item: any) => item.type },
        { header: 'Capacity', accessor: (item: any) => item.capacity },
        { header: 'Occupied', accessor: (item: any) => item.occupied },
        { 
          header: 'Availability', 
          accessor: (item: any) => (
            <span className="text-xs font-bold text-emerald-600">{item.capacity - item.occupied} Rooms Left</span>
          )
        },
      ]}
    />
  ),
  HealthMedical: ({ role, wards }: { role?: UserRole, wards?: Ward[] }) => {
    const [selectedWardId, setSelectedWardId] = useState(wards?.[0]?.id || "");

    const data = [
      { id: '1', student: 'Alice Johnson', visit: 'Headache', date: '2024-03-01', treatment: 'Paracetamol', wardId: 'w1' },
      { id: '2', student: 'Bob Smith', visit: 'Fever', date: '2024-02-28', treatment: 'Rest & Fluids', wardId: 'w1' },
      { id: '3', student: 'Daniel Johnson', visit: 'Injury', date: '2024-02-25', treatment: 'First Aid', wardId: 'w1' },
      { id: '4', student: 'Sarah Johnson', visit: 'Routine Checkup', date: '2024-03-01', treatment: 'N/A', wardId: 'w2' },
    ];

    const filteredData = role === 'PARENT'
      ? data.filter(d => d.wardId === selectedWardId)
      : data;

    return (
      <div className="space-y-4">
        {role === 'PARENT' && wards && wards.length > 1 && (
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
            <span className="text-xs font-bold text-zinc-500 ml-2 uppercase tracking-wider">Ward:</span>
            <select 
              value={selectedWardId} 
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none pr-4"
            >
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <DataTable 
          title="Health & Medical Records" 
          data={filteredData}
          columns={[
            { header: 'Student', accessor: (item: any) => item.student, className: 'font-bold' },
            { header: 'Visit Reason', accessor: (item: any) => item.visit },
            { header: 'Treatment', accessor: (item: any) => item.treatment },
            { header: 'Date', accessor: (item: any) => item.date },
          ]}
        />
      </div>
    );
  },
};
