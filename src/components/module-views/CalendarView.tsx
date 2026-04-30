import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Info, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { DataTable } from '../DataTable';
import { useLanguage } from '../../lib/LanguageContext';
import * as api from '../../lib/api';
import { cn } from '../../lib/utils';

interface CalendarEvent {
  id: string;
  event_name: string;
  event_description: string;
  start_date: string;
  end_date: string;
  event_type: string;
}

export function CalendarView({ role }: { role: string }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  const isAdmin = role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';

  const fetchEvents = async () => {
    try {
      const data = await api.fetchCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        await api.updateCalendarEvent(data.id, data);
      } else {
        await api.createCalendarEvent(data);
      }
      fetchEvents();
    } catch (err) {
      console.error('Failed to save calendar event:', err);
    }
  };

  const handleDelete = async (item: CalendarEvent) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteCalendarEvent(item.id);
        fetchEvents();
      } catch (err) {
        console.error('Failed to delete calendar event:', err);
      }
    }
  };

  // Grid Logic
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();

  const totalDays = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const columns = [
    { header: 'Event Name', accessor: 'event_name' as keyof CalendarEvent },
    { header: 'Type', accessor: 'event_type' as keyof CalendarEvent },
    { header: 'Start Date', accessor: (item: CalendarEvent) => new Date(item.start_date).toLocaleDateString() },
    { header: 'End Date', accessor: (item: CalendarEvent) => item.end_date ? new Date(item.end_date).toLocaleDateString() : '-' },
  ];

  const renderForm = (item?: CalendarEvent) => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Event Name</label>
        <input
          name="event_name"
          defaultValue={item?.event_name}
          required
          placeholder="e.g. Mid-Term Break"
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            name="start_date"
            defaultValue={item?.start_date ? new Date(item.start_date).toISOString().split('T')[0] : ''}
            required
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
          <input
            type="date"
            name="end_date"
            defaultValue={item?.end_date ? new Date(item.end_date).toISOString().split('T')[0] : ''}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Event Type</label>
        <select
          name="event_type"
          defaultValue={item?.event_type || 'Event'}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Event">Event</option>
          <option value="Holiday">Holiday</option>
          <option value="Exam">Exam</option>
          <option value="Meeting">Meeting</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
        <textarea
          name="event_description"
          defaultValue={item?.event_description}
          rows={3}
          placeholder="Brief details about the event..."
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Academic Calendar
          </h2>
          <p className="text-zinc-500 mt-1">View and manage school events and holidays.</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm self-start">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              viewMode === 'grid' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              viewMode === 'list' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {monthNames[month]} <span className="text-indigo-600">{year}</span>
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-100 dark:border-zinc-800"
              >
                <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-all border border-zinc-200 dark:border-zinc-700"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-100 dark:border-zinc-800"
              >
                <ChevronRight className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 pb-4 custom-scrollbar">
            <div className="min-w-[600px] md:min-w-0 grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="bg-zinc-50 dark:bg-zinc-800/80 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  {day.slice(0, 3)}
                </div>
              ))}
              {days.map((day, idx) => {
                const currentDayStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                const dayEvents = events.filter(e => {
                   const start = e.start_date.split('T')[0];
                   const end = e.end_date ? e.end_date.split('T')[0] : start;
                   return currentDayStr && currentDayStr >= start && currentDayStr <= end;
                });

                const isToday = new Date().toISOString().split('T')[0] === currentDayStr;
                const isSelected = selectedDateStr === currentDayStr;

                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (day) {
                        setSelectedDateStr(currentDayStr);
                        setSelectedDayEvents(dayEvents);
                      }
                    }}
                    className={cn(
                      "bg-white dark:bg-zinc-900 min-h-[120px] md:min-h-[140px] p-2 md:p-3 transition-all cursor-pointer relative group",
                      !day ? "bg-zinc-50/50 dark:bg-zinc-800/20 cursor-default" : "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10",
                      isSelected && "ring-2 ring-inset ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                    )}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn(
                            "inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-sm md:text-base font-bold transition-all",
                            isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : 
                            isSelected ? "text-indigo-600 font-black scale-110" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600"
                          )}>
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="md:hidden flex gap-0.5">
                              {dayEvents.slice(0, 3).map(e => (
                                <div key={e.id} className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  e.event_type === 'Holiday' ? "bg-rose-500" : "bg-indigo-500"
                                )} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 hidden md:block">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              title={event.event_name + (event.event_description ? ": " + event.event_description : "")}
                              className={cn(
                                "px-2.5 py-1.5 text-[10px] font-bold rounded-xl whitespace-normal leading-[1.2] shadow-sm border transition-all hover:translate-x-1",
                                event.event_type === 'Holiday' ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50" :
                                event.event_type === 'Exam' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50" :
                                event.event_type === 'Meeting' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50" :
                                "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900/50"
                              )}
                            >
                              <span className="flex items-start gap-1.5">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                                  event.event_type === 'Holiday' ? "bg-rose-600" :
                                  event.event_type === 'Exam' ? "bg-amber-600" :
                                  "bg-indigo-600"
                                )} />
                                <span>{event.event_name}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDateStr && selectedDayEvents.length > 0 && (
            <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                  Events for {new Date(selectedDateStr).toLocaleDateString(undefined, { dateStyle: 'full' })}
                </h4>
                <button onClick={() => setSelectedDateStr(null)} className="text-zinc-400 hover:text-zinc-600 text-[10px] font-bold uppercase">Clear</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex gap-4 items-start">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      event.event_type === 'Holiday' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                      event.event_type === 'Exam' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                      "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                    )}>
                      {event.event_type === 'Holiday' ? <Plus className="w-5 h-5 rotate-45" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{event.event_name}</p>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{event.event_description || 'No description provided.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap gap-4 items-center text-xs text-zinc-500 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" /> Holiday</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Exam</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500" /> Event</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Meeting</span>
          </div>
        </div>
      ) : (
        <DataTable
          title="Calendar Events"
          data={events}
          columns={columns}
          onAdd={isAdmin ? () => {} : undefined}
          onEdit={isAdmin ? (item) => {} : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          onSave={isAdmin ? handleSave : undefined}
          renderForm={renderForm}
          searchPlaceholder="Search events..."
        />
      )}
    </div>
  );
}
