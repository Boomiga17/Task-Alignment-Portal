import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query as firestoreQuery,
  serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, firebaseConfigured } from './firebase.js';
import {
  ArrowRight, Bell, Check, Clock3, Columns, Download, Eye, EyeOff,
  FileText, Globe, Layers, List, LogOut, Menu, Moon, Plus, Search, Settings,
  Sun, Users, X, BarChart3, LayoutDashboard, UserRound, Trash2, CalendarDays,
  ChevronLeft, ChevronRight, ChevronDown,
  FileDown, Code, Palette, ShieldCheck, ExternalLink, Pencil,
} from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────────────
const employees = [
  { id: 'E-001', name: 'Priya Nair',      title: 'Head of Delivery',      team: 'Leadership', role: 'Admin',     email: 'priya.nair@nerdylabs.io',      password: 'admin@123' },
  { id: 'E-012', name: 'Founder Account', title: 'Founder',               team: 'Leadership', role: 'Founder',   email: 'founder@nerdylabs.io',        password: 'founder@123' },
  { id: 'E-002', name: 'Rohan Verma',     title: 'Project Manager',        team: 'Leadership', role: 'Manager',   email: 'rohan.verma@nerdylabs.io',     password: 'manager@123' },
  { id: 'E-003', name: 'Ananya Iyer',     title: 'Web Dev Team Lead',      team: 'Web Dev',        teams: ['Web Dev'],        role: 'Team Lead', roles: ['Team Lead'], email: 'devtl@nerdylabs.io',           password: 'devtl@123',   pageAccess: ['overview', 'my', 'all', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'] },
  { id: 'E-004', name: 'Karthik Rao',     title: 'QA Team Lead',           team: 'QA',             teams: ['QA'],             role: 'Team Lead', roles: ['Team Lead'], email: 'qa-tl@nerdylabs.io',           password: 'qa-tl@123',   pageAccess: ['overview', 'my', 'all', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'] },
  { id: 'E-005', name: 'Dev Malhotra',    title: 'Frontend Developer',     team: 'Web Dev',    role: 'Employee',  email: 'dev.malhotra@nerdylabs.io',    password: 'dev@123' },
  { id: 'E-006', name: 'Sneha Kulkarni', title: 'Backend Developer',      team: 'Web Dev',    role: 'Employee',  email: 'sneha.kulkarni@nerdylabs.io',  password: 'sneha@123' },
  { id: 'E-007', name: 'Imran Sheikh',   title: 'Full-Stack Developer',   team: 'Web Dev',    role: 'Employee',  email: 'imran.sheikh@nerdylabs.io',    password: 'imran@123' },
  { id: 'E-008', name: 'Meera Joshi',    title: 'UI/UX Team Lead',        team: 'UI/UX Designer', teams: ['UI/UX Designer'], role: 'Team Lead', roles: ['Team Lead'], email: 'uiux-tl@nerdylabs.io',     password: 'uiux-tl@123', pageAccess: ['overview', 'my', 'all', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'] },
  { id: 'E-009', name: 'Tarun Bose',     title: 'QA Engineer',            team: 'QA',         role: 'Employee',  email: 'tarun.bose@nerdylabs.io',      password: 'tarun@123' },
  { id: 'E-010', name: 'Lakshmi Pillai', title: 'SEO Specialist',         team: 'Web Dev',    role: 'Employee',  email: 'lakshmi.pillai@nerdylabs.io',  password: 'lakshmi@123' },
  { id: 'E-011', name: 'Arjun Das',      title: 'UI/UX Designer',         team: 'UI/UX Designer',role: 'Employee', email: 'arjun.das@nerdylabs.io',       password: 'arjun@123' },
  { id: 'E-013', name: 'Anya Sen',       title: 'UI/UX Designer',       team: 'UI/UX Designer',role: 'Employee', email: 'uiux@nerdylabs.io',            password: 'uiux@123' },
  { id: 'E-014', name: 'Kabir Mehta',    title: 'QA Test Engineer',     team: 'QA',              role: 'Employee', email: 'qa@nerdylabs.io',              password: 'qa@123' },
  { id: 'E-015', name: 'Designer Demo',    title: 'UI/UX Designer',       team: 'UI/UX Designer',role: 'Employee', email: 'designer@nerdylabs.io',        password: 'designer@123' },
  { id: 'E-016', name: 'QA Tester Demo',   title: 'QA Test Engineer',     team: 'QA',              role: 'Employee', email: 'tester@nerdylabs.io',          password: 'qa@123' },
];

const employeeTeams = ['Leadership', 'Web Dev', 'UI/UX Designer', 'QA'];
const allAvailableRoles = ['Admin', 'Founder', 'Manager', 'Team Lead', 'Employee'];
const rolesByTeam = {
  Leadership: ['Founder', 'Admin', 'Manager'],
  'Web Dev': ['Team Lead', 'Employee', 'Manager'],
  'UI/UX Designer': ['Team Lead', 'Employee', 'Manager'],
  QA: ['Team Lead', 'Employee', 'Manager'],
};

const portalPageSections = [
  { id: 'overview', name: 'Overview', icon: 'grid', description: 'Dashboard summary, workload glance & activity metrics' },
  { id: 'my', name: 'My Tasks', icon: 'check', description: 'Personal assigned tasks and self-service board' },
  { id: 'all', name: 'All Tasks', icon: 'list', description: 'Full organization-wide task listing and filters' },
  { id: 'board', name: 'Priority Board', icon: 'columns', description: 'Priority board and Kanban status columns' },
  { id: 'modules', name: 'Client Track', icon: 'globe', description: 'Client websites, tech stacks and environments' },
  { id: 'employees', name: 'Employee Directory', icon: 'users', description: 'Staff directory and contact information' },
  { id: 'workload', name: 'Team Workload', icon: 'chart', description: 'Workload distribution charts across teams' },
  { id: 'reports', name: 'Reports & Analytics', icon: 'report', description: 'Project statistics, burndown & performance' },
  { id: 'activity', name: 'Activity & Notifications', icon: 'bell', description: 'Real-time event feed and notifications' },
];

const defaultPageAccessByRole = {
  Employee: ['overview', 'my', 'board', 'modules', 'reports', 'activity'],
  'Team Lead': ['overview', 'my', 'all', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'],
  Manager: ['overview', 'my', 'all', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'],
  Founder: ['overview', 'board', 'modules', 'employees', 'workload', 'reports', 'activity'],
  Admin: ['access', 'signin-users', 'audit'],
};

function getEmployeeRoles(employee) {
  if (!employee) return ['Employee'];
  let roles = [];
  if (Array.isArray(employee.roles) && employee.roles.length > 0) {
    roles = [...employee.roles];
  } else if (employee.role) {
    roles = [employee.role];
  } else {
    roles = ['Employee'];
  }
  const isTLByTitleOrId = (typeof employee.title === 'string' && employee.title.toLowerCase().includes('team lead')) || ['E-003', 'E-004', 'E-008'].includes(employee.id);
  if (isTLByTitleOrId && !roles.includes('Team Lead')) {
    roles = ['Team Lead', ...roles.filter(r => r !== 'Team Lead')];
  }
  return roles;
}

function hasRole(employeeOrRoles, targetRole) {
  const roles = Array.isArray(employeeOrRoles)
    ? employeeOrRoles
    : getEmployeeRoles(employeeOrRoles);
  return roles.includes(targetRole);
}

function isTeamLeadEmployee(person) {
  if (!person) return false;
  return hasRole(person, 'Team Lead')
    || person.role === 'Team Lead'
    || (Array.isArray(person.roles) && person.roles.includes('Team Lead'))
    || (typeof person.title === 'string' && person.title.toLowerCase().includes('team lead'))
    || ['E-003', 'E-004', 'E-008'].includes(person.id);
}

function getEmployeeTeams(employee) {
  if (!employee) return ['Web Dev'];
  if (Array.isArray(employee.teams) && employee.teams.length > 0) {
    return employee.teams;
  }
  if (employee.team) {
    return [employee.team];
  }
  return ['Web Dev'];
}

function hasTeam(employeeOrTeams, targetTeam) {
  const teams = Array.isArray(employeeOrTeams)
    ? employeeOrTeams
    : getEmployeeTeams(employeeOrTeams);
  if (targetTeam === 'UI/UX' || targetTeam === 'UI/UX Designer') {
    return teams.includes('UI/UX Designer') || teams.includes('UI/UX');
  }
  return teams.includes(targetTeam);
}

function getDefaultPageAccess(roleOrRoles) {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  const pageSet = new Set();
  roles.forEach(r => {
    const pages = defaultPageAccessByRole[r] || defaultPageAccessByRole.Employee || [];
    pages.forEach(p => pageSet.add(p));
  });
  return Array.from(pageSet);
}

function getEmployeeAllowedPages(employee) {
  if (!employee) return [];
  const empRoles = getEmployeeRoles(employee);
  const isStrictlyAdmin = empRoles.length === 1 && empRoles[0] === 'Admin';
  if (isStrictlyAdmin) {
    return ['access', 'signin-users', 'audit'];
  }
  const isStrictlyFounder = empRoles.length === 1 && empRoles[0] === 'Founder';
  const isTLOrManager = empRoles.includes('Team Lead') || empRoles.includes('Manager');

  const basePages = getDefaultPageAccess(empRoles);

  if (Array.isArray(employee.pageAccess) && employee.pageAccess.length > 0) {
    let pages = [...employee.pageAccess];
    // All Team Leads and Managers must always have the complete TL navigation: All Tasks, Employee Directory, Team Workload
    if (isTLOrManager) {
      if (!pages.includes('all')) pages.push('all');
      if (!pages.includes('employees')) pages.push('employees');
      if (!pages.includes('workload')) pages.push('workload');
    }
    if (isStrictlyFounder) {
      return pages.filter(p => p !== 'my' && p !== 'all');
    }
    return pages;
  }

  if (isStrictlyFounder) {
    return basePages.filter(p => p !== 'my' && p !== 'all');
  }
  return basePages;
}
const accountSettingsKey = 'nerdylabs-account-settings';
const accessRequestsKey = 'nerdylabs-access-requests';
const profileSettingsKey = 'nerdylabs-user-profiles';
const deletedEmployeesKey = 'nerdylabs-deleted-employees';
const auditLogKey = 'nerdylabs-audit-log';

function formatAuditTimestamp(date = new Date()) {
  const d = new Date(date);
  const now = new Date();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return `Today • ${timeStr}`;
  if (isYesterday) return `Yesterday • ${timeStr}`;
  const monthStr = d.toLocaleString('en-US', { month: 'short' });
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${monthStr} ${dayStr} • ${timeStr}`;
}

const defaultAuditLog = [
  { id: 1, action: 'User signed in', taskId: null, actor: 'Priya Nair', role: 'Admin', detail: 'Signed in to portal session (priya.nair@nerdylabs.io)', timestamp: 'Today • 08:30 AM' },
  { id: 2, action: 'Created task', taskId: 101, actor: 'Priya Nair', role: 'Admin', detail: 'Created task NL-101: "Order confirmation emails via SMTP" for Website', timestamp: 'Today • 09:15 AM' },
  { id: 3, action: 'Updated status', taskId: 110, actor: 'Sneha Kulkarni', role: 'Employee', detail: 'Moved task NL-110 ("Payment Gateway Checkout") to Blocked', timestamp: 'Today • 11:42 AM' },
  { id: 4, action: 'Deleted task', taskId: 119, actor: 'Rohan Verma', role: 'Manager', detail: 'Removed task NL-119: "Duplicate contact page draft"', timestamp: 'Yesterday • 04:20 PM' },
  { id: 5, action: 'Added project', taskId: null, actor: 'Founder Account', role: 'Founder', detail: 'Created project "Nerdy Labs Cloud Portal" (Live)', timestamp: 'Yesterday • 02:10 PM' },
  { id: 6, action: 'Deleted project', taskId: null, actor: 'Rohan Verma', role: 'Manager', detail: 'Removed project "Legacy Client Demo" (Demo)', timestamp: 'Yesterday • 11:05 AM' },
];

function loadAuditLog() {
  try {
    const stored = window.localStorage.getItem(auditLogKey);
    if (!stored) return defaultAuditLog;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultAuditLog;
  } catch (error) {
    console.error('Unable to load saved audit log.', error);
    return defaultAuditLog;
  }
}

function loadDeletedEmployees() {
  try {
    const stored = window.localStorage.getItem(deletedEmployeesKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadProfileSettings() {
  try {
    const stored = window.localStorage.getItem(profileSettingsKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Saved user profiles must be an object.');
    }
    return Object.fromEntries(employees.map(employee => {
      const saved = parsed[employee.id];
      if (!saved || typeof saved !== 'object') return [employee.id, {}];
      return [employee.id, {
        name: typeof saved.name === 'string' ? saved.name : employee.name,
        title: typeof saved.title === 'string' ? saved.title : employee.title,
        email: typeof saved.email === 'string' ? saved.email : employee.email,
        avatarUrl: typeof saved.avatarUrl === 'string' && saved.avatarUrl.startsWith('data:image/') ? saved.avatarUrl : '',
      }];
    }));
  } catch (error) {
    console.error('Unable to load saved user profiles.', error);
    return {};
  }
}

function loadAccountSettings() {
  try {
    const stored = window.localStorage.getItem(accountSettingsKey);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Saved account settings must be an object.');
    }

    return Object.fromEntries(employees.map(employee => {
      const saved = parsed[employee.id];
      if (!saved || typeof saved !== 'object') return [employee.id, {}];
      const teams = Array.isArray(saved.teams) && saved.teams.length > 0
        ? saved.teams.filter(t => employeeTeams.includes(t))
        : (employeeTeams.includes(saved.team) ? [saved.team] : (Array.isArray(employee.teams) && employee.teams.length > 0 ? employee.teams : [employee.team || 'Web Dev']));
      const team = teams[0] || employee.team || 'Web Dev';
      const isDefaultTL = employee.role === 'Team Lead' || (Array.isArray(employee.roles) && employee.roles.includes('Team Lead')) || (typeof employee.title === 'string' && employee.title.toLowerCase().includes('team lead')) || ['E-003', 'E-004', 'E-008'].includes(employee.id);
      let roles = Array.isArray(saved.roles) && saved.roles.length > 0
        ? saved.roles.filter(r => allAvailableRoles.includes(r))
        : (allAvailableRoles.includes(saved.role) ? [saved.role] : [employee.role]);
      if (isDefaultTL && !roles.includes('Team Lead')) {
        roles = ['Team Lead', ...roles.filter(r => r !== 'Team Lead')];
      }
      const role = isDefaultTL ? 'Team Lead' : (roles[0] || employee.role);
      let pageAccess = Array.isArray(saved.pageAccess)
        ? [...saved.pageAccess]
        : (Array.isArray(employee.pageAccess) ? [...employee.pageAccess] : undefined);
      if (pageAccess && (roles.includes('Team Lead') || roles.includes('Manager') || isDefaultTL)) {
        if (!pageAccess.includes('all')) pageAccess.push('all');
        if (!pageAccess.includes('employees')) pageAccess.push('employees');
        if (!pageAccess.includes('workload')) pageAccess.push('workload');
      }
      return [employee.id, {
        role,
        roles,
        team,
        teams,
        enabled: typeof saved.enabled === 'boolean' ? saved.enabled : true,
        pageAccess,
      }];
    }));
  } catch (error) {
    console.error('Unable to load saved account settings.', error);
    return {};
  }
}

function loadAccessRequests() {
  try {
    const stored = window.localStorage.getItem(accessRequestsKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved access requests must be a list.');
    return parsed.filter(request =>
      request && typeof request.id === 'string' &&
      typeof request.employeeId === 'string' &&
      ['pending', 'approved', 'rejected'].includes(request.status),
    );
  } catch (error) {
    console.error('Unable to load saved access requests.', error);
    return [];
  }
}

const projectFeatures = ['Static Website', 'Embedded Ordering', 'Event Order', 'Loyalty', 'Reservations', 'Catering', 'Offers', 'Item Cart Recommendation', 'App Development'];
const projectTechStacks = ['HTML', 'React', 'Next.js', 'Shopify', 'WordPress'];
const revampFeature = 'Website Revamp';
const sites = [
  { id: 's1', name: 'Saffron Table', domain: 'saffrontable.example', url: 'https://saffrontable.example', environment: 'Live', techStack: ['React'], features: ['Static Website', 'Embedded Ordering', 'Event Order', 'Reservations', 'Catering', 'Offers'], modules: ['Main Website', 'UI/UX Revamp', 'Embedded Online Ordering', 'Offers & Promotions', 'Table Reservations', 'Catering', 'QA Testing'] },
  { id: 's2', name: 'Harbor Coffee Co.', domain: 'www.figma.com', url: 'https://www.figma.com/', figmaUrl: 'https://www.figma.com/', environment: 'Figma', techStack: [], features: ['Static Website', 'Loyalty'], modules: ['Homepage', 'Menu & Products', 'Payment Integration', 'SEO'] },
  { id: 's3', name: 'Bluepeak Fitness', domain: 'bluepeakfit.example', url: 'https://bluepeakfit.example', environment: 'Demo', techStack: ['Next.js'], features: ['Static Website', 'App Development'], modules: ['Booking Widget', 'Admin Portal', 'Image Pipeline'] },
  { id: 's4', name: 'Lumen Dental', domain: 'lumendental.example', url: 'https://lumendental.example', environment: 'Live', techStack: ['HTML'], features: ['Static Website', 'Reservations'], modules: ['Patient Portal', 'Website Maintenance'] },
  { id: 's5', name: 'Urban Nest Realty', domain: 'www.figma.com', url: 'https://www.figma.com/', figmaUrl: 'https://www.figma.com/', environment: 'Figma', techStack: [], features: ['Static Website'], modules: ['Property Search', 'About Us', 'Contact Page'] },
];

function loadProjectSites() {
  try {
    const stored = window.localStorage.getItem('nerdylabs-project-sites');
    if (!stored) return sites;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved project websites must be a list.');
    return parsed.filter(site =>
      site && typeof site.id === 'string' && typeof site.name === 'string' && typeof site.url === 'string'
      && !['manam', 'amudham'].includes(site.name.toLowerCase().trim())
      && !(typeof site.id === 'string' && site.id.startsWith('site-') && site.id.length > 15)
    ).map(saved => {
      const base = sites.find(site => site.id === saved.id);
      const isDesignProject = saved.environment === 'Figma' || saved.stage === 'UI/UX Design';
      let url = saved.url;
      let domain = base?.domain || '';
      try {
        const parsedUrl = new URL(isDesignProject ? saved.figmaUrl || saved.url : saved.url);
        if (isDesignProject && parsedUrl.hostname !== 'figma.com' && !parsedUrl.hostname.endsWith('.figma.com')) {
          throw new Error('Saved design links must use figma.com.');
        }
        url = parsedUrl.href;
        domain = parsedUrl.host;
      } catch {
        if (isDesignProject) {
          url = base?.figmaUrl || 'https://www.figma.com/';
          domain = new URL(url).host;
        } else if (base) {
          url = base.url;
        }
      }
      return {
        ...base,
        ...saved,
        id: saved.id,
        name: saved.name,
        url,
        domain,
        environment: isDesignProject ? 'Figma' : saved.environment === 'Live' ? 'Live' : 'Demo',
        ...(isDesignProject ? { figmaUrl: url, stage: undefined } : { figmaUrl: undefined }),
        features: Array.isArray(saved.features)
          ? projectFeatures.filter(feature => saved.features.includes(feature) || (feature === 'Event Order' && base?.features.includes(feature)))
          : base?.features || [],
        techStack: isDesignProject ? [] : (Array.isArray(saved.techStack) ? projectTechStacks.filter(technology => saved.techStack.includes(technology)) : base?.techStack || []),
        modules: Array.isArray(saved.modules) ? saved.modules : base?.modules || [],
      };
    });
  } catch (error) {
    console.error('Unable to load saved project website details.', error);
    return sites;
  }
}

const seedTasks = [
  [101,'Wire checkout to POS order API','m3','E-007','Critical','In Progress'],
  [102,'Order confirmation emails via SMTP','m3','E-006','High','Assigned'],
  [103,'Reservation widget availability logic','m5','E-007','High','On Hold'],
  [104,'Seasonal offers banner component','m4','E-005','Medium','Assigned'],
  [105,'Catering enquiry form and routing','m6','E-005','High','In Review'],
  [106,'Regression pass: ordering flow','m7','E-009','High','In Progress'],
  [107,'Cross-browser sweep (Safari 17, Firefox)','m7','E-009','Medium','Assigned'],
  [108,'Homepage hero and carousel build','m8','E-005','High','In Progress'],
  [109,'Menu CSV import tooling','m9','E-007','Medium','In Progress'],
  [110,'Payment gateway integration','m10','E-006','Critical','Blocked'],
  [111,'Sitemap and schema markup','m11','E-010','Medium','Assigned'],
  [112,'Admin role management screens','m13','E-006','High','In Review'],
  [113,'Image pipeline and lazy loading','m14','E-007','High','In Progress'],
  [114,'Lighthouse budget check in CI','m14','E-007','Low','Backlog'],
  [115,'Fix appointment form double-submit','m15','E-005','Critical','In Progress'],
  [116,'Plugin updates and backup verification','m16','E-007','Low','Assigned'],
  [117,'Property search UI concepts v2','m17','E-008','High','In Progress'],
  [118,'About Us copy draft','m18','E-011','Medium','Assigned'],
  [119,'Contact page wireframe','m19','E-008','Low','Backlog'],
  [120,'Homepage revamp sign-off','m2','E-008','High','Done'],
  [121,'Launch checklist and DNS cutover','m1','E-005','Critical','Done'],
  [122,'Booking widget visual QA','m12','E-009','Medium','Done'],
  [123,'Footer accessibility fixes','m8','E-005','Medium','Done'],
  [124,'Core web vitals baseline','m1','E-007','Medium','Done'],
  [125,'Design system handoff','m12','E-008','High','Done'],
  [126,'Analytics events spec','m3','E-006','Medium','Done'],
  [127,'Staging data refresh','m13','E-006','Low','Done'],
  [128,'Hours report for client invoice','m7','E-009','Low','Done'],
  [129,'Brand promotional posters & social media banners','m17','E-013','High','In Progress'],
  [130,'Mobile app UI revamp & Figma component library','m18','E-013','Medium','Assigned'],
  [131,'Checkout & coupon discount end-to-end QA sweep','m7','E-014','High','In Progress'],
  [132,'Cross-browser test & mobile responsiveness check','m12','E-014','Medium','Assigned'],
];

const moduleSites = {
  m1:'s1',m2:'s1',m3:'s1',m4:'s1',m5:'s1',m6:'s1',m7:'s1',
  m8:'s2',m9:'s2',m10:'s2',m11:'s2',m12:'s3',m13:'s3',
  m14:'s3',m15:'s4',m16:'s4',m17:'s5',m18:'s5',m19:'s5',
};

const moduleNames = Object.fromEntries(sites.flatMap((site) =>
  site.modules.map((name, i) => [`m${site.id==='s1'?i+1:site.id==='s2'?i+8:site.id==='s3'?i+12:site.id==='s4'?i+15:i+17}`, name])
));

function dateKey(date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function dateKeyFromOffset(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}

function getWeekRange(weekOffset = 0) {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function isDateInRange(dateValue, period, taskCadence, selectedDate, weekOffset = 0) {
  if (period === 'all') return true;
  if (period === 'custom') return Boolean(selectedDate && dateValue === selectedDate);
  if (!dateValue && !taskCadence) return false;
  if (period === 'week') {
    if (!dateValue) return false;
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const { start, end } = getWeekRange(weekOffset);
    return date >= start && date <= end;
  }
  if (period === 'month') {
    if (taskCadence === 'Monthly' || taskCadence === 'Weekly') return true;
    if (!dateValue) return false;
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}

function formatTaskDate(task) {
  if (!task.dueDate) return dayLabel(task.due);
  return new Date(`${task.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getTaskWebsiteName(task, site) {
  if (task.websiteName && task.websiteName !== 'Website' && task.websiteName !== 'Project') return task.websiteName;
  if (task.siteName && task.siteName !== 'Website' && task.siteName !== 'Project') return task.siteName;
  if (site?.name) return site.name;
  const titleLower = (task.title || '').toLowerCase();
  if (titleLower.includes('manam')) return 'manam';
  if (titleLower.includes('konkan')) return 'konkan';
  if (titleLower.includes('amudham')) return 'amudham';
  const match = (task.title || '').match(/^([a-zA-Z0-9_-]+)\s+(website|web|app|site|ui|portal)/i);
  if (match && match[1]) return match[1];
  return task.websiteName || task.siteName || site?.name || 'Website';
}

const taskSeed = seedTasks.map(([id,title,module,assignee,priority,status]) => {
  const due = id===104||id===115 ? 0 : [101,103,110].includes(id) ? -1 : id%9+1;
  const cadence = id % 2 === 0 ? 'Weekly' : 'Monthly';
  const isNewWeb = [101, 108, 121, 129, 130].includes(id);
  const workType = isNewWeb ? 'New Website' : id % 3 === 0 ? 'Extra Work' : 'Task';
  return {
    id, title, module, siteId: moduleSites[module], assignee, priority, status, due,
    dueDate: dateKeyFromOffset(due),
    createdDate: dateKeyFromOffset(-Math.abs((id % 12) + 2)),
    cadence,
    workType,
    isNewWebsite: isNewWeb,
  };
});

const tasksStorageKey = 'nerdylabs-tasks';

function loadTaskData() {
  try {
    const stored = window.localStorage.getItem(tasksStorageKey);
    if (!stored) return taskSeed;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved tasks must be a list.');
    return parsed.filter(task =>
      task && (typeof task.id === 'number' || typeof task.id === 'string')
      && typeof task.title === 'string' && (task.siteId === undefined || task.siteId === null || typeof task.siteId === 'string')
      && ['Critical', 'High', 'Medium', 'Low'].includes(task.priority)
      && ['Backlog', 'Assigned', 'In Progress', 'On Hold', 'Blocked', 'In Review', 'Done'].includes(task.status),
    ).map(task => {
      const isNewWeb = task.isNewWebsite === true || task.workType === 'New Website' || task.websiteMode === 'new_website' || [101, 108, 121, 129, 130].includes(Number(task.id));
      const fromPriorityBoard = task.fromPriorityBoard === true || isNewWeb || [101, 108, 121, 129, 130].includes(Number(task.id));
      let resolvedSiteName = task.websiteName || task.siteName || '';
      if (!resolvedSiteName || resolvedSiteName === 'Project' || resolvedSiteName === 'Website') {
        const titleLower = (task.title || '').toLowerCase();
        if (titleLower.includes('manam')) resolvedSiteName = 'manam';
        else if (titleLower.includes('konkan')) resolvedSiteName = 'konkan';
        else if (titleLower.includes('amudham')) resolvedSiteName = 'amudham';
        else {
          const match = (task.title || '').match(/^([a-zA-Z0-9_-]+)\s+(website|web|app|site|ui|portal)/i);
          if (match && match[1]) resolvedSiteName = match[1];
        }
      }
      return {
        ...task,
        isNewWebsite: isNewWeb,
        fromPriorityBoard,
        websiteName: resolvedSiteName || task.websiteName || task.siteName || 'Website',
        siteName: resolvedSiteName || task.siteName || task.websiteName || 'Website',
        workType: isNewWeb ? 'New Website' : (task.workType || 'Task'),
      };
    });
  } catch (error) {
    console.error('Unable to load saved tasks.', error);
    return taskSeed;
  }
}

const navItems = [
  ['access','Access & Roles','users','Admin'],
  ['signin-users','Sign-in Users','check','Admin'],
  ['audit','Audit Log','report','Admin'],
  ['overview','Overview','grid','Founder,Manager,Team Lead,Employee'],
  ['my','My Tasks','check','Manager,Team Lead,Employee'],
  ['all','All Tasks','list','Manager,Team Lead'],
  ['board','Priority Board','columns','Founder,Manager,Team Lead,Employee'],
  ['modules','Client Track','globe','Founder,Manager,Team Lead,Employee'],
  ['employees','Employee Directory','users','Founder,Manager,Team Lead'],
  ['workload','Team Workload','chart','Founder,Manager,Team Lead'],
  ['reports','Reports & Analytics','report','Founder,Manager,Team Lead,Employee'],
];

const iconComponents = {
  grid: LayoutDashboard,
  check: Check,
  list: List,
  columns: Columns,
  globe: Globe,
  layers: Layers,
  users: Users,
  chart: BarChart3,
  report: FileText,
  bell: Bell,
  settings: Settings,
  search: Search,
  moon: Moon,
  sun: Sun,
  plus: Plus,
  close: X,
  arrow: ArrowRight,
  clock: Clock3,
  eye: Eye,
  eyeoff: EyeOff,
  logout: LogOut,
  profile: UserRound,
  download: Download,
  menu: Menu,
  trash: Trash2,
  filedown: FileDown,
  pdf: FileText,
  code: Code,
  palette: Palette,
  shield: ShieldCheck,
  chevron: ChevronDown,
};

function Icon({ name, size = 18, className = '' }) {
  const LucideIcon = iconComponents[name] || LayoutDashboard;
  return <LucideIcon className={className} size={size} strokeWidth={1.9} aria-hidden="true" />;
}

const dayLabel = (d) => d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `In ${d}d`;
const initials = (n) => n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const canSeeAll = (role) => ['Founder', 'Manager', 'Team Lead'].includes(role);

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1100 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = parseInt(value, 10) || 0;
    if (end <= 0) {
      setDisplay(0);
      return;
    }
    let startTime = null;
    let animId;

    const step = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * end));
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplay(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span className="login-stat-num">{display}</span>;
}

function LoginPage({ onLogin, onRequestAccess, dark, setDark, portalName, stats }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  // Request Access modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName]                   = useState('');
  const [reqEmail, setReqEmail]                 = useState('');
  const [reqTeam, setReqTeam]                   = useState('Founder');
  const [reqError, setReqError]                 = useState('');
  const [reqSuccess, setReqSuccess]             = useState('');
  const [reqLoading, setReqLoading]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onLogin(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setReqError('');
    if (!reqEmail.trim()) {
      setReqError('Please enter your work email.');
      return;
    }
    setReqLoading(true);
    const result = onRequestAccess ? onRequestAccess({
      name: reqName,
      email: reqEmail,
      team: reqTeam,
    }) : { success: false, message: 'Access request system unavailable.' };
    setReqLoading(false);
    if (!result.success) {
      setReqError(result.message);
    } else {
      setReqSuccess(result.message);
    }
  };

  return (
    <div className={`login-shell${dark ? ' dark' : ''}`}>
      <div className="login-split-left">
        <div className="login-brand">
          <div className="login-brand-card">
            <img src="/nerdylabs-logo.png" alt="nerdyLabs" className="login-brand-logo" />
          </div>
        </div>
        <div className="login-hero">
          <h1>Let's Get Things Done<span className="login-dot">.</span></h1>
          <p>Sign in to view your tasks, collaborate with your team, and move projects forward with ease.</p>
        </div>
        <div className="login-stats">
          <div className="login-stat">
            <AnimatedNumber value={stats?.tasksCount ?? 28} />
            <span>Active Tasks</span>
          </div>
          <div className="login-stat">
            <AnimatedNumber value={stats?.projectsCount ?? 5} />
            <span>Live Projects</span>
          </div>
          <div className="login-stat">
            <AnimatedNumber value={stats?.membersCount ?? 11} />
            <span>Team Members</span>
          </div>
        </div>
      </div>

      <div className="login-split-right">
        <button className="login-dark-toggle" onClick={() => setDark(v => !v)} aria-label="Toggle dark mode">
          <Icon name={dark ? 'sun' : 'moon'} size={16} />
        </button>

        <div className="login-form-container">
          <div className="login-mobile-brand">
            <div className="login-brand-card">
              <img src="/nerdylabs-logo.png" alt="nerdyLabs" className="login-brand-logo" />
            </div>
          </div>
          <h2>Sign in</h2>
          <p className="login-form-sub">Enter your staff credentials to access your priority workspace.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="l-email">Email address</label>
              <input id="l-email" type="email" autoComplete="email" autoFocus placeholder="you@nerdylabs.io"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="login-field">
              <label htmlFor="l-pw">Password</label>
              <div className="pw-wrap">
                <input id="l-pw" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                  <Icon name={showPw ? 'eyeoff' : 'eye'} size={15} />
                </button>
              </div>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>

            <div className="login-request-row" style={{ marginTop: '12px' }}>
              <span>Can’t sign in or need an account?</span>
              <button
                type="button"
                className="login-request-trigger-btn"
                onClick={() => {
                  setShowRequestModal(true);
                  setReqError('');
                  setReqSuccess('');
                }}
              >
                Request portal access →
              </button>
            </div>
          </form>

          <div className="login-divider"><span>Quick demo logins (Click to fill)</span></div>

          <div className="cred-table" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {[
              { role: 'Admin', name: 'Priya Nair', email: 'priya.nair@nerdylabs.io', pass: 'admin@123', badge: 'cred-admin' },
              { role: 'Founder', name: 'Founder Account', email: 'founder@nerdylabs.io', pass: 'founder@123', badge: 'cred-admin' },
              { role: 'Manager', name: 'Rohan Verma', email: 'rohan.verma@nerdylabs.io', pass: 'manager@123', badge: 'cred-manager' },
              { role: 'Dev TL', name: 'Ananya Iyer (Dev TL)', email: 'devtl@nerdylabs.io', pass: 'devtl@123', badge: 'cred-team-lead' },
              { role: 'UI/UX TL', name: 'Meera Joshi (UI/UX TL)', email: 'uiux-tl@nerdylabs.io', pass: 'uiux-tl@123', badge: 'cred-uiux' },
              { role: 'QA TL', name: 'Karthik Rao (QA TL)', email: 'qa-tl@nerdylabs.io', pass: 'qa-tl@123', badge: 'cred-qa' },
              { role: 'Developer', name: 'Dev Malhotra', email: 'dev.malhotra@nerdylabs.io', pass: 'dev@123', badge: 'cred-employee' },
              { role: 'UI/UX Designer', name: 'Anya Sen', email: 'uiux@nerdylabs.io', pass: 'uiux@123', badge: 'cred-uiux' },
              { role: 'QA Engineer', name: 'Kabir Mehta', email: 'qa@nerdylabs.io', pass: 'qa@123', badge: 'cred-qa' },
            ].map((account) => (
              <button
                key={account.email}
                className="cred-row"
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.pass);
                  setError('');
                }}
              >
                <span className="cred-avatar">{initials(account.name)}</span>
                <span className="cred-info">
                  <strong>{account.name}</strong>
                  <small>{account.email} • <code>{account.pass}</code></small>
                </span>
                <span className={`cred-role-pill ${account.badge}`}>{account.role}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* REQUEST PORTAL ACCESS MODAL */}
      {showRequestModal && (
        <div className="overlay modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowRequestModal(false)}>
          <section className="modal-card login-request-modal" role="dialog" aria-modal="true" aria-labelledby="req-modal-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">PORTAL ACCESS</span>
                <h2 id="req-modal-title">Request login access</h2>
              </div>
              <button className="icon-button modal-close-btn" type="button" onClick={() => setShowRequestModal(false)} aria-label="Close modal">
                <Icon name="close" size={16} />
              </button>
            </div>

            {reqSuccess ? (
              <div className="request-success-box">
                <div className="request-success-icon"><Icon name="check" size={26} /></div>
                <h3>Request Submitted!</h3>
                <p>{reqSuccess}</p>
                <button type="button" className="button button-primary button-orange-solid" onClick={() => setShowRequestModal(false)}>
                  Back to Sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit}>
                <p className="login-form-sub" style={{ margin: '0 0 16px' }}>
                  Submit your details. The portal administrator will review your request and approve your login and role access.
                </p>

                <div className="form-group">
                  <label className="field-label" htmlFor="req-name">Full name</label>
                  <input className="field-control" id="req-name" placeholder="e.g. Rahul Sharma" value={reqName} onChange={e => setReqName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="req-email">Work email address</label>
                  <input className="field-control" id="req-email" type="email" placeholder="e.g. rahul@nerdylabs.io" value={reqEmail} onChange={e => setReqEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="req-team">Domain / Department</label>
                  <select className="field-control" id="req-team" value={reqTeam} onChange={e => setReqTeam(e.target.value)}>
                    <option value="Founder">Founder</option>
                    <option value="Manager">Manager</option>
                    <option value="Web Dev">Web Dev</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                {reqError && <p className="form-error" role="alert" style={{ marginTop: 12 }}>{reqError}</p>}

                <div className="modal-actions">
                  <button type="button" className="button button-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                  <button type="submit" className="button button-primary button-orange-solid" disabled={reqLoading}>
                    {reqLoading ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ─── PDF EXPORT & DATE-WISE UTILITIES ─────────────────────────────────────────

function getFilteredTasksForExport(tasks, { dateScope, specificDate, startDate, endDate, priorityFilter, sortBy }) {
  const todayKey = dateKey(new Date());
  let list = tasks.filter(task => {
    if (priorityFilter && priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    const taskDue = task.dueDate || dateKeyFromOffset(task.due);
    const taskCreated = task.createdDate || (task.createdAt ? String(task.createdAt).slice(0, 10) : dateKeyFromOffset(-Math.abs(task.id % 7) - 1));

    if (dateScope === 'all') return true;
    if (dateScope === 'today') {
      return taskDue === todayKey || taskCreated === todayKey || task.due === 0;
    }
    if (dateScope === 'week') {
      return isDateInRange(taskDue, 'week', task.cadence);
    }
    if (dateScope === 'month') {
      return isDateInRange(taskDue, 'month', task.cadence);
    }
    if (dateScope === 'specific') {
      return Boolean(specificDate && (taskDue === specificDate || taskCreated === specificDate));
    }
    if (dateScope === 'range') {
      if (!startDate && !endDate) return true;
      const compareDate = taskDue || taskCreated;
      if (startDate && compareDate < startDate) return false;
      if (endDate && compareDate > endDate) return false;
      return true;
    }
    return true;
  });

  list = [...list].sort((a, b) => {
    const aDue = a.dueDate || dateKeyFromOffset(a.due);
    const bDue = b.dueDate || dateKeyFromOffset(b.due);
    const aCreated = a.createdDate || '';
    const bCreated = b.createdDate || '';

    if (sortBy === 'due_asc') return aDue.localeCompare(bDue);
    if (sortBy === 'due_desc') return bDue.localeCompare(aDue);
    if (sortBy === 'created_desc') return bCreated.localeCompare(aCreated);
    if (sortBy === 'created_asc') return aCreated.localeCompare(bCreated);
    if (sortBy === 'priority') {
      const pMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return 0;
  });

  return list;
}

function generateTasksPdf({
  tasksToExport,
  projectSites = [],
  teamMembers = [],
  portalName = 'Nerdy Labs Priority Portal',
  dateScopeLabel = 'All Dates',
  dateRangeText = '',
  exportedByName = 'Admin',
  exportedByRole = 'Admin',
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();

  // Top header banner
  doc.setFillColor(15, 23, 42); // #0f172a navy
  doc.rect(0, 0, pageWidth, 68, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((portalName || 'NERDY LABS PRIORITY PORTAL').toUpperCase(), 30, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(199, 210, 254);
  doc.text('OFFICIAL PRIORITY TASK REPORT · DATE-WISE CHRONOLOGY', 30, 48);

  // Right-side metadata
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const genDateStr = `Report Date: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(genDateStr, pageWidth - 30, 24, { align: 'right' });
  doc.text(`Generated By: ${exportedByName} (${exportedByRole})`, pageWidth - 30, 38, { align: 'right' });
  doc.text(`Date Filter: ${dateScopeLabel}${dateRangeText ? ` [${dateRangeText}]` : ''}`, pageWidth - 30, 52, { align: 'right' });

  // Summary Metrics Bar
  const totalTasks = tasksToExport.length;
  const criticalCount = tasksToExport.filter(t => t.priority === 'Critical').length;
  const highCount = tasksToExport.filter(t => t.priority === 'High').length;
  const inProgress = tasksToExport.filter(t => t.status === 'In Progress').length;
  const doneTasks = tasksToExport.filter(t => t.status === 'Done').length;
  const overdueTasks = tasksToExport.filter(t => t.due < 0 && t.status !== 'Done').length;

  doc.setFillColor(241, 245, 249);
  doc.rect(30, 78, pageWidth - 60, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(30, 78, pageWidth - 60, 24, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL TASKS: ${totalTasks}`, 42, 93);

  doc.setTextColor(220, 38, 38);
  doc.text(`CRITICAL: ${criticalCount}`, 145, 93);

  doc.setTextColor(234, 88, 12);
  doc.text(`HIGH: ${highCount}`, 235, 93);

  doc.setTextColor(79, 70, 229);
  doc.text(`IN PROGRESS: ${inProgress}`, 305, 93);

  doc.setTextColor(16, 185, 129);
  doc.text(`COMPLETED: ${doneTasks}`, 410, 93);

  doc.setTextColor(239, 68, 68);
  doc.text(`OVERDUE: ${overdueTasks}`, 515, 93);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`All dates are explicitly stamped per task below.`, pageWidth - 42, 93, { align: 'right' });

  // Rows for table
  const rows = tasksToExport.map(task => {
    const site = projectSites.find(s => s.id === task.siteId);
    const emp = teamMembers.find(p => p.id === task.assignee);
    const createdStr = task.createdDate || (task.createdAt ? String(task.createdAt).slice(0, 10) : dateKeyFromOffset(-Math.abs(task.id % 7) - 1));
    const dueStr = task.dueDate || dateKeyFromOffset(task.due);
    const dueDetail = task.status === 'Done' ? 'Done' : task.due < 0 ? `Overdue ${Math.abs(task.due)}d` : task.due === 0 ? 'Today' : `In ${task.due}d`;

    return [
      `NL-${task.id}`,
      task.title || '',
      site ? `${site.name}${task.techStack ? `\n[${task.techStack}]` : ''}` : (task.techStack || '—'),
      emp ? `${emp.name}\n(${emp.team || 'General'})` : 'Unassigned',
      task.priority,
      task.cadence || 'One-time',
      createdStr,
      `${dueStr}\n(${dueDetail})`,
      task.status,
    ];
  });

  autoTable(doc, {
    startY: 110,
    head: [[
      'Task ID',
      'Task Title',
      'Website / Tech Stack',
      'Assignee / Team',
      'Priority',
      'Cadence',
      'Created Date',
      'Due Date',
      'Status'
    ]],
    body: rows.length > 0 ? rows : [['—', 'No tasks matched the selected date filter', '—', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 165 },
      2: { cellWidth: 115 },
      3: { cellWidth: 95 },
      4: { cellWidth: 55, fontStyle: 'bold' },
      5: { cellWidth: 55 },
      6: { cellWidth: 68 },
      7: { cellWidth: 85, fontStyle: 'bold' },
      8: { cellWidth: 68 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 4) {
          if (data.cell.raw === 'Critical') {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (data.cell.raw === 'High') {
            data.cell.styles.textColor = [234, 88, 12];
          }
        }
        if (data.column.index === 8 && data.cell.raw === 'Done') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Nerdy Labs Priority Management Portal · Confidential · Exported on ${now.toISOString().slice(0, 10)}`,
        30,
        pageHeight - 14
      );
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
        pageWidth - 30,
        pageHeight - 14,
        { align: 'right' }
      );
    },
  });

  const filenameDate = now.toISOString().slice(0, 10);
  const cleanScope = dateScopeLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`nerdylabs-tasks-${cleanScope}-${filenameDate}.pdf`);
}

function generateUserPdf({
  employee,
  tasks = [],
  auditLog = [],
  portalName = 'Nerdy Labs Priority Portal',
  currentEmployee = null,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();

  // Top header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text((portalName || 'NERDY LABS PRIORITY PORTAL').toUpperCase(), 25, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('EMPLOYEE TASK REPORT & ASSIGNMENT DOSSIER', 25, 44);

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 25, 26, { align: 'right' });
  doc.text(`Generated By: ${currentEmployee?.name || 'Admin'}`, pageWidth - 25, 42, { align: 'right' });

  // User info card
  doc.setFillColor(248, 250, 252);
  doc.rect(25, 70, pageWidth - 50, 68, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(25, 70, pageWidth - 50, 68, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.name, 38, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${employee.email}`, 38, 106);
  doc.text(`Employee ID: ${employee.id}`, 38, 122);

  doc.text(`Domain / Team: ${getEmployeeTeams(employee).join(', ')}`, 220, 106);
  doc.text(`Roles: ${getEmployeeRoles(employee).join(', ')}`, 220, 122);

  doc.text(`Department: ${employee.team}`, 380, 106);
  doc.text(`Report Date: ${now.toISOString().slice(0, 10)}`, 380, 122);

  // User Tasks
  const userTasks = tasks.filter(t => t.assignee === employee.id);
  const doneCount = userTasks.filter(t => t.status === 'Done').length;
  const inProgressCount = userTasks.filter(t => t.status === 'In Progress').length;
  const overdueCount = userTasks.filter(t => t.due < 0 && t.status !== 'Done').length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`ASSIGNED TASKS (${userTasks.length} Total · ${doneCount} Done · ${inProgressCount} In Progress · ${overdueCount} Overdue)`, 25, 155);

  const taskRows = userTasks.map(t => {
    const createdStr = t.createdDate || (t.createdAt ? String(t.createdAt).slice(0, 10) : dateKeyFromOffset(-Math.abs(t.id % 7) - 1));
    const dueStr = t.dueDate || dateKeyFromOffset(t.due);
    const dueDetail = t.status === 'Done' ? 'Done' : t.due < 0 ? `Overdue ${Math.abs(t.due)}d` : t.due === 0 ? 'Today' : `In ${t.due}d`;
    return [
      `NL-${t.id}`,
      t.title,
      t.priority,
      t.cadence || 'Weekly',
      createdStr,
      `${dueStr} (${dueDetail})`,
      t.status,
    ];
  });

  autoTable(doc, {
    startY: 165,
    head: [['Task ID', 'Title', 'Priority', 'Cadence', 'Created Date', 'Due Date', 'Status']],
    body: taskRows.length > 0 ? taskRows : [['—', 'No tasks assigned to this user', '—', '—', '—', '—', '—']],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3.5, overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 160 },
      2: { cellWidth: 50 },
      3: { cellWidth: 48 },
      4: { cellWidth: 62 },
      5: { cellWidth: 86, fontStyle: 'bold' },
      6: { cellWidth: 55 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // User Audit Events
  const userAudit = auditLog.filter(a =>
    a.actor?.toLowerCase() === employee.name.toLowerCase() ||
    a.detail?.toLowerCase().includes(employee.name.toLowerCase()) ||
    a.detail?.toLowerCase().includes(employee.email.toLowerCase())
  );

  const nextY = (doc.lastAutoTable?.finalY || 165) + 20;

  if (nextY < pageHeight - 120) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`ACTIVITY & AUDIT LOG (${userAudit.length} Events)`, 25, nextY);

    const auditRows = userAudit.slice(0, 15).map(a => [
      a.id,
      a.action,
      a.detail || '',
      a.timestamp || '',
    ]);

    autoTable(doc, {
      startY: nextY + 10,
      head: [['ID', 'Action', 'Details', 'Timestamp (Date & Time)']],
      body: auditRows.length > 0 ? auditRows : [['—', 'No recent audit events', '—', '—']],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 3.5, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 100 },
        2: { cellWidth: 240 },
        3: { cellWidth: 130 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  const sanitizedName = employee.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`nerdylabs-user-${sanitizedName}-${now.toISOString().slice(0, 10)}.pdf`);
}

function generateAuditPdf({
  auditLog = [],
  portalName = 'Nerdy Labs Priority Portal',
  currentEmployee = null,
  dateScopeLabel = 'All Dates',
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((portalName || 'NERDY LABS PRIORITY PORTAL').toUpperCase(), 30, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(199, 210, 254);
  doc.text(`PORTAL AUDIT & SECURITY LOG · DATE-WISE RECORD (${auditLog.length} Events)`, 30, 44);

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 30, 24, { align: 'right' });
  doc.text(`Generated By: ${currentEmployee?.name || 'Admin'} (${currentEmployee?.role || 'Admin'})`, pageWidth - 30, 38, { align: 'right' });
  doc.text(`Date Scope: ${dateScopeLabel}`, pageWidth - 30, 52, { align: 'right' });

  const rows = auditLog.map(item => [
    item.id,
    item.action || '',
    item.actor || 'System',
    item.role || '—',
    item.detail || '',
    item.timestamp || '—',
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Event ID', 'Action Taken', 'Actor', 'Role', 'Details & Context', 'Exact Timestamp (Date & Time)']],
    body: rows.length > 0 ? rows : [['—', 'No audit logs found', '—', '—', '—', '—']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 120 },
      2: { cellWidth: 95 },
      3: { cellWidth: 70 },
      4: { cellWidth: 320 },
      5: { cellWidth: 125 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Nerdy Labs Priority Management Portal · Audit History · Confidential`, 30, pageHeight - 14);
      doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 14, { align: 'right' });
    },
  });

  doc.save(`nerdylabs-audit-log-${now.toISOString().slice(0, 10)}.pdf`);
}

function generateSignInUsersPdf({
  users = [],
  tasks = [],
  portalName = 'Nerdy Labs Priority Portal',
  currentEmployee = null,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text((portalName || 'NERDY LABS PRIORITY PORTAL').toUpperCase(), 25, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(`AUTHORIZED SIGN-IN ACCOUNTS DIRECTORY (${users.length} Users)`, 25, 44);

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 25, 26, { align: 'right' });
  doc.text(`Generated By: ${currentEmployee?.name || 'Admin'}`, pageWidth - 25, 42, { align: 'right' });

  const rows = users.map(u => {
    const userTasks = tasks.filter(t => t.assignee === u.id);
    return [
      u.id,
      u.name,
      u.email,
      u.team || 'Leadership',
      u.role,
      `${userTasks.length} tasks`,
      'Active / Enabled',
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: [['Emp ID', 'Full Name', 'Email Address', 'Domain / Team', 'Role', 'Tasks', 'Sign-in Status']],
    body: rows.length > 0 ? rows : [['—', 'No users found', '—', '—', '—', '—', '—']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 95 },
      2: { cellWidth: 140 },
      3: { cellWidth: 75 },
      4: { cellWidth: 65 },
      5: { cellWidth: 55 },
      6: { cellWidth: 70 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Nerdy Labs Priority Management Portal · Sign-in Users Record · Confidential`, 25, pageHeight - 14);
      doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - 25, pageHeight - 14, { align: 'right' });
    },
  });

  doc.save(`nerdylabs-signin-users-${now.toISOString().slice(0, 10)}.pdf`);
}

function DateWiseExportModal({
  config = {},
  onClose,
  tasks = [],
  teamMembers = [],
  projectSites = [],
  auditLog = [],
  portalName = 'Nerdy Labs Priority Portal',
  currentEmployee = null,
  recordAudit,
  setNotice,
}) {
  const [exportType, setExportType] = useState(config.type || 'tasks');
  const [dateScope, setDateScope] = useState(
    config.dateScope === 'custom' ? 'specific' : (config.dateScope || 'all')
  );
  const [specificDate, setSpecificDate] = useState(config.specificDate || dateKey(new Date()));
  const [startDate, setStartDate] = useState(() => dateKeyFromOffset(-7));
  const [endDate, setEndDate] = useState(() => dateKeyFromOffset(7));
  const [sortBy, setSortBy] = useState('due_asc');
  const [priorityFilter, setPriorityFilter] = useState(config.priority || 'all');
  const [format, setFormat] = useState('pdf');
  const [downloading, setDownloading] = useState(false);

  const matchingTasks = useMemo(() => {
    return getFilteredTasksForExport(tasks, {
      dateScope,
      specificDate,
      startDate,
      endDate,
      priorityFilter,
      sortBy,
    });
  }, [tasks, dateScope, specificDate, startDate, endDate, priorityFilter, sortBy]);

  const matchingAudit = useMemo(() => {
    if (dateScope === 'all') return auditLog;
    const todayStr = dateKey(new Date());
    return auditLog.filter(item => {
      const ts = item.timestamp ? String(item.timestamp).slice(0, 10) : '';
      if (!ts) return false;
      if (dateScope === 'today') return ts === todayStr;
      if (dateScope === 'week') return isDateInRange(ts, 'week');
      if (dateScope === 'month') return isDateInRange(ts, 'month');
      if (dateScope === 'specific') return ts === specificDate;
      if (dateScope === 'range') {
        if (startDate && ts < startDate) return false;
        if (endDate && ts > endDate) return false;
        return true;
      }
      return true;
    });
  }, [auditLog, dateScope, specificDate, startDate, endDate]);

  const handleDownload = () => {
    setDownloading(true);
    try {
      let dateScopeLabel = 'All Dates';
      let dateRangeText = '';
      if (dateScope === 'today') dateScopeLabel = `Today (${dateKey(new Date())})`;
      else if (dateScope === 'week') dateScopeLabel = 'This Week';
      else if (dateScope === 'month') dateScopeLabel = 'This Month';
      else if (dateScope === 'specific') dateScopeLabel = `Date: ${specificDate}`;
      else if (dateScope === 'range') {
        dateScopeLabel = 'Custom Range';
        dateRangeText = `${startDate} to ${endDate}`;
      }

      if (exportType === 'tasks') {
        if (format === 'pdf') {
          generateTasksPdf({
            tasksToExport: matchingTasks,
            projectSites,
            teamMembers,
            portalName,
            dateScopeLabel,
            dateRangeText,
            exportedByName: currentEmployee?.name || 'Admin',
            exportedByRole: currentEmployee?.role || 'Admin',
          });
          if (recordAudit) {
            recordAudit('Downloaded PDF Report', null, `Exported PDF for ${matchingTasks.length} tasks date-wise (${dateScopeLabel})`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice(`PDF task report downloaded (${matchingTasks.length} tasks, date-wise).`);
        } else {
          const rows = matchingTasks.map(task => {
            const emp = teamMembers.find(p => p.id === task.assignee);
            const site = projectSites.find(s => s.id === task.siteId);
            const createdStr = task.createdDate || (task.createdAt ? String(task.createdAt).slice(0, 10) : dateKeyFromOffset(-Math.abs(task.id % 7) - 1));
            const dueStr = task.dueDate || dateKeyFromOffset(task.due);
            return [
              `NL-${task.id}`,
              task.title,
              site?.name || 'Unassigned',
              task.feature || task.moduleName || '',
              task.techStack || '',
              emp?.name || 'Unassigned',
              emp?.team || '',
              task.priority,
              task.cadence || 'Weekly',
              createdStr,
              dueStr,
              task.status,
            ];
          });
          const headers = ['Task ID', 'Title', 'Website', 'Feature', 'Tech Stack', 'Assignee', 'Team', 'Priority', 'Cadence', 'Created Date', 'Due Date', 'Status'];
          const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nerdylabs-tasks-${dateScopeLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          if (recordAudit) {
            recordAudit('Downloaded CSV Report', null, `Exported CSV for ${matchingTasks.length} tasks date-wise (${dateScopeLabel})`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice(`CSV task report downloaded (${matchingTasks.length} tasks).`);
        }
      } else if (exportType === 'audit') {
        if (format === 'pdf') {
          generateAuditPdf({
            auditLog: matchingAudit,
            portalName,
            currentEmployee,
            dateScopeLabel,
          });
          if (recordAudit) {
            recordAudit('Downloaded Audit PDF', null, `Exported PDF for ${matchingAudit.length} audit records date-wise`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice(`Audit log downloaded as PDF (${matchingAudit.length} events).`);
        } else {
          const headers = ['ID', 'Action', 'Actor', 'Role', 'Detail', 'Timestamp'];
          const rows = matchingAudit.map(item => [item.id, item.action, item.actor, item.role, item.detail || '', item.timestamp || '']);
          const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nerdylabs-audit-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          if (recordAudit) {
            recordAudit('Downloaded Audit CSV', null, `Exported CSV for ${matchingAudit.length} audit records`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice('Audit log downloaded as CSV.');
        }
      } else if (exportType === 'users') {
        const activeUsers = teamMembers.filter(e => e.enabled);
        if (format === 'pdf') {
          generateSignInUsersPdf({
            users: activeUsers,
            tasks,
            portalName,
            currentEmployee,
          });
          if (recordAudit) {
            recordAudit('Downloaded Users PDF', null, `Exported PDF for ${activeUsers.length} sign-in users`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice(`Sign-in users directory downloaded as PDF (${activeUsers.length} users).`);
        } else {
          const headers = ['Employee ID', 'Name', 'Email', 'Domain / Team', 'Role', 'Assigned Tasks', 'Sign-in Status'];
          const rows = activeUsers.map(u => [u.id, u.name, u.email, u.team, u.role, tasks.filter(t => t.assignee === u.id).length, 'Active']);
          const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nerdylabs-users-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          if (recordAudit) {
            recordAudit('Downloaded Users CSV', null, `Exported CSV for ${activeUsers.length} sign-in users`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
          }
          if (setNotice) setNotice('Sign-in users directory downloaded as CSV.');
        }
      }
      onClose();
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Unable to generate export: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-card export-modal-card">
        <div className="modal-header">
          <div>
            <div className="eyebrow">Data Export</div>
            <h2 id="export-modal-title">Download Data (PDF & Date-Wise)</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={17} />
          </button>
        </div>

        <p className="modal-subtitle">
          Export portal data in professional <strong>PDF document</strong> format, filtered and ordered date-wise.
        </p>

        {/* Data Type Tabs */}
        <div className="export-type-selector">
          <button
            type="button"
            className={`export-type-btn${exportType === 'tasks' ? ' active' : ''}`}
            onClick={() => setExportType('tasks')}
          >
            <Icon name="list" size={14} /> Priority Tasks ({tasks.length})
          </button>
          <button
            type="button"
            className={`export-type-btn${exportType === 'users' ? ' active' : ''}`}
            onClick={() => setExportType('users')}
          >
            <Icon name="users" size={14} /> Sign-in Users ({teamMembers.filter(e => e.enabled).length})
          </button>
          <button
            type="button"
            className={`export-type-btn${exportType === 'audit' ? ' active' : ''}`}
            onClick={() => setExportType('audit')}
          >
            <Icon name="report" size={14} /> Audit Log ({auditLog.length})
          </button>
        </div>

        {/* Date Filter Selection */}
        <div className="export-section">
          <label className="field-label"><span>Filter by Date Period (Date-Wise)</span></label>
          <div className="export-scope-chips">
            {[
              ['all', 'All Dates'],
              ['today', 'Today'],
              ['week', 'This Week'],
              ['month', 'This Month'],
              ['specific', 'Specific Date'],
              ['range', 'Custom Range'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`export-scope-chip${dateScope === id ? ' active' : ''}`}
                onClick={() => setDateScope(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {dateScope === 'specific' && (
            <div className="export-date-inputs single-input" style={{ marginTop: '10px' }}>
              <label className="field-label">
                <span>Select Calendar Date</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="input"
                />
              </label>
            </div>
          )}

          {dateScope === 'range' && (
            <div className="export-date-inputs" style={{ marginTop: '10px' }}>
              <label className="field-label">
                <span>From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="input"
                />
              </label>
              <label className="field-label">
                <span>To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="input"
                />
              </label>
            </div>
          )}
        </div>

        {/* Priority & Sorting (for Tasks) */}
        {exportType === 'tasks' && (
          <div className="form-row" style={{ marginTop: '12px' }}>
            <label className="field-label">
              <span>Date Sorting Order</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="due_asc">Due Date (Earliest to Latest)</option>
                <option value="due_desc">Due Date (Latest to Earliest)</option>
                <option value="created_desc">Created Date (Newest First)</option>
                <option value="created_asc">Created Date (Oldest First)</option>
                <option value="priority">Priority (Critical First)</option>
              </select>
            </label>

            <label className="field-label">
              <span>Priority Filter</span>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="Critical">Critical Only</option>
                <option value="High">High Only</option>
                <option value="Medium">Medium Only</option>
                <option value="Low">Low Only</option>
              </select>
            </label>
          </div>
        )}

        {/* Format Selector */}
        <div className="export-section" style={{ marginTop: '14px' }}>
          <label className="field-label"><span>Download Format</span></label>
          <div className="export-format-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="export-format-card selected" style={{ cursor: 'default' }}>
              <div className="export-format-icon pdf">
                <Icon name="report" size={20} />
              </div>
              <div className="export-format-text">
                <div className="export-format-title">PDF Document (.pdf) <span className="recommended-badge">Official Document</span></div>
                <div className="export-format-desc">Official printable PDF with portal branding, date stamps, and summary counters.</div>
              </div>
              <div className="format-check-circle">
                <Icon name="check" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Matching Preview */}
        <div className="export-preview-box">
          <Icon name="clock" size={15} />
          <span>
            {exportType === 'tasks' && (
              <><strong>{matchingTasks.length} tasks</strong> matching date & priority criteria will be included.</>
            )}
            {exportType === 'audit' && (
              <><strong>{matchingAudit.length} audit events</strong> matching date selection will be included.</>
            )}
            {exportType === 'users' && (
              <><strong>{teamMembers.filter(e => e.enabled).length} active sign-in accounts</strong> will be included.</>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleDownload}
            disabled={downloading}
            style={{ minWidth: '170px' }}
          >
            <Icon name="download" size={15} />
            {downloading ? 'Generating...' : `Download ${format.toUpperCase()} (Date-Wise)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks]                   = useState(() => firebaseConfigured ? [] : loadTaskData());
  const [projectSites, setProjectSites]     = useState(() => firebaseConfigured ? [] : loadProjectSites());
  const [page, setPage]                     = useState('overview');
  const [dark, setDark]                     = useState(false);
  const [query, setQuery]                   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [statusFilter, setStatusFilter]     = useState('All statuses');
  const [teamFilter, setTeamFilter]         = useState('All teams');
  const [datePeriod, setDatePeriod]         = useState('week');
  const [dateFilterDate, setDateFilterDate] = useState('');
  const [weekOffset, setWeekOffset]         = useState(0);
  const [selectedTask, setSelectedTask]     = useState(null);
  const [editingSite, setEditingSite]       = useState(null);
  const [modal, setModal]                   = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [projectSiteToDelete, setProjectSiteToDelete] = useState(null);
  const [exportModalConfig, setExportModalConfig] = useState(null);
  const [formError, setFormError]           = useState('');
  const [notifications, setNotifications]   = useState(3);
  const [notice, setNotice]                 = useState('');
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [profileSettings, setProfileSettings] = useState(loadProfileSettings);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [portalName, setPortalName] = useState('Nerdy Labs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountSettings, setAccountSettings] = useState(loadAccountSettings);
  const [accessRequests, setAccessRequests] = useState(loadAccessRequests);
  const [remoteEmployees, setRemoteEmployees] = useState(null);
  const [deletedEmployeeIds, setDeletedEmployeeIds] = useState(loadDeletedEmployees);
  const [auditLog, setAuditLog] = useState(() => (firebaseConfigured ? [] : loadAuditLog()));
  const sourceEmployees = (remoteEmployees || employees).filter(emp => !deletedEmployeeIds.includes(emp.id));
  const teamMembers = sourceEmployees.map(employee => {
    const baseEmp = employees.find(e => e.id === employee.id);
    const savedAccount = !firebaseConfigured ? (accountSettings[employee.id] || {}) : {};
    const savedProfile = !firebaseConfigured ? (profileSettings[employee.id] || {}) : {};
    const isDefaultTL = baseEmp?.role === 'Team Lead' || (Array.isArray(baseEmp?.roles) && baseEmp.roles.includes('Team Lead')) || (typeof baseEmp?.title === 'string' && baseEmp.title.toLowerCase().includes('team lead')) || ['E-003', 'E-004', 'E-008'].includes(employee.id);
    let roles = Array.isArray(savedAccount.roles) && savedAccount.roles.length > 0
      ? savedAccount.roles
      : (savedAccount.role ? [savedAccount.role] : (Array.isArray(employee.roles) && employee.roles.length > 0 ? employee.roles : [employee.role || 'Employee']));
    if (isDefaultTL && !roles.includes('Team Lead')) {
      roles = ['Team Lead', ...roles.filter(r => r !== 'Team Lead')];
    }
    const role = isDefaultTL ? 'Team Lead' : (savedAccount.role || (Array.isArray(savedAccount.roles) ? savedAccount.roles[0] : null) || employee.role || 'Employee');
    return {
      ...employee,
      ...savedAccount,
      ...savedProfile,
      teams: Array.isArray(savedAccount.teams) && savedAccount.teams.length > 0
        ? savedAccount.teams
        : (savedAccount.team ? [savedAccount.team] : (Array.isArray(employee.teams) && employee.teams.length > 0 ? employee.teams : [employee.team || 'Web Dev'])),
      team: savedAccount.team || (Array.isArray(savedAccount.teams) ? savedAccount.teams[0] : null) || (baseEmp ? baseEmp.team : (employee.team || 'Web Dev')),
      roles,
      role,
      enabled: firebaseConfigured ? employee.enabled === true : (savedAccount.enabled ?? true),
      pageAccess: savedAccount.pageAccess || employee.pageAccess,
    };
  });
  const role = currentEmployee?.role;

  useEffect(() => {
    if (!firebaseConfigured) return undefined;
    return onAuthStateChanged(auth, async user => {
      if (!user) {
        setCurrentEmployee(null);
        return;
      }
      try {
        const profileSnapshot = await getDoc(doc(db, 'employees', user.uid));
        const profile = profileSnapshot.data();
        if (!profileSnapshot.exists() || profile?.enabled !== true
          || !['Founder', 'Admin', 'Manager', 'Team Lead', 'Employee'].includes(profile.role)) {
          await signOut(auth);
          setNotice('Your portal account is disabled or has no valid role. Contact your portal administrator.');
          return;
        }
        setCurrentEmployee({
          ...profile,
          uid: user.uid,
          id: profile.employeeId || user.uid,
          email: user.email || profile.email,
        });
        setPage(profile.role === 'Admin' ? 'access' : 'overview');
      } catch (error) {
        console.error('Unable to restore the Firebase session.', error);
        setNotice('Your Firebase session could not be restored. Sign in again.');
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !currentEmployee?.uid) return undefined;
    const reportError = (label) => error => {
      console.error(label, error);
      setNotice(`${label} Check your Firebase access rules and connection.`);
    };
    const unsubscribers = [];
    if (role === 'Admin') {
      unsubscribers.push(onSnapshot(collection(db, 'employees'), snapshot => {
        setRemoteEmployees(snapshot.docs.map(person => ({
          ...person.data(),
          id: person.data().employeeId || person.id,
          uid: person.id,
        })));
      }, reportError('Employee access data could not be loaded.')));
      unsubscribers.push(onSnapshot(collection(db, 'auditLog'), snapshot => {
        setAuditLog(snapshot.docs.map(entry => ({
          ...entry.data(),
          id: entry.id,
          timestamp: entry.data().createdAt?.toDate?.().toLocaleString() || entry.data().timestamp || '',
          sortAt: entry.data().createdAt?.toMillis?.() || 0,
        })).sort((a, b) => b.sortAt - a.sortAt));
      }, reportError('Audit log could not be loaded.')));
    } else {
      if (role === 'Employee') {
        setRemoteEmployees([currentEmployee]);
      } else {
        const peopleCollection = collection(db, 'employees');
        const peopleQuery = role === 'Team Lead'
          ? firestoreQuery(peopleCollection, where('team', '==', currentEmployee.team))
          : peopleCollection;
        unsubscribers.push(onSnapshot(peopleQuery, snapshot => {
          setRemoteEmployees(snapshot.docs.map(person => ({
            ...person.data(),
            id: person.data().employeeId || person.id,
            uid: person.id,
          })));
        }, reportError('Employee data could not be loaded.')));
      }
      const taskCollection = collection(db, 'tasks');
      const taskQueries = role === 'Founder' || role === 'Manager'
        ? [taskCollection]
        : role === 'Team Lead'
          ? [
            firestoreQuery(taskCollection, where('team', '==', currentEmployee.team)),
            firestoreQuery(taskCollection, where('assignee', '==', null)),
          ]
          : [
            firestoreQuery(taskCollection, where('assignee', '==', currentEmployee.id)),
            firestoreQuery(taskCollection, where('assignee', '==', null)),
          ];
      const taskSnapshots = new Map();
      taskQueries.forEach((taskQuery, index) => {
        unsubscribers.push(onSnapshot(taskQuery, snapshot => {
          taskSnapshots.set(index, snapshot.docs);
          const uniqueTasks = new Map();
          [...taskSnapshots.values()].flat().forEach(task => uniqueTasks.set(task.id, {
            ...task.data(),
            id: Number.isNaN(Number(task.id)) ? task.id : Number(task.id),
          }));
          setTasks([...uniqueTasks.values()]);
        }, reportError('Tasks could not be loaded.')));
      });
      unsubscribers.push(onSnapshot(collection(db, 'sites'), snapshot => {
        setProjectSites(snapshot.docs.map(site => ({ ...site.data(), id: site.id })));
      }, reportError('Websites could not be loaded.')));
    }
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [currentEmployee?.uid, currentEmployee?.team, role]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Unable to save tasks.', error);
      setNotice('Task changes could not be saved in this browser.');
    }
  }, [tasks]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem(accountSettingsKey, JSON.stringify(accountSettings));
    } catch (error) {
      console.error('Unable to save account settings.', error);
      setNotice('Account settings could not be saved in this browser.');
    }
  }, [accountSettings]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem(accessRequestsKey, JSON.stringify(accessRequests));
    } catch (error) {
      console.error('Unable to save access requests.', error);
      setNotice('Access requests could not be saved in this browser.');
    }
  }, [accessRequests]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem(profileSettingsKey, JSON.stringify(profileSettings));
    } catch (error) {
      console.error('Unable to save user profiles.', error);
      setNotice('Profile changes could not be saved in this browser.');
    }
  }, [profileSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(deletedEmployeesKey, JSON.stringify(deletedEmployeeIds));
    } catch (error) {
      console.error('Unable to save deleted employees list.', error);
    }
  }, [deletedEmployeeIds]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem('nerdylabs-project-sites', JSON.stringify(projectSites));
    } catch (error) {
      console.error('Unable to save project website details.', error);
      setNotice('Project website changes could not be saved in this browser.');
    }
  }, [projectSites]);

  useEffect(() => {
    if (firebaseConfigured) return;
    try {
      window.localStorage.setItem(auditLogKey, JSON.stringify(auditLog));
    } catch (error) {
      console.error('Unable to save audit log.', error);
    }
  }, [auditLog]);

  const recordAudit = (action, taskId, detail, actorName = currentEmployee?.name || 'System', actorRole = currentEmployee?.role || 'Staff') => {
    const timestamp = formatAuditTimestamp();
    const entry = {
      action,
      taskId: taskId || null,
      actor: actorName,
      actorUid: currentEmployee?.uid || null,
      role: actorRole,
      detail,
      timestamp,
      ...(firebaseConfigured ? { createdAt: serverTimestamp() } : { id: Date.now() + Math.random() }),
    };
    if (firebaseConfigured) {
      addDoc(collection(db, 'auditLog'), entry).catch(error => {
        console.error('Unable to save audit event.', error);
        setNotice('The change was made, but its audit event could not be saved.');
      });
    } else {
      setAuditLog(cur => [entry, ...cur].slice(0, 100));
    }
  };

  const handleLogin = async (email, password) => {
    if (firebaseConfigured) {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (error) {
        console.error('Firebase authentication failed.', error);
        return { success: false, message: 'Sign-in failed. Check your email and password, then try again.' };
      }
      let profileSnapshot;
      try {
        profileSnapshot = await getDoc(doc(db, 'employees', credential.user.uid));
      } catch (error) {
        console.error('Unable to read the employee profile from Firestore.', error);
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Unable to end the incomplete Firebase session.', signOutError);
        }
        return { success: false, message: 'Your account signed in, but its employee profile could not be read. Check Firestore rules and account setup.' };
      }
      const profile = profileSnapshot.data();
      if (!profileSnapshot.exists() || profile?.enabled !== true) {
        await signOut(auth);
        return { success: false, message: 'Your portal account is not enabled. Contact your portal administrator.' };
      }
      if (!['Founder', 'Admin', 'Manager', 'Team Lead', 'Employee'].includes(profile.role)) {
        await signOut(auth);
        return { success: false, message: 'Your account has no valid portal role. Contact your portal administrator.' };
      }
      setCurrentEmployee({
        ...profile,
        uid: credential.user.uid,
        id: profile.employeeId || credential.user.uid,
        email: credential.user.email || profile.email,
      });
      setRemoteEmployees(null);
      setTasks([]);
      setProjectSites([]);
      setAuditLog([]);
      setPage(profile.role === 'Admin' ? 'access' : 'overview');
      recordAudit('User signed in', null, `User signed in via Firebase (${credential.user.email || profile.email})`, profile.name || credential.user.email, profile.role || 'Staff');
      return { success: true };
    }
    const cleanEmail = email.trim().toLowerCase();
    const emp = teamMembers.find(person => {
      if (person.email.toLowerCase() === cleanEmail && person.password === password) return true;
      if (cleanEmail === 'ananya.iyer@nerdylabs.io' && (password === 'tl@123' || password === 'devtl@123') && person.id === 'E-003') return true;
      if (cleanEmail === 'devtl@nerdylabs.io' && (password === 'devtl@123' || password === 'tl@123') && person.id === 'E-003') return true;
      if (cleanEmail === 'karthik.rao@nerdylabs.io' && (password === 'tl@456' || password === 'qa-tl@123') && person.id === 'E-004') return true;
      if (cleanEmail === 'qa-tl@nerdylabs.io' && (password === 'qa-tl@123' || password === 'tl@456') && person.id === 'E-004') return true;
      if (cleanEmail === 'meera.joshi@nerdylabs.io' && (password === 'meera@123' || password === 'uiux-tl@123') && person.id === 'E-008') return true;
      if (cleanEmail === 'uiux-tl@nerdylabs.io' && (password === 'uiux-tl@123' || password === 'meera@123') && person.id === 'E-008') return true;
      return false;
    });
    if (!emp) return { success: false, message: 'Invalid email or password.' };
    if (!emp.enabled) return { success: false, message: 'Account access is disabled. Contact an admin.' };
    setCurrentEmployee(emp);
    setPage(emp.role === 'Admin' ? 'access' : 'overview');
    recordAudit('User signed in', null, `User signed in successfully to portal session (${emp.email})`, emp.name, emp.role || 'Staff');
    return { success: true };
  };
  const requestAccess = (payload) => {
    const email = typeof payload === 'string' ? payload : (payload?.email || '');
    const name = typeof payload === 'object' ? payload?.name : '';
    const team = typeof payload === 'object' ? payload?.team : 'Web Dev';
    const note = typeof payload === 'object' ? payload?.note : '';
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid work email address.' };
    }

    const employee = teamMembers.find(member => member.email.toLowerCase() === cleanEmail);
    if (employee && employee.enabled) {
      return { success: false, message: 'This account already has portal access. Check your password or sign in.' };
    }
    if (accessRequests.some(request =>
      ((request.employeeId && employee && request.employeeId === employee.id) || request.email?.toLowerCase() === cleanEmail)
      && request.status === 'pending'
    )) {
      return { success: true, message: 'Your login request is already waiting for admin approval.' };
    }

    const newRequest = {
      id: `${employee?.id || 'req'}-${Date.now()}`,
      employeeId: employee?.id || null,
      name: name?.trim() || employee?.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      team: team || employee?.team || 'Web Dev',
      note: note?.trim() || '',
      status: 'pending',
      requestedAt: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    };

    setAccessRequests(current => [newRequest, ...current]);
    recordAudit('Submitted login request', null, `${newRequest.name} · ${cleanEmail}`);
    return { success: true, message: 'Your request was sent to the admin. You will be able to sign in once approved.' };
  };

  const reviewAccessRequest = (requestId, approved) => {
    if (!hasRole(currentEmployee, 'Admin')) {
      setNotice('Only admins can review access requests.');
      return;
    }
    const request = accessRequests.find(item => item.id === requestId && item.status === 'pending');
    if (!request) return;

    if (approved) {
      if (request.employeeId) {
        setAccountSettings(current => ({
          ...current,
          [request.employeeId]: { ...current[request.employeeId], enabled: true },
        }));
      } else {
        const newId = `emp-${Date.now()}`;
        const isManagerReq = request.team === 'Manager';
        const isFounderReq = request.team === 'Founder';
        const assignedRole = isFounderReq ? 'Founder' : isManagerReq ? 'Manager' : 'Employee';
        const assignedTeam = (isManagerReq || isFounderReq) ? 'Leadership' : (request.team || 'Web Dev');
        const assignedRoles = [assignedRole];
        const assignedTeams = [assignedTeam];
        const newMember = {
          id: newId,
          name: request.name || request.email.split('@')[0],
          email: request.email,
          role: assignedRole,
          roles: assignedRoles,
          team: assignedTeam,
          teams: assignedTeams,
          enabled: true,
          bio: 'Staff member',
          phone: '',
          location: '',
          skills: [],
        };
        setRemoteEmployees(current => [...(current || teamMembers), newMember]);
        setAccountSettings(current => ({
          ...current,
          [newId]: {
            enabled: true,
            role: assignedRole,
            roles: assignedRoles,
            team: assignedTeam,
            teams: assignedTeams,
            pageAccess: getDefaultPageAccess(assignedRoles),
          },
        }));
      }
    }
    setAccessRequests(current => current.map(item =>
      item.id === requestId ? { ...item, status: approved ? 'approved' : 'rejected' } : item,
    ));
    const displayName = request.name || (teamMembers.find(member => member.id === request.employeeId)?.name) || request.email;
    recordAudit(
      approved ? 'Approved login access' : 'Declined login request',
      null,
      `${displayName} · ${request.email || ''}`,
    );
    setNotice(`${displayName}'s login access was ${approved ? 'approved' : 'declined'}.`);
  };

  const updateProjectSite = async (siteId, changes) => {
    const site = projectSites.find(item => item.id === siteId);
    const isNewProject = !site;
    const cleanName = changes.name?.trim();
    if (!cleanName) {
      setNotice('Enter a website name before saving.');
      return;
    }

    const environment = changes.environment;
    if (!['Live', 'Demo', 'Figma'].includes(environment)) {
      setNotice('Choose Live, Demo, or Figma for this project.');
      return;
    }

    const linkValue = String(environment === 'Figma' ? changes.figmaUrl || '' : changes.url || '').trim();
    let normalizedUrl;
    try {
      const parsedUrl = new URL(linkValue);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('URL must use HTTP or HTTPS.');
      if (environment === 'Figma' && parsedUrl.hostname !== 'figma.com' && !parsedUrl.hostname.endsWith('.figma.com')) {
        throw new Error('Figma links must use a figma.com address.');
      }
      normalizedUrl = parsedUrl.href;
    } catch {
      setNotice(environment === 'Figma'
        ? 'Enter a valid Figma link from figma.com.'
        : 'Enter a valid website link beginning with https:// or http://.');
      return;
    }
    const logoUrl = String(changes.logoUrl || '').trim();
    if (logoUrl && (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(logoUrl) || logoUrl.length > 14_500_000)) {
      setNotice('Choose a PNG, JPG, WEBP, or GIF project logo up to 10 MB.');
      return;
    }

    const newId = site?.id || `site-${Date.now()}`;
    const updatedSite = {
      ...(site || { id: newId, modules: [] }),
      ...changes,
      id: newId,
      name: cleanName,
      url: normalizedUrl,
      domain: new URL(normalizedUrl).host,
      environment,
      ...(environment === 'Figma'
        ? { figmaUrl: normalizedUrl, stage: undefined }
        : { figmaUrl: undefined, stage: undefined }),
      features: Array.isArray(changes.features)
        ? projectFeatures.filter(feature => changes.features.includes(feature))
        : site?.features || [],
      techStack: Array.isArray(changes.techStack)
        ? projectTechStacks.filter(technology => changes.techStack.includes(technology))
        : site?.techStack || [],
      logoUrl,
    };
    if (firebaseConfigured) {
      try {
        await setDoc(doc(db, 'sites', newId), updatedSite);
      } catch (error) {
        console.error('Unable to save project website to Firebase.', error);
        setNotice('Website changes could not be saved. Check your Firebase access rules.');
        return;
      }
    } else if (isNewProject) {
      setProjectSites(current => [...current, updatedSite]);
    } else {
      setProjectSites(current => current.map(item => item.id === siteId ? updatedSite : item));
    }
    setEditingSite(null);
    recordAudit(isNewProject ? 'Added project' : 'Updated project', null, `${updatedSite.name} · ${updatedSite.domain}`);
    setNotice(`${updatedSite.name} ${isNewProject ? 'added' : 'updated'}.`);
  };

  const deleteProjectSite = async (siteId) => {
    const site = projectSites.find(item => item.id === siteId);
    if (!site) return;
    if (firebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'sites', siteId));
      } catch (error) {
        console.error('Unable to delete project from Firebase.', error);
        setNotice('Project could not be deleted from database.');
        return;
      }
    } else {
      setProjectSites(current => current.filter(item => item.id !== siteId));
    }
    setEditingSite(null);
    setProjectSiteToDelete(null);
    recordAudit('Deleted project', null, `${site.name} · ${site.domain || site.url || ''}`);
    setNotice(`Project "${site.name}" deleted.`);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setShowSignOutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowSignOutModal(false);

    if (firebaseConfigured) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Unable to sign out from Firebase.', error);
        setNotice('Sign out failed. Please try again.');
        return;
      }
      if (firebaseConfigured) {
        setRemoteEmployees(null);
        setTasks([]);
        setProjectSites([]);
        setAuditLog([]);
      }
    }
    if (currentEmployee) {
      recordAudit('User signed out', null, `User signed out from portal session (${currentEmployee.email || currentEmployee.name})`, currentEmployee.name, currentEmployee.role || 'Staff');
    }
    setCurrentEmployee(null); setPage('overview'); setSelectedTask(null);
    setModal(false); setNotice(''); setQuery('');
    setProfileMenuOpen(false);
    setPriorityFilter('All priorities'); setStatusFilter('All statuses'); setTeamFilter('All teams'); setDatePeriod('week'); setDateFilterDate('');
  };

  const updateOwnProfile = async (changes) => {
    const employee = teamMembers.find(member => member.id === currentEmployee?.id);
    if (!employee) {
      setNotice('Your profile could not be found.');
      return;
    }
    const name = String(changes.name || '').trim();
    const title = String(changes.title || '').trim();
    const email = String(changes.email || '').trim().toLowerCase();
    const avatarUrl = String(changes.avatarUrl || '').trim();
    if (!name || !title || !email) {
      setNotice('Name, job title, and email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice('Enter a valid email address.');
      return;
    }
    if (teamMembers.some(member => member.id !== employee.id && member.email.toLowerCase() === email)) {
      setNotice('That email address is already used by another account.');
      return;
    }
    if (avatarUrl && (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(avatarUrl) || avatarUrl.length > 14_500_000)) {
      setNotice('Choose a PNG, JPG, WEBP, or GIF profile image up to 10 MB.');
      return;
    }
    if (name.length > 80 || title.length > 100) {
      setNotice('Name must be 80 characters or fewer and job title must be 100 characters or fewer.');
      return;
    }
    const updatedProfile = { name, title, email, avatarUrl };
    if (firebaseConfigured) {
      if (email !== currentEmployee.email.toLowerCase()) {
        setNotice('Change your sign-in email through Firebase Authentication before updating your profile.');
        return;
      }
      try {
        await setDoc(doc(db, 'employees', currentEmployee.uid), updatedProfile, { merge: true });
      } catch (error) {
        console.error('Unable to save employee profile to Firebase.', error);
        setNotice('Your profile could not be saved. Check your Firebase connection.');
        return;
      }
    } else {
      setProfileSettings(current => ({ ...current, [employee.id]: updatedProfile }));
    }
    setCurrentEmployee(current => ({ ...current, ...updatedProfile }));
    recordAudit('Updated profile', null, `${name} · ${email}`);
    setNotice('Your profile was updated.');
  };

  const updateEmployeeAccount = async (employeeId, changes) => {
    if (!hasRole(currentEmployee, 'Admin')) {
      setNotice('Only admins can manage staff access and roles.');
      return;
    }

    const target = teamMembers.find(employee => employee.id === employeeId);
    if (!target) {
      setNotice('Employee account was not found.');
      return;
    }

    if (employeeId === currentEmployee.id) {
      setNotice('You cannot change your own admin access or role.');
      return;
    }

    const accountChanges = { ...changes };

    let nextTeams;
    if (Array.isArray(accountChanges.teams)) {
      nextTeams = accountChanges.teams.filter(t => employeeTeams.includes(t));
      if (nextTeams.length === 0) {
        nextTeams = ['Web Dev'];
      }
      accountChanges.teams = nextTeams;
      accountChanges.team = nextTeams[0];
    } else if (accountChanges.team) {
      if (!employeeTeams.includes(accountChanges.team)) {
        setNotice(`${accountChanges.team} is not a valid domain.`);
        return;
      }
      nextTeams = [accountChanges.team];
      accountChanges.teams = nextTeams;
    } else {
      nextTeams = getEmployeeTeams(target);
    }
    const nextTeam = nextTeams[0] || 'Web Dev';

    let nextRoles;
    if (Array.isArray(accountChanges.roles)) {
      nextRoles = accountChanges.roles.filter(r => allAvailableRoles.includes(r));
      if (nextRoles.length === 0) {
        nextRoles = ['Employee'];
      }
      accountChanges.roles = nextRoles;
      accountChanges.role = nextRoles[0];
    } else if (accountChanges.role) {
      if (!allAvailableRoles.includes(accountChanges.role)) {
        setNotice(`${accountChanges.role} is not a valid role.`);
        return;
      }
      nextRoles = [accountChanges.role];
      accountChanges.roles = nextRoles;
    } else {
      nextRoles = getEmployeeRoles(target);
    }
    const nextRole = nextRoles[0] || 'Employee';

    const activeAdminCount = teamMembers.filter(employee => hasRole(employee, 'Admin') && employee.enabled).length;
    const nextEnabled = changes.enabled ?? target.enabled;
    const targetHasAdmin = hasRole(target, 'Admin');
    const willHaveAdmin = nextRoles.includes('Admin');

    if (targetHasAdmin && target.enabled && activeAdminCount === 1 && (!willHaveAdmin || !nextEnabled)) {
      setNotice('The last active admin account cannot be disabled or stripped of the Admin role.');
      return;
    }

    if (firebaseConfigured) {
      if (!target.uid) {
        setNotice('This staff account has no Firebase user ID and cannot be updated.');
        return;
      }
      try {
        await setDoc(doc(db, 'employees', target.uid), {
          team: nextTeam,
          teams: nextTeams,
          role: nextRole,
          roles: nextRoles,
          enabled: nextEnabled,
          ...(accountChanges.pageAccess ? { pageAccess: accountChanges.pageAccess } : {}),
        }, { merge: true });
      } catch (error) {
        console.error('Unable to update staff access in Firebase.', error);
        setNotice('Staff access could not be updated. Check the Firebase employee rules.');
        return;
      }
    } else {
      setAccountSettings(current => ({
        ...current,
        [employeeId]: { ...current[employeeId], ...accountChanges },
      }));
    }
    recordAudit(
      'Updated account access',
      null,
      `${target.name}: ${Object.entries(accountChanges).map(([key, value]) => Array.isArray(value) ? `${key} [${value.length}]` : `${key} ${value}`).join(', ')}`,
    );
    setNotice(`${target.name}'s account settings updated.`);
  };

  const deleteEmployeeAccount = async (employeeId) => {
    if (!hasRole(currentEmployee, 'Admin')) {
      setNotice('Only Admins can delete staff accounts.');
      return;
    }

    const target = teamMembers.find(employee => employee.id === employeeId);
    if (!target) {
      setNotice('Employee account was not found.');
      return;
    }

    if (employeeId === currentEmployee.id) {
      setNotice('You cannot delete your own active Admin account.');
      return;
    }

    const activeAdminCount = teamMembers.filter(employee => hasRole(employee, 'Admin') && employee.enabled).length;
    if (hasRole(target, 'Admin') && activeAdminCount <= 1) {
      setNotice('The last active Admin account cannot be deleted.');
      return;
    }

    if (firebaseConfigured) {
      if (target.uid) {
        try {
          await deleteDoc(doc(db, 'employees', target.uid));
        } catch (error) {
          console.error('Unable to delete employee from Firebase.', error);
          setNotice('Employee could not be deleted from Firebase. Check access rules.');
          return;
        }
      }
    }

    setDeletedEmployeeIds(cur => [...cur, employeeId]);
    setTasks(cur => cur.map(t => t.assignee === employeeId ? { ...t, assignee: '' } : t));
    setAccessRequests(cur => cur.filter(req => req.employeeId !== employeeId && req.email?.toLowerCase() !== target.email?.toLowerCase()));

    recordAudit(
      'Deleted staff account',
      null,
      `Permanently removed: ${target.name} (${target.email}) • Team: ${target.team} • Role: ${target.role}`,
      currentEmployee?.name || 'Admin',
      currentEmployee?.role || 'Admin'
    );
    setNotice(`Staff account "${target.name}" has been deleted.`);
  };

  const isUserAssignedToTask = (t) => {
    if (!t || !currentEmployee) return false;
    const myId = String(currentEmployee.id);
    const myUid = currentEmployee.uid ? String(currentEmployee.uid) : null;
    const myName = currentEmployee.name ? currentEmployee.name.toLowerCase() : '';

    if (t.assignee && (String(t.assignee) === myId || (myUid && String(t.assignee) === myUid) || (myName && String(t.assignee).toLowerCase() === myName))) {
      return true;
    }
    if (Array.isArray(t.assignees) && t.assignees.some(a =>
      String(a) === myId || (myUid && String(a) === myUid) || (myName && String(a).toLowerCase() === myName)
    )) {
      return true;
    }
    if (myUid && t.assigneeUid && String(t.assigneeUid) === myUid) {
      return true;
    }
    return false;
  };

  const canManageTask = task => {
    if (!task) return false;
    const userRoles = getEmployeeRoles(currentEmployee);
    if (['Founder', 'Admin', 'Manager', 'Team Lead'].includes(role) ||
        ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(currentEmployee?.role) ||
        userRoles.some(r => ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(r)) ||
        isTeamLeadEmployee(currentEmployee)) return true;
    return false;
  };

  const updateTask = async (id, changes, actionLabel = 'Updated task') => {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) {
      setNotice('Task was not found.');
      return false;
    }

    const userRoles = getEmployeeRoles(currentEmployee);
    const hasLeadership = ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(role) ||
      ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(currentEmployee?.role) ||
      userRoles.some(r => ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(r)) ||
      isTeamLeadEmployee(currentEmployee);
    const isAssigned = isUserAssignedToTask(task);
    const isSelfClaim = !hasLeadership && (!task.assignee && (!task.assignees || !task.assignees.length))
      && (changes.assignee === currentEmployee?.id || (Array.isArray(changes.assignees) && changes.assignees.includes(currentEmployee?.id)) || changes.status === 'In Progress');

    if (!hasLeadership && !isAssigned && !isSelfClaim && !canManageTask(task)) {
      setNotice('You do not have permission to update this task.');
      return false;
    }
    const isEmployeeOnly = !hasLeadership && !canManageTask(task);
    if (isEmployeeOnly && !isSelfClaim && Object.keys(changes).some(key => !['title', 'status', 'priority', 'due', 'dueDate', 'description', 'websiteName', 'siteName'].includes(key))) {
      setNotice('Employees can edit the title, status, priority, description, and due date of their own tasks only.');
      return false;
    }
    if (isEmployeeOnly && isSelfClaim && Object.keys(changes).some(key => !['assignee', 'assigneeUid', 'team', 'status'].includes(key))) {
      setNotice('You can only claim an unassigned task for yourself.');
      return false;
    }
    let normalizedChanges = changes.dueDate
      ? { ...changes, due: Math.round((new Date(`${changes.dueDate}T12:00:00`).getTime() - new Date(`${dateKey(new Date())}T12:00:00`).getTime()) / 86400000) }
      : { ...changes };

    if (isSelfClaim && (!task.assignee && (!task.assignees || !task.assignees.length)) && currentEmployee?.id) {
      normalizedChanges.assignee = currentEmployee.id;
      normalizedChanges.assigneeUid = currentEmployee.uid || null;
      normalizedChanges.assignees = [currentEmployee.id];
      if (!normalizedChanges.team && currentEmployee.team) {
        normalizedChanges.team = currentEmployee.team;
      }
    }

    if (firebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', String(id)), {
          ...normalizedChanges,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error('Unable to update task in Firebase.', error);
        setNotice('Task changes could not be saved. Check your Firebase access rules.');
        return false;
      }
    }
    setTasks(cur => cur.map(t => String(t.id) === String(id) ? { ...t, ...normalizedChanges } : t));
    setSelectedTask(cur => cur && String(cur.id) === String(id) ? { ...cur, ...normalizedChanges } : cur);
    const detail = changes.status
      ? `Moved task NL-${id} ("${task.title}") to ${changes.status}`
      : Object.entries(changes).map(([key, value]) => `${key}: ${value}`).join(', ');
    recordAudit(actionLabel, id, detail || `Updated task ${task?.title || 'record'}`, currentEmployee?.name || 'System', currentEmployee?.role || 'Staff');
    setNotice(`Task NL-${id} updated.`);
    return true;
  };

  const updateTaskStatus = async (id, status) => {
    if (await updateTask(id, { status }, 'Updated status')) {
      setNotice(`Task NL-${id} moved to ${status}.`);
    }
  };

  const deleteTask = async (id) => {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task || !canManageTask(task)) {
      setNotice('You do not have permission to delete this task.');
      return;
    }
    if (firebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'tasks', String(id)));
      } catch (error) {
        console.error('Unable to delete task from Firebase.', error);
        setNotice('Task could not be deleted. Check your Firebase access rules.');
        return;
      }
    }
    setTasks(cur => cur.filter(t => String(t.id) !== String(id)));
    setSelectedTask(null);
    recordAudit('Deleted task', id, `Removed: NL-${id} ${task?.title || 'task record'}`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
    setNotice(`Task NL-${id} deleted.`);
  };

  const downloadTaskReport = () => {
    const rows = tasks.map(task => {
      const emp = teamMembers.find(p => p.id === task.assignee);
      const site = projectSites.find(s => s.id === task.siteId);
      return [
        `NL-${task.id}`,
        task.title,
        site?.name || '',
        moduleNames[task.module] || '',
        emp?.name || '',
        task.priority,
        task.status,
        dayLabel(task.due),
      ];
    });

    const headers = ['Task ID', 'Title', 'Website', 'Module', 'Assignee', 'Priority', 'Status', 'Due'];
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nerdylabs-task-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('Downloaded report', null, `CSV export for ${tasks.length} tasks`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
    setNotice('Task report downloaded.');
  };

  const downloadAuditLog = () => {
    const headers = ['ID', 'Action', 'Actor', 'Role', 'Detail', 'Timestamp'];
    const rows = auditLog.map(item => [
      item.id,
      item.action,
      item.actor,
      item.role,
      item.detail || '',
      item.timestamp || '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nerdylabs-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('Downloaded audit log', null, `Exported ${auditLog.length} audit events`);
    setNotice('Audit log downloaded as CSV.');
  };

  const downloadAllPortalData = () => {
    const fullData = {
      exportDate: new Date().toISOString(),
      exportedBy: currentEmployee ? `${currentEmployee.name} (${currentEmployee.email})` : 'Admin',
      portalName,
      employees: teamMembers.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        team: e.team,
        role: e.role,
        enabled: e.enabled,
        bio: e.bio || '',
      })),
      accessRequests,
      projectSites,
      tasks: tasks.map(t => ({
        id: `NL-${t.id}`,
        title: t.title,
        website: projectSites.find(s => s.id === t.siteId)?.name || 'Unassigned',
        feature: t.feature || t.moduleName,
        techStack: t.techStack,
        priority: t.priority,
        status: t.status,
        assignee: teamMembers.find(m => m.id === t.assignee)?.name || 'Unassigned',
        dueDate: t.dueDate,
      })),
      auditLog,
    };
    const json = JSON.stringify(fullData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nerdylabs-portal-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('Exported all portal data', null, 'Downloaded full system backup (JSON)');
    setNotice('Complete portal data backup downloaded.');
  };

  const downloadUserData = (employee) => {
    const userTasks = tasks.filter(t => t.assignee === employee.id);
    const userAudit = auditLog.filter(a =>
      a.actor?.toLowerCase() === employee.name.toLowerCase() ||
      a.detail?.toLowerCase().includes(employee.name.toLowerCase()) ||
      a.detail?.toLowerCase().includes(employee.email.toLowerCase())
    );

    const lines = [
      '=== USER PROFILE ===',
      `Employee ID,"${employee.id}"`,
      `Name,"${employee.name}"`,
      `Email,"${employee.email}"`,
      `Domain / Team,"${getEmployeeTeams(employee).join(', ')}"`,
      `Roles,"${getEmployeeRoles(employee).join(', ')}"`,
      `Portal Login Access,"${employee.enabled ? 'Enabled (Can sign in)' : 'Disabled (No access)'}"`,
      '',
      '=== TASK SUMMARY ===',
      `Total Assigned Tasks,${userTasks.length}`,
      `Done,${userTasks.filter(t => t.status === 'Done').length}`,
      `In Progress,${userTasks.filter(t => t.status === 'In Progress').length}`,
      `Blocked / On Hold,${userTasks.filter(t => t.status === 'Blocked' || t.status === 'On Hold').length}`,
      `Overdue,${userTasks.filter(t => t.due < 0 && t.status !== 'Done').length}`,
      '',
      '=== ASSIGNED TASKS ===',
      ['Task ID', 'Title', 'Website', 'Feature', 'Tech Stack', 'Priority', 'Status', 'Due Date'].join(','),
      ...userTasks.map(t => {
        const site = projectSites.find(s => s.id === t.siteId);
        return [
          `NL-${t.id}`,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(site?.name || 'Unassigned').replace(/"/g, '""')}"`,
          `"${(t.feature || t.moduleName || '').replace(/"/g, '""')}"`,
          `"${(t.techStack || '').replace(/"/g, '""')}"`,
          t.priority,
          t.status,
          t.dueDate || dayLabel(t.due),
        ].join(',');
      }),
      '',
      '=== RECENT USER AUDIT EVENTS ===',
      ['Event ID', 'Action', 'Details', 'Timestamp'].join(','),
      ...userAudit.map(a => [
        a.id,
        `"${(a.action || '').replace(/"/g, '""')}"`,
        `"${(a.detail || '').replace(/"/g, '""')}"`,
        `"${(a.timestamp || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = employee.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `nerdylabs-user-${sanitizedName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('Downloaded user data', null, `Exported separate report for ${employee.name} (${employee.email})`);
    setNotice(`Data report for ${employee.name} downloaded successfully.`);
  };

  const downloadSignInUsersList = () => {
    const signInUsers = teamMembers.filter(e => e.enabled);
    const headers = ['Employee ID', 'Name', 'Email', 'Domain / Team', 'Role', 'Assigned Tasks Count', 'Sign-in Access'];
    const rows = signInUsers.map(u => {
      const taskCount = tasks.filter(t => t.assignee === u.id).length;
      return [
        u.id,
        u.name,
        u.email,
        u.team,
        u.role,
        taskCount,
        'Active (Can sign in)',
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nerdylabs-signin-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('Downloaded sign-in users list', null, `Exported ${signInUsers.length} active sign-in accounts`);
    setNotice('Sign-in users list downloaded as CSV.');
  };

  const downloadUserPdf = (employee) => {
    generateUserPdf({
      employee,
      tasks,
      auditLog,
      portalName,
      currentEmployee,
    });
    recordAudit('Downloaded user PDF report', null, `Exported PDF dossier for ${employee.name} (${employee.email})`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
    setNotice(`PDF report for ${employee.name} downloaded successfully.`);
  };

  const downloadAuditPdf = () => {
    generateAuditPdf({
      auditLog,
      portalName,
      currentEmployee,
      dateScopeLabel: 'All Dates',
    });
    recordAudit('Downloaded Audit PDF', null, `Exported PDF for ${auditLog.length} audit records`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
    setNotice('Audit log downloaded as PDF.');
  };

  const downloadSignInUsersPdf = () => {
    const activeUsers = teamMembers.filter(e => e.enabled);
    generateSignInUsersPdf({
      users: activeUsers,
      tasks,
      portalName,
      currentEmployee,
    });
    recordAudit('Downloaded Users PDF', null, `Exported PDF for ${activeUsers.length} sign-in users`, currentEmployee?.name || 'System', currentEmployee?.role || 'System');
    setNotice(`Sign-in users directory downloaded as PDF (${activeUsers.length} users).`);
  };

  const openExportModal = (customConfig = {}) => {
    setExportModalConfig({
      type: 'tasks',
      dateScope: datePeriod === 'custom' ? 'specific' : datePeriod,
      specificDate: dateFilterDate,
      priority: priorityFilter,
      ...customConfig,
    });
  };

  const createTask = async (e, payload) => {
    if (e && e.preventDefault) e.preventDefault();
    const data = e?.currentTarget ? new FormData(e.currentTarget) : null;
    const title = String(payload?.title || data?.get('title') || '').trim();
    if (title.length < 3) { setFormError('Enter a task name with at least 3 characters.'); return; }
    const isFounder = role === 'Founder';
    const isPriorityBoardAction = page === 'board';

    const websiteMode = payload?.websiteMode || String(data?.get('websiteMode') || (isPriorityBoardAction ? 'new_website' : 'old_website'));
    const workType = payload?.workType || String(data?.get('workType') || (websiteMode === 'new_website' ? 'New Website' : 'Extra Work'));

    let selectedFeatures = Array.isArray(payload?.features) ? payload.features : [];
    if (!selectedFeatures.length && data) {
      selectedFeatures = data.getAll('features').filter(Boolean);
    }
    if (!selectedFeatures.length) {
      const featVal = String(payload?.feature || data?.get('feature') || '').trim();
      if (featVal) selectedFeatures = [featVal];
    }
    if (!selectedFeatures.length) {
      selectedFeatures = ['Website Revamp'];
    }

    const techStack = String(payload?.techStack || data?.get('techStack') || 'React');
    const uiDesign = payload?.uiDesign === true || data?.get('uiDesign') === 'on';
    const priority = String(payload?.priority || data?.get('priority') || (isPriorityBoardAction ? 'Critical' : 'Medium'));
    const dueDate  = String(payload?.due || data?.get('due') || '');
    const today    = new Date(); today.setHours(0,0,0,0);
    const selectedDueDate = dueDate || dateKeyFromOffset(7);
    const due      = Math.round((new Date(`${selectedDueDate}T12:00:00`).getTime() - new Date(`${dateKey(today)}T12:00:00`).getTime()) / 86400000);

    let selectedSite = null;
    let isBrandNewSite = false;
    const inputSiteName = String(
      payload?.siteName || payload?.newWebsiteName || payload?.websiteName ||
      data?.get('websiteName') || data?.get('siteName') || data?.get('newWebsiteName') || ''
    ).trim();

    if (inputSiteName) {
      const existing = projectSites.find(s => s.name.toLowerCase() === inputSiteName.toLowerCase());
      if (existing) {
        selectedSite = existing;
      } else {
        isBrandNewSite = true;
        selectedSite = {
          id: null,
          name: inputSiteName,
        };
      }
    } else {
      const siteId = String(payload?.siteId || data?.get('siteId') || '');
      selectedSite = projectSites.find(s => s.id === siteId) || projectSites[0];
    }

    // If New Features Update and new features were selected, update the site's features
    if (selectedSite && workType === 'New Features Update' && selectedFeatures.length) {
      const mergedFeatures = [...new Set([...(selectedSite.features || []), ...selectedFeatures])];
      if (mergedFeatures.length > (selectedSite.features || []).length) {
        const updatedSite = { ...selectedSite, features: mergedFeatures };
        if (firebaseConfigured) {
          try {
            await setDoc(doc(db, 'sites', selectedSite.id), updatedSite, { merge: true });
          } catch (err) {
            console.error('Unable to update site features in Firebase', err);
          }
        }
        setProjectSites(cur => cur.map(s => s.id === selectedSite.id ? updatedSite : s));
        selectedSite = updatedSite;
      }
    }

    let selectedAssignees = Array.isArray(payload?.assignees) ? payload.assignees : [];
    if (!selectedAssignees.length && payload?.assignee) {
      selectedAssignees = [payload.assignee];
    } else if (!selectedAssignees.length && data) {
      selectedAssignees = data.getAll('assignees').filter(Boolean);
    }
    if (page === 'my' && currentEmployee?.id) {
      selectedAssignees = [currentEmployee.id];
    }
    const userRoles = getEmployeeRoles(currentEmployee);
    const isTLUser = userRoles.includes('Team Lead') || role === 'Team Lead' || ['E-003', 'E-004', 'E-008'].includes(currentEmployee?.id);
    const isEmployeeUser = !isTLUser && role === 'Employee' && (userRoles.length === 1 && userRoles[0] === 'Employee');
    const rawAssignee = (page === 'my' && currentEmployee?.id)
      ? currentEmployee.id
      : isFounder
      ? (selectedAssignees[0] || null)
      : isEmployeeUser
      ? currentEmployee.id
      : (selectedAssignees[0] || String(payload?.assignee || data?.get('assignee') || '') || null);
    const assignee = rawAssignee || null;
    if (assignee && !selectedAssignees.includes(assignee)) selectedAssignees.push(assignee);
    const assigneeEmployee = assignee ? teamMembers.find(person => person.id === assignee) : null;
    const targetDomain = String(payload?.domain || data?.get('domain') || assigneeEmployee?.team || (isFounder ? 'Web Dev' : currentEmployee?.team || 'Web Dev'));
    const designType = String(payload?.designType || data?.get('designType') || '');
    const posterSize = String(payload?.posterSize || data?.get('posterSize') || '');
    const designTool = String(payload?.designTool || data?.get('designTool') || '');
    const figmaUrl = String(payload?.figmaUrl || data?.get('figmaUrl') || '');
    const qaType = String(payload?.qaType || data?.get('qaType') || 'Functionality Testing');
    const qaRound = String(payload?.qaRound || data?.get('qaRound') || 'Round 1 Testing');
    const qaEnvironment = String(payload?.qaEnvironment || data?.get('qaEnvironment') || '');

    const featureDisplay = targetDomain === 'UI/UX Designer'
      ? (designType ? `${designType}${posterSize ? ` (${posterSize})` : ''}` : 'UI/UX Design')
      : targetDomain === 'QA'
      ? `${qaRound ? `${qaRound} · ` : ''}${qaType || 'Functionality Testing'} · ${qaEnvironment || 'Live'}`
      : selectedFeatures.join(', ');
    const moduleId = Object.keys(moduleNames).find(id => moduleNames[id] === selectedFeatures[0]) || '';
    const maxExistingId = Math.max(135, ...tasks.map(task => Number(task.id) || 0));
    const taskId = firebaseConfigured
      ? Date.now()
      : maxExistingId + 1;
    const newTask = {
      id: taskId,
      title,
      module: moduleId,
      moduleName: selectedFeatures[0] || 'Website Revamp',
      siteId: selectedSite?.id || null,
      siteName: selectedSite?.name || inputSiteName || 'Website',
      websiteName: inputSiteName || selectedSite?.name || 'Website',
      assignee,
      assigneeUid: assigneeEmployee?.uid || null,
      assignees: selectedAssignees,
      team: assigneeEmployee?.team || targetDomain,
      domain: assigneeEmployee?.team || targetDomain,
      designType: targetDomain === 'UI/UX Designer' ? (designType || 'UI/UX Design') : null,
      posterSize: targetDomain === 'UI/UX Designer' ? (posterSize || null) : null,
      designTool: targetDomain === 'UI/UX Designer' ? (designTool || 'Figma') : null,
      figmaUrl: targetDomain === 'UI/UX Designer' ? (figmaUrl || null) : null,
      qaType: targetDomain === 'QA' ? (qaType || 'Functionality Testing') : null,
      qaRound: targetDomain === 'QA' ? (qaRound || 'Round 1 Testing') : null,
      qaEnvironment: targetDomain === 'QA' ? (qaEnvironment || 'Live Website') : null,
      feature: featureDisplay,
      features: selectedFeatures,
      isNewWebsite: payload?.isNewWebsite === true || payload?.workType === 'New Website' || websiteMode === 'new_website' || isBrandNewSite,
      workType: (payload?.isNewWebsite === true || payload?.workType === 'New Website' || websiteMode === 'new_website' || isBrandNewSite) ? 'New Website' : workType,
      fromPriorityBoard: Boolean(isPriorityBoardAction || page === 'board' || isFounder || payload?.fromPriorityBoard),
      techStack: targetDomain === 'UI/UX Designer' ? (designTool || 'Figma') : targetDomain === 'QA' ? `QA (${qaEnvironment || 'Live'})` : techStack,
      uiDesign,
      priority,
      status: assignee ? 'Assigned' : 'Backlog',
      due,
      dueDate: selectedDueDate,
      createdDate: dateKey(today),
      cadence: String(payload?.cadence || data?.get('cadence') || 'Weekly'),
    };
    if (firebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', String(newTask.id)), {
          ...newTask,
          createdBy: currentEmployee.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Unable to create task in Firebase.', error);
        setFormError('Task could not be saved. Check your Firebase access rules and try again.');
        return;
      }
    } else {
      setTasks(cur => [newTask, ...cur]);
    }
    setModal(false); setFormError('');
    setStatusFilter('All statuses');
    setPriorityFilter('All priorities');
    setTeamFilter('All teams');
    setDateFilterDate('');
    setDatePeriod('all');
    const siteName = selectedSite?.name || 'Website';
    setNotice(isPriorityBoardAction || page === 'board'
      ? `NL-${newTask.id} added to the priority board for ${siteName}${newTask.workType ? ` (${newTask.workType})` : ''}.`
      : `NL-${newTask.id} created${assigneeEmployee ? ` and assigned to ${assigneeEmployee.name}` : ''}.`);
    recordAudit('Created task', newTask.id, `${siteName} · ${newTask.workType || 'Task'} · ${featureDisplay} · ${techStack}${assigneeEmployee ? ` · ${assigneeEmployee.name}` : ' · Priority board'}`);
    setPage(page === 'board' ? 'board' : (role === 'Founder' ? 'board' : (page === 'my' ? 'my' : 'all')));
  };

  const isEmployee = role === 'Employee';
  const isFounder = role === 'Founder';

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const taskAssigneeList = Array.isArray(task.assignees) && task.assignees.length ? task.assignees : (task.assignee ? [task.assignee] : []);
    const isDirectAssignee = taskAssigneeList.some(id =>
      id === currentEmployee?.id ||
      (currentEmployee?.uid && (id === currentEmployee.uid || task.assigneeUid === currentEmployee.uid)) ||
      (currentEmployee?.name && id === currentEmployee.name)
    ) || (task.assignee === currentEmployee?.id || task.assignee === currentEmployee?.name || (currentEmployee?.uid && task.assigneeUid === currentEmployee.uid));

    const assignedEmps = teamMembers.filter(p => taskAssigneeList.includes(p.id) || task.assignee === p.id);
    const empNames = assignedEmps.map(p => p.name).join(' ');
    const emp  = teamMembers.find(p => p.id === task.assignee);
    const site = projectSites.find(s => s.id === task.siteId);
    const text = `${task.title} ${empNames} ${site?.name||''} ${task.feature||task.moduleName||moduleNames[task.module]||''} ${task.techStack||''} ${task.designType||''} ${task.posterSize||''} ${task.qaType||''}`.toLowerCase();

    const allTaskTeams = [
      task.team,
      task.domain,
      emp?.team,
      ...assignedEmps.map(p => p.team),
      ...assignedEmps.flatMap(p => getEmployeeTeams(p))
    ].filter(Boolean);
    const taskTeam = task.team || emp?.team || task.domain;

    const isPriorityTask = Boolean(
      task.fromPriorityBoard ||
      task.isNewWebsite === true ||
      task.workType === 'New Website' ||
      task.websiteMode === 'new_website' ||
      task.priority === 'Critical'
    );

    let ownsTask = true;
    const currentRoles = getEmployeeRoles(currentEmployee);
    const hasFounder = currentRoles.includes('Founder') || role === 'Founder';
    const hasManager = currentRoles.includes('Manager') || role === 'Manager';
    const hasAdmin = currentRoles.includes('Admin') || role === 'Admin';
    const hasTL = currentRoles.includes('Team Lead') || role === 'Team Lead';
    const hasEmployee = currentRoles.includes('Employee') || role === 'Employee';

    const userTeams = getEmployeeTeams(currentEmployee);

    if (hasFounder || hasManager || hasAdmin || page === 'board' || isPriorityTask) {
      ownsTask = true;
    } else if (page === 'all') {
      ownsTask = teamFilter === 'All teams' || isDirectAssignee || userTeams.some(t => allTaskTeams.some(tt => hasTeam([tt], t)));
    } else if (hasTL || hasEmployee) {
      ownsTask = isDirectAssignee || userTeams.some(t => allTaskTeams.some(tt => hasTeam([tt], t)));
    }

    const isMyPage  = page !== 'my' || isDirectAssignee;
    const mSearch   = text.includes(query.toLowerCase().trim());
    const mPriority = priorityFilter === 'All priorities' || task.priority === priorityFilter;
    const mStatus   = statusFilter   === 'All statuses'  || task.status   === statusFilter;
    const mTeam     = page === 'my' || teamFilter === 'All teams' || allTaskTeams.some(tt => tt === teamFilter) || taskTeam === teamFilter;
    const taskDateKey = task.dueDate || (typeof task.due === 'number' ? dateKeyFromOffset(task.due) : '');
    let mDate = true;
    if (dateFilterDate) {
      mDate = Boolean(taskDateKey && taskDateKey === dateFilterDate);
    } else if (datePeriod === 'week') {
      if (!taskDateKey) {
        mDate = false;
      } else {
        const taskDate = new Date(`${taskDateKey}T12:00:00`);
        if (Number.isNaN(taskDate.getTime())) {
          mDate = false;
        } else {
          const { start, end } = getWeekRange(weekOffset);
          mDate = taskDate >= start && taskDate <= end;
        }
      }
    } else if (datePeriod === 'month') {
      mDate = isDateInRange(taskDateKey, 'month', task.cadence);
    } else if (datePeriod === 'all') {
      mDate = true;
    }
    return ownsTask && isMyPage && mSearch && mPriority && mStatus && mTeam && mDate;
  }), [tasks, projectSites, page, currentEmployee?.id, currentEmployee?.uid, currentEmployee?.name, currentEmployee?.team, role, isEmployee, query, priorityFilter, statusFilter, teamFilter, datePeriod, dateFilterDate, weekOffset]);

  const userRoles = getEmployeeRoles(currentEmployee);
  const isStrictlyAdmin = userRoles.length === 1 && userRoles[0] === 'Admin';
  const isStrictlyFounder = userRoles.length === 1 && userRoles[0] === 'Founder';
  const allowedUserPages = getEmployeeAllowedPages(currentEmployee);

  const visibleNav = isStrictlyAdmin
    ? navItems.filter(([id]) => ['access', 'signin-users', 'audit'].includes(id))
    : navItems.filter(([id]) => {
        if (isStrictlyFounder && (id === 'my' || id === 'all')) return false;
        if (['access', 'signin-users', 'audit'].includes(id)) {
          return userRoles.includes('Admin');
        }
        return allowedUserPages.includes(id);
      });
  const activePage = page === 'profile' || page === 'activity' || visibleNav.some(([id]) => id === page) ? page : (visibleNav[0]?.[0] || (isStrictlyAdmin ? 'access' : 'overview'));

  const scrollToTop = (smooth = false) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainEl = document.querySelector('.main-content');
    if (mainEl) {
      if (smooth && typeof mainEl.scrollTo === 'function') {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        mainEl.scrollTop = 0;
      }
    }
    const workspaceEl = document.querySelector('.workspace');
    if (workspaceEl) {
      if (smooth && typeof workspaceEl.scrollTo === 'function') {
        workspaceEl.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        workspaceEl.scrollTop = 0;
      }
    }
  };

  useEffect(() => {
    scrollToTop(false);
  }, [activePage]);

  if (!currentEmployee) return (
    <LoginPage
      onLogin={handleLogin}
      onRequestAccess={requestAccess}
      dark={dark}
      setDark={setDark}
      portalName={portalName}
      stats={{
        tasksCount: tasks?.length || 28,
        projectsCount: projectSites?.filter(s => s.environment === 'Live').length || 5,
        clientsCount: projectSites?.length ? Math.max(projectSites.length, 8) : 8,
        membersCount: teamMembers?.length || employees?.length || 11
      }}
    />
  );

  return (
    <div className={`app-shell${dark ? ' dark' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${mobileMenuOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand-row">
          <button className="brand" onClick={handleLogout} aria-label="Sign out and return to sign in" style={{ width: '100%' }}>
            <div className="brand-logo-card" style={{ width: '100%' }}>
              <img src="/nerdylabs-logo.png" alt="nerdyLabs" className="sidebar-brand-logo" />
            </div>
          </button>
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="primary-nav" aria-label="Primary">
          {visibleNav.map(([id, label, icon]) => (
            <button key={id} className={`nav-item${activePage === id ? ' active' : ''}`} aria-label={label} onClick={() => {
              const isSamePage = activePage === id;
              setPage(id);
              if (id === 'board' || id === 'all' || id === 'my') {
                setDatePeriod('all');
                setStatusFilter('All statuses');
                setPriorityFilter('All priorities');
                setTeamFilter('All teams');
                setDateFilterDate('');
              }
              setMobileMenuOpen(false);
              scrollToTop(isSamePage);
            }}>
              <span className="nav-icon">
                <Icon name={icon} size={17} />
                {id === 'activity' && notifications > 0 && <span className="nav-count">{notifications}</span>}
              </span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-logout" onClick={handleLogout} aria-label="Sign out">
            <Icon name="logout" size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── WORKSPACE ── */}
      <div className="workspace">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu">
              <Icon name="menu" size={20} />
            </button>
            <h2 className="topbar-title">{activePage === 'profile' ? 'My Profile' : activePage === 'activity' ? 'Activity & Notifications' : navItems.find(([id]) => id === activePage)?.[1] || 'Overview'}</h2>
          </div>
          {role !== 'Admin' && <label className="global-search">
            <Icon name="search" size={16} />
            <input aria-label="Search" placeholder="Search tasks, people, websites…" value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button className="clear-search" onClick={() => setQuery('')}><Icon name="close" size={13} /></button>}
          </label>}
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setDark(v => !v)} title={dark ? 'Light mode' : 'Dark mode'}>
              <Icon name={dark ? 'sun' : 'moon'} size={17} />
            </button>
            {role !== 'Admin' && <button className="icon-button notification-button" onClick={() => {
              const isSamePage = page === 'activity';
              setPage('activity');
              setNotifications(0);
              scrollToTop(isSamePage);
            }}>
              <Icon name="bell" size={17} />
              {notifications > 0 && <span className="notification-dot">{notifications}</span>}
            </button>}
            <div className="top-profile-wrap">
              <button
                className={`top-profile-button${page === 'profile' ? ' active' : ''}`}
                type="button"
                aria-label="My Profile"
                onClick={() => {
                  const isSamePage = page === 'profile';
                  setPage('profile');
                  setProfileMenuOpen(false);
                  scrollToTop(isSamePage);
                }}
                title={`Profile: ${currentEmployee.name}`}
              >
                <span className="avatar top-profile-avatar">
                  {currentEmployee.avatarUrl ? <img src={currentEmployee.avatarUrl} alt="" /> : initials(currentEmployee.name)}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className={`main-content${['sites', 'modules', 'reports', 'board', 'my', 'audit', 'access', 'signin-users'].includes(activePage) ? ' main-content-wide' : ''}`}>
          {notice && (
            <div className="toast" role="status">
              <Icon name="check" size={15} />{notice}
              <button onClick={() => setNotice('')}><Icon name="close" size={13} /></button>
            </div>
          )}
          <PageContent
            page={activePage} tasks={tasks} filteredTasks={filteredTasks}
            employees={teamMembers} sites={projectSites} query={query}
            role={role} currentEmployee={currentEmployee}
            statusFilter={statusFilter} priorityFilter={priorityFilter} teamFilter={teamFilter} datePeriod={datePeriod} dateFilterDate={dateFilterDate} weekOffset={weekOffset}
            setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter} setTeamFilter={setTeamFilter}
            setDatePeriod={setDatePeriod}
            setDateFilterDate={setDateFilterDate}
            setWeekOffset={setWeekOffset}
            setPage={setPage} openTask={t => setSelectedTask(t)} notifications={notifications}
            portalName={portalName} setPortalName={setPortalName} onDownloadReport={downloadTaskReport} auditLog={auditLog}
            onDownloadAuditLog={downloadAuditLog} onDownloadAllData={downloadAllPortalData}
            onDownloadUserData={downloadUserData} onDownloadSignInUsersList={downloadSignInUsersList}
            onDownloadUserPdf={downloadUserPdf} onDownloadAuditPdf={downloadAuditPdf} onDownloadSignInUsersPdf={downloadSignInUsersPdf}
            onOpenExportModal={openExportModal}
            onUpdateEmployeeAccount={updateEmployeeAccount} onDeleteEmployeeAccount={deleteEmployeeAccount}
            onDeleteTask={deleteTask}
            accessRequests={accessRequests} onReviewAccessRequest={reviewAccessRequest}
            onEditProjectSite={setEditingSite}
            onDeleteProjectSite={setProjectSiteToDelete}
            onUpdateOwnProfile={updateOwnProfile} onCreateTask={() => { setFormError(''); setModal(true); }}
            onMoveTask={(id, changes) => updateTask(id, changes, 'Moved task')}
          />
        </main>
      </div>

      {selectedTask && <TaskDrawer task={selectedTask} employees={teamMembers} sites={projectSites} close={() => setSelectedTask(null)} updateTask={updateTask} deleteTask={deleteTask} role={role} currentEmployee={currentEmployee} />}
      {modal && <NewTaskModal employees={teamMembers} sites={projectSites} currentEmployee={currentEmployee} role={role} page={page} onClose={() => setModal(false)} onSubmit={createTask} error={formError} />}
      {editingSite && <EditProjectSiteModal site={editingSite} onClose={() => setEditingSite(null)} onSave={updateProjectSite} onDelete={setProjectSiteToDelete} currentEmployee={currentEmployee} />}
      {projectSiteToDelete && (
        <DeleteProjectModal
          site={projectSiteToDelete}
          onClose={() => setProjectSiteToDelete(null)}
          onConfirm={() => deleteProjectSite(projectSiteToDelete.id)}
        />
      )}
      {showSignOutModal && (
        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleConfirmLogout}
          currentEmployee={currentEmployee}
        />
      )}
      {exportModalConfig && (
        <DateWiseExportModal
          config={exportModalConfig}
          onClose={() => setExportModalConfig(null)}
          tasks={tasks}
          teamMembers={teamMembers}
          projectSites={projectSites}
          auditLog={auditLog}
          portalName={portalName}
          currentEmployee={currentEmployee}
          recordAudit={recordAudit}
          setNotice={setNotice}
        />
      )}
    </div>
  );
}

// ─── PAGE ROUTING ────────────────────────────────────────────────────────────
function PageContent(props) {
  const { page, tasks, filteredTasks, employees, sites, query, role, currentEmployee, statusFilter, priorityFilter, teamFilter, datePeriod, dateFilterDate, weekOffset, setStatusFilter, setPriorityFilter, setTeamFilter, setDatePeriod, setDateFilterDate, setWeekOffset, setPage, openTask, notifications, portalName, setPortalName, onDownloadReport, auditLog, onDownloadAuditLog, onDownloadAllData, onDownloadUserData, onDownloadSignInUsersList, onDownloadUserPdf, onDownloadAuditPdf, onDownloadSignInUsersPdf, onOpenExportModal, onUpdateEmployeeAccount, onDeleteEmployeeAccount, onDeleteTask, accessRequests, onReviewAccessRequest, onEditProjectSite, onDeleteProjectSite, onUpdateOwnProfile, onCreateTask, onMoveTask } = props;

  if (page === 'profile') {
    return <ProfilePage currentEmployee={currentEmployee} onSave={onUpdateOwnProfile} />;
  }

  const userRoles = getEmployeeRoles(currentEmployee);
  const isStrictlyAdmin = userRoles.length === 1 && userRoles[0] === 'Admin';
  const isStrictlyFounder = userRoles.length === 1 && userRoles[0] === 'Founder';
  const userHasAdmin = userRoles.includes('Admin');
  const userHasFounder = userRoles.includes('Founder');

  const myTasks = userHasFounder || isStrictlyAdmin
    ? tasks
    : tasks.filter(task => {
        const taskAssigneeList = Array.isArray(task.assignees) && task.assignees.length ? task.assignees : (task.assignee ? [task.assignee] : []);
        return taskAssigneeList.some(id =>
          id === currentEmployee?.id ||
          (currentEmployee?.uid && (id === currentEmployee.uid || task.assigneeUid === currentEmployee.uid)) ||
          (currentEmployee?.name && id === currentEmployee.name)
        ) || (task.assignee === currentEmployee?.id || task.assignee === currentEmployee?.name || (currentEmployee?.uid && task.assigneeUid === currentEmployee.uid));
      });
  if (['audit', 'access', 'signin-users'].includes(page) && !userHasAdmin) {
    return <Overview tasks={tasks} sites={sites} employees={employees} openTask={openTask} setPage={setPage} currentEmployee={currentEmployee} onDeleteTask={onDeleteTask} />;
  }
  if (isStrictlyFounder && (page === 'all' || page === 'my')) {
    return <Overview tasks={tasks} sites={sites} employees={employees} openTask={openTask} setPage={setPage} currentEmployee={currentEmployee} onDeleteTask={onDeleteTask} />;
  }
  if (isStrictlyAdmin && !['access', 'signin-users', 'audit'].includes(page)) {
    return (
      <AdminAccessPage
        employees={employees}
        currentEmployee={currentEmployee}
        onUpdateEmployeeAccount={onUpdateEmployeeAccount}
        accessRequests={accessRequests}
        onReviewAccessRequest={onReviewAccessRequest}
        onDownloadAllData={onDownloadAllData}
        onDownloadUserData={onDownloadUserData}
        onDeleteEmployeeAccount={onDeleteEmployeeAccount}
      />
    );
  }
  if (page === 'audit' && userHasAdmin) {
    return (
      <AuditLogPage
        auditLog={auditLog}
        onDownloadAuditLog={onDownloadAuditLog}
        onDownloadAuditPdf={onDownloadAuditPdf}
        onOpenExportModal={onOpenExportModal}
        onDownloadAllData={onDownloadAllData}
        onDownloadTaskReport={onDownloadReport}
      />
    );
  }
  if (page === 'signin-users' && userHasAdmin) {
    return (
      <SignInUsersPage
        employees={employees}
        tasks={tasks}
        currentEmployee={currentEmployee}
        onDownloadUserData={onDownloadUserData}
        onDownloadSignInUsersList={onDownloadSignInUsersList}
        onDownloadSignInUsersPdf={onDownloadSignInUsersPdf}
        onDownloadUserPdf={onDownloadUserPdf}
        onOpenExportModal={onOpenExportModal}
        onDownloadAllData={onDownloadAllData}
        onDeleteEmployeeAccount={onDeleteEmployeeAccount}
      />
    );
  }
  if (page === 'access' && userHasAdmin) {
    return (
      <AdminAccessPage
        employees={employees}
        currentEmployee={currentEmployee}
        onUpdateEmployeeAccount={onUpdateEmployeeAccount}
        accessRequests={accessRequests}
        onReviewAccessRequest={onReviewAccessRequest}
        onDownloadAllData={onDownloadAllData}
        onDownloadUserData={onDownloadUserData}
        onDeleteEmployeeAccount={onDeleteEmployeeAccount}
      />
    );
  }
  if (page === 'overview')  return <Overview tasks={myTasks} sites={sites} employees={employees} openTask={openTask} setPage={setPage} currentEmployee={currentEmployee} onDeleteTask={onDeleteTask} />;
  if (page === 'all' || page === 'my') return (
    <TaskBoard
      title={page === 'my' ? 'My Tasks' : 'All Tasks'}
      subtitle={query ? `Results for "${query}"` : 'Review and track your tasks by status and priority.'}
      tasks={filteredTasks} employees={employees} sites={sites} openTask={openTask} role={role}
      currentEmployee={currentEmployee} onCreateTask={onCreateTask} onMoveTask={onMoveTask} onDeleteTask={onDeleteTask}
      onOpenExportModal={onOpenExportModal}
      groupBy="status"
      statusFilter={statusFilter} priorityFilter={priorityFilter} teamFilter={teamFilter}
      datePeriod={datePeriod} dateFilterDate={dateFilterDate} weekOffset={weekOffset} setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter}
      setTeamFilter={setTeamFilter} setDatePeriod={setDatePeriod} setDateFilterDate={setDateFilterDate} setWeekOffset={setWeekOffset}
    />
  );
  if (page === 'board') return (
    <TaskBoard
      title="Priority Board" subtitle="Focus on the most important work first."
      tasks={filteredTasks} employees={employees} sites={sites} openTask={openTask} role={role}
      currentEmployee={currentEmployee} onCreateTask={onCreateTask} onMoveTask={onMoveTask} onDeleteTask={onDeleteTask}
      onOpenExportModal={onOpenExportModal}
      groupBy="priority" statusFilter={statusFilter} priorityFilter={priorityFilter} teamFilter={teamFilter}
      datePeriod={datePeriod} dateFilterDate={dateFilterDate} weekOffset={weekOffset} setStatusFilter={setStatusFilter} setPriorityFilter={setPriorityFilter}
      setTeamFilter={setTeamFilter} setDatePeriod={setDatePeriod} setDateFilterDate={setDateFilterDate} setWeekOffset={setWeekOffset}
    />
  );
  if (page === 'sites' || page === 'modules') return <ProjectsWebsitesPage sites={sites} tasks={tasks} onEditSite={onEditProjectSite} onDeleteSite={onDeleteProjectSite} />;
  if (page === 'employees') return <EmployeesPage employees={employees} tasks={tasks} />;
  if (page === 'workload')  return <WorkloadPage employees={employees} tasks={tasks} openTask={openTask} onCreateTask={onCreateTask} sites={sites} setPage={setPage} />;
  if (page === 'reports')   return <ReportsPage tasks={myTasks} />;
  if (page === 'activity')  return <ActivityPage notifications={notifications} />;
  if (page === 'profile') return <ProfilePage currentEmployee={currentEmployee} onSave={onUpdateOwnProfile} />;
  return <Overview tasks={tasks} sites={sites} employees={employees} openTask={openTask} setPage={setPage} currentEmployee={currentEmployee} onDeleteTask={onDeleteTask} />;
}

function AuditLogPage({ auditLog, onDownloadAuditLog, onDownloadAuditPdf, onOpenExportModal, onDownloadAllData, onDownloadTaskReport }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isSignInAction = (action = '') => /sign-?in|login/i.test(action);
  const isAddAction = (action = '') => /create|added|add\b/i.test(action);
  const isDeleteAction = (action = '') => /delete|remove/i.test(action);
  const isUpdateAction = (action = '') => /update|move|assign|edit|role|access/i.test(action);

  const signInEvents = auditLog.filter(item => isSignInAction(item.action));
  const addEvents = auditLog.filter(item => isAddAction(item.action));
  const deleteEvents = auditLog.filter(item => isDeleteAction(item.action));
  const updateEvents = auditLog.filter(item => isUpdateAction(item.action) && !isAddAction(item.action) && !isDeleteAction(item.action));

  const filteredLog = auditLog.filter(item => {
    if (activeCategory === 'signin' && !isSignInAction(item.action)) return false;
    if (activeCategory === 'add' && !isAddAction(item.action)) return false;
    if (activeCategory === 'delete' && !isDeleteAction(item.action)) return false;
    if (activeCategory === 'update' && !(isUpdateAction(item.action) && !isAddAction(item.action) && !isDeleteAction(item.action))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchActor = item.actor?.toLowerCase().includes(q);
      const matchRole = item.role?.toLowerCase().includes(q);
      const matchAction = item.action?.toLowerCase().includes(q);
      const matchDetail = item.detail?.toLowerCase().includes(q);
      const matchTime = item.timestamp?.toLowerCase().includes(q);
      return matchActor || matchRole || matchAction || matchDetail || matchTime;
    }
    return true;
  });

  const getActorColor = (role) => {
    if (role === 'Admin') return '#DC2626';
    if (role === 'Founder') return '#EA580C';
    if (role === 'Manager') return '#7C3AED';
    if (role === 'Team Lead') return '#2563EB';
    return '#4F46E5';
  };

  return (
    <>
      <PageHeading
        title="Audit Log"
        subtitle="Read-only activity history tracking all sign-ins, data additions, updates, and deletions."
        action={
          onDownloadAuditPdf && (
            <button className="button button-primary" onClick={onDownloadAuditPdf} title="Export audit activity log as PDF (Date-Wise)">
              <Icon name="report" size={15} /> Export Audit Log (PDF)
            </button>
          )
        }
      />

      {/* Filter Tabs & Quick Search */}
      <div className="audit-category-bar">
        <div className="audit-tabs">
          <button
            type="button"
            className={`audit-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span>All Actions</span>
            <span className="audit-tab-count">{auditLog.length}</span>
          </button>
          <button
            type="button"
            className={`audit-tab ${activeCategory === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveCategory('signin')}
          >
            <span>Sign-in &amp; Sessions</span>
            <span className="audit-tab-count">{signInEvents.length}</span>
          </button>
          <button
            type="button"
            className={`audit-tab ${activeCategory === 'add' ? 'active' : ''}`}
            onClick={() => setActiveCategory('add')}
          >
            <span>Add Data</span>
            <span className="audit-tab-count">{addEvents.length}</span>
          </button>
          <button
            type="button"
            className={`audit-tab ${activeCategory === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveCategory('delete')}
          >
            <span>Delete Data</span>
            <span className="audit-tab-count">{deleteEvents.length}</span>
          </button>
          <button
            type="button"
            className={`audit-tab ${activeCategory === 'update' ? 'active' : ''}`}
            onClick={() => setActiveCategory('update')}
          >
            <span>Updates</span>
            <span className="audit-tab-count">{updateEvents.length}</span>
          </button>
        </div>

        <div className="audit-search-box">
          <Icon name="search" size={14} className="audit-search-icon" />
          <input
            type="text"
            placeholder="Search person, action, time, details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="audit-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="client-track-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <section className="panel audit-panel" style={{ marginTop: 0 }}>
        <div className="panel-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Recent activity</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-pending-count" style={{ background: 'var(--surface-soft)', color: 'var(--text)', border: '1px solid var(--line)' }}>
              {filteredLog.length} {filteredLog.length === 1 ? 'event' : 'events'} shown
            </span>
          </div>
        </div>

        <div className="audit-log">
          {filteredLog.map(item => (
            <div className="audit-row" key={item.id}>
              <div className="audit-meta">
                <span className="audit-action">{item.action}</span>
                <div className="audit-actor-group">
                  <span className="audit-actor-avatar" style={{ background: getActorColor(item.role) }}>
                    {initials(item.actor)}
                  </span>
                  <span className="audit-actor-name">{item.actor}</span>
                  <span className="audit-role-badge">{item.role}</span>
                </div>
              </div>
              <div className="audit-detail">{item.detail}</div>
              <div className="audit-time">
                <Icon name="clock" size={12} />
                <span>{item.timestamp}</span>
              </div>
            </div>
          ))}
          {!filteredLog.length && (
            <p className="empty-column" style={{ padding: '30px 10px', textAlign: 'center' }}>
              No audit activity matching your filter.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function DeleteEmployeeModal({ employee, onConfirm, onClose }) {
  if (!employee) return null;
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-delete-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ color: '#ef4444' }}>Permanent Action</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px' }}>Delete Employee Account</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="modal-delete-body" style={{ padding: '16px 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
          <p style={{ margin: '0 0 12px' }}>
            Are you sure you want to permanently delete the account for <strong>{employee.name}</strong> (<code>{employee.email}</code>)?
          </p>
          <div style={{ background: 'var(--surface-soft)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '14px', fontSize: '12px' }}>
            <div><strong>Role:</strong> {employee.role}</div>
            <div><strong>Domain / Team:</strong> {employee.team}</div>
            <div><strong>Portal Login Access:</strong> {employee.enabled ? 'Can sign in' : 'No access'}</div>
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>
            This will permanently remove this employee from the portal, revoke sign-in permissions, and unassign their current tasks. This action cannot be undone.
          </p>
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger-solid"
            onClick={() => {
              onConfirm(employee.id);
              onClose();
            }}
          >
            <Icon name="trash" size={14} />
            <span>Yes, Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MultiDomainPicker({ employee, disabled, onUpdateTeams }) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef(null);
  const currentTeams = getEmployeeTeams(employee);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const toggleTeam = (targetTeam) => {
    if (disabled) return;
    const isSelected = currentTeams.includes(targetTeam);

    if (isSelected) {
      if (currentTeams.length === 1) return;
      const next = currentTeams.filter(t => t !== targetTeam);
      onUpdateTeams(next);
    } else {
      const next = employeeTeams.filter(t => currentTeams.includes(t) || t === targetTeam);
      onUpdateTeams(next);
    }
  };

  return (
    <div className="multi-role-picker" ref={containerRef}>
      <button
        type="button"
        className={`multi-role-trigger ${open ? 'active' : ''}`}
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        title={disabled ? 'Domain is locked' : 'Click to assign or change domains / teams'}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="multi-role-chips">
          {currentTeams.map(team => {
            const teamClass = `domain-chip-${team.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            return (
              <span key={team} className={`domain-chip ${teamClass}`}>
                {team}
              </span>
            );
          })}
        </div>
        <Icon name="chevron" size={13} className={`role-picker-arrow ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="multi-role-dropdown" role="listbox">
          <div className="multi-role-dropdown-header">
            <span>Assign Domains / Teams</span>
            <small>Select all domains that apply ({currentTeams.length} selected)</small>
          </div>
          <div className="multi-role-options">
            {employeeTeams.map(availableTeam => {
              const isChecked = currentTeams.includes(availableTeam);
              const isOnlyTeam = isChecked && currentTeams.length === 1;

              return (
                <label
                  key={availableTeam}
                  className={`multi-role-option ${isChecked ? 'selected' : ''} ${isOnlyTeam ? 'locked' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isOnlyTeam) {
                      toggleTeam(availableTeam);
                    }
                  }}
                  title={isOnlyTeam ? 'At least one domain must remain selected' : ''}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isOnlyTeam}
                    readOnly
                  />
                  <span className="multi-role-name">{availableTeam}</span>
                  {isChecked && (
                    <span className={`domain-chip domain-chip-${availableTeam.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                      Active
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiRolePicker({ employee, disabled, isLastActiveAdmin, onUpdateRoles }) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef(null);
  const currentRoles = getEmployeeRoles(employee);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const toggleRole = (targetRole) => {
    if (disabled) return;
    const isSelected = currentRoles.includes(targetRole);

    if (isSelected) {
      if (currentRoles.length === 1) return;
      if (targetRole === 'Admin' && isLastActiveAdmin) return;
      const next = currentRoles.filter(r => r !== targetRole);
      onUpdateRoles(next);
    } else {
      const next = allAvailableRoles.filter(r => currentRoles.includes(r) || r === targetRole);
      onUpdateRoles(next);
    }
  };

  return (
    <div className="multi-role-picker" ref={containerRef}>
      <button
        type="button"
        className={`multi-role-trigger ${open ? 'active' : ''}`}
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        title={disabled ? 'Role is locked' : 'Click to select or modify roles'}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="multi-role-chips">
          {currentRoles.map(role => {
            const roleClass = `role-chip-${role.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <span key={role} className={`role-chip ${roleClass}`}>
                {role}
              </span>
            );
          })}
        </div>
        <Icon name="chevron" size={13} className={`role-picker-arrow ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="multi-role-dropdown" role="listbox">
          <div className="multi-role-dropdown-header">
            <span>Assign Roles</span>
            <small>Select all roles that apply ({currentRoles.length} active)</small>
          </div>
          <div className="multi-role-options">
            {allAvailableRoles.map(availableRole => {
              const isChecked = currentRoles.includes(availableRole);
              const isOnlyRole = isChecked && currentRoles.length === 1;
              const isLockedAdmin = isChecked && availableRole === 'Admin' && isLastActiveAdmin;
              const isLocked = isOnlyRole || isLockedAdmin;

              return (
                <label
                  key={availableRole}
                  className={`multi-role-option ${isChecked ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLocked) {
                      toggleRole(availableRole);
                    }
                  }}
                  title={
                    isLockedAdmin
                      ? 'Last active Admin role cannot be removed'
                      : isOnlyRole
                      ? 'At least one role must remain selected'
                      : ''
                  }
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isLocked}
                    readOnly
                  />
                  <span className="multi-role-name">{availableRole}</span>
                  {isChecked && (
                    <span className={`role-chip role-chip-${availableRole.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                      Active
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PageAccessModal({ employee, onSave, onClose }) {
  if (!employee) return null;

  const empRoles = getEmployeeRoles(employee);
  const isStrictlyFounder = empRoles.length === 1 && empRoles[0] === 'Founder';
  const roleDefaults = getDefaultPageAccess(empRoles);
  const initialPages = getEmployeeAllowedPages(employee);
  const [selectedPages, setSelectedPages] = useState(initialPages);

  const availableSections = isStrictlyFounder
    ? portalPageSections.filter(s => s.id !== 'my' && s.id !== 'all')
    : portalPageSections;

  const togglePage = (id) => {
    setSelectedPages(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleResetDefaults = () => {
    setSelectedPages([...roleDefaults]);
  };

  const handleSelectAll = () => {
    setSelectedPages(availableSections.map(s => s.id));
  };

  const handleSave = () => {
    onSave(employee.id, selectedPages);
    onClose();
  };

  const isCustom = JSON.stringify([...selectedPages].sort()) !== JSON.stringify([...roleDefaults].sort());

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card page-access-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ color: 'var(--brand-orange, #ea580c)' }}>PAGE ACCESS &amp; PERMISSIONS</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px' }}>Manage Page Access · {employee.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
              Assigned Roles: <strong>{empRoles.join(', ')}</strong> ({getEmployeeTeams(employee).join(', ')}) · Configure which sections appear in their navigation sidebar.
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="page-access-quick-bar">
          <div className="page-access-status-indicator">
            <span>Status: </span>
            {isCustom ? (
              <span className="page-access-badge is-custom">Custom Override ({selectedPages.length} pages)</span>
            ) : (
              <span className="page-access-badge is-default">Role Default ({roleDefaults.length} pages)</span>
            )}
          </div>
          <div className="page-access-quick-actions">
            <button type="button" className="button button-secondary button-small" onClick={handleResetDefaults} title="Reset to standard pages for this role">
              <Icon name="clock" size={13} /> Reset to Defaults
            </button>
            <button type="button" className="button button-secondary button-small" onClick={handleSelectAll} title="Give access to all page sections">
              <Icon name="check" size={13} /> Grant All Pages
            </button>
          </div>
        </div>

        <div className="page-access-grid">
          {availableSections.map(section => {
            const isChecked = selectedPages.includes(section.id);
            const isDefault = roleDefaults.includes(section.id);
            return (
              <div
                key={section.id}
                className={`page-access-card ${isChecked ? 'selected' : ''}`}
                onClick={() => togglePage(section.id)}
              >
                <div className="page-access-card-check">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by card onClick
                    aria-label={`Toggle access for ${section.name}`}
                  />
                </div>
                <div className="page-access-card-icon">
                  <Icon name={section.icon} size={18} />
                </div>
                <div className="page-access-card-info">
                  <div className="page-access-card-title-row">
                    <strong>{section.name}</strong>
                    {isDefault && <span className="default-pill">Role Default</span>}
                  </div>
                  <small>{section.description}</small>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            <strong>{selectedPages.length}</strong> of {availableSections.length} sections allowed
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="button button-primary" onClick={handleSave}>
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminAccessPage({ employees, currentEmployee, onUpdateEmployeeAccount, accessRequests = [], onReviewAccessRequest, onDownloadAllData, onDownloadUserData, onDeleteEmployeeAccount }) {
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [pageAccessModalUser, setPageAccessModalUser] = useState(null);
  const activeAdminCount = employees.filter(employee => hasRole(employee, 'Admin') && employee.enabled).length;
  const pendingRequests = accessRequests.filter(request => request.status === 'pending');

  return (
    <>
      <PageHeading
        title="Access & Roles"
        subtitle="Only Admins can grant login access, approve pending requests, and assign employee roles."
      />

      {/* ── PENDING LOGIN REQUESTS ── */}
      <section className="panel account-management admin-access-page" style={{ marginBottom: 24 }}>
        <div className="account-management-heading">
          <div>
            <strong>Pending login requests</strong>
            <small>Review, approve, or decline access requests submitted from the login screen.</small>
          </div>
          <span className="badge badge-pending-count">{pendingRequests.length} pending</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="access-requests-empty" style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <Icon name="check" size={22} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--green)' }} />
            <strong style={{ display: 'block', color: 'var(--text)', fontSize: 14 }}>No pending login requests</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>All portal access requests have been processed.</p>
          </div>
        ) : (
          <div className="access-request-list">
            {pendingRequests.map(request => {
              const matchedEmp = employees.find(e => e.id === request.employeeId || e.email.toLowerCase() === request.email?.toLowerCase());
              const name = request.name || matchedEmp?.name || request.email;
              const email = request.email || matchedEmp?.email;
              return (
                <div className="access-request-row" key={request.id}>
                  <div className="account-person">
                    <span className="avatar avatar-small">{initials(name)}</span>
                    <div>
                      <strong>{name}</strong>
                      <small>{email}{request.team ? ` · ${request.team}` : ''}{request.note ? ` · "${request.note}"` : ''}</small>
                      <span className="request-time-chip">Requested: {request.requestedAt}</span>
                    </div>
                  </div>
                  <div className="access-request-actions">
                    <button
                      type="button"
                      className="button button-success-solid"
                      onClick={() => onReviewAccessRequest(request.id, true)}
                    >
                      <Icon name="check" size={14} /> Approve Access
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-danger-text"
                      onClick={() => onReviewAccessRequest(request.id, false)}
                    >
                      <Icon name="close" size={14} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── STAFF PORTAL ACCESS & ROLES ── */}
      <section className="panel account-management admin-access-page">
        <div className="account-management-heading">
          <div>
            <strong>Staff portal access &amp; role assignment</strong>
            <small>Control sign-in permissions, assign roles, and customize visible page sections for staff.</small>
          </div>
          <span>{employees.filter(employee => employee.enabled).length} active of {employees.length} total</span>
        </div>
        <div className="account-table-header" aria-hidden="true">
          <span>Employee</span>
          <span>Domains / teams</span>
          <span>Roles</span>
          <span>Page sections</span>
          <span>Portal login access</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        <div className="account-list">
          {employees.map(employee => {
            const isCurrentUser = employee.id === currentEmployee.id;
            const empRoles = getEmployeeRoles(employee);
            const isLastActiveAdmin = hasRole(employee, 'Admin') && employee.enabled && activeAdminCount === 1;
            const protectedAccount = isCurrentUser || isLastActiveAdmin;
            const allowedPages = getEmployeeAllowedPages(employee);
            const roleDefaults = getDefaultPageAccess(empRoles);
            const isCustomAccess = Array.isArray(employee.pageAccess) &&
              JSON.stringify([...employee.pageAccess].sort()) !== JSON.stringify([...roleDefaults].sort());
            const isStrictAdmin = empRoles.length === 1 && empRoles[0] === 'Admin';

            return (
              <div className="account-row" key={employee.id}>
                <div className="account-person">
                  <span className="avatar avatar-small">{initials(employee.name)}</span>
                  <div><strong>{employee.name}</strong><small>{employee.email}</small></div>
                </div>
                <div className="account-setting account-setting-domains">
                  <MultiDomainPicker
                    employee={employee}
                    disabled={isCurrentUser}
                    onUpdateTeams={(nextTeams) => {
                      onUpdateEmployeeAccount(employee.id, {
                        teams: nextTeams,
                        team: nextTeams[0] || 'Web Dev',
                      });
                    }}
                  />
                </div>
                <div className="account-setting account-setting-roles">
                  <MultiRolePicker
                    employee={employee}
                    disabled={isCurrentUser}
                    isLastActiveAdmin={isLastActiveAdmin}
                    onUpdateRoles={(nextRoles) => {
                      const hasCustomOverride = Array.isArray(employee.pageAccess) && employee.pageAccess.length > 0;
                      onUpdateEmployeeAccount(employee.id, {
                        roles: nextRoles,
                        role: nextRoles[0] || 'Employee',
                        ...(!hasCustomOverride ? { pageAccess: getDefaultPageAccess(nextRoles) } : {}),
                      });
                    }}
                  />
                </div>
                <div className="account-page-access">
                  {isStrictAdmin ? (
                    <span className="page-access-badge is-default" style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px' }}>
                      Admin controls (3)
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="page-access-pill-btn"
                      onClick={() => setPageAccessModalUser(employee)}
                      title={`Configure visible page sections for ${employee.name} (${allowedPages.length} active)`}
                    >
                      <Icon name="layers" size={13} />
                      <span className="page-access-count">{allowedPages.length} pages</span>
                      <span className={`page-access-badge ${isCustomAccess ? 'is-custom' : 'is-default'}`}>
                        {isCustomAccess ? 'Custom' : 'Default'}
                      </span>
                      <Icon name="settings" size={12} className="page-access-cog" />
                    </button>
                  )}
                </div>
                <label className={`account-access${employee.enabled ? ' enabled' : ''}`}>
                  <input type="checkbox" checked={employee.enabled} aria-label={`${employee.name} portal login access`}
                    disabled={protectedAccount}
                    onChange={event => onUpdateEmployeeAccount(employee.id, { enabled: event.target.checked })} />
                  <span>{employee.enabled ? 'Can sign in' : 'No access'}</span>
                </label>
                <div className="account-actions-group">
                  {onDeleteEmployeeAccount && (
                    <button
                      type="button"
                      className="button button-secondary button-user-delete"
                      disabled={protectedAccount}
                      onClick={() => setEmployeeToDelete(employee)}
                      aria-label={protectedAccount ? `Cannot delete protected account ${employee.name}` : `Delete ${employee.name}'s account`}
                      title={protectedAccount ? 'This protected account cannot be deleted' : `Delete ${employee.name}'s account`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!employees.length && <p className="access-requests-empty">No employee records found.</p>}
        </div>
        <p className="account-management-note">
          Login access, role assignment, and page section permissions are restricted to Administrators. Your own Admin access and the last active Admin account are protected against accidental lockout.
        </p>
      </section>

      {pageAccessModalUser && (
        <PageAccessModal
          employee={pageAccessModalUser}
          onSave={(empId, newPages) => onUpdateEmployeeAccount(empId, { pageAccess: newPages })}
          onClose={() => setPageAccessModalUser(null)}
        />
      )}

      {employeeToDelete && (
        <DeleteEmployeeModal
          employee={employeeToDelete}
          onConfirm={onDeleteEmployeeAccount}
          onClose={() => setEmployeeToDelete(null)}
        />
      )}
    </>
  );
}

function SignInUsersPage({ employees, tasks, currentEmployee, onDownloadUserData, onDownloadSignInUsersList, onDownloadSignInUsersPdf, onDownloadUserPdf, onOpenExportModal, onDownloadAllData, onDeleteEmployeeAccount }) {
  const [userQuery, setUserQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const activeAdminCount = employees.filter(e => hasRole(e, 'Admin') && e.enabled).length;
  const signInUsers = employees.filter(e => e.enabled);
  const leadershipCount = signInUsers.filter(e => hasTeam(e, 'Leadership')).length;
  const webDevCount = signInUsers.filter(e => hasTeam(e, 'Web Dev')).length;
  const uiuxCount = signInUsers.filter(e => hasTeam(e, 'UI/UX Designer')).length;
  const qaCount = signInUsers.filter(e => hasTeam(e, 'QA')).length;

  const filteredUsers = signInUsers.filter(user => {
    const userRoles = getEmployeeRoles(user);
    const userTeams = getEmployeeTeams(user);
    const matchesSearch = !userQuery ||
      user.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      userRoles.some(r => r.toLowerCase().includes(userQuery.toLowerCase())) ||
      userTeams.some(t => t.toLowerCase().includes(userQuery.toLowerCase()));
    const matchesDomain = domainFilter === 'All' || userTeams.includes(domainFilter);
    return matchesSearch && matchesDomain;
  });

  return (
    <>
      <PageHeading
        title="Sign-in User Accounts"
        subtitle="Directory of authorized staff accounts that currently have portal login permissions."
        action={
          onOpenExportModal && (
            <button className="button button-primary" onClick={() => onOpenExportModal({ type: 'tasks' })} title="Export employee task data as PDF (Date-Wise)">
              <Icon name="report" size={15} /> Export Employee Tasks (PDF)
            </button>
          )
        }
      />

      {/* Summary metric cards */}
      <div className="signin-users-metrics">
        <div className="signin-metric-card">
          <span className="signin-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Icon name="check" size={18} />
          </span>
          <div>
            <span className="signin-metric-label">Active Sign-in Users</span>
            <strong className="signin-metric-value">{signInUsers.length}</strong>
          </div>
        </div>
        <div className="signin-metric-card">
          <span className="signin-metric-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Icon name="users" size={18} />
          </span>
          <div>
            <span className="signin-metric-label">Leadership</span>
            <strong className="signin-metric-value">{leadershipCount}</strong>
          </div>
        </div>
        <div className="signin-metric-card">
          <span className="signin-metric-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Icon name="grid" size={18} />
          </span>
          <div>
            <span className="signin-metric-label">Web Dev</span>
            <strong className="signin-metric-value">{webDevCount}</strong>
          </div>
        </div>
        <div className="signin-metric-card">
          <span className="signin-metric-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Icon name="palette" size={18} />
          </span>
          <div>
            <span className="signin-metric-label">UI/UX</span>
            <strong className="signin-metric-value">{uiuxCount}</strong>
          </div>
        </div>
        <div className="signin-metric-card">
          <span className="signin-metric-icon" style={{ background: '#ecfeff', color: '#0891b2' }}>
            <Icon name="shield" size={18} />
          </span>
          <div>
            <span className="signin-metric-label">QA</span>
            <strong className="signin-metric-value">{qaCount}</strong>
          </div>
        </div>
      </div>

      {/* Toolbar with Search and Domain filter */}
      <section className="panel signin-users-panel">
        <div className="signin-users-toolbar">
          <div className="signin-search-box">
            <Icon name="search" size={15} />
            <input
              type="text"
              placeholder="Search sign-in users by name, email or role…"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              aria-label="Search sign-in users"
            />
            {userQuery && (
              <button className="clear-search" onClick={() => setUserQuery('')}>
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
          <div className="signin-filter-select">
            <label htmlFor="signin-domain-filter" className="sr-only">Filter by Domain</label>
            <select
              id="signin-domain-filter"
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              aria-label="Filter by Domain"
            >
              <option value="All">All Domains</option>
              {employeeTeams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <span className="signin-count-pill">
            Showing {filteredUsers.length} of {signInUsers.length} sign-in accounts
          </span>
        </div>

        {/* Directory Table */}
        <div className="signin-users-table-header" aria-hidden="true">
          <span>User Account</span>
          <span>Domains / Teams</span>
          <span>Roles</span>
          <span>Assigned Tasks</span>
          <span>Portal Access</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        <div className="signin-users-list">
          {filteredUsers.map(user => {
            const userTasks = tasks.filter(t => t.assignee === user.id);
            const isProtected = user.id === currentEmployee?.id || (hasRole(user, 'Admin') && activeAdminCount <= 1);
            return (
              <div className="signin-user-row" key={user.id}>
                <div className="account-person">
                  <span className="avatar avatar-small">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}
                  </span>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <div className="signin-user-team">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {getEmployeeTeams(user).map(t => (
                      <span key={t} className={`domain-chip domain-chip-${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="signin-user-role">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {getEmployeeRoles(user).map(r => (
                      <span key={r} className={`role-chip role-chip-${r.toLowerCase().replace(/\s+/g, '-')}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="signin-user-tasks">
                  <span className="tasks-count-chip">{userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'}</span>
                </div>
                <div className="signin-user-status">
                  <span className="badge badge-success-chip">
                    <Icon name="check" size={12} /> Active
                  </span>
                </div>
                <div className="signin-user-action">
                  {onDownloadUserPdf && (
                    <button
                      type="button"
                      className="button button-secondary button-user-pdf"
                      onClick={() => onDownloadUserPdf(user)}
                      aria-label={`Download task report for ${user.name}`}
                      title={`Download task report for ${user.name}`}
                    >
                      <Icon name="report" size={15} style={{ color: '#ef4444' }} />
                      <span className="pdf-tag-label">Tasks PDF</span>
                    </button>
                  )}
                  {onDeleteEmployeeAccount && (
                    <button
                      type="button"
                      className="button button-secondary button-user-delete"
                      disabled={isProtected}
                      onClick={() => setEmployeeToDelete(user)}
                      aria-label={isProtected ? `Cannot delete protected account ${user.name}` : `Delete ${user.name}'s account`}
                      title={isProtected ? 'Protected account cannot be deleted' : `Delete ${user.name}'s account`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <div className="empty-icon"><Icon name="search" size={20} /></div>
              <strong>No matching sign-in users found</strong>
              <p>Try clearing your search query or domain filter.</p>
            </div>
          )}
        </div>
      </section>

      {employeeToDelete && (
        <DeleteEmployeeModal
          employee={employeeToDelete}
          onConfirm={onDeleteEmployeeAccount}
          onClose={() => setEmployeeToDelete(null)}
        />
      )}
    </>
  );
}

function PageHeading({ title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ tasks, sites, employees, openTask, setPage, currentEmployee, onDeleteTask }) {
  const userRoles = getEmployeeRoles(currentEmployee);

  const filteredTasks = useMemo(() => {
    const hasOrgAccess = userRoles.some(r => ['Founder', 'Admin', 'Manager'].includes(r));
    if (hasOrgAccess) return tasks;

    const userTeams = getEmployeeTeams(currentEmployee);
    const isTL = userRoles.includes('Team Lead') || isTeamLeadEmployee(currentEmployee);
    if (isTL) {
      return tasks.filter(task => {
        const emp = employees.find(p => p.id === task.assignee);
        const assignedEmps = Array.isArray(task.assignees) && task.assignees.length
          ? employees.filter(p => task.assignees.includes(p.id))
          : (emp ? [emp] : []);
        const allTaskTeams = [
          task.team,
          task.domain,
          emp?.team,
          ...assignedEmps.map(p => p.team),
          ...assignedEmps.flatMap(p => getEmployeeTeams(p))
        ].filter(Boolean);
        const taskTeam = task.team || emp?.team || task.domain;
        return userTeams.some(t => allTaskTeams.some(tt => hasTeam([tt], t))) || hasTeam([taskTeam], userTeams);
      });
    }

    return tasks.filter(task => {
      const taskAssigneeList = Array.isArray(task.assignees) && task.assignees.length ? task.assignees : (task.assignee ? [task.assignee] : []);
      return taskAssigneeList.some(id =>
        id === currentEmployee?.id ||
        (currentEmployee?.uid && (id === currentEmployee.uid || task.assigneeUid === currentEmployee.uid)) ||
        (currentEmployee?.name && id === currentEmployee.name)
      ) || (task.assignee === currentEmployee?.id || task.assignee === currentEmployee?.name || (currentEmployee?.uid && task.assigneeUid === currentEmployee.uid));
    });
  }, [tasks, currentEmployee, employees, userRoles]);

  const open        = filteredTasks.filter(t => t.status !== 'Done');
  const crit        = filteredTasks.filter(t => t.priority === 'Critical' || t.priority === 'High').length;
  const inProg      = filteredTasks.filter(t => t.status === 'In Progress').length;
  const blocked     = filteredTasks.filter(t => t.status === 'Blocked' || t.status === 'On Hold').length;
  const overdue     = filteredTasks.filter(t => t.due < 0 && t.status !== 'Done');
  const dueToday    = filteredTasks.filter(t => t.due === 0 && t.status !== 'Done');
  const done        = filteredTasks.filter(t => t.status === 'Done').length;
  const completion  = Math.round((done / (filteredTasks.length || 1)) * 100);

  const statCards = [
    { label: 'Total Tasks',      value: filteredTasks.length, sub: `${open.length} open`,           accent: 'lime' },
    { label: 'In Progress',      value: inProg,        sub: 'actively worked',               accent: 'teal' },
    { label: 'Overdue',          value: overdue.length,sub: 'need immediate action',          accent: 'coral' },
    { label: 'Completed',        value: done,          sub: `${completion}% completion rate`, accent: 'purple' },
    { label: 'Critical & High',  value: crit,          sub: 'high-priority tasks',            accent: 'orange' },
    { label: 'Due Today',        value: dueToday.length,sub:'open tasks due today',           accent: 'blue' },
    { label: 'On Hold / Blocked',value: blocked,       sub: 'need an unblock',               accent: 'yellow' },
    { label: 'Completion Rate',  value: `${completion}%`, sub: 'of all tasks done',          accent: 'green' },
  ];

  const recent = [...filteredTasks].filter(t => t.status !== 'Done').sort((a,b) => a.due - b.due).slice(0, 5);
  const canDeleteTask = t => currentEmployee.role === 'Founder' || currentEmployee.role === 'Admin' || currentEmployee.role === 'Manager'
    || (currentEmployee.role === 'Team Lead' && (!t.assignee || t.team === currentEmployee.team));

  return (
    <>
      <div className="overview-welcome">
        <div>
          <h1 className="welcome-title">Good day, <span>{currentEmployee?.name || 'User'}</span></h1>
          <p className="welcome-sub">Here's what's happening across your projects today.</p>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map(c => (
          <div className={`stat-card accent-${c.accent}`} key={c.label}>
            <div className="stat-card-inner">
              <span className="stat-label">{c.label}</span>
              <strong className="stat-value">{c.value}</strong>
              <small className="stat-sub">{c.sub}</small>
            </div>
            <div className="stat-card-deco" />
          </div>
        ))}
      </div>

      <div className="overview-panels">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Priority Tasks</h2><p>Tasks that need attention first</p></div>
            <button className="text-button" onClick={() => setPage(currentEmployee.role === 'Admin' || currentEmployee.role === 'Founder' ? 'board' : 'all')}>View all <Icon name="arrow" size={14} /></button>
          </div>
          <div className="compact-task-list">
            {recent.length > 0 ? (
              recent.map(t => <TaskRow key={t.id} task={t} employees={employees} sites={sites} openTask={openTask} />)
            ) : (
              <p className="access-requests-empty" style={{ padding: '24px 16px', textAlign: 'center' }}>
                No active tasks match the selected period or team.
              </p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Projects</h2><p>Active delivery at a glance</p></div>
            <button className="text-button" onClick={() => setPage('modules')}>View all <Icon name="arrow" size={14} /></button>
          </div>
          <div className="site-list">
            {sites.slice(0, 4).map(site => {
              const count = filteredTasks.filter(t => t.siteId === site.id && t.status !== 'Done').length;
              const total = filteredTasks.filter(t => t.siteId === site.id).length;
              const pct   = total ? Math.round((total - count) / total * 100) : 0;
              return (
                <div className="site-row" key={site.id}>
                  <span className="site-mark">{site.logoUrl?.startsWith('data:image/') ? <img src={site.logoUrl} alt="" /> : site.name[0]}</span>
                  <div className="site-row-info"><strong>{site.name}</strong><small>{site.domain}</small></div>
                  <div className="site-progress-wrap">
                    <div className="site-mini-bar"><div style={{ width: `${pct}%` }} /></div>
                    <span className="site-task-count">{count} open</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

// ─── TASK LIST ───────────────────────────────────────────────────────────────
function TaskBoard({ title, subtitle, tasks, employees, sites, openTask, role, currentEmployee, onCreateTask, onMoveTask, onDeleteTask, onOpenExportModal, groupBy, statusFilter, priorityFilter, teamFilter, datePeriod, dateFilterDate, weekOffset = 0, setStatusFilter, setPriorityFilter, setTeamFilter, setDatePeriod, setDateFilterDate, setWeekOffset }) {
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const userRoles = getEmployeeRoles(currentEmployee);
  const userTeams = getEmployeeTeams(currentEmployee);
  const taskTeams = role === 'Founder' || role === 'Manager'
    ? employeeTeams
    : userTeams;
  const isStatusBoard = groupBy === 'status';
  const columns = isStatusBoard
    ? ['Backlog', 'Assigned', 'In Progress', 'On Hold', 'Blocked', 'In Review', 'Done']
    : ['Critical', 'High', 'Medium', 'Low'];

  const hasLeadership = ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(role) ||
    ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(currentEmployee?.role) ||
    userRoles.some(r => ['Founder', 'Admin', 'Manager', 'Team Lead'].includes(r)) ||
    isTeamLeadEmployee(currentEmployee);
  const isTL = role === 'Team Lead' || userRoles.includes('Team Lead') || isTeamLeadEmployee(currentEmployee);

  const isTaskAssignee = (t) => {
    if (!t || !currentEmployee) return false;
    if (t.assignee && (String(t.assignee) === String(currentEmployee.id) || t.assignee === currentEmployee.name)) return true;
    if (Array.isArray(t.assignees) && t.assignees.some(a => String(a) === String(currentEmployee.id) || a === currentEmployee.name || (currentEmployee.uid && a === currentEmployee.uid))) return true;
    if (currentEmployee.uid && t.assigneeUid === currentEmployee.uid) return true;
    return false;
  };

  const isTaskInMyTeam = (t) => {
    if (!t?.team) return true;
    return userTeams.some(team => hasTeam([t.team], team));
  };

  const checkCanMove = (t) => {
    if (!t) return false;
    if (hasLeadership || isTL) return true;
    if (isStatusBoard) {
      return isTaskAssignee(t) || (!t.assignee && isTaskInMyTeam(t));
    }
    return false;
  };

  const resetFilters = () => {
    setStatusFilter('All statuses');
    setPriorityFilter('All priorities');
    setTeamFilter('All teams');
    setDatePeriod(title === 'Priority Board' ? 'all' : 'week');
    if (setDateFilterDate) setDateFilterDate('');
    if (setWeekOffset) setWeekOffset(0);
  };
  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);
  const weekDateRangeLabel = `${weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const canDeleteTask = task => role === 'Founder' || role === 'Admin' || role === 'Manager'
    || ((role === 'Team Lead' || isTeamLeadEmployee(currentEmployee)) && (!task.assignee || userTeams.some(t => hasTeam([task.team], t))));

  return (
    <>
      <PageHeading title={title} subtitle={subtitle}
        action={<div className="board-heading-actions">
          <div className={`week-range-picker${datePeriod === 'week' ? ' active' : ''}`} aria-label="Selected week">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => {
                setWeekOffset?.(offset => offset - 1);
                setDatePeriod?.('week');
                setDateFilterDate?.('');
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span
              onClick={() => {
                if (datePeriod !== 'week') {
                  setDatePeriod?.('week');
                  setDateFilterDate?.('');
                }
              }}
              title="Click to filter by this week"
              style={{ cursor: 'pointer' }}
            >
              {weekDateRangeLabel}
            </span>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => {
                setWeekOffset?.(offset => offset + 1);
                setDatePeriod?.('week');
                setDateFilterDate?.('');
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {((title === 'Priority Board' && ['Founder', 'Manager', 'Team Lead'].includes(role)) || (title !== 'Priority Board' && role !== 'Admin')) && (
            <button className={`button ${title === 'Priority Board' ? 'button-primary button-orange-solid' : 'button-primary'}`} onClick={onCreateTask}>
              <Icon name="plus" size={15} />{title === 'Priority Board' ? 'Add priority task' : 'New task'}
            </button>
          )}
          {onOpenExportModal && role === 'Admin' && (
            <button
              className="button button-secondary download-pdf-board-btn"
              onClick={() => onOpenExportModal({
                type: 'tasks',
                dateScope: datePeriod === 'custom' ? 'specific' : datePeriod,
                specificDate: dateFilterDate,
                priority: priorityFilter,
              })}
              title="Download tasks in PDF form (Date-Wise)"
            >
              <Icon name="report" size={14} style={{ color: '#ef4444' }} /> Download PDF (Date-Wise)
            </button>
          )}
          <button className="button button-secondary" onClick={resetFilters}>Reset filters</button>
        </div>} />

      <div className="filter-bar">
        <label
          className={`filter-calendar-picker${dateFilterDate ? ' selected' : ''}`}
          title={dateFilterDate ? `Filtering by ${dateFilterDate}. Click to change` : "Filter tasks by a specific due date"}
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input[type="date"]');
            if (input && typeof input.showPicker === 'function') {
              try { input.showPicker(); } catch {}
            }
          }}
        >
          <CalendarDays size={18} aria-hidden="true" />
          <input
            type="date"
            aria-label="Choose a due date to filter tasks"
            value={dateFilterDate || ''}
            onClick={e => {
              e.stopPropagation();
              try { e.currentTarget.showPicker?.(); } catch {}
            }}
            onChange={event => {
              const val = event.target.value;
              if (setDateFilterDate) setDateFilterDate(val);
              if (setDatePeriod) setDatePeriod(val ? 'custom' : 'all');
            }}
          />
        </label>
        {dateFilterDate && (
          <div className="filter-date-badge">
            <span>Due: {new Date(`${dateFilterDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <button
              type="button"
              className="filter-date-badge-close"
              title="Clear date filter"
              aria-label="Clear date filter"
              onClick={() => {
                if (setDateFilterDate) setDateFilterDate('');
                if (setDatePeriod) setDatePeriod('all');
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        {title !== 'My Tasks' && (
          <label className="filter-label"><span>Team</span>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
              <option>All teams</option>{taskTeams.map(team => <option key={team}>{team}</option>)}
            </select>
          </label>
        )}
        {isStatusBoard ? (
          <label className="filter-label"><span>Priority</span>
            <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}>
              <option>All priorities</option>{['Critical','High','Medium','Low'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
        ) : (
          <label className="filter-label"><span>Status</span>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option>All statuses</option>{['Backlog','Assigned','In Progress','On Hold','Blocked','In Review','Done'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
        )}
        <span className="result-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={`board-grid${isStatusBoard ? ' status-board' : ''}`}>
        {columns.map(column => {
          const items = tasks.filter(task => task[isStatusBoard ? 'status' : 'priority'] === column);
          return (
            <section
              className={`board-column${dragOverColumn === column ? ' drag-over' : ''}`}
              key={column}
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== column) {
                  setDragOverColumn(column);
                }
              }}
              onDragEnter={event => {
                event.preventDefault();
                setDragOverColumn(column);
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={event => {
                event.preventDefault();
                setDragOverColumn(null);
                const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
                const task = tasks.find(item => String(item.id) === String(taskId));
                if (!task || !checkCanMove(task)) return;
                onMoveTask(task.id, { [isStatusBoard ? 'status' : 'priority']: column });
                setDraggedTaskId(null);
              }}
            >
              <div className={`board-column-heading${isStatusBoard ? ' status-column-heading' : ''}`}>
                {isStatusBoard
                  ? <StatusBadge value={column} />
                  : <><span className="priority-dot" data-priority={column.toLowerCase()} /><h2>{column}</h2></>}
                <span className="count-pill">{items.length}</span>
              </div>
              <div className="board-column-content">
                {items.map(task => {
                  const assignee = employees.find(employee => employee.id === task.assignee)
                    || (Array.isArray(task.assignees) && employees.find(employee => task.assignees.includes(employee.id)));
                  const site = sites.find(item => item.id === task.siteId);
                  const canDrag = checkCanMove(task);
                  const taskFeature = task.feature || task.moduleName || moduleNames[task.module] || 'Task';
                  const taskStack = task.techStack || site?.techStack?.join(', ') || 'Tech stack not set';
                  return (
                    <div
                      className={`board-card${canDrag ? ' draggable' : ''}${draggedTaskId === task.id ? ' is-dragging' : ''}`}
                      key={task.id}
                      draggable={canDrag}
                      role="button"
                      tabIndex={0}
                      onDragStart={event => {
                        if (!canDrag) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.setData('text/plain', String(task.id));
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      onClick={() => openTask(task)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openTask(task);
                        }
                      }}
                    >
                      <div className="board-card-header">
                        <strong className="board-card-title">{task.title}</strong>
                        {canDeleteTask(task) && onDeleteTask && (
                          <span
                            className="card-quick-delete"
                            role="button"
                            tabIndex={0}
                            title={`Delete task NL-${task.id}`}
                            draggable={false}
                            onDragStart={e => e.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (window.confirm(`Delete priority task NL-${task.id}: "${task.title}"?`)) {
                                onDeleteTask(task.id);
                              }
                            }}
                          >
                            <Icon name="trash" size={13} />
                          </span>
                        )}
                      </div>
                      {(() => {
                        const isNewSiteTask = task.isNewWebsite === true || task.workType === 'New Website' || task.websiteMode === 'new_website' || [101, 108, 121, 129, 130].includes(Number(task.id));
                        const resolvedSiteName = getTaskWebsiteName(task, site);
                        return (
                          <div className="board-card-subline">
                            <small className="board-card-site-info">
                              NL-{task.id} · {resolvedSiteName}
                            </small>
                            <div className="board-card-tags-wrap">
                              {isNewSiteTask ? (
                                <span className="work-type-tag new-website" title="New Website Project">
                                  New Website
                                </span>
                              ) : task.team === 'UI/UX Designer' ? (
                                <span className="domain-badge domain-uiux">
                                  {task.designType || 'UI/UX Design'}
                                </span>
                              ) : task.team === 'QA' ? (
                                <span className="domain-badge domain-qa">
                                  {task.qaRound ? `${task.qaRound} · ` : ''}{task.qaType || 'QA Testing'}
                                </span>
                              ) : task.workType && task.workType !== 'New Website' && task.workType !== 'Task' ? (
                                <span className={`work-type-tag ${task.workType.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {task.workType === 'Extra Work' ? 'Extra Work' : task.workType === 'New Features Update' ? 'New Feature' : task.workType}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}
                      {task.posterSize && (
                        <div style={{ marginTop: 4 }}>
                          <span className="poster-pill">Poster: {task.posterSize}</span>
                        </div>
                      )}
                      {task.features && task.features.length > 0 && task.team !== 'UI/UX Designer' ? (
                        <div className="board-card-feature-chips">
                          {task.features.map(f => (
                            <span key={f} className="board-feature-chip">{f}</span>
                          ))}
                        </div>
                      ) : (
                        <small>{taskFeature}</small>
                      )}
                      <small className="board-card-stack">
                        {task.team === 'UI/UX Designer'
                          ? `Tool: ${task.designTool || 'Figma'}${task.figmaUrl ? ' · Link' : ''}`
                          : task.team === 'QA'
                          ? `Env: ${task.qaEnvironment || 'Live'}`
                          : taskStack}
                      </small>
                      <div className="board-card-meta">
                        <div className="board-card-meta-left">
                          {isStatusBoard ? <PriorityBadge value={task.priority} /> : <StatusBadge value={task.status} />}
                          {task.cadence && <span className={`cadence-tag cadence-${task.cadence.toLowerCase()}`}>{task.cadence}</span>}
                        </div>
                        <span className="board-card-assignee">
                          {assignee && <span className="avatar avatar-small">{assignee.avatarUrl?.startsWith('data:image/') ? <img src={assignee.avatarUrl} alt="" /> : initials(assignee.name)}</span>}
                          <span>{assignee?.name || (task.assignees?.length ? `${task.assignees.length} assignees` : 'Unassigned')}</span>
                        </span>
                      </div>
                      <span className={`board-card-due${task.due < 0 && task.status !== 'Done' ? ' overdue' : ''}`}><Icon name="clock" size={12} />Due {formatTaskDate(task)}</span>
                    </div>
                  );
                })}
                {!items.length && <div className="empty-column">Nothing here right now</div>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function TaskTableRow({ task, employees, sites, openTask }) {
  const emp  = employees.find(p => p.id === task.assignee);
  const site = sites.find(s => s.id === task.siteId);
  const websiteName = getTaskWebsiteName(task, site);
  return (
    <tr className="clickable-row" onClick={() => openTask(task)} tabIndex="0" onKeyDown={e => e.key==='Enter' && openTask(task)}>
      <td><span className="task-title">{task.title}</span><small className="task-id">NL-{task.id}</small></td>
      <td><strong className="cell-primary">{websiteName}</strong><small className="cell-secondary">{moduleNames[task.module]}</small></td>
      <td><span className="assignee-cell"><span className="avatar avatar-small">{initials(emp?.name||'?')}</span>{emp?.name}</span></td>
      <td><PriorityBadge value={task.priority} /></td>
      <td><StatusBadge value={task.status} /></td>
      <td><span className={task.due < 0 ? 'due-late' : ''}>{dayLabel(task.due)}</span></td>
    </tr>
  );
}

function TaskRow({ task, employees, sites, openTask }) {
  const emp  = employees.find(p => p.id === task.assignee);
  const site = sites.find(s => s.id === task.siteId);
  const websiteName = getTaskWebsiteName(task, site);
  return (
    <div className="compact-task-wrapper">
      <button className="compact-task" onClick={() => openTask(task)}>
        <span className="priority-dot" data-priority={task.priority.toLowerCase()} />
        <span className="compact-task-main">
          <strong>{task.title}</strong>
          <small>{websiteName} · {emp?.name || 'Unassigned'}</small>
        </span>
        {task.cadence && <span className={`cadence-tag cadence-${task.cadence.toLowerCase()}`}>{task.cadence}</span>}
        <span className={task.due < 0 ? 'compact-due overdue' : 'compact-due'}>{dayLabel(task.due)}</span>
      </button>
    </div>
  );
}

// ─── PRIORITY BOARD ──────────────────────────────────────────────────────────
// ─── PROJECTS & WEBSITES ────────────────────────────────────────────────────
function ProjectsWebsitesPage({ sites: allSites, tasks, onEditSite, onDeleteSite }) {
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const liveSites = allSites.filter(site => site.environment === 'Live');
  const demoSites = allSites.filter(site => site.environment === 'Demo');
  const figmaSites = allSites.filter(site => site.environment === 'Figma');

  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(site =>
      site.name?.toLowerCase().includes(q) ||
      site.url?.toLowerCase().includes(q) ||
      site.domain?.toLowerCase().includes(q) ||
      site.techStack?.some(t => t.toLowerCase().includes(q)) ||
      site.features?.some(f => f.toLowerCase().includes(q))
    );
  };

  const groups = [
    ['Live Websites', 'Live', filterList(liveSites)],
    ['Demo Websites', 'Demo', filterList(demoSites)],
    ['Figma Designs', 'Figma', filterList(figmaSites)],
  ].filter(([_, env]) => activeCategory === 'all' || activeCategory === env);

  const defaultEnvForAdd = activeCategory === 'Demo' ? 'Demo' : activeCategory === 'Figma' ? 'Figma' : 'Live';

  return (
    <>
      <PageHeading
        title="Client Track"
        subtitle="Manage projects, website links, design files, and feature status in one place."
        action={
          <button
            className="button button-primary add-project-button"
            type="button"
            onClick={() => onEditSite({ name: '', url: '', environment: defaultEnvForAdd, features: [], techStack: [], modules: [] })}
          >
            <Icon name="plus" size={15} />
            Add project
          </button>
        }
      />

      {/* Category Tabs & Quick Search */}
      <div className="client-track-category-bar">
        <div className="client-track-tabs">
          <button
            type="button"
            className={`client-track-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span>All Projects</span>
            <span className="client-track-tab-count">{allSites.length}</span>
          </button>
          <button
            type="button"
            className={`client-track-tab tab-live ${activeCategory === 'Live' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Live')}
          >
            <span className="env-dot" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span>Live Websites</span>
            <span className="client-track-tab-count">{liveSites.length}</span>
          </button>
          <button
            type="button"
            className={`client-track-tab tab-demo ${activeCategory === 'Demo' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Demo')}
          >
            <span className="env-dot" style={{ background: '#3B82F6' }} />
            <span>Demo Websites</span>
            <span className="client-track-tab-count">{demoSites.length}</span>
          </button>
          <button
            type="button"
            className={`client-track-tab tab-figma ${activeCategory === 'Figma' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Figma')}
          >
            <span className="env-dot" style={{ background: '#8B5CF6' }} />
            <span>Figma Designs</span>
            <span className="client-track-tab-count">{figmaSites.length}</span>
          </button>
        </div>

        <div className="client-track-search-box">
          <Icon name="search" size={14} className="client-track-search-icon" />
          <input
            type="text"
            placeholder="Search projects, tech stack..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="client-track-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="client-track-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>
      {groups.map(([heading, environment, group]) => (
        <section className="website-group" key={environment}>
          <div className="website-group-heading"><h2>{heading}</h2><span>{group.length} {environment === 'Figma' ? 'designs' : 'websites'}</span></div>
          <div className="website-grid">
            {group.map(site => {
              const projectUrl = site.environment === 'Figma' ? site.figmaUrl || site.url : site.url;
              return (
                <section className="panel client-track-card" key={site.id}>
                  {/* Top: Avatar, Name, Environment badge & Edit/Delete buttons */}
                  <div className="client-track-header">
                    <div className="client-track-brand-group">
                      <div className={`site-avatar site-avatar-${(site.environment || 'live').toLowerCase()}`}>
                        {site.logoUrl?.startsWith('data:image/') ? (
                          <img src={site.logoUrl} alt={site.name} />
                        ) : (
                          <span>{(site.name || 'W')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="client-track-title-col">
                        <div className="client-track-name-row">
                          <h3 className="client-track-name">{site.name}</h3>
                          <span className={`client-track-env-badge env-${(site.environment || 'live').toLowerCase()}`}>
                            <span className="env-dot" />
                            {site.environment || 'Live'}
                          </span>
                        </div>
                        <a className="client-track-url-link" href={projectUrl} target="_blank" rel="noreferrer" title="Open URL">
                          <span>{site.domain || site.url}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                    <div className="client-track-header-actions">
                      <button className="client-track-edit-btn" type="button" onClick={() => onEditSite(site)} title="Edit project" aria-label="Edit project">
                        <Pencil size={13} />
                      </button>
                      <button className="client-track-delete-btn" type="button" onClick={() => onDeleteSite && onDeleteSite(site)} title="Delete project" aria-label="Delete project">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Body: Tech Stack + Active Features */}
                  <div className="client-track-body">
                    {site.environment !== 'Figma' && (
                      <div className="client-track-meta-section">
                        <span className="client-track-meta-label">TECH STACK</span>
                        <div className="client-track-stack-list">
                          {site.techStack?.length ? (
                            site.techStack.map(technology => (
                              <span className="client-track-stack-pill" key={technology}>
                                {technology}
                              </span>
                            ))
                          ) : (
                            <span className="client-track-empty-note">Not specified</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="client-track-meta-section">
                      <div className="client-track-meta-header">
                        <span className="client-track-meta-label">ACTIVE FEATURES</span>
                        <span className="client-track-meta-count">
                          {(site.features || []).length} / {projectFeatures.length} active
                        </span>
                      </div>
                      <div className="client-track-features-grid">
                        {site.features && site.features.length > 0 ? (
                          site.features.map(feature => (
                            <span key={feature} className="client-track-feature-tag">
                              <span className="feature-check-icon">✓</span>
                              <span>{feature}</span>
                            </span>
                          ))
                        ) : (
                          <span className="client-track-empty-note">No active features assigned yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer: Status / Meta + Launch CTA */}
                  <div className="client-track-footer">
                    <div className="client-track-footer-status">
                      {site.environment === 'Figma' ? (
                        <span className="footer-status-tag figma-tag">Figma Design File</span>
                      ) : (
                        <span className="footer-status-tag web-tag">Production Website</span>
                      )}
                    </div>
                    <a className="client-track-cta-btn" href={projectUrl} target="_blank" rel="noreferrer">
                      <span>{site.environment === 'Figma' ? 'Open in Figma' : 'Open Website'}</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </section>
              );
            })}
            {!group.length && <p className="access-requests-empty">No projects here yet.</p>}
          </div>
        </section>
      ))}
    </>
  );
}

// ─── BEAST SIGN OUT CONFIRMATION MODAL ──────────────────────────────────────
function SignOutModal({ isOpen, onClose, onConfirm, currentEmployee }) {
  if (!isOpen) return null;

  return (
    <div
      className="overlay beast-signout-overlay"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
    >
      <div className="beast-signout-card">
        {/* Ambient background glow */}
        <div className="beast-signout-glow" aria-hidden="true" />

        {/* Floating animated icon badge */}
        <div className="beast-signout-icon-wrap">
          <div className="beast-signout-icon-inner">
            <Icon name="logout" size={28} />
          </div>
        </div>

        {/* Modal Content */}
        <div className="beast-signout-content">
          <span className="beast-signout-eyebrow">SESSION CONFIRMATION</span>
          <h2 id="signout-modal-title" className="beast-signout-title">
            Sign Out of Nerdy Labs?
          </h2>
          <p className="beast-signout-desc">
            Are you sure you want to end your current session? You will be safely signed out and returned to the sign-in screen.
          </p>

          {/* User profile preview */}
          {currentEmployee && (
            <div className="beast-signout-user-strip">
              <div className="beast-user-avatar">
                {currentEmployee.avatarUrl?.startsWith('data:image/') ? (
                  <img src={currentEmployee.avatarUrl} alt="" />
                ) : (
                  <span>{initials(currentEmployee.name || 'User')}</span>
                )}
              </div>
              <div className="beast-user-info">
                <strong>{currentEmployee.name}</strong>
                <span>{currentEmployee.title || currentEmployee.role} · {currentEmployee.team}</span>
              </div>
              <div className="beast-user-status">
                <span className="beast-status-dot" />
                <span>Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="beast-signout-actions">
          <button
            type="button"
            className="beast-btn beast-btn-cancel"
            onClick={onClose}
          >
            Stay Signed In
          </button>
          <button
            type="button"
            className="beast-btn beast-btn-confirm"
            onClick={onConfirm}
          >
            <span>Sign Out</span>
            <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BEAST DELETE PROJECT CONFIRMATION MODAL ────────────────────────────────
function DeleteProjectModal({ site, onClose, onConfirm }) {
  if (!site) return null;

  return (
    <div
      className="overlay beast-signout-overlay"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-modal-title"
    >
      <div className="beast-signout-card beast-delete-card">
        {/* Ambient background glow in red */}
        <div className="beast-signout-glow beast-delete-glow" aria-hidden="true" />

        {/* Floating animated icon badge in danger red */}
        <div className="beast-signout-icon-wrap beast-delete-icon-wrap">
          <div className="beast-signout-icon-inner beast-delete-icon-inner">
            <Trash2 size={26} />
          </div>
        </div>

        {/* Modal Content */}
        <div className="beast-signout-content">
          <span className="beast-signout-eyebrow" style={{ color: '#EF4444' }}>DANGER ZONE</span>
          <h2 id="delete-project-modal-title" className="beast-signout-title">
            Delete "{site.name}"?
          </h2>
          <p className="beast-signout-desc">
            Are you sure you want to delete this project? This will permanently remove the project entry, feature tracking, and website configuration.
          </p>

          {/* Project preview card */}
          <div className="beast-signout-user-strip beast-delete-site-strip">
            <div className={`site-avatar site-avatar-${(site.environment || 'live').toLowerCase()}`}>
              {site.logoUrl?.startsWith('data:image/') ? (
                <img src={site.logoUrl} alt={site.name} />
              ) : (
                <span>{(site.name || 'W')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="beast-user-info">
              <strong>{site.name}</strong>
              <span>{site.domain || site.url || 'No domain'} · {site.environment || 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="beast-signout-actions">
          <button
            type="button"
            className="beast-btn beast-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="beast-btn beast-delete-confirm-btn"
            onClick={onConfirm}
          >
            <Trash2 size={14} />
            <span>Delete Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
function EditProjectSiteModal({ site, onClose, onSave, onDelete, currentEmployee }) {
  const [selectedFeatures, setSelectedFeatures] = React.useState(site.features);
  const [selectedTechStack, setSelectedTechStack] = React.useState(site.techStack || []);
  const [environment, setEnvironment] = React.useState(site.environment);
  const [logoImage, setLogoImage] = React.useState(site.logoUrl?.startsWith('data:image/') ? site.logoUrl : '');

  const toggleFeature = (feature) => {
    setSelectedFeatures(current => current.includes(feature)
      ? current.filter(item => item !== feature)
      : [...current, feature],
    );
  };
  const toggleTechStack = (technology) => {
    setSelectedTechStack(current => current.includes(technology)
      ? current.filter(item => item !== technology)
      : [...current, technology]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = String(data.get('url') || '');
    onSave(site.id, {
      name: String(data.get('name') || ''),
      url,
      figmaUrl: url,
      environment,
      features: selectedFeatures,
      techStack: environment === 'Figma' ? [] : selectedTechStack,
      logoUrl: logoImage,
    });
  };

  return (
    <div className="overlay modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal-card project-edit-modal" role="dialog" aria-modal="true" aria-labelledby="project-edit-title">
        <div className="modal-header">
          <div><span className="eyebrow">PROJECT DETAILS</span><h2 id="project-edit-title">{site.id ? `Edit ${site.name}` : 'Add project'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close editor"><Icon name="close" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="project-name">Project / website name</label>
          <input className="field-control" id="project-name" name="name" defaultValue={site.name} required />
          <label className="field-label" htmlFor="project-environment">Project type</label>
          <select className="field-control" id="project-environment" name="environment" value={environment} onChange={event => setEnvironment(event.target.value)}>
            <option>Live</option><option>Demo</option><option>Figma</option>
          </select>
          <label className="field-label" htmlFor="project-url">{environment === 'Figma' ? 'Figma link' : 'Website link'}</label>
          <input className="field-control" id="project-url" name="url" type="url" defaultValue={site.url} placeholder={environment === 'Figma' ? 'https://www.figma.com/design/…' : 'https://example.com'} required />
          <ImageUploadField id="project-logo" label="Project logo" value={logoImage} onChange={setLogoImage} />
          {environment !== 'Figma' && currentEmployee?.team !== 'UI/UX Designer' && (
            <fieldset className="project-feature-fieldset">
              <legend>Tech Stack</legend>
              <div className="project-feature-options">
                {projectTechStacks.map(technology => (
                  <label className="project-feature-option" key={technology}>
                    <input type="checkbox" checked={selectedTechStack.includes(technology)} onChange={() => toggleTechStack(technology)} />
                    <span>{technology}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="project-feature-fieldset">
            <legend>Features</legend>
            <div className="project-feature-options">
              {projectFeatures.map(feature => (
                <label className="project-feature-option" key={feature}>
                  <input type="checkbox" checked={selectedFeatures.includes(feature)} onChange={() => toggleFeature(feature)} />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="modal-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: site.id ? 'space-between' : 'flex-end', width: '100%', gap: 10 }}>
            {site.id && (
              <button
                className="button button-danger"
                type="button"
                onClick={() => {
                  onClose();
                  if (onDelete) onDelete(site);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} />
                <span>Delete project</span>
              </button>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
              <button className="button button-primary" type="submit">{site.id ? 'Save project' : 'Add project'}</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function EmployeesPage({ employees: all, tasks }) {
  return (
    <>
      <PageHeading title="Employee Directory" subtitle="People, teams and current task assignments." />
      <div className="panel task-table-panel"><div className="table-scroll">
        <table><thead><tr><th>Employee</th><th>Email</th><th>Roles</th><th>Domains</th><th>Active</th><th>Done</th></tr></thead>
          <tbody>{all.map(emp => {
            const a = tasks.filter(t=>t.assignee===emp.id);
            return <tr key={emp.id}>
              <td><span className="assignee-cell"><span className="avatar avatar-small">{initials(emp.name)}</span><span><strong className="cell-primary">{emp.name}</strong><small className="cell-secondary">{emp.title}</small></span></span></td>
              <td><small style={{color:'var(--muted)'}}>{emp.email}</small></td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {getEmployeeRoles(emp).map(r => (
                    <span key={r} className={`role-chip role-chip-${r.toLowerCase().replace(/\s+/g, '-')}`}>
                      {r}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {getEmployeeTeams(emp).map(t => (
                    <span key={t} className={`domain-chip domain-chip-${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td>{a.filter(t=>t.status!=='Done').length}</td><td>{a.filter(t=>t.status==='Done').length}</td>
            </tr>;
          })}</tbody>
        </table>
      </div></div>
    </>
  );
}

// ─── WORKLOAD ────────────────────────────────────────────────────────────────
function WorkloadPage({ employees: all, tasks, openTask, onCreateTask, sites, setPage }) {
  const [selectedTeam, setSelectedTeam] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('most');
  const [expandedMembers, setExpandedMembers] = React.useState({});
  const [viewingMember, setViewingMember] = React.useState(null);

  const toggleExpandMember = (memberId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // Delivery team members (employees + team leads, exclude purely Admin/Founder accounts)
  const deliveryEmployees = useMemo(() => {
    return all.filter(p => {
      const roles = getEmployeeRoles(p);
      return !roles.includes('Admin') && !roles.includes('Founder');
    });
  }, [all]);

  // Compute stats for each person
  const workloadData = useMemo(() => {
    return deliveryEmployees.map(p => {
      const memberTasks = tasks.filter(t => {
        const assignees = Array.isArray(t.assignees) && t.assignees.length ? t.assignees : (t.assignee ? [t.assignee] : []);
        return assignees.includes(p.id) || assignees.includes(p.name) || (p.uid && assignees.includes(p.uid));
      });
      const activeTasks = memberTasks.filter(t => t.status !== 'Done');
      const doneTasks = memberTasks.filter(t => t.status === 'Done');
      const inProg = activeTasks.filter(t => t.status === 'In Progress');
      const critical = activeTasks.filter(t => t.priority === 'Critical');
      const high = activeTasks.filter(t => t.priority === 'High');
      const blocked = activeTasks.filter(t => t.status === 'Blocked' || t.status === 'On Hold');
      const overdue = activeTasks.filter(t => t.due < 0);

      const count = activeTasks.length;
      let loadLevel = 'available';
      let loadLabel = 'Available';
      let loadClass = 'load-available';

      if (count === 0) {
        loadLevel = 'available';
        loadLabel = 'Available';
        loadClass = 'load-available';
      } else if (count <= 2) {
        loadLevel = 'light';
        loadLabel = 'Light Load';
        loadClass = 'load-light';
      } else if (count <= 4) {
        loadLevel = 'balanced';
        loadLabel = 'Optimal Load';
        loadClass = 'load-balanced';
      } else {
        loadLevel = 'heavy';
        loadLabel = 'Heavy Load';
        loadClass = 'load-heavy';
      }

      return {
        ...p,
        count,
        activeTasks,
        doneTasks,
        inProg,
        critical,
        high,
        blocked,
        overdue,
        loadLevel,
        loadLabel,
        loadClass,
      };
    });
  }, [deliveryEmployees, tasks]);

  const maxTasks = useMemo(() => Math.max(...workloadData.map(p => p.count), 1), [workloadData]);

  // Overall Team KPI metrics
  const totalActiveTasks = useMemo(() => workloadData.reduce((acc, p) => acc + p.count, 0), [workloadData]);
  const availableCount = useMemo(() => workloadData.filter(p => p.count === 0).length, [workloadData]);
  const heavyCount = useMemo(() => workloadData.filter(p => p.loadLevel === 'heavy').length, [workloadData]);
  const avgLoad = useMemo(() => (totalActiveTasks / (workloadData.length || 1)).toFixed(1), [totalActiveTasks, workloadData]);

  // Teams list for filters
  const teamOptions = ['All', 'Web Dev', 'UI/UX Designer', 'QA'];

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return workloadData
      .filter(p => {
        // Team filter
        if (selectedTeam !== 'All') {
          const userTeams = getEmployeeTeams(p);
          if (!hasTeam(userTeams, selectedTeam)) return false;
        }
        // Workload status filter
        if (statusFilter === 'available' && p.count !== 0) return false;
        if (statusFilter === 'active' && (p.count === 0 || p.count >= 5)) return false;
        if (statusFilter === 'heavy' && p.count < 5) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchTeam = (p.team || '').toLowerCase().includes(q);
          if (!matchName && !matchTitle && !matchTeam) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'most') return b.count - a.count;
        if (sortBy === 'least') return a.count - b.count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [workloadData, selectedTeam, statusFilter, searchQuery, sortBy]);

  return (
    <div className="workload-page-container">
      <PageHeading
        title="Team Workload"
        subtitle="Real-time capacity tracking, task distribution, and team availability."
        action={
          onCreateTask && (
            <button className="button button-primary" type="button" onClick={onCreateTask}>
              <Plus size={15} />
              <span>Assign task</span>
            </button>
          )
        }
      />

      {/* ── KPI Summary Header ── */}
      <div className="workload-summary-grid">
        <div className="panel workload-summary-card">
          <div className="workload-summary-icon icon-team">
            <Users size={20} />
          </div>
          <div className="workload-summary-info">
            <span className="summary-label">DELIVERY MEMBERS</span>
            <strong className="summary-val">{workloadData.length}</strong>
            <small className="summary-sub">{availableCount} ready for tasks</small>
          </div>
        </div>

        <div className="panel workload-summary-card">
          <div className="workload-summary-icon icon-tasks">
            <Layers size={20} />
          </div>
          <div className="workload-summary-info">
            <span className="summary-label">ACTIVE ASSIGNMENTS</span>
            <strong className="summary-val">{totalActiveTasks}</strong>
            <small className="summary-sub">Avg ~{avgLoad} tasks / person</small>
          </div>
        </div>

        <div className="panel workload-summary-card">
          <div className="workload-summary-icon icon-available">
            <Check size={20} />
          </div>
          <div className="workload-summary-info">
            <span className="summary-label">AVAILABLE CAPACITY</span>
            <strong className="summary-val" style={{ color: '#10B981' }}>{availableCount}</strong>
            <small className="summary-sub">Zero active backlog</small>
          </div>
        </div>

        <div className="panel workload-summary-card">
          <div className="workload-summary-icon icon-heavy">
            <Clock3 size={20} />
          </div>
          <div className="workload-summary-info">
            <span className="summary-label">HEAVY LOAD</span>
            <strong className="summary-val" style={{ color: heavyCount > 0 ? '#EF4444' : 'var(--text)' }}>{heavyCount}</strong>
            <small className="summary-sub">{heavyCount > 0 ? 'Exceeding 4 active tasks' : 'Healthy distribution'}</small>
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div className="workload-controls-bar">
        {/* Team pills */}
        <div className="workload-team-pills">
          {teamOptions.map(t => (
            <button
              key={t}
              type="button"
              className={`workload-team-pill${selectedTeam === t ? ' active' : ''}`}
              onClick={() => setSelectedTeam(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="workload-search-group">
          <div className="workload-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>

          <select
            className="filter-select workload-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="most">Sort: Most Tasks</option>
            <option value="least">Sort: Least Tasks</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── Workload Cards Grid ── */}
      <div className="workload-cards-grid">
        {filteredData.map(p => {
          const capPct = Math.min(100, Math.round((p.count / Math.max(maxTasks, 4)) * 100));
          return (
            <section className={`panel beast-workload-card ${p.loadClass}`} key={p.id}>
              {/* Card Header: Avatar, Name, Role, Load Badge, Count */}
              <div className="b-workload-header">
                <div className="b-workload-avatar-group">
                  <div className={`b-workload-avatar ${p.avatarUrl ? 'has-img' : ''}`}>
                    {p.avatarUrl?.startsWith('data:image/') ? (
                      <img src={p.avatarUrl} alt={p.name} />
                    ) : (
                      <span>{initials(p.name)}</span>
                    )}
                    <span className={`b-avatar-status-dot ${p.loadClass}`} />
                  </div>
                  <div className="b-workload-user-meta">
                    <div className="b-workload-name-row">
                      <strong className="b-workload-name">{p.name}</strong>
                      <span className={`b-load-badge ${p.loadClass}`}>
                        <span className="b-load-dot" />
                        {p.loadLabel}
                      </span>
                    </div>
                    <span className="b-workload-role-team">
                      {p.title || p.role} · <span className="b-team-tag">{p.team}</span>
                    </span>
                  </div>
                </div>

                {/* Minimal Count Badge */}
                <div className={`b-workload-count-badge ${p.loadClass}`} title={`${p.count} active tasks`}>
                  <strong>{p.count}</strong>
                  <small>task{p.count !== 1 ? 's' : ''}</small>
                </div>
              </div>

              {/* Progress Meter */}
              <div className="b-workload-meter-block">
                <div className="b-workload-meter-header">
                  <span className="b-meter-label">Capacity</span>
                  <span className="b-meter-val">
                    {capPct}%
                  </span>
                </div>
                <div className="b-workload-meter-track">
                  <div
                    className={`b-workload-meter-fill ${p.loadClass}`}
                    style={{ width: `${Math.max(capPct, p.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Mini-Row (Minimalist) */}
              <div className="b-workload-stats-row">
                <div className="b-stat-pill" title="Critical or High Priority tasks">
                  <span className={`b-stat-pill-num ${(p.critical.length + p.high.length) > 0 ? 'text-orange' : ''}`}>
                    {p.critical.length + p.high.length}
                  </span>
                  <span className="b-stat-pill-label">Crit/High</span>
                </div>
                <div className="b-stat-pill-divider" />
                <div className="b-stat-pill" title="Tasks currently in progress">
                  <span className={`b-stat-pill-num ${p.inProg.length > 0 ? 'text-teal' : ''}`}>
                    {p.inProg.length}
                  </span>
                  <span className="b-stat-pill-label">In Progress</span>
                </div>
                <div className="b-stat-pill-divider" />
                <div className="b-stat-pill" title="Blocked or Overdue tasks">
                  <span className={`b-stat-pill-num ${(p.blocked.length + p.overdue.length) > 0 ? 'text-red' : ''}`}>
                    {p.blocked.length + p.overdue.length}
                  </span>
                  <span className="b-stat-pill-label">Blocked/Late</span>
                </div>
                <div className="b-stat-pill-divider" />
                <div className="b-stat-pill" title="Completed tasks">
                  <span className="b-stat-pill-num text-green">
                    {p.doneTasks.length}
                  </span>
                  <span className="b-stat-pill-label">Done</span>
                </div>
              </div>

              {/* Active Tasks Preview Snippet */}
              {p.activeTasks.length > 0 ? (
                <div className="b-workload-tasks-preview">
                  <div className="b-preview-header-row">
                    <span className="b-preview-header">Active Assignments ({p.activeTasks.length})</span>
                    <button
                      type="button"
                      className="b-preview-view-all-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingMember(p);
                      }}
                      title="View all assigned tasks in popup"
                    >
                      View All
                    </button>
                  </div>
                  <div className="b-preview-list">
                    {(expandedMembers[p.id] ? p.activeTasks : p.activeTasks.slice(0, 2)).map(task => {
                      const site = sites?.find(s => s.id === task.siteId);
                      const webName = getTaskWebsiteName(task, site);
                      return (
                        <div
                          className="b-preview-item"
                          key={task.id}
                          onClick={() => openTask && openTask(task)}
                          tabIndex="0"
                          role="button"
                          title="Click to view task details"
                        >
                          <span className={`priority-dot priority-${(task.priority || 'medium').toLowerCase()}`} />
                          <div className="b-preview-item-info">
                            <span className="b-preview-title">{task.title}</span>
                            <small className="b-preview-site">{webName} · {task.status}</small>
                          </div>
                          <span className="b-preview-due">{dayLabel(task.due)}</span>
                        </div>
                      );
                    })}
                    {p.activeTasks.length > 2 && (
                      <button
                        type="button"
                        className="b-preview-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandMember(p.id);
                        }}
                        aria-expanded={!!expandedMembers[p.id]}
                        title={expandedMembers[p.id] ? "Click to collapse" : "Click to view all tasks"}
                      >
                        {expandedMembers[p.id]
                          ? 'Show less ▲'
                          : `+${p.activeTasks.length - 2} more in queue (click to view)`}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="b-workload-available-notice">
                  <Check size={14} style={{ color: '#10B981' }} />
                  <span>Available for assignments</span>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {!filteredData.length && (
        <div className="panel workload-empty-state">
          <Users size={32} />
          <h3>No team members found</h3>
          <p>No delivery members match the current filter or search criteria.</p>
        </div>
      )}

      {/* MEMBER TASKS MODAL */}
      {viewingMember && (
        <div
          className="overlay modal-overlay"
          onMouseDown={e => e.target === e.currentTarget && setViewingMember(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card workload-member-modal" style={{ maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  {viewingMember.name} • Assigned Tasks
                </h3>
                <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  {viewingMember.title || viewingMember.team} • {viewingMember.activeTasks.length} active, {viewingMember.doneTasks.length} completed
                </small>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setViewingMember(null)}
                aria-label="Close"
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Active Tasks ({viewingMember.activeTasks.length})
              </div>
              {viewingMember.activeTasks.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '4px 0 16px' }}>No active tasks assigned.</p>
              ) : (
                viewingMember.activeTasks.map(task => {
                  const site = sites?.find(s => s.id === task.siteId);
                  const webName = getTaskWebsiteName(task, site);
                  return (
                    <div
                      key={task.id}
                      className="b-preview-item"
                      style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', background: 'var(--surface-soft)' }}
                      onClick={() => {
                        setViewingMember(null);
                        openTask && openTask(task);
                      }}
                      role="button"
                      tabIndex="0"
                      title="Click to view full details in task drawer"
                    >
                      <span className={`priority-dot priority-${(task.priority || 'medium').toLowerCase()}`} />
                      <div className="b-preview-item-info" style={{ flex: 1, minWidth: 0 }}>
                        <span className="b-preview-title" style={{ fontWeight: 600, fontSize: '13px' }}>{task.title}</span>
                        <small className="b-preview-site">{webName} • <span className={`status-pill status-${(task.status || 'backlog').toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span></small>
                      </div>
                      <span className="b-preview-due" style={{ fontSize: '11.5px' }}>{dayLabel(task.due)}</span>
                    </div>
                  );
                })
              )}

              {viewingMember.doneTasks.length > 0 && (
                <>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '16px', marginBottom: '4px' }}>
                    Completed Tasks ({viewingMember.doneTasks.length})
                  </div>
                  {viewingMember.doneTasks.map(task => {
                    const site = sites?.find(s => s.id === task.siteId);
                    const webName = getTaskWebsiteName(task, site);
                    return (
                      <div
                        key={task.id}
                        className="b-preview-item"
                        style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', opacity: 0.8 }}
                        onClick={() => {
                          setViewingMember(null);
                          openTask && openTask(task);
                        }}
                        role="button"
                        tabIndex="0"
                        title="Click to view full details in task drawer"
                      >
                        <span className="priority-dot priority-done" />
                        <div className="b-preview-item-info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="b-preview-title" style={{ textDecoration: 'line-through', fontSize: '13px' }}>{task.title}</span>
                          <small className="b-preview-site">{webName} • Done</small>
                        </div>
                        <span className="b-preview-due" style={{ fontSize: '11.5px' }}>Done</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function ReportsPage({ tasks }) {
  const states = ['Backlog','Assigned','In Progress','On Hold','Blocked','In Review','Done'];
  return (
    <>
      <PageHeading title="Reports &amp; Analytics" subtitle="A live summary of delivery status and task priority." />
      <div className="report-stat-row">
        <div className="panel report-stat-card"><span>Total tasks</span><strong>{tasks.length}</strong><small>across Client Track</small></div>
        <div className="panel report-stat-card"><span>Completed</span><strong className="green">{tasks.filter(t=>t.status==='Done').length}</strong><small>delivery complete</small></div>
        <div className="panel report-stat-card"><span>Domains</span><strong>4</strong><small>Leadership, Web Dev, UI/UX Designer, QA</small></div>
        <div className="panel report-stat-card"><span>Overdue</span><strong className="red">{tasks.filter(t=>t.due<0&&t.status!=='Done').length}</strong><small>require attention</small></div>
      </div>
      <section className="panel report-panel">
        <div className="panel-heading"><div><h2>Tasks by status</h2><p>Current distribution across the portal</p></div></div>
        {states.map(state => {
          const count = tasks.filter(t=>t.status===state).length;
          return <div className="report-row" key={state}><span>{state}</span><div className="progress-track"><span style={{width:`${count/(tasks.length||1)*100}%`}} /></div><strong>{count}</strong></div>;
        })}
      </section>
    </>
  );
}

// ─── ACTIVITY ────────────────────────────────────────────────────────────────
function ActivityPage({ notifications }) {
  const items = [
    ['Task NL-115 is due today','Dev Malhotra · Lumen Dental','Today','due'],
    ['Payment gateway integration is blocked','Sneha Kulkarni · Harbor Coffee Co.','Today','blocked'],
    ['Homepage hero and carousel build updated','Dev Malhotra · Harbor Coffee Co.','Yesterday','update'],
    ['Design system handoff completed','Meera Joshi · Bluepeak Fitness','Yesterday','done'],
  ];
  return (
    <>
      <PageHeading title="Activity &amp; Notifications" subtitle={`${notifications} unread · Recent updates across your team.`} />
      <section className="panel activity-list">
        {items.map(([title,detail,time,kind],i) => (
          <div className="activity-item" key={title}>
            <span className={`activity-icon ${kind}`}><Icon name={kind==='due'?'clock':kind==='done'?'check':'bell'} size={16} /></span>
            <div><strong>{title}</strong><small>{detail}</small></div>
            <time>{time}</time>
            {i < notifications && <span className="unread-dot" />}
          </div>
        ))}
      </section>
    </>
  );
}

function ProfilePage({ currentEmployee, onSave }) {
  const [avatarImage, setAvatarImage] = React.useState(currentEmployee?.avatarUrl || '');

  React.useEffect(() => {
    setAvatarImage(currentEmployee?.avatarUrl || '');
  }, [currentEmployee]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      name: String(data.get('name') || ''),
      title: String(data.get('title') || ''),
      email: String(data.get('email') || ''),
      avatarUrl: avatarImage,
    });
  };

  return (
    <>
      <PageHeading title="My Profile" subtitle="Manage the profile details shown to your team." />
      <section className="panel profile-edit-panel">
        <div className="profile-edit-heading">
          <span className="avatar avatar-large">{avatarImage ? <img src={avatarImage} alt="" /> : initials(currentEmployee?.name || 'User')}</span>
          <div>
            <h2>{currentEmployee?.name || 'User'}</h2>
            <p>
              {(() => {
                const title = currentEmployee?.title?.trim() || '';
                const teams = getEmployeeTeams(currentEmployee).filter(Boolean);
                const roles = getEmployeeRoles(currentEmployee).filter(Boolean);
                const distinctRoles = roles.filter(r => !title.toLowerCase().includes(r.toLowerCase()));
                const parts = [];
                if (title) parts.push(title);
                if (teams.length > 0) parts.push(teams.join(', '));
                if (distinctRoles.length > 0) parts.push(distinctRoles.join(', '));
                return parts.join(' · ') || 'Team Member';
              })()}
            </p>
          </div>
        </div>
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="profile-name">Full name</label>
          <input className="field-control" id="profile-name" name="name" defaultValue={currentEmployee?.name} required maxLength={80} />
          <label className="field-label" htmlFor="profile-title">Job title</label>
          <input className="field-control" id="profile-title" name="title" defaultValue={currentEmployee?.title} required maxLength={100} />
          <label className="field-label" htmlFor="profile-email">Email address</label>
          <input className="field-control" id="profile-email" name="email" type="email" defaultValue={currentEmployee?.email} required />
          <ImageUploadField id="profile-avatar" label="Profile photo" value={avatarImage} onChange={setAvatarImage} />
          <div className="modal-actions">
            <button className="button button-primary" type="submit">Save profile</button>
          </div>
        </form>
      </section>
    </>
  );
}

function ImageUploadField({ id, label, value, onChange }) {
  const [error, setError] = React.useState('');
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Choose a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
        setError('The selected image could not be loaded.');
        return;
      }
      const rawDataUrl = reader.result;
      if (file.size <= 200 * 1024) {
        onChange(rawDataUrl);
        return;
      }
      // Optimize image dimensions for preview and storage safety
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 800;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);
          onChange(optimized);
        } catch {
          onChange(rawDataUrl);
        }
      };
      img.onerror = () => onChange(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => setError('The selected image could not be read.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="image-upload-field">
      <span className="field-label">{label} <span>(optional)</span></span>
      <div className="image-upload-control">
        {value
          ? <img className="image-upload-preview" src={value} alt={`${label} preview`} />
          : <span className="image-upload-placeholder" aria-hidden="true"><Icon name="plus" size={17} /></span>}
        <div className="image-upload-actions">
          <input className="image-upload-input" id={id} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} />
          <label className="button button-secondary image-upload-button" htmlFor={id}>Choose image</label>
          <small>PNG, JPG, WEBP, or GIF · up to 10 MB</small>
          {value && <button className="image-remove-button" type="button" onClick={() => { onChange(''); setError(''); }}>Remove image</button>}
        </div>
      </div>
      {error && <p className="image-upload-error" role="alert">{error}</p>}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsPage({ role, currentEmployee, employees, onUpdateEmployeeAccount, accessRequests, onReviewAccessRequest, portalName, setPortalName, onDownloadReport, auditLog }) {
  const isAdmin = role === 'Admin';
  const [draftPortalName, setDraftPortalName] = React.useState(portalName);
  const activeAdminCount = employees.filter(employee => hasRole(employee, 'Admin') && employee.enabled).length;

  React.useEffect(() => {
    setDraftPortalName(portalName);
  }, [portalName]);

  const savePortalName = () => {
    const trimmed = draftPortalName.trim();
    if (!trimmed) return;
    setPortalName(trimmed);
  };

  return (
    <>
      <PageHeading title="Setting" subtitle="Admin access, roles, reports, and portal preferences." />
      <section className="panel settings-panel">
        <div className="panel-heading"><div><h2>Profile</h2><p>Your current account</p></div></div>
        <div className="profile-settings">
          <span className="avatar avatar-large">{initials(currentEmployee.name)}</span>
          <div>
            <strong>{currentEmployee.name}</strong>
            <small>{currentEmployee.title}{role && !currentEmployee.title?.toLowerCase().includes(role.toLowerCase()) ? ` · ${role}` : ''}</small>
            <small style={{marginTop:2}}>{currentEmployee.email}</small>
          </div>
        </div>

        {isAdmin && (
          <div className="admin-tools">
            <div className="admin-tool-row">
              <div>
                <strong>Portal branding</strong>
                <small>Update the visible portal name across the app</small>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setDraftPortalName(portalName)}>Reset</button>
            </div>
            <div className="portal-edit-row">
              <input
                className="field-control"
                value={draftPortalName}
                onChange={(e) => setDraftPortalName(e.target.value)}
                aria-label="Portal name"
              />
              <button className="button button-primary" type="button" onClick={savePortalName}>Save portal name</button>
            </div>
            <section className="access-requests">
              <div className="access-requests-heading">
                <div><strong>Login requests</strong><small>Approve or decline requests from existing staff accounts.</small></div>
                <span>{accessRequests.filter(request => request.status === 'pending').length} pending</span>
              </div>
              <div className="access-request-list">
                {accessRequests.filter(request => request.status === 'pending').map(request => {
                  const employee = employees.find(member => member.id === request.employeeId);
                  if (!employee) return null;
                  return (
                    <div className="access-request-row" key={request.id}>
                      <div className="account-person">
                        <span className="avatar avatar-small">{initials(employee.name)}</span>
                        <div><strong>{employee.name}</strong><small>{employee.email} · {employee.team} / {employee.role}</small></div>
                      </div>
                      <time>{request.requestedAt}</time>
                      <div className="access-request-actions">
                        <button className="button button-secondary" type="button" onClick={() => onReviewAccessRequest(request.id, false)}>Decline</button>
                        <button className="button button-primary" type="button" onClick={() => onReviewAccessRequest(request.id, true)}>Approve access</button>
                      </div>
                    </div>
                  );
                })}
                {!accessRequests.some(request => request.status === 'pending') && <p className="access-requests-empty">No pending login requests.</p>}
              </div>
            </section>
            <section className="account-management">
              <div className="account-management-heading">
                <div><strong>Access &amp; roles</strong><small>Choose each person’s domain and role, and control whether they can sign in.</small></div>
                <span>{employees.filter(employee => employee.enabled).length} active</span>
              </div>
              <div className="account-table-header" aria-hidden="true">
                <span>Employee</span><span>Domains / teams</span><span>Roles</span><span>Access</span>
              </div>
              <div className="account-list">
                {employees.map(employee => {
                  const isCurrentUser = employee.id === currentEmployee.id;
                  const isLastActiveAdmin = hasRole(employee, 'Admin') && employee.enabled && activeAdminCount === 1;
                  const roleLocked = isCurrentUser || isLastActiveAdmin;
                  const accessLocked = isCurrentUser || isLastActiveAdmin;
                  return (
                    <div className="account-row" key={employee.id}>
                      <div className="account-person">
                        <span className="avatar avatar-small">{initials(employee.name)}</span>
                        <div><strong>{employee.name}</strong><small>{employee.email}</small></div>
                      </div>
                      <div className="account-setting account-setting-domains">
                        <MultiDomainPicker
                          employee={employee}
                          disabled={isCurrentUser}
                          onUpdateTeams={(nextTeams) => {
                            onUpdateEmployeeAccount(employee.id, {
                              teams: nextTeams,
                              team: nextTeams[0] || 'Web Dev',
                            });
                          }}
                        />
                      </div>
                      <div className="account-setting account-setting-roles">
                        <MultiRolePicker
                          employee={employee}
                          disabled={isCurrentUser}
                          isLastActiveAdmin={isLastActiveAdmin}
                          onUpdateRoles={(nextRoles) => {
                            onUpdateEmployeeAccount(employee.id, {
                              roles: nextRoles,
                              role: nextRoles[0] || 'Employee',
                            });
                          }}
                        />
                      </div>
                      <label className={`account-access${employee.enabled ? ' enabled' : ''}`}>
                        <input type="checkbox" checked={employee.enabled} aria-label={`${employee.name} sign-in access`} disabled={accessLocked} onChange={event => onUpdateEmployeeAccount(employee.id, { enabled: event.target.checked })} />
                        <span>{employee.enabled ? 'Can sign in' : 'No access'}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="account-management-note">Only admins can change access. Your own admin access and the last active admin account are protected.</p>
            </section>
          </div>
        )}

        <div className="settings-note">This prototype uses sample data. Account access and roles are saved in this browser; other changes reset on reload. Production access control requires a server.</div>

        <div className="audit-panel">
          <div className="panel-heading"><div><h2>Audit log</h2><p>Delete and update history with the associated user name</p></div></div>
          <div className="audit-log">
            {auditLog.map(item => (
              <div className="audit-row" key={item.id}>
                <div className="audit-meta">
                  <span className="audit-action">{item.action}</span>
                  <small>{item.actor} · {item.role}</small>
                </div>
                <div className="audit-detail">{item.detail}</div>
                <div className="audit-time">{item.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── TASK DRAWER ─────────────────────────────────────────────────────────────
function TaskDrawer({ task, employees, sites, close, updateTask, deleteTask, role, currentEmployee }) {
  const [draftTitle, setDraftTitle] = React.useState(task.title);
  const [draftDescription, setDraftDescription] = React.useState(task.description || '');
  const [draftStatus, setDraftStatus] = React.useState(task.status);
  const [draftPriority, setDraftPriority] = React.useState(task.priority);
  const [draftDueDate, setDraftDueDate] = React.useState(task.dueDate || dateKeyFromOffset(task.due));
  
  const site = sites.find(s => s.id === task.siteId);
  const resolvedInitialSite = getTaskWebsiteName(task, site);
  const [draftWebsiteName, setDraftWebsiteName] = React.useState(resolvedInitialSite);
  
  const initialAssignees = Array.isArray(task.assignees) && task.assignees.length
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : [];
  const [draftAssignees, setDraftAssignees] = React.useState(initialAssignees);
  const [draftQaAssignee, setDraftQaAssignee] = React.useState(
    task.qaAssignee || employees.find(e => hasTeam(e, 'QA') && initialAssignees.includes(e.id))?.id || ''
  );

  React.useEffect(() => {
    setDraftTitle(task.title || '');
    setDraftDescription(task.description || '');
    setDraftStatus(task.status || 'Backlog');
    setDraftPriority(task.priority || 'Medium');
    setDraftDueDate(task.dueDate || dateKeyFromOffset(task.due));
    const currentSite = sites.find(s => s.id === task.siteId);
    setDraftWebsiteName(getTaskWebsiteName(task, currentSite));
    const currentAssignees = Array.isArray(task.assignees) && task.assignees.length
      ? task.assignees
      : (task.assignee ? [task.assignee] : []);
    setDraftAssignees(currentAssignees);
  }, [task.id, task.status, task.priority, task.title, task.description, task.dueDate, task.due, task.websiteName, task.siteName, task.assignee, task.assignees]);

  // Jira Drawer State
  const [isStatusMenuOpen, setIsStatusMenuOpen] = React.useState(false);
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = React.useState(false);
  const [isQaPickerOpen, setIsQaPickerOpen] = React.useState(false);
  const [assigneeSearch, setAssigneeSearch] = React.useState('');
  const [assigneeFilterTab, setAssigneeFilterTab] = React.useState('all');

  const emp = employees.find(p => p.id === (draftAssignees[0] || task.assignee));
  const taskTeam = task.team || emp?.team;
  const isPriorityTask = task.isNewWebsite === true || task.workType === 'New Website' || task.websiteMode === 'new_website' || task.priority === 'Critical';
  const currentRoles = getEmployeeRoles(currentEmployee);
  const hasFounder = currentRoles.includes('Founder');
  const hasManager = currentRoles.includes('Manager');
  const hasAdmin = currentRoles.includes('Admin');
  const hasTL = currentRoles.includes('Team Lead');
  const hasEmployee = currentRoles.includes('Employee');
  const isStrictlyFounder = currentRoles.length === 1 && currentRoles[0] === 'Founder';

  const userTeams = getEmployeeTeams(currentEmployee);
  const canManage = hasFounder || hasAdmin || hasManager || (hasTL && (!task.assignee || userTeams.some(t => hasTeam([taskTeam], t))));
  const canAssignTL = hasFounder || hasManager || hasAdmin;

  const isAssignedToThisTask = Boolean(
    (currentEmployee?.id && (draftAssignees.includes(currentEmployee.id) || task.assignee === currentEmployee.id || (Array.isArray(task.assignees) && task.assignees.includes(currentEmployee.id)))) ||
    (currentEmployee?.uid && (task.assigneeUid === currentEmployee.uid || task.assignee === currentEmployee.uid || (Array.isArray(task.assignees) && task.assignees.includes(currentEmployee.uid)))) ||
    (currentEmployee?.name && (task.assignee === currentEmployee.name || (Array.isArray(task.assignees) && task.assignees.includes(currentEmployee.name))))
  );
  const canUpdateOwn = isAssignedToThisTask;
  const canEditDetails = hasFounder || hasAdmin || hasManager || hasTL || canManage || canUpdateOwn;
  const isFounderUser = hasFounder || isStrictlyFounder || role === 'Founder' || currentEmployee?.role === 'Founder';
  const canClaim = (hasEmployee || hasTL) && !isFounderUser && !task.assignee && !draftAssignees.length;

  const handleStatusChange = async (st) => {
    setDraftStatus(st);
    setIsStatusMenuOpen(false);
    await updateTask(task.id, { status: st }, 'Updated status');
  };

  const handlePriorityChange = async (newP) => {
    setDraftPriority(newP);
    await updateTask(task.id, { priority: newP }, 'Updated priority');
  };

  const canAssignPersonInDrawer = (person) => {
    if (!person) return false;
    const personRoles = getEmployeeRoles(person);
    const personIsTL = isTeamLeadEmployee(person);
    if (isPriorityTask) return true;
    if (personIsTL && !canAssignTL && person.id !== currentEmployee?.id) return false;
    return true;
  };

  const toggleAssignee = (empId) => {
    if (!canManage) return;
    const targetPerson = employees.find(e => e.id === empId);
    if (!canAssignPersonInDrawer(targetPerson)) return;
    setDraftAssignees(current =>
      current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId]
    );
  };

  const handleAssignToMe = () => {
    if (!currentEmployee?.id) return;
    if (!draftAssignees.includes(currentEmployee.id)) {
      setDraftAssignees([currentEmployee.id, ...draftAssignees]);
    }
    if (draftStatus === 'Backlog') setDraftStatus('Assigned');
  };

  const handleSelectQaAssignee = (qaId) => {
    setDraftQaAssignee(qaId);
    if (qaId && !draftAssignees.includes(qaId)) {
      setDraftAssignees([...draftAssignees, qaId]);
    }
    setIsQaPickerOpen(false);
  };

  const handleSave = async () => {
    const changes = {};
    if (canEditDetails && draftTitle.trim() && draftTitle.trim() !== task.title) changes.title = draftTitle.trim();
    if (canEditDetails && draftDescription !== (task.description || '')) changes.description = draftDescription;
    if (canManage && draftWebsiteName.trim() && draftWebsiteName.trim() !== (task.websiteName || task.siteName || site?.name)) {
      changes.websiteName = draftWebsiteName.trim();
      changes.siteName = draftWebsiteName.trim();
    }
    if (draftStatus !== task.status) changes.status = draftStatus;
    if (canEditDetails && draftPriority !== task.priority) changes.priority = draftPriority;
    if (canEditDetails && draftDueDate !== (task.dueDate || dateKeyFromOffset(task.due))) changes.dueDate = draftDueDate;
    
    if (canManage) {
      const primaryAssigneeId = draftAssignees[0] || null;
      const primaryAssignee = primaryAssigneeId ? employees.find(employee => employee.id === primaryAssigneeId) : null;
      const prevAssignees = Array.isArray(task.assignees) ? task.assignees : (task.assignee ? [task.assignee] : []);
      const assigneesChanged = draftAssignees.length !== prevAssignees.length || draftAssignees.some(id => !prevAssignees.includes(id));
      if (assigneesChanged) {
        changes.assignee = primaryAssigneeId;
        changes.assigneeUid = primaryAssignee?.uid || null;
        changes.assignees = draftAssignees;
        if (primaryAssignee?.team) changes.team = primaryAssignee.team;
        if (primaryAssigneeId && (!changes.status || changes.status === 'Backlog') && task.status === 'Backlog') {
          changes.status = 'Assigned';
        }
      }
      if (draftQaAssignee !== (task.qaAssignee || '')) {
        changes.qaAssignee = draftQaAssignee || null;
      }
    }
    if (Object.keys(changes).length) await updateTask(task.id, changes, 'Updated task');
    close();
  };

  const getAvatarBg = (person) => {
    if (!person) return '#64748B';
    if (hasRole(person, 'Manager') || person.role === 'Manager') return '#6554C0';
    if (hasTeam(person, 'QA')) return '#0D9488';
    if (hasTeam(person, 'UI/UX Designer')) return '#9333EA';
    if (hasTeam(person, 'Web Dev')) return '#0C66E4';
    return '#475569';
  };

  const qaPerson = employees.find(e => e.id === draftQaAssignee) ||
    employees.find(e => hasTeam(e, 'QA') && draftAssignees.includes(e.id));

  // Filtered employees for Jira Assignee picker
  const filteredEmployees = employees.filter(p => {
    if (!canAssignPersonInDrawer(p)) return false;
    if (assigneeSearch.trim()) {
      const q = assigneeSearch.toLowerCase();
      const match = p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)) || (p.team && p.team.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (assigneeFilterTab === 'manager') return hasRole(p, 'Manager') || p.role === 'Manager';
    if (assigneeFilterTab === 'dev') return hasTeam(p, 'Web Dev');
    if (assigneeFilterTab === 'uiux') return hasTeam(p, 'UI/UX Designer');
    if (assigneeFilterTab === 'qa') return hasTeam(p, 'QA');
    return true;
  });

  const isDrawerNewSite = task.isNewWebsite === true || task.workType === 'New Website' || task.websiteMode === 'new_website' || [101, 108, 121, 129, 130].includes(Number(task.id));
  const allStatuses = ['Backlog', 'Assigned', 'In Progress', 'In Review', 'Done', 'Blocked', 'On Hold'];

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
      <aside className="drawer" aria-label={`Task NL-${task.id}`} style={{ width: 'min(580px, 100%)' }}>
        {/* JIRA HEADER */}
        <div className="jira-drawer-header">
          <div className="jira-breadcrumb">
            <span className="jira-project-name">NERDY LABS</span>
            <span>/</span>
            {(draftWebsiteName || getTaskWebsiteName(task, site)) && (
              <>
                <span className="jira-project-site">{draftWebsiteName || getTaskWebsiteName(task, site)}</span>
                <span>/</span>
              </>
            )}
            <span className="jira-task-key">NL-{task.id}</span>
          </div>

          <div className="jira-header-right">
            {/* JIRA STATUS DROPDOWN BUTTON */}
            <div className="jira-status-dropdown-wrap">
              <button
                type="button"
                className={`jira-status-trigger status-${draftStatus.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setIsStatusMenuOpen(prev => !prev)}
                title="Change status"
              >
                <span>{draftStatus}</span>
                <span style={{ fontSize: 10, marginLeft: 2 }}>⌵</span>
              </button>

              {isStatusMenuOpen && (
                <div className="jira-status-menu">
                  {allStatuses.map(st => {
                    const isCur = draftStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        className={`jira-status-option ${isCur ? 'active' : ''}`}
                        onClick={() => handleStatusChange(st)}
                      >
                        <span className="status-dot" style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: st === 'Done' ? '#10B981' : st === 'In Progress' ? '#3B82F6' : st === 'Assigned' ? '#8B5CF6' : st === 'Blocked' ? '#EF4444' : st === 'In Review' || st === 'On Hold' ? '#F59E0B' : '#9CA3AF'
                        }} />
                        <span>{st}</span>
                        {isCur && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className="jira-header-icon-btn"
              onClick={close}
              title="Close drawer"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>

        {/* JIRA DRAWER BODY */}
        <div className="drawer-body" style={{ padding: '16px 20px', gap: '8px' }}>
          {/* Quick Bar: Work Type tags */}
          {(isDrawerNewSite || (task.workType && task.workType !== 'New Website' && task.workType !== 'Task')) && (
            <div className="jira-quick-bar">
              {isDrawerNewSite && (
                <span className="work-type-tag new-website" style={{ margin: 0 }}>
                  New Website
                </span>
              )}
              {task.workType && task.workType !== 'New Website' && task.workType !== 'Task' && (
                <span className={`work-type-tag ${task.workType.toLowerCase().replace(/\s+/g, '-')}`} style={{ margin: 0 }}>
                  {task.workType === 'Extra Work' ? 'Extra Work' : task.workType === 'New Features Update' ? 'New Feature' : task.workType}
                </span>
              )}
            </div>
          )}

          {/* Task Title (Jira Style) */}
          <div className="jira-title-wrap">
            <label htmlFor="jira-task-title-input" className="jira-title-label">
              Task name
            </label>
            <input
              id="jira-task-title-input"
              className="jira-title-input"
              value={draftTitle}
              disabled={!canEditDetails}
              onChange={e => setDraftTitle(e.target.value)}
              placeholder="Task name..."
              aria-label="Task name"
            />
          </div>

          {/* DESCRIPTION CARD */}
          <div className="premium-desc-card">
            <span className="premium-desc-label">Description</span>
            <p className="premium-desc-body">
              Work on {task.feature || task.moduleName || moduleNames[task.module]}{(draftWebsiteName || site?.name || task.siteName || task.websiteName) ? ` for ${draftWebsiteName || site?.name || task.siteName || task.websiteName}` : ''}. Keep the team updated as progress is made.
            </p>
          </div>

          {/* 2-COLUMN TASK DETAILS GRID (AS GIVEN IN THE STARTING) */}
          <div className="detail-grid">
            <div><span>Website</span><strong>{draftWebsiteName || getTaskWebsiteName(task, site)}</strong></div>
            {task.team && <div><span>Domain / Team</span><strong>{task.team === 'UI/UX Designer' ? 'UI/UX Designer' : task.team === 'QA' ? 'QA' : 'Developer'}</strong></div>}
            {task.designType && <div><span>Design Deliverable</span><strong>{task.designType}</strong></div>}
            {task.posterSize && <div><span>Poster Size</span><strong>{task.posterSize}</strong></div>}
            {task.designTool && <div><span>Design Tool</span><strong>{task.designTool}</strong></div>}
            {task.figmaUrl && <div><span>Figma Link</span><a href={task.figmaUrl} target="_blank" rel="noreferrer" style={{ color: '#EA580C', fontWeight: 600 }}>Open Figma / Brief ↗</a></div>}
            {task.qaRound && <div><span>QA Round</span><strong>{task.qaRound}</strong></div>}
            {task.qaType && <div><span>QA Scope</span><strong>{task.qaType}</strong></div>}
            {task.qaEnvironment && <div><span>QA Environment</span><strong>{task.qaEnvironment}</strong></div>}
            <div><span>Feature{task.features && task.features.length > 1 ? `s (${task.features.length})` : ''}</span><strong>{task.feature || task.moduleName || moduleNames[task.module]}</strong></div>
            <div><span>Tech stack</span><strong>{task.techStack || site?.techStack?.join(', ') || 'Not set'}</strong></div>
            {task.uiDesign && <div><span>UI Design</span><strong>Included</strong></div>}
            <div>
              <span>Assignee{draftAssignees.length > 1 ? `s (${draftAssignees.length})` : ''}</span>
              <strong>
                {draftAssignees.length > 0
                  ? draftAssignees.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join(', ')
                  : 'Unassigned'}
              </strong>
            </div>
            <div>
              <span>Due date</span>
              <input
                type="date"
                value={draftDueDate || ''}
                disabled={!canEditDetails}
                onChange={e => setDraftDueDate(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: 0,
                  cursor: canEditDetails ? 'pointer' : 'default',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <span>Priority</span>
              <select
                value={draftPriority}
                disabled={!canEditDetails}
                onChange={e => handlePriorityChange(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: 0,
                  cursor: canEditDetails ? 'pointer' : 'default',
                  outline: 'none',
                }}
              >
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div><span>Task ID</span><strong>NL-{task.id}</strong></div>
          </div>

          {/* ASSIGN TO EMPLOYEES (ENTERPRISE SCALABLE 50+ MEMBERS) */}
          {canManage && (() => {
            const canAssignManagers = hasFounder || isStrictlyFounder || hasManager || hasAdmin;
            const eligibleEmployees = employees.filter(e => {
              if (!canAssignPersonInDrawer(e)) return false;
              const isMgr = hasRole(e, 'Manager') || e.role === 'Manager';
              if (isMgr && !canAssignManagers) return false;
              return true;
            });

            const devCount = eligibleEmployees.filter(e => hasTeam(e, 'Web Dev')).length;
            const uiuxCount = eligibleEmployees.filter(e => hasTeam(e, 'UI/UX Designer')).length;
            const qaCount = eligibleEmployees.filter(e => hasTeam(e, 'QA')).length;
            const managerCount = canAssignManagers ? eligibleEmployees.filter(e => hasRole(e, 'Manager') || e.role === 'Manager').length : 0;

            const assignedPeople = employees.filter(e => draftAssignees.includes(e.id));

            const displayedEmployees = eligibleEmployees.filter(person => {
              if (assigneeFilterTab === 'dev' && !hasTeam(person, 'Web Dev')) return false;
              if (assigneeFilterTab === 'uiux' && !hasTeam(person, 'UI/UX Designer')) return false;
              if (assigneeFilterTab === 'qa' && !hasTeam(person, 'QA')) return false;
              if (assigneeFilterTab === 'manager' && !(hasRole(person, 'Manager') || person.role === 'Manager')) return false;

              if (assigneeSearch.trim()) {
                const q = assigneeSearch.trim().toLowerCase();
                const matchName = person.name?.toLowerCase().includes(q);
                const matchTitle = person.title?.toLowerCase().includes(q);
                const matchTeam = person.team?.toLowerCase().includes(q);
                const matchRole = person.role?.toLowerCase().includes(q);
                return matchName || matchTitle || matchTeam || matchRole;
              }
              return true;
            }).sort((a, b) => {
              const aChecked = draftAssignees.includes(a.id) ? 1 : 0;
              const bChecked = draftAssignees.includes(b.id) ? 1 : 0;
              if (bChecked !== aChecked) return bChecked - aChecked;
              const aTL = isTeamLeadEmployee(a) ? 1 : 0;
              const bTL = isTeamLeadEmployee(b) ? 1 : 0;
              if (bTL !== aTL) return bTL - aTL;
              return (a.name || '').localeCompare(b.name || '');
            });

            return (
              <div className="scalable-assignee-box">
                {/* Header */}
                <div className="scalable-assignee-header">
                  <span className="scalable-assignee-title">
                    Assign to Employees
                  </span>
                  <span className={`minimal-counter ${draftAssignees.length > 0 ? 'active' : ''}`}>
                    {draftAssignees.length} assigned
                  </span>
                </div>

                {/* Selected Chips */}
                {assignedPeople.length > 0 && (
                  <div className="scalable-assigned-chips">
                    {assignedPeople.map(person => {
                      const isTL = isTeamLeadEmployee(person);
                      return (
                        <span key={person.id} className="scalable-assigned-chip">
                          <span className="scalable-chip-avatar" style={{ background: getAvatarBg(person) }}>
                            {initials(person.name)}
                          </span>
                          <span>{person.name}{isTL ? ' (TL)' : ''}</span>
                          <button
                            type="button"
                            className="scalable-chip-remove"
                            onClick={() => toggleAssignee(person.id)}
                            title={`Remove ${person.name}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    {draftAssignees.length > 1 && (
                      <button
                        type="button"
                        className="scalable-clear-all-btn"
                        onClick={() => setDraftAssignees([])}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}

                {/* Search & Filter Tabs */}
                <div className="scalable-assignee-filter-bar">
                  <div className="scalable-search-wrap">
                    <Icon name="search" size={13} className="scalable-search-icon" />
                    <input
                      type="text"
                      className="scalable-search-input"
                      placeholder={`Search ${eligibleEmployees.length} members by name or role...`}
                      value={assigneeSearch}
                      onChange={e => setAssigneeSearch(e.target.value)}
                    />
                    {assigneeSearch && (
                      <button
                        type="button"
                        className="scalable-search-clear"
                        onClick={() => setAssigneeSearch('')}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="scalable-filter-tabs">
                    <button
                      type="button"
                      className={`scalable-filter-tab ${assigneeFilterTab === 'all' ? 'active' : ''}`}
                      onClick={() => setAssigneeFilterTab('all')}
                    >
                      All ({eligibleEmployees.length})
                    </button>
                    {devCount > 0 && (
                      <button
                        type="button"
                        className={`scalable-filter-tab ${assigneeFilterTab === 'dev' ? 'active' : ''}`}
                        onClick={() => setAssigneeFilterTab('dev')}
                      >
                        Devs ({devCount})
                      </button>
                    )}
                    {uiuxCount > 0 && (
                      <button
                        type="button"
                        className={`scalable-filter-tab ${assigneeFilterTab === 'uiux' ? 'active' : ''}`}
                        onClick={() => setAssigneeFilterTab('uiux')}
                      >
                        UI/UX ({uiuxCount})
                      </button>
                    )}
                    {qaCount > 0 && (
                      <button
                        type="button"
                        className={`scalable-filter-tab ${assigneeFilterTab === 'qa' ? 'active' : ''}`}
                        onClick={() => setAssigneeFilterTab('qa')}
                      >
                        QA ({qaCount})
                      </button>
                    )}
                    {managerCount > 0 && (
                      <button
                        type="button"
                        className={`scalable-filter-tab ${assigneeFilterTab === 'manager' ? 'active' : ''}`}
                        onClick={() => setAssigneeFilterTab('manager')}
                      >
                        Managers ({managerCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Members List */}
                <div className="scalable-members-list">
                  {displayedEmployees.length === 0 ? (
                    <div className="scalable-members-empty">
                      <span>No members match "{assigneeSearch}"</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigneeSearch('');
                          setAssigneeFilterTab('all');
                        }}
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="scalable-members-grid">
                      {displayedEmployees.map(person => {
                        const isChecked = draftAssignees.includes(person.id);
                        const isTL = isTeamLeadEmployee(person);
                        const isManager = hasRole(person, 'Manager') || person.role === 'Manager';
                        const teamBadge = isManager ? 'Manager' : isTL ? 'TL' : (person.team || '');

                        return (
                          <button
                            type="button"
                            key={person.id}
                            className={`scalable-member-card ${isChecked ? 'selected' : ''}`}
                            onClick={() => toggleAssignee(person.id)}
                          >
                            <span className="scalable-member-avatar" style={{ background: getAvatarBg(person) }}>
                              {initials(person.name)}
                            </span>
                            <div className="scalable-member-info">
                              <span className="scalable-member-name">{person.name}</span>
                              {teamBadge && (
                                <span className={`scalable-member-role-badge ${isManager ? 'role-manager' : isTL ? 'role-tl' : ''}`}>
                                  {teamBadge}
                                </span>
                              )}
                            </div>
                            <span className={`scalable-checkbox ${isChecked ? 'checked' : ''}`}>
                              {isChecked ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}


        </div>

        {/* DRAWER FOOTER */}
        <div className="drawer-footer">
          <button className="button button-secondary" onClick={close}>Close</button>
          {canClaim && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                updateTask(task.id, {
                  assignee: currentEmployee.id,
                  assigneeUid: currentEmployee.uid || null,
                  team: currentEmployee.team,
                  status: 'Assigned',
                }, 'Claimed task');
                close();
              }}
            >
              Assign to me
            </button>
          )}
          {canManage && (
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete task NL-${task.id}: "${task.title}"?`)) {
                  deleteTask(task.id);
                  close();
                }
              }}
            >
              <Icon name="trash" size={14} /> Delete task
            </button>
          )}
          {canEditDetails && (
            <button className="button button-primary" onClick={handleSave}>
              Save changes
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── NEW TASK MODAL ──────────────────────────────────────────────────────────
function NewTaskModal({ employees: all, sites: allSites, currentEmployee, role, page, onClose, onSubmit, error }) {
  const isPriorityMode = page === 'board';
  const isMyTasksMode = page === 'my';
  const currentRoles = getEmployeeRoles(currentEmployee);
  const isStrictlyFounder = currentRoles.length === 1 && currentRoles[0] === 'Founder';
  const hasFounder = currentRoles.includes('Founder') || role === 'Founder' || currentEmployee?.role === 'Founder';
  const hasManager = currentRoles.includes('Manager');
  const hasAdmin = currentRoles.includes('Admin');
  const hasTL = currentRoles.includes('Team Lead')
    || role === 'Team Lead'
    || currentEmployee?.role === 'Team Lead'
    || (Array.isArray(currentEmployee?.roles) && currentEmployee.roles.includes('Team Lead'))
    || (typeof currentEmployee?.title === 'string' && currentEmployee.title.toLowerCase().includes('team lead'))
    || ['E-003', 'E-004', 'E-008'].includes(currentEmployee?.id);

  const canAssign = !isMyTasksMode && (hasFounder || hasManager || hasAdmin || hasTL);
  const canAssignTL = hasFounder || hasManager || hasAdmin;

  // Leadership roles (Manager, Founder, Admin) can see and switch between all domain forms.
  // Team Leads can ONLY see and create tasks for their own domain(s).
  const isManagerOrAdmin = hasManager || hasFounder || hasAdmin;
  const userTeams = getEmployeeTeams(currentEmployee);

  const availableDomains = isManagerOrAdmin
    ? ['Web Dev', 'UI/UX Designer', 'QA']
    : ['Web Dev', 'UI/UX Designer', 'QA'].filter(d => userTeams.some(t => hasTeam([t], d)));

  const userDomain = userTeams.find(d => ['Web Dev', 'UI/UX Designer', 'QA'].includes(d))
    || (availableDomains.includes(currentEmployee?.team) ? currentEmployee.team : '')
    || availableDomains[0]
    || 'Web Dev';

  const defaultDomain = isPriorityMode
    ? 'Web Dev'
    : isMyTasksMode
    ? userDomain
    : (availableDomains[0] || 'Web Dev');
  const [selectedDomain, setSelectedDomain] = React.useState(defaultDomain); // 'Web Dev' | 'UI/UX Designer' | 'QA'

  // UI/UX Designer states
  const [designType, setDesignType] = React.useState('Poster Design');
  const [posterSize, setPosterSize] = React.useState('Social Media (1080x1080)');
  const [designTool, setDesignTool] = React.useState('Figma');
  const [figmaUrl, setFigmaUrl] = React.useState('');

  // QA states
  const [qaType, setQaType] = React.useState('Functionality Testing');
  const [qaRound, setQaRound] = React.useState('Round 1 Testing');
  const [qaEnvironment, setQaEnvironment] = React.useState('Live Website');

  // Filter employees according to selected domain
  const domainEmployees = all.filter(emp => {
    return hasTeam(emp, selectedDomain);
  });

  const [selectedSiteId, setSelectedSiteId] = React.useState(allSites[0]?.id || '');
  const [websiteName, setWebsiteName] = React.useState('');
  const [isNewWebsiteTask, setIsNewWebsiteTask] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');

  const handleWebsiteNameChange = (e) => {
    const val = e.target.value;
    setWebsiteName(val);
    const matched = allSites.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setSelectedSiteId(matched.id);
      if (matched.techStack?.[0]) setSelectedTechStack(matched.techStack[0]);
      if (Array.isArray(matched.features) && matched.features.length) {
        setSelectedFeatures(matched.features);
      }
    } else if (val.trim()) {
      setIsNewWebsiteTask(true);
    }
  };

  // Available feature options
  const allAvailableFeatures = [...new Set([...projectFeatures, 'Website Revamp'])];

  // Default features: 4 features for a website
  const [selectedFeatures, setSelectedFeatures] = React.useState(() => {
    if (defaultDomain === 'QA') {
      return ['Embedded Ordering', 'Offers', 'Reservations'];
    }
    return ['Static Website', 'Embedded Ordering', 'Reservations', 'Catering'];
  });

  const [selectedTechStack, setSelectedTechStack] = React.useState('React');
  const [includeUiDesign, setIncludeUiDesign] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState(isPriorityMode ? 'Critical' : 'Medium');
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [selectedAssignees, setSelectedAssignees] = React.useState(() => {
    return isMyTasksMode && currentEmployee?.id ? [currentEmployee.id] : [];
  });

  const canAssignPersonInModal = (person) => {
    if (!person) return false;
    const personRoles = getEmployeeRoles(person);
    const personIsTL = isTeamLeadEmployee(person);
    const personIsManager = personRoles.includes('Manager') || person.role === 'Manager';

    if (isPriorityMode) {
      return true; // on priority board, all managers, team leads and team employees are visible and assignable
    }
    if (personIsTL && !canAssignTL && person.id !== currentEmployee?.id) return false;
    return true;
  };

  const toggleAssignee = (empId) => {
    if (!canAssign) return;
    const targetPerson = all.find(e => e.id === empId);
    if (!canAssignPersonInModal(targetPerson)) {
      return;
    }
    setSelectedAssignees(current =>
      current.includes(empId)
        ? current.filter(id => id !== empId)
        : [...current, empId]
    );
  };

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 10);

  const selectedSite = allSites.find(s => s.id === selectedSiteId) || allSites[0];

  const toggleFeature = (feat) => {
    setSelectedFeatures(current =>
      current.includes(feat)
        ? current.filter(item => item !== feat)
        : [...current, feat]
    );
  };

  const handleSiteChange = (e) => {
    const newSiteId = e.target.value;
    setSelectedSiteId(newSiteId);
    const site = allSites.find(s => s.id === newSiteId);
    if (site) {
      if (site.techStack?.[0]) setSelectedTechStack(site.techStack[0]);
      if (Array.isArray(site.features) && site.features.length) {
        setSelectedFeatures(site.features);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const activeWebsiteName = websiteName.trim();

    if (!activeWebsiteName) {
      alert('Please type a website name.');
      return;
    }
    if (!taskTitle.trim()) {
      alert('Please enter a task name.');
      return;
    }
    if (selectedDomain === 'Web Dev' && selectedFeatures.length === 0) {
      alert('Please select at least one feature (typically 4 to 5 features).');
      return;
    }

    const payload = {
      domain: selectedDomain,
      websiteMode: isNewWebsiteTask ? 'new_website' : 'old_website',
      workType: isNewWebsiteTask
        ? 'New Website'
        : (selectedDomain === 'UI/UX Designer' ? designType : selectedDomain === 'QA' ? 'QA Testing' : 'Task'),
      isNewWebsite: isNewWebsiteTask,
      websiteName: activeWebsiteName,
      siteName: activeWebsiteName,
      newWebsiteName: activeWebsiteName,
      siteId: selectedSiteId,
      title: taskTitle.trim(),
      designType: selectedDomain === 'UI/UX Designer' ? designType : null,
      posterSize: null,
      designTool: selectedDomain === 'UI/UX Designer' ? designTool : null,
      figmaUrl: selectedDomain === 'UI/UX Designer' ? figmaUrl.trim() : null,
      qaType: selectedDomain === 'QA' ? qaType : null,
      qaRound: selectedDomain === 'QA' ? qaRound : null,
      qaEnvironment: selectedDomain === 'QA' ? qaEnvironment : null,
      features: selectedFeatures,
      feature: selectedDomain === 'UI/UX Designer'
        ? designType
        : selectedDomain === 'QA'
        ? `${qaRound ? `${qaRound} · ` : ''}${qaType} · ${qaEnvironment}`
        : selectedFeatures.join(', '),
      techStack: selectedDomain === 'UI/UX Designer'
        ? (designTool || 'Figma')
        : selectedDomain === 'QA'
        ? `QA (${qaEnvironment || 'Live'})`
        : selectedTechStack,
      uiDesign: includeUiDesign,
      priority: selectedPriority,
      due: dueDate,
      assignees: isMyTasksMode && currentEmployee?.id ? [currentEmployee.id] : selectedAssignees,
      assignee: isMyTasksMode && currentEmployee?.id
        ? currentEmployee.id
        : (selectedAssignees[0] || (isStrictlyFounder ? '' : currentEmployee?.id || '')),
    };

    onSubmit(e, payload);
  };

  return (
    <div className="overlay modal-overlay task-modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal-card task-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {isPriorityMode
                ? 'PRIORITY BOARD'
                : isMyTasksMode
                ? 'MY TASKS'
                : selectedDomain === 'UI/UX Designer'
                ? 'UI/UX DESIGN TASK'
                : selectedDomain === 'QA'
                ? 'QA TESTING TASK'
                : 'DEVELOPER TASK'}
            </span>
            <h2 id="modal-title">
              {isPriorityMode
                ? 'Add a priority task'
                : isMyTasksMode
                ? 'Add task to My Tasks'
                : selectedDomain === 'UI/UX Designer'
                ? 'Create a UI/UX design task'
                : selectedDomain === 'QA'
                ? 'Create a QA testing task'
                : 'Create a developer task'}
            </h2>
          </div>
          <button className="icon-button modal-close-btn" type="button" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Target Domain / Department Selector:
              - Managers, Admins, and multi-domain Team Leads can see domain forms and switch between them.
              - In My Tasks, and for Founders, do not show this box.
          */}
          {!isMyTasksMode && !hasFounder && availableDomains.length > 1 && (
            <div className="domain-selection-group">
              <label className="field-label" style={{ marginBottom: 6 }}>
                Target Domain / Department
              </label>

              <div className="minimal-segmented-toggle domain-segmented-toggle" role="tablist">
                {availableDomains.includes('Web Dev') && (
                  <button
                    type="button"
                    className={`minimal-toggle-btn ${selectedDomain === 'Web Dev' ? 'active btn-dev' : ''}`}
                    onClick={() => {
                      setSelectedDomain('Web Dev');
                      setSelectedAssignees([]);
                      setSelectedFeatures(['Static Website', 'Embedded Ordering', 'Reservations', 'Catering']);
                    }}
                  >
                    <Icon name="code" size={14} /> Developer
                  </button>
                )}
                {availableDomains.includes('UI/UX Designer') && (
                  <button
                    type="button"
                    className={`minimal-toggle-btn ${selectedDomain === 'UI/UX Designer' ? 'active btn-uiux' : ''}`}
                    onClick={() => { setSelectedDomain('UI/UX Designer'); setSelectedAssignees([]); }}
                  >
                    <Icon name="palette" size={14} /> UI/UX Designer
                  </button>
                )}
                {availableDomains.includes('QA') && (
                  <button
                    type="button"
                    className={`minimal-toggle-btn ${selectedDomain === 'QA' ? 'active btn-qa' : ''}`}
                    onClick={() => {
                      setSelectedDomain('QA');
                      setSelectedAssignees([]);
                      setSelectedFeatures(['Embedded Ordering', 'Offers', 'Reservations']);
                    }}
                  >
                    <Icon name="shield" size={14} /> QA
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hidden inputs to guarantee FormData compatibility */}
          <input type="hidden" name="domain" value={selectedDomain} />
          <input type="hidden" name="websiteMode" value={isNewWebsiteTask ? 'new_website' : 'old_website'} />
          <input type="hidden" name="workType" value={isNewWebsiteTask ? 'New Website' : (selectedDomain === 'UI/UX Designer' ? designType : selectedDomain === 'QA' ? 'QA Testing' : 'Task')} />
          <input type="hidden" name="newWebsiteName" value={websiteName} />
          <input type="hidden" name="websiteName" value={websiteName} />
          <input type="hidden" name="siteName" value={websiteName} />
          <input type="hidden" name="siteId" value={selectedSiteId} />
          <input type="hidden" name="designType" value={designType} />
          <input type="hidden" name="posterSize" value={posterSize} />
          <input type="hidden" name="designTool" value={designTool} />
          <input type="hidden" name="figmaUrl" value={figmaUrl} />
          <input type="hidden" name="qaType" value={qaType} />
          <input type="hidden" name="qaRound" value={qaRound} />
          <input type="hidden" name="qaEnvironment" value={qaEnvironment} />
          <input type="hidden" name="techStack" value={selectedTechStack} />
          <input type="hidden" name="priority" value={selectedPriority} />
          <input type="hidden" name="due" value={dueDate} />
          <input type="hidden" name="assignee" value={selectedAssignees[0] || ''} />
          {selectedAssignees.map(a => (
            <input type="hidden" key={a} name="assignees" value={a} />
          ))}
          {selectedFeatures.map(feat => (
            <input type="hidden" key={feat} name="features" value={feat} />
          ))}

          {/* Datalist for autocomplete suggestions */}
          <datalist id="website-suggestions">
            {allSites.map(site => (
              <option key={site.id} value={site.name} />
            ))}
          </datalist>

          {/* Form Fields: Task Name & Website Name */}
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="field-label" htmlFor="t-name">Task name *</label>
              <input
                className="field-control"
                id="t-name"
                name="title"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                autoFocus
                placeholder={selectedDomain === 'UI/UX Designer' ? 'e.g. Design summer sale poster' : selectedDomain === 'QA' ? 'e.g. Test mobile responsiveness and forms' : 'e.g. Review checkout flow'}
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="t-site">Website / Project *</label>
              <input
                className="field-control"
                id="t-site"
                name="websiteName"
                list="website-suggestions"
                value={websiteName}
                onChange={handleWebsiteNameChange}
                placeholder="Type website name (e.g. Saffron Table)"
                required
              />
              <label className="new-website-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={isNewWebsiteTask}
                  onChange={e => setIsNewWebsiteTask(e.target.checked)}
                />
                <span style={{ fontWeight: 600, color: isNewWebsiteTask ? '#166534' : 'var(--muted)' }}>
                  Mark as New Website Project
                </span>
              </label>
            </div>
          </div>

          {/* ASSIGNED TO YOURSELF (FOR MY TASKS) */}
          {isMyTasksMode && currentEmployee && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="field-label">Assigned to</label>
              <div className="my-task-assigned-self-box">
                <span className="avatar avatar-small">{initials(currentEmployee.name)}</span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                  <strong style={{ fontSize: 13 }}>{currentEmployee.name} (You)</strong>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>{currentEmployee.title || currentEmployee.team}</small>
                </div>
                <span className="badge badge-assigned-self" style={{ marginLeft: 'auto', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 600, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                  ✓ Assigned to yourself
                </span>
              </div>
            </div>
          )}

          {/* ASSIGN TO EMPLOYEES: FILTERED BY DOMAIN */}
          {canAssign && (
            <>
              {/* FOR FOUNDER ON PRIORITY BOARD: ONLY MANAGERS & TEAM LEADS */}
              {isPriorityMode && (hasFounder || isStrictlyFounder) ? (
                <div className="minimal-features-group" style={{ marginBottom: 16, borderColor: 'rgba(234, 88, 12, 0.3)' }}>
                  <div className="minimal-features-header">
                    <span className="minimal-features-label" style={{ color: '#EA580C' }}>
                      Project Managers &amp; Team Leads
                    </span>
                    <span className={`minimal-counter ${selectedAssignees.length > 0 ? 'active' : ''}`}>
                      {selectedAssignees.length} selected
                    </span>
                  </div>
                  <div className="minimal-features-pills">
                    {all.filter(e => isTeamLeadEmployee(e) || hasRole(e, 'Manager') || e.role === 'Manager').map(person => {
                      const isChecked = selectedAssignees.includes(person.id);
                      const isManager = hasRole(person, 'Manager') || person.role === 'Manager';
                      const isTL = isTeamLeadEmployee(person);
                      return (
                        <button
                          type="button"
                          key={person.id}
                          className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                          onClick={() => toggleAssignee(person.id)}
                        >
                          <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                          <span>{person.name}{isManager ? ' (Manager)' : isTL ? ' (TL)' : ''}</span>
                          {isManager && (
                            <span className="tl-pill-badge" style={{ background: '#EDE9FE', color: '#6D28D9', borderColor: '#DDD6FE' }}>
                              Manager
                            </span>
                          )}
                          {isTL && <span className="tl-pill-badge">TL</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {selectedDomain === 'Web Dev' && (
                    <div className="minimal-features-group" style={{ marginBottom: 16 }}>
                      <div className="minimal-features-header">
                        <span className="minimal-features-label" style={{ color: '#2563EB' }}>
                          Developers (Web Dev)
                        </span>
                        <span className={`minimal-counter ${selectedAssignees.length > 0 ? 'active' : ''}`}>
                          {selectedAssignees.length} selected
                        </span>
                      </div>
                      <div className="minimal-features-pills">
                        {all.filter(e => hasTeam(e, 'Web Dev') && canAssignPersonInModal(e))
                          .sort((a, b) => (isTeamLeadEmployee(b) ? 1 : 0) - (isTeamLeadEmployee(a) ? 1 : 0))
                          .map(person => {
                          const isChecked = selectedAssignees.includes(person.id);
                          const isTL = isTeamLeadEmployee(person);
                          return (
                            <button
                              type="button"
                              key={person.id}
                              className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                              onClick={() => toggleAssignee(person.id)}
                            >
                              <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                              <span>{person.name}{isTL ? ' (TL)' : ''}</span>
                              {isTL && <span className="tl-pill-badge">TL</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedDomain === 'UI/UX Designer' && (
                    <div className="minimal-features-group" style={{ marginBottom: 16, borderColor: 'rgba(147, 51, 234, 0.3)' }}>
                      <div className="minimal-features-header">
                        <span className="minimal-features-label" style={{ color: '#7E22CE' }}>
                          UI/UX Designers
                        </span>
                        <span className={`minimal-counter active`} style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                          {selectedAssignees.length} selected
                        </span>
                      </div>
                      <div className="minimal-features-pills">
                        {all.filter(e => hasTeam(e, 'UI/UX Designer') && canAssignPersonInModal(e))
                          .sort((a, b) => (isTeamLeadEmployee(b) ? 1 : 0) - (isTeamLeadEmployee(a) ? 1 : 0))
                          .map(person => {
                          const isChecked = selectedAssignees.includes(person.id);
                          const isTL = isTeamLeadEmployee(person);
                          return (
                            <button
                              type="button"
                              key={person.id}
                              className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                              onClick={() => toggleAssignee(person.id)}
                            >
                              <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                              <span>{person.name}{isTL ? ' (TL)' : ''}</span>
                              {isTL && <span className="tl-pill-badge">TL</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedDomain === 'QA' && (
                    <div className="minimal-features-group" style={{ marginBottom: 16, borderColor: 'rgba(13, 148, 136, 0.3)' }}>
                      <div className="minimal-features-header">
                        <span className="minimal-features-label" style={{ color: '#0F766E' }}>
                          QA
                        </span>
                        <span className={`minimal-counter active`} style={{ background: '#CCFBF1', color: '#0F766E' }}>
                          {selectedAssignees.length} selected
                        </span>
                      </div>
                      <div className="minimal-features-pills">
                        {all.filter(e => hasTeam(e, 'QA') && canAssignPersonInModal(e))
                          .sort((a, b) => (isTeamLeadEmployee(b) ? 1 : 0) - (isTeamLeadEmployee(a) ? 1 : 0))
                          .map(person => {
                          const isChecked = selectedAssignees.includes(person.id);
                          const isTL = isTeamLeadEmployee(person);
                          return (
                            <button
                              type="button"
                              key={person.id}
                              className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                              onClick={() => toggleAssignee(person.id)}
                            >
                              <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                              <span>{person.name}{isTL ? ' (TL)' : ''}</span>
                              {isTL && <span className="tl-pill-badge">TL</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* DOMAIN-SPECIFIC FORM FIELDS */}
          {selectedDomain === 'UI/UX Designer' && (
            <>
              <div className="minimal-features-group" style={{ borderColor: 'rgba(147, 51, 234, 0.3)' }}>
                <div className="minimal-features-header">
                  <span className="minimal-features-label" style={{ color: '#7E22CE' }}>
                    Design Deliverable / Type
                  </span>
                  <span className="minimal-counter active" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                    {designType}
                  </span>
                </div>
                <div className="minimal-features-pills">
                  {[
                    'Poster Design',
                    'Menu Card Design',
                    'UI UX Design',
                    'Banner Design',
                    'App UI Design',
                    'UI Development',
                  ].map(type => (
                    <button
                      type="button"
                      key={type}
                      className={`minimal-feature-pill ${designType === type ? 'active' : ''}`}
                      onClick={() => setDesignType(type)}
                    >
                      <span className="pill-dot">{designType === type ? '✓' : '+'}</span>
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="field-label" htmlFor="t-design-tool">Design Tool</label>
                  <select
                    className="field-control"
                    id="t-design-tool"
                    name="designTool"
                    value={designTool}
                    onChange={e => setDesignTool(e.target.value)}
                  >
                    <option value="Figma">Figma</option>
                    <option value="Adobe Illustrator">Adobe Illustrator</option>
                    <option value="Adobe Photoshop">Adobe Photoshop</option>
                    <option value="Canva">Canva</option>
                    <option value="Adobe XD">Adobe XD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label" htmlFor="t-figma-url">Figma / Reference Link (Optional)</label>
                  <input
                    className="field-control"
                    id="t-figma-url"
                    name="figmaUrl"
                    value={figmaUrl}
                    onChange={e => setFigmaUrl(e.target.value)}
                    placeholder="https://figma.com/design/... or brief link"
                  />
                </div>
              </div>
            </>
          )}

          {selectedDomain === 'QA' && (
            <>
              {/* QA Testing Type / Scope: Only Functionality Testing & UI Testing */}
              <div className="minimal-features-group" style={{ borderColor: 'rgba(13, 148, 136, 0.3)', marginBottom: 14 }}>
                <div className="minimal-features-header">
                  <span className="minimal-features-label" style={{ color: '#0F766E' }}>
                    QA Testing Type / Scope
                  </span>
                  <span className="minimal-counter active" style={{ background: '#CCFBF1', color: '#0F766E' }}>
                    {qaType}
                  </span>
                </div>
                <div className="minimal-features-pills">
                  {['Functionality Testing', 'UI Testing'].map(type => (
                    <button
                      type="button"
                      key={type}
                      className={`minimal-feature-pill ${qaType === type ? 'active' : ''}`}
                      onClick={() => setQaType(type)}
                    >
                      <span className="pill-dot">{qaType === type ? '✓' : '+'}</span>
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QA Testing Round: Round 1 Testing & Round 2 Testing */}
              <div className="minimal-features-group" style={{ borderColor: 'rgba(13, 148, 136, 0.3)', marginBottom: 14 }}>
                <div className="minimal-features-header">
                  <span className="minimal-features-label" style={{ color: '#0F766E' }}>
                    QA Testing Round
                  </span>
                  <span className="minimal-counter active" style={{ background: '#CCFBF1', color: '#0F766E' }}>
                    {qaRound}
                  </span>
                </div>
                <div className="minimal-features-pills">
                  {['Round 1 Testing', 'Round 2 Testing'].map(round => (
                    <button
                      type="button"
                      key={round}
                      className={`minimal-feature-pill ${qaRound === round ? 'active' : ''}`}
                      onClick={() => setQaRound(round)}
                    >
                      <span className="pill-dot">{qaRound === round ? '✓' : '+'}</span>
                      <span>{round}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="field-label" htmlFor="t-qa-env">Testing Environment</label>
                  <select
                    className="field-control"
                    id="t-qa-env"
                    name="qaEnvironment"
                    value={qaEnvironment}
                    onChange={e => setQaEnvironment(e.target.value)}
                  >
                    <option value="Live Website">Live Website</option>
                    <option value="Demo / Staging">Demo / Staging</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label">Target Features to Verify</label>
                  <div className="minimal-features-pills" style={{ marginTop: 4 }}>
                    {['Embedded Ordering', 'Offers', 'Reservations', 'Event Order', 'Loyalty', 'Catering', 'Item Cart Recommendation'].map(feat => {
                      const isChecked = selectedFeatures.includes(feat);
                      return (
                        <button
                          type="button"
                          key={feat}
                          className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                          onClick={() => toggleFeature(feat)}
                        >
                          <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                          <span>{feat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedDomain === 'Web Dev' && (
            <>
              {/* FEATURES SELECTION (MINIMAL PILLS) */}
              <div className="minimal-features-group">
                <div className="minimal-features-header">
                  <span className="minimal-features-label">
                    Select Website Features
                  </span>
                  <span className={`minimal-counter ${selectedFeatures.length >= 4 && selectedFeatures.length <= 5 ? 'active' : ''}`}>
                    {selectedFeatures.length} selected {selectedFeatures.length >= 4 && selectedFeatures.length <= 5 ? '✓ (4–5 ideal)' : '(Typically 4–5)'}
                  </span>
                </div>
                <div className="minimal-features-pills">
                  {allAvailableFeatures.map(feat => {
                    const isChecked = selectedFeatures.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        className={`minimal-feature-pill ${isChecked ? 'active' : ''}`}
                        onClick={() => toggleFeature(feat)}
                      >
                        <span className="pill-dot">{isChecked ? '✓' : '+'}</span>
                        <span>{feat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TECH STACK */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="field-label" htmlFor="t-tech-stack">Tech stack</label>
                <select
                  className="field-control"
                  id="t-tech-stack"
                  name="techStack"
                  value={selectedTechStack}
                  onChange={e => setSelectedTechStack(e.target.value)}
                  required
                >
                  {projectTechStacks.map(stack => (
                    <option value={stack} key={stack}>{stack}</option>
                  ))}
                </select>
                <label className="ui-design-option">
                  <input
                    type="checkbox"
                    name="uiDesign"
                    checked={includeUiDesign}
                    onChange={event => setIncludeUiDesign(event.target.checked)}
                  />
                  <span>Include UI Design <small>Optional</small></span>
                </label>
              </div>
            </>
          )}

          {/* PRIORITY & DUE DATE (2-COLUMN GRID) */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="field-label" htmlFor="t-priority">Priority</label>
              <select
                className="field-control"
                id="t-priority"
                name="priority"
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value)}
              >
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="t-due">Due date</label>
              <input
                className="field-control"
                id="t-due"
                type="date"
                name="due"
                value={dueDate}
                min={minDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button className="button button-primary button-orange-solid" type="submit">
              <Icon name="plus" size={15} /> {isPriorityMode ? 'Add priority task' : 'Create task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ─── BADGES & HELPERS ────────────────────────────────────────────────────────
function PriorityBadge({ value }) {
  return <span className={`badge priority-badge priority-${value.toLowerCase()}`}><span />{value}</span>;
}
function StatusBadge({ value }) {
  return <span className={`badge status-badge status-${value.toLowerCase().replaceAll(' ','-')}`}>{value}</span>;
}
function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name="search" size={22} /></span>
      <strong>{title}</strong><p>{description}</p>
    </div>
  );
}
