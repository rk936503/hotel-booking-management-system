import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Reservation } from '../types';
import { formatCurrency } from '../utils/currency';
import { Calendar, Clock, AlertCircle, CheckCircle, Ban, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const GuestBookingsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      if (res.data?.data) {
        setReservations(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load your reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelReservation = async (reservation: Reservation) => {
    if (!confirm(`Are you sure you want to cancel booking ${reservation.bookingReference}? Any successful payments will be automatically refunded.`)) {
      return;
    }

    setCancellingId(reservation.id);
    try {
      const res = await api.patch(`/reservations/${reservation.id}/cancel`);
      if (res.data?.success) {
        toast.success(`Reservation ${reservation.bookingReference} cancelled. Refund issued.`);
        fetchBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">CONFIRMED</span>;
      case 'CHECKED_IN':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold">CHECKED IN</span>;
      case 'CHECKED_OUT':
        return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">CANCELLED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">PENDING</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Reservations</h1>
          <p className="text-slate-600 text-sm mt-1">Review your upcoming stays, view booking receipts, or cancel eligible reservations.</p>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Reservations Found</h3>
          <p className="text-sm text-slate-600">You haven't made any reservations yet. Search our availability to book your first stay!</p>
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition"
          >
            <span>Book A Room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-base text-slate-900">{res.bookingReference}</span>
                  {getStatusBadge(res.status)}
                </div>

                <div className="text-sm">
                  <span className="font-bold text-slate-800">{res.room.roomType.name}</span>
                  <span className="text-slate-500 text-xs ml-2">• Room {res.room.roomNumber} (Floor {res.room.floor})</span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>
                      {new Date(res.checkInDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' → '}
                      {new Date(res.checkOutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                  <span>{res.numberOfNights} Nights • {res.numberOfGuests} Guests</span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="w-full lg:w-auto flex flex-row lg:flex-col justify-between lg:items-end items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-left lg:text-right">
                  <span className="text-xs text-slate-500 block">Total Paid</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(res.totalAmount)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/confirmation/${res.id}`}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="View Receipt"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Receipt</span>
                  </Link>

                  {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                    <button
                      onClick={() => handleCancelReservation(res)}
                      disabled={cancellingId === res.id}
                      className="px-3 py-2 text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 disabled:opacity-50 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{cancellingId === res.id ? 'Cancelling...' : 'Cancel'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
