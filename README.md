## Waselny Frontend Auth

This is a React + Vite + TypeScript frontend that implements a complete authentication flow against the `https://citybus.runasp.net` API using JWT access tokens and HTTP-only refresh token cookies.

### Tech Stack

- **React 18** + **TypeScript**
- **Vite** for bundling/dev server
- **React Router v6** for routing
- **Axios** with an HTTP interceptor for `Authorization` and refresh handling
- **Tailwind CSS** for styling

### Auth Features Implemented

- Login with role-based redirect (`Admin`, `Driver`, `Passenger`)
- Passenger registration with validation and email verification flow
- Email verification page with 6-digit code UI
- Forgot password and reset password flow
- Driver application form
- Role-based dashboards behind protected routes
- Centralized `AuthService`, validators, token manager, error handler, and HTTP client with refresh logic

### Install & Run

```bash
npm install
npm run dev
```

By default the app runs on `http://localhost:5173`.

### Environment Configuration

Copy `.env.example` to `.env` and adjust if needed:

```bash
VITE_API_BASE_URL=https://citybus.runasp.net
```

If `.env.example` is not present, you can still create `.env` manually with the variable above.

### Main Files

- Routing and layout: `src/App.tsx`, `src/main.tsx`
- Auth service & HTTP client: `src/services/authService.ts`, `src/services/httpClient.ts`
- Utilities: `src/utils/validator.ts`, `src/utils/tokenManager.ts`, `src/utils/errorHandler.ts`
- Components: `src/components/FormInput.tsx`, `Button.tsx`, `LoadingSpinner.tsx`, `ErrorMessage.tsx`, `ProtectedRoute.tsx`
- Pages:
  - `src/pages/Login.tsx`
  - `src/pages/Register.tsx`
  - `src/pages/VerifyEmail.tsx`
  - `src/pages/ForgotPassword.tsx`
  - `src/pages/ResetPassword.tsx`
  - `src/pages/DriverApplication.tsx`
  - `src/pages/DashboardLayout.tsx`

### GitHub Pages Deployment

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

**Setup Steps:**

1. **Enable GitHub Pages in your repository:**
   - Go to your repo → Settings → Pages
   - Under "Source", select **"GitHub Actions"** (not "Deploy from a branch")
   - Save

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

3. **Wait for deployment:**
   - Go to your repo → Actions tab
   - Wait for the "Deploy to GitHub Pages" workflow to complete
   - Your site will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

**Important Notes:**
- The GitHub Actions workflow automatically sets the correct base path (`/repo-name/`)
- The `404.html` file handles client-side routing for React Router
- Make sure your backend CORS settings include your GitHub Pages URL:
  ```csharp
  corsOptions.AddPolicy("MyPolicy", CorsPolicy =>
      CorsPolicy.WithOrigins(
          "https://youssefmohamed430.github.io",
          "http://localhost:5173"  // For local development
      )
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials());
  ```

### Notes

- Access token is stored in `localStorage` via `tokenManager`; refresh token is handled as an HTTP-only cookie by the backend.
- 401 responses trigger `/Auth/RefreshToken` automatically; if refresh fails, the user is logged out and redirected to `/login`.
- All forms perform client-side validation but rely on server-side validation as source of truth.


