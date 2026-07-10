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
