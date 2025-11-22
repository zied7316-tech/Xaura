# Troubleshooting 502/504 Timeout Errors

## If Issues Persist After Deployment

### Step 1: Check Railway Logs
```bash
# In Railway dashboard, check:
1. Deployment logs - Look for startup errors
2. Runtime logs - Look for timeout messages
3. Check if server is actually starting
```

### Step 2: Verify Health Check Endpoint
The health check at `/` should respond in < 1 second. If it's slow:
- Database connection might be hanging
- Route loading might be failing
- Check Railway logs for errors

### Step 3: Check for Slow Endpoints
Common slow endpoints that might cause timeouts:
- `/api/analytics/dashboard` - Now optimized ✅
- `/api/super-admin/salons` - Now optimized ✅
- `/api/reports/*` - May need optimization
- `/api/analytics/revenue-trends` - Now optimized ✅

### Step 4: Database Connection Issues
If MongoDB connection is slow:
1. Check `MONGODB_URI` in Railway environment variables
2. Verify connection string format
3. Check if MongoDB Atlas has IP whitelist restrictions
4. Consider connection timeout settings

### Step 5: Add Database Indexes
Missing indexes can cause slow queries. Add these:

```javascript
// In MongoDB or create migration script
db.payments.createIndex({ salonId: 1, status: 1, paidAt: 1 });
db.appointments.createIndex({ salonId: 1, status: 1, dateTime: 1 });
db.users.createIndex({ salonId: 1, role: 1 });
db.subscriptions.createIndex({ salonId: 1 });
db.salons.createIndex({ ownerId: 1 });
```

### Step 6: Railway-Specific Fixes

#### Option A: Increase Railway Timeout (if possible)
Check Railway plan limits - some plans have 30s hard limit.

#### Option B: Optimize Health Check
Make health check respond immediately without DB check:

```javascript
app.get('/', (req, res) => {
  // Fast response - no DB check
  res.json({
    success: true,
    message: 'Beauty Platform API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
```

#### Option C: Add Dedicated Health Check Route
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});
```

### Step 7: Additional Query Optimizations

If specific endpoints are still slow:

1. **Reports Controller** - May need aggregation optimization
2. **Customer CRM** - May need batch query optimization
3. **Search Routes** - May need pagination

### Step 8: Enable Request Logging
Add request timing middleware to identify slow endpoints:

```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});
```

### Step 9: Check for Memory Issues
If server is running out of memory:
- Reduce connection pool size
- Add pagination to all list endpoints
- Limit aggregation result sizes

### Step 10: Railway Environment Variables
Verify these are set correctly:
- `PORT` - Should be set automatically by Railway
- `MONGODB_URI` - Must be valid connection string
- `JWT_SECRET` - Required for auth
- `NODE_ENV` - Should be 'production' on Railway

## Quick Fixes to Apply

### Fix 1: Faster Health Check
Already implemented in server.js ✅

### Fix 2: Request Timeout Middleware
Already implemented ✅

### Fix 3: Database Connection Pool
Already implemented ✅

### Fix 4: Query Optimizations
Already implemented for analytics and superAdmin ✅

## If Still Failing

1. **Check Railway Metrics:**
   - CPU usage
   - Memory usage
   - Response times

2. **Test Locally:**
   - Run server locally with same env vars
   - Test endpoints that are timing out
   - Check if issue is Railway-specific

3. **Contact Railway Support:**
   - If timeout is consistently 30s, it's Railway's limit
   - May need to upgrade plan or use different deployment strategy

4. **Alternative Solutions:**
   - Move heavy operations to background jobs
   - Implement caching for slow queries
   - Use CDN for static assets
   - Consider serverless functions for heavy operations

## Monitoring Script

Add this to monitor slow requests:

```javascript
// Add to server.js after routes
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.error(`🐌 SLOW REQUEST: ${req.method} ${req.path} - ${duration}ms`);
    }
    originalEnd.apply(this, args);
  };
  next();
});
```

