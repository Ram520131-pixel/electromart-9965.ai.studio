import { useState } from 'react';
import {
  ShoppingCart,
  Copy,
  Check,
  GraduationCap,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface SpecialOffersProps {
  bundles: Product[];
  onAddToCart: (product: Product) => void;
  onInspectProduct: (product: Product) => void;
  onApplyPromoInCart: (code: string) => void;
}

export function SpecialOffers({
  bundles,
  onAddToCart,
  onInspectProduct,
  onApplyPromoInCart,
}: SpecialOffersProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLabCode = () => {
    navigator.clipboard?.writeText('LAB15').catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const featuredLabKit =
    bundles.find((b) => b.id === 'bundle-electronics-lab-kit') || bundles[0];
  const otherBundles = bundles.filter((b) => b.id !== featuredLabKit?.id);

  return (
    <section
      id="offers"
      className="py-16 lg:py-24 bg-[#0B162C] text-white scroll-mt-16"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium text-[#3385FF] tracking-wide mb-2">
              Curated Engineering Lab Bundles & Institutional Offers
            </p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Engineering Lab Kits & Special Bundles
            </h2>
          </div>
          <p className="text-sm text-slate-300 max-w-md">
            Six turnkey hardware kits engineered for Arduino, IoT, VLSI, FPGA,
            Robotics, and full R&D electronics workbenches.
          </p>
        </div>

        {/* Flagship Lab Bundle + Academic Grant Row */}
        {featuredLabKit && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
            <div className="lg:col-span-8 bg-[#132347] border border-white/10 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-6 relative min-h-[240px] bg-[#060D1C]">
                <ProductImage
                  src={featuredLabKit.image}
                  alt={featuredLabKit.name}
                  title={featuredLabKit.shortName}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono text-blue-300 mb-2">
                    Flagship Workbench Kit · Save{' '}
                    {formatINR(
                      Math.max(
                        0,
                        (featuredLabKit.mrpInr || featuredLabKit.priceInr) -
                          featuredLabKit.priceInr
                      )
                    )}
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {featuredLabKit.shortName}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2.5 line-clamp-4">
                    {featuredLabKit.description}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-white tabular-nums">
                        {formatINR(featuredLabKit.priceInr)}
                      </span>
                      {featuredLabKit.mrpInr && (
                        <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                          {formatINR(featuredLabKit.mrpInr)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inclusive of 18% GST
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInspectProduct(featuredLabKit)}
                      className="h-10 px-3.5 rounded-lg border border-white/20 hover:border-white/40 text-white text-xs font-medium cursor-pointer"
                    >
                      Contents
                    </button>
                    <button
                      type="button"
                      disabled={featuredLabKit.stockQty <= 0}
                      onClick={() => onAddToCart(featuredLabKit)}
                      className="h-10 px-4 rounded-lg bg-[#0066FF] hover:bg-[#3385FF] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add Kit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & University Lab Discount Card */}
            <div className="lg:col-span-4 bg-white text-[#0B162C] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-slate-200 flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5 text-[#0066FF]" />
                </div>
                <p className="text-xs font-mono text-[#0066FF] mb-1">
                  Academic & R&D Grant · Code LAB15
                </p>
                <h3 className="font-display text-xl font-bold text-[#0B162C]">
                  Flat 15% Off University & Research Orders
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">
                  Applicable across Zynq FPGA boards, oscilloscopes, robotics
                  platforms, and lab bundles. Valid with GST tax invoices.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLabCode}
                  className="h-10 px-3.5 rounded-lg bg-[#F5F7FA] hover:bg-slate-200/70 border border-slate-200 text-[#0B162C] font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>LAB15</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onApplyPromoInCart('LAB15')}
                  className="h-10 px-4 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Apply to Cart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remaining 5 Curated Engineering Lab Kits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {otherBundles.map((bundle) => {
            const savings = Math.max(
              0,
              (bundle.mrpInr || bundle.priceInr) - bundle.priceInr
            );
            const soldOut = bundle.stockQty <= 0;

            return (
              <article
                key={bundle.id}
                className="bg-[#132347] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-[#3385FF]/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onInspectProduct(bundle)}
                  className="aspect-[4/3] bg-[#060D1C] overflow-hidden block w-full cursor-pointer"
                >
                  <ProductImage
                    src={bundle.image}
                    alt={bundle.name}
                    title={bundle.shortName}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-200"
                  />
                </button>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-[11px] font-mono text-blue-300 mb-1">
                    {savings > 0 ? `Save ${formatINR(savings)}` : bundle.sku}
                  </p>
                  <h3 className="font-display text-base font-semibold text-white leading-snug">
                    {bundle.shortName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {bundle.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      {formatINR(bundle.priceInr)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspectProduct(bundle)}
                        aria-label={`Inspect ${bundle.shortName}`}
                        className="w-8 h-8 rounded-md border border-white/15 hover:border-white/40 text-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => onAddToCart(bundle)}
                        className="h-8 px-2.5 rounded-md bg-[#0066FF] hover:bg-[#3385FF] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{soldOut ? 'Out' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
