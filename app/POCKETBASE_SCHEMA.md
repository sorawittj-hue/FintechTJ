# PocketBase Schema for Investment Dashboard

This document defines the complete database schema for PocketBase to support the investment tracking dashboard.

## Setup Instructions

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract and run: `./pocketbase serve`
3. Open admin panel at http://127.0.0.1:8090/_/
4. Create collections as defined below
5. Set up API rules for authentication

---

## Collections

### 1. users (Built-in)
PocketBase provides built-in user authentication. No additional setup needed.

---

### 2. portfolio_positions
Stores user's investment holdings across all asset types.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | Owner of the position |
| symbol | text | ✅ | - | Asset symbol (e.g., BTC, ETH, AAPL) |
| name | text | ✅ | - | Asset name |
| type | select | ✅ | crypto | `crypto`, `stock`, `commodity`, `forex`, `etf` |
| quantity | number | ✅ | 0 | Amount held |
| avgPrice | number | ✅ | 0 | Average buy-in price |
| currentPrice | number | ❌ | 0 | Current price (updated by websocket) |
| value | number | ❌ | 0 | Total value (quantity * currentPrice) |
| change24h | number | ❌ | 0 | 24h change percent |
| change24hValue | number | ❌ | 0 | 24h change in value |
| allocation | number | ❌ | 0 | Portfolio allocation % |
| notes | text | ❌ | - | User notes |
| color | text | ❌ | #3B82F6 | Display color |
| icon | text | ❌ | - | Icon identifier |
| isActive | bool | ✅ | true | Active tracking |

**Indexes:**
- user (unique: false)
- symbol (unique: false)
- type (unique: false)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 3. transactions
Records all buy/sell/deposit/withdraw transactions.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | Transaction owner |
| position | relation (portfolio_positions) | ❌ | - | Related position |
| type | select | ✅ | buy | `buy`, `sell`, `deposit`, `withdraw`, `transfer` |
| symbol | text | ✅ | - | Asset symbol |
| quantity | number | ✅ | 0 | Amount |
| price | number | ✅ | 0 | Price per unit |
| totalValue | number | ✅ | 0 | Total value (quantity * price) |
| fee | number | ❌ | 0 | Transaction fee |
| timestamp | date | ✅ | now | Transaction time |
| notes | text | ❌ | - | Transaction notes |
| exchange | text | ❌ | - | Exchange name |
| txHash | text | ❌ | - | Blockchain TX hash |

**Indexes:**
- user (unique: false)
- timestamp (unique: false)
- type (unique: false)
- symbol (unique: false)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 4. alerts
Price and condition-based alerts.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | Alert owner |
| symbol | text | ✅ | - | Asset symbol |
| type | select | ✅ | price | `price`, `volume`, `percent_change`, `news` |
| condition | select | ✅ | above | `above`, `below`, `crosses_above`, `crosses_below` |
| targetPrice | number | ✅ | 0 | Target price |
| targetValue | number | ❌ | 0 | Target value (for volume) |
| percentChange | number | ❌ | 0 | Target % change |
| isActive | bool | ✅ | true | Alert active status |
| triggeredAt | date | ❌ | - | When triggered |
| message | text | ❌ | - | Custom message |
| notifyEmail | bool | ✅ | true | Email notification |
| notifyPush | bool | ✅ | true | Push notification |
| soundEnabled | bool | ✅ | true | Play sound |

**Indexes:**
- user (unique: false)
- isActive (unique: false)
- symbol (unique: false)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 5. watchlist
User's watched symbols.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | Watchlist owner |
| symbols | json | ✅ | [] | Array of symbol strings |
| name | text | ❌ | Default | Watchlist name |
| color | text | ❌ | #3B82F6 | Display color |

**Indexes:**
- user (unique: true)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 6. performance_history
Historical portfolio performance snapshots.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | User ID |
| date | date | ✅ | - | Snapshot date |
| totalValue | number | ✅ | 0 | Total portfolio value |
| totalCost | number | ✅ | 0 | Total invested |
| profitLoss | number | ✅ | 0 | P&L |
| profitLossPercent | number | ✅ | 0 | P&L % |
| dailyChange | number | ❌ | 0 | Daily change |
| dailyChangePercent | number | ❌ | 0 | Daily change % |
| topPerformer | text | ❌ | - | Best performing asset |
| worstPerformer | text | ❌ | - | Worst performing asset |

**Indexes:**
- user (unique: false)
- date (unique: false)
- user + date (unique: true)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 7. investment_goals
User's investment goals and targets.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | Goal owner |
| name | text | ✅ | - | Goal name |
| targetType | select | ✅ | value | `value`, `percent`, `income` |
| targetValue | number | ✅ | 0 | Target amount/percentage |
| currentValue | number | ❌ | 0 | Current progress |
| deadline | date | ❌ | - | Target date |
| priority | select | ❌ | medium | `low`, `medium`, `high` |
| description | text | ❌ | - | Goal description |
| isAchieved | bool | ✅ | false | Completion status |

**Indexes:**
- user (unique: false)
- isAchieved (unique: false)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

### 8. api_cache
Server-side API response cache.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| cacheKey | text | ✅ | - | Unique cache key |
| data | json | ✅ | - | Cached data |
| expiresAt | date | ✅ | - | Expiration time |
| createdAt | date | ✅ | now | Creation time |

**Indexes:**
- cacheKey (unique: true)
- expiresAt (unique: false)

**API Rules:**
- List: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

---

### 9. news_history
Cached news articles.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | text | ✅ | - | Article title |
| source | text | ✅ | - | News source |
| url | text | ✅ | - | Article URL |
| imageUrl | text | ❌ | - | Thumbnail |
| publishedAt | date | ✅ | - | Publication time |
| symbols | json | ❌ | [] | Related symbols |
| sentiment | select | ❌ | neutral | `positive`, `negative`, `neutral` |
| summary | text | ❌ | - | AI summary |

**Indexes:**
- publishedAt (unique: false)
- symbols (unique: false)

**API Rules:**
- List: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

---

### 10. user_preferences
Extended user settings.

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user | relation (users) | ✅ | - | User ID |
| theme | select | ✅ | system | `light`, `dark`, `system` |
| currency | select | ✅ | USD | `USD`, `THB`, `EUR`, `GBP`, `JPY` |
| language | select | ✅ | en | `en`, `th`, `zh`, `ja` |
| refreshInterval | number | ✅ | 10000 | Data refresh ms |
| compactMode | bool | ✅ | false | UI compact mode |
| showAnimations | bool | ✅ | true | Enable animations |
| soundEnabled | bool | ✅ | true | Sound effects |
| emailNotifications | bool | ✅ | true | Email alerts |
| pushNotifications | bool | ✅ | true | Push alerts |

**Indexes:**
- user (unique: true)

**API Rules:**
- List: `user.id = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `user.id = @request.auth.id`
- Delete: `user.id = @request.auth.id`

---

## Quick Setup Script

Run this in PocketBase admin panel or use the API:

```javascript
// Create collections programmatically
const collections = [
  {
    name: 'portfolio_positions',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
      { name: 'symbol', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, options: { values: ['crypto', 'stock', 'commodity', 'forex', 'etf'] } },
      { name: 'quantity', type: 'number', required: true },
      { name: 'avgPrice', type: 'number', required: true },
      { name: 'currentPrice', type: 'number' },
      { name: 'value', type: 'number' },
      { name: 'change24h', type: 'number' },
      { name: 'change24hValue', type: 'number' },
      { name: 'allocation', type: 'number' },
      { name: 'notes', type: 'text' },
      { name: 'color', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'isActive', type: 'bool', required: true }
    ]
  },
  // ... add other collections similarly
];

// Note: Use PocketBase admin UI for easier setup
```

---

## Data Migration

For existing localStorage data, use the migration script in `/scripts/migrate-to-pocketbase.js`

---

## Backup & Export

PocketBase provides automatic backups in `/pb_data/backups/`
Use the admin panel to export/import data as JSON.
