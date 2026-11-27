import { useEffect } from 'react';
import { X } from 'lucide-react';
import { InfoModalTopic } from '../types';

interface InfoModalProps {
  topic: InfoModalTopic;
  onClose: () => void;
}

const INFO_CONTENT: Record<
  Exclude<InfoModalTopic, null>,
  { kicker: string; title: string; points: string[] }
> = {
  about: {
    kicker: 'Company Profile',
    title: 'About ElectroMart Components',
    points: [
      'Founded in Bengaluru, ElectroMart supplies authentic microcontrollers, FPGA/VLSI boards, precision sensors, power supply modules, and laboratory test gear across India.',
      'Every component is sourced directly from authorized silicon partners and shipped in ESD-safe packaging for universities, R&D teams, hardware startups, and makers.',
    ],
  },
  contact: {
    kicker: 'Get in Touch',
    title: 'Contact ElectroMart Engineering Desk',
    points: [
      'Headquarters: Indiranagar Hardware Hub, 100 Feet Road, Bengaluru 560038, Karnataka, India.',
      'Technical Sales & Institutional Quotes: engineering@electromart.in · +91 80 4128 9400 (Mon–Sat, 9:30 AM – 6:30 PM IST).',
      'For university Purchase Orders or bulk BOM inquiries, include your institution name and GSTIN when emailing our team.',
    ],
  },
  support: {
    kicker: 'Technical Assistance',
    title: 'Hardware & Order Support',
    points: [
      'Our embedded systems engineers assist with pinout verification, Vivado/ESP-IDF setup questions, and component selection.',
      'Track active orders anytime from your Profile & Orders page, or cancel unshipped orders directly with one click.',
      'For hardware troubleshooting or DOA assistance, write to support@electromart.in with your Order Number (e.g., EM-2026-XXXX).',
    ],
  },
  shipping: {
    kicker: 'Pan-India Fulfillment',
    title: 'ESD-Safe Express Shipping',
    points: [
      'All MOSFETs, ICs, Raspberry Pi boards, and Zynq/Artix FPGA boards ship inside conductive anti-static bags with shock-absorbing packaging.',
      'Orders confirmed before 4:00 PM IST dispatch the same business day from Bengaluru via air express courier (2–4 business days across India).',
      'Complimentary express shipping applies automatically on orders of ₹2,500 or more; orders below ₹2,500 carry a flat ₹120 ESD handling fee.',
    ],
  },
  returns: {
    kicker: 'Replacement & Warranty',
    title: 'Returns & 1-Year Lab Guarantee',
    points: [
      'Eligible unopened components and Dead-On-Arrival (DOA) boards can be returned or replaced within 10 calendar days of delivery.',
      'Oscilloscopes, True-RMS multimeters, programmable DC power supplies, and PID soldering stations carry 1-to-3-year manufacturer warranty coverage.',
      'Note: Bare semiconductor ICs and boards showing physical burn marks or reverse-polarity soldering damage are ineligible for return.',
    ],
  },
  privacy: {
    kicker: 'Data Protection',
    title: 'Privacy Policy',
    points: [
      'ElectroMart collects only the customer name, verified email, phone number, and Indian delivery address needed to fulfill hardware orders and issue GST invoices.',
      'User profiles, cart contents, wishlists, and order histories are stored in Google Cloud Firestore protected by owner-isolated security rules.',
      'We never sell customer contact details or BOM histories to third-party brokers.',
    ],
  },
  terms: {
    kicker: 'Storefront Terms',
    title: 'Terms of Sale & Use',
    points: [
      'All listed prices are in Indian Rupees (INR) and inclusive of 18% GST unless explicitly noted otherwise.',
      'Cash on Delivery (COD) orders are confirmed immediately upon checkout; online payment gateway options remain clearly marked as pending until integrated.',
      'ElectroMart reserves the right to verify high-value institutional or multi-unit FPGA orders prior to dispatch.',
    ],
  },
  gst: {
    kicker: 'Institutional & B2B Billing',
    title: 'GST Tax Invoicing & University POs',
    points: [
      'Every ElectroMart order includes an 18% GST compliant tax invoice with HSN codes for Input Tax Credit.',
      'Universities, IITs, NITs, and research labs can apply promo code LAB15 at checkout for 15% institutional pricing.',
    ],
  },
  datasheets: {
    kicker: 'Technical Documentation',
    title: 'Datasheets & Electrical Specs',
    points: [
      'Click any product card to view verified technical parameters including logic voltage, memory, bus interfaces, and toolchain compatibility.',
    ],
  },
};

export function InfoModal({ topic, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!topic) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [topic, onClose]);

  if (!topic) return null;

  const content = INFO_CONTENT[topic];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
    >
      <div
        className="fixed inset-0 bg-[#060D1C]/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 z-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B162C] hover:bg-[#F5F7FA] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-xs font-medium text-[#0066FF] mb-1.5">
          {content.kicker}
        </p>
        <h2 className="font-display text-xl font-bold text-[#0B162C] pr-8">
          {content.title}
        </h2>
        <ul className="mt-5 space-y-3 text-sm text-slate-600 leading-relaxed">
          {content.points.map((point) => (
            <li
              key={point}
              className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
            >
              {point}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-10 px-5 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
