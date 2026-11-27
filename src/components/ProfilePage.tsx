import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Package,
  User,
  Heart,
  LogOut,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { INDIAN_STATES } from '../data/catalog';
import {
  OrderItemRecord,
  OrderRecord,
  Product,
  UserProfile,
} from '../types';
import {
  cancelOrderCustomer,
  fetchOrderItems,
  subscribeUserOrders,
  updateUserProfile,
} from '../services/firestoreService';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface ProfilePageProps {
  user: UserProfile;
  isAdmin: boolean;
  wishlistProducts: Product[];
  onProfileUpdated: (updated: UserProfile) => void;
  onLogout: () => Promise<void>;
  onBackToStore: () => void;
  onOpenAdmin: () => void;
  onMoveWishlistToCart: (product: Product) => void;
  onRemoveWishlist: (product: Product) => void;
  onNotify: (msg: string) => void;
}

type ProfileTab = 'orders' | 'details' | 'wishlist';

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function ProfilePage({
  user,
  isAdmin,
  wishlistProducts,
  onProfileUpdated,
  onLogout,
  onBackToStore,
  onOpenAdmin,
  onMoveWishlistToCart,
  onRemoveWishlist,
  onNotify,
}: ProfilePageProps) {
  const [tab, setTab] = useState<ProfileTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<
    Record<string, OrderItemRecord[]>
  >({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Editable Profile State
  const [displayName, setDisplayName] = useState(user.displayName);
  const [phone, setPhone] = useState(user.phone);
  const [organization, setOrganization] = useState(user.organization);
  const [address, setAddress] = useState(user.address);
  const [city, setCity] = useState(user.city);
  const [stateName, setStateName] = useState(user.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(user.pinCode);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setOrdersLoading(true);
    const unsub = subscribeUserOrders(user.uid, (list) => {
      setOrders(list);
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [user.uid]);

  const handleToggleOrderDetails = async (order: OrderRecord) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(order.id);
    if (!orderItemsMap[order.id]) {
      try {
        const items = await fetchOrderItems(order.id, order.userId);
        setOrderItemsMap((prev) => ({ ...prev, [order.id]: items }));
      } catch {
        // Error handler logs details
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrderCustomer(orderId);
      onNotify('Order cancelled');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updates = {
        displayName: displayName.trim() || user.displayName,
        phone: phone.trim(),
        organization: organization.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName,
        pinCode: pinCode.trim(),
      };
      await updateUserProfile(user.uid, updates);
      onProfileUpdated({ ...user, ...updates });
      onNotify('Customer profile updated');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-[75vh] py-10 lg:py-14">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0066FF] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="h-9 px-3.5 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="h-9 px-3.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#0066FF] mb-1">
              Verified ElectroMart Account
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C]">
              {user.displayName}
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">
              {user.email}
            </p>
          </div>

          <div
            role="tablist"
            className="inline-flex p-1 bg-[#F5F7FA] border border-slate-200 rounded-lg self-start sm:self-auto"
          >
            {[
              { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
              { id: 'details', label: 'Profile & Address', icon: User },
              {
                id: 'wishlist',
                label: `Wishlist (${wishlistProducts.length})`,
                icon: Heart,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id as ProfileTab)}
                  className={`h-9 px-3.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    tab === item.id
                      ? 'bg-[#0B162C] text-white'
                      : 'text-slate-600 hover:text-[#0B162C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Orders */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                <span>Loading your order history...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <h2 className="font-display text-lg font-semibold text-[#0B162C]">
                  No orders placed yet
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Your confirmed Cash on Delivery and lab kit orders will appear
                  here with real-time status updates.
                </p>
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="mt-5 h-10 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const lineItems = orderItemsMap[order.id] || [];
                const dateStr = order.createdAtMs
                  ? new Date(order.createdAtMs).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-[#0B162C]">
                            {order.orderNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{dateStr}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-semibold ${
                              order.orderStatus === 'cancelled'
                                ? 'text-red-600'
                                : order.orderStatus === 'delivered'
                                  ? 'text-emerald-700'
                                  : 'text-[#0066FF]'
                            }`}
                          >
                            {STATUS_LABELS[order.orderStatus] ||
                              order.orderStatus}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#0B162C]">
                          {order.itemsSummary}
                        </p>
                        <p className="text-xs text-slate-500">
                          Deliver to: {order.address}, {order.state} —{' '}
                          {order.pinCode} ·{' '}
                          {order.paymentMethod === 'cod'
                            ? 'Cash on Delivery'
                            : 'Online Pending'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-mono text-base font-bold text-[#0B162C] tabular-nums">
                            {formatINR(order.totalInr)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {order.itemCount} items
                          </p>
                        </div>

                        {order.orderStatus === 'placed' && (
                          <button
                            type="button"
                            disabled={cancellingId === order.id}
                            onClick={() => handleCancelOrder(order.id)}
                            className="h-9 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold cursor-pointer"
                          >
                            {cancellingId === order.id
                              ? 'Cancelling...'
                              : 'Cancel'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleOrderDetails(order)}
                          className="h-9 px-3 rounded-lg bg-[#F5F7FA] hover:bg-slate-200/70 text-[#0B162C] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Items</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-[#F5F7FA]/70 px-5 sm:px-6 py-4">
                        {lineItems.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Loading itemized bill of materials...
                          </p>
                        ) : (
                          <ul className="divide-y divide-slate-200/70">
                            {lineItems.map((li) => (
                              <li
                                key={li.id}
                                className="py-2.5 flex items-center gap-3 text-xs"
                              >
                                <ProductImage
                                  src={li.image}
                                  alt={li.name}
                                  containerClassName="w-12 h-10 rounded-md border border-slate-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[#0B162C] truncate">
                                    {li.name}
                                  </p>
                                  <p className="font-mono text-slate-500">
                                    {li.sku} · Qty {li.quantity} ×{' '}
                                    {formatINR(li.priceInr)}
                                  </p>
                                </div>
                                <span className="font-mono font-semibold text-[#0B162C] tabular-nums">
                                  {formatINR(li.priceInr * li.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Profile Details */}
        {tab === 'details' && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-2xl space-y-5"
          >
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B162C]">
                Customer Profile & Default Delivery Address
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved directly to Firestore and pre-filled automatically at
                Checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Organization / University / Lab (Optional)
              </label>
              <input
                type="text"
                maxLength={120}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="IISc Bengaluru / Robotics Club"
                className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Street Address
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, apartment, department or landmark"
                className="w-full p-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  State
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="560038"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="h-11 px-6 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Profile Changes</span>
            </button>
          </form>
        )}

        {/* Tab 3: Saved Wishlist */}
        {tab === 'wishlist' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            {wishlistProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No components saved to your wishlist yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-xl p-4 flex gap-3.5 items-center"
                  >
                    <ProductImage
                      src={p.image}
                      alt={p.shortName}
                      containerClassName="w-16 h-14 rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B162C] truncate">
                        {p.shortName}
                      </p>
                      <p className="font-mono text-xs font-semibold text-[#0066FF] tabular-nums mt-0.5">
                        {formatINR(p.priceInr)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onMoveWishlistToCart(p)}
                          className="h-7 px-2.5 rounded-md bg-[#0B162C] hover:bg-[#0066FF] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Move to Cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveWishlist(p)}
                          className="text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
