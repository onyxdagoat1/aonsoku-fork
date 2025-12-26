# Aonsoku Auth Service

Authentication service for aonsoku that handles user registration by creating accounts directly in Navidrome.

## Features

- **User Registration**: Creates new users in Navidrome backend
- **Admin Authentication**: Uses Navidrome admin credentials to create users
- **Validation**: Username and password validation before account creation
- **Error Handling**: Proper error messages for duplicate users and connection issues

## How It Works

1. Frontend sends registration request with username, password, and email
2. Auth service validates the input data
3. Authenticates with Navidrome as admin user
4. Creates new user account via Navidrome's API
5. Returns success/error to frontend

## API Endpoints

### POST `/api/auth/register`

Create a new user account in Navidrome.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "securepassword",
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details"
}
```

### GET `/api/health`

Check if the auth service is running.

**Response:**
```json
{
  "status": "ok",
  "service": "aonsoku-auth-service",
  "version": "1.0.0",
  "navidromeUrl": "http://localhost:4533"
}
```

### GET `/api/test-navidrome`

Test connection to Navidrome server.

**Response:**
```json
{
  "success": true,
  "navidrome": { ... }
}
```

## Configuration

The service reads configuration from the root `.env` file via `.env.loader.cjs`.

**Required Environment Variables:**
- `NAVIDROME_URL` - URL of Navidrome server
- `NAVIDROME_USERNAME` - Admin username for Navidrome
- `NAVIDROME_PASSWORD` - Admin password for Navidrome
- `AUTH_PORT` - Port for auth service (default: 3005)
- `AUTH_FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Running the Service

### Development

```bash
# Install dependencies first
cd auth-service
npm install

# Run individually
npm run dev

# Or run with all services from root
cd ..
npm run dev
```

The service will start on port 3005 (or `AUTH_PORT` from .env).

### Production

```bash
cd auth-service
npm start
```

## Port Configuration

| Service | Port | Color |
|---------|------|-------|
| Main App | 3000 | Blue |
| Tag Writer | 3001 | Yellow |
| Upload | 3002 | Green |
| **Auth** | **3005** | **Magenta** |

## Security Notes

1. **Admin Credentials**: The service requires Navidrome admin credentials to create users
2. **CORS**: Only allows requests from configured frontend URL
3. **Validation**: Username must be 3+ characters, password 8+ characters
4. **Error Handling**: Doesn't expose sensitive information in error messages

## Troubleshooting

### "Cannot connect to auth service"

**Problem**: Frontend can't reach the auth service.

**Solution**:
1. Make sure auth service is running: `npm run dev:auth`
2. Check the port is 3005: `lsof -i :3005` (Mac/Linux) or `netstat -ano | findstr :3005` (Windows)
3. Verify `VITE_ACCOUNT_API_URL` in root `.env` is set to `http://localhost:3005/api`

### "Failed to authenticate with Navidrome as admin"

**Problem**: Can't log in to Navidrome as admin.

**Solution**:
1. Check `NAVIDROME_URL` is correct
2. Verify `NAVIDROME_USERNAME` and `NAVIDROME_PASSWORD` are correct
3. Make sure Navidrome is running
4. Test with: `curl http://localhost:3005/api/test-navidrome`

### "Username already exists"

**Problem**: User tried to register with existing username.

**Solution**: This is expected behavior. User should choose a different username.

### "Failed to obtain admin token"

**Problem**: Couldn't get authentication token from Navidrome.

**Solution**:
1. Check Navidrome logs for errors
2. Verify admin account has proper permissions
3. Test Navidrome API manually: `curl -X POST http://localhost:4533/auth/login -d '{"username":"admin","password":"yourpassword"}' -H "Content-Type: application/json"`

## Integration with Frontend

The `RegisterPage.tsx` component automatically connects to this service:

```typescript
const AUTH_API_URL = import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api';
const REGISTRATION_API = `${AUTH_API_URL}/auth/register`;
```

Make sure `VITE_ACCOUNT_API_URL` is set in your root `.env` file.

## Development Tips

1. **Console Logs**: The service logs all registration attempts and errors
2. **Test Endpoint**: Use `/api/test-navidrome` to verify connection
3. **Health Check**: Use `/api/health` to check service status
4. **CORS Issues**: Add your dev server URL to `AUTH_FRONTEND_URL` if running on different port

## Dependencies

- `express` - Web framework
- `cors` - CORS middleware
- `axios` - HTTP client for Navidrome API
- `dotenv` - Environment variable loader
