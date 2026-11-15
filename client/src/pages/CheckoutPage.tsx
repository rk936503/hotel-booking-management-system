import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { Clock, ShieldCheck, CreditCard, CheckCircle2, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomId = searchParams.get('roomId');
  const holdId = searchParams.get('holdId');
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const guests = parseInt(searchParams.get('guests') || '1', 10);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 15-minute countdown timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+1-555-0199');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'UPI'>('CREDIT_CARD');

  // Load room details
  useEffect(() => {
    if (!roomId) {
      navigate('/search');
      return;
    }

    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        if (res.data?.data) {
          setRoom(res.data.data);
        }
      } catch (err: any) {
        toast.error('Failed to load room details');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId, navigate]);

  // Hold timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Your 15-minute booking hold has expired. Please select the room again.');
          navigate('/search');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculations
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  const nightlyRate = room?.roomType.basePrice || 0;
  const subtotal = nightlyRate * nights;
  const taxRate = 12; // 12%
  const taxAmount = Math.round(subtotal * 0.12 * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    setSubmitting(true);
    try {
      // 1. Create reservation
      const resPayload: any = {
        roomId: room.id,
        checkInDate,
        checkOutDate,
        numberOfGuests: guests,
        specialRequests: specialRequests || undefined,
      };
      if (holdId) {
        resPayload.holdId = holdId;
      }

      const resResponse = await api.post('/reservations', resPayload);
      if (!resResponse.data?.success) {
        throw new Error(resResponse.data?.error || 'Failed to create reservation');
      }
      const reservation = resResponse.data.data;

      // 2. Simulate Payment
      const payResponse = await api.post('/payments/simulate', {
        reservationId: reservation.id,
        paymentMethod,
      });

      if (payResponse.data?.success) {
        toast.success('Payment confirmed! Your reservation is secured.');
        navigate(`/confirmation/${reservation.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !room) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 mt-3 font-medium">Preparing booking checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hold Timer Alert Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <Clock className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
          <span className="text-sm font-semibold">
            Room is temporarily locked for your reservation. Hold expires in:
          </span>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-inner">
          <span className="text-lg font-black font-mono text-amber-700">{formatTimer(timeLeft)}</span>
          <span className="text-xs text-amber-600 uppercase font-bold tracking-wider">min:sec</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Guest Details & Payment */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            {/* Guest Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Guest Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Special Requests (Optional)</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="High floor, quiet corner, early arrival notice, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                ></textarea>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Simulated Payment Gateway</h2>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Sandbox Mode</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
                  { id: 'DEBIT_CARD', label: 'Debit Card', icon: '🏦' },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: '🌐' },
                  { id: 'UPI', label: 'UPI Instant', icon: '⚡' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentMethod === m.id
                        ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 text-brand-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-xs">{m.label}</div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  <span>Sandbox Environment (No Real Card Charged)</span>
                </p>
                <p>Clicking "Confirm & Complete Booking" will record a simulated successful transaction and transition the reservation from PENDING to CONFIRMED.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{submitting ? 'Processing Payment...' : `Confirm & Pay ${formatCurrency(totalAmount)}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Summary: Room & Price Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm sticky top-24">
            <div className="h-44 bg-slate-100 relative">
              <img
                src={room.roomType.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                alt={room.roomType.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold">
                Room {room.roomNumber} (Floor {room.floor})
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{room.roomType.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{room.roomType.description}</p>
              </div>

              {/* Booking Stay Summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Check-In</span>
                  <span className="font-bold text-slate-900">{checkInDate}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Check-Out</span>
                  <span className="font-bold text-slate-900">{checkOutDate}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Duration</span>
                  <span className="font-bold text-slate-900">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Occupancy</span>
                  <span className="font-bold text-slate-900">{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                </div>
              </div>

              {/* Itemized Price Breakdown */}
              <div className="space-y-2.5 text-sm border-t border-slate-200 pt-4">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Nightly Rate ({formatCurrency(nightlyRate)} × {nights} nights)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Mandatory Demo Hospitality Tax ({taxRate}%)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Resort & Service Fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Amount Due</span>
                  <span className="text-xl font-black text-brand-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Prices calculated strictly on server using configured demo tax rate of 12%.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
