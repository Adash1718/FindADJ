# Deployment Guide for FindADJ

## Deploy to Render (Free Hosting)

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your Clerk keys ready

### Step 1: Push Code to GitHub

1. Create a new repository on GitHub (https://github.com/new)
   - Name it `findadj` or whatever you prefer
   - Keep it private if you want
   - Don't initialize with README

2. Push your code:
```bash
cd /Users/ameyandash/FindADJ
git init
git add .
git commit -m "Initial commit - FindADJ app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/findadj.git
git push -u origin main
```

### Step 2: Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: findadj (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   Click "Advanced" and add these environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (copy from your local .env file)
   - `CLERK_SECRET_KEY` = (copy from your local .env file)
   - `REACT_APP_CLERK_PUBLISHABLE_KEY` = (copy from your local client/.env file)

6. Click "Create Web Service"

### Step 3: Update Clerk Settings

Once deployed, you'll get a URL like `https://findadj.onrender.com`

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "Domains" in the sidebar
4. Add your Render domain: `findadj.onrender.com`
5. Update allowed redirect URLs and origins

### Step 4: Test Your App

Your app will be live at: `https://your-app-name.onrender.com`

**Note**: 
- Free tier apps on Render spin down after 15 minutes of inactivity
- First load after sleeping takes 30-60 seconds
- SQLite database persists but doesn't support backups on free tier

---

## Alternative: Deploy to Railway

Railway is another great option with better database support.

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Node.js app
5. Add environment variables in the Variables tab
6. Your app will be deployed automatically!

---

## Need a Custom Domain?

Once deployed, you can add a custom domain:

### Render:
1. Go to your service dashboard
2. Click "Settings" → "Custom Domain"
3. Add your domain and follow DNS instructions

### Railway:
1. Go to your project settings
2. Click "Domains" tab
3. Add custom domain and update DNS

You can buy domains from:
- Namecheap (cheap, ~$10/year)
- Google Domains
- GoDaddy
- Cloudflare (cheapest, at-cost pricing)

