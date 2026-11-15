import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Reservation } from '../types';
import { formatCurrency } from '../utils/currency';
import { CheckCircle2, Calendar, MapPin, Printer, ArrowRight, User as UserIcon, ShieldCheck } from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await api.get(`/reservations/${id}`);
        if (res.data?.data) {
          setReservation(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch reservation', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReservation();
  }, [id]);

  if (loading || !reservation) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500 mt-3 font-medium">Generating booking confirmation...</p>
      </div>
    );
  }

  const payment = reservation.payments?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Booking Confirmed
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thank You For Your Reservation!</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          A confirmation record has been stored in the database. Please present this reference code during check-in.
        </p>
      </div>

      {/* Confirmation Card / Printable Receipt */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Top Reference Bar */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-brand-400 font-bold uppercase tracking-wider block">Booking Reference</span>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider">{reservation.bookingReference}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Status</span>
            <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-3 py-0.5 rounded-full font-bold">
              {reservation.status}
            </span>
          </div>
        </div>

        {/* Stay & Room Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Room Assignment</span>
              <h3 className="text-lg font-bold text-slate-900">{reservation.room.roomType.name}</h3>
              <p className="text-sm text-brand-700 font-semibold mt-0.5">Room {reservation.room.roomNumber} (Floor {reservation.room.floor})</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Guest Details</span>
              <h3 className="text-base font-bold text-slate-900">{reservation.user?.fullName}</h3>
              <p className="text-xs text-slate-600">{reservation.user?.email} • {reservation.user?.phone}</p>
            </div>
          </div>

          {/* Dates & Schedule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Check-In</span>
              <span className="font-bold text-slate-900 text-sm block">
                {new Date(reservation.checkInDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[11px] text-slate-500">From 2:00 PM</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Check-Out</span>
              <span className="font-bold text-slate-900 text-sm block">
                {new Date(reservation.checkOutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[11px] text-slate-500">Until 11:00 AM</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Duration</span>
              <span className="font-bold text-slate-900 text-sm block">{reservation.numberOfNights} Nights</span>
              <span className="text-[11px] text-slate-500">{reservation.numberOfGuests} Guests</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Payment</span>
              <span className="font-bold text-emerald-700 text-sm block">{payment?.paymentStatus || 'PAID'}</span>
              <span className="text-[11px] text-slate-500">{payment?.paymentMethod || 'Card'}</span>
            </div>
          </div>

          {/* Itemized Financials */}
          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Room Subtotal ({formatCurrency(reservation.roomPrice)} × {reservation.numberOfNights} nights)</span>
              <span className="font-medium text-slate-900">{formatCurrency(reservation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Demo Hospitality Tax (12%)</span>
              <span className="font-medium text-slate-900">{formatCurrency(reservation.taxAmount)}</span>
            </div>
            {payment && (
              <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                <span>Transaction Reference</span>
                <span>{payment.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-brand-700 text-xl font-black">{formatCurrency(reservation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 py-2 px-3 rounded-lg hover:bg-slate-200 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <div className="flex items-center space-x-3">
            <Link
              to="/guest/bookings"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>View My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
