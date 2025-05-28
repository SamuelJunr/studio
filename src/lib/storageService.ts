
import { LOCAL_STORAGE_APP_SESSIONS_KEY, LOCAL_STORAGE_TEST_RUNS_KEY } from './constants';
import type { AppSession, TestRun, StoredDataPoint } from './types';

// --- Helpers para localStorage ---
function safelyGetFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function safelySetToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

// --- AppSession Management ---
export function getAppSessions(): AppSession[] {
  return safelyGetFromLocalStorage<AppSession[]>(LOCAL_STORAGE_APP_SESSIONS_KEY, []);
}

export function addAppSession(session: AppSession): void {
  const sessions = getAppSessions();
  sessions.push(session);
  safelySetToLocalStorage(LOCAL_STORAGE_APP_SESSIONS_KEY, sessions);
}

export function updateAppSession(sessionId: string, updates: Partial<AppSession>): void {
  let sessions = getAppSessions();
  sessions = sessions.map(s => (s.id === sessionId ? { ...s, ...updates } : s));
  safelySetToLocalStorage(LOCAL_STORAGE_APP_SESSIONS_KEY, sessions);
}

export function getAppSessionById(sessionId: string): AppSession | undefined {
  const sessions = getAppSessions();
  return sessions.find(s => s.id === sessionId);
}


// --- TestRun Management ---
export function getTestRuns(): TestRun[] {
  return safelyGetFromLocalStorage<TestRun[]>(LOCAL_STORAGE_TEST_RUNS_KEY, []);
}

export function addTestRun(testRun: TestRun): void {
  const testRuns = getTestRuns();
  testRuns.push(testRun);
  safelySetToLocalStorage(LOCAL_STORAGE_TEST_RUNS_KEY, testRuns);
}

export function updateTestRun(testRunId: string, updates: Partial<TestRun>): void {
  let testRuns = getTestRuns();
  testRuns = testRuns.map(tr => (tr.id === testRunId ? { ...tr, ...updates } : tr));
  safelySetToLocalStorage(LOCAL_STORAGE_TEST_RUNS_KEY, testRuns);
}

export function getTestRunById(testRunId: string): TestRun | undefined {
  const testRuns = getTestRuns();
  return testRuns.find(tr => tr.id === testRunId);
}

export function addDataPointToTestRun(testRunId: string, dataPoint: StoredDataPoint): void {
  let testRuns = getTestRuns();
  const testRunIndex = testRuns.findIndex(tr => tr.id === testRunId);
  if (testRunIndex > -1) {
    testRuns[testRunIndex].loggedData.push(dataPoint);
    safelySetToLocalStorage(LOCAL_STORAGE_TEST_RUNS_KEY, testRuns);
  } else {
    console.warn(`TestRun with id ${testRunId} not found. Cannot add datapoint.`);
  }
}
