import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { CartItem } from '../types';
import { formatINR, validatePromoCode } from '../utils/format';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export const FREE_SHIPPING_THRESHOLD = 2500;
export const FLAT_SHIPPING_FEE = 120;

export function CartDrawer({
  isOpen,
  onClose,
  items,
  promoCode,
  onPromoCodeChange,
  onUpdateQty,
  onRemoveItem,
  onContinueShopping,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [promoInput, setPromoInput] = useState(promoCode);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    setPromoInput(promoCode);
    setPromoError('');
  }, [promoCode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceInr * item.quantity,
    0
  );
  const promoResult = promoCode ? validatePromoCode(promoCode) : null;
  const discountAmount =
    promoResult && promoResult.valid
      ? Math.round(subtotal * promoResult.discountRate)
      : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const shippingFee =
    afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : FLAT_SHIPPING_FEE;
  const grandTotal = afterDiscount + shippingFee;
  const remainingForFreeShip = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - afterDiscount
  );

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validatePromoCode(promoInput);
    if (!res.valid) {
      setPromoError('Invalid code. Try LAB15 or ELECTRO10.');
      return;
    }
    setPromoError('');
    onPromoCodeChange(res.code);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="fixed inset-0 bg-[#060D1C]/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B162C]">
              Shopping Cart
            </h2>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {items.reduce((s, i) => s + i.quantity, 0)} items · Prices in INR
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping cart"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-[#F5F7FA] border-b border-slate-200/80 text-xs">
            {remainingForFreeShip > 0 ? (
              <p className="text-slate-600">
                Add{' '}
                <span className="font-mono font-semibold text-[#0B162C] tabular-nums">
                  {formatINR(remainingForFreeShip)}
                </span>{' '}
                more for complimentary ESD-safe express delivery.
              </p>
            ) : (
              <p className="text-[#0066FF] font-medium">
                Complimentary ESD-safe express delivery unlocked.
              </p>
            )}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F7FA] border border-slate-200 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#0B162C]">
                Your cart is empty
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                Add microcontrollers, sensors, FPGA boards, or testing tools to
                assemble your hardware kit.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
                className="mt-5 h-10 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3.5 pb-4 border-b border-slate-100 last:border-b-0"
                >
                  <ProductImage
                    src={product.image}
                    alt={product.shortName}
                    containerClassName="w-20 h-16 rounded-lg border border-slate-200/80 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#0B162C] leading-snug line-clamp-2">
                        {product.shortName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label={`Remove ${product.shortName}`}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {product.sku} · {formatINR(product.priceInr)} each
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, -1)}
                          aria-label={`Decrease quantity of ${product.shortName}`}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs font-semibold text-[#0B162C] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= Math.max(1, product.stockQty)}
                          onClick={() => onUpdateQty(product.id, 1)}
                          aria-label={`Increase quantity of ${product.shortName}`}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-[#F5F7FA] disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono text-sm font-semibold text-[#0B162C] tabular-nums">
                        {formatINR(product.priceInr * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-[#F5F7FA] px-6 py-5 space-y-4">
            {/* Promo Code Form */}
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      if (promoError) setPromoError('');
                    }}
                    placeholder="Promo code (LAB15 / ELECTRO10)"
                    className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase text-[#0B162C] placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:border-[#0066FF] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="text-[11px] text-red-600">{promoError}</p>
              )}
              {promoResult && promoResult.valid && (
                <div className="flex items-center justify-between text-[11px] text-[#0066FF] font-medium">
                  <span>
                    {promoResult.code} applied · {promoResult.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onPromoCodeChange('');
                      setPromoInput('');
                    }}
                    className="underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Totals */}
            <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (incl. 18% GST)</span>
                <span className="font-mono tabular-nums text-[#0B162C]">
                  {formatINR(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#0066FF]">
                  <span>Discount ({promoResult?.code})</span>
                  <span className="font-mono tabular-nums">
                    −{formatINR(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>ESD Express Shipping</span>
                <span className="font-mono tabular-nums text-[#0B162C]">
                  {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#0B162C] pt-2 border-t border-slate-200">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums text-base">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full h-12 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueShopping();
                }}
                className="w-full h-10 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#0B162C] text-xs font-semibold transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
