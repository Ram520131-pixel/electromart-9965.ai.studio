import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Banknote,
  ShieldCheck,
  Truck,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { INDIAN_STATES } from '../data/catalog';
import {
  CartItem,
  OrderRecord,
  PaymentMethod,
  UserProfile,
} from '../types';
import { formatINR, validatePromoCode } from '../utils/format';
import {
  createOrderAtomic,
  updateUserProfile,
} from '../services/firestoreService';
import { ProductImage } from './ProductImage';
import { FLAT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from './CartDrawer';

interface CheckoutPageProps {
  items: CartItem[];
  promoCode: string;
  user: UserProfile | null;
  catalogFromFirestore: boolean;
  onGoogleSignIn: () => Promise<void>;
  onOrderSuccess: (order: OrderRecord) => Promise<void>;
  onBackToStore: () => void;
  onGoToProfile: () => void;
}

export function CheckoutPage({
  items,
  promoCode,
  user,
  catalogFromFirestore,
  onGoogleSignIn,
  onOrderSuccess,
  onBackToStore,
  onGoToProfile,
}: CheckoutPageProps) {
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [stateName, setStateName] = useState(user?.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(user?.pinCode || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [saveToProfile, setSaveToProfile] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(
    null
  );

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.displayName || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone((prev) => prev || user.phone || '');
      setAddress((prev) => prev || user.address || '');
      setStateName((prev) => (user.state ? user.state : prev));
      setPinCode((prev) => prev || user.pinCode || '');
    }
  }, [user]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceInr * item.quantity,
    0
  );
  const promoResult = promoCode ? validatePromoCode(promoCode) : null;
  const discountInr =
    promoResult && promoResult.valid
      ? Math.round(subtotal * promoResult.discountRate)
      : 0;
  const afterDiscount = Math.max(0, subtotal - discountInr);
  const shippingInr =
    afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : FLAT_SHIPPING_FEE;
  const totalInr = afterDiscount + shippingInr;

  const handleSignInInline = async () => {
    setFormError('');
    setSigningIn(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setFormError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('Please sign in with Google before placing your order.');
      return;
    }
    if (items.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }
    if (paymentMethod === 'online_placeholder') {
      setFormError(
        'Online payment gateway is not connected yet. Please select Cash on Delivery (COD) to complete your order.'
      );
      return;
    }
    if (customerName.trim().length < 2) {
      setFormError('Please enter the recipient full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setFormError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (address.trim().length < 5) {
      setFormError('Please enter your complete street delivery address.');
      return;
    }
    if (!/^[0-9]{6}$/.test(pinCode.trim())) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrderAtomic({
        userId: user.uid,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: cleanPhone,
        address: address.trim(),
        state: stateName,
        pinCode: pinCode.trim(),
        paymentMethod,
        promoCode: promoResult?.valid ? promoResult.code : '',
        subtotalInr: subtotal,
        discountInr,
        shippingInr,
        totalInr,
        items,
        catalogFromFirestore,
      });

      if (saveToProfile) {
        await updateUserProfile(user.uid, {
          displayName: customerName.trim(),
          phone: cleanPhone,
          address: address.trim(),
          state: stateName,
          pinCode: pinCode.trim(),
        }).catch(() => {});
      }

      setConfirmedOrder(order);
      await onOrderSuccess(order);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not place order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-[#F5F7FA] min-h-[75vh] py-12 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center mb-5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs font-mono font-semibold text-[#0066FF] mb-1">
              Order #{confirmedOrder.orderNumber} Confirmed — Preparing ESD Shipment
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C]">
              Thank you, {confirmedOrder.customerName}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your Cash on Delivery order has been saved to your ElectroMart
              account. Our Bengaluru fulfillment desk will dispatch your
              components within 24 hours.
            </p>

            <div className="mt-6 p-5 rounded-xl bg-[#F5F7FA] border border-slate-200 text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-semibold text-[#0B162C]">
                  {confirmedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium text-[#0B162C]">
                  Cash on Delivery (Pay on Delivery)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address</span>
                <span className="text-right text-[#0B162C] max-w-xs">
                  {confirmedOrder.address}, {confirmedOrder.state} —{' '}
                  {confirmedOrder.pinCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items</span>
                <span className="text-right text-[#0B162C] max-w-xs">
                  {confirmedOrder.itemsSummary}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-[#0B162C]">
                <span>Total Amount Payable on Delivery</span>
                <span className="font-mono text-base tabular-nums">
                  {formatINR(confirmedOrder.totalInr)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGoToProfile}
                className="h-11 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                View Order History
              </button>
              <button
                type="button"
                onClick={onBackToStore}
                className="h-11 px-5 rounded-lg bg-white hover:bg-[#F5F7FA] border border-slate-300 text-[#0B162C] text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] min-h-[75vh] py-10 lg:py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0066FF] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>

        <div className="mb-8">
          <p className="text-xs font-medium text-[#0066FF] mb-1">
            Secure Hardware Checkout
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C] tracking-tight">
            Shipping & Order Confirmation
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <h2 className="font-display text-lg font-semibold text-[#0B162C]">
              Your cart is currently empty
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Add electronic components or lab bundles before checking out.
            </p>
            <button
              type="button"
              onClick={onBackToStore}
              className="mt-5 h-11 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form Column */}
            <form
              onSubmit={handlePlaceOrder}
              noValidate
              className="lg:col-span-7 space-y-6"
            >
              {/* Sign-in Prompt if Guest */}
              {!user && (
                <div className="bg-[#0B162C] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-blue-300 mb-1">
                      Account Verification Required
                    </p>
                    <h2 className="font-display text-base font-semibold">
                      Sign in with Google to link your order & GST invoice
                    </h2>
                  </div>
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={handleSignInInline}
                    className="h-10 px-4 rounded-lg bg-[#0066FF] hover:bg-[#3385FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {signingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>Sign In with Google</span>
                  </button>
                </div>
              )}

              {/* Delivery Details Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
                <h2 className="font-display text-lg font-bold text-[#0B162C]">
                  1. Customer & Delivery Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="chk-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Customer Full Name
                    </label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      maxLength={100}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ramesh Kumar"
                      className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="chk-email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      required
                      maxLength={160}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="engineer@example.com"
                      className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="chk-phone"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Phone Number
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    required
                    maxLength={20}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="chk-address"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Delivery Address (Lab, Street, Landmark)
                  </label>
                  <textarea
                    id="chk-address"
                    rows={3}
                    required
                    maxLength={300}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Department of ECE, Block B, 100 Feet Road, Indiranagar, Bengaluru"
                    className="w-full p-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="chk-state"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      State / Union Territory
                    </label>
                    <select
                      id="chk-state"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="chk-pin"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      PIN Code (6 Digits)
                    </label>
                    <input
                      id="chk-pin"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={pinCode}
                      onChange={(e) =>
                        setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="560038"
                      className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                    />
                  </div>
                </div>

                {user && (
                  <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                    />
                    <span>
                      Save this phone number and delivery address to my profile
                    </span>
                  </label>
                )}
              </div>

              {/* Payment Method Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0B162C]">
                  2. Payment Method
                </h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === 'cod'
                        ? 'border-[#0066FF] bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => {
                        setPaymentMethod('cod');
                        setFormError('');
                      }}
                      className="mt-1 text-[#0066FF]"
                    />
                    <Banknote className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0B162C]">
                        Cash on Delivery (COD) · Available Now
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Pay{' '}
                        <span className="font-mono font-semibold text-[#0B162C]">
                          {formatINR(totalInr)}
                        </span>{' '}
                        in cash or UPI upon delivery of your ESD-sealed parcel.
                        No extra COD fee.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === 'online_placeholder'
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online_placeholder"
                      checked={paymentMethod === 'online_placeholder'}
                      onChange={() => setPaymentMethod('online_placeholder')}
                      className="mt-1 text-[#0066FF]"
                    />
                    <CreditCard className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0B162C]">
                        Online Payment (UPI / Cards / NetBanking) — Placeholder
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Payment gateway integration (Razorpay / Stripe) is not
                        enabled yet. No online card or UPI transaction is
                        processed here; select Cash on Delivery to place a real
                        order today.
                      </p>
                    </div>
                  </label>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !user ||
                    paymentMethod === 'online_placeholder'
                  }
                  className="w-full h-12 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-slate-300 disabled:text-slate-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Order in Database...</span>
                    </>
                  ) : paymentMethod === 'online_placeholder' ? (
                    <span>Online Gateway Not Connected — Choose COD</span>
                  ) : (
                    <span>
                      Place COD Order · {formatINR(totalInr)}
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Right Sticky Order Summary */}
            <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-[#0B162C] mb-4">
                Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
              </h2>

              <ul className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="py-3 flex items-center gap-3">
                    <ProductImage
                      src={product.image}
                      alt={product.shortName}
                      containerClassName="w-14 h-12 rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B162C] truncate">
                        {product.shortName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        Qty {quantity} × {formatINR(product.priceInr)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#0B162C] tabular-nums shrink-0">
                      {formatINR(product.priceInr * quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (incl. 18% GST)</span>
                  <span className="font-mono text-[#0B162C] tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>
                {discountInr > 0 && (
                  <div className="flex justify-between text-[#0066FF]">
                    <span>Promo Discount ({promoResult?.code})</span>
                    <span className="font-mono tabular-nums">
                      −{formatINR(discountInr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ESD Express Shipping</span>
                  <span className="font-mono text-[#0B162C] tabular-nums">
                    {shippingInr === 0 ? 'Free' : formatINR(shippingInr)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0B162C] pt-3 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="font-mono tabular-nums">
                    {formatINR(totalInr)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>18% GST tax invoice included inside parcel</span>
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>Free delivery over ₹2,500 across India</span>
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
