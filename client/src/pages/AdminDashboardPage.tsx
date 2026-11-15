import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DashboardStats, Room, RoomType, User, AuditLog } from '../types';
import { formatCurrency, formatCurrencyCompact } from '../utils/currency';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';
import {
  Shield, IndianRupee, Bed, Calendar, Users, Activity, Plus, Trash2, Edit3, CheckCircle, RefreshCw, Layers, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'ROOMS' | 'ROOM_TYPES' | 'USERS' | 'AUDIT'>('ANALYTICS');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Room Modal / Form state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');

  // New Room Type Modal state
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('4000.00');
  const [newTypeCap, setNewTypeCap] = useState('2');
  const [newTypeAmenities, setNewTypeAmenities] = useState('Wi-Fi, TV, Mini Bar, Coffee Maker');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, roomsRes, typesRes, usersRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/rooms?limit=100'),
        api.get('/room-types'),
        api.get('/admin/users?limit=50'),
        api.get('/audit-logs?limit=50'),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (roomsRes.data?.data) setRooms(roomsRes.data.data);
      if (typesRes.data?.data) setRoomTypes(typesRes.data.data);
      if (usersRes.data?.data) setUsers(usersRes.data.data);
      if (auditRes.data?.data) setAuditLogs(auditRes.data.data);
    } catch (err: any) {
      toast.error('Failed to load administrative analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms', {
        roomNumber: newRoomNumber,
        floor: parseInt(newRoomFloor, 10),
        roomTypeId: newRoomTypeId || roomTypes[0]?.id,
      });

      if (res.data?.success) {
        toast.success(`Room ${newRoomNumber} created successfully!`);
        setShowRoomModal(false);
        setNewRoomNumber('');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room');
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amenitiesArr = newTypeAmenities.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.post('/room-types', {
        name: newTypeName,
        description: newTypeDesc,
        basePrice: parseFloat(newTypePrice),
        capacity: parseInt(newTypeCap, 10),
        amenities: amenitiesArr,
      });

      if (res.data?.success) {
        toast.success(`Room Type ${newTypeName} created!`);
        setShowRoomTypeModal(false);
        setNewTypeName('');
        setNewTypeDesc('');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room type');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole}`);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteRoom = async (roomId: string, roomNum: string) => {
    if (!confirm(`Delete Room ${roomNum}? Only rooms with zero reservations can be deleted.`)) return;
    try {
      const res = await api.delete(`/rooms/${roomId}`);
      if (res.data?.success) {
        toast.success(`Room ${roomNum} deleted.`);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete room with active/past reservations.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Executive Administration</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Admin Analytics & Management</h1>
          <p className="text-slate-600 text-sm mt-0.5">Real-time revenue metrics, occupancy tracking, inventory controls, and security audit logs.</p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
        {[
          { id: 'ANALYTICS', label: 'Dashboard & Reports' },
          { id: 'ROOMS', label: `Room Inventory (${rooms.length})` },
          { id: 'ROOM_TYPES', label: `Room Categories (${roomTypes.length})` },
          { id: 'USERS', label: `User Roles (${users.length})` },
          { id: 'AUDIT', label: `System Audit Trail (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & REPORTS */}
      {activeTab === 'ANALYTICS' && stats && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(stats.revenue.total)}</div>
              <span className="text-xs text-slate-500 mt-1 block">From successful card/UPI/NetBanking transactions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Current Occupancy</span>
                <Activity className="w-5 h-5 text-brand-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.rooms.occupancyRate}%</div>
              <span className="text-xs text-slate-500 mt-1 block">
                {stats.rooms.occupied} occupied / {stats.rooms.total} total rooms
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Confirmed Bookings</span>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.reservations.confirmed}</div>
              <span className="text-xs text-slate-500 mt-1 block">Total all-time reservations: {stats.reservations.total}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Available Inventory</span>
                <Bed className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats.rooms.available}</div>
              <span className="text-xs text-slate-500 mt-1 block">{stats.rooms.maintenance} in maintenance</span>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">12-Month Rolling Revenue Trend</h3>
                <p className="text-xs text-slate-500">Aggregated database transaction ledger</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Live Data
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenue.monthly}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOM MANAGEMENT */}
      {activeTab === 'ROOMS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Physical Room Inventory</h3>
              <p className="text-xs text-slate-500">Add, configure, or retire individual rooms across floors.</p>
            </div>
            <button
              onClick={() => setShowRoomModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Room</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Room Number</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Floor</th>
                  <th className="px-5 py-3.5">Nightly Rate</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">Room {r.roomNumber}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{r.roomType?.name}</td>
                    <td className="px-5 py-4 text-slate-600">Floor {r.floor}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatCurrency(r.roomType?.basePrice)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        r.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteRoom(r.id, r.roomNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM TYPES */}
      {activeTab === 'ROOM_TYPES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Room Categories & Pricing</h3>
              <p className="text-xs text-slate-500">Configure base rates, guest capacities, and amenity packages.</p>
            </div>
            <button
              onClick={() => setShowRoomTypeModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room Type</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roomTypes.map((rt) => (
              <div key={rt.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{rt.name}</h4>
                    <span className="text-xs font-semibold text-brand-700">Max {rt.capacity} Guests • {rt._count?.rooms || 0} Rooms Assigned</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(rt.basePrice)}</span>
                    <span className="text-xs text-slate-500 block">/ night</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rt.description}</p>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Amenities</span>
                  <div className="flex flex-wrap gap-1">
                    {rt.amenities.map((a, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USER ROLES */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">User Access Control (RBAC)</h3>
            <p className="text-xs text-slate-500">Assign roles to promote staff members or grant admin privileges.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{u.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-500">{u.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'STAFF' ? 'bg-blue-100 text-blue-800' : 'bg-brand-100 text-brand-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="GUEST">GUEST</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">System Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable ledger tracking material actions across entities.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">User / Actor</th>
                  <th className="px-4 py-3">Details (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.action}</td>
                    <td className="px-4 py-3 text-brand-700">{log.entityType}</td>
                    <td className="px-4 py-3 text-slate-700">{log.user?.email || 'SYSTEM'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.newValue || ''}>
                      {log.newValue || log.oldValue || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Hotel Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 601"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Floor</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Room Category</label>
                <select
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none bg-white"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name} ({formatCurrency(rt.basePrice)}/night)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Type Modal */}
      {showRoomTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Room Category</h3>
            <form onSubmit={handleCreateRoomType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penthouse Suite"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Base Price (₹ INR / night)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTypePrice}
                    onChange={(e) => setNewTypePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={newTypeCap}
                    onChange={(e) => setNewTypeCap(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={newTypeAmenities}
                  onChange={(e) => setNewTypeAmenities(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoomTypeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
