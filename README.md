# Manas Lab — Personal Website

A personal website and blog built with React, Tailwind CSS v4, and Firebase.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 (PostCSS) |
| Fonts | Inter, Newsreader, JetBrains Mono (Google Fonts) |
| Backend | Firebase (Auth + Firestore) |
| Hosting | Vercel |
| Icons | Lucide React |

## Project Structure

```
src/
├── main.jsx                    # Entry point, BrowserRouter wrapper
├── App.jsx                     # Root layout, nav, footer, routing, auth
├── index.css                   # Tailwind config, theme, animations, glass-texture
├── services/
│   └── firebase.js             # Firebase init, config validation, exports
├── contexts/
│   └── GlobalContentContext.jsx # Firestore-synced global content (settings)
├── pages/
│   ├── Journal.jsx             # Indoor (blog feed + writing editor)
│   ├── BlogPost.jsx            # Individual blog post (/post/:id)
│   ├── Profile.jsx             # Outdoor (experience + projects)
│   ├── ProjectDetail.jsx       # Individual project (/project/:id)
│   └── AdminDashboard.jsx      # Content management (Indoor/Outdoor/Global)
└── utils/
    └── constants.js            # UI tokens, static blog entries
```

## Local Development

```bash
npm install
npm run dev        # Starts Vite dev server on localhost:5173
```

### Environment Variables

Create a `.env` file with your Firebase config:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **Important**: These same variables must be set in Vercel Dashboard → Settings → Environment Variables for the live site to work.

## Deployment

Push to `main` → Vercel auto-deploys. The `vercel.json` handles:
- SPA route rewrites (all paths → `index.html`)
- Static asset caching (immutable, 1-year cache for hashed JS/CSS)

## Admin Mode

1. Click the Terminal icon in the footer
2. Sign in with Google (only `sontakke.manas@gmail.com` gets admin access)
3. Dashboard appears in the nav bar
4. All changes are saved to Firestore and reflect globally in real-time

## Content Architecture

All mutable content lives in Firestore under:
```
artifacts/{appId}/public/data/settings/main    → Global content (bio, labels, socials, footer)
artifacts/{appId}/public/data/blogs/{id}       → Blog posts
```

Static/fallback content is defined in `GlobalContentContext.jsx` and `constants.js`.

## Key Design Decisions

- **No SSR**: Pure client-side SPA for simplicity. Firebase handles data persistence.
- **Content-first admin**: The admin dashboard manages ALL visible text — nothing is hardcoded except structural layout.
- **Chunk splitting**: Firebase SDK and React are split into separate chunks so app code changes don't force re-downloading vendor libs.
- **Glass texture**: Custom CSS utility class with SVG noise filter for the card aesthetic.
