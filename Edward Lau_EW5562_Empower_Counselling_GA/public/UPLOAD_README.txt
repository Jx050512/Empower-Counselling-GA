Empower Public Website - Favicon + Netlify Blobs Ready

Updated:
- Browser tab icon now uses the official Empower logo mark.
- PWA/app icons updated to the same Empower logo mark.
- Message success text: Your message has been submitted successfully. Reference number: XXXXXXXX. Empower will contact you as soon as possible.
- @netlify/blobs pinned to 10.7.13 to avoid the previous module crash.
- @netlify/functions pinned to 6.0.0.

IMPORTANT:
This project contains Netlify Functions. Do not use Netlify's plain static drag-and-drop deployment because it may omit the Functions.
Recommended: extract this ZIP and double-click DEPLOY_PUBLIC.bat, or open PowerShell in this folder and run:
  npm install
  npx netlify deploy --prod

After deployment, open the site in a new tab or press Ctrl+Shift+R so the browser refreshes its favicon cache.
