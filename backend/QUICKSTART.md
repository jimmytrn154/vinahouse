# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL 8.0 or higher
- Database created and schema loaded (from `/db/schema.sql` or `/db/VinHousingDDL.sql`)

## Setup Steps

1. **Navigate to API directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.template .env
   ```

4. **Edit `.env` file with your database credentials:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_password
   DB_NAME=VinHousing
   JWT_SECRET=change_this_to_a_random_secret_string
   PORT=3000
   CORS_ORIGIN=http://localhost:3001
   ```

5. **Start the server:**
   ```bash
   # Development mode (auto-reload on changes)
   npm run dev

   # Or production mode
   npm start
   ```

6. **Verify the API is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"OK","message":"VinHousing API is running"}`

## Testing the API

### 1. Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "tenant"
  }'
```

### 2. Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### 3. Get your profile (with token):
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a property (as landlord):
First, register/login as a landlord, then:
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "address": "123 Main Street",
    "geo_lat": 21.0285,
    "geo_lng": 105.8542,
    "description": "A nice apartment"
  }'
```

## Common Issues

### Database Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `VinHousing` exists
- Run the schema SQL file to create tables

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

### JWT Token Errors
- Make sure `JWT_SECRET` is set in `.env`
- Token expires after 7 days by default (configurable)

## Next Steps

- Connect your frontend to `http://localhost:3000/api`
- See `README.md` for full API documentation
- All endpoints require authentication except:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/properties` (public listings)
  - `GET /api/listings` (public listings)


