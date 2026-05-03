# ClientSphere Frontend - Vercel Deployment Guide

## Overview
This guide will help you deploy the ClientSphere React frontend to Vercel.

## Prerequisites
- A Vercel account (https://vercel.com)
- Your backend API deployed and accessible at `https://clientsphere.runasp.net`
- Git repository (recommended for automatic deployments)

## Configuration Files Created

### 1. `vercel.json`
Configuration file for Vercel deployment with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Security Headers**: XSS protection, frame protection, content-type sniffing prevention
- **Asset Caching**: Static assets cached for 1 year with immutable flag
- **Environment Variables**: API URL and Stripe publishable key

### 2. `vite.config.ts` (Updated)
- Removed IIS-specific `web.config` copying plugin
- Added code splitting for better performance:
  - `vendor`: React, React DOM, React Router
  - `ui`: Lucide icons, Framer Motion
  - `charts`: Recharts
  - `dnd`: Drag and drop kit

## Deployment Options

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect to Git Repository**
   ```bash
   cd d:\Projects\ClientSphere\clientsphere-web
   git init
   git add .
   git commit -m "Prepare for Vercel deployment"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import on Vercel**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect the Vite framework
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` branch will trigger automatic deployment
   - Pull requests get preview deployments

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd d:\Projects\ClientSphere\clientsphere-web
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

The following environment variables are configured in `vercel.json`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://clientsphere.runasp.net` | Backend API endpoint |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Stripe payment integration |

**Important**: For production, you should:
1. Remove hardcoded values from `vercel.json`
2. Add them via Vercel Dashboard: Settings → Environment Variables
3. Or use Vercel CLI: `vercel env add VITE_API_URL`

## Updating Environment Variables

### Via Vercel Dashboard
1. Go to your project on Vercel
2. Navigate to Settings → Environment Variables
3. Add/update variables for Production, Preview, and Development environments
4. Redeploy for changes to take effect

### Via Vercel CLI
```bash
vercel env add VITE_API_URL production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed by Vercel

## Post-Deployment Checklist

- [ ] Verify the app loads correctly
- [ ] Test API connectivity to `https://clientsphere.runasp.net`
- [ ] Check browser console for errors
- [ ] Test all routes (login, dashboard, customers, leads, etc.)
- [ ] Verify Stripe integration (if applicable)
- [ ] Test responsive design on mobile devices
- [ ] Check security headers in browser dev tools

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (Vercel defaults to latest LTS)

### API Calls Fail
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration on backend
- Ensure backend is running and accessible

### Routes Return 404
- The `rewrites` configuration in `vercel.json` should handle SPA routing
- Verify client-side routing is working properly

### Assets Not Loading
- Check that assets are in `public/` or imported correctly
- Verify build output in `dist/` folder

## Performance Optimizations

The build is already optimized with:
- **Code Splitting**: Chunks for vendor, UI, charts, and drag-and-drop
- **Asset Caching**: Static assets cached for 1 year
- **Compression**: Gzip compression applied automatically by Vercel
- **CDN**: Global CDN distribution via Vercel Edge Network

## Monitoring

After deployment, monitor your app via:
- Vercel Dashboard: Analytics, logs, and performance metrics
- Vercel Speed Insights: Core Web Vitals monitoring
- Custom analytics: Add your preferred analytics service

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
