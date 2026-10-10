# Developer Guide & Local Setup: Cafe Olive

This document details how to configure, run, compile, and debug the Cafe Olive application locally.

---

## 1. Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)
- **MongoDB** (local database instance or a MongoDB Atlas connection string)

---

## 2. Repository Configuration

The workspace is divided into two separate directories: `/backend` and `/frontend`.

### A. Backend Setup
1. Open a terminal and navigate to the backend directory:
   `cd backend`
2. Install dependencies:
   `npm install`
3. Create a `.env` file in the root of the `/backend` directory:
   `touch .env`
4. Configure the environment variables based on the template below:

```ini
PORT=3000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.qknp4bp.mongodb.net
CORS_ORIGIN=*

# JWT configuration
ACCESS_TOKEN_SECRET=<your_access_secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your_refresh_secret>
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# Razorpay credentials (use dummy values for mock mode)
RAZORPAY_KEY_ID=rzp_test_<key_id>
RAZORPAY_KEY_SECRET=<key_secret>
```

### B. Frontend Setup
1. Open a terminal and navigate to the frontend directory:
   `cd ../frontend`
2. Install dependencies:
   `npm install`
3. The Vite development server has a proxy pre-configured in [`vite.config.js`](file:///e:/CAFEOLIVE/frontend/vite.config.js):
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false,
       }
     }
   }
   ```
   All `/api/*` frontend calls automatically forward to the backend server at port 3000.

---

## 3. Running Dev Servers

Run both servers concurrently to view and test changes:

- **Launch Backend**:
  ```bash
  cd backend
  npm run dev
  ```
  *Launches nodemon watching backend source files at `http://localhost:3000`.*

- **Launch Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
  *Launches Vite hot-reloading dev server at `http://localhost:5174` (or `http://localhost:5173`).*

---

## 4. Production Build

Verify compilation of all React assets:
```bash
cd frontend
npm run build
```
The compiled production bundle will compile into the `/frontend/dist` directory.
