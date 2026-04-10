import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { UserRole, Ward } from '../../types';

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
  Inventory: ({ data, onSave, onDelete }: { data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => (
    <DataTable 
      title="Inventory & Assets" 
      data={data || []}
      onSave={onSave}
      onDelete={onDelete}
      columns={[
        { header: 'Item Name', accessor: (item: any) => item.item_name, className: 'font-bold' },
        { header: 'Category', accessor: (item: any) => item.category },
        { header: 'Quantity', accessor: (item: any) => item.quantity },
        { header: 'Unit Price', accessor: (item: any) => `₦${Number(item.price || 0).toLocaleString()}` },
      ]}
      onAdd={onSave ? () => {} : undefined}
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
              <label className="text-xs font-bold text-zinc-500 uppercase">Unit Price</label>
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
        </div>
      )}
    />
  ),
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
};
