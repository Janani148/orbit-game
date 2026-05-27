# ORBIT — Single Tap Web Game

A mobile-first, single-tap game built with React + Tailwind CSS + Vite.

## How to Play
- **TAP** anywhere to reverse direction and shift your orbit radius
- **Thread** your glowing orb through the gaps in the rotating rings
- **Survive** as long as you can — rings multiply and speed up

---

## ─── Step-by-Step: Run Locally ───────────────────────

### Step 1 — Install Node.js
Download from https://nodejs.org (choose LTS version, e.g. 20.x)
Verify installation:
```
node -v     # should print v18+ or v20+
npm -v      # should print 9+ or 10+
```

### Step 2 — Download / Clone this project
Option A — If you received a ZIP:
```
Unzip the folder → open a terminal inside it
```

Option B — If using Git:
```
git clone https://github.com/YOUR_USERNAME/orbit-game.git
cd orbit-game
```

### Step 3 — Install dependencies
```
npm install
```
This downloads React, Vite, Tailwind CSS, etc. (~30 seconds)

### Step 4 — Start development server
```
npm run dev
```
Open your browser at http://localhost:5173
The game runs. Edit files and the browser auto-refreshes.

---

## ─── Step-by-Step: Deploy on Vercel (Recommended) ───

### Step 1 — Create a GitHub repository
1. Go to https://github.com → click "New repository"
2. Name it `orbit-game`, set to Public, click Create

### Step 2 — Push your code
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/orbit-game.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com → sign in with GitHub
2. Click "Add New → Project"
3. Select your `orbit-game` repository → click Import
4. Leave all defaults as-is (Vercel auto-detects Vite)
5. Click **Deploy**
6. ✅ Your game is live at `https://orbit-game-xxx.vercel.app`

Every `git push` auto-redeploys.

---

## ─── Step-by-Step: Deploy on Render ─────────────────

### Step 1 — Build the project
```
npm run build
```
This creates a `dist/` folder with the production files.

### Step 2 — Push to GitHub (see Vercel Step 1 & 2 above)

### Step 3 — Deploy on Render
1. Go to https://render.com → sign in
2. Click "New → Static Site"
3. Connect your GitHub → select `orbit-game`
4. Set these fields:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. Click **Create Static Site**
6. ✅ Your game is live at `https://orbit-game.onrender.com`

---

## Project Structure
```
orbit-game/
├── index.html              ← Entry HTML (sets viewport, loads fonts)
├── vite.config.js          ← Vite + React plugin config
├── tailwind.config.js      ← Tailwind content paths
├── postcss.config.js       ← PostCSS for Tailwind
├── package.json            ← Dependencies & scripts
└── src/
    ├── main.jsx            ← React root mount
    ├── index.css           ← Tailwind + global animations
    ├── App.jsx             ← UI layer (HUD, screens, combo)
    └── useGameEngine.js    ← All game logic (canvas, physics, rings)
```

## Scripts
| Command         | What it does                          |
|-----------------|---------------------------------------|
| `npm run dev`   | Start local dev server (hot reload)   |
| `npm run build` | Build optimised production bundle     |
| `npm run preview` | Preview the production build locally|
