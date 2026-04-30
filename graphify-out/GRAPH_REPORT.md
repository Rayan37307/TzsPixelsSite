# Graph Report - .  (2026-04-30)

## Corpus Check
- Corpus is ~13,653 words - fits in a single context window. You may not need a graph.

## Summary
- 151 nodes · 128 edges · 19 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.73)
- Token cost: 1,632 input · 428 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Pages|UI Pages]]
- [[_COMMUNITY_Shopify Integration|Shopify Integration]]
- [[_COMMUNITY_Backend API Routes|Backend API Routes]]
- [[_COMMUNITY_Bot & Widgets|Bot & Widgets]]
- [[_COMMUNITY_Bot Data Model|Bot Data Model]]
- [[_COMMUNITY_Notification Service|Notification Service]]
- [[_COMMUNITY_Bot Management UI|Bot Management UI]]
- [[_COMMUNITY_Navigation & Layout|Navigation & Layout]]
- [[_COMMUNITY_Notifications UI|Notifications UI]]
- [[_COMMUNITY_Dashboard Service|Dashboard Service]]
- [[_COMMUNITY_AI Service|AI Service]]
- [[_COMMUNITY_Database Config|Database Config]]
- [[_COMMUNITY_API Client|API Client]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]

## God Nodes (most connected - your core abstractions)
1. `ShopifyService` - 12 edges
2. `Main App Component` - 7 edges
3. `BotModel` - 6 edges
4. `Order Management Page` - 6 edges
5. `NotificationService` - 5 edges
6. `Card UI Component` - 5 edges
7. `Button UI Component` - 5 edges
8. `Badge UI Component` - 5 edges
9. `Express App Entry Point` - 5 edges
10. `Notification Management Service` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Shopify Admin API` --shares_data_with--> `Bot`  [INFERRED]
  frontend/shopify.md → backend/src/models/Bot.ts
- `Scalefy Widget` --references--> `Bot ID (867ddc17-ee0f-41d7-9f3a-8822ec629c91)`  [EXTRACTED]
  backend/public/widget.js → frontend/index.html
- `BotManagement Page` --conceptually_related_to--> `Gemini AI Service`  [INFERRED]
  frontend/src/pages/BotManagement.tsx → backend/src/services/aiService.ts
- `Store Management Store` --conceptually_related_to--> `Shopify Integration Service`  [INFERRED]
  frontend/src/store/useStoreStore.ts → backend/src/services/shopifyService.ts
- `React + TypeScript + Vite` --references--> `React Logo`  [EXTRACTED]
  frontend/README.md → frontend/src/assets/react.svg

## Communities

### Community 0 - "UI Pages"
Cohesion: 0.25
Nodes (15): AI Assistant Page, Abandoned Checkout Page, Main App Component, Badge UI Component, Button UI Component, Card UI Component, Dashboard Home Page, Fraud Detection Page (+7 more)

### Community 1 - "Shopify Integration"
Cohesion: 0.24
Nodes (1): ShopifyService

### Community 2 - "Backend API Routes"
Cohesion: 0.26
Nodes (12): Express App Entry Point, AI Routes, Bot CRUD Routes, Dashboard Routes, Notification Routes, Order Routes, Gemini AI Service, Dashboard Statistics Service (+4 more)

### Community 3 - "Bot & Widgets"
Cohesion: 0.22
Nodes (8): Bot, React + TypeScript + Vite, Scalefy Widget, Shopify Admin API, Bot ID (867ddc17-ee0f-41d7-9f3a-8822ec629c91), Favicon, React Logo, Vite Logo

### Community 5 - "Bot Data Model"
Cohesion: 0.29
Nodes (1): BotModel

### Community 6 - "Notification Service"
Cohesion: 0.33
Nodes (1): NotificationService

### Community 7 - "Bot Management UI"
Cohesion: 0.6
Nodes (3): fetchBots(), handleDelete(), handleSave()

### Community 8 - "Navigation & Layout"
Cohesion: 0.4
Nodes (5): Dashboard Layout, Top Navigation Bar, Navigation Sidebar, Auth State Store, UI State Store

### Community 9 - "Notifications UI"
Cohesion: 0.83
Nodes (3): fetchNotifications(), markAllRead(), markRead()

### Community 10 - "Dashboard Service"
Cohesion: 0.5
Nodes (4): Dashboard Layout, CourierSupport Page, Auth and UI Store, ClassName Utility

### Community 11 - "AI Service"
Cohesion: 0.5
Nodes (4): BotModel, Bots Table, createBotsTable, pool

### Community 12 - "Database Config"
Cohesion: 0.67
Nodes (1): DashboardService

### Community 13 - "API Client"
Cohesion: 0.67
Nodes (1): AIService

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (2): DashboardHome Uses dashboardApi, Dashboard API Service

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (2): Navbar Uses notificationApi, Notification API Service

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (2): Login Page, NotificationsCenter Page

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): API Client Service

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Pool

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Social Icons

## Knowledge Gaps
- **25 isolated node(s):** `Store Integration Page`, `Dashboard API Service`, `Notification API Service`, `UI State Store`, `Auth State Store` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Shopify Integration`** (13 nodes): `shopifyService.ts`, `ShopifyService`, `.API_VERSION()`, `.BASE_URL()`, `.cancelOrder()`, `.createOrder()`, `.fetchOrders()`, `.getAccessToken()`, `.getOrder()`, `.getProducts()`, `.SHOP()`, `.shopifyFetch()`, `.updateOrder()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bot Data Model`** (7 nodes): `Bot.ts`, `BotModel`, `.create()`, `.delete()`, `.findAll()`, `.findById()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Notification Service`** (6 nodes): `notificationService.ts`, `NotificationService`, `.addNotification()`, `.getNotifications()`, `.markAllAsRead()`, `.markAsRead()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Config`** (3 nodes): `dashboardService.ts`, `DashboardService`, `.getDashboardStats()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Client`** (3 nodes): `aiService.ts`, `AIService`, `.chat()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `DashboardHome Uses dashboardApi`, `Dashboard API Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `Navbar Uses notificationApi`, `Notification API Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `Login Page`, `NotificationsCenter Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `API Client Service`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Pool`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Social Icons`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Main App Component` connect `UI Pages` to `Navigation & Layout`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Dashboard Layout` connect `Navigation & Layout` to `UI Pages`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `Store Integration Page`, `Dashboard API Service`, `Notification API Service` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._