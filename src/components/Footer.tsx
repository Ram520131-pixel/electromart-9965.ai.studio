import { Mail, MapPin, Phone } from 'lucide-react';
import { CATEGORIES } from '../data/catalog';
import { CategoryId, InfoModalTopic } from '../types';

interface FooterProps {
  onSelectCategory: (id: CategoryId) => void;
  onOpenInfo: (topic: InfoModalTopic) => void;
  onNavigateSection: (sectionId: string) => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export function Footer({
  onSelectCategory,
  onOpenInfo,
  onNavigateSection,
  isAdmin,
  onOpenAdmin,
}: FooterProps) {
  return (
    <footer className="bg-[#060D1C] text-slate-300">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#132347] border border-white/10 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <rect
                    x="6"
                    y="6"
                    width="12"
                    height="12"
                    rx="2"
                    stroke="#FFFFFF"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M9.5 12H14.5M12 9.5V14.5"
                    stroke="#3385FF"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 3V6M15 3V6M9 18V21M15 18V21M3 9H6M3 15H6M18 9H21M18 15H21"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Electro<span className="text-[#3385FF]">Mart</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              India&apos;s precision electronics storefront for authentic
              microcontrollers, FPGA/VLSI boards, sensors, power modules, and
              calibrated laboratory instrumentation.
            </p>

            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#3385FF] shrink-0" />
                <span>Indiranagar Hardware Hub, Bengaluru 560038, India</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#3385FF] shrink-0" />
                <span className="font-mono">+91 80 4128 9400</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#3385FF] shrink-0" />
                <span>engineering@electromart.in</span>
              </p>
            </div>
          </div>

          {/* Categories Column */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Hardware Categories
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              {CATEGORIES.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Storefront */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('about')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  About ElectroMart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('contact')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('offers')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Lab Bundles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('gst')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  GST & University POs
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-[#3385FF] hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Support & Policies */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Support & Policies
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('support')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('shipping')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Shipping
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('returns')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Returns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('privacy')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('terms')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Quiet Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} ElectroMart Components Pvt. Ltd.
            All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            All prices displayed in Indian Rupees (INR) · Inclusive of 18% GST
          </p>
        </div>
      </div>
    </footer>
  );
}
