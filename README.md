# Padel Booking System

A full-stack web application for managing and booking padel courts. The system allows customers to reserve courts online without creating an account, while administrators manage courts, schedules, closures, offers, and bookings through a dedicated dashboard.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Database Information](#database-information)
8. [Demo Login Credentials](#demo-login-credentials)
9. [Payment Integration (Thawani Sandbox)](#payment-integration-thawani-sandbox)
10. [API Overview](#api-overview)
11. [Notes and Limitations](#notes-and-limitations)

---

## Project Description

The **Padel Booking System** is designed to simplify court reservations for padel sports facilities. Customers visit the booking page, select a date and available time slot, enter their phone number, and choose a payment method. The system automatically assigns an available court without exposing court names to the customer.

Administrators use a web dashboard to manage unlimited courts, set working hours, define closures, create hourly pricing offers, and monitor all bookings with filtering options.

The application consists of:

- **Backend:** ASP.NET Core 8 REST API with Entity Framework Core
- **Frontend:** React single-page application with Vite
- **Database:** SQLite (file-based, created automatically on first run)

---

## Features

### Customer Features

- Book courts **without requiring an account** (phone number is mandatory)
- Optional customer name and email
- View available time slots based on real-time availability
- Select booking duration (1–6 hours)
- Multi-day booking support (optional end date)
- Automatic random court assignment (court names hidden from customers)
- Prevention of past bookings, double bookings, and bookings on closed courts
- Two payment methods:
  - **Pay at venue (Cash)**
  - **Online payment via Thawani**

### Admin Features

- **Courts management:** Add, edit, delete, and view unlimited courts
- **Hourly pricing:** Set individual price per court
- **Working hours:** Configure opening/closing times per court and day of week
- **Court closures:** Close one court, multiple courts, or all courts by date, date range, or specific weekdays
- **Offers system:** Create tiered pricing based on minimum booking hours (e.g., 2 hours = 8 OMR/hour)
- **Booking management:** View all bookings with filters (court, date, status, payment method, phone)
- **Payment monitoring:** View and confirm payment records

---

## Technologies Used

### Backend

| Technology | Purpose |
|------------|---------|
| ASP.NET Core 8 | REST API framework |
| Entity Framework Core 8 | ORM / data access |
| SQLite | Database engine |
| Swagger (Swashbuckle) | API documentation |
| HttpClient | Thawani payment gateway integration |

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| Vite 8 | Build tool and dev server |
| React Router 7 | Client-side routing |
| Axios | HTTP client for API calls |
| CSS (custom) | Styling (RTL Arabic layout) |

### Development Tools

- .NET SDK 8.0+
- Node.js 18+ and npm
- Visual Studio / VS Code / Cursor (recommended)

---

## Project Structure

```
BadelBooking/
├── Backend/
│   └── PadelBooking.API/
│       ├── Controllers/       # API endpoints
│       ├── Models/            # Entity models and DTOs
│       ├── Services/          # Booking logic, Thawani integration
│       ├── Data/              # DbContext, database seeder
│       └── Program.cs         # Application entry point
├── Frontend/
│   └── src/
│       ├── components/        # Navbar, Hero, BookingForm, Footer
│       ├── pages/             # Home, Booking, Admin, Login, Payment
│       ├── services/          # API service modules
│       └── utils/             # Helpers and auth utilities
└── README.md
```

---

## Backend Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) installed

### Steps

1. Open a terminal and navigate to the backend project:

   ```powershell
   cd Backend\PadelBooking.API
   ```

2. Restore dependencies and build:

   ```powershell
   dotnet restore
   dotnet build
   ```

3. Run the API:

   ```powershell
   dotnet run
   ```

4. Verify the API is running:

   - **API base URL:** http://localhost:5104
   - **Swagger UI:** http://localhost:5104/swagger

The database file (`PadelBooking.db`) is created automatically on first startup. Demo users and sample courts are seeded via `DbSeeder`.

---

## Frontend Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later) and npm installed

### Steps

1. Open a **second terminal** and navigate to the frontend project:

   ```powershell
   cd Frontend
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the development server:

   ```powershell
   npm run dev
   ```

4. Open the application in your browser:

   - **Frontend URL:** http://localhost:5173

### API Connection

During development, Vite proxies all `/api` requests to the backend at `http://localhost:5104`. No additional configuration is required if both servers run locally.

To connect directly without the proxy, set in `Frontend/.env.development`:

```env
VITE_API_URL=http://localhost:5104/api
```

### Production Build

```powershell
npm run build
npm run preview
```

---

## Database Information

| Property | Value |
|----------|-------|
| **Engine** | SQLite |
| **File** | `Backend/PadelBooking.API/PadelBooking.db` |
| **Creation** | Automatic via `EnsureCreated()` on startup |
| **Seeding** | Demo users and courts inserted on first run |

### Main Tables

| Table | Description |
|-------|-------------|
| `Courts` | Padel court details, pricing, default hours |
| `CourtWorkingHours` | Custom working hours per court and day |
| `CourtClosures` | Scheduled court unavailability |
| `Offers` | Tiered hourly pricing offers |
| `Bookings` | Customer reservations |
| `Payments` | Payment records (Cash / Thawani) |
| `Users` | Admin and customer accounts |

### Entity Relationships

- A **Court** has many Bookings, WorkingHours, Closures, and Offers
- A **Booking** belongs to one Court and may have associated Payments
- A **Payment** is linked to one Booking

---

## Demo Login Credentials

The following accounts are created automatically when the backend starts for the first time:

### Admin Account

| Field | Value |
|-------|-------|
| **Email** | `admin@padel.com` |
| **Password** | `admin123` |
| **Role** | Admin |

Use this account to access the admin dashboard at http://localhost:5173/admin

### Customer Account (Optional)

| Field | Value |
|-------|-------|
| **Email** | `customer@padel.com` |
| **Password** | `123456` |
| **Role** | Customer |

> **Note:** Customers can complete bookings without logging in. Login is optional and pre-fills name, email, and phone on the booking form.

---

## Payment Integration (Thawani Sandbox)

The system supports two payment methods:

### 1. Pay at Venue (Cash)

- Selected during booking
- Payment record created with status `Pending`
- Automatically confirmed upon booking completion
- Customer pays cash at the venue

### 2. Thawani (Online — Sandbox)

Integration follows the [Thawani E-Commerce API](https://thawani-technologies.stoplight.io/docs/thawani-ecommerce-api/5534c91789a48-thawani-e-commerce-api).

**Flow:**

1. Customer selects Thawani as payment method
2. Backend creates a payment session via `POST /api/Payment`
3. Customer is redirected to the Thawani checkout URL
4. After payment, customer returns to `/payment/callback`
5. Booking status is updated to `Confirmed`

**Sandbox Configuration**

Edit `Backend/PadelBooking.API/appsettings.Development.json`:

```json
"Thawani": {
  "SecretKey": "YOUR_SANDBOX_SECRET_KEY",
  "PublishableKey": "YOUR_SANDBOX_PUBLISHABLE_KEY",
  "BaseUrl": "https://uatcheckout.thawani.om/api/v1",
  "SuccessUrl": "http://localhost:5173/payment/callback",
  "CancelUrl": "http://localhost:5173/booking"
}
```

> **Without API keys:** The system uses a mock redirect to the local callback page for development and testing.

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Court` | GET, POST, PUT, DELETE | Court management |
| `/api/CourtWorkingHour` | GET, POST, PUT, DELETE | Working hours |
| `/api/CourtClosure` | GET, POST, DELETE | Closures |
| `/api/CourtClosure/bulk` | POST | Bulk closure (date range) |
| `/api/Offer` | GET, POST, PUT, DELETE | Pricing offers |
| `/api/Booking` | GET, POST | List / create bookings |
| `/api/Booking/available` | GET | Available time slots |
| `/api/Booking/{id}/cancel` | PUT | Cancel booking |
| `/api/Payment` | GET, POST | Payment records |
| `/api/Payment/confirm/{id}` | PUT | Confirm payment |
| `/api/User/login` | POST | User login |
| `/api/User/register` | POST | User registration |

Full interactive documentation is available at **http://localhost:5104/swagger** when the backend is running.

---

## Notes and Limitations

### General

- This project was developed as a **university submission** and is intended for educational and demonstration purposes.
- The UI supports **Arabic (RTL)** layout.
- Both backend and frontend must be running simultaneously for full functionality.

### Security

- Passwords are stored in plain text in the demo database — **not suitable for production**.
- JWT authentication package is referenced but **admin routes are not protected** in the current version.
- Admin dashboard is accessible without login at `/admin`.

### Database

- Uses `EnsureCreated()` instead of EF Core migrations for simplicity.
- Schema updates for new columns are applied via startup patches.
- For production, migrate to SQL Server or PostgreSQL with proper migrations.

### Payment

- Thawani integration requires valid sandbox API keys for real gateway testing.
- Without keys, a **mock payment flow** redirects to the local callback page.
- No server-side webhook from Thawani is implemented; confirmation relies on the callback page.

### Booking

- Court assignment is random among available courts at booking time.
- No transaction locking for concurrent bookings (rare race condition possible under high load).
- `BookingStatus.Completed` is not set automatically after the session ends.

### Known Scope Boundaries

- No email/SMS booking confirmations
- No customer booking lookup by phone number (admin can filter by phone)
- No mobile native application

---

## Running the Complete System

**Terminal 1 — Backend:**

```powershell
cd Backend\PadelBooking.API
dotnet run
```

**Terminal 2 — Frontend:**

```powershell
cd Frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5104 |
| Swagger Docs | http://localhost:5104/swagger |
| Admin Dashboard | http://localhost:5173/admin |
| Booking Page | http://localhost:5173/booking |

---

## Author

University Project — Padel Booking System

---

*Last updated: August 2026*
