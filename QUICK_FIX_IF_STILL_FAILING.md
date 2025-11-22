# Quick Fixes if 502/504 Errors Persist

## Immediate Actions

### 1. Check Railway Logs
Go to Railway dashboard → Your service → Logs
Look for:
- Server startup errors
- Timeout messages
- Slow request warnings (now logged automatically)

### 2. Test Health Check
```bash
curl https://your-api.railway.app/health
```
Should respond in < 100ms. If slow, there's a startup issue.

### 3. Create Database Indexes
Run this to improve query performance:
```bash
cd backend
node scripts/create-indexes.js
```

Or manually in MongoDB:
```javascript
// Payment indexes
db.payments.createIndex({ salonId: 1, status: 1, paidAt: -1 });
db.payments.createIndex({ salonId: 1, status: 1 });

// Appointment indexes  
db.appointments.createIndex({ salonId: 1, status: 1, dateTime: -1 });
db.appointments.createIndex({ salonId: 1, workerId: 1, status: 1 });

// User indexes
db.users.createIndex({ salonId: 1, role: 1 });
db.users.createIndex({ email: 1 });

// Subscription indexes
db.subscriptions.createIndex({ salonId: 1 });
db.subscriptions.createIndex({ status: 1 });
```

### 4. Check Slow Request Logs
The server now automatically logs requests taking > 2 seconds.
Look in Railway logs for: `⚠️ Slow request: ...`

### 5. Verify Environment Variables
In Railway dashboard, check:
- ✅ `MONGODB_URI` - Must be valid
- ✅ `JWT_SECRET` - Must be set
- ✅ `PORT` - Auto-set by Railway
- ✅ `NODE_ENV` - Should be 'production'

### 6. Test Specific Endpoints
If specific endpoints timeout:
- `/api/analytics/dashboard` - Should be fast now ✅
- `/api/super-admin/salons` - Should be fast now ✅
- `/api/reports/*` - May need optimization

### 7. Railway Health Check
The health check is now at `/health` with 5s timeout.
If this times out, the server isn't starting properly.

## Common Issues & Solutions

### Issue: Health Check Times Out
**Solution:** Check server logs for startup errors. The server might be crashing.

### Issue: Specific Endpoints Timeout
**Solution:** Check logs for "Slow request" warnings. Optimize those endpoints.

### Issue: All Requests Timeout
**Solution:** 
1. Check MongoDB connection
2. Verify MONGODB_URI is correct
3. Check Railway resource limits (CPU/Memory)

### Issue: Intermittent Timeouts
**Solution:**
1. Create database indexes (see above)
2. Check connection pool settings
3. Monitor Railway metrics

## Emergency Rollback
If needed, revert to previous commit:
```bash
git log --oneline  # Find previous working commit
git revert HEAD
git push
```

## Next Steps if Still Failing
1. Check Railway metrics (CPU, Memory, Response Time)
2. Review slow request logs
3. Test endpoints individually
4. Consider upgrading Railway plan
5. Contact Railway support with logs

