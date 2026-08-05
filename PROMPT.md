# Prompt: Job Application Tracker Web App

Scaffold a web app that tracks job applications. All data is saved to the user's local/browser storage — this is a client-only app with no backend or auth. The main interface is a kanban board that the user can interact with to move job applications from one stage to the next.

## Data model

Each job application record holds:

- Company name
- Position / job title
- Application source (direct, recruiter, referral, job board, etc.)
- Recruiter name (if applicable)
- Recruiter contact — email and/or phone (if applicable)
- Date of application
- Status (see Statuses below)
- Status history — a log of every status change with an auto-generated timestamp for each transition
- Interview round log — a sub-list of individual interview rounds, each with date, type (e.g. phone screen, technical, onsite), interviewer name, and notes
- Notes (freetext)
- URL for the job description (if applicable)
- Workstyle (hybrid / office / full-remote)
- Location / city
- Salary/compensation — listed range and/or offered amount
- Rejection reason (if known)
- Resume/cover letter version used (freetext label, no file storage)
- Priority/interest rating
- Tags (freeform, e.g. "dream job", "referral")

## Statuses

- Saved
- Applied
- Interviewing
- Offer
- Declined
- Unsuccessful/Archive

## User stories

**Core tracking**
- I can create and track a new job application
- I can edit any field of an existing application
- I can delete a single application (with a confirmation step)
- I can click and drag applications between kanban columns to update their status
- I can also update an application's status through a keyboard-accessible control (not drag-and-drop only), for accessibility and mobile/touch support
- When a card's status changes (by drag or by the accessible control), the status history is automatically timestamped with that transition

**Data management**
- I can clear all my data (with a confirmation step before this destructive action)
- I can export my data into a CSV
- I can export/import a full JSON backup of my data, so I can restore it after clearing storage or switching browsers
- The app warns me if I'm approaching local storage's size limit
- The stored data has a schema version, so future app updates don't break previously saved data

**Organizing and finding applications**
- I can search and filter the board (by company, source, workstyle, tags, etc.)
- I can sort applications within a view (by date, priority, etc.)
- The app warns me (flags) about applications with no status update in a configurable number of days, so I can spot ones that have gone quiet
- The app handles multiple applications to the same role (company + position, fuzzy/case-insensitive match) as follows, rather than a flat duplicate ban:
  - If a matching record exists and is in an **active** status (Saved, Applied, Interviewing, Offer), warn the user that an active application for this role already exists and offer to open that record instead of creating a new one.
  - If a matching record exists but is **Declined** or **Unsuccessful/Archive**, allow the new application to be created freely (this is a legitimate re-application, e.g. a reposted role or a new hiring cycle) — but link the new record to the prior one (e.g. via a shared role/group id) and surface this link in the UI, e.g. "2nd application to this role", on either record.
  - Same company with a **different** position title is never treated as a duplicate.
  - Each linked application instance still counts as its own separate entry in the analytics/funnel counts.

**Backfilling and time period**
- I can set a specific time period or lookback for the current job-hunting period
- I can backfill applications that have already passed / been unsuccessful, including setting historical status-history dates directly (not just auto-timestamped to "now")

**Analytics / visualization**
Visualize, for the current lookback period (and ideally with the ability to break down by source and by workstyle):
- Total applications submitted
- Applications ignored (no response)
- Applications that proceeded to interview
- Applications that proceeded to consequent/multiple interview rounds
- Applications that proceeded to a job offer
- Overall response rate (% of applications that received any reply)
- Time-in-stage and time-to-first-response metrics
- Trend of applications submitted over time (e.g. per week), alongside the lookback/backfill data

**AI-assisted entry (no OAuth)**
- I can connect an LLM API key (e.g. a Claude API key) in the app
- I can paste in freetext — such as a job posting, a forwarded recruiter email, or a LinkedIn message — and have the LLM parse it into a pre-filled new-application form for me to review and confirm before saving
- No OAuth flows or third-party account connections (e.g. Gmail, LinkedIn) are in scope for this version — entry is via manual paste only