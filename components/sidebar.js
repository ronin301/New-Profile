import { icons } from './icons.js';
import { resolvePath } from '../core/router.js';
import { appState } from '../core/state-manager.js';
import { escapeHtml } from '../utils/helpers.js';

const ADMIN_NAV = [
  { href: 'pages/admin/dashboard.html', label: 'Dashboard', icon: 'dashboard' },
  { href: 'pages/admin/shops.html', label: 'Shops', icon: 'shop' },
  { href: 'pages/admin/managers.html', label: 'Managers', icon: 'customers' },
  { href: 'pages/admin/staff.html', label: 'Staff', icon: 'customers' },
  { href: 'pages/admin/inventory.html', label: 'Inventory', icon: 'sales' },
  { href: 'pages/admin/expenses.html', label: 'Expenses', icon: 'udhari' },
  { href: 'pages/admin/analytics.html', label: 'Analytics', icon: 'analytics' },
  { href: 'pages/admin/invoices.html', label: 'Invoices', icon: 'invoice' },
  { href: 'pages/admin/chat.html', label: 'Chat', icon: 'menu' },
  { href: 'pages/admin/announcements.html', label: 'Announcements', icon: 'menu' },
  { href: 'pages/admin/activity-log.html', label: 'Activity Log', icon: 'analytics' },
  { href: 'pages/admin/backup.html', label: 'Backup', icon: 'backup' },
  { href: 'pages/admin/settings.html', label: 'Settings', icon: 'settings' }
];

const MANAGER_NAV = [
  { href: 'pages/manager/dashboard.html', label: 'Dashboard', icon: 'dashboard' },
  { href: 'pages/manager/sales.html', label: 'Sales', icon: 'sales' },
  { href: 'pages/manager/customers.html', label: 'Customers', icon: 'customers' },
  { href: 'pages/manager/staff.html', label: 'Staff', icon: 'customers' },
  { href: 'pages/manager/inventory.html', label: 'Inventory', icon: 'sales' },
  { href: 'pages/manager/expenses.html', label: 'Expenses', icon: 'udhari' },
  { href: 'pages/manager/invoices.html', label: 'Invoices', icon: 'invoice' },
  { href: 'pages/manager/udhari.html', label: 'Udhari', icon: 'udhari' },
  { href: 'pages/manager/attendance.html', label: 'Attendance', icon: 'analytics' },
  { href: 'pages/manager/payroll.html', label: 'Payroll', icon: 'udhari' },
  { href: 'pages/manager/chat.html', label: 'Chat', icon: 'menu' },
  { href: 'pages/manager/announcements.html', label: 'Announcements', icon: 'menu' }
];

const STAFF_NAV = [
  { href: 'pages/staff/dashboard.html', label: 'Dashboard', icon: 'dashboard' },
  { href: 'pages/staff/messages.html', label: 'Messages', icon: 'menu' },
  { href: 'pages/staff/attendance.html', label: 'Attendance', icon: 'analytics' },
  { href: 'pages/staff/salary.html', label: 'Salary', icon: 'udhari' },
  { href: 'pages/staff/leave.html', label: 'Leave', icon: 'settings' },
  { href: 'pages/staff/announcements.html', label: 'Announcements', icon: 'menu' }
];

export function renderSidebar(role = 'owner') {
  let navItems;
  if (role === 'staff') {
    navItems = STAFF_NAV;
  } else if (role === 'manager') {
    navItems = MANAGER_NAV;
  } else {
    navItems = ADMIN_NAV;
  }
  const currentPath = window.location.pathname.split('/').pop();

  const links = navItems.map((item) => {
    const file = item.href.split('/').pop();
    const active = currentPath === file ? 'is-active' : '';
    return `<a href="${resolvePath(item.href)}" class="${active}">${icons[item.icon]} ${escapeHtml(item.label)}</a>`;
  }).join('');

  const user = appState.get('user');
  const shop = appState.get('shop');

  return `
    <aside class="app-sidebar" id="app-sidebar">
      <div class="sidebar-brand">
        <span style="color: var(--color-primary)">${icons.logo}</span>
        <div>
          <strong style="font-size: 0.875rem">KING BUSINESS</strong>
          <div style="font-size: 0.75rem; color: var(--color-text-muted)">ANALYTICS</div>
        </div>
      </div>
      ${shop ? `<div style="margin-top: var(--space-4); padding: var(--space-3); background: var(--color-bg-muted); border-radius: var(--radius-md); font-size: 0.8125rem;"><strong>${escapeHtml(shop.name)}</strong><br><span style="color: var(--color-text-muted)">${escapeHtml(shop.shopCode || '')}</span></div>` : ''}
      <nav class="sidebar-nav">${links}</nav>
      <div style="margin-top: auto; padding-top: var(--space-6)">
        ${user ? `<div style="font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: var(--space-3)">${escapeHtml(user.name)} <span style="font-size:0.75rem; background:var(--color-primary); color:white; padding:2px 6px; border-radius:var(--radius-sm); margin-left:4px">${escapeHtml(user.role)}</span></div>` : ''}
        <button type="button" class="btn btn--ghost btn--block" id="logout-btn" style="justify-content: flex-start">${icons.logout} Logout</button>
      </div>
    </aside>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  `;
}

export function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  const open = () => {
    sidebar?.classList.add('is-open');
    backdrop?.classList.add('is-visible');
  };
  const close = () => {
    sidebar?.classList.remove('is-open');
    backdrop?.classList.remove('is-visible');
  };

  toggle?.addEventListener('click', open);
  backdrop?.addEventListener('click', close);
}
