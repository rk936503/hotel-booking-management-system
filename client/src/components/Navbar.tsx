import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, User as UserIcon, LogOut, Calendar, Shield, ClipboardList, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 text-slate-900 group">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:bg-brand-700 transition">
                <Hotel className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">Grand Horizon</span>
                <span className="block text-xs uppercase tracking-wider text-brand-600 font-semibold">Luxury Hotel & Suites</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/rooms"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/rooms')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Rooms & Suites
            </Link>

            <Link
              to="/search"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                isActive('/search')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>Book Now</span>
            </Link>

            {user && (
              <Link
                to="/guest/bookings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/guest/bookings')
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Bookings
              </Link>
            )}

            {hasRole('STAFF', 'ADMIN') && (
              <Link
                to="/staff/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                  isActive('/staff/dashboard')
                    ? 'text-blue-700 bg-blue-50 font-semibold'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50/50'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <span>Staff Desk</span>
              </Link>
            )}

            {hasRole('ADMIN') && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                  isActive('/admin/dashboard')
                    ? 'text-purple-700 bg-purple-50 font-semibold'
                    : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50/50'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-500" />
                <span>Admin Portal</span>
              </Link>
            )}
          </nav>

          {/* Desktop Right User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm text-slate-700 hover:text-slate-900 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-slate-900 leading-tight">{user.fullName}</div>
                    <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'STAFF' ? 'bg-blue-100 text-blue-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Rooms & Suites
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-brand-600 hover:bg-brand-50"
          >
            Check Availability
          </Link>

          {user && (
            <Link
              to="/guest/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              My Bookings
            </Link>
          )}

          {hasRole('STAFF', 'ADMIN') && (
            <Link
              to="/staff/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-blue-700 bg-blue-50"
            >
              Staff Desk
            </Link>
          )}

          {hasRole('ADMIN') && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 bg-purple-50"
            >
              Admin Portal
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 text-sm text-slate-600">
                  Signed in as <span className="font-semibold text-slate-900">{user.fullName}</span> ({user.role})
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
