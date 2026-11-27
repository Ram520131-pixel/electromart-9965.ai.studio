import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { computeStockStatus, SEED_PRODUCTS } from '../data/catalog';
import {
  CartItem,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  UserProfile,
} from '../types';

function clampString(val: string | undefined, max: number): string {
  return (val ?? '').trim().slice(0, max);
}

function sanitizeId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function toMillis(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts && typeof ts === 'object' && 'seconds' in ts) {
    return Number((ts as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

// ============================================================================
// PRODUCTS CATALOG
// ============================================================================

export function subscribeProducts(
  onData: (products: Product[]) => void
): () => void {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Product[] = snapshot.docs.map((d) => {
        const data = d.data();
        const stockQty = Number(data.stockQty ?? 0);
        return {
          id: d.id,
          sku: String(data.sku ?? ''),
          name: String(data.name ?? ''),
          shortName: String(data.shortName ?? ''),
          brand: String(data.brand ?? 'ElectroMart'),
          category: data.category,
          categoryLabel: String(data.categoryLabel ?? ''),
          priceInr: Number(data.priceInr ?? 0),
          mrpInr: data.mrpInr !== undefined ? Number(data.mrpInr) : undefined,
          rating: Number(data.rating ?? 4.8),
          reviewCount: Number(data.reviewCount ?? 0),
          stockStatus: computeStockStatus(stockQty),
          stockQty,
          image: String(data.image ?? ''),
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          description: String(data.description ?? ''),
          highlights: Array.isArray(data.highlights) ? data.highlights : [],
          specs: Array.isArray(data.specs) ? data.specs : [],
          isTrending: Boolean(data.isTrending),
          isBestSeller: Boolean(data.isBestSeller),
          isBundle: Boolean(data.isBundle),
        } as Product;
      });
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function seedCatalogToFirestore(): Promise<number> {
  const path = 'products';
  try {
    const batch = writeBatch(db);
    for (const p of SEED_PRODUCTS) {
      const ref = doc(db, path, p.id);
      const stockQty = Math.max(0, Math.min(100000, Math.round(p.stockQty)));
      batch.set(ref, {
        id: p.id,
        sku: p.sku.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 40),
        name: clampString(p.name, 160),
        shortName: clampString(p.shortName, 80),
        brand: clampString(p.brand, 60),
        category: p.category,
        categoryLabel: clampString(p.categoryLabel, 60),
        priceInr: Math.max(0, Math.round(p.priceInr)),
        mrpInr: p.mrpInr ? Math.max(0, Math.round(p.mrpInr)) : Math.round(p.priceInr),
        rating: Math.max(0, Math.min(5, Number(p.rating))),
        reviewCount: Math.max(0, Math.round(p.reviewCount)),
        stockStatus: computeStockStatus(stockQty),
        stockQty,
        image: clampString(p.image, 500),
        gallery: (p.gallery || [p.image]).slice(0, 5),
        description: clampString(p.description, 2000),
        highlights: (p.highlights || []).slice(0, 8),
        specs: (p.specs || []).slice(0, 15),
        isTrending: Boolean(p.isTrending),
        isBestSeller: Boolean(p.isBestSeller),
        isBundle: Boolean(p.isBundle),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return SEED_PRODUCTS.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveProductAdmin(
  product: Product,
  isNew: boolean
): Promise<void> {
  const id = sanitizeId(product.id || product.shortName);
  const path = `products/${id}`;
  try {
    const ref = doc(db, 'products', id);
    const stockQty = Math.max(0, Math.min(100000, Math.round(product.stockQty)));
    const basePayload = {
      id,
      sku: product.sku.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 40) || 'EM-NEW-01',
      name: clampString(product.name, 160),
      shortName: clampString(product.shortName, 80),
      brand: clampString(product.brand || 'ElectroMart', 60),
      category: product.category,
      categoryLabel: clampString(product.categoryLabel, 60),
      priceInr: Math.max(0, Math.min(5000000, Math.round(product.priceInr))),
      mrpInr: Math.max(
        0,
        Math.min(5000000, Math.round(product.mrpInr || product.priceInr))
      ),
      rating: Math.max(0, Math.min(5, Number(product.rating || 4.8))),
      reviewCount: Math.max(0, Math.round(product.reviewCount || 0)),
      stockStatus: computeStockStatus(stockQty),
      stockQty,
      image: clampString(product.image, 500),
      gallery: (product.gallery && product.gallery.length > 0
        ? product.gallery
        : [product.image]
      ).slice(0, 5),
      description: clampString(product.description, 2000),
      highlights: (product.highlights || []).slice(0, 8),
      specs: (product.specs || []).slice(0, 15),
      isTrending: Boolean(product.isTrending),
      isBestSeller: Boolean(product.isBestSeller),
      isBundle: Boolean(product.isBundle),
      updatedAt: serverTimestamp(),
    };

    if (isNew) {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, basePayload);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

export async function updateProductInventoryAdmin(
  productId: string,
  newStockQty: number,
  newPriceInr?: number
): Promise<void> {
  const path = `products/${productId}`;
  try {
    const qty = Math.max(0, Math.min(100000, Math.round(newStockQty)));
    const updateData: Record<string, unknown> = {
      stockQty: qty,
      stockStatus: computeStockStatus(qty),
      updatedAt: serverTimestamp(),
    };
    if (typeof newPriceInr === 'number' && !Number.isNaN(newPriceInr)) {
      updateData.priceInr = Math.max(0, Math.min(5000000, Math.round(newPriceInr)));
    }
    await updateDoc(doc(db, 'products', productId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// USER PROFILES & ADMIN CHECK
// ============================================================================

export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid: d.uid,
        displayName: String(d.displayName ?? displayName),
        email: String(d.email ?? email),
        phone: String(d.phone ?? ''),
        organization: String(d.organization ?? ''),
        address: String(d.address ?? ''),
        city: String(d.city ?? ''),
        state: String(d.state ?? ''),
        pinCode: String(d.pinCode ?? ''),
      };
    }

    const initialProfile = {
      uid,
      displayName: clampString(displayName || email.split('@')[0], 100),
      email: clampString(email, 160),
      phone: '',
      organization: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initialProfile);
    return {
      uid,
      displayName: initialProfile.displayName,
      email: initialProfile.email,
      phone: '',
      organization: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'displayName'
      | 'phone'
      | 'organization'
      | 'address'
      | 'city'
      | 'state'
      | 'pinCode'
    >
  >
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.displayName !== undefined) {
      payload.displayName = clampString(updates.displayName, 100) || 'Customer';
    }
    if (updates.phone !== undefined) payload.phone = clampString(updates.phone, 20);
    if (updates.organization !== undefined)
      payload.organization = clampString(updates.organization, 120);
    if (updates.address !== undefined)
      payload.address = clampString(updates.address, 300);
    if (updates.city !== undefined) payload.city = clampString(updates.city, 80);
    if (updates.state !== undefined) payload.state = clampString(updates.state, 80);
    if (updates.pinCode !== undefined)
      payload.pinCode = clampString(updates.pinCode, 12);

    await updateDoc(doc(db, 'users', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkIsAdminRecord(uid: string): Promise<boolean> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export function subscribeAllCustomersAdmin(
  onData: (users: UserProfile[]) => void
): () => void {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const users: UserProfile[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: String(data.displayName ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          organization: String(data.organization ?? ''),
          address: String(data.address ?? ''),
          city: String(data.city ?? ''),
          state: String(data.state ?? ''),
          pinCode: String(data.pinCode ?? ''),
        };
      });
      onData(users);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

// ============================================================================
// PERSISTED USER CART & WISHLIST SUBCOLLECTIONS
// ============================================================================

export function subscribeUserCart(
  uid: string,
  onData: (entries: { productId: string; quantity: number }[]) => void
): () => void {
  const path = `users/${uid}/cart`;
  const q = query(collection(db, 'users', uid, 'cart'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        productId: String(d.data().productId ?? d.id),
        quantity: Number(d.data().quantity ?? 1),
      }));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function upsertUserCartItem(
  uid: string,
  product: Product,
  quantity: number
): Promise<void> {
  const path = `users/${uid}/cart/${product.id}`;
  try {
    const ref = doc(db, 'users', uid, 'cart', product.id);
    if (quantity <= 0) {
      await deleteDoc(ref);
      return;
    }
    const clampedQty = Math.max(1, Math.min(50, Math.round(quantity)));
    await setDoc(ref, {
      userId: uid,
      productId: product.id,
      sku: clampString(product.sku, 40),
      shortName: clampString(product.shortName, 100),
      priceInr: Math.max(0, Math.round(product.priceInr)),
      image: clampString(product.image, 500),
      quantity: clampedQty,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearUserCartFirestore(uid: string): Promise<void> {
  const path = `users/${uid}/cart`;
  try {
    const q = query(collection(db, 'users', uid, 'cart'), where('userId', '==', uid));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserWishlist(
  uid: string,
  onData: (productIds: string[]) => void
): () => void {
  const path = `users/${uid}/wishlist`;
  const q = query(
    collection(db, 'users', uid, 'wishlist'),
    where('userId', '==', uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => String(d.data().productId ?? d.id)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function toggleUserWishlistFirestore(
  uid: string,
  product: Product,
  shouldSave: boolean
): Promise<void> {
  const path = `users/${uid}/wishlist/${product.id}`;
  try {
    const ref = doc(db, 'users', uid, 'wishlist', product.id);
    if (!shouldSave) {
      await deleteDoc(ref);
      return;
    }
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      return;
    }
    await setDoc(ref, {
      userId: uid,
      productId: product.id,
      shortName: clampString(product.shortName, 100),
      priceInr: Math.max(0, Math.round(product.priceInr)),
      image: clampString(product.image, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// ORDERS & CHECKOUT
// ============================================================================

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  state: string;
  pinCode: string;
  paymentMethod: PaymentMethod;
  promoCode: string;
  subtotalInr: number;
  discountInr: number;
  shippingInr: number;
  totalInr: number;
  items: CartItem[];
  catalogFromFirestore: boolean;
}

export async function createOrderAtomic(
  input: CreateOrderInput
): Promise<OrderRecord> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ord-${Date.now()}-${randomSuffix}`;
  const orderNumber = `EM-${new Date().getFullYear()}-${randomSuffix}`;
  const path = `orders/${orderId}`;

  try {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', orderId);

    const paymentStatus: PaymentStatus =
      input.paymentMethod === 'cod'
        ? 'pending_cod'
        : 'awaiting_online_gateway';

    const itemsSummary = clampString(
      input.items
        .map((i) => `${i.quantity}x ${i.product.shortName}`)
        .join(', '),
      600
    );
    const itemCount = input.items.reduce((sum, i) => sum + i.quantity, 0);

    batch.set(orderRef, {
      orderNumber,
      userId: input.userId,
      customerName: clampString(input.customerName, 100),
      customerEmail: clampString(input.customerEmail, 160),
      customerPhone: clampString(input.customerPhone, 20),
      address: clampString(input.address, 300),
      state: clampString(input.state, 80),
      pinCode: clampString(input.pinCode, 10),
      paymentMethod: input.paymentMethod,
      paymentStatus,
      orderStatus: 'placed',
      promoCode: clampString(input.promoCode, 30),
      subtotalInr: Math.max(0, Math.round(input.subtotalInr)),
      discountInr: Math.max(0, Math.round(input.discountInr)),
      shippingInr: Math.max(0, Math.round(input.shippingInr)),
      totalInr: Math.max(0, Math.round(input.totalInr)),
      itemCount: Math.max(1, Math.min(500, itemCount)),
      itemsSummary: itemsSummary || 'Hardware Order',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const item of input.items) {
      const itemRef = doc(db, 'orders', orderId, 'items', item.product.id);
      batch.set(itemRef, {
        orderId,
        userId: input.userId,
        productId: item.product.id,
        sku: clampString(item.product.sku, 40),
        name: clampString(item.product.name, 160),
        priceInr: Math.max(0, Math.round(item.product.priceInr)),
        quantity: Math.max(1, Math.min(50, Math.round(item.quantity))),
        image: clampString(item.product.image, 500),
        createdAt: serverTimestamp(),
      });

      // Decrement live Firestore inventory when products collection is populated
      if (input.catalogFromFirestore && item.product.stockQty > 0) {
        const nextQty = Math.max(0, item.product.stockQty - item.quantity);
        if (nextQty < item.product.stockQty) {
          batch.update(doc(db, 'products', item.product.id), {
            stockQty: nextQty,
            stockStatus: computeStockStatus(nextQty),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await batch.commit();

    return {
      id: orderId,
      orderNumber,
      userId: input.userId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      address: input.address,
      state: input.state,
      pinCode: input.pinCode,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      orderStatus: 'placed',
      promoCode: input.promoCode,
      subtotalInr: input.subtotalInr,
      discountInr: input.discountInr,
      shippingInr: input.shippingInr,
      totalInr: input.totalInr,
      itemCount,
      itemsSummary,
      createdAtMs: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function mapOrderDoc(id: string, data: Record<string, unknown>): OrderRecord {
  return {
    id,
    orderNumber: String(data.orderNumber ?? ''),
    userId: String(data.userId ?? ''),
    customerName: String(data.customerName ?? ''),
    customerEmail: String(data.customerEmail ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    address: String(data.address ?? ''),
    state: String(data.state ?? ''),
    pinCode: String(data.pinCode ?? ''),
    paymentMethod: (data.paymentMethod as PaymentMethod) || 'cod',
    paymentStatus: (data.paymentStatus as PaymentStatus) || 'pending_cod',
    orderStatus: (data.orderStatus as OrderStatus) || 'placed',
    promoCode: String(data.promoCode ?? ''),
    subtotalInr: Number(data.subtotalInr ?? 0),
    discountInr: Number(data.discountInr ?? 0),
    shippingInr: Number(data.shippingInr ?? 0),
    totalInr: Number(data.totalInr ?? 0),
    itemCount: Number(data.itemCount ?? 0),
    itemsSummary: String(data.itemsSummary ?? ''),
    createdAtMs: toMillis(data.createdAt),
  };
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: OrderRecord[]) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => mapOrderDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(orders);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllOrdersAdmin(
  onData: (orders: OrderRecord[]) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs.map((d) =>
        mapOrderDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(orders);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function fetchOrderItems(
  orderId: string,
  userId: string
): Promise<OrderItemRecord[]> {
  const path = `orders/${orderId}/items`;
  try {
    const q = query(
      collection(db, 'orders', orderId, 'items'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: String(data.orderId ?? orderId),
        userId: String(data.userId ?? userId),
        productId: String(data.productId ?? ''),
        sku: String(data.sku ?? ''),
        name: String(data.name ?? ''),
        priceInr: Number(data.priceInr ?? 0),
        quantity: Number(data.quantity ?? 1),
        image: String(data.image ?? ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cancelOrderCustomer(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatusAdmin(
  orderId: string,
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus,
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// NEWSLETTER SUBSCRIPTION
// ============================================================================

export async function saveNewsletterSubscription(
  email: string,
  track: string
): Promise<void> {
  const docId = `sub-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const path = `newsletter/${docId}`;
  try {
    await setDoc(doc(db, 'newsletter', docId), {
      email: clampString(email, 160),
      track: clampString(track, 60),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
