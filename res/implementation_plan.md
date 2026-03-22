# Implementation Plan: Maths Study Dashboard

## Product Brief

A single-page React web application that serves as a personal study tracker for a 31-week mathematics study plan (March–October 2026) targeting ML interpretability PhD preparation. The dashboard must let the user tick off daily tasks, visualise progress over time, and quickly access all course resources. It should feel like a premium personal tool — not a generic to-do app.

---

## 1. Data Model

The study plan is baked into the app as a static JSON data file. User progress (completions, notes) is persisted in a **SQLite database file** (`progress.db`) managed by a lightweight Express backend. This means your entire history lives in a single durable file on disk — trivially backed up by copying it, and immune to browser data clearing.

### 1.1 Static Data: `studyPlan.json`

```ts
interface StudyPlan {
  startDate: string; // "2026-03-24"
  phases: Phase[];
  resources: Resource[];
}

interface Phase {
  id: string; // "phase-1"
  number: number;
  title: string; // "Linear Algebra"
  course: string; // "MIT 18.06SC — Linear Algebra (Gilbert Strang)"
  courseUrl: string;
  description: string; // brief rationale paragraph
  bookChapters: string; // "Ch 1–2 (info theory, Bayes) + Ch 3 start"
  weeks: Week[];
  completionNote: string; // the ✅ message at end of each phase
}

interface Week {
  id: string; // "week-1"
  weekNumber: number;
  dateRange: string; // "24–30 March"
  startDate: string; // "2026-03-24" (ISO)
  endDate: string; // "2026-03-30" (ISO)
  title: string; // "Vectors, Matrices & Elimination"
  isBuffer: boolean; // true for consolidation weeks (7, 14, 21, 27)
  slots: Slot[];
}

interface Slot {
  id: string; // "week-1-train-1"
  type: "train" | "evening";
  slotNumber: number; // 1–4 for train, 1–3 for evening
  label: string; // "Train 1", "Evening 3"
  description: string; // full markdown text of what to do
  isBookSlot: boolean; // true for Train 4 and Evening 3
  estimatedMinutes: number; // 120 for train, 90 for evening
  links: SlotLink[]; // extracted URLs from the description
}

interface SlotLink {
  text: string; // "Lecture 1: The geometry of linear equations"
  url: string; // course URL or specific lecture link
}

interface Resource {
  name: string;
  url: string;
  category: "course" | "book" | "video" | "paper" | "reference";
}
```

### 1.2 User Progress: SQLite Database (`progress.db`)

A single SQLite file stores all mutable user data. The backend uses `better-sqlite3` (synchronous, fast, zero-config).

**Schema:**

```sql
-- Individual slot completions
CREATE TABLE completions (
  slot_id TEXT PRIMARY KEY,          -- e.g. "week-1-train-1"
  completed INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  completed_at TEXT,                  -- ISO datetime
  notes TEXT DEFAULT '',              -- user annotations
  difficulty INTEGER                  -- 1 (easy), 2 (medium), 3 (hard), or NULL
);

-- Confusion log
CREATE TABLE confusion_log (
  id TEXT PRIMARY KEY,                -- UUID
  created_at TEXT NOT NULL,           -- ISO datetime
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT DEFAULT '',
  resolved INTEGER NOT NULL DEFAULT 0,
  week_id TEXT NOT NULL               -- which week it was logged in
);

-- Per-week notes
CREATE TABLE week_notes (
  week_id TEXT PRIMARY KEY,           -- e.g. "week-1"
  notes TEXT DEFAULT ''
);

-- User settings (single-row table)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- enforce single row
  actual_start_date TEXT,             -- if user started on a different date
  theme TEXT DEFAULT 'light',         -- "dark" or "light"
  day_mapping TEXT                    -- JSON string of day-to-slot mapping
);
```

**Why SQLite over alternatives:**
- Single `.db` file — back up by copying, restore by replacing
- No external service, no account, no internet dependency
- Survives browser cache clears, profile resets, switching browsers
- Works identically on macOS, Linux, and Windows
- `better-sqlite3` is synchronous and extremely fast for this data volume (< 300 rows total)

### 1.3 Data File Preparation

The static study plan JSON must be manually extracted from the markdown file and structured according to the schema above. This is a one-time data entry task. Every slot description should preserve the full markdown text (with bold, links, etc.) so the UI can render it richly. All URLs from the "All Links" table and inline references must be captured in the `links` array of each slot and in the top-level `resources` array.

**Complete resource list to embed:**

| Resource | URL |
|----------|-----|
| MIT 18.06SC Linear Algebra | https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/ |
| MIT 18.02SC Multivariable Calculus | https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/ |
| MIT 18.02 Recitation Notes (2024) | https://ocw.mit.edu/courses/res-18-016-multivariable-calculus-recitation-notes-fall-2024/ |
| Harvard Stat 110 YouTube | https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo |
| Stat 110 Course Website | https://stat110.hsites.harvard.edu/ |
| MIT 18.650 Statistics | https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/ |
| MML Book (PDF) | https://mml-book.github.io/book/mml-book.pdf |
| ARENA Chapter 1 | https://www.arena.education/chapter1 |
| 3Blue1Brown Essence of Linear Algebra | https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab |
| 3Blue1Brown Essence of Calculus | https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr |
| CS229 Probability Review | https://cs229.stanford.edu/section/cs229-prob.pdf |
| Anthropic: Transformer Circuits | https://transformer-circuits.pub/2021/framework/index.html |
| Anthropic: Toy Models of Superposition | https://transformer-circuits.pub/2022/toy_model/index.html |
| Nanda: Mech Interp Prerequisites | https://www.neelnanda.io/mechanistic-interpretability/prereqs |
| Nanda: Transformer Circuits Walkthrough | https://www.neelnanda.io/mechanistic-interpretability/a-walkthrough-of-a-mathematical-framework-for-transformer-circuits |

---

## 2. Application Architecture

### 2.1 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | Express.js (minimal) | Thin REST API serving the frontend and handling DB reads/writes |
| **Database** | SQLite via better-sqlite3 | Single-file persistence, synchronous, zero-config |
| **Frontend framework** | React 18+ with hooks | Component-based, excellent ecosystem |
| Routing | React Router v6 | Client-side routing between views |
| Styling | Tailwind CSS + CSS custom properties | Utility-first with theme variables |
| State | React Context + useReducer | Lightweight, no external dependency |
| Data fetching | Simple fetch wrapper (no library needed) | ~10 API endpoints, all simple CRUD |
| Markdown rendering | react-markdown + remark-gfm | Render slot descriptions with links, bold, etc. |
| Charts | Recharts | Lightweight, React-native charting |
| Calendar | Custom component (no library) | Full control over the week-slot layout |
| Icons | Lucide React | Clean, consistent icon set |
| Build | Vite | Fast dev server and build |
| Date utilities | date-fns | Lightweight date manipulation |

### 2.2 Project Structure

```
study-dashboard/
├── server/
│   ├── index.ts                    # Express app entry point
│   ├── db.ts                       # SQLite connection + schema init
│   ├── routes/
│   │   ├── completions.ts          # CRUD for slot completions
│   │   ├── confusionLog.ts         # CRUD for confusion log entries
│   │   ├── weekNotes.ts            # Read/write week notes
│   │   ├── settings.ts             # Read/write user settings
│   │   └── backup.ts               # Export/import full database as JSON
│   └── progress.db                 # SQLite database file (gitignored, auto-created)
├── src/
│   ├── api/
│   │   └── client.ts               # Fetch wrapper for all API calls
│   ├── data/
│   │   └── studyPlan.json          # Full static study plan
│   ├── context/
│   │   └── ProgressContext.tsx      # React context for user progress state
│   ├── hooks/
│   │   ├── useProgress.ts          # CRUD operations on completions (via API)
│   │   ├── useConfusionLog.ts      # CRUD for confusion log entries (via API)
│   │   └── useCurrentWeek.ts       # Compute current/active week from date
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Top-level layout: sidebar + main
│   │   │   ├── Sidebar.tsx          # Navigation + phase progress bars
│   │   │   └── Header.tsx           # Current week indicator + streak
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx    # Landing page: today's tasks + stats
│   │   │   ├── TodayPanel.tsx       # What to do today (context-aware)
│   │   │   ├── StatsGrid.tsx        # Key metrics cards
│   │   │   └── StreakTracker.tsx     # Daily completion streak
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx     # Full calendar page
│   │   │   ├── MonthGrid.tsx        # Month-level calendar grid
│   │   │   ├── WeekRow.tsx          # Single week with slot indicators
│   │   │   └── DayCell.tsx          # Individual day cell with status dot
│   │   ├── weekly/
│   │   │   ├── WeekView.tsx         # Detailed week page
│   │   │   ├── SlotCard.tsx         # Individual task card with checkbox
│   │   │   └── WeekProgress.tsx     # Week-level progress ring
│   │   ├── phases/
│   │   │   ├── PhaseView.tsx        # Phase overview page
│   │   │   └── PhaseCard.tsx        # Phase summary with progress
│   │   ├── resources/
│   │   │   └── ResourcesView.tsx    # All links, searchable/filterable
│   │   ├── confusion/
│   │   │   ├── ConfusionLogView.tsx # Full confusion log page
│   │   │   └── ConfusionEntry.tsx   # Single entry with resolve toggle
│   │   └── shared/
│   │       ├── ProgressRing.tsx     # Circular progress indicator
│   │       ├── ProgressBar.tsx      # Linear progress bar
│   │       ├── Checkbox.tsx         # Styled completion checkbox
│   │       └── MarkdownBlock.tsx    # Renders markdown slot descriptions
│   ├── utils/
│   │   ├── dateUtils.ts            # Week calculations, "is today" checks
│   │   └── progressCalc.ts         # Compute % complete per week/phase/total
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                   # Tailwind directives + CSS variables
├── STUDY_PLAN.md                   # Original markdown (source of truth)
├── package.json
└── vite.config.ts                  # Proxy /api → Express in dev
```

### 2.3 Backend API

The Express server is minimal — a thin CRUD layer over SQLite. It also serves the built Vite frontend in production. In development, Vite's dev server proxies `/api/*` to Express.

**Startup:** On first run, the server auto-creates `progress.db` and runs the schema migration (the `CREATE TABLE IF NOT EXISTS` statements from §1.2). No manual setup needed.

**Endpoints:**

```
GET    /api/completions                 → all completion records
PUT    /api/completions/:slotId         → upsert a completion (body: { completed, notes, difficulty })
DELETE /api/completions/:slotId         → remove a completion record

GET    /api/confusion-log               → all entries (query params: ?resolved=true/false, ?weekId=...)
POST   /api/confusion-log               → create entry (body: { topic, description, weekId })
PUT    /api/confusion-log/:id           → update entry (body: partial fields)
DELETE /api/confusion-log/:id           → delete entry

GET    /api/week-notes/:weekId          → get notes for a week
PUT    /api/week-notes/:weekId          → upsert notes (body: { notes })

GET    /api/settings                    → get user settings
PUT    /api/settings                    → update settings (body: partial fields)

GET    /api/backup                      → export entire DB as JSON (all tables)
POST   /api/backup                      → import JSON, replacing all data (with confirmation token)
```

All responses are JSON. Errors return `{ error: string }` with appropriate HTTP status codes. The API is intentionally simple — no auth (it's a local personal tool), no pagination (< 300 rows ever).

**Running the app:**

```bash
# Development (two processes)
npm run dev:server    # Express on :3001
npm run dev:client    # Vite on :5173, proxies /api → :3001

# Production
npm run build         # Vite builds to dist/
npm start             # Express serves dist/ + API on :3001
```

---

## 3. Views & Pages

### 3.1 Dashboard (Home — `/`)

The default landing page. Purpose: answer "what should I do right now?" and give a quick pulse on overall progress.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  HEADER: "Week 5 of 31 · Phase 1: Linear Algebra"  │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   TODAY'S TASKS      │    PROGRESS OVERVIEW         │
│                      │                              │
│   [ ] Train 1:       │    Overall: ████░░ 16%       │
│       Lecture 24...  │    Phase 1: ████████░ 71%    │
│   [ ] Train 2:       │    This week: ██░░░░░ 29%   │
│       Lecture 26...  │                              │
│                      │    Streak: 🔥 12 days        │
│   (context-aware:    │                              │
│    shows what's      │    ┌─────────────────┐       │
│    relevant for      │    │  MINI CALENDAR   │       │
│    today's day       │    │  (current month) │       │
│    of the week)      │    └─────────────────┘       │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  UPCOMING: Next uncompleted tasks across the week   │
├─────────────────────────────────────────────────────┤
│  RECENT CONFUSION LOG ENTRIES (last 3, unresolved)  │
└─────────────────────────────────────────────────────┘
```

**"Today's Tasks" logic:**

The plan defines 7 slots per week: Train 1–4 (commute days) and Evening 1–3. The dashboard should map these to actual days of the week. Default mapping (user can customise in settings):

| Day | Slots |
|-----|-------|
| Monday | Train 1 |
| Tuesday | Train 2, Evening 1 |
| Wednesday | Train 3 |
| Thursday | Train 4, Evening 2 |
| Friday | — (rest or catch-up) |
| Saturday | Evening 3 |
| Sunday | Rest |

The "Today" panel shows the slots mapped to the current day of the week, within the current active week. If all are already completed, show a congratulatory message and the next uncompleted slot.

### 3.2 Calendar View (`/calendar`)

A full scrollable calendar from March 2026 to October 2026.

**Requirements:**
- Month-by-month grid layout (standard Mon–Sun calendar grid)
- Each day cell shows coloured dots indicating slot status for that day:
  - Green dot = all slots for that day completed
  - Amber dot = some completed
  - Empty = no slots scheduled
  - Blue outline = today
  - Grey = future (not yet reachable)
- Clicking a day navigates to the corresponding week view with that day highlighted
- Phase boundaries are visually marked with coloured bands spanning the relevant weeks
- Buffer/consolidation weeks (7, 14, 21, 27) are visually distinct (hatched or lighter shade)
- A small legend below the calendar explains the dot colours

### 3.3 Week Detail View (`/week/:weekNumber`)

The core working view. Shows all 7 slots for a single week with full descriptions and completion checkboxes.

**Layout:**

```
┌──────────────────────────────────────────────────┐
│  ← Week 4 of 31                    14–20 April   │
│  Phase 1: Linear Algebra                         │
│  "Determinants & Eigenvalues"                    │
│  Progress: ██████░░░░ 4/7                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ MAIN TRACK ─────────────────────────────┐   │
│  │                                           │   │
│  │  [✓] Train 1                              │   │
│  │      Lecture 18: Properties of deter...   │   │
│  │      Lecture 19: Determinant formulas...  │   │
│  │      📎 Links: [Lecture 18] [Lecture 19]  │   │
│  │                                           │   │
│  │  [ ] Train 2                              │   │
│  │      Lecture 20: Cramer's rule, inve...   │   │
│  │      ...                                  │   │
│  │                                           │   │
│  │  [ ] Train 3                              │   │
│  │      Lecture 22: Diagonalisation...       │   │
│  │      ...                                  │   │
│  │                                           │   │
│  │  [ ] Evening 1                            │   │
│  │      Problems for Lectures 18–20...       │   │
│  │                                           │   │
│  │  [ ] Evening 2                            │   │
│  │      Problems for Lectures 21–22...       │   │
│  │      ⚡ CRITICAL tag                      │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ PARALLEL TRACK (Book) ──────────────────┐   │
│  │                                           │   │
│  │  [ ] Train 4                              │   │
│  │      Book §2.3–2.5: Empirical Bayes...   │   │
│  │                                           │   │
│  │  [ ] Evening 3                            │   │
│  │      Book exercises Ch 2 continued...     │   │
│  │      Connection: eigenvalues of...        │   │
│  │                                           │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ NOTES ──────────────────────────────────┐   │
│  │  [text area for week-level notes]         │   │
│  │  + Add to confusion log                   │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│        [← Previous Week]    [Next Week →]        │
└──────────────────────────────────────────────────┘
```

**Slot card features:**
- Large checkbox for completion toggle
- Full markdown-rendered description
- Extracted hyperlinks displayed as clickable chips/buttons below the description
- Optional difficulty rating (easy / medium / hard) shown as small coloured dots after completion
- Optional notes field (expandable) per slot
- Visual distinction between Main Track and Parallel Track (Book) slots
- "CRITICAL" badge parsed from descriptions containing `**critical**` or similar emphasis
- "Connection:" paragraphs rendered with a distinct left-border accent style
- Timestamp shown when completed ("Completed 2 days ago")

### 3.4 Phase Overview (`/phases`)

Shows all 5 phases as cards with aggregate progress.

**Each phase card shows:**
- Phase number, title, course name
- Date range
- Progress bar (slots completed / total slots in phase)
- Book chapters covered
- Link to course URL
- Completion status badge
- The phase rationale text (collapsible)
- List of weeks within the phase (compact, with progress indicators)

### 3.5 Resources (`/resources`)

A searchable, categorised list of all study resources.

**Categories:**
- Courses (MIT OCW, Harvard Stat 110)
- Books (MML, Information Geometry)
- Video playlists (3Blue1Brown)
- Papers (Anthropic, Nanda)
- Reference (CS229 prob review, etc.)

Each resource is a card with: name, URL (opens in new tab), category badge, and which phases/weeks it's relevant to.

### 3.6 Confusion Log (`/confusion-log`)

A dedicated page for the confusion log, mirroring the study plan's recommendation.

**Features:**
- Add new entry: date (auto-filled), topic, description, week reference
- List of all entries, filterable by: resolved/unresolved, phase, week
- "Resolve" action: mark resolved + add resolution text
- Entries older than 2 weeks that are still unresolved get a visual "high priority" flag
- Export as markdown

### 3.7 Settings (`/settings`)

- Toggle dark/light theme
- Customise day-to-slot mapping (which days of the week you do Train 1, Train 2, etc.)
- Set actual start date (if different from 24 March 2026 — this shifts all week calculations)
- Export all progress data as JSON
- Import progress data from JSON
- Reset all progress (with confirmation dialog)

---

## 4. Key Interactions & Behaviours

### 4.1 Completion Toggling
- Clicking a slot checkbox marks it complete with current timestamp
- Clicking again uncompletes it (with confirmation if completed > 1 hour ago)
- Completion state is immediately persisted to the database via the API
- Completing all slots in a week triggers a subtle celebration animation
- Completing all slots in a phase triggers a larger celebration + shows the phase completion message from the study plan

### 4.2 Streak Tracking
- A "streak" counts consecutive days where at least one scheduled slot was completed
- Rest days (per the day-to-slot mapping) don't break the streak
- Displayed as a flame icon + day count in the header

### 4.3 Progress Calculations
- **Week progress** = completed slots / total slots in that week (always 7)
- **Phase progress** = completed slots / total slots in all weeks of that phase
- **Overall progress** = completed slots / total slots across all 31 weeks (217 total)
- **Time progress** = days elapsed since start / total days (for "ahead/behind schedule" indicator)

### 4.4 "Behind Schedule" Awareness
- Compare completion progress % against time progress %
- If time progress is more than 1 week ahead of completion progress, show a gentle amber indicator
- Never show anxiety-inducing red warnings — the study plan explicitly addresses falling behind and has buffer weeks

### 4.5 Navigation
- Sidebar always visible on desktop, collapsible on mobile
- Sidebar shows: Dashboard, Calendar, Phases (expandable to show weeks), Resources, Confusion Log, Settings
- Phase sections in sidebar show mini progress bars
- Current week is highlighted/bolded in sidebar
- Keyboard shortcuts: `←`/`→` to navigate weeks in week view, `d` for dashboard, `c` for calendar

---

## 5. Visual Design Direction

### 5.1 Aesthetic

**Direction: "Scholar's Workshop"** — warm, focused, slightly editorial. Think of a beautifully organised academic workspace: dark wood tones, cream paper, ink accents. Not corporate SaaS, not playful gamification. This is a serious tool for serious study.

### 5.2 Design Tokens

```css
/* Light theme */
--bg-primary: #FAF8F5;        /* warm off-white, like good paper */
--bg-secondary: #F0EDE8;      /* slightly darker for cards */
--bg-tertiary: #E8E4DD;       /* sidebar, hover states */
--text-primary: #2C2825;      /* near-black, warm */
--text-secondary: #6B6560;    /* muted for descriptions */
--text-tertiary: #9C9590;     /* timestamps, labels */
--accent-primary: #B44D2D;    /* burnt sienna — links, active states */
--accent-secondary: #2D6B4D;  /* deep green — completion, success */
--accent-book: #4A5899;       /* muted blue — book/parallel track */
--accent-warning: #C4873B;    /* amber — behind schedule */
--border: #DDD8D0;
--shadow: 0 1px 3px rgba(44, 40, 37, 0.08);

/* Dark theme */
--bg-primary: #1C1A17;
--bg-secondary: #252220;
--bg-tertiary: #2E2B28;
--text-primary: #E8E4DD;
--text-secondary: #9C9590;
--accent-primary: #D4724E;
--accent-secondary: #4CAF7D;
/* ... etc */
```

### 5.3 Typography

- **Headings:** A serif font. Recommendation: "Newsreader" (Google Fonts) — an editorial serif that feels scholarly without being stuffy. Or "Lora" as a fallback.
- **Body:** "Source Sans 3" or "IBM Plex Sans" — clean and readable for long task descriptions.
- **Monospace (for math notation):** "JetBrains Mono" — for inline references to variables, equations.

### 5.4 Key Visual Elements

- **Phase colour bands:** Each phase has a muted colour that appears as a left border on its weeks and a background tint on its calendar rows:
  - Phase 1 (Linear Algebra): warm terracotta
  - Phase 2 (Multivariable Calculus): olive green
  - Phase 3 (Probability): steel blue
  - Phase 4 (Statistics): plum
  - Phase 5 (ML Capstone): charcoal/gold
- **Slot type indicators:** Train slots get a small train/commute icon. Evening slots get a moon/lamp icon. Book slots get a book icon.
- **"Connection:" callouts:** When a slot description contains "Connection:", that paragraph is rendered in a special blockquote-style box with an accent left border and a subtle link-chain icon.
- **"CRITICAL" badges:** Tasks whose descriptions contain "critical" in bold get a small flame badge.
- **Progress rings:** Used for week-level progress — circular SVG with animated fill.
- **Completion animations:** Checkbox fills with a satisfying spring animation. Checkmark draws in SVG stroke-dashoffset style.

---

## 6. Responsive Design

| Breakpoint | Layout |
|------------|--------|
| ≥1024px (desktop) | Sidebar (260px fixed) + main content. Week view uses 2-column layout (main track / book track side by side). |
| 768–1023px (tablet) | Sidebar collapses to icons-only (60px). Week view goes single-column. Calendar cells slightly smaller. |
| <768px (mobile) | Sidebar hidden behind hamburger menu. Full-width single column. Calendar shows week view instead of month grid. Slot cards are full-width stacked. |

---

## 7. Data Export / Backup

The SQLite database file (`server/progress.db`) is the single source of truth. Backup options:

1. **File-level backup:** The simplest approach — just copy `progress.db`. The settings page should display the database file path for easy reference.
2. **JSON export:** Settings page has "Export Progress" button → calls `GET /api/backup` → downloads a `.json` file containing all tables serialised as JSON. Useful for portability.
3. **JSON import:** Settings page has "Import Progress" button → file picker for `.json` → calls `POST /api/backup` with the data, replacing all existing progress. Requires a confirmation dialog.
4. **Reset:** "Reset all progress" button that truncates all tables (with double-confirmation).

---

## 8. Edge Cases & Rules

1. **Week boundaries:** A week runs Monday to Sunday. The start date is Monday 24 March 2026. Week N starts on startDate + (N-1) × 7 days.
2. **Timezone:** Use the browser's local timezone for all date calculations.
3. **Completing future weeks:** Users CAN complete tasks in future weeks (they might work ahead). No restrictions.
4. **Completing past weeks:** Users CAN complete tasks in past weeks (they might catch up). No restrictions.
5. **Buffer weeks:** Weeks 7, 14, 21, 27 are buffer/consolidation weeks. They still have 7 slots and are tracked identically — they just have a visual "buffer" badge.
6. **Missing data gracefully:** If the database file is deleted or corrupted, the server recreates it with empty tables on startup. The study plan structure is always available from the static JSON — only user progress is lost.
7. **Large descriptions:** Some slot descriptions are quite long (multiple paragraphs with bold, links, and "Connection" sections). The UI must handle these gracefully — probably with an expandable/collapsible card that shows the first 2 lines by default and expands on click.

---

## 9. Implementation Phases (for Claude Code)

### Phase A: Data & Foundation
1. Initialise project: Vite + React + Tailwind for frontend, Express + better-sqlite3 for backend
2. **Extract and structure the full study plan into `studyPlan.json`** — this is the most time-consuming step. Every single week (1–31), every single slot (7 per week = 217 total), with full descriptions, extracted links, and metadata. Refer to the original markdown file at `/mnt/user-data/uploads/complete_maths_study_plan_final.md` for the complete content.
3. Build the SQLite database layer (`server/db.ts`) — connection, schema init, helper functions
4. Build the Express API routes (completions, confusion log, week notes, settings, backup)
5. Build the frontend API client (`src/api/client.ts`)
6. Build the ProgressContext provider (fetches from API, caches in React state)
7. Build date utility functions
8. Configure Vite proxy for development

### Phase B: Core Views
1. AppShell with sidebar navigation + React Router
2. Week Detail View (the primary working view) — with slot cards, checkboxes, markdown rendering, links
3. Dashboard View — today's tasks, progress stats, streak
4. Calendar View — month grids with status dots

### Phase C: Secondary Views & Polish
1. Phase Overview page
2. Resources page
3. Confusion Log (CRUD)
4. Settings page (theme toggle, day mapping, export/import)

### Phase D: Visual Polish & Interactions
1. Apply the full design system (colours, typography, spacing)
2. Completion animations
3. Phase celebration states
4. "Connection:" callout rendering
5. "CRITICAL" badge detection
6. Responsive layout refinements
7. Keyboard shortcuts

---

## 10. Acceptance Criteria

The dashboard is "done" when:

- [ ] All 31 weeks × 7 slots = 217 tasks are present with correct descriptions and links
- [ ] Every external URL from the study plan is clickable and opens in a new tab
- [ ] Ticking a checkbox persists across page refresh
- [ ] The calendar view shows all 8 months (March–October 2026) with correct day mapping
- [ ] Clicking a day in the calendar navigates to the correct week
- [ ] Progress percentages update immediately on completion toggle
- [ ] The "today" panel correctly identifies which slots map to the current day
- [ ] Confusion log entries can be created, edited, resolved, and filtered
- [ ] Progress can be exported as JSON and re-imported without data loss
- [ ] The app starts with a single `npm start` command (Express serves both API and frontend)
- [ ] The database file is auto-created on first run with no manual setup
- [ ] Dark and light themes both work correctly
- [ ] The app is usable on mobile (320px viewport)

---

## Appendix A: Content to Parse from the Study Plan

The original study plan markdown (attached) contains **31 weeks** organised as follows. Each week's content must be faithfully transcribed into the JSON data file:

| Phase | Weeks | Course |
|-------|-------|--------|
| Phase 1: Linear Algebra | 1–7 (incl. buffer wk 7) | MIT 18.06SC |
| Phase 2: Multivariable Calculus | 8–14 (incl. buffer wk 14) | MIT 18.02SC |
| Phase 3: Probability | 15–21 (incl. buffer wk 21) | Harvard Stat 110 |
| Phase 4: Statistics | 22–27 (incl. buffer wk 27) | MIT 18.650 |
| Phase 5: ML Capstone | 28–31 | MML Book + ARENA |

Each week has exactly 7 slots: Train 1, Train 2, Train 3, Train 4, Evening 1, Evening 2, Evening 3.

The slot descriptions must include:
- Lecture/section references (e.g., "Lecture 24: Markov matrices, Fourier series")
- Book section references (e.g., "Book §3.1–3.2")
- Special instructions (e.g., "under timed conditions", "from scratch", "from memory")
- "Connection:" paragraphs (verbatim from the plan)
- "CRITICAL" / emphasis markers

## Appendix B: Session Structure Guidance

These structures should be displayed as collapsible help text at the top of relevant slot cards:

**For Evening 1–2 (Problem sessions):**
- First 15 min: skim train notes, re-derive one key result from memory
- Next 60 min: work through assigned problems without solutions open
- Final 15 min: check solutions, note errors, update confusion log

**For Evening 3 (Book sessions):**
- First 30 min: re-read key sections from the week's book chapter, annotate
- Next 45 min: work through the book's worked examples and exercises
- Final 15 min: write a short paragraph connecting the book material to the main course topic

## Appendix C: The Original Study Plan

The complete source of truth is the file: `complete_maths_study_plan_final.md`

This file should be included in the project repository so Claude Code can reference it directly during data extraction. Copy it to the project root as `STUDY_PLAN.md`.

## Appendix D: Data Extraction Guide

A sample JSON file (`studyPlan_sample.json`, included alongside this plan) contains the first 3 weeks fully structured. Use it as the exact template for all 31 weeks. Here are the extraction rules:

### Slot ID Convention
Pattern: `week-{N}-{type}-{slotNumber}` where type is `train` or `evening`.
Examples: `week-1-train-1`, `week-14-evening-3`, `week-31-train-4`.

### Tag Detection
Scan each slot description for these patterns and populate the `tags` array:

| Pattern in description | Tag value |
|----------------------|-----------|
| `**critical**` or `critical for interpretability` (case-insensitive) | `"critical"` |
| `Connection:` (followed by explanatory text) | `"connection"` |
| `**Key exercise:**` | `"key-exercise"` |
| `**Checkpoint.**` or `**Capstone**` | `"checkpoint"` |
| `**Derivation:**` or `**Derivation exercise:**` | `"derivation"` |
| `**Interpretability exercise:**` | `"interpretability"` |
| `under timed conditions` | `"timed"` |
| `from scratch` or `from memory` | `"from-scratch"` |
| `3Blue1Brown` | `"3b1b"` |

### Link Extraction
- Train 1–3 slots in each phase should link to that phase's main course URL
- Train 4 (book) slots don't typically have external links unless a specific URL is mentioned
- Evening 1–2 slots link to the course URL (problem sets come from the course)
- Evening 3 (book) slots don't typically have external links
- Special cases: some slots reference 3Blue1Brown playlists, Neel Nanda videos, Anthropic papers, ARENA — capture these as additional links
- In Phase 5, slots reference multiple resources (MML book, ARENA) — include all relevant URLs

### isBookSlot Logic
- Train 4 → always `true` (parallel book reading)
- Evening 3 → always `true` (book exercises + connection writing)
- All other slots → `false`

### estimatedMinutes
- All train slots → `120` (2 hours)
- All evening slots → `90` (1.5 hours)

### Buffer Weeks
Weeks 7, 14, 21, and 27 have `isBuffer: true`. Their content is revision, re-watching, exam re-attempts, and checkpoint exercises. They still have the standard 7 slots.

### Phase 4 Special Note
MIT 18.650's problem sets do NOT have published solutions. This should be noted in the Phase 4 description and potentially surfaced in the UI as an info banner on weeks 22–27.

### Phase 5 Structural Difference
In Phase 5 (weeks 28–31), the slot pattern changes:
- Train slots split between MML book chapters and ARENA exercises (not a single main course)
- Train 4 is no longer always "book reading" — it may be MML exercises or ARENA setup
- Evening slots include coding exercises (ARENA) alongside derivations
- The `isBookSlot` flag becomes less meaningful here; use tags instead to distinguish MML vs ARENA vs paper-reading content

### Date Calculation
Week 1 starts Monday 24 March 2026. Each subsequent week starts 7 days later:
```
Week N startDate = 2026-03-24 + (N - 1) × 7 days
Week N endDate   = startDate + 6 days
```

### Markdown Preservation
Slot descriptions should preserve the markdown formatting from the source:
- `**bold**` for emphasis and section references
- `*italic*` for book titles
- Inline math notation like `P = A(AᵀA)⁻¹Aᵀ` as plain text (not LaTeX)
- The full text after `Connection:` should be preserved verbatim

## Appendix E: Sample JSON File

The file `studyPlan_sample.json` (included with this plan) contains:
- The complete top-level structure (schedule, resources, all 5 phase shells)
- Weeks 1–3 fully populated with all 21 slots
- Placeholder markers (`__EXTRACT_FROM_MARKDOWN__`) for weeks 4–31

Claude Code should use weeks 1–3 as the exact template and extract the remaining 28 weeks from `STUDY_PLAN.md` following the rules in Appendix D.

## Appendix F: Key UI Wireframes

### F.1 — Week Detail View (Primary Working View)

```
┌────────────────────────────────────────────────────────────────┐
│ ← Wk 3                          Phase 1: Linear Algebra       │
│ ORTHOGONALITY & PROJECTIONS                    7–13 April      │
│ ●●●●○○○  4 of 7                                               │
├────────────────────────────────┬───────────────────────────────┤
│                                │                               │
│  MAIN TRACK                    │  PARALLEL TRACK (BOOK)        │
│  ─────────                     │  ────────────────────         │
│                                │                               │
│  [✓] TRAIN 1          2h       │  [ ] TRAIN 4           2h     │
│  Lecture 14: Orthogonal        │  **Book §2.1–2.2:**           │
│  vectors and subspaces.        │  Posterior and posterior       │
│  Lecture 15: Projections       │  predictive, de Finetti       │
│  onto subspaces                │  and exchangeability           │
│  🔗 18.06SC                    │                               │
│  ✅ Completed 2 days ago       │                               │
│                                │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─        │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │                               │
│                                │  [ ] EVENING 3         1.5h   │
│  [✓] TRAIN 2          2h       │  **Book exercises Ch 2.**     │
│  Lecture 16: Projection        │                               │
│  matrices and least squares.   │  ┌─ CONNECTION ─────────┐    │
│  Lecture 17: Orthogonal        │  │ Linear probes in      │    │
│  matrices and Gram-Schmidt     │  │ interpretability are   │    │
│  🔗 18.06SC                    │  │ exactly least-squares  │    │
│                                │  │ projections — you're   │    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │  │ projecting activations │    │
│                                │  │ onto a subspace to     │    │
│  [✓] TRAIN 3          2h       │  │ test if a concept is   │    │
│  Recitation videos for         │  │ linearly represented   │    │
│  lectures 14–17. Work through  │  └───────────────────────┘    │
│  the projection derivation     │                               │
│  again on paper                │                               │
│                                │                               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │                               │
│                                │                               │
│  [ ] EVENING 1  🔥 CRIT 1.5h  │                               │
│  Problems for Lectures 15–16   │                               │
│  (projections and least        │                               │
│  squares — critical for        │                               │
│  interpretability)             │                               │
│  🔗 18.06SC                    │                               │
│                                │                               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─         │                               │
│                                │                               │
│  [ ] EVENING 2         1.5h    │                               │
│  Problems continued.           │                               │
│  **Key exercise:** derive the  │                               │
│  projection matrix             │                               │
│  P = A(AᵀA)⁻¹Aᵀ from scratch │                               │
│  and explain geometrically     │                               │
│  why P² = P                    │                               │
│                                │                               │
├────────────────────────────────┴───────────────────────────────┤
│  📝 WEEK NOTES                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Type notes here...                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  [+ Add to confusion log]                                      │
├────────────────────────────────────────────────────────────────┤
│     [← Week 2: Vector Spaces]        [Week 4: Determinants →] │
└────────────────────────────────────────────────────────────────┘
```

### F.2 — Dashboard (Home)

```
┌────────────────────────────────────────────────────────────────┐
│  Week 3 of 31 · Phase 1: Linear Algebra         🔥 8-day streak│
├────────────────────────────────┬───────────────────────────────┤
│                                │                               │
│  📅 TODAY — Wednesday          │  PROGRESS                     │
│                                │                               │
│  Your scheduled slot:          │  Overall     ██░░░░░░░░  9%   │
│                                │  Phase 1     ████░░░░░░ 43%   │
│  ┌──────────────────────────┐  │  This week   ●●●●○○○    4/7   │
│  │ [ ] Train 3       2h     │  │                               │
│  │ Recitation videos for    │  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  │ lectures 14–17. Work     │  │                               │
│  │ through the projection   │  │  HOURS THIS WEEK              │
│  │ derivation again on      │  │  8.5 / 14.5 hrs              │
│  │ paper                    │  │                               │
│  │ 🔗 18.06SC               │  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  └──────────────────────────┘  │                               │
│                                │  MARCH 2026                   │
│                                │  Mo Tu We Th Fr Sa Su         │
│  NEXT UP                       │                    1          │
│                                │   2  3  4  5  6  7  8         │
│  [ ] Train 4 (Thu)             │   9 10 11 12 13 14 15         │
│  Book §2.1–2.2: Posterior...   │  16 17 18 19 20 21 22         │
│                                │  23 ●  ●  ●  ●  27 28         │
│  [ ] Evening 1 (Tue)           │  29 ●  ●  ◐  .  .  .         │
│  Problems for Lectures 15–16   │                               │
│                                │  ● = all done  ◐ = partial    │
├────────────────────────────────┴───────────────────────────────┤
│  ⚠️ UNRESOLVED CONFUSION LOG (2 entries)                       │
│  · "Why does Gram-Schmidt lose orthogonality numerically?"     │
│  · "Connection between column space and linear probes"         │
│  [View full log →]                                             │
└────────────────────────────────────────────────────────────────┘
```

### F.3 — Calendar View

```
┌────────────────────────────────────────────────────────────────┐
│  STUDY CALENDAR                                    [Legend ▼]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  MARCH 2026                            Phase 1: Linear Algebra │
│  Mo   Tu   We   Th   Fr   Sa   Su     ██████████████████████  │
│                                 1                              │
│   2    3    4    5    6    7    8                               │
│   9   10   11   12   13   14   15                              │
│  16   17   18   19   20   21   22                              │
│ ┌─── Week 1: Vectors, Matrices & Elimination ────────────────┐│
│ │ 23   24●  25●  26●  27●  28◐  29   │  Phase 1 (terracotta) ││
│ └────────────────────────────────────────────────────────────┘│
│ ┌─── Week 2: Vector Spaces & the Four Subspaces ────────────┐│
│ │ 30●  31●                                                   ││
│                                                                │
│  APRIL 2026                                                    │
│  Mo   Tu   We   Th   Fr   Sa   Su                              │
│ │           1●   2●   3    4○   5    │                        │
│ └────────────────────────────────────────────────────────────┘│
│ ┌─── Week 3: Orthogonality & Projections ────────────────────┐│
│ │  6    7●   8●   9●  10◐  11   12○  13   │                  ││
│ └────────────────────────────────────────────────────────────┘│
│ ┌─── Week 4: Determinants & Eigenvalues ─────────────────────┐│
│ │ 14○  15○  16○  17○  18   19○  20   │                       ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│  ... (scrolls through to October 2026) ...                     │
│                                                                │
│  ● = all slots done   ◐ = some done   ○ = scheduled, not done │
│  Shaded rows = phase colour bands                              │
│  ░░ hatched = buffer/consolidation weeks                       │
└────────────────────────────────────────────────────────────────┘
```

### F.4 — Sidebar Navigation

```
┌──────────────────────────┐
│  📐 MATHS DASHBOARD      │
│                          │
│  ▸ Dashboard             │
│  ▸ Calendar              │
│                          │
│  PHASES                  │
│  ─────                   │
│  ▾ 1. Linear Algebra     │
│    ████████░░ 71%        │
│    Wk 1 ✓ Wk 2 ✓        │
│    Wk 3 ◐ Wk 4 ○        │
│    Wk 5 ○ Wk 6 ○        │
│    Wk 7 ○ (buffer)      │
│                          │
│  ▸ 2. Multivariable Calc │
│    ░░░░░░░░░░  0%        │
│                          │
│  ▸ 3. Probability        │
│    ░░░░░░░░░░  0%        │
│                          │
│  ▸ 4. Statistics         │
│    ░░░░░░░░░░  0%        │
│                          │
│  ▸ 5. ML Capstone        │
│    ░░░░░░░░░░  0%        │
│                          │
│  ─────────────────       │
│  ▸ Resources             │
│  ▸ Confusion Log (2)     │
│  ▸ Settings              │
│                          │
│  ─────────────────       │
│  Overall: ██░░░░░░ 9%    │
│  14 / 217 tasks          │
└──────────────────────────┘
```

