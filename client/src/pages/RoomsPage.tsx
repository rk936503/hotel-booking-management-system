import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RoomType } from '../types';
import { Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacityFilter, setCapacityFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/room-types');
        if (res.data?.data) {
          setRoomTypes(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load room catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filtered = roomTypes.filter((rt) => {
    if (capacityFilter === 'ALL') return true;
    return rt.capacity >= parseInt(capacityFilter, 10);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-8">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-brand-600">Inventory Catalog</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Accommodations & Suites</h1>
          <p className="text-slate-600 text-sm mt-1">Explore our range of beautifully designed rooms equipped with premium amenities.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Min Capacity:</label>
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="ALL">All Sizes</option>
            <option value="1">1+ Guests</option>
            <option value="2">2+ Guests</option>
            <option value="3">3+ Guests</option>
            <option value="4">4+ Guests</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-base">No rooms match your capacity selection.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((rt) => (
            <div
              key={rt.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col md:flex-row"
            >
              {/* Image */}
              <div className="md:w-5/12 h-64 md:h-auto relative bg-slate-100 overflow-hidden">
                <img
                  src={rt.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                  alt={rt.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-brand-400" />
                  <span>Max {rt.capacity} {rt.capacity === 1 ? 'Guest' : 'Guests'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-slate-900">{rt.name}</h2>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">${rt.basePrice}</span>
                      <span className="text-xs text-slate-500 font-medium block">per night</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">{rt.description}</p>

                  <div className="mt-5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Room Amenities</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {rt.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center space-x-1.5 text-xs text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Free cancellation up to 48h before check-in</span>
                  <button
                    onClick={() => navigate(`/search?roomTypeId=${rt.id}`)}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center space-x-2"
                  >
                    <span>Check Dates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
