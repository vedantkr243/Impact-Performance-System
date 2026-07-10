# Draw System Implementation - Complete Guide

## ✅ What's Been Implemented

### 1. **Synchronized Countdown Timer**
- **How it works**: All users see the exact same countdown from the server's draw end time
- **Updated every**: 1 second
- **Used in**: DrawsPage & DashboardPage

### 2. **Toast Notifications on Draw End**
- **For Regular Users**: 
  - Message: "🎉 Draw has ended! Results will be announced shortly."
  - Shows for 5 seconds at top center
  
- **For Admins (Extra)**: 
  - Message: "🔐 ADMIN: Draw ended. Random Number: [XXXXX]"
  - Shows for 10 seconds at top right

### 3. **Admin-Only Random Number**
- **Generated**: When draw starts (random 0-999999)
- **Visible**: Only to admins in yellow highlighted box
- **Cannot be accessed**: By regular users (filtered at API level)

## 📋 Testing Checklist

### Basic Functionality
- [ ] Visit Draws page - countdown displays and updates
- [ ] Visit Dashboard - countdown displays and updates  
- [ ] Both pages show same countdown
- [ ] Countdown is in format: DD:HH:MM:SS

### Admin Features (Login as Admin)
- [ ] Admin sees yellow box with random number
- [ ] Random number is visible and readable
- [ ] Regular users cannot see this box

### Toast Notifications
- [ ] Wait for draw to end OR modify draw date to test
- [ ] When countdown reaches 0:
  - [ ] General toast appears for all users
  - [ ] Admin sees additional admin-only toast with number
  - [ ] Toasts dismiss automatically after timeout
  - [ ] Toasts are clickable to dismiss manually

### Edge Cases
- [ ] Navigate to different pages - countdown still synced
- [ ] Refresh page - countdown still synced
- [ ] Multiple browser tabs - all show same countdown
- [ ] Console has no errors

## 🔧 How to Test with Different Draw Times

Edit draw end date in seed data to test:

**File**: `server/modules/data/seed.js`

```javascript
// Change this line:
drawDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)  // 5 days from now

// To test immediately:
drawDate: new Date(Date.now() + 30 * 1000)  // 30 seconds from now
```

Then restart server to apply changes.

## 📁 Modified Files Reference

### Backend
1. **server/modules/data/models/draw.model.js**
   - Added `randomNumber` field

2. **server/services/draw-test.service.js**
   - Generate random number on draw start
   - Export serializeDraw function

3. **server/controllers/draw.controller.js**
   - Filter randomNumber for non-admin users

### Frontend  
1. **src/hooks/useDrawCountdown.js** (NEW)
   - Synchronized countdown hook

2. **src/pages/DrawsPage.jsx**
   - Use countdown hook
   - Toast on expiration
   - Admin random display

3. **src/pages/DashboardPage.jsx**
   - Use countdown hook
   - Toast + auto-rotate to next draw

4. **src/App.jsx**
   - Added ToastContainer

## 🎯 Key Implementation Details

### Countdown Sync Algorithm
```
1. Server sends draw.endsAt (ISO date string)
2. Hook receives endsAt as prop
3. Every second:
   - Calculate: difference = new Date(endsAt) - Date.now()
   - Convert to days, hours, minutes, seconds
   - Update UI
4. When difference <= 0:
   - Set isExpired = true
   - Trigger toast notification
```

### Admin Check
```
Backend: req.user?.role === "admin"
Frontend: auth?.user?.role === "admin"
```

### Toast Flow
```
Countdown expires (isExpired = true)
  ↓
useEffect triggered
  ↓
Show main toast to all users
  ↓
Check if admin + has randomNumber
  ↓
Show additional admin toast
```

## 🚀 Features Summary

| Feature | Where | For Whom | Visible |
|---------|-------|---------|---------|
| Countdown | DrawsPage, Dashboard | All users | Everywhere on page |
| Toast Notification | Globally | All users | Center top |
| Admin Toast | Globally | Admins only | Right top |
| Random Number Box | DrawsPage hero | Admins only | Yellow box |
| Random Number | API response | Admins only | Only in admin requests |

## 📝 Notes

- Random number is generated fresh when draw starts
- All countdown times are synchronized to server time
- Toast library (react-toastify) is already installed as dependency
- No database migration needed - new field optional
- Works with both MongoDB and memory store

## 🔍 Debugging

If toasts don't appear:
1. Check ToastContainer in App.jsx
2. Verify react-toastify is imported
3. Check CSS import for ToastContainer

If countdown doesn't sync:
1. Verify useDrawCountdown hook is imported
2. Check endsAt prop is passed correctly
3. Open DevTools console for errors

If admin number not showing:
1. Login as admin user (role === "admin")
2. Check API response has randomNumber field
3. Verify hero?.randomNumber exists in state
