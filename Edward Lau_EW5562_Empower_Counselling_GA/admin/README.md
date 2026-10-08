# GA Full English Admin Website

This package is the complete English GA version of the current Empower Counselling website and preserves the same features and structure as the client Chinese version.

# Empower Website Management — English GA Version

This is the English Admin website for Empower Counselling Consultancy Services.

## Manageable Content
- Website and contact information
- Home-page guidance section
- Counsellor profile
- Counselling services
- Programmes and events
- Bookings and enquiries: search, type/status filters, newest/oldest sorting, status updates and deletion
- Video resources
- Media library

## Connection Model
The Admin website connects to the Public website API through its own Netlify Function proxy. Appointments and enquiries are stored on the Public project using Netlify Blobs. Supabase is not required.

Public API:
`https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app/api/*`

Admin environment variable:
`PUBLIC_API_ORIGIN=https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app`

Deploy the Public website first, then the Admin website. After deployment, sign in and test Bookings & Enquiries, content saving/synchronisation and media uploads.
