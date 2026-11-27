import { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Product } from '../types';
import { formatINR, getDiscountPercent } from '../utils/format';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    setQuantity(1);
    setAddedFeedback(false);
    setSelectedImageIdx(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const images =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];
  const currentImage = images[selectedImageIdx] || product.image;
  const discount = getDiscountPercent(product.priceInr, product.mrpInr);
  const isOutOfStock = product.stockQty <= 0 || product.stockStatus === 'Out of Stock';
  const maxSelectable = Math.max(1, Math.min(20, product.stockQty));

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="fixed inset-0 bg-[#060D1C]/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close specifications modal"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-lg bg-white/95 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0B162C] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Studio Gallery */}
          <div className="lg:col-span-5 bg-[#F5F7FA] p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/80 bg-white">
                <ProductImage
                  src={currentImage}
                  alt={product.name}
                  title={product.shortName}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={`${product.id}-thumb-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      aria-label={`View image ${idx + 1} of ${product.shortName}`}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                        idx === selectedImageIdx
                          ? 'border-[#0066FF]'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${product.shortName} view ${idx + 1}`}
                        containerClassName="w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Genuine manufacturer silicon with ESD-safe packaging</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Dispatches within 24 hours from Bengaluru hub</span>
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase & Datasheet Module */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-[#0066FF]">
                {product.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.sku}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-medium ${
                  isOutOfStock
                    ? 'text-red-600'
                    : product.stockStatus === 'Low Stock'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : `${product.stockStatus} (${product.stockQty} units)`}
              </span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B162C] leading-snug pr-8">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-0.5 text-[#0066FF]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={
                      i < Math.round(product.rating) ? 'currentColor' : 'none'
                    }
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-semibold text-[#0B162C] tabular-nums">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">
                ({product.reviewCount} verified engineering reviews)
              </span>
            </div>

            {/* Pricing */}
            <div className="mt-5 pb-5 border-b border-slate-200 flex items-baseline gap-3 flex-wrap">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#0B162C] tabular-nums">
                {formatINR(product.priceInr)}
              </span>
              {product.mrpInr && product.mrpInr > product.priceInr && (
                <span className="font-mono text-sm text-slate-400 line-through tabular-nums">
                  {formatINR(product.mrpInr)}
                </span>
              )}
              {discount && (
                <span className="text-xs font-semibold text-[#0066FF]">
                  Save {discount}%
                </span>
              )}
              <span className="text-xs text-slate-500 ml-auto">
                Inclusive of 18% GST
              </span>
            </div>

            {/* Description & Highlights */}
            <p className="text-sm text-slate-600 leading-relaxed mt-5">
              {product.description}
            </p>

            {product.highlights.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-700">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Purchase Controls */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border border-slate-300 rounded-lg h-11 bg-white">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-[#F5F7FA] disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-semibold text-[#0B162C] tabular-nums">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= maxSelectable}
                  onClick={() =>
                    setQuantity((q) => Math.min(maxSelectable, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-[#F5F7FA] disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAdd}
                className={`flex-1 min-w-[180px] h-11 px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-[#0066FF] hover:bg-[#0052CC] text-white cursor-pointer'
                }`}
              >
                {isOutOfStock ? (
                  <span>Currently Out of Stock</span>
                ) : addedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      Add to Cart · {formatINR(product.priceInr * quantity)}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product)}
                aria-label="Toggle wishlist"
                className={`h-11 w-11 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#0B162C] border-[#0B162C] text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
              >
                <Heart
                  className="w-4 h-4"
                  fill={isWishlisted ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {/* Technical Specifications Table */}
            {product.specs.length > 0 && (
              <div className="mt-7 pt-6 border-t border-slate-200">
                <h3 className="font-display text-sm font-semibold text-[#0B162C] mb-3">
                  Technical Specifications
                </h3>
                <dl className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {product.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-12 px-4 py-2.5 bg-white even:bg-[#F5F7FA]/60"
                    >
                      <dt className="col-span-5 text-slate-500 font-medium">
                        {spec.label}
                      </dt>
                      <dd className="col-span-7 font-mono text-[#0B162C] tabular-nums">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
