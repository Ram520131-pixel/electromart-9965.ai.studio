# ElectroMart Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **Product Catalog Integrity**: `/products/{productId}` is publicly readable (`get`, `list`), but only verified admins can create, delete, or arbitrarily modify catalog records. Verified customers placing an order may perform only a strictly bounded stock decrement action (`stockQty`, `stockStatus`, `updatedAt`).
2. **Strict PII Isolation**: `/users/{userId}` stores email, phone, and shipping address. Only the owning verified user (`request.auth.uid == userId`) or a verified admin may `get` a profile. Regular users can never `list` `/users`.
3. **No Self-Assigned Roles**: `/users/{userId}` contains no `role` or `isAdmin` field. Admin privileges derive exclusively from the verified bootstrapped admin email (`rameshmuddu59@gmail.com` with `email_verified == true`) or `/admins/{uid}` created only by the bootstrapped admin.
4. **Master Gate on Subcollections**: `/users/{userId}/cart/{productId}` and `/users/{userId}/wishlist/{productId}` require that the parent `/users/{userId}` exists and `userId == request.auth.uid`. `/orders/{orderId}/items/{itemId}` checks the parent `/orders/{orderId}` ownership on single-document operations and `resource.data.userId == request.auth.uid` on `list`.
5. **Order Lifecycle & Terminal Locking**: Customers can create orders strictly with `userId == request.auth.uid`, `orderStatus == 'placed'`, and server timestamps (`request.time`). Once `orderStatus` reaches `'delivered'` or `'cancelled'`, customers cannot mutate the order; only admins can update fulfillment states or correct terminal states.
6. **Temporal Integrity & Path Hardening**: All document IDs are validated with `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars) on single-document operations, and all `createdAt` / `updatedAt` timestamps must match `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Shadow Admin Privilege Injection**: Authenticated customer creates `/users/{uid}` with extra field `{ "isAdmin": true, "role": "admin" }`.
2. **PII Cross-Read**: Authenticated customer B attempts `get` on `/users/{customerA}` or `list` on `/users`.
3. **Unverified Admin Email Spoof**: Caller with `email == 'rameshmuddu59@gmail.com'` and `email_verified == false` attempts to create a product in `/products/spoof-1`.
4. **Customer Product Price Tampering**: Authenticated non-admin customer attempts `update` on `/products/arduino-uno-r4-minima` changing `priceInr` to `1`.
5. **Order Identity Spoofing**: Customer A attempts `create` on `/orders/order-fake` with `userId: 'customer-B'`.
6. **Order State Shortcutting on Create**: Customer A attempts `create` on `/orders/order-paid` with `orderStatus: 'delivered'` and `paymentStatus: 'paid'`.
7. **Terminal Order Mutation**: Customer A attempts `update` on an existing `/orders/{id}` whose `orderStatus` is `'delivered'` to change `orderStatus` to `'cancelled'`.
8. **Immortal Field Tampering**: Customer A attempts `update` on `/users/{uid}` changing `createdAt` or `email`.
9. **Path ID Poisoning**: Caller attempts `create` on `/orders/${'A'.repeat(200)}` or `/products/bad id!@#`.
10. **Value Poisoning / Size Exhaustion**: Customer A attempts `update` on `/users/{uid}` with `address` of length 5,000 characters.
11. **Orphaned Subcollection Write**: Authenticated user attempts `create` on `/users/{uid}/cart/item1` before `/users/{uid}` exists, or into `/orders/{otherOrder}/items/item1`.
12. **Blanket Query Scraping**: Customer A attempts `list` on `/orders` without `where('userId', '==', uid)`, or attempts `list` on `/newsletter`.
