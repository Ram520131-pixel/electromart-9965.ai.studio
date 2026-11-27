import { useState, useMemo, useRef, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  ArrowUpDown,
  RotateCcw,
  Check,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  googleProvider,
} from './firebase';
import { CATEGORIES, SEED_PRODUCTS } from './data/catalog';
import {
  AppView,
  AvailabilityFilter,
  CartItem,
  CategoryId,
  InfoModalTopic,
  OrderRecord,
  PriceRangeFilter,
  Product,
  SortOption,
  UserProfile,
} from './types';
import {
  checkIsAdminRecord,
  clearUserCartFirestore,
  ensureUserProfile,
  seedCatalogToFirestore,
  subscribeProducts,
  subscribeUserCart,
  subscribeUserWishlist,
  toggleUserWishlistFirestore,
  upsertUserCartItem,
} from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategorySection } from './components/CategorySection';
import { ProductCard } from './components/ProductCard';
import { SpecialOffers } from './components/SpecialOffers';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AuthModal } from './components/AuthModal';
import { InfoModal } from './components/InfoModal';
import { CheckoutPage } from './components/CheckoutPage';
import { ProfilePage } from './components/ProfilePage';
import { AdminDashboard } from './components/AdminDashboard';

type BestSellerFilter = 'all' | 'boards' | 'tools';

const LS_CART_KEY = 'electromart_cart_v2';
const LS_WISHLIST_KEY = 'electromart_wishlist_v2';
const LS_PROMO_KEY = 'electromart_promo_v2';

function loadLocalCart(): { productId: string; quantity: number }[] {
  try {
    const raw = localStorage.getItem(LS_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLocalWishlist(): string[] {
  try {
    const raw = localStorage.getItem(LS_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLocalPromo(): string {
  try {
    return localStorage.getItem(LS_PROMO_KEY) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('store');

  // Live Catalog from Firestore (falls back seamlessly to SEED_PRODUCTS until seeded)
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Auth & User Profile
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Persisted Cart & Wishlist (Entries mapped against live catalog)
  const [cartEntries, setCartEntries] = useState<
    { productId: string; quantity: number }[]
  >(loadLocalCart);
  const [wishlistIds, setWishlistIds] = useState<string[]>(loadLocalWishlist);
  const [promoCode, setPromoCode] = useState<string>(loadLocalPromo);

  // Search, Filters & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(
    'all'
  );
  const [priceFilter, setPriceFilter] = useState<PriceRangeFilter>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const [showAllCatalog, setShowAllCatalog] = useState(false);
  const [bestSellerFilter, setBestSellerFilter] =
    useState<BestSellerFilter>('all');

  // Modals & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [infoTopic, setInfoTopic] = useState<InfoModalTopic>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const hasAutoSeededRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 1. Subscribe to Firestore Products Catalog
  useEffect(() => {
    const unsub = subscribeProducts((items) => {
      setFirestoreProducts(items);
      setCatalogLoaded(true);
    });
    return () => unsub();
  }, []);

  const catalogFromFirestore = firestoreProducts.length > 0;
  const products = useMemo(
    () => (catalogFromFirestore ? firestoreProducts : SEED_PRODUCTS),
    [catalogFromFirestore, firestoreProducts]
  );

  // 2. Listen to Firebase Authentication State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email) {
        setUserProfile(null);
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserProfile(
          fbUser.uid,
          fbUser.email,
          fbUser.displayName || fbUser.email.split('@')[0]
        );
        setUserProfile(profile);

        const isBootstrapped =
          fbUser.emailVerified && fbUser.email === BOOTSTRAPPED_ADMIN_EMAIL;
        const hasAdminDoc = isBootstrapped
          ? true
          : await checkIsAdminRecord(fbUser.uid);
        setIsAdmin(isBootstrapped || hasAdminDoc);

        // Merge guest cart & wishlist into Firestore upon sign-in
        const guestCart = loadLocalCart();
        const guestWish = loadLocalWishlist();
        for (const entry of guestCart) {
          const prod = SEED_PRODUCTS.find((p) => p.id === entry.productId);
          if (prod) {
            await upsertUserCartItem(fbUser.uid, prod, entry.quantity).catch(
              () => {}
            );
          }
        }
        for (const pid of guestWish) {
          const prod = SEED_PRODUCTS.find((p) => p.id === pid);
          if (prod) {
            await toggleUserWishlistFirestore(fbUser.uid, prod, true).catch(
              () => {}
            );
          }
        }
      } catch (err) {
        console.error('Auth profile sync error:', err);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Auto-seed default catalog into Firestore the very first time an Admin signs in on an empty DB
  useEffect(() => {
    if (
      authReady &&
      catalogLoaded &&
      isAdmin &&
      !catalogFromFirestore &&
      !hasAutoSeededRef.current
    ) {
      hasAutoSeededRef.current = true;
      seedCatalogToFirestore()
        .then((count) => {
          showToast(`Initialized ${count} catalog items in Firestore`);
        })
        .catch(() => {});
    }
  }, [authReady, catalogLoaded, isAdmin, catalogFromFirestore]);

  // 3. Subscribe to Authenticated User's Firestore Cart & Wishlist
  useEffect(() => {
    if (!authReady || !userProfile) return;
    const unsubCart = subscribeUserCart(userProfile.uid, (entries) => {
      setCartEntries(entries);
    });
    const unsubWish = subscribeUserWishlist(userProfile.uid, (ids) => {
      setWishlistIds(ids);
    });
    return () => {
      unsubCart();
      unsubWish();
    };
  }, [authReady, userProfile]);

  // 4. Mirror Cart, Wishlist & Promo into localStorage for reload persistence
  useEffect(() => {
    try {
      localStorage.setItem(LS_CART_KEY, JSON.stringify(cartEntries));
    } catch {
      // ignore storage quota errors
    }
  }, [cartEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PROMO_KEY, promoCode);
    } catch {
      // ignore
    }
  }, [promoCode]);

  // Resolve CartItems against live catalog
  const cartItems = useMemo<CartItem[]>(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return cartEntries
      .map((entry) => {
        const product = map.get(entry.productId);
        return product ? { product, quantity: entry.quantity } : null;
      })
      .filter((x): x is CartItem => x !== null);
  }, [cartEntries, products]);

  const wishlistProducts = useMemo(() => {
    const set = new Set(wishlistIds);
    return products.filter((p) => set.has(p.id));
  }, [products, wishlistIds]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Derived Brands & Category Counts
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
    return brands;
  }, [products]);

  const productCounts = useMemo(() => {
    const counts = {} as Record<CategoryId, number>;
    for (const cat of CATEGORIES) {
      counts[cat.id] = products.filter((p) => p.category === cat.id).length;
    }
    return counts;
  }, [products]);

  const labBundles = useMemo(
    () => products.filter((p) => p.isBundle || p.category === 'lab-bundles'),
    [products]
  );

  // Active Filter State
  const isFiltering =
    selectedCategory !== 'all' ||
    searchQuery.trim().length > 0 ||
    priceFilter !== 'all' ||
    brandFilter !== 'all' ||
    availabilityFilter !== 'all';

  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (brandFilter !== 'all') {
      list = list.filter((p) => p.brand === brandFilter);
    }

    if (priceFilter === 'under-1000') {
      list = list.filter((p) => p.priceInr < 1000);
    } else if (priceFilter === '1000-5000') {
      list = list.filter((p) => p.priceInr >= 1000 && p.priceInr <= 5000);
    } else if (priceFilter === '5000-15000') {
      list = list.filter((p) => p.priceInr > 5000 && p.priceInr <= 15000);
    } else if (priceFilter === 'above-15000') {
      list = list.filter((p) => p.priceInr > 15000);
    }

    if (availabilityFilter === 'in-stock') {
      list = list.filter((p) => p.stockQty > 0);
    } else if (availabilityFilter === 'low-stock') {
      list = list.filter((p) => p.stockQty > 0 && p.stockQty <= 10);
    }

    if (!isFiltering && !showAllCatalog) {
      const trending = list.filter((p) => p.isTrending);
      if (trending.length > 0) {
        list = trending;
      }
    }

    switch (sortOption) {
      case 'price-asc':
        list.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case 'price-desc':
        list.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case 'rating-desc':
        list.sort(
          (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
        );
        break;
      case 'popularity':
      default:
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return list;
  }, [
    products,
    selectedCategory,
    searchQuery,
    brandFilter,
    priceFilter,
    availabilityFilter,
    sortOption,
    isFiltering,
    showAllCatalog,
  ]);

  const bestSellers = useMemo(() => {
    const base = products.filter((p) => p.isBestSeller && !p.isBundle);
    if (bestSellerFilter === 'boards') {
      return base.filter((p) =>
        ['arduino', 'esp32', 'raspberry-pi', 'fpga-vlsi', 'robotics'].includes(
          p.category
        )
      );
    }
    if (bestSellerFilter === 'tools') {
      return base.filter((p) =>
        ['testing-tools', 'power-modules', 'components', 'sensors'].includes(
          p.category
        )
      );
    }
    return base;
  }, [products, bestSellerFilter]);

  // Actions
  const scrollToSection = (sectionId: string) => {
    if (activeView !== 'store') {
      setActiveView('store');
      window.setTimeout(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGoogleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
    showToast('Signed in to ElectroMart');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdmin(false);
    setActiveView('store');
    showToast('Signed out of ElectroMart');
  };

  const handleAddToCart = async (product: Product, quantity = 1) => {
    if (product.stockQty <= 0) {
      showToast(`${product.shortName} is currently out of stock`);
      return;
    }
    const existing = cartEntries.find((e) => e.productId === product.id);
    const nextQty = Math.min(
      50,
      Math.min(product.stockQty, (existing?.quantity || 0) + quantity)
    );

    setCartEntries((prev) => {
      if (existing) {
        return prev.map((e) =>
          e.productId === product.id ? { ...e, quantity: nextQty } : e
        );
      }
      return [...prev, { productId: product.id, quantity: nextQty }];
    });
    showToast(`Added ${product.shortName} to cart`);

    if (userProfile) {
      await upsertUserCartItem(userProfile.uid, product, nextQty).catch(
        () => {}
      );
    }
  };

  const handleUpdateCartQty = async (productId: string, delta: number) => {
    const current = cartEntries.find((e) => e.productId === productId);
    const product = products.find((p) => p.id === productId);
    if (!current || !product) return;

    const nextQty = current.quantity + delta;
    if (nextQty <= 0) {
      setCartEntries((prev) => prev.filter((e) => e.productId !== productId));
      if (userProfile) {
        await upsertUserCartItem(userProfile.uid, product, 0).catch(() => {});
      }
      return;
    }

    const capped = Math.min(50, Math.min(product.stockQty, nextQty));
    setCartEntries((prev) =>
      prev.map((e) =>
        e.productId === productId ? { ...e, quantity: capped } : e
      )
    );
    if (userProfile) {
      await upsertUserCartItem(userProfile.uid, product, capped).catch(
        () => {}
      );
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setCartEntries((prev) => prev.filter((e) => e.productId !== productId));
    if (userProfile && product) {
      await upsertUserCartItem(userProfile.uid, product, 0).catch(() => {});
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    const exists = wishlistIds.includes(product.id);
    const nextSaved = !exists;

    setWishlistIds((prev) =>
      exists ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
    showToast(
      exists
        ? `Removed ${product.shortName} from wishlist`
        : `Saved ${product.shortName} to wishlist`
    );

    if (userProfile) {
      await toggleUserWishlistFirestore(
        userProfile.uid,
        product,
        nextSaved
      ).catch(() => {});
    }
  };

  const handleMoveWishlistToCart = async (product: Product) => {
    await handleAddToCart(product, 1);
    setWishlistIds((prev) => prev.filter((id) => id !== product.id));
    if (userProfile) {
      await toggleUserWishlistFirestore(userProfile.uid, product, false).catch(
        () => {}
      );
    }
  };

  const handleOrderSuccess = async (order: OrderRecord) => {
    setCartEntries([]);
    setPromoCode('');
    if (userProfile) {
      await clearUserCartFirestore(userProfile.uid).catch(() => {});
    }
    showToast(`Order ${order.orderNumber} confirmed`);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceFilter('all');
    setBrandFilter('all');
    setAvailabilityFilter('all');
    setSortOption('popularity');
  };

  const handleSelectCategory = (id: CategoryId | 'all') => {
    setSelectedCategory(id);
    if (id !== 'all') {
      scrollToSection('trending');
    }
  };

  const handleResetHome = () => {
    handleResetFilters();
    setActiveView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyPromoFromOffers = (code: string) => {
    setPromoCode(code);
    setCartOpen(true);
    showToast(`Promo code ${code} applied to cart`);
  };

  const activeCategoryName =
    selectedCategory === 'all'
      ? null
      : CATEGORIES.find((c) => c.id === selectedCategory)?.name || null;

  const featuredHeroProduct =
    products.find((p) => p.id === 'zynq-fpga-vlsi-board') || products[0];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0B162C]">
      <Navbar
        activeView={activeView}
        onChangeView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeView !== 'store' && q.trim()) {
            setActiveView('store');
          }
        }}
        allProducts={products}
        onSelectProduct={(p) => setActiveProduct(p)}
        onResetHome={handleResetHome}
        cartCount={totalCartItems}
        wishlistCount={wishlistIds.length}
        user={userProfile}
        isAdmin={isAdmin}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAccountOrAuth={() => {
          if (userProfile) {
            setActiveView('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setAuthOpen(true);
          }
        }}
        onNavigateSection={scrollToSection}
      />

      <main className="flex-1">
        {activeView === 'checkout' && (
          <CheckoutPage
            items={cartItems}
            promoCode={promoCode}
            user={userProfile}
            catalogFromFirestore={catalogFromFirestore}
            onGoogleSignIn={handleGoogleSignIn}
            onOrderSuccess={handleOrderSuccess}
            onBackToStore={() => {
              setActiveView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToProfile={() => {
              setActiveView('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'profile' && userProfile && (
          <ProfilePage
            user={userProfile}
            isAdmin={isAdmin}
            wishlistProducts={wishlistProducts}
            onProfileUpdated={(updated) => setUserProfile(updated)}
            onLogout={handleLogout}
            onBackToStore={() => {
              setActiveView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdmin={() => {
              setActiveView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onMoveWishlistToCart={handleMoveWishlistToCart}
            onRemoveWishlist={handleToggleWishlist}
            onNotify={showToast}
          />
        )}

        {activeView === 'admin' && isAdmin && (
          <AdminDashboard
            products={products}
            catalogFromFirestore={catalogFromFirestore}
            onBackToStore={() => {
              setActiveView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNotify={showToast}
          />
        )}

        {activeView === 'store' && (
          <>
            {/* Preserved Hero Banner */}
            <Hero
              featuredProduct={featuredHeroProduct}
              onExploreCatalog={() => scrollToSection('trending')}
              onViewOffers={() => scrollToSection('offers')}
              onInspectFeatured={(p) => setActiveProduct(p)}
            />

            {/* Categories Section */}
            <CategorySection
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              productCounts={productCounts}
              totalCount={products.length}
            />

            {/* Trending Products & Full Filterable Catalog */}
            <section
              id="trending"
              className="py-16 lg:py-20 bg-white border-b border-slate-200/80 scroll-mt-16"
            >
              <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-[#0066FF] mb-1.5">
                      {isFiltering
                        ? 'Filtered Hardware Catalog'
                        : 'Most Requested Components'}
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C] tracking-tight">
                      {activeCategoryName
                        ? activeCategoryName
                        : searchQuery.trim()
                          ? `Search Results for "${searchQuery.trim()}"`
                          : showAllCatalog
                            ? 'Complete Hardware Catalog'
                            : 'Trending Products'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 tabular-nums">
                      Showing {displayedProducts.length}{' '}
                      {displayedProducts.length === 1
                        ? 'component'
                        : 'components'}{' '}
                      · Prices in Indian Rupees (INR)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {!isFiltering && (
                      <button
                        type="button"
                        onClick={() => setShowAllCatalog((v) => !v)}
                        className="h-10 px-4 rounded-lg border border-slate-200 hover:border-[#0066FF] bg-[#F5F7FA] text-xs font-semibold text-[#0B162C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {showAllCatalog
                          ? 'Show Trending Only'
                          : `View All Hardware (${products.length})`}
                      </button>
                    )}

                    {/* Sort Select */}
                    <div className="relative flex items-center">
                      <ArrowUpDown
                        className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none"
                        aria-hidden="true"
                      />
                      <label htmlFor="catalog-sort" className="sr-only">
                        Sort products
                      </label>
                      <select
                        id="catalog-sort"
                        value={sortOption}
                        onChange={(e) =>
                          setSortOption(e.target.value as SortOption)
                        }
                        className="h-10 pl-8 pr-8 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                      >
                        <option value="popularity">Sort: Popularity</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Highest Rated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Multi-Facet Filter Bar (Category, Price, Brand, Availability) */}
                <div className="mb-8 p-3.5 bg-[#F5F7FA] border border-slate-200/80 rounded-xl flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B162C] mr-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Filter</span>
                  </span>

                  <select
                    aria-label="Filter by category"
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(
                        e.target.value as CategoryId | 'all'
                      )
                    }
                    className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Category: All</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by price range"
                    value={priceFilter}
                    onChange={(e) =>
                      setPriceFilter(e.target.value as PriceRangeFilter)
                    }
                    className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Price: Any (INR)</option>
                    <option value="under-1000">Under ₹1,000</option>
                    <option value="1000-5000">₹1,000 – ₹5,000</option>
                    <option value="5000-15000">₹5,000 – ₹15,000</option>
                    <option value="above-15000">Above ₹15,000</option>
                  </select>

                  <select
                    aria-label="Filter by brand"
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Brand: All</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by stock availability"
                    value={availabilityFilter}
                    onChange={(e) =>
                      setAvailabilityFilter(
                        e.target.value as AvailabilityFilter
                      )
                    }
                    className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Availability: All</option>
                    <option value="in-stock">In Stock Only</option>
                    <option value="low-stock">Low Stock</option>
                  </select>

                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="h-9 px-3 rounded-lg bg-white border border-slate-300 hover:border-[#0066FF] text-xs font-semibold text-[#0B162C] inline-flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {!catalogLoaded && products.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                    <span>Loading hardware catalog...</span>
                  </div>
                ) : displayedProducts.length === 0 ? (
                  <div className="py-16 px-6 text-center bg-[#F5F7FA] border border-slate-200 rounded-2xl">
                    <h3 className="font-display text-lg font-semibold text-[#0B162C]">
                      No matching components found
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      Try adjusting your brand, price range, or search keywords
                      (Arduino, ESP32, Zynq, Oscilloscope, Power Supply).
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-5 h-10 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        onQuickView={(p) => setActiveProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Best Sellers Section */}
            <section
              id="bestsellers"
              className="py-16 lg:py-20 bg-[#F5F7FA] scroll-mt-16"
            >
              <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
                  <div>
                    <p className="text-xs font-medium text-[#0066FF] mb-1.5">
                      Bench-Tested Staples
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C] tracking-tight">
                      Best Sellers
                    </h2>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Filter Best Sellers"
                    className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-lg self-start sm:self-auto"
                  >
                    {[
                      { id: 'all', label: 'All Top Rated' },
                      { id: 'boards', label: 'Boards & Silicon' },
                      { id: 'tools', label: 'Tools & Passives' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={bestSellerFilter === tab.id}
                        onClick={() =>
                          setBestSellerFilter(tab.id as BestSellerFilter)
                        }
                        className={`h-8 px-3.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          bestSellerFilter === tab.id
                            ? 'bg-[#0B162C] text-white'
                            : 'text-slate-600 hover:text-[#0B162C]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                  {bestSellers.map((product) => (
                    <ProductCard
                      key={`bestseller-${product.id}`}
                      product={product}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onQuickView={(p) => setActiveProduct(p)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 6 Engineering Lab Bundles & Special Offers */}
            <SpecialOffers
              bundles={labBundles}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onInspectProduct={(p) => setActiveProduct(p)}
              onApplyPromoInCart={handleApplyPromoFromOffers}
            />

            {/* Newsletter Subscription Section */}
            <Newsletter />
          </>
        )}
      </main>

      {/* Professional Footer */}
      <Footer
        onSelectCategory={(id) => handleSelectCategory(id)}
        onOpenInfo={(topic) => setInfoTopic(topic)}
        onNavigateSection={scrollToSection}
        isAdmin={isAdmin}
        onOpenAdmin={() => {
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Interactive Drawers & Modals */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        promoCode={promoCode}
        onPromoCodeChange={setPromoCode}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onContinueShopping={() => scrollToSection('trending')}
        onProceedToCheckout={() => {
          setActiveView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        items={wishlistProducts}
        onRemove={handleToggleWishlist}
        onMoveToCart={handleMoveWishlistToCart}
        onInspect={(p) => setActiveProduct(p)}
      />

      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        isWishlisted={
          activeProduct ? wishlistIds.includes(activeProduct.id) : false
        }
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <InfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />

      {/* Crisp Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#0B162C] text-white px-4 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-2.5 text-xs sm:text-sm font-medium max-w-sm"
        >
          <span className="w-5 h-5 rounded-full bg-[#0066FF] flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
