/**
 * ============================================================================
 * FIREBASE DATABASE & USER OPERATIONS SERVICE
 * Nerdy Labs Priority Management Portal
 * ============================================================================
 * 
 * This file provides complete operational functions ("CRUD") for all Firebase
 * Firestore collections ("tables") and Firebase Authentication.
 * 
 * Firestore Collections / Tables Covered:
 *  1. 'employees'      - User accounts, roles, team domains, login permissions
 *  2. 'tasks'          - Task priority records, cadence, due dates, statuses
 *  3. 'sites'          - Websites / projects portfolio records
 *  4. 'auditLog'       - System audit trails and security activity records
 *  5. 'accessRequests' - Login access approval workflow requests
 * ============================================================================
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';

import { auth, db, firebaseConfigured } from './firebase.js';

// ─── TABLE / COLLECTION NAMES ────────────────────────────────────────────────
export const TABLES = {
  USERS: 'employees',
  TASKS: 'tasks',
  SITES: 'sites',
  AUDIT_LOG: 'auditLog',
  ACCESS_REQUESTS: 'accessRequests',
};

// Helper to ensure Firebase is connected
function checkFirebase() {
  if (!firebaseConfigured || !db || !auth) {
    throw new Error('Firebase is not configured. Please check your .env.local configuration.');
  }
}

// ============================================================================
// 1. FIREBASE USER & AUTHENTICATION OPERATIONS
// ============================================================================

/**
 * Sign in an existing user with Email and Password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('firebase/auth').User, profile: object }>}
 */
export async function signInUser(email, password) {
  checkFirebase();
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const user = credential.user;

  // Retrieve user document from the 'employees' table
  const userDocRef = doc(db, TABLES.USERS, user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error('User profile does not exist in the database. Contact your administrator.');
  }

  const profile = { id: user.uid, uid: user.uid, ...userSnap.data() };

  // Check if account is enabled
  if (profile.enabled === false) {
    await signOut(auth);
    throw new Error('Your portal account has been disabled by an administrator.');
  }

  return { user, profile };
}

/**
 * Sign out the currently authenticated user
 */
export async function signOutUser() {
  checkFirebase();
  await signOut(auth);
}

/**
 * Listen to real-time auth state changes
 * @param {function} callback - Receives (user, profile)
 * @returns {function} Unsubscribe function
 */
export function onAuthChange(callback) {
  if (!firebaseConfigured || !auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, TABLES.USERS, user.uid));
      if (userSnap.exists()) {
        const profile = { id: user.uid, uid: user.uid, ...userSnap.data() };
        callback(user, profile);
      } else {
        callback(user, null);
      }
    } catch (err) {
      console.error('Error fetching user profile on auth change:', err);
      callback(user, null);
    }
  });
}

/**
 * Create a new user account profile in the 'employees' table
 * Note: If using client SDK, createUserWithEmailAndPassword signs in the user.
 * In production admin scenarios, create via Firebase Console or Admin SDK.
 * @param {string} uid - Firebase Auth UID
 * @param {object} userData - { employeeId, name, email, team, role, enabled, title }
 */
export async function createUserProfile(uid, userData) {
  checkFirebase();
  const userRef = doc(db, TABLES.USERS, uid);
  const newProfile = {
    employeeId: userData.employeeId || `E-${Date.now().toString().slice(-3)}`,
    name: userData.name || '',
    title: userData.title || userData.role || 'Staff Member',
    email: userData.email.trim().toLowerCase(),
    team: userData.team || 'Web Dev',
    role: userData.role || 'Employee',
    roles: userData.roles || [userData.role || 'Employee'],
    enabled: userData.enabled !== false,
    pageAccess: userData.pageAccess || null,
    avatarUrl: userData.avatarUrl || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, newProfile);
  return { uid, ...newProfile };
}

/**
 * Fetch a single user profile by Auth UID
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  checkFirebase();
  const userSnap = await getDoc(doc(db, TABLES.USERS, uid));
  if (!userSnap.exists()) return null;
  return { id: uid, uid, ...userSnap.data() };
}

/**
 * Fetch all users from the 'employees' table
 * @param {object} [filters] - { team, role, enabled }
 * @returns {Promise<Array<object>>}
 */
export async function getAllUsers(filters = {}) {
  checkFirebase();
  const colRef = collection(db, TABLES.USERS);
  let q = colRef;

  const conditions = [];
  if (filters.team && filters.team !== 'All') {
    conditions.push(where('team', '==', filters.team));
  }
  if (filters.role && filters.role !== 'All') {
    conditions.push(where('role', '==', filters.role));
  }
  if (typeof filters.enabled === 'boolean') {
    conditions.push(where('enabled', '==', filters.enabled));
  }

  if (conditions.length > 0) {
    q = query(colRef, ...conditions);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    uid: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Update user's personal profile (Name, Title, Avatar, Bio)
 * @param {string} uid
 * @param {object} updates
 */
export async function updateUserProfile(uid, updates) {
  checkFirebase();
  const userRef = doc(db, TABLES.USERS, uid);
  const allowed = {
    updatedAt: serverTimestamp(),
  };
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.title !== undefined) allowed.title = updates.title;
  if (updates.avatarUrl !== undefined) allowed.avatarUrl = updates.avatarUrl;
  if (updates.bio !== undefined) allowed.bio = updates.bio;

  await updateDoc(userRef, allowed);
}

/**
 * Admin operation: Update user role, team, and login permissions
 * @param {string} uid
 * @param {object} accessData - { role, roles, team, enabled, pageAccess }
 */
export async function updateUserAccessRole(uid, accessData) {
  checkFirebase();
  const userRef = doc(db, TABLES.USERS, uid);
  const payload = {
    updatedAt: serverTimestamp(),
  };
  if (accessData.role !== undefined) payload.role = accessData.role;
  if (accessData.roles !== undefined) payload.roles = accessData.roles;
  if (accessData.team !== undefined) payload.team = accessData.team;
  if (accessData.enabled !== undefined) payload.enabled = Boolean(accessData.enabled);
  if (accessData.pageAccess !== undefined) payload.pageAccess = accessData.pageAccess;

  await updateDoc(userRef, payload);
}

/**
 * Admin operation: Delete user record from 'employees' table
 * @param {string} uid
 */
export async function deleteUser(uid) {
  checkFirebase();
  await deleteDoc(doc(db, TABLES.USERS, uid));
}

// ============================================================================
// 2. TASKS TABLE OPERATIONS ('tasks')
// ============================================================================

/**
 * Create a new priority task
 * @param {object} taskData
 * @param {string} [creatorUid]
 * @returns {Promise<object>} Created task with generated ID
 */
export async function createTask(taskData, creatorUid = null) {
  checkFirebase();
  const taskId = taskData.id ? String(taskData.id) : String(Date.now());
  const taskRef = doc(db, TABLES.TASKS, taskId);

  const newTask = {
    id: isNaN(Number(taskId)) ? taskId : Number(taskId),
    title: taskData.title || '',
    feature: taskData.feature || 'Website Revamp',
    techStack: taskData.techStack || 'React',
    siteId: taskData.siteId || null,
    assignee: taskData.assignee || null,
    assigneeUid: taskData.assigneeUid || null,
    team: taskData.team || null,
    priority: taskData.priority || 'Medium',
    status: taskData.status || 'Assigned',
    cadence: taskData.cadence || 'Weekly',
    due: Number(taskData.due) || 0,
    dueDate: taskData.dueDate || new Date().toISOString().slice(0, 10),
    createdDate: taskData.createdDate || new Date().toISOString().slice(0, 10),
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(taskRef, newTask);
  return newTask;
}

/**
 * Retrieve all tasks from the 'tasks' table
 * @param {object} [filters] - { priority, status, team, siteId, assignee }
 * @returns {Promise<Array<object>>}
 */
export async function getAllTasks(filters = {}) {
  checkFirebase();
  const colRef = collection(db, TABLES.TASKS);
  let q = colRef;

  const conditions = [];
  if (filters.priority && filters.priority !== 'All priorities') {
    conditions.push(where('priority', '==', filters.priority));
  }
  if (filters.status && filters.status !== 'All statuses') {
    conditions.push(where('status', '==', filters.status));
  }
  if (filters.team && filters.team !== 'All teams') {
    conditions.push(where('team', '==', filters.team));
  }
  if (filters.siteId) {
    conditions.push(where('siteId', '==', filters.siteId));
  }
  if (filters.assignee) {
    conditions.push(where('assignee', '==', filters.assignee));
  }

  if (conditions.length > 0) {
    q = query(colRef, ...conditions);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    ...docSnap.data(),
    id: docSnap.data().id || docSnap.id,
  }));
}

/**
 * Retrieve a single task by ID
 * @param {string|number} taskId
 * @returns {Promise<object|null>}
 */
export async function getTaskById(taskId) {
  checkFirebase();
  const taskSnap = await getDoc(doc(db, TABLES.TASKS, String(taskId)));
  if (!taskSnap.exists()) return null;
  return { id: taskSnap.data().id || taskSnap.id, ...taskSnap.data() };
}

/**
 * Update an existing task in the 'tasks' table
 * @param {string|number} taskId
 * @param {object} changes
 */
export async function updateTask(taskId, changes) {
  checkFirebase();
  const taskRef = doc(db, TABLES.TASKS, String(taskId));
  const payload = {
    ...changes,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(taskRef, payload);
}

/**
 * Delete a task from the 'tasks' table
 * @param {string|number} taskId
 */
export async function deleteTask(taskId) {
  checkFirebase();
  await deleteDoc(doc(db, TABLES.TASKS, String(taskId)));
}

/**
 * Subscribe to real-time task updates
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export function subscribeToTasks(callback) {
  if (!firebaseConfigured || !db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, TABLES.TASKS), (snapshot) => {
    const list = snapshot.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.data().id || docSnap.id,
    }));
    callback(list);
  }, (err) => {
    console.error('Error in tasks real-time subscription:', err);
  });
}

// ============================================================================
// 3. WEBSITES / PROJECTS TABLE OPERATIONS ('sites')
// ============================================================================

/**
 * Create or update a project website record
 * @param {string} siteId
 * @param {object} siteData
 */
export async function setProjectSite(siteId, siteData) {
  checkFirebase();
  const siteRef = doc(db, TABLES.SITES, siteId);
  const payload = {
    ...siteData,
    id: siteId,
    updatedAt: serverTimestamp(),
  };
  await setDoc(siteRef, payload, { merge: true });
  return payload;
}

/**
 * Retrieve all project sites
 * @returns {Promise<Array<object>>}
 */
export async function getAllProjectSites() {
  checkFirebase();
  const snapshot = await getDocs(collection(db, TABLES.SITES));
  return snapshot.docs.map(docSnap => ({
    ...docSnap.data(),
    id: docSnap.id,
  }));
}

/**
 * Delete a project website
 * @param {string} siteId
 */
export async function deleteProjectSite(siteId) {
  checkFirebase();
  await deleteDoc(doc(db, TABLES.SITES, siteId));
}

// ============================================================================
// 4. AUDIT LOG TABLE OPERATIONS ('auditLog')
// ============================================================================

/**
 * Append an activity record to the 'auditLog' table
 * @param {object} event - { action, actor, role, detail, taskId }
 */
export async function recordAuditEvent(event) {
  checkFirebase();
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = now.toISOString().slice(0, 10);

  const newEntry = {
    action: event.action || 'System action',
    actor: event.actor || 'System',
    role: event.role || 'System',
    detail: event.detail || '',
    taskId: event.taskId || null,
    timestamp: `${dateFormatted} • ${timeFormatted}`,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TABLES.AUDIT_LOG), newEntry);
  return { id: docRef.id, ...newEntry };
}

/**
 * Retrieve recent audit log entries
 * @param {number} [limitCount=100]
 * @returns {Promise<Array<object>>}
 */
export async function getAuditLogs(limitCount = 100) {
  checkFirebase();
  const colRef = collection(db, TABLES.AUDIT_LOG);
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// ============================================================================
// 5. ACCESS REQUESTS TABLE OPERATIONS ('accessRequests')
// ============================================================================

/**
 * Submit a portal login access request
 * @param {object} requestData - { employeeId, name, email, role, team }
 */
export async function createAccessRequest(requestData) {
  checkFirebase();
  const now = new Date();
  const newRequest = {
    employeeId: requestData.employeeId,
    name: requestData.name,
    email: requestData.email,
    role: requestData.role || 'Employee',
    team: requestData.team || 'Web Dev',
    status: 'pending',
    requestedAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TABLES.ACCESS_REQUESTS), newRequest);
  return { id: docRef.id, ...newRequest };
}

/**
 * Retrieve all access requests (optionally filtered by status)
 * @param {'pending'|'approved'|'declined'|null} [status='pending']
 * @returns {Promise<Array<object>>}
 */
export async function getAccessRequests(status = 'pending') {
  checkFirebase();
  const colRef = collection(db, TABLES.ACCESS_REQUESTS);
  let q = colRef;
  if (status) {
    q = query(colRef, where('status', '==', status));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Admin action: Approve or decline a login access request
 * @param {string} requestId
 * @param {'approved'|'declined'} newStatus
 * @param {string} [reviewedBy]
 */
export async function reviewAccessRequest(requestId, newStatus, reviewedBy = 'Admin') {
  checkFirebase();
  const reqRef = doc(db, TABLES.ACCESS_REQUESTS, requestId);
  await updateDoc(reqRef, {
    status: newStatus,
    reviewedBy,
    reviewedAt: serverTimestamp(),
  });
}

// ============================================================================
// 6. HEALTH CHECK & BATCH INITIALIZATION UTILITY
// ============================================================================

/**
 * Verify connectivity to all Firestore tables
 * @returns {Promise<{ ok: boolean, tables: object, error: string|null }>}
 */
export async function verifyFirestoreTables() {
  if (!firebaseConfigured || !db) {
    return {
      ok: false,
      tables: {},
      error: 'Firebase is not initialized. Please verify your environment variables.',
    };
  }

  const results = {};
  for (const [key, collectionName] of Object.entries(TABLES)) {
    try {
      const snap = await getDocs(query(collection(db, collectionName), limit(1)));
      results[collectionName] = { ok: true, count: snap.size };
    } catch (err) {
      results[collectionName] = { ok: false, error: err.message };
    }
  }

  const allOk = Object.values(results).every(r => r.ok);
  return {
    ok: allOk,
    tables: results,
    error: allOk ? null : 'Some tables could not be accessed. Check firestore.rules permissions.',
  };
}
