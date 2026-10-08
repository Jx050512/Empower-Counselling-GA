# Admin login direct-function fix

This build does not rely on `/api/*` route matching inside the Admin site.
The browser calls the Admin Netlify Function directly:

`/.netlify/functions/api-proxy?path=/api/health`

The proxy forwards requests to the Public site configured by `PUBLIC_API_ORIGIN`.

Required Admin environment variable:

`PUBLIC_API_ORIGIN=https://YOUR-GA-ENGLISH-PUBLIC-SITE.netlify.app`

Deploy with Netlify CLI from this folder:

`npm install`
`npx netlify-cli link`
`npx netlify-cli deploy --prod`
