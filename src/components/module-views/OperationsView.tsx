import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { 
  Download, 
  X, 
  FileSpreadsheet,
  AlertCircle,
  Users,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { UserRole, Ward } from '../../types';
import { downloadInventoryTemplate, parseInventoryExcel } from '../../lib/excel';
import { useLanguage } from '../../lib/LanguageContext';

export const OperationsModules = {
  Transport: ({ role, currentStudentId, data, students, onSave, onDelete, onRefresh }: { role?: string, currentStudentId?: string, data?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const [viewingStudents, setViewingStudents] = useState<any | null>(null);
    const [routeStudents, setRouteStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [viewMode, setViewMode] = useState<'routes' | 'students'>('routes');
    const [allAssignments, setAllAssignments] = useState<any[]>([]);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [pickupInput, setPickupInput] = useState('');

    const refreshAssignments = async () => {
      try {
        const { fetchTransportAssignments } = await import('../../lib/api');
        const res = await fetchTransportAssignments();
        setAllAssignments(res);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };

    React.useEffect(() => {
      refreshAssignments();
    }, [viewMode]);

    const handleViewStudents = async (route: any) => {
      setViewingStudents(route);
      setIsLoadingStudents(true);
      try {
        const { fetchRouteStudents } = await import('../../lib/api');
        const res = await fetchRouteStudents(route.id);
        setRouteStudents(res);
      } catch (err) {
        console.error('Failed to fetch route students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const handleAssign = async (studentId: string) => {
      if (!viewingStudents) return;
      const pickupLocation = (document.getElementById('pickupLocation') as HTMLInputElement)?.value;
      try {
        const { assignStudentToTransport } = await import('../../lib/api');
        await assignStudentToTransport(viewingStudents.id, studentId, pickupLocation);
        // Refresh local list
        const { fetchRouteStudents } = await import('../../lib/api');
        const res = await fetchRouteStudents(viewingStudents.id);
        setRouteStudents(res);
        (window as any).showToast?.('Student assigned and invoice generated!', 'success');
        if (document.getElementById('pickupLocation')) (document.getElementById('pickupLocation') as HTMLInputElement).value = '';
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to assign student', 'error');
      }
    };

    const handleUnassign = async (studentId: string) => {
      try {
        const { unassignStudentFromTransport } = await import('../../lib/api');
        await unassignStudentFromTransport(studentId);
        setRouteStudents(prev => prev.filter(s => s.id !== studentId));
        (window as any).showToast?.('Student unassigned!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to unassign student', 'error');
      }
    };

    if (role === 'STUDENT' || role === 'PARENT') {
      const handleRequest = async (routeId: string) => {
        setRequesting(routeId);
        try {
          const { assignStudentToTransport } = await import('../../lib/api');
          await assignStudentToTransport(routeId, currentStudentId!);
          (window as any).showToast?.('Bus join request submitted!', 'success');
          onRefresh?.();
        } catch (err: any) {
          (window as any).showToast?.(err?.response?.data?.error || 'Request failed', 'error');
        } finally {
          setRequesting(null);
        }
      };

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">My Transport Assignment</h2>
            {allAssignments.filter((a: any) => String(a.id) === String(currentStudentId)).length > 0 ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2">
                {allAssignments.filter((a: any) => String(a.id) === String(currentStudentId)).map((a: any) => (
                  <div key={a.id}>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">{a.route_name}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                        a.transport_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      )}>
                        {a.transport_status || 'Approved'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/70 dark:text-emerald-200/60 mt-0.5 font-medium">Price: {a.price || '0.00'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">You are not assigned to any transport route yet.</p>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Available Transport Routes</h2>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Route Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Driver Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(data || []).map((route: any) => (
                    <tr key={route.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold">{route.route_name}</td>
                      <td className="px-4 py-3">{route.price || '0.00'}</td>
                      <td className="px-4 py-3">{route.driver_name || 'N/A'}</td>
                      <td className="px-4 py-3">{route.driver_phone || 'N/A'}</td>
                      <td className="px-4 py-3">{route.vehicle_number || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRequest(route.id)}
                          disabled={requesting === route.id}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {requesting === route.id ? 'Requesting...' : 'Request to Join'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(data || []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic text-sm">No transport routes available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }


    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
            <button 
              onClick={() => setViewMode('routes')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'routes' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Routes
            </button>
            <button 
              onClick={() => setViewMode('students')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'students' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Manage Students
            </button>
          </div>
          {viewMode === 'students' && (
            <button 
              onClick={() => setIsAddingStudent(true)}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Student to Route
            </button>
          )}
        </div>

        {viewMode === 'routes' ? (
          <DataTable 
            title="Transport Routes" 
            data={data || []}
            onSave={onSave}
            onEdit={() => {}}
            onDelete={onDelete}
            columns={[
            { header: 'Route Name', accessor: (item: any) => item.route_name, className: 'font-bold' },
            { header: 'Price', accessor: (item: any) => item.price ? `${item.price}` : '0.00' },
            { header: 'Students', accessor: (item: any) => (
              <button 
                onClick={(e) => { e.stopPropagation(); handleViewStudents(item); }}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
              >
                {item.student_count || 0} Students
              </button>
            )},
            { header: 'Vehicle', accessor: (item: any) => item.vehicle_number },
            { header: 'Driver', accessor: (item: any) => item.driver_name },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Route Name</label>
                  <input 
                    name="route_name" 
                    defaultValue={item?.route_name} 
                    required 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Route Price (Per Term/Month)</label>
                  <input 
                    type="number"
                    name="price" 
                    defaultValue={item?.price || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Vehicle Number</label>
                <input 
                  name="vehicle_number" 
                  defaultValue={item?.vehicle_number} 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Driver Name</label>
                  <input 
                    name="driver_name" 
                    defaultValue={item?.driver_name} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Driver Phone</label>
                  <input 
                    name="driver_phone" 
                    defaultValue={item?.driver_phone} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        />
        ) : (
          <DataTable 
            title="Assigned Students"
            data={allAssignments}
            columns={[
              { header: 'Student Name', accessor: (item: any) => item.name, className: 'font-bold' },
              { header: 'Adm No.', accessor: (item: any) => item.admission_no },
              { header: 'Route', accessor: (item: any) => (
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase">
                  {item.route_name}
                </span>
              )},
              { header: 'Pickup Location', accessor: (item: any) => item.transport_pickup_location || 'Not Set', className: 'italic text-zinc-500' },
              { header: 'Status', accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    item.transport_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {item.transport_status || 'Approved'}
                  </span>
                  {item.transport_status === 'Pending' && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Approve transport request for ${item.name}?`)) return;
                        try {
                          const { approveTransportRequest } = await import('../../lib/api');
                          await approveTransportRequest(item.id);
                          refreshAssignments();
                          onRefresh?.();
                          (window as any).showToast?.('Request approved successfully!', 'success');
                        } catch (err: any) {
                          (window as any).showToast?.('Failed to approve request', 'error');
                        }
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              )},
              { header: 'Price', accessor: (item: any) => item.price || '0.00' },
            ]}
            onDelete={async (item) => {
              const isPending = item.transport_status === 'Pending';
              if (!confirm(`${isPending ? 'Reject request for' : 'Unassign'} ${item.name} from transport?`)) return;
              try {
                if (isPending) {
                  const { rejectTransportRequest } = await import('../../lib/api');
                  await rejectTransportRequest(item.id);
                } else {
                  const { unassignStudentFromTransport } = await import('../../lib/api');
                  await unassignStudentFromTransport(item.id);
                }
                refreshAssignments();
                onRefresh?.();
                (window as any).showToast?.(isPending ? 'Request rejected' : 'Student unassigned successfully!', 'success');
              } catch (err: any) {
                (window as any).showToast?.('Failed to unassign/reject', 'error');
              }
            }}
          />
        )}

        {/* Add Student Modal */}
        {isAddingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Assign Student to Transport</h2>
                <button 
                  onClick={() => setIsAddingStudent(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Student</label>
                  <select 
                    id="newStudentId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose student...</option>
                    {(students || [])
                      .filter(s => !allAssignments.find(a => a.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Route</label>
                  <select 
                    id="newRouteId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose route...</option>
                    {(data || []).map(r => (
                      <option key={r.id} value={r.id}>{r.route_name} ({r.price})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Pickup Location</label>
                  <input 
                    id="newPickupLocation"
                    placeholder="Enter pickup location..."
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <button 
                  onClick={async () => {
                    const sid = (document.getElementById('newStudentId') as HTMLSelectElement).value;
                    const rid = (document.getElementById('newRouteId') as HTMLSelectElement).value;
                    const loc = (document.getElementById('newPickupLocation') as HTMLInputElement).value;
                    if (!sid || !rid) return alert('Select student and route');
                    try {
                      const { assignStudentToTransport } = await import('../../lib/api');
                      await assignStudentToTransport(rid, sid, loc);
                      refreshAssignments();
                      onRefresh?.();
                      setIsAddingStudent(false);
                      (window as any).showToast?.('Student assigned successfully!', 'success');
                    } catch (err: any) {
                      (window as any).showToast?.('Assignment failed', 'error');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
                >
                  Assign to Transport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  Hostel: ({ role, currentStudentId, data, students, onSave, onDelete, onRefresh }: { role?: string, currentStudentId?: string, data?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const [viewingRoomsHostel, setViewingRoomsHostel] = useState<any | null>(null);
    const [hostelRooms, setHostelRooms] = useState<any[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    const [viewingStudentsRoom, setViewingStudentsRoom] = useState<any | null>(null);
    const [roomStudents, setRoomStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const [viewMode, setViewMode] = useState<'hostels' | 'residents'>('hostels');
    const [allAssignments, setAllAssignments] = useState<any[]>([]);
    const [isAddingResident, setIsAddingResident] = useState(false);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [hostelRequesting, setHostelRequesting] = useState<string | null>(null);

    const refreshAssignments = async () => {
      try {
        const { fetchHostelAssignments } = await import('../../lib/api');
        const res = await fetchHostelAssignments();
        setAllAssignments(res);
      } catch (err) {
        console.error('Failed to fetch hostel assignments:', err);
      }
    };

    const fetchAllRooms = async () => {
      try {
        const { fetchHostelRooms } = await import('../../lib/api');
        const res = await fetchHostelRooms();
        setAllRooms(res);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };

    React.useEffect(() => {
      refreshAssignments();
      if (role === 'STUDENT') fetchAllRooms();
    }, [viewMode]);

    React.useEffect(() => {
      if (isAddingResident) fetchAllRooms();
    }, [isAddingResident]);

    const handleViewRooms = async (hostel: any) => {
      setViewingRoomsHostel(hostel);
      setIsLoadingRooms(true);
      try {
        const { fetchHostelRooms } = await import('../../lib/api');
        const res = await fetchHostelRooms(hostel.id);
        setHostelRooms(res);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    const handleSaveRoom = async (roomData: any) => {
      if (!viewingRoomsHostel) return;
      try {
        const { createHostelRoom, updateHostelRoom, fetchHostelRooms } = await import('../../lib/api');
        if (roomData.id && !roomData.id.startsWith('temp-')) {
          await updateHostelRoom(roomData.id, { ...roomData, hostel_id: viewingRoomsHostel.id });
        } else {
          await createHostelRoom({ ...roomData, hostel_id: viewingRoomsHostel.id });
        }
        const res = await fetchHostelRooms(viewingRoomsHostel.id);
        setHostelRooms(res);
        (window as any).showToast?.('Room saved successfully!', 'success');
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to save room', 'error');
      }
    };

    const handleDeleteRoom = async (room: any) => {
      if (!viewingRoomsHostel) return;
      if (!confirm(`Are you sure you want to delete room ${room.room_number}?`)) return;
      try {
        const { deleteHostelRoom, fetchHostelRooms } = await import('../../lib/api');
        await deleteHostelRoom(room.id);
        const res = await fetchHostelRooms(viewingRoomsHostel.id);
        setHostelRooms(res);
        (window as any).showToast?.('Room deleted!', 'success');
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to delete room', 'error');
      }
    };

    const handleViewStudents = async (room: any) => {
      setViewingStudentsRoom(room);
      setIsLoadingStudents(true);
      try {
        const { fetchRoomStudents } = await import('../../lib/api');
        const res = await fetchRoomStudents(room.id);
        setRoomStudents(res);
      } catch (err) {
        console.error('Failed to fetch room students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const handleAssign = async (studentId: string) => {
      if (!viewingStudentsRoom) return;
      try {
        const { assignStudentToRoom, fetchRoomStudents } = await import('../../lib/api');
        await assignStudentToRoom(viewingStudentsRoom.id, studentId);
        const res = await fetchRoomStudents(viewingStudentsRoom.id);
        setRoomStudents(res);
        (window as any).showToast?.('Student assigned and invoice generated!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to assign student', 'error');
      }
    };

    const handleUnassign = async (studentId: string) => {
      try {
        const { unassignStudentFromRoom } = await import('../../lib/api');
        await unassignStudentFromRoom(studentId);
        setRoomStudents(prev => prev.filter(s => s.id !== studentId));
        (window as any).showToast?.('Student unassigned!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to unassign student', 'error');
      }
    };

    return (
      <div className="space-y-6">
      {role === 'STUDENT' || role === 'PARENT' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-1">My Hostel Assignment</h2>
              {allAssignments.filter((a: any) => String(a.id) === String(currentStudentId)).length > 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2">
                  {allAssignments.filter((a: any) => String(a.id) === String(currentStudentId)).map((a: any) => (
                    <div key={a.id}>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">{a.hostel_name} — Room {a.room_number}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                          a.hostel_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        )}>
                          {a.hostel_status || 'Approved'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800/70 dark:text-emerald-200/60 mt-0.5 font-medium">Price: {a.price || '0.00'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">You are not assigned to any hostel yet.</p>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold mb-3">Available Rooms</h2>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Hostel</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Available</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {allRooms.filter((r: any) => Number(r.student_count) < Number(r.capacity)).map((room: any) => (
                      <tr key={room.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold">{room.hostel_name}</td>
                        <td className="px-4 py-3">Room {room.room_number}</td>
                        <td className="px-4 py-3">{room.capacity}</td>
                        <td className="px-4 py-3">{Number(room.capacity) - Number(room.student_count)} slots</td>
                        <td className="px-4 py-3">{room.price || '0.00'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              setHostelRequesting(room.id);
                              try {
                                const { assignStudentToRoom } = await import('../../lib/api');
                                await assignStudentToRoom(room.id, currentStudentId!);
                                (window as any).showToast?.('Hostel room request submitted!', 'success');
                                refreshAssignments();
                                fetchAllRooms();
                                onRefresh?.();
                              } catch (err: any) {
                                (window as any).showToast?.(err?.response?.data?.error || 'Request failed', 'error');
                              } finally {
                                setHostelRequesting(null);
                              }
                            }}
                            disabled={hostelRequesting === room.id}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {hostelRequesting === room.id ? 'Requesting...' : 'Request to Join'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allRooms.filter((r: any) => Number(r.student_count) < Number(r.capacity)).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic text-sm">No available rooms</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div>
          <div className="flex items-center justify-between">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
            <button 
              onClick={() => setViewMode('hostels')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'hostels' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Hostels
            </button>
            <button 
              onClick={() => setViewMode('residents')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'residents' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Manage Residents
            </button>
          </div>
          {viewMode === 'residents' && (
            <button 
              onClick={() => setIsAddingResident(true)}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Resident to Room
            </button>
          )}
        </div>

        {viewMode === 'hostels' ? (
          <DataTable 
            title="Hostel Management" 
            data={data || []}
            onSave={onSave}
            onEdit={() => {}}
            onDelete={onDelete}
            columns={[
            { header: 'Hostel Name', accessor: (item: any) => item.name, className: 'font-bold' },
            { header: 'Type', accessor: (item: any) => (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.type === 'Boys' ? "bg-blue-50 text-blue-600" : 
                item.type === 'Girls' ? "bg-pink-50 text-pink-600" : "bg-zinc-50 text-zinc-600"
              )}>
                {item.type}
              </span>
            )},
            { header: 'Warden', accessor: (item: any) => item.warden_name },
            { header: 'Rooms', accessor: (item: any) => (
              <button 
                onClick={(e) => { e.stopPropagation(); handleViewRooms(item); }}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
              >
                {item.total_rooms || 0} Rooms
              </button>
            )},
            { header: 'Capacity', accessor: (item: any) => item.total_capacity || '0' },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Hostel Name</label>
                <input 
                  name="name" 
                  defaultValue={item?.name} 
                  required 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Type</label>
                  <select 
                    name="type" 
                    defaultValue={item?.type || 'Boys'} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Warden Name</label>
                  <input 
                    name="warden_name" 
                    defaultValue={item?.warden_name} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        />
        ) : (
          <DataTable 
            title="Current Residents"
            data={allAssignments}
            columns={[
              { header: 'Resident Name', accessor: (item: any) => item.name, className: 'font-bold' },
              { header: 'Adm No.', accessor: (item: any) => item.admission_no },
              { header: 'Hostel', accessor: (item: any) => item.hostel_name },
              { header: 'Room', accessor: (item: any) => (
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase">
                  Room {item.room_number}
                </span>
              )},
              { header: 'Status', accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    item.hostel_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {item.hostel_status || 'Approved'}
                  </span>
                  {item.hostel_status === 'Pending' && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Approve hostel request for ${item.name}?`)) return;
                        try {
                          const { approveHostelRequest } = await import('../../lib/api');
                          await approveHostelRequest(item.id);
                          refreshAssignments();
                          onRefresh?.();
                          (window as any).showToast?.('Request approved successfully!', 'success');
                        } catch (err: any) {
                          (window as any).showToast?.('Failed to approve request', 'error');
                        }
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              )},
              { header: 'Price', accessor: (item: any) => item.price || '0.00' },
            ]}
            onDelete={async (item) => {
              const isPending = item.hostel_status === 'Pending';
              if (!confirm(`${isPending ? 'Reject request for' : 'Unassign'} ${item.name} from hostel/room?`)) return;
              try {
                if (isPending) {
                  const { rejectHostelRequest } = await import('../../lib/api');
                  await rejectHostelRequest(item.id);
                } else {
                  const { unassignStudentFromRoom } = await import('../../lib/api');
                  await unassignStudentFromRoom(item.id);
                }
                refreshAssignments();
                onRefresh?.();
                (window as any).showToast?.(isPending ? 'Request rejected' : 'Resident unassigned successfully!', 'success');
              } catch (err: any) {
                (window as any).showToast?.('Failed to unassign/reject', 'error');
              }
            }}
          />
        )}

        {/* Rooms Modal */}
        {viewingRoomsHostel && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Rooms in {viewingRoomsHostel.name}</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{viewingRoomsHostel.type} Hostel</p>
                </div>
                <button 
                  onClick={() => setViewingRoomsHostel(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <DataTable 
                  title="Hostel Rooms"
                  data={hostelRooms}
                  onSave={handleSaveRoom}
                  onDelete={handleDeleteRoom}
                  columns={[
                    { header: 'Room No.', accessor: (item: any) => item.room_number, className: 'font-bold' },
                    { header: 'Price', accessor: (item: any) => item.price ? `${item.price}` : '0.00' },
                    { header: 'Students', accessor: (item: any) => (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewStudents(item); }}
                        className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        {item.student_count || 0} / {item.capacity} Students
                      </button>
                    )},
                    { header: 'Capacity', accessor: (item: any) => item.capacity },
                  ]}
                  renderForm={(item, isViewOnly) => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Room Number</label>
                          <input 
                            name="room_number" 
                            defaultValue={item?.room_number} 
                            required 
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Price (Per Term/Month)</label>
                          <input 
                            type="number"
                            name="price" 
                            defaultValue={item?.price || 0} 
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Capacity</label>
                        <input 
                          type="number"
                          name="capacity" 
                          defaultValue={item?.capacity || 1} 
                          disabled={isViewOnly}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Room Student Management Modal */}
        {viewingStudentsRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Students in Room: {viewingStudentsRoom.room_number}</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{viewingStudentsRoom.hostel_name} | Price: {viewingStudentsRoom.price}</p>
                </div>
                <button 
                  onClick={() => setViewingStudentsRoom(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assign Student to Room</label>
                  <div className="flex gap-2">
                    <select 
                      id="roomStudentToAssign"
                      className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-200 transition-all font-medium"
                    >
                      <option value="">Select a student...</option>
                      {(students || [])
                        .filter(s => !roomStudents.find(rs => rs.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                        ))}
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('roomStudentToAssign') as HTMLSelectElement;
                        if (select.value) handleAssign(select.value);
                      }}
                      disabled={roomStudents.length >= viewingStudentsRoom.capacity}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                    >
                      {roomStudents.length >= viewingStudentsRoom.capacity ? 'Room Full' : 'Assign'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Residents ({roomStudents.length})</label>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      {isLoadingStudents ? (
                        <div className="p-8 text-center text-sm text-zinc-400 font-medium italic">Loading students...</div>
                      ) : roomStudents.length === 0 ? (
                        <div className="p-8 text-center text-sm text-zinc-400 font-medium italic">No students in this room yet.</div>
                      ) : (
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {roomStudents.map(student => (
                              <tr key={student.id} className="group hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                                <td className="px-4 py-3 font-bold">{student.name}</td>
                                <td className="px-4 py-3 text-zinc-500">{student.admission_no}</td>
                                <td className="px-4 py-3 text-right">
                                  <button 
                                    onClick={() => handleUnassign(student.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Add Resident Modal */}
        {isAddingResident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Assign Resident to Room</h2>
                <button 
                  onClick={() => setIsAddingResident(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Student</label>
                  <select 
                    id="newResStudentId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose student...</option>
                    {(students || [])
                      .filter(s => !allAssignments.find(a => a.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Room</label>
                  <select 
                    id="newResRoomId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose room...</option>
                    {allRooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.hostel_name} - Room {r.room_number} ({r.student_count}/{r.capacity})</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={async () => {
                    const sid = (document.getElementById('newResStudentId') as HTMLSelectElement).value;
                    const rid = (document.getElementById('newResRoomId') as HTMLSelectElement).value;
                    if (!sid || !rid) return alert('Select student and room');
                    try {
                      const { assignStudentToRoom } = await import('../../lib/api');
                      await assignStudentToRoom(rid, sid);
                      refreshAssignments();
                      onRefresh?.();
                      setIsAddingResident(false);
                      (window as any).showToast?.('Resident assigned successfully!', 'success');
                    } catch (err: any) {
                      (window as any).showToast?.('Assignment failed', 'error');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
                >
                  Assign to Room
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    );
  },
  Inventory: ({ data, onSave, onDelete }: { data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { currency } = useLanguage();
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const handleDownloadTemplate = () => {
      downloadInventoryTemplate();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const parsed = await parseInventoryExcel(file);
        setPreviewData(parsed);
      } catch (err: any) {
        (window as any).showToast?.('Failed to parse Inventory Excel.', 'error');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };

    const confirmImport = async () => {
      if (!previewData || !onSave) return;
      
      try {
        for (const item of previewData) {
          await onSave(item);
        }
        setPreviewData(null);
        (window as any).showToast?.(`Successfully imported ${previewData.length} inventory items.`, 'success');
      } catch (err) {
        (window as any).showToast?.('Error saving inventory items.', 'error');
      }
    };

    return (
      <div className="space-y-6">
        <DataTable 
          title="Inventory & Assets" 
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          columns={[
            { header: 'Item Name', accessor: (item: any) => item.item_name, className: 'font-bold' },
            { header: 'Category', accessor: (item: any) => item.category },
            { header: 'Status', accessor: (item: any) => (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.status?.toLowerCase().includes('good') ? "bg-emerald-50 text-emerald-600" :
                item.status?.toLowerCase().includes('repair') ? "bg-amber-50 text-amber-600" :
                "bg-zinc-100 text-zinc-600"
              )}>
                {item.status || 'Good Condition'}
              </span>
            )},
            { header: 'Quantity', accessor: (item: any) => item.quantity },
          ]}
          onAdd={onSave ? () => {} : undefined}
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
                Import Excel
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
          )}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Asset Status</p>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase inline-block",
                    item.status?.toLowerCase().includes('good') ? "bg-emerald-50 text-emerald-600" :
                    item.status?.toLowerCase().includes('repair') ? "bg-amber-50 text-amber-600" :
                    "bg-zinc-100 text-zinc-600"
                  )}>
                    {item.status || 'Good Condition'}
                  </span>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Next Maintenance</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {item.next_maintenance_date ? new Date(item.next_maintenance_date).toLocaleDateString() : 'Not Scheduled'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase">Current Inventory</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{item.quantity} Units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Unit Value</p>
                    <p className="text-lg font-black text-indigo-600">{currency}{Number(item.price || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Total Asset Valuation</p>
                  <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-serif">{currency}{(item.quantity * (item.price || 0)).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Category</p>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.category || 'Uncategorized'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Storage Location</p>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.location || 'Not Specified'}</p>
                  </div>
                </div>
              </div>

              {item.created_at && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-center">
                    Asset Registered On: {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Item Name</label>
                <input 
                  name="item_name" 
                  defaultValue={item?.item_name} 
                  required 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                  <input 
                    name="category" 
                    defaultValue={item?.category} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Quantity</label>
                  <input 
                    type="number"
                    name="quantity" 
                    defaultValue={item?.quantity || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Unit Price ({currency})</label>
                  <input 
                    type="number"
                    step="0.01"
                    name="price" 
                    defaultValue={item?.price || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
                  <input 
                    name="location" 
                    defaultValue={item?.location} 
                    disabled={isViewOnly}
                    placeholder="e.g. Lab 1, Library"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                  <select 
                    name="status" 
                    defaultValue={item?.status || 'Good Condition'} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  >
                    <option value="Good Condition">Good Condition</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Replacement Needed">Replacement Needed</option>
                    <option value="Lost/Stolen">Lost/Stolen</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-zinc-500 uppercase italic">Next Maintenance Date</label>
                <input 
                  type="date"
                  name="next_maintenance_date" 
                  defaultValue={item?.next_maintenance_date} 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
            </div>
          )}
        />

        {/* Inventory Import Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview Inventory Import</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Review the list of items before updating the inventory</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-bold">{row.item_name}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3 font-bold">{row.quantity}</td>
                        <td className="px-4 py-3">{currency}{row.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-black text-indigo-600">{currency}{(row.quantity * row.price).toLocaleString()}</td>
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
                  Confirm & Import {previewData.length} Items
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  HealthMedical: ({ role, currentStudentId, wards, data, staffList, students, onSave, onDelete }: { role?: UserRole, currentStudentId?: string, wards?: Ward[], data?: any[], staffList?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [selectedWardId, setSelectedWardId] = useState(wards?.[0]?.id || "");
    const filteredData = role === 'PARENT' ? (data || []).filter(d => d.wardId === selectedWardId) : (data || []);

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
          data={filteredData || []}
          onSave={onSave}
          onEdit={() => {}}
          onDelete={onDelete}
          columns={[
            { header: 'Student', accessor: (item: any) => item.student_name, className: 'font-bold' },
            { header: 'Condition', accessor: (item: any) => item.condition },
            { header: 'Treatment', accessor: (item: any) => item.treatment },
            { header: 'Doctor', accessor: (item: any) => item.doctor_name },
            { header: 'Date', accessor: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Student</label>
                <select 
                  name="student_id" 
                  defaultValue={item?.student_id} 
                  required 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                >
                  <option value="">Select Student...</option>
                  {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Condition</label>
                  <input 
                    name="condition" 
                    defaultValue={item?.condition} 
                    required 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Treatment</label>
                  <input 
                    name="treatment" 
                    defaultValue={item?.treatment} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Doctor Name</label>
                  <input 
                    name="doctor_name" 
                    defaultValue={item?.doctor_name} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
                  <input 
                    type="date"
                    name="date" 
                    defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  },
  BehaviorDiscipline: ({ role, currentStudentId, data, students, onSave, onDelete }: { role?: UserRole, currentStudentId?: string, data?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => (
    <DataTable 
      title="Behavior & Discipline" 
      data={data || []}
      onSave={onSave}
      onEdit={() => {}}
      onDelete={onDelete}
      columns={[
        { header: 'Student Name', accessor: (item: any) => item.student_name, className: 'font-bold' },
        { header: 'Incident', accessor: (item: any) => item.incident },
        { header: 'Action Taken', accessor: (item: any) => item.action_taken },
        { header: 'Date', accessor: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
        { 
          header: 'Severity', 
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.severity === 'High' ? "bg-red-50 text-red-600" : 
              item.severity === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {item.severity}
            </span>
          )
        },
      ]}
      onAdd={onSave ? () => {} : undefined}
      renderForm={(item, isViewOnly) => (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Student</label>
            <select 
              name="student_id" 
              defaultValue={item?.student_id} 
              required 
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            >
              <option value="">Select Student...</option>
              {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Incident Description</label>
            <textarea
              name="incident" 
              defaultValue={item?.incident} 
              required 
              disabled={isViewOnly}
              rows={3}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Action Taken</label>
              <input 
                name="action_taken" 
                defaultValue={item?.action_taken} 
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Severity</label>
              <select 
                name="severity" 
                defaultValue={item?.severity || 'Low'} 
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
            <input 
              type="date"
              name="date" 
              defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
          </div>
        </div>
      )}
    />
  ),
  Clubs: ({ role, currentStudentId, data, students, staff, onSave, onDelete, onRefresh }: { role?: string, currentStudentId?: string, data?: any[], students?: any[], staff?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const [viewingMembers, setViewingMembers] = useState<any | null>(null);
    const [clubMembers, setClubMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [viewMode, setViewMode] = useState<'clubs' | 'memberships'>('clubs');
    const [allMemberships, setAllMemberships] = useState<any[]>([]);
    const [isAddingMember, setIsAddingMember] = useState(false);

    const refreshMemberships = async () => {
      try {
        const { fetchClubMemberships } = await import('../../lib/api');
        const res = await fetchClubMemberships();
        setAllMemberships(res);
      } catch (err) {
        console.error('Failed to fetch memberships:', err);
      }
    };

    React.useEffect(() => {
      refreshMemberships();
    }, [viewMode]);

    const handleViewMembers = async (club: any) => {
      setViewingMembers(club);
      setIsLoadingMembers(true);
      try {
        // We filter memberships by club_id
        const res = allMemberships.filter(m => m.club_id === club.id);
        setClubMembers(res);
      } catch (err) {
        console.error('Failed to filter club members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const handleJoin = async (clubId: string, studentId: string) => {
      try {
        const { joinClub } = await import('../../lib/api');
        await joinClub({ club_id: clubId, student_id: studentId });
        (window as any).showToast?.('Successfully joined club!', 'success');
        refreshMemberships();
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to join club', 'error');
      }
    };

    const handleLeave = async (membershipId: string) => {
      try {
        const { leaveClub } = await import('../../lib/api');
        await leaveClub(membershipId);
        (window as any).showToast?.('Left club!', 'success');
        refreshMemberships();
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to leave club', 'error');
      }
    };

    const handleApprove = async (membershipId: string) => {
      try {
        const { updateMembershipStatus } = await import('../../lib/api');
        await updateMembershipStatus(membershipId, 'Active');
        (window as any).showToast?.('Membership approved!', 'success');
        refreshMemberships();
      } catch (err: any) {
        (window as any).showToast?.(err?.response?.data?.error || 'Failed to approve', 'error');
      }
    };

    if (role === 'STUDENT' || role === 'PARENT') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data || []).map((club: any) => {
              const myMembership = allMemberships.find(m => m.club_id === club.id && m.student_id === currentStudentId);
              return (
                <div key={club.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    {club.dues_amount > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800">
                        <CreditCard className="w-3 h-3" />
                        ${club.dues_amount} / {club.dues_frequency}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{club.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{club.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Schedule:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{club.meeting_schedule}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Category:</span>
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md font-medium text-zinc-600 dark:text-zinc-400">{club.category}</span>
                    </div>
                  </div>

                  {myMembership ? (
                    <div className="flex items-center justify-between mt-auto">
                      <span className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full",
                        myMembership.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {myMembership.status}
                      </span>
                      <button 
                        onClick={() => handleLeave(myMembership.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-600"
                      >
                        Leave Club
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(club.id, currentStudentId!)}
                      disabled={club.status !== 'Active'}
                      className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {club.status === 'Active' ? 'Join Club' : 'Inactive'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('clubs')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              viewMode === 'clubs' ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Manage Clubs
          </button>
          <button
            onClick={() => setViewMode('memberships')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              viewMode === 'memberships' ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            All Memberships
          </button>
        </div>

        {viewMode === 'clubs' ? (
          <DataTable
            data={data}
            title="Student Clubs"
            onSave={onSave}
            onAdd={onSave ? () => {} : undefined}
            onDelete={onDelete}
            columns={[
              { header: 'Club Name', accessor: (row: any) => row.name },
              { header: 'Category', accessor: (row: any) => row.category },
              { header: 'Schedule', accessor: (row: any) => row.meeting_schedule },
              { header: 'Dues', accessor: (row: any) => row.dues_amount ? `$${row.dues_amount}` : 'Free' },
              { header: 'Members', accessor: (row: any) => row.member_count || 0 },
              { header: 'Status', accessor: (row: any) => row.status },
            ]}
            extraActions={(row) => (
              <button
                onClick={() => handleViewMembers(row)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                View Members
              </button>
            )}
            renderForm={(item, isViewOnly) => (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Club Name</label>
                    <input name="name" defaultValue={item?.name} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                    <input name="category" defaultValue={item?.category} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                  <textarea name="description" defaultValue={item?.description} rows={3} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Schedule</label>
                    <input name="meeting_schedule" defaultValue={item?.meeting_schedule} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" placeholder="e.g. Every Friday, 3 PM" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Patron/Staff ID</label>
                    <select name="patron_staff_id" defaultValue={item?.patron_staff_id} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="">Select Patron...</option>
                      {(staff || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Dues Amount</label>
                    <input type="number" name="dues_amount" defaultValue={item?.dues_amount || 0} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Frequency</label>
                    <select name="dues_frequency" defaultValue={item?.dues_frequency || 'Per Term'} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="One-time">One-time</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Per Term">Per Term</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                    <select name="status" defaultValue={item?.status || 'Active'} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          <DataTable
            data={allMemberships}
            title="Club Memberships"
            columns={[
              { header: 'Student', accessor: (row: any) => row.student_name },
              { header: 'Club', accessor: (row: any) => row.club_name },
              { header: 'Status', accessor: (row: any) => row.status },
              { header: 'Date', accessor: (row: any) => row.joined_at ? new Date(row.joined_at).toLocaleDateString() : 'N/A' },
            ]}
            extraActions={(row) => (
              <>
                {row.status !== 'Active' && (
                  <button
                    onClick={() => handleApprove(row.id)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approve
                  </button>
                )}
              </>
            )}
            onDelete={async (item) => handleLeave(item.id)}
          />
        )}

        {/* Members Dashboard / Overlay */}
        {viewingMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
            <div className="w-full max-w-2xl h-full bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black">{viewingMembers?.name}</h2>
                    <p className="text-zinc-500">Club Members & Enrollment</p>
                  </div>
                  <button onClick={() => setViewingMembers(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold uppercase text-zinc-400 mb-4">Add Student to Club</h3>
                    <div className="flex gap-3">
                      <select id="manualStudentSelector" className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                        <option value="">Select Student...</option>
                        {(students || []).filter(s => !clubMembers.some(m => m.student_id === s.id)).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                        ))}
                      </select>
                      <button
                                    onClick={() => {
                                      const sid = (document.getElementById('manualStudentSelector') as HTMLSelectElement).value;
                                      if (sid && viewingMembers?.id) handleJoin(viewingMembers.id, sid);
                                    }}
                        className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>

                  <DataTable
                    data={allMemberships.filter(m => m.club_id === viewingMembers?.id)}
                    title="Active Members"
                    columns={[
                      { header: 'Student', accessor: (row: any) => row.student_name },
                      { header: 'Status', accessor: (row: any) => row.status },
                    ]}
                    onDelete={(row) => handleLeave(row.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
};
