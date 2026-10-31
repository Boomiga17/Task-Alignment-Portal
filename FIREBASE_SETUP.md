# Firebase setup

The portal uses Firebase Authentication and Cloud Firestore when all four
`VITE_FIREBASE_*` values are configured. Copy `.env.example` to `.env.local`,
fill in the web app values from Firebase Console, enable Email/Password
Authentication, create a Cloud Firestore database, and deploy `firestore.rules`.
Restart Vite after changing environment values.

In configured mode, demo passwords and browser-local employee records are not
used. Create each staff account in Firebase Authentication, then create
`employees/{auth-uid}` in Firestore with:

```json
{
  "employeeId": "E-001",
  "name": "Employee Name",
  "title": "Job title",
  "email": "employee@example.com",
  "team": "Web Dev",
  "role": "Employee",
  "enabled": true
}
```

Supported roles are `Founder`, `Admin`, `Manager`, `Team Lead`, and `Employee`.
The `employeeId` should be unique. Admins can use Access & Roles to enable or
disable existing staff accounts and assign a role and team; they can only read
the audit log and employee access records, not tasks or project data. Firebase
Authentication users must still be created separately in Firebase Console or
through a trusted invitation service; this browser page does not create Auth
users or set passwords.

Only managers and team leads can assign a task to a staff member; team leads
can only assign to their own team. Founders create unassigned priority tasks
and can edit task titles, statuses, priorities, and due dates. Managers and
team leads can edit tasks within their permissions, and employees can edit
those fields on their own assigned tasks. Founder-created priority tasks
include a feature, priority, tech stack, and due date, and are not linked to a
website when created. The task form also offers `Website Revamp` for work on an
existing site.

Create `sites/{site-id}` documents using the same fields as the project form
(`name`, `url`, `domain`, `environment`, `features`, `techStack`, and
`modules`). Tasks are stored in `tasks/{task-id}` and reference a site with
`siteId`. Each task should include `title`, `siteId`, `feature`, `techStack`,
`assignee` (the employee ID or `null`), `assigneeUid` (the Auth UID or `null`),
`team` (the assignee's team or `null`), `priority`, `status`, `dueDate`, and
`due`. `siteId` can be `null` for founder-created priority tasks. Audit events
are append-only documents in `auditLog`.

The browser Firebase configuration is not a privileged credential. Never put
service-account keys in this frontend. Firestore rules restrict employee role
and login-access changes to authenticated Admin accounts and prevent Admins
from granting themselves additional privileges.

Without Firebase configuration the app remains in local demo mode. Demo data
is stored only in the current browser and is not shared across users. The local
demo Founder account is `founder@nerdylabs.io` / `founder@123`; never use demo
credentials for a deployed portal.
