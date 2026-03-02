# Manas Sontakke — Digital Archive

A high-performance, minimalist digital portfolio and journal built by [Manas Sontakke](https://linkedin.com/in/manas-sontakke).

Designed for absolute clarity, brutalist typography, and mathematical spacing inspired by the analog precision of print publishing.

### Stack
- **Framework**: React + Vite
- **Styling**: Tailwind CSS (Strictly custom token driven)
- **Database / Auth**: Firebase (Firestore & Custom Auth via Admin Key)
- **Deployment**: Vercel

### Architecture
Designed to separate raw content (Journal) from structural representation (Profile):
```
src/
├── pages/
│   ├── Journal.jsx    # The living digital archive & writing engine
│   └── Profile.jsx     # The structured professional representation
├── services/
│   └── firebase.js   # Admin Auth & Firestore logic
└── utils/
    └── constants.js  # Global Typography (UI) & Design Tokens
```

### Local Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a `.env` file at the root matching the Firebase architecture.
4. Run the development server:
   ```bash
   npm run dev
   ```

### Design Philosophy
1. **Focus over Flash**: Subtle #F4F1EA beige tones rather than stark white.
2. **Typography Guided**: Heavy reliance on `Newsreader` (serif), `Inter` (sans), and `JetBrains Mono`.
3. **Card Modularity**: Elements subtly float with 0.05 opacity borders for visual separation without clutter.

---
*© 2026 Manas Sontakke. Undergraduate Researcher at IIT Kanpur.*
