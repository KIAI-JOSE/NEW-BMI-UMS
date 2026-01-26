# Deployment Instructions

Since GitHub Pages has billing issues, here are alternative deployment options:

## Option 1: Netlify (Recommended)

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the `NEW-BMI-UMS` repository
5. Choose the `MAIN-BMI` branch
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"

## Option 2: Manual Deployment

1. Run `npm run build` locally
2. Upload the `dist` folder to any web hosting service
3. Configure the hosting to serve `index.html` for all routes

## Option 3: Vercel Manual

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy

## QR Code URLs

The app will generate QR codes with the format:
`https://your-domain.com/verify?id=SERIAL&hash=HASH`

These will work universally across all devices and networks.