import { ArrowRight, Layers } from 'lucide-react';
import { HERO_IMAGE } from '../data/catalog';
import { Product } from '../types';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface HeroProps {
  featuredProduct: Product;
  onExploreCatalog: () => void;
  onViewOffers: () => void;
  onInspectFeatured: (product: Product) => void;
}

export function Hero({
  featuredProduct,
  onExploreCatalog,
  onViewOffers,
  onInspectFeatured,
}: HeroProps) {
  return (
    <section className="relative bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="bg-precision-grid">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs sm:text-sm font-medium text-[#0066FF] tracking-wide mb-4">
                Embedded Systems · FPGA Silicon · Lab Instrumentation
              </p>

              <h1
                className="font-display font-bold text-[#0B162C] tracking-[-0.025em] leading-[1.08] mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 4.1vw, 3.65rem)',
                  textWrap: 'balance',
                }}
              >
                Precision hardware for engineers who build the future.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                Verified microcontrollers, Zynq FPGA boards, industrial sensors,
                and ESD-safe testing instruments sourced directly for Indian R&D
                labs, universities, and hardware startups.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 mb-10">
                <button
                  type="button"
                  onClick={onExploreCatalog}
                  className="h-12 px-6 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF]"
                >
                  <span>Shop Components</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onViewOffers}
                  className="h-12 px-6 rounded-lg bg-white hover:bg-[#F5F7FA] text-[#0B162C] border border-slate-300 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B162C]"
                >
                  <Layers className="w-4 h-4 text-[#0066FF]" />
                  <span>Explore Lab Bundles</span>
                </button>
              </div>

              {/* Quiet Editorial Proof Strip */}
              <div className="pt-6 border-t border-slate-200/90 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg">
                <div>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-[#0B162C] tabular-nums">
                    100%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic Silicon
                  </p>
                </div>
                <div>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-[#0B162C] tabular-nums">
                    24 hr
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pan-India Dispatch
                  </p>
                </div>
                <div>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-[#0B162C] tabular-nums">
                    18% GST
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Input Tax Invoice
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Anchor Column */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#F5F7FA] flex-1 min-h-[280px] sm:min-h-[380px] lg:min-h-0">
                <ProductImage
                  src={HERO_IMAGE}
                  alt="ElectroMart precision embedded systems workbench featuring FPGA board, microcontroller module, digital calipers, and braided USB-C cable"
                  title="Embedded Systems Workbench"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />

                {/* Measured scrim bottom caption bar linking to featured hardware */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060D1C]/90 via-[#060D1C]/55 to-transparent pt-14 pb-5 px-5 sm:px-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-blue-200 tracking-wide">
                      Featured Lab Hardware · {featuredProduct.sku}
                    </p>
                    <p className="font-display text-base sm:text-lg font-semibold text-white truncate mt-0.5">
                      {featuredProduct.shortName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectFeatured(featuredProduct)}
                    className="h-9 px-3.5 rounded-lg bg-white/95 hover:bg-white text-[#0B162C] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span className="font-mono tabular-nums">
                      {formatINR(featuredProduct.priceInr)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0066FF]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
