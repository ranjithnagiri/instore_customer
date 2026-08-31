# Community Store — Customer App (React Native / Expo)

Cross-platform (Android + iOS) resident-facing app implementing the
Customer App PRD, wired to the `testapi.godpixels.com` In-Store
Platform API (`api/openapi.json` schema you supplied).

## Stack

- **Expo SDK 51 / React Native 0.74** — one codebase, builds for both
  Android and iOS (and can run in Expo Go during development).
- **React Navigation** — native-stack + bottom-tabs.
- **Axios** — single client (`src/api/client.ts`) with automatic
  Bearer-token injection and silent refresh on 401 via
  `/api/auth/refresh`, matching the PRD's 30-min access / 30-day
  refresh token policy.
- **expo-secure-store** — tokens live in Keychain/Keystore, not
  AsyncStorage.
- **AsyncStorage** — cart, wishlist, and notification-preference state
  (see "Known gaps" below for why these are client-side).

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` for an
Android/iOS simulator. Update the API base URL in `app.json` →
`expo.extra.apiBaseUrl` per environment (it currently points at
`https://testapi.godpixels.com`).

## Project layout

```
src/
  api/            One module per OpenAPI tag (auth, catalog, orders, misc)
  constants/      Base URL + PRD business-rule constants (OTP policy, timers)
  context/        AuthContext, CartContext, WishlistContext
  navigation/      AuthNavigator (pre-login) / RootNavigator + MainTabNavigator (post-login)
  screens/        One folder per PRD section
  types/          Mirrors the OpenAPI `components.schemas`
  utils/storage.ts SecureStore (tokens) vs AsyncStorage (app state) wrapper
```

## PRD section → screen/feature map

| PRD § | Feature | Where |
|---|---|---|
| 2.1 | OTP login | `screens/auth/LoginScreen`, `OtpScreen` |
| 2.2 | Home / community / categories | `screens/home/HomeScreen` |
| 2.3 | Store selection scoped to community | `api/catalog.fetchStoresForCommunity` |
| 2.4 | Search | `screens/search/SearchScreen` (see gap below) |
| 2.5–2.6 | Product listing / cart | `screens/store/StoreDetailScreen`, `context/CartContext`, `screens/cart/CartScreen` |
| 2.7–2.8 | Checkout / payments | `screens/checkout/CheckoutScreen` |
| 2.9 | Order tracking | `screens/orders/OrderTrackingScreen` (polls `/tracking` every 15s) |
| 2.10 | Order history | `screens/orders/OrderHistoryScreen` |
| 2.11 | Wishlist | `screens/wishlist/WishlistScreen` (see gap below) |
| 2.12 | Profile | `screens/profile/ProfileScreen` |
| 2.13 | Reviews | `screens/reviews/ReviewScreen` |
| §3 OTP policy | 6-digit / 5-min expiry / 5 attempts / 30s resend | `OtpScreen`, constants in `constants/config.ts` |
| §3 Token policy | 30-min access / 30-day refresh | `api/client.ts` refresh interceptor |
| §3 Stock reservation | 10-min checkout countdown | `screens/checkout/CheckoutScreen` |
| §3 Substitution approval | 15-min countdown, approve/decline | `screens/orders/OrderTrackingScreen` |
| §3 Refund visibility | refund mode/status | `screens/wallet/WalletScreen`, `OrderHistoryScreen` status badges |
| §3 Wallet ledger | transaction-level, reasons | `screens/wallet/WalletScreen` |
| §3 Notification granularity | mandatory order updates + optional toggles | `screens/profile/NotificationSettingsScreen` |
| §3 Order cut-off feedback | closed/paused messaging | `HomeScreen` store badges, `StoreDetailScreen` add-to-cart guard |
| §3 One store per cart | conflict prompt instead of silent merge | `context/CartContext.addItem` |
| §3 Low-bandwidth | lazy image loading | native `<Image>` (RN lazy-loads by default); a low-bandwidth toggle is a small follow-up (see below) |

## Known gaps vs. the supplied OpenAPI spec

The spec is thorough but a few PRD items don't have a backing
endpoint yet. These are implemented as reasonable client-side
stand-ins, called out in comments at each usage site, so it's obvious
what to swap out once the endpoint exists:

- **Wishlist / favorites** — no `/wishlist` resource in the spec.
  Currently persisted on-device (`WishlistContext` + AsyncStorage).
- **Search** — the architecture doc mentions Elasticsearch-backed
  search, but no `/search` path is exposed. `SearchScreen` does a
  client-side filter over the community's store list as a stand-in.
- **Notification preference persistence** — `/api/customer/profile/*`
  has no preferences sub-resource, so toggles are stored on-device.
- **Invoice download** — no PDF/export endpoint; "Download Invoice"
  from order history isn't wired up yet.
- **Saved payment methods** — no card-on-file resource in the spec.
- **Store operating-hours / open-close details on `StoreDetailScreen`**
  — the customer catalog endpoints return products/menu but not the
  `Store` object itself for a single store, so the detail screen shows
  the store name passed in from the previous screen rather than a
  fresh open/closed read; `HomeScreen`'s list (from
  `/api/customer/catalog/stores`) is the source of truth for that.
- **Substitution proposals** — `/api/customer/orders/substitution/respond`
  exists, but there's no customer-facing GET for pending substitutions.
  In production this arrives via a push notification carrying the
  `orderItemId` (per the Notification service in the architecture
  doc); `OrderTrackingScreen` accepts that as a route param
  (`pendingSubstitutionItemId`) for a deep-link flow, with a manual
  fallback field in the meantime.
- **Social / Guest login** — marked optional in the PRD; not wired to
  a real OAuth provider.

## Payment gateway integration

`CheckoutScreen` calls `POST /api/customer/orders`, then — for
non-COD modes — `POST /api/customer/orders/payment-callback`. In this
build the gateway hand-off is stubbed with a synthetic
`gatewayRefId`; swap that block for the actual Razorpay/PhonePe/PayU
SDK call (the `gateway` field already matches the enum in `Payment`),
awaiting the SDK's result before posting the callback.
