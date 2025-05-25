# DevLog – The Developer Productivity & Daily Log Tool

## Scenario
Build an end-to-end platform that allows software developers to log their daily work, track tasks, reflect on productivity, and share updates with managers or peers.

## User Roles
- Developer
- Manager

## Core Features
1.  **Authentication**: Developers and Managers must log in securely (JWT-based or session-based auth).
2.  **Developer Dashboard**: Submit daily work logs with tasks completed (Rich Text), time spent, mood (emoji or scale), blockers (optional). See personal productivity heatmap (weekly/monthly). View/edit previous submissions.
3.  **Manager View**: View logs of developers in their team. Filter logs by Date, Developer, Task tags, Blockers. Add feedback or mark logs as "Reviewed".
4.  **Notification System**: Reminder to submit log if not done by 10 PM. Manager notified when logs are submitted.
5.  **Export & Reports**: Generate weekly productivity summaries (PDF or CSV).

## Tech Stack
-   **Frontend**: NextJs, Tailwind CSS, shadcn/ui
-   **Backend**: NestJS, PostgreSQL, TypeORM

