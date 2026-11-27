import {
  Cpu,
  Wifi,
  Server,
  Radar,
  Bot,
  CircuitBoard,
  SlidersHorizontal,
  Zap,
  Gauge,
  Package,
  LayoutGrid,
} from 'lucide-react';
import { CategoryId, CategoryMeta } from '../types';

interface CategorySectionProps {
  categories: CategoryMeta[];
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (id: CategoryId | 'all') => void;
  productCounts: Record<CategoryId, number>;
  totalCount: number;
}

const CATEGORY_ICONS: Record<CategoryId, typeof Cpu> = {
  arduino: Cpu,
  esp32: Wifi,
  'raspberry-pi': Server,
  'fpga-vlsi': CircuitBoard,
  sensors: Radar,
  robotics: Bot,
  components: SlidersHorizontal,
  'power-modules': Zap,
  'testing-tools': Gauge,
  'lab-bundles': Package,
};

export function CategorySection({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts,
  totalCount,
}: CategorySectionProps) {
  return (
    <section
      id="categories"
      className="py-16 lg:py-20 bg-[#F5F7FA] border-b border-slate-200/80 scroll-mt-16"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-medium text-[#0066FF] mb-1.5">
              Hardware Taxonomy
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C] tracking-tight">
              Browse by Category
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0B162C] text-white'
                : 'bg-white text-[#0B162C] border border-slate-200 hover:border-[#0066FF]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Hardware ({totalCount})</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const isSelected = selectedCategory === cat.id;
            const count = productCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onSelectCategory(isSelected ? 'all' : cat.id)
                }
                aria-pressed={isSelected}
                className={`group text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between min-h-[144px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] ${
                  isSelected
                    ? 'bg-[#0B162C] border-[#0B162C] text-white shadow-md'
                    : 'bg-white border-slate-200/90 text-[#0B162C] hover:border-[#0066FF] hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <span
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[#F5F7FA] text-[#0B162C] group-hover:bg-[#0066FF]/10 group-hover:text-[#0066FF]'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isSelected ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>

                <div className="mt-3.5">
                  <h3
                    className={`font-display text-sm font-semibold leading-snug ${
                      isSelected ? 'text-white' : 'text-[#0B162C]'
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p
                    className={`text-xs mt-1 leading-snug line-clamp-2 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {cat.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
