/**
 * Client-side route guard and navigation utilities.
 */
import { appState } from './state-manager.js';

const BASE_PATH = getBasePath();

function getBasePath() {
  const path = window.location.pathname;
  const idx = path.indexOf('/pages/');
  if (idx !== -1) return path.substring(0, idx);
  return path.substring(0, path.lastIndexOf('/'));
}

export function resolvePath(relativePath) {
  if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
    return relativePath;
  }
  const clean = relativePath.replace(/^\.\//, '');
  return `${BASE_PATH}/${clean}`;
}

export function navigateTo(path) {
  window.location.href = resolvePath(path);
}

export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function requireRole(allowedRoles) {
  const user = appState.get('user');
  if (!user) {
    navigateTo('pages/auth/login.html');
    return false;
  }
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'owner') {
      navigateTo('pages/admin/dashboard.html');
    } else if (user.role === 'manager') {
      navigateTo('pages/manager/dashboard.html');
    } else if (user.role === 'staff') {
      navigateTo('pages/staff/dashboard.html');
    } else {
      navigateTo('pages/auth/login.html');
    }
    return false;
  }
  return true;
}

export function redirectByRole() {
  const user = appState.get('user');
  if (!user) return;
  if (user.role === 'owner') {
    navigateTo('pages/admin/dashboard.html');
  } else if (user.role === 'manager') {
    navigateTo('pages/manager/dashboard.html');
  } else if (user.role === 'staff') {
    navigateTo('pages/staff/dashboard.html');
  }
}

export { BASE_PATH };
