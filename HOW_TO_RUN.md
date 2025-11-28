# 🚀 How to Run the Admin Dashboard

## Prerequisites

Make sure you have Node.js installed (v16 or higher recommended). Check with:
```bash
node --version
npm --version
```

## Step-by-Step Instructions

### 1. Install Dependencies

If you haven't already installed the dependencies, run:

```bash
npm install
```

This will install all required packages including React, Vite, TypeScript, Tailwind CSS, and Axios.

### 2. Environment Configuration

Make sure you have a `.env` file in the root directory with the API base URL:

```bash
VITE_API_BASE_URL=https://citybus.runasp.net
```

If you don't have a `.env` file, create one:
```bash
echo "VITE_API_BASE_URL=https://citybus.runasp.net" > .env
```

### 3. Start the Development Server

Run the development server:

```bash
npm run dev
```

You should see output like:
```
  VITE v6.0.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### 5. Login as Admin

1. You'll be redirected to the login page (`/login`)
2. Enter your admin credentials:
   - **Username**: Your admin username
   - **Password**: Your admin password
3. Click "Login"

### 6. Access the Admin Dashboard

After successful login, you'll be automatically redirected to:
```
http://localhost:5173/admin/dashboard
```

Or you can manually navigate to any admin page:
- `/admin/dashboard` - Main overview
- `/admin/driver-requests` - Driver requests management
- `/admin/buses` - Bus management
- `/admin/stations` - Station management
- `/admin/trips` - Trip management
- `/admin/routes` - Route management
- `/admin/schedules` - Schedule management
- `/admin/tickets` - Ticket management
- `/admin/bookings` - Booking view

## Available Scripts

### Development

```bash
npm run dev
```
Starts the Vite development server with hot module replacement (HMR). Changes to your code will automatically reload in the browser.

### Build for Production

```bash
npm run build
```
Creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```
Preview the production build locally before deploying.

### Linting

```bash
npm run lint
```
Check for code quality issues and errors.

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.). Check the terminal output for the actual port.

To specify a different port:
```bash
npm run dev -- --port 3000
```

### API Connection Issues

1. **Check your `.env` file** - Make sure `VITE_API_BASE_URL` is set correctly
2. **Check CORS settings** - Make sure your backend allows requests from `http://localhost:5173`
3. **Check browser console** - Look for error messages in the browser's developer console (F12)

### Authentication Issues

1. **Clear localStorage** - If you're having login issues, clear your browser's localStorage:
   - Open Developer Tools (F12)
   - Go to Application tab → Local Storage
   - Clear all items
   - Refresh the page

2. **Check token** - The token is stored in localStorage with key `waselny_token`

3. **Backend must be running** - Make sure the backend API at `https://citybus.runasp.net` is accessible

### TypeScript Errors

If you see TypeScript errors:
```bash
npm run lint
```

This will show you any type errors that need to be fixed.

## Development Tips

### Hot Module Replacement (HMR)
- Changes to your code automatically reload in the browser
- Component state is preserved during HMR
- Very fast development experience

### Browser Developer Tools
- **F12** - Open Developer Tools
- **Console tab** - See logs and errors
- **Network tab** - Monitor API requests
- **Application tab** - View localStorage, sessionStorage, etc.

### Common Development Workflow

1. Start the dev server: `npm run dev`
2. Make changes to your code
3. See changes instantly in the browser
4. Check console for any errors
5. Test your changes
6. When done, build for production: `npm run build`

## Admin Dashboard Features

Once logged in as admin, you'll have access to:

- ✅ **Dashboard** - Overview with statistics and quick actions
- ✅ **Driver Requests** - Approve/reject driver applications
- ✅ **Bus Management** - Add, edit, delete buses
- ✅ **Station Management** - Manage bus stations
- ✅ **Trip Management** - Create and manage trips
- ✅ **Route Management** - Set up routes with stations
- ✅ **Schedule Management** - Create bus schedules
- ✅ **Ticket Management** - Set ticket prices
- ✅ **Booking View** - View all bookings and statistics

## Quick Start Summary

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Create .env file (if not exists)
echo "VITE_API_BASE_URL=https://citybus.runasp.net" > .env

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to: http://localhost:5173

# 5. Login with admin credentials
# You'll be redirected to: /admin/dashboard
```

## Need Help?

- Check the browser console (F12) for error messages
- Verify your API is accessible at `https://citybus.runasp.net`
- Make sure you're logged in with an Admin role account
- Check that all dependencies are installed correctly

Happy coding! 🎉
