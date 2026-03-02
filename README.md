# Bitespeed Identity Reconciliation — Production Service

A production-hardened **Node.js + TypeScript** backend API built with **Express**, **Prisma ORM**, and **PostgreSQL (Neon)**. This service implements complex identity reconciliation logic to consolidate customer contacts across various identifier (email/phone) overlaps.

## 🚀 Key Features

- **Identity Merging:** Consolidates multiple contacts into a single "cluster" with one primary source of truth.
- **Transaction Safety:** Uses Prisma's interactive transactions to ensure atomic updates during complex merges.
- **Production Logging:** Implements structured logging with `morgan` and custom event loggers.
- **Hardened Validation:** Rigorous input normalization (trimming, lowercasing) and format validation (regex).
- **Soft-Delete Aware:** All data lookups respect the `deletedAt` field for future-proof logical deletion.
- **Health Monitoring:** Dedicated `/health` endpoint for Render/Kubernetes observability.

## 🏗️ Architecture

```
src/
├── controllers/        # Request handlers & validation
├── services/           # Core identity merge algorithm
├── routes/             # Endpoint definitions
├── middleware/         # Centralized Error & Logger middleware
├── utils/              # Separated Validation, Logging & Logic Helpers
├── prisma.ts           # Prisma client singleton
├── app.ts              # App-level configuration & middleware
└── server.ts           # Entry point with graceful shutdown 
```

## ⚙️ Identity Merge Algorithm

1. **Identification:** Find all contacts matching the provided `email` OR `phoneNumber`.
2. **Expansion:** Walk the linkage chains recursively to collect the entire "cluster" of related contacts.
3. **Reconciliation:**
   - If no contacts exist, create a new **Primary** contact.
   - If multiple contacts exist, the **Oldest** contact (by `createdAt`) remains the **Primary**.
   - Other contacts that were previously "primary" are converted to **Secondary** and linked to the root primary.
4. **Novel Information:** If the request contains an email or phone number that doesn't yet exist in the cluster, a new **Secondary** contact is created.
5. **Deduplication:** The final response guarantees unique values and places the primary info first.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### 1. Installation

```bash
git clone <repo-url>
cd bitespeed-identity
npm install
```

### 2. Configuration

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://user:password@host:port/neondb?sslmode=require"
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
npx prisma migrate dev --name init
```

### 4. Run Development

```bash
npm run dev
```

---

## 📡 API Endpoints

### `GET /health`

Health check endpoint for monitoring. Returns `200 OK`.

### `POST /identify`

Consolidate identity info.

**Input:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Output:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

## 🚀 Deployment (Render)

### Build Command
`npm install && npx prisma generate && npm run build`

### Start Command
`node dist/server.js`

### Environment Variables
Set `DATABASE_URL`, `NODE_ENV=production`, and `PORT` (usually 10000) in the Render dashboard.

## 🛡️ Future Improvements
- **Rate Limiting:** Implement `express-rate-limit` to prevent brute-force identity lookups.
- **Cache Layer:** Use Redis to cache the "cluster root" IDs for frequently queried identities.
- **Admin Dashboard:** A UI to visualize the identity graph/clusters.

---
**Author:** Backend Engineering Team
**License:** ISC
