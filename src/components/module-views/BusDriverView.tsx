import React from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';

export const TransportModules = {
  Transport: () => (
    <DataTable 
      title="Transport Routes" 
      data={[
        { id: '1', route: 'North Sector', bus: 'Bus #42', driver: 'Mike Ross', students: 45, status: 'Active' },
        { id: '2', route: 'South Sector', bus: 'Bus #12', driver: 'Sarah Connor', students: 38, status: 'Active' },
        { id: '3', route: 'East Sector', bus: 'Bus #08', driver: 'John Doe', students: 52, status: 'Under Maintenance' },
      ]}
      columns={[
        { header: 'Route Name', accessor: (item: any) => item.route, className: 'font-bold' },
        { header: 'Vehicle', accessor: (item: any) => item.bus },
        { header: 'Driver', accessor: (item: any) => item.driver },
        { header: 'Students', accessor: (item: any) => item.students },
        { 
          header: 'Status', 
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              {item.status}
            </span>
          )
        },
      ]}
    />
  ),
};
