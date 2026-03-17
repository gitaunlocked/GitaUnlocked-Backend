# Gita Unlocked - Backend API

Backend-only project for Vercel deployment.

## Deployment to Vercel

1. **Push to GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/gitaUnlocked-backend.git
git branch -M main
git push -u origin main
```

2. **Deploy on Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "Add New Project"
- Import this GitHub repository
- Add Environment Variables:
  - `RAZORPAY_KEY_ID` = `rzp_live_SRl74luAfIUbE5`
  - `RAZORPAY_KEY_SECRET` = `zTIMrEz9zleYXr25sRHfGc3C`
  - `RAZORPAY_WEBHOOK_SECRET` = `RadhaMadhav@108`
  - `FIREBASE_SERVICE_ACCOUNT` = (entire service-account.json as one-line JSON)

3. **Click Deploy** ✅

Your API will be available at: `https://gitaUnlocked-backend.vercel.app`

## API Routes

- `POST /api/create-order` - Create Razorpay payment order
- `POST /api/verify-payment` - Verify payment completion
- `POST /api/razorpay-webhook` - Webhook handler for Razorpay
- `POST /api/upload-image` - Upload course images

## Frontend

Frontend files are deployed separately to cPanel at your domain.

Update frontend API base URL to point to this backend's Vercel URL.
