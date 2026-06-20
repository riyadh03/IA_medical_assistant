# Clinical Orientation System

A production-grade educational AI-powered clinical workflow simulator built with Next.js, React, and TypeScript.

## Overview

This frontend application simulates a multi-agent clinical orientation workflow, providing a professional healthcare software interface for:

- Patient consultation creation
- Structured patient interviews (5-question workflow)
- AI-generated clinical summaries
- Physician review (Human-in-the-Loop)
- Final report generation

## Design Philosophy

The interface is inspired by enterprise healthcare software (Epic EHR, Cerner, Microsoft Healthcare portals) with:

- **Professional Dashboard Aesthetics** - Sidebar navigation, workflow progress tracking, status badges
- **Structured Forms** - No chat bubbles; clinical-grade form interfaces
- **Medical Review Workstations** - Physician review page designed for clinical review workflows
- **Clear Workflow Management** - Visual timeline tracking all 5 steps of the consultation process
- **Enterprise Color Palette** - Professional indigo/blue primary color with orange accents

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui with Tailwind CSS v4
- **Language**: TypeScript
- **State**: React hooks + localStorage (for demo)
- **Icons**: Lucide React

## Project Structure

```
app/
├── layout.tsx                 # Root layout with sidebar wrapper
├── page.tsx                   # Dashboard
├── consultation/
│   ├── create/                # New Consultation page
│   ├── interview/             # 5-Question Interview
│   ├── clinical-summary/      # AI Summary & Recommendations
│   ├── physician-review/      # Physician Review Workstation
│   └── final-report/          # Complete Patient Report
components/
├── layout/
│   ├── app-layout.tsx         # Main layout wrapper
│   ├── sidebar.tsx            # Navigation sidebar
│   └── header.tsx             # Page header
└── shared/
    ├── card.tsx               # Reusable card component
    ├── status-badge.tsx       # Status indicators
    └── progress-timeline.tsx   # Workflow progress tracker
```

## Workflow Steps

### 1. Patient Information (Create Page)
- Collect basic patient demographics
- Chief complaint entry
- Form validation

### 2. Patient Interview (Interview Page)
- 5 structured questions
- Radio buttons, text inputs, textarea
- Progress tracking
- Question navigation with Previous/Next
- Visual progress bar

### 3. Clinical Summary (Summary Page)
- AI-generated clinical assessment
- Interim care recommendations
- Patient overview display
- Status: "Waiting for Physician Review"

### 4. Physician Review (Review Page)
- Read-only AI summary for reference
- Large textarea for physician clinical assessment
- "Approve & Generate Report" button
- "Request Modifications" button
- Professional review workstation styling

### 5. Final Report (Report Page)
- Complete patient information
- Full interview responses
- Clinical summary
- Physician review notes
- Download PDF button (placeholder)
- Copy report to clipboard
- Start new consultation button

## Features

- **Responsive Design** - Desktop-first, mobile compatible
- **Form Validation** - Required field validation with error messages
- **Progress Tracking** - Visual workflow progress on all pages
- **Status Indicators** - Color-coded status badges (Pending, In Progress, Completed, Review, Error)
- **Data Persistence** - LocalStorage for demo (ready for backend integration)
- **Professional UX** - Healthcare-grade interface design
- **Accessibility** - Semantic HTML, ARIA labels, focus management

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

The application will be available at `http://localhost:3000`

## Usage

1. **Dashboard** - View consultation metrics and recent cases
2. **Start New Consultation** - Begin consultation workflow
3. **Follow 5-Step Process**:
   - Fill patient information
   - Answer 5 interview questions
   - Review AI clinical summary
   - Provide physician assessment
   - Generate final report

## Design System

### Colors
- **Primary**: Indigo/Blue (#5856d6) - Professional medical brand
- **Accent**: Orange (#f59e0b) - Action highlights
- **Background**: Light Gray (#f7f7f7) - Clean canvas
- **Dark Mode**: Deep Blue (#0f172a) - Enterprise aesthetic

### Typography
- **Fonts**: Geist (sans) for UI, Geist Mono for code
- **Headings**: Bold, semantic sizing
- **Body**: 14-16px for readability

### Components
- Cards with subtle borders and shadows
- Rounded corners (0.625rem) for modern feel
- Consistent spacing system
- Professional form styling

## API Integration (Ready)

The frontend is structured to connect to a FastAPI backend:

```javascript
// Example integration points:
POST /api/consultations/create     // Patient info
POST /api/consultations/interview  // Submit answers
POST /api/consultations/summary    // Get AI summary
POST /api/consultations/review     // Physician review
GET  /api/consultations/{id}/report // Get final report
```

Currently uses localStorage for demo data.

## Important Disclaimer

This system is an **educational tool** demonstrating a multi-agent clinical workflow simulation. It is **NOT** a medical diagnosis application and should **NOT** be used for actual medical consultation.

**This system does not replace a medical consultation.**

All clinical decisions must be made by qualified healthcare professionals with appropriate medical training and licensing.

## Development Notes

- All components are React client components (use 'use client' directive)
- Local state management via React hooks
- Ready for integration with authentication system
- Can be extended with actual AI model endpoints
- Production-ready with TypeScript strict mode enabled

## Future Enhancements

- Backend API integration (FastAPI + LangGraph)
- Authentication system
- Real AI model integration
- PDF report generation
- Database persistence
- Email notifications
- MCP integration for knowledge retrieval
- Advanced analytics dashboard

## License

Educational project for PFE (Projet de Fin d'Études)
