# Getting Started with SalesIQ

Welcome! This guide will help you get started with SalesIQ in minutes.

---

## ⚡ Quick Start (5 Minutes)

### 1️⃣ Try the Demo First

No setup needed! See what SalesIQ can do:

**Demo Account:**
```
Email: admin@salesiq.com
Password: password
```

👉 [Open SalesIQ Demo](http://localhost:3000) (after running locally)

---

### 2️⃣ Set Up Locally (2 Steps)

#### Windows Users
```bash
# Just run this one file in the project folder
setup.bat
```

#### Mac/Linux Users
```bash
# Install and start everything
./setup.sh
```

The app opens automatically at **http://localhost:3000** ✅

---

## 🎯 First 10 Minutes

### Step 1: Login (1 min)
1. Go to http://localhost:3000
2. Click "Get Started"
3. Use demo account credentials:
   - Email: `admin@salesiq.com`
   - Password: `password`
4. Click "Login"

### Step 2: Explore the Dashboard (3 min)
```
Dashboard shows:
├─ Total Revenue 💰
├─ Orders Today 📊
├─ Inventory Value 📦
├─ Sales Chart (interactive)
├─ Inventory Status
└─ Revenue Forecast
```

**Try this:**
- Hover over the chart to see details
- Click legend items to filter data
- Refresh to see live updates

### Step 3: Check Your Role (2 min)
Look at top-right corner - it shows your role.

```
Role Capabilities:
├─ Admin: See everything, change anything
├─ Manager: See data, make changes
├─ Analyst: See data, create reports
└─ Viewer: See data only
```

### Step 4: View Sample Data (3 min)
```
Try these sections:
├─ Sales Tab: Daily revenue & orders
├─ Inventory Tab: Stock levels & alerts
├─ Forecast Tab: Revenue predictions
└─ Reports Tab: Export data
```

---

## 🚀 Next Steps

### Create Your Own Account
1. Go back to login page (logout first)
2. Click "Register"
3. Enter your email and password
4. Choose your role:
   - **Admin**: You control everything
   - **Manager**: Manage operations
   - **Analyst**: Analyze data
   - **Viewer**: Read-only
5. Click "Register"
6. Login with your new account

### Explore Each Feature

**📊 Sales Tracking**
- View today's sales
- See top products
- Track revenue trends
- Identify patterns

**📦 Inventory Management**
- Check stock levels
- See low-stock alerts
- View inventory value
- Plan restocking

**🔮 Revenue Forecast**
- See revenue predictions
- Plan based on forecasts
- Identify seasonal trends
- Set targets

**👥 Team Management** (Admin Only)
- Add team members
- Set their roles
- Control permissions
- View their activity

---

## 📖 Full Documentation

For detailed guides, see:

- **[README.md](../README.md)** - Project overview
- **[FEATURES.md](../FEATURES.md)** - Detailed feature guide
- **[SETUP.md](../SETUP.md)** - Setup instructions
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Production deployment

---

## 🆘 Troubleshooting

### "Can't connect to the app"
```
The backend isn't running. Try:
1. Open terminal
2. Navigate to server folder: cd server
3. Start it: npm start
4. Wait for message: "Server running on port 5000"
5. Open http://localhost:3000 in browser
```

### "Database error"
```
Your database isn't set up. Try:
1. Make sure MySQL is running
2. Run: mysql < database/schema.sql
3. Check credentials in server/.env
```

### "Forgot password"
```
For demo accounts, just:
1. Logout
2. Use the same credentials to login again
3. Or create a new account
```

### "Page won't load"
```
Try these fixes:
1. Refresh browser: Ctrl+R (or Cmd+R on Mac)
2. Clear browser cache: Ctrl+Shift+Delete
3. Restart the app servers
4. Check browser console for errors: F12
```

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- `Ctrl+K` - Search (coming soon)
- `Ctrl+/` - Command palette (coming soon)
- `Escape` - Close modals
- `?` - Help (coming soon)

### Dashboard Tips
- **Hover over charts** for exact numbers
- **Click chart elements** to filter data
- **Zoom in/out** on line charts
- **Download charts** as PNG

### Data Tips
- **Export data** to analyze in Excel
- **Create custom reports** with filters
- **Set alerts** for important metrics
- **Share dashboards** with team

---

## 📱 Mobile & Tablet

SalesIQ works great on mobile!

**Try on your phone:**
1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Go to: `http://YOUR_IP:3000`
3. Use same login credentials

---

## 🎓 Video Tutorials

Coming soon! Check back for:
- Dashboard walkthrough
- Setting up inventory alerts
- Creating custom reports
- Team collaboration
- Mobile tips

---

## 🔐 Security Tips

**Keep Your Account Safe:**
- ✅ Use a strong password (8+ characters)
- ✅ Don't share your login
- ✅ Logout on shared computers
- ✅ Keep your browser updated
- ✅ Report suspicious activity

**For Production:**
- Change the `JWT_SECRET` in `.env`
- Use HTTPS/SSL
- Enable firewall rules
- Regular backups
- Monitor access logs

---

## 📊 Example Tasks

### Task 1: Check Today's Sales
```
1. Login to dashboard
2. Go to Sales tab
3. Look at "Today's Revenue"
4. Click chart to see hourly breakdown
5. Export data if needed
```

### Task 2: Find Low Stock Items
```
1. Go to Inventory tab
2. Look for red indicators (low stock)
3. Click an item to see details
4. Note the reorder date
5. Email supplier if urgent
```

### Task 3: Plan Next Month
```
1. Go to Forecast tab
2. Look at 30-day projection
3. Check confidence level
4. Note peak sales days
5. Plan staffing/marketing accordingly
```

### Task 4: Create a Report
```
1. Go to Reports tab
2. Select date range
3. Choose metrics you want
4. Click "Generate Report"
5. Download as PDF or CSV
```

---

## 🤝 Need More Help?

### Quick Links
- 📖 [Full Documentation](../README.md)
- 🚀 [Deployment Guide](../DEPLOYMENT.md)
- ✨ [Feature Showcase](../FEATURES.md)
- 💬 [Report an Issue](https://github.com/salesiq)

### Contact Support
- 📧 Email: support@salesiq.com
- 💬 Chat: In-app support (coming soon)
- 📞 Phone: Available with Enterprise plan

### Community
- 🌐 [Website](https://salesiq.com)
- 👥 [Forum](https://forum.salesiq.com)
- 🎉 [Slack Community](https://slack.salesiq.com)

---

## 🎉 You're All Set!

Congratulations! You're now ready to use SalesIQ.

**What to do next:**
1. ✅ Explore the dashboard
2. ✅ Import your real data
3. ✅ Set up alerts
4. ✅ Invite your team
5. ✅ Start making better decisions

---

**Have fun and let us know what you think!** 🚀

---

**Last Updated**: May 2026 | **Version**: 1.0
