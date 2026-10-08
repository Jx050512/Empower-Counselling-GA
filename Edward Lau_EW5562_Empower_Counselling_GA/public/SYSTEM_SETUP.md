# Empower Counselling — System Connection (Netlify Blobs)

The Public website hosts the backend API used by both the public pages and the Admin website.
Appointments, enquiries, website content and media are stored with Netlify Blobs. Supabase is not required.

## Public Netlify environment variables

Only these are required for Admin login:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET` — use a long random value (32+ characters)

Netlify Blobs does not require a separate database URL or database key.

## Admin Netlify environment variable

Set this on the Admin project:

- `PUBLIC_API_ORIGIN=https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app`

## Connection test

After deploying the Public site, open:

`https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app/api/health`

Expected result:

```json
{
  "ok": true,
  "service": "Empower Website Service",
  "authConfigured": true,
  "requestStorage": "netlify-blobs"
}
```

Then test:
1. Submit one appointment on the Public Contact page.
2. Log in to the Admin site.
3. Open `Bookings & Enquiries` and press `Refresh`.
4. The new appointment should appear there.
5. Change its status to verify write access, then optionally delete the test record.

## Important deployment note

This project uses Netlify Functions and Netlify Blobs. Deploy the whole project (including `netlify/`, `package.json`, and `netlify.toml`) with Git deployment or Netlify CLI. Do not publish only the HTML/CSS/JS files.
