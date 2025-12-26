# ThirdCheck - Supabase 2

ThirdCheck is a comprehensive Third-Party Risk Management (TPRM) platform built with React, TypeScript, and Supabase.

## 🚨 Security Notice

**Never commit sensitive information to version control!**

### Environment Variables Required

Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Security Issues Found and Fixed

1. **API Keys Exposure**: The Gemini API key was being exposed to the client-side code. This has been identified but requires backend implementation for full security.

2. **Mock Data Passwords**: Hardcoded passwords in mock data have been identified. In production, use proper authentication.

3. **Environment Variables**: All sensitive data is now properly configured to use environment variables.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anonymous key from the project settings
3. Add them to your `.env.local` file
4. Run the database migrations (when implemented)

## Build for Production

```bash
npm run build
```

## Features

- Vendor risk assessment and management
- AI-powered risk analysis using Google Gemini
- Comprehensive compliance tracking
- Multi-user access control
- Interactive dashboards and analytics
