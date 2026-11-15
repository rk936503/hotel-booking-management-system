import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Reservation, Room } from '../types';
import { formatCurrency } from '../utils/currency';
import { 
  ClipboardList, 
  LogIn, 
  LogOut, 
  Calendar, 
  DoorClosed, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Wrench,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'ARRIVALS' | 'DEPARTURES' | 'ROOMS'>('OPERATIONS');
  
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [arrRes, depRes, allRes, roomsRes] = await Promise.all([
        api.get('/staff/arrivals'),
        api.get('/staff/departures'),
        api.get('/reservations?limit=50'),
        api.get('/rooms?limit=50'),
      ]);

      if (arrRes.data?.data) setArrivals(arrRes.data.data);
      if (depRes.data?.data) setDepartures(depRes.data.data);
      if (allRes.data?.data) setAllReservations(allRes.data.data);
      if (roomsRes.data?.data) setRooms(roomsRes.data.data);
    } catch (err: any) {
      toast.error('Failed to load operational staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleCheckIn = async (reservationId: string, bookingRef: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await api.patch(`/staff/reservations/${reservationId}/check-in`);
      if (res.data?.success) {
        toast.success(`Guest checked in! Room is now marked OCCUPIED (${bookingRef})`);
        fetchStaffData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (reservationId: string, bookingRef: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await api.patch(`/staff/reservations/${reservationId}/check-out`);
      if (res.data?.success) {
        toast.success(`Guest checked out! Room returned to AVAILABLE (${bookingRef})`);
        fetchStaffData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/rooms/${roomId}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Room status updated to ${newStatus}`);
        fetchStaffData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  // Filter reservations by search
  const filteredReservations = allReservations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.bookingReference.toLowerCase().includes(q) ||
      (r.user?.fullName && r.user.fullName.toLowerCase().includes(q)) ||
      (r.user?.email && r.user.email.toLowerCase().includes(q)) ||
      r.room.roomNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              Front Desk Operations
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Staff Operational Desk</h1>
          <p className="text-slate-600 text-sm mt-0.5">Manage daily arrivals, guest check-ins, departures, and live room housekeeping statuses.</p>
        </div>

        <button
          onClick={fetchStaffData}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Arrivals</span>
            <LogIn className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{arrivals.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Awaiting Check-In</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Departures</span>
            <LogOut className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{departures.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Scheduled Check-Out</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Occupied Rooms</span>
            <DoorClosed className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {rooms.filter((r) => r.status === 'OCCUPIED').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Active Guest Stays</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Under Maintenance</span>
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {rooms.filter((r) => r.status === 'MAINTENANCE').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Blocked from Booking</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6">
        {[
          { id: 'OPERATIONS', label: 'All Reservations' },
          { id: 'ARRIVALS', label: `Today's Arrivals (${arrivals.length})` },
          { id: 'DEPARTURES', label: `Today's Departures (${departures.length})` },
          { id: 'ROOMS', label: `Room Status Manager (${rooms.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL RESERVATIONS */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by reference, guest name, email, room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-5 py-3.5">Room</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Operational Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{res.bookingReference}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{res.user?.fullName}</div>
                        <div className="text-[11px] text-slate-500">{res.user?.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">Room {res.room.roomNumber}</span>
                        <span className="text-[11px] text-slate-500 block">{res.room.roomType.name}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {new Date(res.checkInDate).toLocaleDateString('en-IN')} → {new Date(res.checkOutDate).toLocaleDateString('en-IN')}
                        <span className="text-[11px] text-slate-400 block">{res.numberOfNights} nights</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{formatCurrency(res.totalAmount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          res.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          res.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                          res.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' :
                          res.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {res.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckIn(res.id, res.bookingReference)}
                            disabled={actionLoadingId === res.id}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Check-In</span>
                          </button>
                        )}
                        {res.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleCheckOut(res.id, res.bookingReference)}
                            disabled={actionLoadingId === res.id}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check-Out</span>
                          </button>
                        )}
                        {res.status !== 'CONFIRMED' && res.status !== 'CHECKED_IN' && (
                          <span className="text-xs text-slate-400 font-medium">No Action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TODAY'S ARRIVALS */}
      {activeTab === 'ARRIVALS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {arrivals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No confirmed arrivals scheduled for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-5 py-3.5">Room</th>
                    <th className="px-5 py-3.5">Total Paid</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {arrivals.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{res.bookingReference}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{res.user?.fullName}</div>
                        <div className="text-[11px] text-slate-500">{res.user?.phone || res.user?.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">Room {res.room.roomNumber}</span>
                        <span className="text-[11px] text-slate-500 block">{res.room.roomType.name}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">{formatCurrency(res.totalAmount)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleCheckIn(res.id, res.bookingReference)}
                          disabled={actionLoadingId === res.id}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Complete Check-In</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TODAY'S DEPARTURES */}
      {activeTab === 'DEPARTURES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {departures.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No guest departures scheduled for today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-5 py-3.5">Room</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departures.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{res.bookingReference}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{res.user?.fullName}</td>
                      <td className="px-5 py-4">Room {res.room.roomNumber} ({res.room.roomType.name})</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleCheckOut(res.id, res.bookingReference)}
                          disabled={actionLoadingId === res.id}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Complete Check-Out</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ROOM STATUS MANAGER */}
      {activeTab === 'ROOMS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Operational Room Inventory</h3>
              <p className="text-xs text-slate-500">Update maintenance status or room availability in real-time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Room {room.roomNumber}</div>
                  <div className="text-xs text-slate-500">{room.roomType?.name} • Floor {room.floor}</div>
                </div>

                <div>
                  <select
                    value={room.status}
                    onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                      room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      room.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
