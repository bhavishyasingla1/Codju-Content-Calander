# Codju Content Calendar 📅

An elegant, premium, AI-powered content scheduling and management dashboard designed for modern content creators. Built with **React 19**, **Vite**, **Vanilla CSS**, and backed by **Supabase PostgreSQL** and **Gemini AI**.

---

## ✨ Features

- **🔄 Multi-Dimensional Content Views**:
  - **Calendar View**: A visual, interactive monthly grid to plan and schedule posts. Click any date to instantly draft new content.
  - **List View**: A clean, tabular interface designed for detailed content management, showing inline platform indicators, status badges, and asset previews.
  - **Grid View**: A card-based layout featuring rich card previews, quick summaries, and platform badges.

- **🤖 AI-Powered Content Generator**:
  - Integrated with **Gemini Flash AI** (`gemini-flash-latest`).
  - Generates structured monthly content tables in a single click, automatically drafting professional copy, titles, summaries, platform targets, and dates based on your prompts.

- **📝 Advanced Rich Text & Script Editor**:
  - Built-in editors for writing reels/video scripts and rich-text articles (perfect for LinkedIn, blogs, and newsletter drafts).
  - Categorized workflows with status tracking (`Draft`, `Ready`, `Published`).

- **📁 Asset & Media Management**:
  - Drag-and-drop file upload zone supporting image/video attachments.
  - Generates instant local base64 previews with active download options.

- **⚡ Fast & Responsive Experience**:
  - Designed with premium glassmorphic UI aesthetics, micro-animations, custom skeleton loading states, and dark mode-friendly accents.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS (Custom Design System)
- **Backend API**: Custom Vite API middleware (`vite-api-plugin.js`)
- **Database**: Supabase PostgreSQL (via `pg` pooling)
- **AI Engine**: Google Gemini AI (`gemini-flash-latest`)
- **Linting**: Oxlint (ultra-fast JS/JSX linting)

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Initialize the Database
The project utilizes a Supabase-hosted PostgreSQL database. To create the `content` table and seed it with initial mock data:
```bash
node scripts/dbInit.js
```

### 4. Run the Development Server
Launch the local server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` (or the port specified in terminal).

---

## 📁 Repository Structure

```
├── scripts/
│   └── dbInit.js             # Database table creation and mock data seeding
├── src/
│   ├── components/           # Reusable UI widgets (Editors, Modals, Search, Badges)
│   ├── views/                # CalendarView, GridView, and ListView layouts
│   ├── hooks/                # useContent, useSearch, and useAutoSave hooks
│   ├── services/             # API caller wrapper (contentService.js)
│   ├── utils/                # Helper functions and date formatters
│   ├── App.jsx               # Main layout and view router
│   └── index.css             # Global tokens, typography, and styling variables
├── vite-api-plugin.js        # Vite middleware serving CRUD REST endpoints & Gemini wrapper
└── vite.config.js            # Build configuration including the custom API plugin
```

---

## ⚙️ Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the production bundle of the frontend assets.
- `npm run preview`: Previews the local production build.
- `npm run lint`: Fast linting using Oxlint.
