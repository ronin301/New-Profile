import { managerService } from './services.js';
import { shopService } from '../shops/services.js';
import { authStore } from '../auth/store.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { renderFormField } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

function renderManagersList(managers) {
  if (!managers.length) {
    return `<div class="empty-state">${icons.empty}<p>No managers yet</p></div>`;
  }
  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Manager ID</th><th>Shop</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${managers.map((m) => `
            <tr>
              <td>${escapeHtml(m.name)}</td>
              <td><code>${escapeHtml(m.managerId || m.email)}</code></td>
              <td>${escapeHtml(m.shopId || '-')}</td>
              <td><span class="badge badge--${m.disabled ? 'danger' : 'success'}">${m.disabled ? 'Disabled' : 'Active'}</span></td>
              <td>
                <button class="btn btn--sm btn--outline edit-mgr" data-id="${m.id}">Edit</button>
                ${m.disabled
                  ? `<button class="btn btn--sm btn--outline enable-mgr" data-id="${m.id}">Enable</button>`
                  : `<button class="btn btn--sm btn--ghost disable-mgr" data-id="${m.id}">Disable</button>`}
                <button class="btn btn--sm btn--ghost reset-pw-mgr" data-id="${m.id}">Reset PW</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export const managersController = {
  async init(container) {
    const user = authStore.getUser();
    const managers = await managerService.getByOwner(user.uid);
    const shops = await shopService.getByOwner(user.uid);

    container.innerHTML = `
      <div class="page-title">
        <h1>Managers</h1>
        <button class="btn btn--primary" id="add-mgr-btn">${icons.plus} Add Manager</button>
      </div>
      <div class="card" id="managers-list">${renderManagersList(managers)}</div>
      <div id="mgr-modal"></div>
    `;

    document.getElementById('add-mgr-btn').addEventListener('click', () => {
      this.showAddModal(container, user, shops);
    });

    container.addEventListener('click', async (e) => {
      const disableBtn = e.target.closest('.disable-mgr');
      if (disableBtn) {
        if (confirm('Disable this manager?')) {
          try {
            await managerService.disable(disableBtn.dataset.id);
            showToast('Manager disabled', 'success');
            this.init(container);
          } catch (err) { showToast(err.message, 'error'); }
        }
      }
      const enableBtn = e.target.closest('.enable-mgr');
      if (enableBtn) {
        try {
          await managerService.enable(enableBtn.dataset.id);
          showToast('Manager enabled', 'success');
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      }
      const resetBtn = e.target.closest('.reset-pw-mgr');
      if (resetBtn) {
        try {
          await managerService.updateManagerPassword(resetBtn.dataset.id);
          showToast('Password reset email sent', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      }
      const editBtn = e.target.closest('.edit-mgr');
      if (editBtn) {
        const mgr = managers.find((m) => m.id === editBtn.dataset.id);
        if (mgr) this.showEditModal(container, mgr);
      }
    });
  },

  showAddModal(container, user, shops) {
    const modal = document.getElementById('mgr-modal');
    modal.innerHTML = `
      <div class="modal-backdrop is-visible"></div>
      <div class="modal is-visible">
        <div class="modal__header"><h3>Add Manager</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
        <form id="add-mgr-form" class="modal__body">
          ${renderFormField({ name: 'name', label: 'Manager Name', type: 'text', required: true })}
          <div class="form-group">
            <label class="form-label">Shop *</label>
            <select class="form-select" name="shopId" required>
              ${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          ${renderFormField({ name: 'password', label: 'Password', type: 'password', required: true })}
          <button type="submit" class="btn btn--primary btn--block">Create Manager</button>
        </form>
      </div>
    `;
    modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('#add-mgr-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        const shop = shops.find((s) => s.id === data.shopId);
        const result = await managerService.create({
          shopId: data.shopId,
          ownerId: user.uid,
          name: data.name,
          password: data.password,
          shopName: shop?.name || 'Shop'
        });
        showToast(`Manager created! ID: ${result.managerId}`, 'success');
        modal.innerHTML = '';
        this.init(container);
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  showEditModal(container, mgr) {
    const modal = document.getElementById('mgr-modal');
    modal.innerHTML = `
      <div class="modal-backdrop is-visible"></div>
      <div class="modal is-visible">
        <div class="modal__header"><h3>Edit Manager</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
        <form id="edit-mgr-form" class="modal__body">
          ${renderFormField({ name: 'name', label: 'Manager Name', type: 'text', required: true }, mgr.name)}
          <div class="form-group">
            <label class="form-label">Manager ID</label>
            <input class="form-input" value="${escapeHtml(mgr.managerId || mgr.email)}" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Email (internal)</label>
            <input class="form-input" value="${escapeHtml(mgr.email)}" disabled />
          </div>
          <button type="submit" class="btn btn--primary btn--block">Save</button>
        </form>
      </div>
    `;
    modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('#edit-mgr-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        await managerService.update(mgr.id, { name: data.name });
        showToast('Manager updated', 'success');
        modal.innerHTML = '';
        this.init(container);
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  async getForShop(shopId) {
    return managerService.getByShop(shopId);
  }
};
