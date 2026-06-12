import { renderFormField } from '../../components/form.js';
import { icons } from '../../components/icons.js';

function passwordFieldHtml(name, label) {
  return `
    <div class="form-group">
      <label class="form-label" for="field-${name}">${label} *</label>
      <div style="position:relative">
        <input class="form-input" type="password" id="field-${name}" name="${name}" required />
        <button type="button" class="password-toggle" data-target="field-${name}" aria-label="Toggle password"
          style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;color:var(--color-text-muted)">
          ${icons.eye || '👁'}
        </button>
      </div>
    </div>
  `;
}

export function renderOwnerLoginForm() {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>Owner Login</h1>
    <p class="subtitle">Sign in as Business Owner</p>
    <form id="login-form" novalidate>
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true })}
      ${passwordFieldHtml('password', 'Password')}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="login-btn">Sign In</button>
    </form>
    <p style="text-align:center; margin-top: var(--space-3); font-size: 0.875rem"><a href="#" id="forgot-password-link">Forgot Password?</a></p>
    <p style="text-align:center; margin-top: var(--space-2); font-size: 0.875rem">Don't have an account? <a href="register.html">Sign Up</a></p>
    <div style="display:flex; gap:var(--space-3); justify-content:center; margin-top:var(--space-4)">
      <a href="login.html?role=manager" class="btn btn--ghost btn--sm">Manager Login</a>
      <a href="login.html?role=staff" class="btn btn--ghost btn--sm">Staff Login</a>
    </div>
  `;
}

export function renderManagerLoginForm() {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>Manager Login</h1>
    <p class="subtitle">Sign in with your Manager ID</p>
    <form id="login-form" novalidate>
      ${renderFormField({ name: 'managerId', label: 'Manager ID', type: 'text', required: true, placeholder: 'e.g. Rahul_MobileShop_65783' })}
      ${passwordFieldHtml('password', 'Password')}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="login-btn">Sign In</button>
    </form>
    <div style="display:flex; gap:var(--space-3); justify-content:center; margin-top:var(--space-4)">
      <a href="login.html" class="btn btn--ghost btn--sm">Owner Login</a>
      <a href="login.html?role=staff" class="btn btn--ghost btn--sm">Staff Login</a>
    </div>
  `;
}

export function renderStaffLoginForm() {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>Staff Login</h1>
    <p class="subtitle">Sign in with your Staff ID</p>
    <form id="login-form" novalidate>
      ${renderFormField({ name: 'staffId', label: 'Staff ID', type: 'text', required: true, placeholder: 'e.g. Ramesh_MobileShop_001' })}
      ${passwordFieldHtml('password', 'Password')}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="login-btn">Sign In</button>
    </form>
    <div style="display:flex; gap:var(--space-3); justify-content:center; margin-top:var(--space-4)">
      <a href="login.html" class="btn btn--ghost btn--sm">Owner Login</a>
      <a href="login.html?role=manager" class="btn btn--ghost btn--sm">Manager Login</a>
    </div>
  `;
}

export function renderLoginForm(isManager = false) {
  if (isManager) return renderManagerLoginForm();
  return renderOwnerLoginForm();
}

export function renderRegisterForm() {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>Create Account</h1>
    <p class="subtitle">Register as business owner</p>
    <form id="register-form" novalidate>
      ${renderFormField({ name: 'name', label: 'Full Name', type: 'text', required: true })}
      ${renderFormField({ name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '10-digit mobile' })}
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true })}
      ${passwordFieldHtml('password', 'Password')}
      ${passwordFieldHtml('confirmPassword', 'Confirm Password')}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="register-btn">Create Account</button>
    </form>
    <p style="text-align:center; margin-top: var(--space-4); font-size: 0.875rem">Already have an account? <a href="login.html">Sign In</a></p>
  `;
}

export function renderProfileForm(user) {
  return `
    <form id="profile-form" class="form-grid form-grid--2">
      ${renderFormField({ name: 'name', label: 'Full Name', type: 'text', required: true }, user?.name || '')}
      ${renderFormField({ name: 'mobile', label: 'Mobile', type: 'tel', required: true }, user?.mobile || '')}
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true }, user?.email || '')}
      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit" class="btn btn--primary">Save Profile</button>
      </div>
    </form>
    <div class="card" style="margin-top:var(--space-6)">
      <h3 class="card__title">Change Password</h3>
      <form id="change-password-form" class="form-grid form-grid--2" style="margin-top:var(--space-4)">
        ${passwordFieldHtml('currentPassword', 'Current Password')}
        ${passwordFieldHtml('newPassword', 'New Password')}
        <div class="form-group" style="grid-column: 1 / -1">
          <button type="submit" class="btn btn--outline">Change Password</button>
        </div>
      </form>
    </div>
  `;
}

export function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isPassword = target.type === 'password';
      target.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword ? (icons.eyeOff || '🙈') : (icons.eye || '👁');
    });
  });
}
