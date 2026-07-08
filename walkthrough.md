# Walkthrough - System Enhancements & Operation Guide

This document summarizes the changes made to the full-stack portal to support database backup managers, interactive guide hubs, color system adaptations, and advanced chatbot utilities.

---

## 💾 1. Database Backup & Management
* **Reset Removed:** Dropped `POST /api/admin/reset` completely to prevent accidental database wiping.
* **Backup Creation & Download:** 
  - Implemented `POST /api/admin/backup` to copy `database.sqlite` securely into the `./backups` folder with precise timestamps.
  - Implemented `GET /api/admin/backup/download/:filename` (using secure parameter validation to block directory traversal) and `GET /api/admin/backups` to fetch backup file metadata.
* **Control Dashboard:** Added an interactive backup registry table inside `SettingsView.jsx`. Admins can trigger backups and download past SQLite files instantly.

---

## 📖 2. Interactive User Guide Section
* **Integrated Hub:** Designed a beautiful interactive guide block inside `LandingPage.jsx` featuring:
  - **Progress Checklists:** Let users check off guide items to advance a visual progress bar.
  - **Quick Search Filter:** Dynamically matches guide paragraphs in real-time.
  - **Illustrated Steps:** Selectable tabs (Scholar, Mentor, Teacher, Admin) to view role-based guides.
  - **Accordion FAQs:** Smooth expandable toggle cards for common operations.
  - **Print Layout styling:** Clean print media rules formatting the guide as a page-oriented document when calling `window.print()` (Print Guide / Save as PDF).

---

## 🌗 3. System Theme Color Adaptations
* **System preferences listener:** Registered an event listener to `window.matchMedia('(prefers-color-scheme: dark)')` in `App.jsx`.
* **Automatic sync:** If no custom theme override is found in `localStorage`, the application instantly switches stylesheets from Light to Dark mode without a page refresh when the user's OS theme changes.

---

## 🤖 4. Advanced AI Chatbot & Markdown Renderer
* **Markdown Parsing:** Created `MarkdownRenderer.jsx` to render bold text, italics, headers, lists, code containers, quotes, links, and pipe-delimited data tables correctly inside message bubbles.
* **Chat context history:** Modified the chat route to process logs array, matching previous assistant context prompts when answering follow-up queries.
* **Richer Interactions:**
  - Added copy-to-clipboard buttons on all chat replies.
  - Added a chat log history exporter to download conversations as `.txt` files.
  - Displays interactive suggestion chips for subsequent questions.

---

## 🚀 Verification Checks
* **Local Compilation:** Built and bundled successfully:
  ```powershell
  npm run build
  ```
  All modules and PostCSS rules loaded cleanly.
