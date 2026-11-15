import React from 'react';
import { Hotel, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Hotel className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold">Grand Horizon</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience unparalleled luxury, modern comfort, and seamless hospitality. Book your perfect stay with our instant reservation system.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/rooms" className="hover:text-white transition">Rooms & Suites</a></li>
              <li><a href="/search" className="hover:text-white transition">Check Availability</a></li>
              <li><a href="/login" className="hover:text-white transition">Guest Portal</a></li>
              <li><a href="/staff/dashboard" className="hover:text-white transition">Staff Management</a></li>
            </ul>
          </div>

          {/* Demo Accounts Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Assessment Demo</span>
            </h4>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs space-y-1.5 font-mono">
              <div><span className="text-purple-400">Admin:</span> admin@hotel.com</div>
              <div><span className="text-blue-400">Staff:</span> staff1@hotel.com</div>
              <div><span className="text-brand-400">Guest:</span> guest1@example.com</div>
              <div className="text-slate-400 pt-1 border-t border-slate-700 text-[11px]">Pass: Password123!</div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact & Location</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>100 Oceanview Boulevard, Marina Bay</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+1 (800) 555-GRAND</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>concierge@grandhorizon.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Grand Horizon Hotel & Suites. Full-Stack Web Development Assessment.</p>
          <p className="mt-2 md:mt-0">ALGIONS AI LABS PRIVATE LIMITED Evaluation Project</p>
        </div>
      </div>
    </footer>
  );
};
