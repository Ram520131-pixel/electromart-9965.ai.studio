import { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
}

export function AuthModal({
  isOpen,
  onClose,
  onGoogleSignIn,
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to sign in right now.';
      if (!msg.includes('popup-closed-by-user')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to ElectroMart"
    >
      <div
        className="fixed inset-0 bg-[#060D1C]/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 z-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B162C] hover:bg-[#F5F7FA] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-11 h-11 rounded-xl bg-[#0B162C] text-white flex items-center justify-center mb-5">
          <ShieldCheck className="w-5 h-5 text-[#3385FF]" />
        </div>

        <h2 className="font-display text-2xl font-bold text-[#0B162C]">
          Sign in or Register
        </h2>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Continue securely with Firebase Authentication to sync your cart,
          saved wishlist, shipping address, and order history across devices.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleSignIn}
            className="w-full h-12 px-4 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#FFFFFF"
                    d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.48-1.73 4.35-5.27 4.35-3.17 0-5.76-2.63-5.76-5.88s2.59-5.88 5.76-5.88c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 4.15 14.69 3.2 12.17 3.2 7.1 3.2 3 7.31 3 12.4s4.1 9.2 9.17 9.2c5.29 0 8.8-3.72 8.8-8.96 0-.6-.07-1.06-.16-1.54z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
          <p className="font-medium text-[#0B162C]">
            New to ElectroMart?
          </p>
          <p>
            First-time sign-in automatically creates your verified customer
            profile in Firestore. You can update your GST organization and
            delivery PIN code anytime in your Profile page.
          </p>
        </div>
      </div>
    </div>
  );
}
