import { authService } from './services.js';
import { authStore } from './store.js';
import {
  renderOwnerLoginForm, renderManagerLoginForm, renderStaffLoginForm,
  renderRegisterForm, renderProfileForm, initPasswordToggles
} from './ui.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { isValidEmail, isValidMobile, isValidPassword } from '../../utils/validators.js';
import { redirectByRole, navigateTo } from '../../core/router.js';

export const authController = {
  async initLogin(container, role = 'owner') {
    if (role === 'manager') {
      container.innerHTML = renderManagerLoginForm();
    } else if (role === 'staff') {
      container.innerHTML = renderStaffLoginForm();
    } else {
      container.innerHTML = renderOwnerLoginForm();
    }

    initPasswordToggles();

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const data = getFormData(form);
        let profile;

        if (role === 'manager') {
          profile = await authService.loginManager(data.managerId, data.password);
        } else if (role === 'staff') {
          profile = await authService.loginStaff(data.staffId, data.password);
        } else {
          profile = await authService.loginOwner(data.email, data.password);
        }

        authStore.setUser(profile);
        showToast('Welcome back!', 'success');

        authService.updateOnlineStatus(profile.uid, true);
        redirectByRole();
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });

    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.querySelector('[name="email"]');
        const email = emailInput?.value;
        if (!email || !isValidEmail(email)) {
          showToast('Enter your email first', 'error');
          return;
        }
        try {
          await authService.sendPasswordReset(email);
          showToast('Password reset email sent!', 'success');
        } catch (err) {
          showToast(err.message || 'Failed to send reset email', 'error');
        }
      });
    }
  },

  async initRegister(container) {
    container.innerHTML = renderRegisterForm();
    initPasswordToggles();

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(form);

      if (!isValidEmail(data.email)) return showToast('Invalid email address', 'error');
      if (!isValidMobile(data.mobile)) return showToast('Invalid mobile number', 'error');
      if (!isValidPassword(data.password)) return showToast('Password must be at least 8 characters', 'error');
      if (data.password !== data.confirmPassword) return showToast('Passwords do not match', 'error');

      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const profile = await authService.registerOwner({
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          password: data.password
        });
        authStore.setUser(profile);
        showToast('Account created successfully!', 'success');
        redirectByRole();
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  },

  async initProfile(container) {
    const user = await authService.waitForSession();
    if (!user) return;
    container.innerHTML = renderProfileForm(user);
    initPasswordToggles();

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        const updated = await authService.updateUserProfile(user.uid, {
          name: data.name,
          mobile: data.mobile
        });
        authStore.setUser(updated);
        showToast('Profile updated', 'success');
      } catch (err) {
        showToast(err.message || 'Update failed', 'error');
      }
    });

    const pwForm = document.getElementById('change-password-form');
    if (pwForm) {
      pwForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = getFormData(e.target);
        if (!data.newPassword || data.newPassword.length < 8) {
          return showToast('New password must be at least 8 characters', 'error');
        }
        try {
          await authService.changePassword(data.currentPassword, data.newPassword);
          showToast('Password changed successfully', 'success');
          pwForm.reset();
        } catch (err) {
          showToast(err.message || 'Password change failed', 'error');
        }
      });
    }
  },

  async handleLogout() {
    const user = authStore.getUser();
    if (user?.uid) {
      authService.updateOnlineStatus(user.uid, false);
    }
    await authService.logout();
    authStore.clear();
    navigateTo('pages/auth/login.html');
  }
};
