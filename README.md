# HOHA Dashboard

## Project Structure

This project is organized as a React application using Vite, Tailwind CSS v4, and Supabase.

```
hoha-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/                # App shell (Sidebar, Header, DashboardLayout)
│   │   ├── shared/                # Reusable UI elements (StatsCard, PageHeader, etc.)
│   │   ├── educare/               # Components specific to the Educare module
│   │   ├── legacy/                # Components specific to the Legacy module
│   │   ├── clinicare/             # Components specific to the Clinicare module
│   │   └── food/                  # Components specific to the Food module
│   ├── pages/                     # Route components organized by feature
│   │   ├── auth/                  # Authentication pages
│   │   ├── educare/               # Educare views (Overview, Students, Attendance)
│   │   ├── legacy/                # Legacy views (Overview, Participants)
│   │   ├── clinicare/             # Clinicare views (Overview, Visits)
│   │   └── food/                  # Food distribution views
│   ├── hooks/                     # Custom React hooks for data fetching and logic
│   ├── lib/                       # Utilities and Supabase client configuration
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles and Tailwind v4 config
├── supabase/
│   └── migrations/                # Database schema definitions
├── vite.config.js                 # Vite configuration
├── jsconfig.json                  # JavaScript path aliases
└── package.json                   # Dependencies and scripts
```

## Features

- **Authentication**: Secure login via Supabase Auth.
- **Educare**: Manage student profiles, attendance, and overview statistics.
- **Legacy**: Track participants and profiles for the legacy program.
- **Clinicare**: Monitor clinic visits and health statistics.
- **Food Distribution**: Track food distribution events.
- **Shared UI**: Built with shadcn/ui and Tailwind CSS for a consistent design system.

