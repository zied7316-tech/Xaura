# Appointment Booking System with Worker Availability 📅

## Overview
Complete appointment booking system that allows workers to set their availability and clients to book appointments based on available time slots.

## Features

### For Workers 👨‍💼
- **Set Availability**: Configure working hours for each day of the week
- **Multiple Time Slots**: Add multiple time slots per day (e.g., morning and evening shifts)
- **Toggle Days**: Easily enable/disable availability for specific days
- **Flexible Schedule**: Different hours for different days
- **Auto-Created**: Default 9AM-5PM schedule created automatically

### For Clients 👥
- **View Available Workers**: See which workers can provide the service
- **Select Worker**: Choose preferred worker for the appointment
- **See Available Slots**: View all available time slots
- **Real-time Checking**: System prevents double-booking automatically
- **Service-Based Filtering**: Only shows workers who can provide selected service

---

## Backend Implementation

### 1. Worker Availability Model (`WorkerAvailability.js`)

```javascript
{
  workerId: ObjectId,
  salonId: ObjectId,
  weeklySchedule: {
    monday: {
      isAvailable: Boolean,
      slots: [{ start: "09:00", end: "17:00" }]
    },
    // ... other days
  },
  dateOverrides: [
    {
      date: Date,
      isAvailable: Boolean,
      slots: [{ start, end }],
      reason: String // e.g., "Holiday", "Sick leave"
    }
  ],
  defaultHours: {
    start: "09:00",
    end: "17:00"
  }
}
```

### 2. API Endpoints

#### Worker Endpoints

**GET /api/availability/my-schedule**
- Get current worker's availability
- Auto-creates default schedule if doesn't exist
- Private (Worker only)

**PUT /api/availability/my-schedule**
- Update worker's availability
- Body:
```json
{
  "weeklySchedule": {
    "monday": {
      "isAvailable": true,
      "slots": [
        { "start": "09:00", "end": "12:00" },
        { "start": "14:00", "end": "18:00" }
      ]
    }
  },
  "defaultHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

#### Public/Client Endpoints

**GET /api/availability/salon/:salonId/workers**
- Get available workers for a salon
- Query params:
  - `date` - Check availability for specific date
  - `serviceId` - Filter by workers who can provide service
- Returns workers with availability status

**GET /api/availability/worker/:workerId/slots**
- Get available time slots for a worker
- Query params:
  - `date` (required) - Date to check
  - `serviceId` - Service duration for slot calculation
- Returns array of available time slots
- Automatically checks for conflicts with existing appointments

---

## Frontend Implementation

### Worker Availability Page (`WorkerAvailabilityPage.jsx`)
**Route**: `/worker/availability`

#### Features:
- **Day-by-Day Configuration**:
  - Toggle each day on/off
  - Visual indicators (green = available, gray = not available)
  - Multiple time slots per day

- **Time Slot Management**:
  - Add multiple time slots per day
  - Remove unwanted slots
  - Time picker inputs for start/end times
  - Minimum one slot per available day

- **Save Changes**:
  - Single save button updates all days
  - Toast notifications for success/error
  - Auto-loads existing schedule

#### UI Components:
- Toggle buttons for each day
- Time inputs for start/end
- Add/Remove buttons for time slots
- Save button with loading state

---

## How It Works

### Worker Sets Availability
```
1. Worker logs in
   ↓
2. Goes to "My Availability"
   ↓
3. System loads or creates default schedule
   ↓
4. Worker toggles days on/off
   ↓
5. Sets specific time slots for each day
   ↓
6. Clicks "Save Changes"
   ↓
7. Availability stored in database
```

### Client Books Appointment
```
1. Client searches for salon
   ↓
2. Views salon services
   ↓
3. Clicks "Book Now" on a service
   ↓
4. Selects date
   ↓
5. System fetches available workers for that date
   ↓
6. Client selects worker
   ↓
7. System shows available time slots
   ↓
8. Client selects time slot
   ↓
9. System checks for conflicts
   ↓
10. Appointment created if no conflicts
```

### Conflict Detection
```javascript
// System checks:
1. Is worker available on that day?
2. Is worker available at that time?
3. Does worker have existing appointment at that time?
4. Does time slot fit within worker's availability?

// If ALL checks pass → Appointment allowed
// If ANY check fails → Show error or disable slot
```

---

## Time Slot Generation Algorithm

### Input:
- Worker's availability (e.g., 9:00-17:00)
- Service duration (e.g., 60 minutes)
- Slot interval (30 minutes)

### Process:
```javascript
start = "09:00"
end = "17:00"
serviceDuration = 60 // minutes
interval = 30 // minutes

slots = []
currentTime = start

while (currentTime + serviceDuration <= end) {
  slotEnd = currentTime + serviceDuration
  
  if (no conflict with existing appointments) {
    slots.push({
      start: currentTime,
      end: slotEnd,
      available: true
    })
  }
  
  currentTime = currentTime + interval
}

return slots
```

### Example Output:
```json
[
  { "start": "09:00", "end": "10:00", "available": true },
  { "start": "09:30", "end": "10:30", "available": true },
  { "start": "10:00", "end": "11:00", "available": false }, // Has appointment
  { "start": "10:30", "end": "11:30", "available": true },
  // ... more slots
]
```

---

## Default Schedule

When a worker first accesses availability, the system creates:

```javascript
{
  monday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
  tuesday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
  wednesday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
  thursday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
  friday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
  saturday: { isAvailable: false, slots: [] },
  sunday: { isAvailable: false, slots: [] }
}
```

Workers can then modify this to match their actual schedule.

---

## Special Features

### 1. Multiple Time Slots Per Day
Workers can have split shifts:
```json
{
  "monday": {
    "isAvailable": true,
    "slots": [
      { "start": "09:00", "end": "12:00" }, // Morning shift
      { "start": "14:00", "end": "18:00" }  // Afternoon shift
    ]
  }
}
```

### 2. Date Overrides (Future Enhancement)
For holidays, vacations, sick days:
```json
{
  "dateOverrides": [
    {
      "date": "2025-12-25",
      "isAvailable": false,
      "reason": "Christmas Holiday"
    },
    {
      "date": "2025-11-15",
      "isAvailable": true,
      "slots": [{ "start": "10:00", "end": "14:00" }],
      "reason": "Special hours"
    }
  ]
}
```

### 3. Service-Based Worker Filtering
- If service has `assignmentType: "specific_workers"`, only those workers shown
- If service has `assignmentType: "owner_only"`, no workers shown (owner handles)
- If service has `assignmentType: "general"`, all workers shown

---

## Usage Instructions

### For Workers:

#### Set Your Availability:
1. Login to worker account
2. Click **"My Availability"** in sidebar (NEW badge)
3. See your weekly schedule
4. Toggle days on/off:
   - Green = Available
   - Gray = Not Available
5. For available days, set time slots:
   - Click time inputs to change hours
   - Add multiple slots with "+ Add Time Slot"
   - Remove slots with "Remove" button
6. Click **"Save Availability"** at top or bottom
7. Confirmation toast appears

#### Tips:
- Set realistic hours you can work
- Account for breaks between slots
- Update regularly if schedule changes
- Clients can only book during your available times

### For Clients:

#### Book an Appointment:
1. Search for salons
2. View salon details
3. Click "Book Now" on desired service
4. Select preferred date
5. Choose from available workers
6. Select available time slot
7. Confirm booking

---

## Database Queries

### Get Worker Availability
```javascript
const availability = await WorkerAvailability.findOne({ 
  workerId: "worker123" 
})
```

### Get Available Workers for Date
```javascript
const workers = await User.find({
  salonId: "salon123",
  role: "Worker",
  isActive: true
})

// Then check each worker's availability for the date
```

### Check Appointment Conflicts
```javascript
const appointments = await Appointment.find({
  workerId: "worker123",
  startTime: {
    $gte: startOfDay,
    $lte: endOfDay
  },
  status: { $in: ['Pending', 'Confirmed'] }
})

// Then check for time overlaps
```

---

## Error Handling

### Worker Availability:
- ✅ Creates default schedule if none exists
- ✅ Validates time format (HH:MM)
- ✅ Ensures end time is after start time
- ✅ Prevents saving empty slots for available days

### Booking:
- ✅ Checks worker availability before showing slots
- ✅ Prevents double-booking automatically
- ✅ Shows only available workers
- ✅ Validates time slot selection

---

## Testing Checklist

### Worker Tests:
- ✅ Load availability page
- ✅ Default schedule created automatically
- ✅ Toggle days on/off
- ✅ Add multiple time slots
- ✅ Remove time slots
- ✅ Save changes
- ✅ Reload and verify persistence

### Client Tests:
- ✅ View available workers
- ✅ See only workers available on selected date
- ✅ View time slots for selected worker
- ✅ Book appointment in available slot
- ✅ Cannot book in unavailable slot
- ✅ Cannot double-book same time

---

## Future Enhancements
- [ ] Recurring time-off (vacations)
- [ ] Bulk schedule updates
- [ ] Copy schedule from one day to another
- [ ] Template schedules
- [ ] Break time management
- [ ] Buffer time between appointments
- [ ] Calendar view of availability
- [ ] Mobile app schedule sync
- [ ] Email notifications for schedule changes
- [ ] Integration with external calendars

---

## API Response Examples

### Get Worker's Availability
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "workerId": "...",
    "salonId": "...",
    "weeklySchedule": {
      "monday": {
        "isAvailable": true,
        "slots": [
          { "start": "09:00", "end": "17:00" }
        ]
      }
    },
    "defaultHours": {
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

### Get Available Time Slots
```json
{
  "success": true,
  "data": [
    { "start": "09:00", "end": "10:00", "available": true },
    { "start": "09:30", "end": "10:30", "available": true },
    { "start": "10:00", "end": "11:00", "available": true }
  ]
}
```

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Version**: 1.0.0
**Date**: November 10, 2025

