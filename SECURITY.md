# Security Guidelines

## API Keys and Sensitive Data

### Current Security Issues

1. **Gemini API Key Exposure**: The Gemini API key is currently exposed to client-side code. This is a security risk as API keys can be extracted from browser bundles.

   **Recommended Fix**: Move AI processing to a backend API or use Supabase Edge Functions.

2. **Mock Passwords**: Hardcoded passwords exist in mock data. These should never be used in production.

### Environment Variables

All sensitive configuration must use environment variables:

- `GEMINI_API_KEY`: Google Gemini API key
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Best Practices

1. **Never commit .env files** - Use .env.example as a template
2. **Use Row Level Security (RLS)** in Supabase for data access control
3. **Implement proper authentication** - Use Supabase Auth instead of mock authentication
4. **Hash passwords** - Never store plain text passwords
5. **Validate input** - Sanitize all user inputs to prevent injection attacks
6. **Use HTTPS** - Always serve over secure connections

### Supabase Security

When setting up Supabase:

1. Enable Row Level Security (RLS) on all tables
2. Create appropriate policies for data access
3. Use Supabase Auth for user management
4. Store sensitive data encrypted when possible

### API Security

For external APIs:

1. Use server-side calls when possible
2. Implement rate limiting
3. Validate API responses
4. Handle errors gracefully without exposing sensitive information

## Reporting Security Issues

If you find security vulnerabilities, please report them privately rather than creating public issues.