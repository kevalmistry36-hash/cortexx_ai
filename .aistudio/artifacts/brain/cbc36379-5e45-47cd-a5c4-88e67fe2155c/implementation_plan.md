# Cortexx AI Institute Management System & Ad Studio

A high-performance institute management portal and integrated ad creative generator designed for Cortexx AI Institute ("Where Thinking Meets Technology"), enabling streamlined student onboarding, course catalog management, automated invoice & receipt generation, and multi-format banner ad production.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following system decisions were established through Phase 1 user input and form the foundation for the build:

- **Confirmed Decision 1 (Core Application Focus)**: The system provides a unified hub for **Cortexx AI Institute Management** (students, course catalog, enrollments, fee tracking, and PDF invoices/receipts) combined with a dedicated **Course Ad & Banner Studio** to market programs across standard advertising channels.
- **Confirmed Decision 2 (Ad Formats & Display Sizes)**: Full support for all standard IAB display sizes (Medium Rectangle `300×250`, Leaderboard `728×90`, Wide Skyscraper `160×600`, Large Rectangle `336×280`, Billboard `970×250`) and social media sizes (Square `1080×1080`, Story `1080×1920`, Landscape `1200×628`).
- **Confirmed Decision 3 (Creative Customization Depth)**: Full interactive studio with editable headline/body/CTA copy, brand color switches (Cortexx Tech Dark, Neon Ember, Minimal Slate, Deep Space), course badge toggles, layout orientation adjustments, and 1-click image asset download (PNG/SVG).
- **Confirmed Decision 4 (Data Persistence & Cloud Sync)**: Instant zero-latency local storage (browser persistent state with JSON export/import backup) paired with an optional Supabase cloud synchronization panel in Settings (allowing entry of Supabase URL and Anon Key with automatic schema synchronization scripts).
- **Confirmed Decision 5 (Admin Security)**: Passcode gatekeeper with configurable Master PIN (default `2026`), manual 1-click lock button, and optional timeout lock.

---

## 1. Overview & Core Concept

- **What It Does**: Cortexx AI Institute Management & Ad Studio combines admissions workflows, course fee administration, and marketing creative generation into a single high-efficiency operational tool.
- **Target Audience / Persona**: Institute directors, admissions counselors, program coordinators, and growth marketers at Cortexx AI Institute.
- **Key Value**:
  1. Reduces administrative overhead to a simple 5-step flow: **Add Student → Select Course → Record Payment → Generate Invoice → Download / Share PDF**.
  2. Empowers institute staff to generate on-brand, publication-ready banner ads in seconds directly from course outlines and URLs without hiring external graphic designers.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Dashboard & Metric Command**:
   - 4 primary metric cards: **Total Students**, **Active Courses**, **Payments Collected (₹)**, and **Pending Fees (₹)** with monospace tabular formatting.
   - 4 high-visibility primary action buttons: `Add Student`, `Add Course`, `Generate Invoice`, and `Open Banner Studio`.
   - Quick-access activity stream detailing recent admissions and latest fee transactions.

2. **Student Admissions & Directory**:
   - Sequential, concurrency-safe Student ID generation (`COR-STU-2026-0001`, `COR-STU-2026-0002`...) and Enrollment ID (`COR-ENR-2026-0001`...).
   - Validated fields: Student Full Name, Phone Number (+91 format validation), Email, Enrolled Course, Enrollment Date, Amount Paid, and Payment Method.
   - Searchable, filterable student directory with Fee Status indicators (`Paid`, `Partial`, `Pending`), fast payment recording, and individual profile inspector.

3. **Course Catalog Management**:
   - Pre-loaded with the flagship **1-Month Practical AI Course** (1 Month, 100% Online, ₹6,000, Certificate Included) detailing all 10 core modules:
     1. AI Tools & Productivity
     2. Prompt Engineering
     3. AI Image Generation
     4. AI Video Generation
     5. AI Voice & Audio
     6. AI Content Creation
     7. AI Automation
     8. AI Agents
     9. AI for Business & Marketing
     10. Real-World Projects
   - Course editor to adjust duration, fee, delivery mode, syllabus topics, and certification status.

4. **Invoice & Payment Receipts (PDF & WhatsApp)**:
   - Interactive invoice builder with student selection, course fee auto-fill, discount calculation, and remaining balance computation.
   - High-fidelity A4 Invoice & Receipt preview matching the Cortexx AI aesthetic:
     - Circuit brain logo and *"Where Thinking Meets Technology"* branding.
     - Official contact info: `+91 7984691082` | `info.cortexx@gmail.com`.
     - Student & Enrollment metadata, breakdown ledger in Indian Rupees (`₹`).
     - Actions: `Download PDF`, `Browser Print`, and direct `Share on WhatsApp` via `https://wa.me/` link.
   - Partial payment logger updating the outstanding balance in real time and producing standalone payment receipts.

5. **Banner Ad Studio (IAB & Social Formats)**:
   - Input panel: Select any enrolled course or enter a custom product description and target URL.
   - Instant AI-assisted or template copy generation (Headline, Value Proposition, Bullet Highlights, Action CTA).
   - Live multi-size canvas switcher:
     - **Medium Rectangle** (`300×250`)
     - **Leaderboard** (`728×90`)
     - **Wide Skyscraper** (`160×600`)
     - **Large Rectangle** (`336×280`)
     - **Billboard** (`970×250`)
     - **Social Square** (`1080×1080`)
     - **Social Story / Reel** (`1080×1920`)
     - **Landscape / Link Preview** (`1200×628`)
   - Customizer toolbar: Brand theme toggle (Cortexx Dark Orange, Cyber Circuit, Clean Editorial Slate), font scaling, badge toggles ("100% Online", "Certificate Included", "Limited Seats"), and direct high-res PNG download.

6. **Admin Security & Settings**:
   - Master PIN lock screen protecting student and financial records.
   - JSON export and import for instant database backup.
   - Supabase sync setup panel for cloud database connection.

### Visual Identity & Theme

- **Aesthetic Direction**: Sleek, high-contrast dark tech aesthetic anchored by deep charcoal/slate surfaces (`#0D1117`, `#161B22`), crisp typography, and vivid Cortexx Amber/Orange accents (`#FF6A00` / `#EA580C`).
- **Typography**: Clean display sans (`Plus Jakarta Sans`) paired with readable body text and monospace tabular numerals (`font-mono tabular-nums`) for currency, IDs, and dimensions.
- **Zero-Pill Discipline**: Metadata rendered as clean, unboxed text separated by typographic dividers (`·` or `/`). Statuses use subtle surface tones with accompanying text labels for clarity.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Canvas & Vector PDF Generation**
  - *Chosen Approach*: Implement client-side PDF document generation via `jspdf` and `html2canvas` paired with native `@media print` CSS.
  - *Why*: Delivers instantaneous, pixel-perfect A4 downloads and prints in the browser without relying on external third-party PDF APIs.
- **Decision 2: Interactive Real-Time Multi-Format Banner Renderer**
  - *Chosen Approach*: Responsive SVG/HTML canvas renderer with auto-scaling transform matrices and downloadable high-resolution image rendering via HTML5 Canvas.
  - *Why*: Allows instantaneous live previewing across all standard IAB and social sizes without rendering delays or server roundtrips.
- **Decision 3: Immutable Fee Snapshotting**
  - *Chosen Approach*: When a student enrolls, the fee, duration, and course metadata are captured as a snapshot in their enrollment and invoice records.
  - *Why*: Modifying a course fee in the catalog will never alter past invoices or distort historical accounting.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│               CORTEXX AI INSTITUTE & BANNER AD STUDIO                  │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Cortexx Wordmark │ Active View │ Admin Lock PIN │ Settings   │
├─────────────────┬──────────────────────────────────────────────────────┤
│                 │  [1] DASHBOARD: Metric Cards + Quick Actions         │
│  NAVIGATION:    │  [2] STUDENTS: Admissions Form + Searchable Table    │
│  - Dashboard    │  [3] COURSES: Catalog + Module Editor                │
│  - Students     │  [4] INVOICES: Generator + Ledger + A4 Vector View   │
│  - Courses      │  [5] AD STUDIO: IAB & Social Banner Generator        │
│  - Invoices     ├──────────────────────────────────────────────────────┤
│  - Ad Studio    │  MODALS & OVERLAYS:                                  │
│  - Settings     │  - A4 Printable Invoice Modal (PDF / WhatsApp)       │
│                 │  - Payment Logger & Receipt Preview                  │
│                 │  - PIN Unlock Gatekeeper Screen                      │
├─────────────────┴──────────────────────────────────────────────────────┤
│  DATA & CORE SERVICES LAYER:                                           │
│  - Storage Engine: LocalStorage Reactive Repository + JSON Backup      │
│  - Cloud Bridge: Supabase Sync Adapter & SQL Schema Generator          │
│  - Banner Canvas Engine: Dynamic SVG/DOM Canvas + Multi-size Scaler    │
│  - PDF Engine: jsPDF + html2canvas + Print Stylesheet Engine           │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Schemas

- **Student**:
  - `id`: string (`COR-STU-2026-XXXX`)
  - `name`: string
  - `phone`: string
  - `email`: string
  - `enrolledCourseId`: string
  - `enrolledCourseName`: string
  - `enrollmentId`: string (`COR-ENR-2026-XXXX`)
  - `enrollmentDate`: string (ISO)
  - `agreedFee`: number
  - `totalPaid`: number
  - `paymentStatus`: `'unpaid' | 'partially_paid' | 'paid'`
  - `createdAt`: string

- **Course**:
  - `id`: string
  - `name`: string
  - `duration`: string
  - `mode`: string
  - `fee`: number
  - `certificateIncluded`: boolean
  - `modules`: string[]
  - `isArchived`: boolean

- **Invoice**:
  - `invoiceNumber`: string (`COR-INV-2026-XXXX`)
  - `invoiceDate`: string
  - `studentId`: string
  - `studentName`: string
  - `studentPhone`: string
  - `studentEmail`: string
  - `courseName`: string
  - `courseDuration`: string
  - `courseFee`: number
  - `discount`: number
  - `totalPayable`: number
  - `amountPaid`: number
  - `remainingBalance`: number
  - `paymentMethod`: `'UPI' | 'Cash' | 'Bank Transfer' | 'Card'`
  - `paymentStatus`: `'unpaid' | 'partially_paid' | 'paid'`
  - `notes`: string

- **PaymentReceipt**:
  - `receiptNumber`: string (`COR-REC-2026-XXXX`)
  - `invoiceNumber`: string
  - `studentId`: string
  - `studentName`: string
  - `paymentDate`: string
  - `amountReceived`: number
  - `paymentMethod`: string
  - `remainingBalanceAfter`: number

- **BannerConfig**:
  - `headline`: string
  - `subheadline`: string
  - `badgeText`: string
  - `ctaText`: string
  - `targetUrl`: string
  - `theme`: `'dark' | 'orange' | 'minimal' | 'circuit'`
  - `selectedSize`: string

---

## 5. Implementation Steps (Post-Approval)

1. **Dependencies Installation**: Install `jspdf`, `html2canvas`, and `@supabase/supabase-js`.
2. **Metadata & HTML Setup**: Set app name to "Cortexx AI Institute & Ad Studio" in `metadata.json` and `index.html`.
3. **Core Store & Data Engine**: Build state management layer with auto-sequenced IDs, sample data, backup/restore, and Supabase sync helper.
4. **Dashboard & Admissions Workspace**: Build the responsive metric dashboard, student registration drawer, and student directory table.
5. **Course Catalog & Curriculum View**: Implement the course management interface pre-populated with the 1-Month Practical AI Course.
6. **Invoice & Receipt PDF Generator**: Implement the A4 invoice generator, live payment receipt modal, and WhatsApp dispatch link.
7. **Banner Ad Studio**: Implement the interactive multi-format ad generator supporting all 8 standard IAB and social sizes with instant PNG/SVG download.
8. **Admin PIN Lock**: Implement the session security barrier with passcode verification.
9. **Build Verification**: Run `compile_applet` and verify zero-defect execution.
