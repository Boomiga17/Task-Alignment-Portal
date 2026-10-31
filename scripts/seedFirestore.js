/**
 * ============================================================================
 * FIREBASE SEED & TABLE INITIALIZATION SCRIPT
 * Run with: node scripts/seedFirestore.js
 * ============================================================================
 * 
 * This script seeds sample data into your Cloud Firestore database for:
 *  - 'employees' (Users Table)
 *  - 'tasks' (Tasks Table)
 *  - 'sites' (Websites / Projects Table)
 *  - 'auditLog' (Audit Log Table)
 *  - 'accessRequests' (Access Requests Table)
 * ============================================================================
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to parse .env file without external dependencies
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

loadEnvFile(resolve(__dirname, '../.env.local'));
loadEnvFile(resolve(__dirname, '../.env'));

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Firebase environment variables are missing.');
  console.error('Please configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID in .env.local');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample Staff Accounts
const sampleEmployees = [
  { id: 'E-001', name: 'Priya Nair', title: 'Head of Delivery', team: 'Leadership', role: 'Admin', email: 'priya.nair@nerdylabs.io', enabled: true },
  { id: 'E-012', name: 'Founder Account', title: 'Founder', team: 'Leadership', role: 'Founder', email: 'founder@nerdylabs.io', enabled: true },
  { id: 'E-002', name: 'Rohan Verma', title: 'Project Manager', team: 'Leadership', role: 'Manager', email: 'rohan.verma@nerdylabs.io', enabled: true },
  { id: 'E-003', name: 'Ananya Iyer', title: 'Web Dev Team Lead', team: 'Web Dev', role: 'Team Lead', email: 'devtl@nerdylabs.io', enabled: true },
  { id: 'E-004', name: 'Karthik Rao', title: 'QA Team Lead', team: 'QA', role: 'Team Lead', email: 'qa-tl@nerdylabs.io', enabled: true },
  { id: 'E-005', name: 'Dev Malhotra', title: 'Frontend Developer', team: 'Web Dev', role: 'Employee', email: 'dev.malhotra@nerdylabs.io', enabled: true },
  { id: 'E-006', name: 'Sneha Kulkarni', title: 'Backend Developer', team: 'Web Dev', role: 'Employee', email: 'sneha.kulkarni@nerdylabs.io', enabled: true },
  { id: 'E-008', name: 'Meera Joshi', title: 'UI/UX Team Lead', team: 'UI/UX Designer', role: 'Team Lead', email: 'uiux-tl@nerdylabs.io', enabled: true },
];

// Sample Websites / Projects
const sampleSites = [
  { id: 'site-nl-core', name: 'Nerdy Labs Portal', url: 'https://portal.nerdylabs.io', domain: 'nerdylabs.io', environment: 'Production', techStack: ['React', 'Node.js', 'Firebase'], features: ['Authentication', 'Task Kanban', 'Role Access'] },
  { id: 'site-ecommerce', name: 'Apex Storefront', url: 'https://store.apex.com', domain: 'apex.com', environment: 'Production', techStack: ['Next.js', 'Tailwind', 'Stripe'], features: ['Checkout Revamp', 'Cart Optimization'] },
  { id: 'site-analytics', name: 'Pulse Dashboard', url: 'https://pulse.internal.io', domain: 'internal.io', environment: 'Staging', techStack: ['React', 'Python', 'FastAPI'], features: ['Real-time Metrics', 'Export PDF'] },
];

// Sample Priority Tasks
const sampleTasks = [
  { id: '101', title: 'Fix Firebase Auth token renewal on mobile browsers', siteId: 'site-nl-core', feature: 'Authentication', techStack: 'Firebase', priority: 'Critical', status: 'In Progress', cadence: 'Weekly', assignee: 'E-005', team: 'Web Dev', due: 1, dueDate: '2026-10-27', createdDate: '2026-10-24' },
  { id: '102', title: 'Implement date-wise PDF export with summary counters', siteId: 'site-analytics', feature: 'Reports & Analytics', techStack: 'React', priority: 'High', status: 'Done', cadence: 'Weekly', assignee: 'E-005', team: 'Web Dev', due: 0, dueDate: '2026-10-26', createdDate: '2026-10-23' },
  { id: '103', title: 'Redesign priority task creation modal for founders', siteId: 'site-nl-core', feature: 'Website Revamp', techStack: 'React', priority: 'High', status: 'In Review', cadence: 'Monthly', assignee: 'E-008', team: 'UI/UX Designer', due: 2, dueDate: '2026-10-28', createdDate: '2026-10-25' },
  { id: '104', title: 'Write automated QA test suite for role-based permissions', siteId: 'site-nl-core', feature: 'Access & Roles', techStack: 'Cypress', priority: 'Medium', status: 'Assigned', cadence: 'Weekly', assignee: 'E-004', team: 'QA', due: 4, dueDate: '2026-10-30', createdDate: '2026-10-26' },
];

async function seedDatabase() {
  console.log('🚀 Seeding Cloud Firestore tables...');

  // 1. Employees Table
  console.log('\n📝 Populating "employees" table...');
  for (const emp of sampleEmployees) {
    // If you have auth UIDs, use them as doc IDs; here using emp.id for initial seed template
    await setDoc(doc(db, 'employees', emp.id), {
      employeeId: emp.id,
      name: emp.name,
      title: emp.title,
      email: emp.email,
      team: emp.team,
      role: emp.role,
      roles: [emp.role],
      enabled: emp.enabled,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✔ Added employee: ${emp.name} (${emp.role})`);
  }

  // 2. Sites Table
  console.log('\n🌐 Populating "sites" table...');
  for (const site of sampleSites) {
    await setDoc(doc(db, 'sites', site.id), {
      ...site,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✔ Added site: ${site.name}`);
  }

  // 3. Tasks Table
  console.log('\n📋 Populating "tasks" table...');
  for (const task of sampleTasks) {
    await setDoc(doc(db, 'tasks', task.id), {
      ...task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✔ Added task: NL-${task.id} - ${task.title}`);
  }

  // 4. Audit Log Table
  console.log('\n📜 Populating "auditLog" table...');
  await addDoc(collection(db, 'auditLog'), {
    action: 'Database Initialized',
    actor: 'Setup Script',
    role: 'System',
    detail: 'Seeded initial collections: employees, sites, tasks, auditLog',
    timestamp: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  console.log('  ✔ Created initial audit log entry');

  console.log('\n✨ Firestore database initialization completed successfully!');
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
