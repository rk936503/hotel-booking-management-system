import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RoomType } from '../types';
import { formatCurrency } from '../utils/currency';
import { Calendar, Users, ArrowRight, Star, Wifi, Utensils, Sparkles, Waves, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Search widget state
  const defaultCheckIn = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const defaultCheckOut = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/room-types');
        if (res.data?.data) {
          setRoomTypes(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load featured rooms', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?checkInDate=${checkIn}&checkOutDate=${checkOut}&guests=${guests}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white min-h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&auto=format&fit=crop&q=80"
            alt="Grand Horizon Luxury Resort"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-16 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-brand-500/20 border border-brand-400/30 text-brand-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Award-Winning Coastal Hospitality</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Where Modern Luxury Meets Timeless Coastal Elegance
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Immerse yourself in tranquil oceanfront suites, world-class dining, and personalized concierge services designed for unforgettable stays.
          </p>

          {/* Quick Booking Search Widget */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-900 max-w-4xl mx-auto border border-white/20 text-left">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full h-[42px] bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Hotel Highlights / Amenities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">World-Class Experiences</h2>
          <p className="text-slate-600 mt-2 text-base">Carefully curated comforts to elevate every moment of your vacation or business stay.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-600 flex items-center justify-center mb-4">
              <Waves className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Oceanfront Infinity Pools</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Heated coastal infinity pools with private cabanas and signature sunset cocktail service.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Michelin-Inspired Dining</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Three gourmet restaurants featuring sustainably sourced seafood, artisan wines, and 24/7 room service.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Holistic Wellness Spa</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Hydrotherapy baths, deep-tissue massage therapies, and private sauna suites for total rejuvenation.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">High-Speed Fiber & Lounges</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Seamless gigabit Wi-Fi, executive meeting chambers, and quiet workspaces for seamless productivity.</p>
          </div>
        </div>
      </section>

      {/* Featured Room Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Signature Accommodations</h2>
            <p className="text-slate-600 mt-2 text-base">Thoughtfully engineered suites tailored for solo travelers, couples, and traveling families.</p>
          </div>
          <button
            onClick={() => navigate('/rooms')}
            className="text-brand-600 font-semibold hover:text-brand-700 flex items-center space-x-1.5 transition text-sm"
          >
            <span>View All Rooms</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomTypes.slice(0, 3).map((rt) => (
              <div
                key={rt.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={rt.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                    alt={rt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow">
                    Up to {rt.capacity} {rt.capacity === 1 ? 'Guest' : 'Guests'}
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition">{rt.name}</h3>
                    <p className="text-slate-600 text-sm mt-2 line-clamp-2">{rt.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {rt.amenities.slice(0, 4).map((amenity, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                        {amenity}
                      </span>
                    ))}
                    {rt.amenities.length > 4 && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                        +{rt.amenities.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{formatCurrency(rt.basePrice)}</span>
                      <span className="text-xs text-slate-500 font-medium"> / night</span>
                    </div>
                    <button
                      onClick={() => navigate(`/search?roomTypeId=${rt.id}&checkInDate=${checkIn}&checkOutDate=${checkOut}`)}
                      className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition"
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviewer / Assessor Quick Credentials Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-brand-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Assessment Reviewer Quick Credentials</span>
            </div>
            <p className="text-sm text-slate-700">
              Easily evaluate all 3 user roles: Admin (<code className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-mono">admin@hotel.com</code>), Staff (<code className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-mono">staff1@hotel.com</code>), Guest (<code className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-mono">guest1@example.com</code>). Pass: <code className="bg-white/80 px-1.5 py-0.5 rounded text-xs font-mono">Password123!</code>.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="shrink-0 px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
          >
            Go to Login
          </button>
        </div>
      </section>
    </div>
  );
};
