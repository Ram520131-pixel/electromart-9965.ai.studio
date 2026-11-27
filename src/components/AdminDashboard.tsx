import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Plus,
  Pencil,
  Trash2,
  Database,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { CATEGORIES, SEED_PRODUCTS, computeStockStatus } from '../data/catalog';
import {
  CategoryId,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  Product,
  UserProfile,
} from '../types';
import {
  deleteProductAdmin,
  saveProductAdmin,
  seedCatalogToFirestore,
  subscribeAllCustomersAdmin,
  subscribeAllOrdersAdmin,
  updateOrderStatusAdmin,
  updateProductInventoryAdmin,
} from '../services/firestoreService';
import { formatINR } from '../utils/format';
import { ProductImage } from './ProductImage';

interface AdminDashboardProps {
  products: Product[];
  catalogFromFirestore: boolean;
  onBackToStore: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab = 'sales' | 'products' | 'inventory' | 'orders' | 'customers';

const IMAGE_PRESETS = [
  { label: 'Arduino Uno R4', url: SEED_PRODUCTS[0].image },
  { label: 'Arduino Mega / Nano', url: SEED_PRODUCTS[1].image },
  { label: 'ESP32-S3 DevKit', url: SEED_PRODUCTS[3].image },
  { label: 'ESP8266 NodeMCU', url: SEED_PRODUCTS[4].image },
  { label: 'Raspberry Pi 5', url: SEED_PRODUCTS[5].image },
  { label: 'Zynq FPGA Board', url: SEED_PRODUCTS[7].image },
  { label: 'Ultrasonic Sensor', url: SEED_PRODUCTS[9].image },
  { label: 'Multi-Sensor Suite', url: SEED_PRODUCTS[10].image },
  { label: 'Mecanum LiDAR Rover', url: SEED_PRODUCTS[11].image },
  { label: 'Breadboard Kit', url: SEED_PRODUCTS[12].image },
  { label: 'Component Assortment', url: SEED_PRODUCTS[13].image },
  { label: 'DC Bench Power Supply', url: SEED_PRODUCTS[14].image },
  { label: '100MHz Oscilloscope', url: SEED_PRODUCTS[15].image },
  { label: 'Digital Multimeter', url: SEED_PRODUCTS[16].image },
  { label: 'PID Soldering Station', url: SEED_PRODUCTS[17].image },
  { label: 'Lab Workbench Bundle', url: SEED_PRODUCTS[23].image },
];

const EMPTY_PRODUCT_FORM: Product = {
  id: '',
  sku: 'EM-NEW-100',
  name: '',
  shortName: '',
  brand: 'ElectroMart',
  category: 'arduino',
  categoryLabel: 'Arduino',
  priceInr: 999,
  mrpInr: 1299,
  rating: 4.8,
  reviewCount: 1,
  stockStatus: 'In Stock',
  stockQty: 25,
  image: IMAGE_PRESETS[0].url,
  gallery: [IMAGE_PRESETS[0].url],
  description: '',
  highlights: ['Authentic hardware tested prior to dispatch'],
  specs: [{ label: 'Warranty', value: '1 Year ElectroMart Replacement' }],
  isTrending: false,
  isBestSeller: false,
  isBundle: false,
};

export function AdminDashboard({
  products,
  catalogFromFirestore,
  onBackToStore,
  onNotify,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('sales');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [seeding, setSeeding] = useState(false);

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Inventory inline edits
  const [inventoryDrafts, setInventoryDrafts] = useState<
    Record<string, { stockQty: number; priceInr: number }>
  >({});
  const [savingInvId, setSavingInvId] = useState<string | null>(null);

  useEffect(() => {
    const unsubOrders = subscribeAllOrdersAdmin(setOrders);
    const unsubUsers = subscribeAllCustomersAdmin(setCustomers);
    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const salesMetrics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
    const totalRevenue = activeOrders.reduce((s, o) => s + o.totalInr, 0);
    const avgOrder =
      activeOrders.length > 0
        ? Math.round(totalRevenue / activeOrders.length)
        : 0;
    const lowStockCount = products.filter(
      (p) => p.stockQty > 0 && p.stockQty <= 10
    ).length;
    const outOfStockCount = products.filter((p) => p.stockQty <= 0).length;
    const deliveredRevenue = orders
      .filter((o) => o.orderStatus === 'delivered' || o.paymentStatus === 'paid')
      .reduce((s, o) => s + o.totalInr, 0);
    return {
      totalRevenue,
      avgOrder,
      orderCount: orders.length,
      activeOrderCount: activeOrders.length,
      lowStockCount,
      outOfStockCount,
      deliveredRevenue,
    };
  }, [orders, products]);

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      const count = await seedCatalogToFirestore();
      onNotify(`Synced ${count} products & bundles into Firestore`);
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenNewProduct = () => {
    setIsNewProduct(true);
    setEditingProduct({
      ...EMPTY_PRODUCT_FORM,
      id: `item-${Date.now().toString().slice(-6)}`,
      sku: `EM-HW-${Math.floor(100 + Math.random() * 900)}`,
    });
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const catMeta = CATEGORIES.find((c) => c.id === editingProduct.category);
      await saveProductAdmin(
        {
          ...editingProduct,
          categoryLabel: catMeta?.name || editingProduct.categoryLabel,
          stockStatus: computeStockStatus(editingProduct.stockQty),
          gallery: [editingProduct.image],
        },
        isNewProduct
      );
      onNotify(
        isNewProduct
          ? `Added ${editingProduct.shortName} to catalog`
          : `Updated ${editingProduct.shortName}`
      );
      setEditingProduct(null);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!catalogFromFirestore) {
      onNotify('Sync catalog to Firestore first before deleting items.');
      return;
    }
    await deleteProductAdmin(product.id);
    onNotify(`Deleted ${product.shortName}`);
  };

  const handleSaveInventoryRow = async (product: Product) => {
    if (!catalogFromFirestore) {
      onNotify('Click "Sync Catalog to Firestore" first to enable live inventory edits.');
      return;
    }
    const draft = inventoryDrafts[product.id] || {
      stockQty: product.stockQty,
      priceInr: product.priceInr,
    };
    setSavingInvId(product.id);
    try {
      await updateProductInventoryAdmin(
        product.id,
        draft.stockQty,
        draft.priceInr
      );
      onNotify(`Updated stock & price for ${product.shortName}`);
    } finally {
      setSavingInvId(null);
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus
  ) => {
    await updateOrderStatusAdmin(orderId, orderStatus, paymentStatus);
    onNotify('Order status updated');
  };

  return (
    <div className="bg-[#F5F7FA] min-h-[80vh] py-8 lg:py-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0066FF] mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B162C]">
              ElectroMart Admin Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live Firestore control panel for catalog, pricing, inventory,
              orders, customers, and sales analytics.
            </p>
          </div>

          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedCatalog}
            className="h-10 px-4 rounded-lg bg-[#0B162C] hover:bg-[#0066FF] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4 text-[#3385FF]" />
            )}
            <span>
              {catalogFromFirestore
                ? 'Reset / Sync Default Catalog'
                : 'Seed 24 Products to Firestore'}
            </span>
          </button>
        </div>

        {/* Notice if Firestore catalog hasn't been seeded yet */}
        {!catalogFromFirestore && (
          <div className="mb-6 bg-white border border-[#0066FF]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <p className="text-[#0B162C]">
              Your Firestore <span className="font-mono">/products</span>{' '}
              collection is currently empty. Click{' '}
              <span className="font-semibold">
                Seed 24 Products to Firestore
              </span>{' '}
              to persist the full ElectroMart catalog so you can edit prices,
              stock, and products live.
            </p>
          </div>
        )}

        {/* Section Tabs */}
        <div
          role="tablist"
          className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-6"
        >
          {[
            { id: 'sales', label: 'Sales & Overview', icon: BarChart3 },
            {
              id: 'products',
              label: `Products (${products.length})`,
              icon: Package,
            },
            { id: 'inventory', label: 'Inventory & Prices', icon: Boxes },
            {
              id: 'orders',
              label: `Orders (${orders.length})`,
              icon: ShoppingBag,
            },
            {
              id: 'customers',
              label: `Customers (${customers.length})`,
              icon: Users,
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id as AdminTab)}
                className={`h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#0B162C] text-white'
                    : 'text-slate-600 hover:bg-[#F5F7FA] hover:text-[#0B162C]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================== TAB 1: SALES & OVERVIEW ======================== */}
        {tab === 'sales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-500">Gross Merchandise Sales</p>
                <p className="font-mono text-2xl font-bold text-[#0B162C] tabular-nums mt-1.5">
                  {formatINR(salesMetrics.totalRevenue)}
                </p>
                <p className="text-xs text-[#0066FF] mt-1 font-mono tabular-nums">
                  {salesMetrics.activeOrderCount} active orders
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-500">Average Order Value</p>
                <p className="font-mono text-2xl font-bold text-[#0B162C] tabular-nums mt-1.5">
                  {formatINR(salesMetrics.avgOrder)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Settled / Delivered: {formatINR(salesMetrics.deliveredRevenue)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-500">Catalog Health</p>
                <p className="font-mono text-2xl font-bold text-[#0B162C] tabular-nums mt-1.5">
                  {products.length} SKUs
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {salesMetrics.lowStockCount} low stock ·{' '}
                  {salesMetrics.outOfStockCount} out of stock
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-500">Registered Customers</p>
                <p className="font-mono text-2xl font-bold text-[#0B162C] tabular-nums mt-1.5">
                  {customers.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Verified Firebase profiles
                </p>
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-bold text-[#0B162C]">
                  Recent Customer Orders
                </h2>
                <button
                  type="button"
                  onClick={() => setTab('orders')}
                  className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Manage All Orders
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No orders have been placed yet. Complete a COD checkout to see
                  live sales populate here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 pr-4 font-medium">Order #</th>
                        <th className="py-2.5 pr-4 font-medium">Customer</th>
                        <th className="py-2.5 pr-4 font-medium">Items</th>
                        <th className="py-2.5 pr-4 font-medium">Status</th>
                        <th className="py-2.5 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 6).map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 pr-4 font-mono font-semibold text-[#0B162C]">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            {o.customerName}
                          </td>
                          <td className="py-3 pr-4 text-slate-500 max-w-xs truncate">
                            {o.itemsSummary}
                          </td>
                          <td className="py-3 pr-4 capitalize font-medium text-[#0066FF]">
                            {o.orderStatus}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-[#0B162C] tabular-nums">
                            {formatINR(o.totalInr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== TAB 2: PRODUCTS ======================== */}
        {tab === 'products' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#0B162C]">
                  Product Catalog Manager
                </h2>
                <p className="text-xs text-slate-500">
                  Add, edit, or delete electronics components & bundles in
                  Firestore.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewProduct}
                className="h-9 px-4 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F5F7FA] text-slate-500">
                    <th className="py-3 px-4 font-medium">Product</th>
                    <th className="py-3 px-4 font-medium">SKU / Brand</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium text-right">Price</th>
                    <th className="py-3 px-4 font-medium text-right">Stock</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F5F7FA]/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={p.image}
                            alt={p.shortName}
                            containerClassName="w-11 h-9 rounded-md border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0B162C] truncate max-w-[260px]">
                              {p.shortName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {[
                                p.isTrending && 'Trending',
                                p.isBestSeller && 'Best Seller',
                                p.isBundle && 'Bundle',
                              ]
                                .filter(Boolean)
                                .join(' · ') || 'Standard SKU'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-[#0B162C]">{p.sku}</p>
                        <p className="text-slate-500">{p.brand}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.categoryLabel}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B162C] tabular-nums">
                        {formatINR(p.priceInr)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            p.stockQty <= 0
                              ? 'text-red-600 font-semibold'
                              : p.stockQty <= 10
                                ? 'text-amber-700 font-semibold'
                                : 'text-emerald-700'
                          }
                        >
                          {p.stockQty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewProduct(!catalogFromFirestore);
                              setEditingProduct({ ...p });
                            }}
                            aria-label={`Edit ${p.shortName}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0066FF] hover:bg-blue-50 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            aria-label={`Delete ${p.shortName}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================== TAB 3: INVENTORY & PRICES ======================== */}
        {tab === 'inventory' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0B162C]">
                Live Inventory & Price Control
              </h2>
              <p className="text-xs text-slate-500">
                Adjust stock counts and INR pricing inline. Stock status updates
                automatically across the storefront.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F5F7FA] text-slate-500">
                    <th className="py-3 px-4 font-medium">SKU & Component</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Price (₹ INR)</th>
                    <th className="py-3 px-4 font-medium">Stock Qty</th>
                    <th className="py-3 px-4 font-medium text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const draft = inventoryDrafts[p.id] || {
                      stockQty: p.stockQty,
                      priceInr: p.priceInr,
                    };
                    const isDirty =
                      draft.stockQty !== p.stockQty ||
                      draft.priceInr !== p.priceInr;
                    const statusPreview = computeStockStatus(draft.stockQty);

                    return (
                      <tr key={p.id}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#0B162C]">
                            {p.shortName}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {p.sku}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              statusPreview === 'Out of Stock'
                                ? 'text-red-600'
                                : statusPreview === 'Low Stock'
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                            }`}
                          >
                            {statusPreview}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min={0}
                            max={5000000}
                            value={draft.priceInr}
                            onChange={(e) =>
                              setInventoryDrafts((prev) => ({
                                ...prev,
                                [p.id]: {
                                  ...draft,
                                  priceInr: Math.max(0, Number(e.target.value)),
                                },
                              }))
                            }
                            className="w-28 h-8 px-2.5 rounded-md border border-slate-200 font-mono text-xs text-[#0B162C] focus:border-[#0066FF] focus:outline-none tabular-nums"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100000}
                              value={draft.stockQty}
                              onChange={(e) =>
                                setInventoryDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    ...draft,
                                    stockQty: Math.max(
                                      0,
                                      Number(e.target.value)
                                    ),
                                  },
                                }))
                              }
                              className="w-20 h-8 px-2.5 rounded-md border border-slate-200 font-mono text-xs text-[#0B162C] focus:border-[#0066FF] focus:outline-none tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setInventoryDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    ...draft,
                                    stockQty: draft.stockQty + 10,
                                  },
                                }))
                              }
                              className="h-8 px-2 rounded-md bg-[#F5F7FA] hover:bg-slate-200 text-xs font-mono text-[#0B162C] cursor-pointer"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={!isDirty || savingInvId === p.id}
                            onClick={() => handleSaveInventoryRow(p)}
                            className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                              isDirty
                                ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {savingInvId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Save</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================== TAB 4: ORDERS ======================== */}
        {tab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0B162C]">
                Order Fulfillment Manager
              </h2>
              <p className="text-xs text-slate-500">
                Update live dispatch and payment status for customer orders.
              </p>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center">
                No customer orders found in Firestore yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#F5F7FA] text-slate-500">
                      <th className="py-3 px-4 font-medium">Order</th>
                      <th className="py-3 px-4 font-medium">Customer & Ship To</th>
                      <th className="py-3 px-4 font-medium">Items</th>
                      <th className="py-3 px-4 font-medium text-right">Total</th>
                      <th className="py-3 px-4 font-medium">Order Status</th>
                      <th className="py-3 px-4 font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-semibold text-[#0B162C]">
                            {o.orderNumber}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {o.createdAtMs
                              ? new Date(o.createdAtMs).toLocaleDateString(
                                  'en-IN'
                                )
                              : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#0B162C]">
                            {o.customerName}
                          </p>
                          <p className="text-slate-500 font-mono text-[11px]">
                            {o.customerPhone} · {o.state} {o.pinCode}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <p className="line-clamp-2">{o.itemsSummary}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0B162C] tabular-nums">
                          {formatINR(o.totalInr)}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={o.orderStatus}
                            onChange={(e) =>
                              handleUpdateOrder(
                                o.id,
                                e.target.value as OrderStatus,
                                o.paymentStatus
                              )
                            }
                            className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                          >
                            <option value="placed">Placed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={o.paymentStatus}
                            onChange={(e) =>
                              handleUpdateOrder(
                                o.id,
                                o.orderStatus,
                                e.target.value as PaymentStatus
                              )
                            }
                            className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B162C] focus:border-[#0066FF] focus:outline-none cursor-pointer"
                          >
                            <option value="pending_cod">COD Pending</option>
                            <option value="paid">Paid</option>
                            <option value="awaiting_online_gateway">
                              Awaiting Online
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================== TAB 5: CUSTOMERS ======================== */}
        {tab === 'customers' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-[#0B162C]">
                Registered Customers
              </h2>
              <p className="text-xs text-slate-500">
                Verified customer accounts synced from Firebase Authentication &
                Firestore.
              </p>
            </div>
            {customers.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center">
                No registered customers found yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#F5F7FA] text-slate-500">
                      <th className="py-3 px-4 font-medium">Customer</th>
                      <th className="py-3 px-4 font-medium">Email & Phone</th>
                      <th className="py-3 px-4 font-medium">Location / Lab</th>
                      <th className="py-3 px-4 font-medium text-right">Orders</th>
                      <th className="py-3 px-4 font-medium text-right">
                        Lifetime Spend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => {
                      const custOrders = orders.filter(
                        (o) =>
                          o.userId === c.uid && o.orderStatus !== 'cancelled'
                      );
                      const spend = custOrders.reduce(
                        (s, o) => s + o.totalInr,
                        0
                      );
                      return (
                        <tr key={c.uid}>
                          <td className="py-3.5 px-4 font-semibold text-[#0B162C]">
                            {c.displayName}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-mono text-[#0B162C]">
                              {c.email}
                            </p>
                            {c.phone && (
                              <p className="text-slate-500 font-mono text-[11px]">
                                {c.phone}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {c.organization ? `${c.organization} · ` : ''}
                            {c.state
                              ? `${c.city ? `${c.city}, ` : ''}${c.state}`
                              : 'Not provided yet'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#0B162C]">
                            {custOrders.length}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-[#0B162C]">
                            {formatINR(spend)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#060D1C]/60 backdrop-blur-[2px]"
            onClick={() => setEditingProduct(null)}
          />
          <form
            onSubmit={handleSaveProductForm}
            className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-display text-lg font-bold text-[#0B162C]">
                {isNewProduct ? 'Add New Product' : `Edit ${editingProduct.shortName}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B162C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editingProduct.shortName}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      shortName: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SKU (Uppercase, Hyphens)
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={editingProduct.sku}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sku: e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Product Title
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={editingProduct.name}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, name: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={editingProduct.brand}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      brand: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => {
                    const id = e.target.value as CategoryId;
                    const meta = CATEGORIES.find((c) => c.id === id);
                    setEditingProduct({
                      ...editingProduct,
                      category: id,
                      categoryLabel: meta?.name || id,
                    });
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Studio Image
                </label>
                <select
                  value={editingProduct.image}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      image: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                >
                  {IMAGE_PRESETS.map((img) => (
                    <option key={img.label} value={img.url}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={5000000}
                  value={editingProduct.priceInr}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      priceInr: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  MRP (₹ INR)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000000}
                  value={editingProduct.mrpInr || editingProduct.priceInr}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      mrpInr: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Stock Qty
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100000}
                  value={editingProduct.stockQty}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stockQty: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm font-mono text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Technical Description
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                maxLength={2000}
                value={editingProduct.description}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value,
                  })
                }
                className="w-full p-3 rounded-lg bg-[#F5F7FA] border border-slate-200 text-sm text-[#0B162C] focus:bg-white focus:border-[#0066FF] focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-5 pt-1 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.isTrending}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isTrending: e.target.checked,
                    })
                  }
                />
                <span>Show in Trending</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.isBestSeller}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isBestSeller: e.target.checked,
                    })
                  }
                />
                <span>Show in Best Sellers</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.isBundle}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isBundle: e.target.checked,
                    })
                  }
                />
                <span>Lab Bundle Kit</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="h-10 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="h-10 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                {savingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Product</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
