import { staffService } from './services.js';
import { shopService } from '../shops/services.js';
import { authStore } from '../auth/store.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency } from '../../utils/formatters.js';
import { renderFormField } from '../../components/form.js';
import { icons } from '../../components/icons.js';

function renderStaffList(staffList) {
  if (!staffList.length) {
    return `<div class="empty-state">${icons.empty}<p>No staff members yet</p></div>`;
  }
  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead><tr>
          <th>Name</th><th>Staff ID</th><th>Salary</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${staffList.map((s) => `
            <tr>
              <td>${escapeHtml(s.name)}</td>
              <td><code>${escapeHtml(s.staffId)}</code></td>
              <td>${formatCurrency(s.salary || 0)}</td>
              <td><span class="badge badge--${s.disabled ? 'danger' : 'success'}">${s.disabled ? 'Disabled' : 'Active'}</span></td>
              <td>
                <button class="btn btn--sm btn--outline edit-staff-btn" data-id="${s.id}">Edit</button>
                <button class="btn btn--sm btn--ghost remove-staff-btn" data-id="${s.id}">${s.disabled ? 'Removed' : 'Remove'}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export const staffController = {
  async init(container) {
    const user = authStore.getUser();
    const isOwner = user.role === 'owner';
    const shops = isOwner ? await shopService.getByOwner(user.uid) : [];
    const shopId = isOwner ? null : user.shopId;

    let allStaff = [];
    if (isOwner) {
      allStaff = await staffService.getByOwner(user.uid);
    } else if (shopId) {
      allStaff = await staffService.getByShop(shopId);
    }

    container.innerHTML = `
      <div class="page-title">
        <h1>Staff Management</h1>
        <button class="btn btn--primary" id="add-staff-btn">${icons.plus} Add Staff</button>
      </div>
      ${isOwner && shops.length > 1 ? `
        <div class="card" style="margin-bottom:var(--space-4)">
          <select id="shop-filter" class="form-select">
            <option value="">All Shops</option>
            ${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div class="card" id="staff-list">${renderStaffList(allStaff)}</div>
      <div id="staff-modal"></div>
    `;

    document.getElementById('add-staff-btn').addEventListener('click', () => {
      this.showAddModal(container, user, shops, shopId);
    });

    container.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-staff-btn');
      if (editBtn) {
        const staff = allStaff.find((s) => s.id === editBtn.dataset.id);
        if (staff) this.showEditModal(container, staff);
      }
      const removeBtn = e.target.closest('.remove-staff-btn');
      if (removeBtn && !removeBtn.dataset.id) return;
      if (removeBtn) {
        if (confirm('Remove this staff member?')) {
          try {
            await staffService.remove(removeBtn.dataset.id);
            showToast('Staff removed', 'success');
            this.init(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    });

    const shopFilter = document.getElementById('shop-filter');
    if (shopFilter) {
      shopFilter.addEventListener('change', async () => {
        const filtered = shopFilter.value
          ? allStaff.filter((s) => s.shopId === shopFilter.value)
          : allStaff;
        document.getElementById('staff-list').innerHTML = renderStaffList(filtered);
      });
    }
  },

  showAddModal(container, user, shops, defaultShopId) {
    const isOwner = user.role === 'owner';
    const modal = document.getElementById('staff-modal');
    modal.innerHTML = `
      <div class="modal-backdrop is-visible" id="modal-backdrop"></div>
      <div class="modal is-visible">
        <div class="modal__header"><h3>Add Staff</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
        <form id="add-staff-form" class="modal__body">
          ${renderFormField({ name: 'name', label: 'Staff Name', type: 'text', required: true })}
          ${isOwner && shops.length ? `
            <div class="form-group">
              <label class="form-label">Shop *</label>
              <select class="form-select" name="shopId" required>
                ${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
              </select>
            </div>
          ` : `<input type="hidden" name="shopId" value="${defaultShopId || ''}" />`}
          ${renderFormField({ name: 'password', label: 'Password', type: 'password', required: true })}
          ${renderFormField({ name: 'salary', label: 'Monthly Salary', type: 'number', required: false, min: 0 })}
          <button type="submit" class="btn btn--primary btn--block">Create Staff</button>
        </form>
      </div>
    `;

    modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('#modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });

    modal.querySelector('#add-staff-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        const shop = shops.find((s) => s.id === data.shopId) || { name: 'Shop' };
        const result = await staffService.create({
          shopId: data.shopId,
          ownerId: user.role === 'owner' ? user.uid : user.ownerId,
          managerId: user.role === 'manager' ? user.uid : null,
          name: data.name,
          password: data.password,
          shopName: shop.name
        });
        if (data.salary) {
          await staffService.setSalary(result.id, data.salary);
        }
        showToast(`Staff created! ID: ${result.staffId}`, 'success');
        modal.innerHTML = '';
        this.init(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  showEditModal(container, staff) {
    const modal = document.getElementById('staff-modal');
    modal.innerHTML = `
      <div class="modal-backdrop is-visible" id="modal-backdrop"></div>
      <div class="modal is-visible">
        <div class="modal__header"><h3>Edit Staff</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
        <form id="edit-staff-form" class="modal__body">
          ${renderFormField({ name: 'name', label: 'Staff Name', type: 'text', required: true }, staff.name)}
          ${renderFormField({ name: 'salary', label: 'Monthly Salary', type: 'number', required: false, min: 0 }, String(staff.salary || 0))}
          <div class="form-group">
            <label class="form-label">Staff ID</label>
            <input class="form-input" type="text" value="${escapeHtml(staff.staffId)}" disabled />
          </div>
          <button type="submit" class="btn btn--primary btn--block">Save Changes</button>
        </form>
      </div>
    `;

    modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
    modal.querySelector('#modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });

    modal.querySelector('#edit-staff-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        await staffService.update(staff.id, {
          name: data.name,
          salary: Number(data.salary) || 0
        });
        showToast('Staff updated', 'success');
        modal.innerHTML = '';
        this.init(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};
