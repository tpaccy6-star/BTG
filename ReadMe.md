# Generation Rise Portal

## Problem Statement
There is a critical need to support gender equity and empower the next generation of female leaders in Rwanda. However, there often exists a gap in communication, resource accessibility, and structured learning between scholars, their mentors, educators, and the administrators running these programs. Without a unified, accessible, and engaging platform, it is challenging to deliver curriculum efficiently, track scholar progress, provide real-time mentorship, and manage system operations at scale.

## Solution
The **Generation Rise Portal** is a premium, responsive full-stack ecosystem designed to bridge this gap. It serves as a comprehensive, unified hub that connects scholars, mentors, teachers, and system administrators. Scaling from a welcoming public-facing website into a secure, authenticated operations platform, it delivers tailored, role-based experiences. The solution emphasizes modern aesthetics, mobile-first accessibility, and intelligent automation (such as a local AI Chatbot) to ensure users remain engaged and fully supported throughout their educational journey.

## Features

### 1. Scholar (Student) Workspace
Designed to be engaging, encouraging, and easy to navigate on any device.
* **Interactive Curriculum Catalog:** Browse learning modules across core pillars (*Career Readiness, Entrepreneurship, Professional English, Life Skills*). Features sequential unlocking to ensure organized study paths.
* **Lecture Study Desk:** Dynamic video player with an interactive checklist that tracks progress (*Watch Video, Read Reference, Complete Quiz*). Videos watched past 90% automatically check off progress.
* **Homework Submissions:** Submit documents, PDFs, or images for grading.
* **QR Attendance & Study Streak Tracker:** Log daily attendance to build study habits with an active streak counter.
* **Direct Mentor Chat:** Real-time chat channel with assigned mentors for personalized guidance.

### 2. Mentor Workspace
Enables mentors to effectively evaluate work, track performance, and maintain contact with their scholars.
* **Grading Desk:** View pending submissions, preview documents, assign scores (0-100), and provide constructive feedback.
* **Scholar Roster Tracker:** Monitor scholar completion logs, streaks, and attendance ratios in a detailed tabular view.
* **Direct Messages (DMs):** Dedicated communication interface with assigned scholars.

### 3. Teacher Workspace
Empowers curriculum developers and program directors to configure learning materials.
* **Curriculum Management Suite:** Create, modify, or delete course lessons. Includes a Rich Text Notes Editor for study guides, Lesson Cover Photos, and Resource Attachments.
* **Cohort Administration:** Monitor enrollment metrics and average attendance across simple cohorts.
* **Broadcast Board:** Post urgent bulletins, extend deadlines, and publish announcements visible across all user dashboards.

### 4. Administrator Console
Offers full administrative control over platform security and data operations.
* **User Directory CRUD:** Complete user management to add, edit, or delete accounts across all roles.
* **Database Backup & Management:** Secure control dashboard to trigger database backups, manage `.sqlite` backup files, and instantly download them.
* **Security & Compliance Panel:** Toggle mock SSL Sandboxing or enforce weekly NGO Compliance logging variables on the fly.

### 5. Dynamic AI Chatbot Assistant
A context-aware, locally hosted AI chatbot that sits at the bottom-right of the portal.
* **Role-Aware Assistance:** Tailors suggestions based on the logged-in role (e.g., reminding scholars about attendance, guiding teachers on lesson creation).
* **Advanced UI Capabilities:** Renders Markdown (bold, lists, tables), supports chat log history export, provides one-click copy buttons, and remembers conversational context.

### 6. Interactive User Guide Section
An integrated, beautiful guide hub located on the landing page.
* Features progress checklists, real-time quick search filters, accordion FAQs, and illustrated steps tailored by role. 
* Includes a clean print layout for exporting guides to PDF.

### 7. System Theme Adaptations
* **Automatic Dark/Light Mode:** Listens to OS-level color scheme preferences and seamlessly switches themes without requiring a page refresh.

### 8. Mobile-First Optimizations
* **Smart Mobile Bypass:** Automatically skips the landing page on mobile devices to load the login screen directly, speeding up dashboard access for scholars on the go.
* **Responsive Spacing:** Floating widgets dynamically adjust their positioning to avoid overlapping with bottom navigation elements on smaller screens.

## Project Structure

* `Frontend/` is the React and Vite single-page app. `Frontend/src/App.jsx` handles session state, hash-based view navigation, and role-specific dashboards; reusable screens live in `Frontend/src/views/` and navigation is in `Frontend/src/components/Sidebar.jsx`.
* `Backend/` is the Express API. Sequelize models and database configuration are in `Backend/models.js` and `Backend/database.js`. It uses SQLite for local development and PostgreSQL when `DATABASE_URL` is configured.
* The frontend and backend are separate packages in the same repository; install and run them from their respective folders.

## Clone and Run Locally

You will need Git and the current Node.js LTS release installed.

1. Clone the repository and enter the project folder:

   ```bash
   git clone https://github.com/tpaccy6-star/BTG.git
   cd BTG
   ```

2. In a terminal, install and start the backend:

   ```bash
   cd Backend
   npm install
   npm run dev
   ```

3. From the project root, open a second terminal and install and start the frontend:

   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (usually `http://localhost:5173`). The frontend proxies API requests to the backend at `http://localhost:5000`. SQLite is used by default for local development; set `DATABASE_URL` in the backend environment to use PostgreSQL.

## RISE HER Program Suite Integration

The RISE HER experience is integrated into the existing Generation Rise portal, using one frontend, API, database, and sign-in. The shared interface uses the orange-red, navy, coral, and gold palette; Quicksand headings; Nunito Sans body type; and the Generation Rise brand mark while retaining BTG's learning, cohort, profile, and mentor-chat workflows.

The program API is mounted at `/api/program`. It supports program dashboards; cohort member management; report submission, staff review, attachments, and AI-assisted drafting; academic results and reviews; Friendly Weeks pair generation and management; mentorship plans; support requests and assistance records; notifications through the existing notification API; and CSV exports. The React Program Suite reads and writes these APIs.

BTG accounts remain the source of truth: `scholar` accounts are participants, while `mentor`, `teacher`, and `admin` accounts have program staff access. Program-specific tables are added through Sequelize synchronization to the configured BTG database (SQLite locally, PostgreSQL when `DATABASE_URL` is set). The separate Generation Rise database and account records are not imported; no external database or Neon project was provisioned.
