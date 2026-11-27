/**
 * ElectroMart Firestore Security Rules — Dirty Dozen Verification Suite
 * Designed for @firebase/rules-unit-testing against firestore.rules.
 */

export interface AdversarialCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Shadow Admin Privilege Injection on User Profile Create',
    operation: 'create',
    path: '/users/user_alice',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      uid: 'user_alice',
      displayName: 'Alice',
      email: 'alice@example.com',
      isAdmin: true,
      role: 'admin',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-User PII Read Attempt',
    operation: 'get',
    path: '/users/user_bob',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof on Product Write',
    operation: 'create',
    path: '/products/spoof_item',
    auth: { uid: 'attacker_1', email: 'rameshmuddu59@gmail.com', email_verified: false },
    payload: { id: 'spoof_item', name: 'Spoofed Board', priceInr: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Customer Product Price Tampering',
    operation: 'update',
    path: '/products/arduino-uno-r4-minima',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { priceInr: 1, updatedAt: 'REQUEST_TIME' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Order Identity Spoofing',
    operation: 'create',
    path: '/orders/order_spoof_1',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      orderNumber: 'EM-9999',
      userId: 'user_bob',
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      customerPhone: '9876543210',
      address: '12 MG Road',
      state: 'Karnataka',
      pinCode: '560001',
      paymentMethod: 'cod',
      paymentStatus: 'pending_cod',
      orderStatus: 'placed',
      promoCode: '',
      subtotalInr: 2149,
      discountInr: 0,
      shippingInr: 120,
      totalInr: 2269,
      itemCount: 1,
      itemsSummary: '1x Arduino Uno R4',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Order State Shortcutting on Create',
    operation: 'create',
    path: '/orders/order_shortcut_1',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      orderNumber: 'EM-9998',
      userId: 'user_alice',
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      customerPhone: '9876543210',
      address: '12 MG Road',
      state: 'Karnataka',
      pinCode: '560001',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      promoCode: '',
      subtotalInr: 2149,
      discountInr: 0,
      shippingInr: 0,
      totalInr: 2149,
      itemCount: 1,
      itemsSummary: '1x Arduino Uno R4',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Terminal Order State Mutation by Customer',
    operation: 'update',
    path: '/orders/order_delivered_1',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { orderStatus: 'cancelled', updatedAt: 'REQUEST_TIME' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immortal Field (createdAt) Mutation on Profile Update',
    operation: 'update',
    path: '/users/user_alice',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { createdAt: 'REQUEST_TIME', updatedAt: 'REQUEST_TIME' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Path ID Poisoning (Oversized / Invalid Characters)',
    operation: 'create',
    path: '/orders/' + 'A'.repeat(160),
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { orderNumber: 'EM-1001', userId: 'user_alice' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Value Poisoning (Oversized Address String)',
    operation: 'update',
    path: '/users/user_alice',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: { address: 'X'.repeat(5000), updatedAt: 'REQUEST_TIME' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Orphaned OrderItem Write into Another Users Order',
    operation: 'create',
    path: '/orders/order_bob_1/items/item_1',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    payload: {
      orderId: 'order_bob_1',
      userId: 'user_alice',
      productId: 'arduino-uno-r4-minima',
      sku: 'EM-ARD-R4M',
      name: 'Arduino Uno R4',
      priceInr: 2149,
      quantity: 1,
      image: '/src/assets/images/prod_arduino_uno_1795746193348.jpg',
      createdAt: 'REQUEST_TIME',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unscoped List Scraping on Orders / Newsletter',
    operation: 'list',
    path: '/newsletter',
    auth: { uid: 'user_alice', email: 'alice@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
