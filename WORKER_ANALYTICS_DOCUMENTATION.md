# Worker Analytics & Time Tracking System 📊⏱️

## Overview
Comprehensive analytics system for salon owners to track worker hours, breaks, availability patterns, and productivity in real-time.

---

## Key Changes

### ❌ **Removed Automatic Availability**
- Workers NO LONGER automatically set as available
- Workers start with status: **OFFLINE** 🔴
- Workers must manually:
  1. Set their weekly schedule (in "My Availability")
  2. Toggle status to "Available" when starting work

### ✅ **Added Complete Analytics Tracking**
- Every status change is logged
- Tracks time spent in each status
- Calculates daily working hours
- Shows break patterns
- Provides performance insights

---

## Features for Owners 👔

### 1. **Worker Analytics Dashboard** (`/owner/worker-analytics`)

#### Overview Stats (Top Cards):
- 👥 **Total Workers** - Number of workers in salon
- 🟢 **Available Now** - Workers currently available
- 🟠 **On Break** - Workers currently on break
- 🔴 **Offline** - Workers currently offline

#### Workers Performance List:
- Click any worker to see detailed analytics
- Shows:
  - Current status (Available/On Break/Offline)
  - Total hours worked in period
  - Total break time
  - Quick insights

#### Individual Worker Details:
- **Total Hours Worked** - Sum of all working time
- **Days Worked** - Number of days with any work
- **Average Hours/Day** - Average working hours
- **Total Break Time** - Sum of all breaks

#### Daily Breakdown Table:
- Date of work
- Hours worked that day
- Break time that day
- First available time (clock-in)
- Last offline time (clock-out)
- Number of status changes

### 2. **Date Range Filters**
- Custom date range picker
- Quick filters:
  - Last 7 Days
  - Last 30 Days
- Real-time data updates

---

## How It Works

### Status Tracking Flow

```
1. Worker toggles status (Available/On Break/Offline)
   ↓
2. System records:
   - Previous status
   - New status
   - Time in previous status (duration)
   - Timestamp of change
   - Date
   ↓
3. Creates WorkerStatusLog entry
   ↓
4. Updates worker's current status
   ↓
5. Owner can view in analytics
```

### Daily Hours Calculation

```
Example Day:
09:00 AM - Set to Available  (offline → available)
12:00 PM - Set to On Break   (available → on_break) = 3h work
12:30 PM - Set to Available  (on_break → available) = 0.5h break
05:00 PM - Set to Offline    (available → offline) = 5h work

Total Working: 8 hours
Total Break: 0.5 hours
First Available: 09:00 AM
Last Offline: 05:00 PM
```

---

## Database Models

### WorkerStatusLog
Tracks every status change:
```javascript
{
  workerId: ObjectId,
  salonId: ObjectId,
  previousStatus: 'available' | 'on_break' | 'offline',
  newStatus: 'available' | 'on_break' | 'offline',
  changedAt: Date,
  durationInPreviousStatus: Number, // in minutes
  date: Date // for daily queries
}
```

### User Model - Updated Fields
```javascript
{
  currentStatus: {
    type: String,
    default: 'offline' // ✅ Changed from 'available'
  },
  lastStatusChange: Date
}
```

---

## API Endpoints

### GET /api/worker-status/analytics/salon
Get salon-wide analytics

**Query Parameters:**
- `startDate` - Start of period (default: 7 days ago)
- `endDate` - End of period (default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-11-03",
      "endDate": "2025-11-10"
    },
    "totalWorkers": 5,
    "workersCurrentlyAvailable": 3,
    "workersOnBreak": 1,
    "workersOffline": 1,
    "workerStats": [
      {
        "workerId": "...",
        "name": "John Doe",
        "currentStatus": "available",
        "totalWorkingHours": "42.50",
        "totalBreakHours": "3.50",
        "daysWorked": 6
      }
    ]
  }
}
```

### GET /api/worker-status/analytics/worker/:workerId
Get detailed analytics for specific worker

**Query Parameters:**
- `startDate` - Start of period (default: 30 days ago)
- `endDate` - End of period (default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "worker": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "/uploads/..."
    },
    "period": {
      "startDate": "2025-10-11",
      "endDate": "2025-11-10"
    },
    "totalStats": {
      "totalWorkingHours": 168.5,
      "totalBreakHours": 14.0,
      "totalDaysWorked": 22,
      "averageWorkingHoursPerDay": 7.66,
      "averageBreakTime": 0.64
    },
    "dailyStats": [
      {
        "date": "2025-11-10",
        "totalWorkingMinutes": 480,
        "totalBreakMinutes": 60,
        "statusChanges": 5,
        "firstAvailable": "2025-11-10T09:00:00Z",
        "lastOffline": "2025-11-10T18:00:00Z"
      }
    ]
  }
}
```

---

## Frontend Implementation

### Worker Analytics Page
**Route**: `/owner/worker-analytics`

#### Page Sections:

**1. Date Range Filters**
- Start date picker
- End date picker
- Quick filter buttons (Last 7 Days, Last 30 Days)

**2. Overview Cards** (Top Row)
- Total Workers count
- Currently Available count (green)
- On Break count (orange)
- Offline count (red)

**3. Workers Performance List** (Left Side)
- Clickable worker cards
- Shows current status with colored badge
- Total hours worked
- Total break time
- Selected worker highlighted

**4. Worker Details Panel** (Right Side)
- Worker info (name, email, avatar)
- Summary cards:
  - Total Hours (green)
  - Days Worked (blue)
  - Average Hours/Day (purple)
  - Break Time (orange)
- Daily Breakdown:
  - Date of work
  - Hours worked
  - Break time
  - Clock-in time (first available)
  - Clock-out time (last offline)
  - Status changes count

---

## Usage Instructions

### For Owners:

#### View Worker Analytics:
1. Navigate to **Worker Analytics** in sidebar (NEW)
2. See real-time overview of all workers
3. Select date range (default: last 7 days)
4. Click on any worker to see detailed breakdown
5. View daily working hours and patterns

#### Track Worker Hours:
- See who's working most hours
- Identify excessive break times
- Monitor clock-in/clock-out times
- Track days worked per week/month
- Calculate average hours per day

#### Use Cases:
- **Payroll**: Calculate hours for payment
- **Performance**: See who's most productive
- **Scheduling**: Identify availability patterns
- **Compliance**: Track working hours limits
- **Planning**: Optimize staffing based on data

### For Workers:

#### Set Status Correctly:
1. **Starting Work**: Click status → "Available" 🟢
2. **Coffee Break**: Click status → "On Break" ☕
3. **Back from Break**: Click status → "Available" 🟢
4. **Lunch Time**: Click status → "On Break" 🍽️
5. **End of Day**: Click status → "Offline" 🔴
6. **Leaving Early**: Click status → "Offline" 🏠

#### Important:
- ⚠️ Status changes are tracked and visible to owner
- ⚠️ Accurate status = accurate analytics
- ⚠️ Offline status hides you from booking

---

## Analytics Metrics Explained

### Total Working Hours
Sum of all time spent in "Available" status

### Total Break Hours
Sum of all time spent in "On Break" status

### Days Worked
Number of unique days with at least 1 minute of work

### Average Hours Per Day
Total Working Hours ÷ Days Worked

### Average Break Time
Total Break Hours ÷ Days Worked

### Status Changes
Number of times worker changed status in a day
- High number may indicate frequent interruptions
- Low number indicates steady work pattern

### First Available
Time when worker first set status to "Available" for the day
- Tracks punctuality
- Shows start of shift

### Last Offline
Time when worker last set status to "Offline" for the day
- Tracks end of shift
- Shows total time at work

---

## Real-World Examples

### Example 1: Full Day Worker
```
Date: 2025-11-10

09:00 AM - Offline → Available   (Start work)
12:00 PM - Available → On Break  (3h worked)
12:30 PM - On Break → Available  (30min break)
03:00 PM - Available → On Break  (2.5h worked)
03:15 PM - On Break → Available  (15min break)
06:00 PM - Available → Offline   (2.75h worked)

Analytics:
- Total Work: 8.25 hours
- Total Breaks: 0.75 hours
- Status Changes: 6
- First Available: 09:00 AM
- Last Offline: 06:00 PM
```

### Example 2: Split Shift Worker
```
Date: 2025-11-10

10:00 AM - Offline → Available   (Start morning shift)
02:00 PM - Available → Offline   (4h worked, leave)
06:00 PM - Offline → Available   (Start evening shift)
10:00 PM - Available → Offline   (4h worked)

Analytics:
- Total Work: 8 hours
- Total Breaks: 0 hours
- Status Changes: 4
- First Available: 10:00 AM
- Last Offline: 10:00 PM
```

### Example 3: Short Day
```
Date: 2025-11-10

09:00 AM - Offline → Available   (Start work)
11:00 AM - Available → On Break  (2h worked)
11:15 AM - On Break → Available  (15min break)
01:00 PM - Available → Offline   (1.75h worked, leave early)

Analytics:
- Total Work: 3.75 hours
- Total Breaks: 0.25 hours
- Status Changes: 4
- First Available: 09:00 AM
- Last Offline: 01:00 PM
```

---

## Reports & Exports (Future)

### Planned Features:
- [ ] Export to Excel/CSV
- [ ] PDF reports
- [ ] Monthly summaries
- [ ] Comparison charts
- [ ] Attendance reports
- [ ] Overtime calculations
- [ ] Break compliance monitoring

---

## Security & Privacy

- ✅ Only owners can view analytics
- ✅ Workers cannot see other workers' data
- ✅ Data is salon-specific
- ✅ Timestamps are accurate and tamper-proof
- ✅ All queries are authorized

---

## Performance Optimizations

- **Indexed Database Queries** - Fast lookups
- **Date-based Partitioning** - Efficient daily queries
- **Aggregation** - Server-side calculations
- **Lazy Loading** - Worker details load on-demand
- **Caching** - Reduces redundant API calls

---

## Testing Checklist

### Owner Tests:
- ✅ View worker analytics page
- ✅ See overview stats
- ✅ Click on worker to view details
- ✅ Change date range
- ✅ Verify hours calculated correctly
- ✅ Check daily breakdown
- ✅ Verify status badges display correctly

### Worker Tests:
- ✅ Start as "Offline" on login
- ✅ Toggle to "Available" to start work
- ✅ Toggle to "On Break" for breaks
- ✅ Toggle back to "Available"
- ✅ Toggle to "Offline" at end of day
- ✅ Verify each change is logged
- ✅ Check status persists after page refresh

### System Tests:
- ✅ Status logs created correctly
- ✅ Duration calculated accurately
- ✅ Daily stats aggregated properly
- ✅ No data leaks between salons
- ✅ Analytics update in real-time

---

## Usage Best Practices

### For Workers:
✅ **Always set status accurately**
✅ **Toggle to "Available" when starting work**
✅ **Use "On Break" for coffee/lunch (not offline)**
✅ **Toggle to "Offline" when leaving**
❌ **Don't forget to change status**
❌ **Don't stay "Available" when not working**

### For Owners:
✅ **Check analytics regularly**
✅ **Identify patterns in working hours**
✅ **Address excessive breaks**
✅ **Recognize hardworking employees**
✅ **Use data for fair payroll**
✅ **Plan schedules based on data**

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Version**: 1.0.0
**Date**: November 10, 2025

**Key Features:**
- ❌ No automatic availability
- 🔴 Workers start offline
- 📊 Complete time tracking
- ⏱️ Daily hours calculation
- ☕ Break time monitoring
- 📈 Real-time analytics
- 📅 Daily breakdown
- 🎯 Performance insights

