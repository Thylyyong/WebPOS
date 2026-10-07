# Deployment

The project has a Vue frontend and a Laravel API. Deploy them as two services:

## 1. Deploy the API

Build the repository's root `Dockerfile` on a PHP container host (for example, Render or Railway). The image uses PHP 8.4 and runs Laravel migrations at startup. Configure these environment variables on the API service:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY`: generate once with `php artisan key:generate --show` in a trusted local environment; keep it secret and stable across restarts
- `APP_URL`: the public HTTPS URL of the API
- `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: credentials for a managed PostgreSQL database
- `CORS_ALLOWED_ORIGINS`: the exact public frontend origin, for example `https://your-pos.vercel.app` (comma-separated if you have multiple origins)

Keep the database on persistent managed storage. Configure persistent storage for uploaded product/receipt images, or move uploads to object storage; container-local files can disappear when the service is replaced. The container migrates the database on startup but does not seed it. Seed initial/demo data only once in a controlled setup, never on each production restart.

Check the API at `https://your-api-domain/api/health` after deployment.

## 2. Deploy the frontend

Import the repository into Vercel and keep the project root as the Root Directory. The root `vercel.json` builds `vue-frontend` and publishes its `dist` directory. Set this Vercel environment variable for Production (and Preview if needed):

- `VITE_API_BASE_URL=https://your-api-domain/api`

Redeploy after setting the variable. Vite embeds it at build time. Confirm the API origin matches `CORS_ALLOWED_ORIGINS` exactly, including the scheme and any custom domain.

## 3. First launch checks

- Open the frontend and verify `/api/health` returns JSON from the API.
- Sign in and verify catalog loading, a test order, and image upload/storage.
- Check API logs and database persistence after restarting the API service.
- Set production credentials and staff PINs before exposing the POS to real users; do not rely on demo seed accounts.
