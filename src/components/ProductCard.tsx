import { useState } from 'react';
import { Heart, ShoppingCart, Check, Star, Eye } from 'lucide-react';
import { Product } from '../types';
import { formatINR, getDiscountPercent } from '../utils/format';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const discount = getDiscountPercent(product.priceInr, product.mrpInr);
  const isOutOfStock = product.stockQty <= 0 || product.stockStatus === 'Out of Stock';

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <article className="group bg-white border border-slate-200/90 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/[0.05] hover:border-slate-300">
      {/* Uniform 4:3 Studio Product Backdrop */}
      <div className="relative aspect-[4/3] bg-[#F5F7FA] overflow-hidden border-b border-slate-100">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Inspect ${product.name}`}
          className="block w-full h-full cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0066FF]"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            title={product.shortName}
            containerClassName="w-full h-full"
            className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${
              isOutOfStock ? 'opacity-65 grayscale-[25%]' : ''
            }`}
          />
        </button>

        {/* Top-Right Wishlist Toggle */}
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          aria-label={
            isWishlisted
              ? `Remove ${product.shortName} from wishlist`
              : `Add ${product.shortName} to wishlist`
          }
          aria-pressed={isWishlisted}
          className={`absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
            isWishlisted
              ? 'bg-[#0B162C] border-[#0B162C] text-white'
              : 'bg-white/90 hover:bg-white border-slate-200 text-slate-600 hover:text-[#0066FF]'
          }`}
        >
          <Heart
            className="w-4 h-4"
            fill={isWishlisted ? 'currentColor' : 'none'}
            strokeWidth={1.9}
          />
        </button>

        {/* Subtle Quick View Affordance on Hover */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute bottom-3 right-3 h-8 px-2.5 rounded-md bg-white/95 hover:bg-white text-[#0B162C] border border-slate-200 text-xs font-medium inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 cursor-pointer shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-[#0066FF]" />
          <span>Details</span>
        </button>
      </div>

      {/* Card Body with Uniform Vertical Rhythm */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Clean Unboxed Metadata Line */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-medium text-slate-700 truncate">
              {product.brand}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 truncate">
              {product.categoryLabel}
            </span>
          </div>
          <span
            className={`text-[11px] font-medium shrink-0 ${
              isOutOfStock
                ? 'text-red-600'
                : product.stockStatus === 'Low Stock'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}
          >
            {isOutOfStock
              ? 'Out of Stock'
              : product.stockStatus === 'Low Stock'
                ? `Low Stock (${product.stockQty})`
                : 'In Stock'}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="font-display text-[15px] sm:text-base font-semibold text-[#0B162C] leading-snug line-clamp-2 min-h-[2.75rem]">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-left hover:text-[#0066FF] transition-colors cursor-pointer"
          >
            {product.name}
          </button>
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mt-2.5 mb-4">
          <div
            className="flex items-center gap-0.5 text-[#0066FF]"
            aria-label={`Rated ${product.rating} out of 5`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                fill={
                  i < Math.round(product.rating) ? 'currentColor' : 'none'
                }
                strokeWidth={1.8}
              />
            ))}
          </div>
          <span className="font-mono text-xs font-medium text-[#0B162C] tabular-nums">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 tabular-nums">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price + Action Row (Aligned to Bottom) */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-base sm:text-[17px] font-semibold text-[#0B162C] tabular-nums">
                {formatINR(product.priceInr)}
              </span>
              {product.mrpInr && product.mrpInr > product.priceInr && (
                <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                  {formatINR(product.mrpInr)}
                </span>
              )}
            </div>
            {discount ? (
              <p className="text-[11px] font-medium text-[#0066FF] mt-0.5 tabular-nums">
                Save {discount}% · Incl. GST
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {product.sku}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`h-10 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                  ? 'bg-[#0066FF] text-white cursor-pointer'
                  : 'bg-[#0B162C] hover:bg-[#0066FF] text-white cursor-pointer'
            }`}
          >
            {isOutOfStock ? (
              <span>Sold Out</span>
            ) : justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
