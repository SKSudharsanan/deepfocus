# Deep Focus

**Deep Focus** is a personal productivity desktop app built with **Tauri**, **Vite**, **TypeScript**, and **Rust**.  
It’s designed to be your **one-stop productivity hub** , combining task management, time tracking, idea storage, reading & watch lists, goal planning, and content feeds, all in a privacy-first, offline-first app.

---

##  Features

- **Tasks & Subtasks**
  - Create, edit, and group tasks by category (Work, Personal, Project1, Project2, etc.)
  - Add subtasks with estimated vs actual time tracking
  - Progress calculation and completion status updates

- **Pomodoro & Time Tracking**
  - Built-in focus timer for tasks
  - Session logging for daily and weekly productivity reports

- **Idea Tracker**
  - Store and organize ideas for projects, videos, blogs, or travel

- **Reading & Watch Lists**
  - **To Read:** Add and manage articles or blog posts
  - **To Watch:** Add YouTube videos, categorized into Educational and Entertainment

- **Goals & Planning**
  - Track life goals and investment goals with progress indicators

- **Content Feeds**
  - Add and view RSS feeds from blogs
  - Fetch latest YouTube videos from favorite channels
  - View Twitter feeds from favorite people (via Nitter RSS)

- **Reports**
  - Daily and weekly summaries of:
    - Tasks completed
    - Total focus time
    - Content consumed
    - Goal progress

- **Privacy-First**
  - All data stored locally in SQLite
  - No cloud sync unless you choose to export/import manually

---

## Tech Stack

- [Tauri](https://tauri.app/) – Desktop application framework
- [Vite](https://vitejs.dev/) – Frontend tooling
- [TypeScript](https://www.typescriptlang.org/) – Strongly typed frontend logic
- [Rust](https://www.rust-lang.org/) – Backend commands and system integration
- [SQLite](https://www.sqlite.org/) – Local database storage

---

## Installation

### 1. Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/en/) (LTS recommended)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites/)

### 2. Clone the Repository
```bash
git clone https://github.com/<your-username>/deep-focus.git
cd deep-focus
```

### 3. Install Dependencies
```bash
# Frontend
npm install
# or
pnpm install
```

### 4. Run in Development Mode
```bash
npm run tauri dev
```

### 5. Build for Production
```bash
npm run tauri build
```

The production build will create native executables for your platform.

## Roadmap

	•	Task creation and grouping
	•	Subtask time tracking
	•	Pomodoro timer integration
	•	Idea Tracker
	•	Reading & Watching lists
	•	Goal planning module
	•	RSS & YouTube feed integration
	•	Twitter feed integration via Nitter
	•	Daily/Weekly reports
	•	Data export/import
    •	Mobile Integration

## License
This project is licensed under the MIT License — see the LICENSE file for details.
    



