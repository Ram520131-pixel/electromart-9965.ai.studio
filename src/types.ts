export type CategoryId =
  | 'arduino'
  | 'esp32'
  | 'raspberry-pi'
  | 'fpga-vlsi'
  | 'sensors'
  | 'robotics'
  | 'components'
  | 'power-modules'
  | 'testing-tools'
  | 'lab-bundles';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  shortDesc: string;
  specHint: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  id: string;
  sku: string;
  name: string;
  shortName: string;
  brand: string;
  category: CategoryId;
  categoryLabel: string;
  priceInr: number;
  mrpInr?: number;
  rating: number;
  reviewCount: number;
  stockStatus: StockStatus;
  stockQty: number;
  image: string;
  gallery?: string[];
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  isTrending: boolean;
  isBestSeller: boolean;
  isBundle: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  organization: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type PaymentMethod = 'cod' | 'online_placeholder';
export type PaymentStatus = 'pending_cod' | 'awaiting_online_gateway' | 'paid';
export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  state: string;
  pinCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  promoCode: string;
  subtotalInr: number;
  discountInr: number;
  shippingInr: number;
  totalInr: number;
  itemCount: number;
  itemsSummary: string;
  createdAtMs?: number;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  sku: string;
  name: string;
  priceInr: number;
  quantity: number;
  image: string;
}

export type SortOption =
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc';

export type PriceRangeFilter =
  | 'all'
  | 'under-1000'
  | '1000-5000'
  | '5000-15000'
  | 'above-15000';

export type AvailabilityFilter = 'all' | 'in-stock' | 'low-stock';

export type AppView = 'store' | 'checkout' | 'profile' | 'admin';

export type InfoModalTopic =
  | 'about'
  | 'contact'
  | 'support'
  | 'shipping'
  | 'returns'
  | 'privacy'
  | 'terms'
  | 'gst'
  | 'datasheets'
  | null;
