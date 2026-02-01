# EmasPOS - Sistem Manajemen Toko Emas

A comprehensive Point of Sale (POS) and inventory management system designed specifically for gold shops. Built with Tauri, React, and Rust for a fast, secure, and native desktop experience.

## Features

### Core Functionality
- **Point of Sale (POS)** - Fast checkout with barcode scanning support
- **Inventory Management** - Track gold items with detailed product information (purity, weight, labor cost)
- **Buyback Transactions** - Handle gold repurchase from customers
- **Exchange Transactions** - Manage gold exchange/trade-in operations
- **Gold Price Management** - Track daily gold prices by type (LM, UBS, Lokal) and purity

### Business Management
- **Multi-Branch Support** - Manage multiple store locations
- **Customer Management** - Track customer information and transaction history
- **User Management** - Role-based access control (Owner, Kasir/Cashier)
- **Reports & Analytics** - Daily summaries, sales reports, and stock reports

### Integrations
- **Salesforce Sync** - Cloud synchronization for multi-branch data sharing
- **Payment Methods** - Cash, QRIS, and bank transfer support
- **Receipt Printing** - Thermal printer support (58mm/80mm)

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- TailwindCSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- React Hook Form + Zod for form validation
- Recharts for analytics visualization

**Backend:**
- Tauri 2.0 (Rust)
- SQLite database via SQLx
- Async runtime with Tokio
- Reqwest for HTTP/API calls

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd SGM-SYS

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Development

```bash
# Start Vite dev server only (frontend)
npm run dev

# Start Tauri development mode (full app)
npm run tauri dev

# Build the application
npm run tauri build
```

## Project Structure

```
├── src/                    # React frontend
│   ├── api/               # API layer (Tauri invoke wrappers)
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   └── types/             # TypeScript type definitions
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   ├── db/            # Database schema and operations
│   │   ├── models/        # Data models
│   │   ├── salesforce/    # Salesforce integration
│   │   └── sync/          # Sync engine
│   └── Cargo.toml
└── package.json
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

Private - All rights reserved
