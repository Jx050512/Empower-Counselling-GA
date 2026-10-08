# Empower Admin — Connection

This Admin site connects to the Public website backend through its own Netlify Function proxy.

Admin Netlify environment variable:

`PUBLIC_API_ORIGIN=https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app`

The login credentials belong on the Public Netlify project:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Appointments and enquiries are stored with Netlify Blobs on the Public project. No Supabase variables are required.

After changing environment variables, redeploy the Public project first, then the Admin project.
