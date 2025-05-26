# DevLog – The Developer Productivity & Daily Log Tool

## User Roles
- Developer
- Manager

## Core Features
1.  **Authentication**: Developers and Managers (JWT-based auth).
2.  **Developer Dashboard**: Submit daily work logs with tasks completed (Rich Text), time spent, mood (emoji or scale), blockers (optional). See personal productivity heatmap (weekly/monthly). View/edit previous submissions.
3.  **Manager View**: View logs of developers in their team. Filter logs by Date, Developer, Task tags, Blockers. Add feedback or mark logs as "Reviewed".
4.  **Notification System**: Reminder to submit log if not done by 10 PM. Manager notified when logs are submitted.
5.  **Export & Reports**: Generate weekly productivity summaries (PDF or CSV).

## Tech Stack
-   **Frontend**: NextJs, Tailwind CSS, shadcn/ui
-   **Backend**: NestJS, PostgreSQL, TypeORM

## 🚀 User

### 👤 Manager Flow
1. **Register/Login** as a Manager  
2. Access the **Manager Dashboard**
3. **View daily logs** submitted by developers on your team
4. **Filter logs** by:
   - Date  
   - Developer  
   - Task Tags  
   - Blockers  
5. **Provide feedback** or **mark logs as Reviewed**
6. Receive **notifications** when logs are submitted
7. **Export reports** (weekly summaries in PDF/CSV)

---

### 👨‍💻 Developer Flow
1. **Register/Login** as a Developer  
2. Access the **Developer Dashboard**
3. **Submit daily log**:
   - Tasks completed (Rich Text)
   - Time spent  
   - Mood (Emoji or Scale)  
   - Blockers (Optional)  
4. **View/Edit previous submissions**
5. Visualize productivity with a **weekly/monthly heatmap**
6. Get a **10 PM reminder** if no log is submitted for the day


