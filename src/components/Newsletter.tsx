import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { saveNewsletterSubscription } from '../services/firestoreService';

const INTEREST_TRACKS = ['Embedded & IoT', 'FPGA & VLSI', 'Robotics & Tools'];

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(INTEREST_TRACKS[0]);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid engineering or personal email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await saveNewsletterSubscription(trimmed, selectedTrack);
      setSubscribed(true);
    } catch {
      setError('Could not save subscription right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-[#F5F7FA] border-t border-b border-slate-200/80">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-medium text-[#0066FF] mb-2">
              Engineering Dispatch
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Silicon restock alerts, application notes & lab pricing.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed max-w-lg">
              Receive one concise fortnightly bulletin when high-demand
              Raspberry Pi, Zynq FPGA, and precision instrumentation shipments
              clear Bengaluru customs.
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="bg-[#F5F7FA] border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#0B162C]">
                      Subscribed to ElectroMart Dispatch
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Saved{' '}
                      <span className="font-mono text-xs text-[#0B162C]">
                        {email}
                      </span>{' '}
                      for <span className="font-medium">{selectedTrack}</span>{' '}
                      updates. Use code{' '}
                      <span className="font-mono font-semibold text-[#0066FF]">
                        ELECTRO10
                      </span>{' '}
                      in your cart for 10% off your first order.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubscribed(false);
                        setEmail('');
                      }}
                      className="mt-3 text-xs font-medium text-[#0066FF] hover:underline cursor-pointer"
                    >
                      Register another email
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Primary hardware focus
                  </p>
                  <div className="inline-flex flex-wrap gap-1.5 p-1 bg-[#F5F7FA] border border-slate-200/80 rounded-lg">
                    {INTEREST_TRACKS.map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() => setSelectedTrack(track)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          selectedTrack === track
                            ? 'bg-[#0B162C] text-white'
                            : 'text-slate-600 hover:text-[#0B162C]'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="engineer@company.in"
                    className="flex-1 h-12 px-4 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] placeholder:text-slate-400 focus:bg-white focus:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/15"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-12 px-6 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {error ? (
                  <p className="text-xs text-red-600" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    No spam. Unsubscribe anytime. New subscribers unlock code{' '}
                    <span className="font-mono text-[#0B162C]">ELECTRO10</span>.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
