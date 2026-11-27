import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  X,
  Menu,
  ArrowUpRight,
  Shield,
} from 'lucide-react';
import { AppView, Product, UserProfile } from '../types';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface NavbarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onResetHome: () => void;
  cartCount: number;
  wishlistCount: number;
  user: UserProfile | null;
  isAdmin: boolean;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccountOrAuth: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export function Navbar({
  activeView,
  onChangeView,
  searchQuery,
  onSearchChange,
  allProducts,
  onSelectProduct,
  onResetHome,
  cartCount,
  wishlistCount,
  user,
  isAdmin,
  onOpenCart,
  onOpenWishlist,
  onOpenAccountOrAuth,
  onNavigateSection,
}: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const suggestions =
    searchQuery.trim().length > 0
      ? allProducts
          .filter((p) => {
            const q = searchQuery.toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q) ||
              p.categoryLabel.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
            );
          })
          .slice(0, 6)
      : [];

  const navLinks = [
    { id: 'categories', label: 'Categories' },
    { id: 'trending', label: 'Catalog' },
    { id: 'bestsellers', label: 'Best Sellers' },
    { id: 'offers', label: 'Lab Bundles' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    setMobileSearchOpen(false);
    if (searchQuery.trim()) {
      onNavigateSection('trending');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-7">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onResetHome}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066FF] rounded-md cursor-pointer"
          aria-label="ElectroMart Home"
        >
          <span className="w-8 h-8 rounded-lg bg-[#0B162C] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <rect
                x="6"
                y="6"
                width="12"
                height="12"
                rx="2"
                stroke="#FFFFFF"
                strokeWidth="1.75"
              />
              <path
                d="M9.5 12H14.5M12 9.5V14.5"
                stroke="#3385FF"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M9 3V6M15 3V6M9 18V21M15 18V21M3 9H6M3 15H6M18 9H21M18 15H21"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-[#0B162C]">
            Electro<span className="text-[#0066FF]">Mart</span>
          </span>
        </button>

        {/* Zone 2: Desktop Search + Concise Navigation */}
        <div className="hidden lg:flex items-center flex-1 max-w-2xl gap-6">
          <div ref={searchContainerRef} className="relative flex-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchFocused(false);
                }}
                placeholder="Search electronic components..."
                aria-label="Search electronic components"
                className="w-full h-10 pl-10 pr-9 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm text-[#0B162C] placeholder:text-slate-500 focus:bg-white focus:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/15 transition-all duration-150"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0B162C] rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {suggestions.length > 0 ? (
                  <div>
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Matching Components</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          onNavigateSection('trending');
                        }}
                        className="text-[#0066FF] hover:underline font-medium cursor-pointer"
                      >
                        View all results
                      </button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              onSelectProduct(product);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#F5F7FA] text-left transition-colors cursor-pointer"
                          >
                            <ProductImage
                              src={product.image}
                              alt={product.shortName}
                              containerClassName="w-11 h-9 rounded-md shrink-0 border border-slate-200/60"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#0B162C] truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {product.brand} · {product.sku} ·{' '}
                                {product.stockStatus}
                              </p>
                            </div>
                            <span className="text-sm font-mono font-medium text-[#0B162C] tabular-nums shrink-0">
                              {formatINR(product.priceInr)}
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-slate-600">
                      No components found for &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="mt-2 text-xs font-medium text-[#0066FF] hover:underline cursor-pointer"
                    >
                      Clear search query
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav
            aria-label="Primary Navigation"
            className="flex items-center gap-5 text-sm font-medium text-slate-600"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigateSection(link.id)}
                className="hover:text-[#0B162C] relative py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1.5px] after:bg-[#0066FF] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onChangeView('admin')}
                className={`inline-flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'admin'
                    ? 'text-[#0066FF] font-semibold'
                    : 'text-[#0B162C] hover:text-[#0066FF]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </div>

        {/* Zone 3: Interactive Account, Wishlist & Cart Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMobileMenuOpen(false);
            }}
            aria-label="Toggle search"
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Login / Profile Button */}
          <button
            type="button"
            onClick={onOpenAccountOrAuth}
            aria-label={user ? `Profile: ${user.displayName}` : 'Sign in'}
            className={`h-10 px-2.5 sm:px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] ${
              activeView === 'profile'
                ? 'bg-[#F5F7FA] text-[#0066FF]'
                : 'text-[#0B162C] hover:bg-[#F5F7FA]'
            }`}
          >
            <User className="w-[18px] h-[18px]" strokeWidth={1.8} />
            <span className="hidden sm:inline max-w-[96px] truncate">
              {user ? user.displayName.split(' ')[0] : 'Login'}
            </span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label={`Wishlist (${wishlistCount} items)`}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF]"
          >
            <Heart className="w-[18px] h-[18px]" strokeWidth={1.8} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0B162C] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping cart (${cartCount} items)`}
            className="h-10 px-3 sm:px-3.5 flex items-center gap-2 rounded-lg bg-[#0B162C] hover:bg-[#132347] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF]"
          >
            <ShoppingCart className="w-[17px] h-[17px]" strokeWidth={1.9} />
            <span className="hidden sm:inline">Cart</span>
            <span className="font-mono text-xs tabular-nums bg-[#0066FF] text-white min-w-[20px] h-5 px-1.5 rounded flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((v) => !v);
              setMobileSearchOpen(false);
            }}
            aria-label="Toggle navigation menu"
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search electronic components..."
              className="w-full h-11 pl-10 pr-10 bg-[#F5F7FA] border border-slate-200 rounded-lg text-sm text-[#0B162C] placeholder:text-slate-500 focus:bg-white focus:border-[#0066FF] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection(link.id);
              }}
              className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onChangeView('profile');
              }}
              className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#0B162C] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              My Profile & Orders
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onChangeView('admin');
              }}
              className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-[#0066FF] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
}
