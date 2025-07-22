# Vercel Deployment Instructions

This document outlines how to deploy the DTAM application to Vercel with Supabase integration.

## Prerequisites

- Vercel account
- Supabase project set up
- GitHub repository connected to Vercel

## Environment Variables

Configure the following environment variables in your Vercel project settings:

### Required Supabase Variables

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Node Environment

| Variable Name | Description | Value |
|---------------|-------------|-------|
| `NODE_ENV` | Node environment | `production` |

## Deployment Steps

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the project root directory

### 2. Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" > "Environment Variables"
2. Add the required environment variables listed above
3. Ensure all variables are set for Production, Preview, and Development environments

### 3. Verify Build Configuration

The project includes a `vercel.json` configuration file with:

- Node.js runtime for `server.js`
- Static file serving for public assets
- Lambda size limit of 50MB
- Proper routing configuration

### 4. Deploy

1. Push changes to your connected branch
2. Vercel will automatically build and deploy
3. Monitor the deployment logs for any issues

## Supabase Configuration

Ensure your Supabase project has:

1. **Database**: Tables and schema properly configured
2. **Authentication**: Policies set up for user access
3. **Storage**: Buckets configured if using file uploads
4. **API Keys**: Service role key with appropriate permissions

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Check that all required variables are set in Vercel
2. **Supabase Connection**: Verify URL and service key are correct
3. **Build Failures**: Check Node.js version compatibility
4. **Static Assets**: Ensure public folder structure matches routing config

### Checking Deployment

- Verify environment variables are loaded: Check server logs for Supabase connection
- Test database connectivity after deployment
- Monitor function logs in Vercel dashboard

## Security Notes

- Never commit environment variables to version control
- Use Supabase service key (not anon key) for server-side operations
- Ensure Supabase RLS policies are properly configured
- Keep service keys secure and rotate them regularly

## File Structure

```
DTAMSTG/
├── server.js              # Main server file
├── vercel.json           # Vercel configuration
├── config/
│   └── supabase.js       # Supabase client configuration
├── public/               # Static assets
├── routes/               # API routes
└── views/                # EJS templates
```