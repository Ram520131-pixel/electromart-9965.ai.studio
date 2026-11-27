import { useEffect } from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
  onInspect: (product: Product) => void;
}

export function WishlistDrawer({
  isOpen,
  onClose,
  items,
  onRemove,
  onMoveToCart,
  onInspect,
}: WishlistDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist"
    >
      <div
        className="fixed inset-0 bg-[#060D1C]/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B162C]">
              Saved Wishlist
            </h2>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {items.length} saved components
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F7FA] border border-slate-200 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#0B162C]">
                No saved items yet
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                Click the heart icon on any component card to bookmark parts for
                your next build.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-3.5 pb-4 border-b border-slate-100 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onInspect(product);
                    }}
                    className="shrink-0 cursor-pointer"
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.shortName}
                      containerClassName="w-20 h-16 rounded-lg border border-slate-200/80"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onInspect(product);
                        }}
                        className="text-left text-sm font-semibold text-[#0B162C] hover:text-[#0066FF] leading-snug line-clamp-2 cursor-pointer"
                      >
                        {product.shortName}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(product)}
                        aria-label={`Remove ${product.shortName} from wishlist`}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-mono text-sm font-semibold text-[#0B162C] tabular-nums mt-1">
                      {formatINR(product.priceInr)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onMoveToCart(product)}
                      className="mt-2.5 h-8 px-3 rounded-md bg-[#0B162C] hover:bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
