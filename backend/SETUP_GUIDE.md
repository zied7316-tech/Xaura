# Backend Setup Guide

## Quick Start Checklist

- [ ] Node.js installed (v16+)
- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Server running (`npm run dev`)
- [ ] API tested (Postman/Thunder Client)

## Detailed Setup Steps

### 1. Install Node.js

**Windows:**
- Download from https://nodejs.org/
- Run installer
- Verify: `node --version` and `npm --version`

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install MongoDB

**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Run installer
- Start MongoDB as Windows Service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Verify MongoDB is Running:**
```bash
mongosh
# You should see MongoDB shell prompt
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB ODM)
- jsonwebtoken (JWT auth)
- bcrypt (password hashing)
- qrcode (QR code generation)
- dotenv (environment variables)
- express-validator (input validation)
- cors (CORS handling)
- uuid (unique ID generation)
- nodemon (dev auto-reload)

### 4. Configure Environment Variables

Create `.env` file in the backend directory:

```bash
cp env.example .env
```

Edit `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/beauty-platform

# JWT Secret (CHANGE THIS!)
JWT_SECRET=my_super_secret_key_change_in_production_12345

# JWT Expiration
JWT_EXPIRES_IN=24h
```

**Important:** Change `JWT_SECRET` to a random string in production!

### 5. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

### 6. Test the API

**Option 1: Browser**
Visit: http://localhost:5000

You should see:
```json
{
  "success": true,
  "message": "Beauty Platform API is running",
  "version": "1.0.0"
}
```

**Option 2: cURL**
```bash
curl http://localhost:5000
```

**Option 3: Postman/Thunder Client**
- Import the API endpoints
- Start testing routes

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Make sure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB port:
   ```bash
   mongosh
   ```

3. Check MONGODB_URI in `.env`

### Issue: Port 5000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
1. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. Or change PORT in `.env`

### Issue: Module Not Found

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: JWT Secret Error

**Error:**
```
Error: secretOrPrivateKey must have a value
```

**Solution:**
Make sure `JWT_SECRET` is set in `.env` file

## Testing Workflow

### 1. Register Users

**Owner:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@salon.com",
    "password": "password123",
    "name": "Salon Owner",
    "phone": "+1234567890",
    "role": "Owner"
  }'
```

Save the token from response!

**Worker:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@salon.com",
    "password": "password123",
    "name": "Hair Stylist",
    "phone": "+1234567891",
    "role": "Worker"
  }'
```

**Client:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "password123",
    "name": "John Client",
    "phone": "+1234567892",
    "role": "Client"
  }'
```

### 2. Create Salon (Owner Token Required)

```bash
curl -X POST http://localhost:5000/api/salons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "name": "Elegant Beauty Salon",
    "phone": "+1234567890",
    "email": "info@elegantbeauty.com",
    "workingHours": {
      "monday": {"open": "09:00", "close": "18:00", "isClosed": false},
      "tuesday": {"open": "09:00", "close": "18:00", "isClosed": false},
      "wednesday": {"open": "09:00", "close": "18:00", "isClosed": false},
      "thursday": {"open": "09:00", "close": "18:00", "isClosed": false},
      "friday": {"open": "09:00", "close": "20:00", "isClosed": false},
      "saturday": {"open": "10:00", "close": "17:00", "isClosed": false},
      "sunday": {"open": "00:00", "close": "00:00", "isClosed": true}
    }
  }'
```

### 3. Add Worker to Salon

```bash
curl -X POST http://localhost:5000/api/salons/SALON_ID/workers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "email": "worker@salon.com"
  }'
```

### 4. Create Services

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "name": "Haircut & Styling",
    "description": "Professional haircut with styling",
    "duration": 60,
    "price": 50.00,
    "category": "Haircut",
    "salonId": "YOUR_SALON_ID"
  }'
```

### 5. Book Appointment (Client Token Required)

First, check available slots:
```bash
curl "http://localhost:5000/api/appointments/available-slots?workerId=WORKER_ID&serviceId=SERVICE_ID&date=2024-03-20"
```

Then book:
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -d '{
    "workerId": "WORKER_ID",
    "serviceId": "SERVICE_ID",
    "dateTime": "2024-03-20T14:00:00Z",
    "notes": "First time visit"
  }'
```

## Development Tips

### Auto-reload with Nodemon

The `npm run dev` command uses nodemon which automatically restarts the server when you make changes to the code.

### View Logs

All important operations are logged to the console. Watch for:
- MongoDB connection status
- Mock SMS/WhatsApp messages
- Error messages

### MongoDB GUI Tools

Install a MongoDB GUI for easier database management:
- **MongoDB Compass** (Official): https://www.mongodb.com/products/compass
- **Robo 3T**: https://robomongo.org/
- **Studio 3T**: https://studio3t.com/

### API Testing Tools

- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **Thunder Client** (VS Code extension)
- **REST Client** (VS Code extension)

## Next Steps

1. Test all API endpoints
2. Integrate with frontend (Phase 2)
3. Add real SMS/WhatsApp APIs
4. Deploy to production server

## Production Deployment

Before deploying to production:

1. **Update Environment Variables**
   - Use a strong JWT_SECRET (32+ random characters)
   - Set NODE_ENV=production
   - Use production MongoDB URI (MongoDB Atlas recommended)

2. **Security Considerations**
   - Enable HTTPS
   - Set up rate limiting
   - Add helmet.js for security headers
   - Enable CORS only for trusted domains
   - Use environment-specific configs

3. **Hosting Options**
   - **Backend**: Heroku, DigitalOcean, AWS, Google Cloud
   - **Database**: MongoDB Atlas (free tier available)

4. **Monitoring**
   - Set up error logging (Sentry, LogRocket)
   - Monitor server performance
   - Set up alerts for downtime

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [JWT Introduction](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)

---

**Happy Coding! 🚀**

