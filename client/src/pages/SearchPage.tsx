import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Room, RoomType } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { Calendar, Users, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search parameters
  const [checkIn, setCheckIn] = useState<string>(
    searchParams.get('checkInDate') || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [checkOut, setCheckOut] = useState<string>(
    searchParams.get('checkOutDate') || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [guests, setGuests] = useState<string>(searchParams.get('guests') || '1');
  const [selectedRoomType, setSelectedRoomType] = useState<string>(searchParams.get('roomTypeId') || '');

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [holdingRoomId, setHoldingRoomId] = useState<string | null>(null);

  // Calculate nights
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Load room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get('/room-types');
        if (res.data?.data) {
          setRoomTypes(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoomTypes();
  }, []);

  const executeSearch = async (cIn = checkIn, cOut = checkOut, g = guests, rt = selectedRoomType) => {
    if (new Date(cIn) >= new Date(cOut)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params: any = {
        checkInDate: cIn,
        checkOutDate: cOut,
        guests: parseInt(g, 10),
      };
      if (rt) params.roomTypeId = rt;

      const res = await api.get('/availability', { params });
      if (res.data?.success) {
        setAvailableRooms(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to search available rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleBookRoom = async (room: Room) => {
    if (!user) {
      toast('Please sign in or register to complete your reservation', { icon: 'ℹ️' });
      navigate('/login', { state: { returnTo: `/checkout?roomId=${room.id}&checkInDate=${checkIn}&checkOutDate=${checkOut}&guests=${guests}` } });
      return;
    }

    setHoldingRoomId(room.id);
    try {
      // 1. Create temporary hold
      const holdRes = await api.post('/reservations/holds', {
        roomId: room.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });

      if (holdRes.data?.success) {
        const hold = holdRes.data.data.hold;
        toast.success(`Room ${room.roomNumber} is temporarily held for 15 minutes!`);
        navigate(`/checkout?roomId=${room.id}&holdId=${hold.id}&checkInDate=${checkIn}&checkOutDate=${checkOut}&guests=${guests}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Room is no longer available. Please select another room.');
      // Refresh search
      executeSearch();
    } finally {
      setHoldingRoomId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Search Room Availability</h1>
        <p className="text-slate-600 text-sm mt-1">Select your dates to discover real-time live availability with concurrency protection.</p>
      </div>

      {/* Search Filter Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Check-In</span>
            </label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Check-Out</span>
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room Type</label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            >
              <option value="">All Categories</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[38px] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
            >
              {loading ? 'Searching...' : 'Update Search'}
            </button>
          </div>
        </form>

        {/* Selected Duration Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Selected Stay: <span className="font-bold text-slate-900">{checkIn}</span> to <span className="font-bold text-slate-900">{checkOut}</span> ({nights} {nights === 1 ? 'night' : 'nights'})
          </div>
          <div className="text-brand-700 font-medium">
            Live Database Synchronization Active
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Available Rooms ({availableRooms.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Prices include calculated itemized taxes at checkout</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : searched && availableRooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Rooms Available for These Dates</h3>
            <p className="text-sm text-slate-600">
              All inventory in this category is currently booked or held by other guests. Please select alternative dates or a different room size.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRooms.map((room) => {
              const subtotal = room.roomType.basePrice * nights;
              const estTax = Math.round(subtotal * 0.12 * 100) / 100;
              const estTotal = Math.round((subtotal + estTax) * 100) / 100;

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={room.roomType.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                        alt={room.roomType.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        Room {room.roomNumber} • Floor {room.floor}
                      </div>
                      <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        Up to {room.roomType.capacity} Guests
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{room.roomType.name}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{room.roomType.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {room.roomType.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>{formatCurrency(room.roomType.basePrice)} × {nights} nights</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Est. Tax (12%)</span>
                        <span>{formatCurrency(estTax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Est. Total</span>
                        <span className="text-brand-700 font-extrabold">{formatCurrency(estTotal)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookRoom(room)}
                      disabled={holdingRoomId === room.id}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <span>{holdingRoomId === room.id ? 'Creating Hold...' : 'Select & Hold Room'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
