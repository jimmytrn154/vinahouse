# VinHousing API

RESTful API for the Off-Campus Housing Management System.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `env.template` to `.env`
   - Update the database credentials and JWT secret:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=VinHousing
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=3000
   ```

3. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (authenticated)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update own profile
- `PUT /api/users/:id/status` - Update user status (admin only)
- `GET /api/users/preferences/me` - Get user preferences
- `PUT /api/users/preferences/me` - Update user preferences

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (landlord/admin)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `PUT /api/properties/:id/rules` - Update house rules
- `POST /api/properties/:id/rooms` - Create room

### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get listing by ID
- `POST /api/listings` - Create listing (landlord/admin)
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Rental Requests
- `GET /api/rental-requests` - Get all rental requests
- `GET /api/rental-requests/:id` - Get rental request by ID
- `POST /api/rental-requests` - Create rental request (tenant)
- `PUT /api/rental-requests/:id/status` - Update request status

### Contracts
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts` - Create contract (landlord/admin)
- `PUT /api/contracts/:id` - Update contract
- `POST /api/contracts/:id/sign` - Sign contract

### Issues
- `GET /api/issues` - Get all issues
- `GET /api/issues/:id` - Get issue by ID
- `POST /api/issues` - Create issue report
- `PUT /api/issues/:id/status` - Update issue status
- `POST /api/issues/:id/attachments` - Add attachment

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/stats` - Get average rating stats
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create review

### Organizations
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `POST /api/organizations` - Create organization (admin only)
- `POST /api/organizations/affiliations` - Create user affiliation
- `PUT /api/organizations/affiliations/:user_id/:org_id` - Update affiliation status (admin only)

### Verifications
- `GET /api/verifications` - Get all verifications
- `GET /api/verifications/:id` - Get verification by ID
- `POST /api/verifications` - Create verification (admin only)
- `PUT /api/verifications/:id` - Update verification (admin only)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "1234567890",
    "role": "landlord"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "landlord@example.com",
    "password": "password123"
  }'
```

### Create Property (with token)
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "address": "123 Main St",
    "geo_lat": 21.0285,
    "geo_lng": 105.8542,
    "description": "Nice apartment"
  }'
```

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message"
}
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (RBAC)
- SQL injection prevention (prepared statements)
- Input validation with express-validator
- CORS configuration

