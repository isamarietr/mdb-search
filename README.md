# MongoDB Search 

This application uses MongoDB's Atlas search indexes to show search results. Autocomplete can also be enabled by providing the name of the field used for autocomplete in the "Autocomplete using..." section.

Learn more about MongoDB's [Autocomplete](https://docs.atlas.mongodb.com/reference/atlas-search/autocomplete/).



## Environment

Copy `sample.env.local` to `.env.local` to make this configuration accessible to client and/or server-side code.

Learn more about [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables#loading-environment-variables) in Next.js.

## Development

Install all dependencies 
```bash
npm i
```

Start the server in development mode with hot-code reloading.

```bash
npm run dev
```

## Production 

Start the application in production mode. 

```bash
npm start
```
_The default Next.js `start` script has been updated to first build the application._

## Notes

In both development and production the application will start at http://localhost:3000 by default. The default port can be changed with `-p` in the `dev` and `start:prod` scripts in `package.json`, like:
```bash
...
"scripts": {
    "dev": "next -p 4000",
    ...
    "start:prod": "next start -p 4000",
    ...
  }
...
```
