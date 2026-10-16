# AI Smart Task Planner

A full-stack task planner that turns a goal into a structured plan with tasks, priorities, estimates, and due dates. Saved plans and tasks are stored in PostgreSQL. The dashboard tracks task progress, and tasks with due dates can be reviewed and added as all-day events to Google Calendar.

## Features

- Generate task plans from a natural-language goal using Google Gemini.
- Choose a target date and enter custom available hours per day.
- Review generated plans before saving them.
- Save, edit, and delete plans and tasks.
- View dashboard statistics and upcoming deadlines.
- Connect Google Calendar and select due-dated tasks for event creation after a review and confirmation step.
- Use integer IDs for plans and tasks.

## Technology

- Frontend: React, TypeScript, Vite, React Router, Lucide icons
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- AI: Gemini API with response validation
- Calendar: Google Calendar API with OAuth 2.0

## Project Structure

```text
backend/
  prisma/             Prisma schema and migrations
  src/controllers/    HTTP handlers
  src/routes/         API routes
  src/services/       Database, Gemini, and Google Calendar logic
  src/lib/             Prisma client and ID helpers
frontend/my_app/
  src/components/     Shared app layout
  src/pages/          Home, dashboard, and workspace pages
  src/services/       Frontend API client
```

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL
- A Gemini API key
- Google OAuth credentials if you want to use Calendar integration

## Local Setup

### 1. Configure the backend

In PowerShell from the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
notepad backend/.env
```

Set the database and API credentials in `backend/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ai_smart_task_planner?schema=public"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.8-flash"
GEMINI_FALLBACK_MODEL="gemini-3.7-flash"
PORT=3001

GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/calendar/callback"
```

`DATABASE_URL` must point to an existing PostgreSQL database. URL-encode special characters in the database password. The model variables are optional; the backend has defaults. The Google OAuth variables are currently required when the backend starts, even if you are not using Calendar yet.

Do not commit `.env`, API keys, or OAuth tokens.

### 2. Configure Google Calendar (optional)

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen and add your account as a test user if the app is in testing mode.
4. Create an OAuth client ID for a Web application.
5. Add this authorized JavaScript origin:

   ```text
   http://localhost:5173
   ```

6. Add this authorized redirect URI exactly:

   ```text
   http://localhost:3001/api/calendar/callback
   ```

7. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`.

The app saves the granted Calendar tokens to the ignored local file `backend/.env.google-calendar` after OAuth completes. Do not add this file to Git. If the tokens are exposed, revoke the app’s access in your Google Account and reconnect.

### 3. Install and prepare the backend

```powershell
cd backend
npm ci
npm run prisma:validate
npm run prisma:generate
npx prisma migrate dev
```

For a database that already has the migrations applied, Prisma will report that there is nothing to migrate. Do not use `prisma migrate reset` unless you intentionally want to delete the database contents.

### 4. Install and start the frontend

Open a second terminal from the repository root:

```powershell
cd frontend/my_app
npm ci
npm run dev
```

The frontend is available at `http://localhost:5173`. The Vite development server proxies `/api` requests to `http://localhost:3001`, so `VITE_API_URL` is not needed for local development.

### 5. Start the backend

In the backend terminal:

```powershell
npm run dev
```

The backend listens at `http://localhost:3001`. Visit `http://localhost:5173/dashboard` to use the app.

## Common Commands

Run these commands from their respective project folders.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run frontend Oxlint (frontend only) |
| `npm run preview` | Preview the built frontend (frontend only) |
| `npm run prisma:validate` | Validate the Prisma schema (backend only) |
| `npm run prisma:generate` | Generate the Prisma client (backend only) |
| `npx prisma migrate dev` | Create/apply development migrations (backend only) |
| `npx prisma migrate deploy` | Apply committed migrations in deployment (backend only) |

The backend production start command is `npm start`; run `npm run build` first.

## API Reference

Base URL during local development: `http://localhost:3001`.

All successful JSON endpoints return a `success` property and, when applicable, a `data` property. Plan and task IDs are positive integers.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | API welcome message |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/plans` | List plans with their tasks |
| `POST` | `/api/plans` | Create a plan and its tasks |
| `GET` | `/api/plans/:id` | Get one plan and its tasks |
| `PATCH` | `/api/plans/:id` | Update a plan |
| `DELETE` | `/api/plans/:id` | Delete a plan and its tasks |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/gemini/generate` | Generate an unsaved plan |
| `GET` | `/api/calendar/status` | Check Google Calendar connection |
| `GET` | `/api/calendar/connect` | Start Google OAuth in a browser |
| `GET` | `/api/calendar/callback` | OAuth callback; normally opened by Google |
| `POST` | `/api/calendar/tasks/:id` | Add a due-dated task as a Google Calendar event |

There is no standalone `POST /api/tasks` endpoint; tasks are created through `POST /api/plans` as nested items.

### Example: create a plan with tasks

Postman request:

- Method: `POST`
- URL: `http://localhost:3001/api/plans`
- Header: `Content-Type: application/json`
- Body: raw JSON

```json
{
  "title": "Prepare a portfolio",
  "goalDescription": "Build a portfolio website",
  "targetDate": "2026-11-15",
  "tasks": [
    {
      "title": "Choose projects",
      "description": "Select three projects to feature",
      "priority": "HIGH",
      "estimatedMinutes": 60,
      "dueDate": "2026-10-25"
    }
  ]
}
```

The response includes the generated integer plan ID and task IDs. Use those values in later requests.

### Example: update a task

```http
PATCH http://localhost:3001/api/tasks/1
Content-Type: application/json
```

```json
{
  "status": "IN_PROGRESS",
  "estimatedMinutes": 90,
  "dueDate": "2026-10-25"
}
```

Allowed task statuses: `TODO`, `IN_PROGRESS`, `DONE`. Allowed priorities: `LOW`, `MEDIUM`, `HIGH`.

### Example: generate a plan

```http
POST http://localhost:3001/api/gemini/generate
Content-Type: application/json
```

```json
{
  "goal": "Prepare a portfolio website",
  "targetDate": "2026-11-15"
}
```

## Google Calendar Workflow

1. Start the backend with valid Google OAuth environment values.
2. Open the Calendar page in the app and connect Google Calendar.
3. Select one or more tasks with due dates.
4. Review the event details in the confirmation dialog.
5. Confirm to create the events.

The current backend creates all-day events on the task due date. Tasks without a due date cannot be scheduled, and a task already linked to a Google event cannot be added again.

## Troubleshooting

### Database column does not exist / Prisma `P2022`

Apply migrations and regenerate Prisma Client from `backend/`:

```powershell
npx prisma migrate deploy
npm run prisma:generate
```

For local development, use `npx prisma migrate dev`. Do not reset a database containing data just to resolve a missing column.

### Gemini returns HTTP 429

This means the Gemini project/model has hit a rate or daily quota. Check the backend log and Google AI Studio quota for the key in `GEMINI_API_KEY`. Wait for the limit to reset or use a model/project with available quota. Repeated retries do not resolve an exhausted daily quota.

### Backend says an environment variable is missing

Check that `backend/.env` exists, contains the required values, and that the backend was restarted after editing it. Never paste secrets into the frontend environment or commit them.

### Google Calendar says it is not connected

Check the client ID, secret, and exact callback URL. Complete OAuth again from the Calendar page. Local tokens are stored in `backend/.env.google-calendar`; deleting that file requires reconnecting.

## Deployment Notes

The frontend and backend can be deployed separately, with a hosted PostgreSQL database. For example, use a static frontend host, a Node web-service host, and hosted Postgres. Free tiers have usage limits, cold starts, and may change; they are not guaranteed to be permanently free.

Before production deployment:

- Set `DATABASE_URL`, `GEMINI_API_KEY`, and Google OAuth values in the backend host’s secret environment configuration.
- Set frontend `VITE_API_URL` to the deployed backend URL at build time.
- Update backend CORS in `backend/src/server.ts`; it currently permits only `http://localhost:5173`.
- Set `GOOGLE_REDIRECT_URI` to the deployed backend’s `/api/calendar/callback` URL and register that exact URI in Google Cloud.
- The OAuth callback success page currently links back to `http://localhost:5173`; update it for the deployed frontend.
- OAuth tokens are written to a local `.env.google-calendar` file. Ephemeral hosts can lose that file after a restart or redeploy. Use persistent, protected token storage (for example, encrypted database storage) before relying on Calendar integration in production.
- The app does not currently implement user authentication or per-user data isolation. Do not expose private plans publicly until access control is added.
- Public Google OAuth use may require Google verification depending on the scopes and consent-screen configuration.

## Security

- Keep `.env`, `.env.google-calendar`, OAuth client secrets, Gemini keys, and database credentials out of source control.
- Rotate/revoke any credential that has been committed or shared.
- The current app is intended for local development and controlled testing until production CORS, token persistence, and user authentication are addressed.
