# Generation Rise Portal - Client Demo & User Guide

Welcome to the **Generation Rise Portal**, a premium, responsive full-stack ecosystem designed to support gender equity and empower the next generation of female leaders in Rwanda. This platform bridges the gap between scholars, mentors, teachers, and system administrators through an integrated suite of features.

---

## 🌟 Platform Overview
The Generation Rise Portal is built to impress clients with its rich aesthetics, smooth animations, and role-based permissions. It scales from a public-facing website into a unified, authenticated operations hub.

```mermaid
graph TD
    User([Portal Visitor]) -->|Device Check| Viewport{Mobile Device?}
    Viewport -->|Yes| Login[Direct Login View]
    Viewport -->|No| Landing[Interactive Landing Page]
    Login --> Auth{Authentication}
    Auth --> Scholar[Scholar Dashboard]
    Auth --> Mentor[Mentor Dashboard]
    Auth --> Teacher[Teacher Dashboard]
    Auth --> Admin[Admin Dashboard]
```

---

## 🔑 Role-Based Experiences & Features

### 1. The Scholar (Student) Workspace
Designed to be engaging, encouraging, and easy to navigate for scholars on any device.

* **Interactive Curriculum Catalog:** 
  - Scholars can browse learning modules organized across four core pillars: *Career Readiness*, *Entrepreneurship*, *Professional English*, and *Life Skills*.
  - **Sequential Unlocking:** Modules unlock in a strict sequence (e.g., Lesson 2 only becomes accessible once Lesson 1 is completed/submitted), keeping study paths organized.
  - Hover tooltips explain exactly which preceding module needs to be finished to unlock the next card.
* **Lecture Study Desk:** 
  - Dynamic video player featuring video lecture playback.
  - **Interactive Checklist:** Tracks progress across three states (*Watch Video*, *Read Reference Document*, *Complete Short Quiz*). Checklists are saved persistently in browser storage.
  - **Auto-Check Progress:** Watching a video past 90% progress automatically checks the "Watch Video" box for the scholar.
* **Homework Submissions:**
  - Submit documents, PDF templates, or PNG images (up to 5MB) for grading.
* **Daily Study Streak Tracker:**
  - Features an active streak counter and gamified badges that grow with daily logins and completions to build lasting study habits.
* **Direct Mentor Chat:**
  - Real-time chat channel with assigned mentors for guidance.

---

### 2. The Mentor Workspace
Enables mentors to evaluate work, track performance, and maintain contact with their assigned scholars.

* **Grading Desk:** 
  - Mentors can view all pending homework submissions, open/preview documents, assign scores (0-100), and write constructive remarks.
* **Scholar Roster Tracker:** 
  - Trace scholar completion logs, streak numbers, and attendance ratios in a detailed tabular view.
* **Direct Messages (DMs):** 
  - Direct communication interface with scholars.

---

### 3. The Teacher Workspace
Empowers curriculum developers and program directors to configure learning materials.

* **Curriculum Management Suite:**
  - Create, modify, or delete course lessons.
  - **Rich Text Notes Editor:** Build detailed study guides with formatting (headers, bold, lists, and links) and view a live preview before publishing.
  - **Lesson Cover Photos:** Upload lesson backdrops or paste image URLs to customize the lecture player splash screens.
  - **Resource Attachments:** Upload files and worksheets directly to lessons.
* **Live Cohort Lifecycle Management:**
  - Real-time monitoring across all registered cohorts via `/api/cohorts`, including active enrollment headcounts, syllabus completion percentages, and university affiliations.
* **Broadcast Board:**
  - Post urgent bulletins, extend deadlines, and announce announcements visible on all user dashboards.

---

### 4. The Administrator Console
Offers full administrative control over the platform's security and directory configurations.

* **User Directory CRUD:**
  - Complete user management directory to add, edit, or delete accounts across all roles (Scholars, Mentors, Teachers, Admins).
* **Database Operations (System Config):**
  - **One-Click Reset:** Reset the SQLite database to its default seed state (syncing tables and restoring initial demo courses/accounts) in a single click.
  - **Security Panel:** Toggle mock SSL Sandboxing or enforce weekly NGO Compliance logging variables on the fly.

---

## 🤖 Intelligent AI Program Assistant
Integrated directly into the Rise Her Program Suite, providing generative assistance powered by Gemini & Groq with built-in resilient offline fallbacks.

> [!TIP]
> The AI assistant supports both live cloud LLM generation (when `GEMINI_API_KEY` or `GROQ_API_KEY` is configured) and deterministic high-quality offline fallbacks, ensuring reliable operation without breaking when external API connectivity is absent.

* **Participant Report Polish:** Helps scholars summarize milestones, challenges, and next-step goals with AI drafting.
* **Staff Feedback Generation:** Assists educators and mentors in authoring constructive review feedback on student reports and academic results.
* **Mentorship Objectives:** Formulates structured session roadmaps and cohort mission statements.

---

## 📱 Mobile-First Optimizations
The entire portal is optimized for mobile-first workflows:
* **Smart Mobile Bypass:** Hitting the site on a mobile device immediately bypasses the landing page to load the login screen directly, helping scholars access their dashboard quickly on the go.
* **Responsive Layout:** Bottom navigation bars and floating overlays dynamically adjust positions on mobile viewports to prevent screen overlap.
