import {
  collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS, EXPENSE_CATEGORIES } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { shopService } from '../shops/services.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { renderFormField } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { icons } from '../../components/icons.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class ExpenseService {
  async getByShop(shopId) {
    const q = query(collection(db, COLLECTIONS.EXPENSES), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.EXPENSES), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async add(data) {
    const ref = doc(collection(db, COLLECTIONS.EXPENSES));
    const expense = {
      id: ref.id,
      shopId: data.shopId,
      ownerId: data.ownerId,
      category: data.category,
      description: data.description || '',
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      createdBy: data.createdBy,
      createdAt: serverTimestamp()
    };
    await setDoc(ref, expense);
    eventBus.emit(EVENTS.EXPENSE_CREATED, expense);
    return expense;
  }
}

const expenseService = new ExpenseService();

export const expensesController = {
  async init(container) {
    const user = authStore.getUser();
    const isOwner = user.role === 'owner';
    const shops = isOwner ? await shopService.getByOwner(user.uid) : [];
    let expenses = [];
    if (isOwner) {
      expenses = await expenseService.getByOwner(user.uid);
    } else if (user.shopId) {
      expenses = await expenseService.getByShop(user.shopId);
    }

    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
    });

    container.innerHTML = `
      <div class="page-title">
        <h1>Expenses</h1>
        <button class="btn btn--primary" id="add-expense-btn">${icons.plus} Add Expense</button>
      </div>
      <div class="stats-grid" style="margin-bottom:var(--space-4)">
        <div class="card stat-card"><span class="stat-card__label">Total Expenses</span><span class="stat-card__value">${formatCurrency(totalExpenses)}</span></div>
        <div class="card stat-card"><span class="stat-card__label">This Month</span><span class="stat-card__value">${formatCurrency(expenses.filter((e) => { const d = e.date || ''; return d.startsWith(new Date().toISOString().substring(0, 7)); }).reduce((s, e) => s + (Number(e.amount) || 0), 0))}</span></div>
      </div>
      <div class="content-grid content-grid--2" style="margin-bottom:var(--space-4)">
        <div class="card">
          <div class="card__header"><h3 class="card__title">By Category</h3></div>
          ${Object.entries(byCategory).map(([cat, amt]) => `<div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border)"><span>${escapeHtml(cat)}</span><strong>${formatCurrency(amt)}</strong></div>`).join('') || '<p style="color:var(--color-text-muted)">No expenses</p>'}
        </div>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${expenses.length ? expenses.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((e) => `
                <tr>
                  <td>${escapeHtml(e.date || '-')}</td>
                  <td>${escapeHtml(e.category)}</td>
                  <td>${escapeHtml(e.description || '-')}</td>
                  <td>${formatCurrency(e.amount)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted)">No expenses</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div id="expense-modal"></div>
    `;

    document.getElementById('add-expense-btn').addEventListener('click', () => {
      const modal = document.getElementById('expense-modal');
      modal.innerHTML = `
        <div class="modal-backdrop is-visible"></div>
        <div class="modal is-visible">
          <div class="modal__header"><h3>Add Expense</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
          <form id="add-expense-form" class="modal__body">
            ${isOwner && shops.length ? `<div class="form-group"><label class="form-label">Shop *</label><select class="form-select" name="shopId" required>${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>` : `<input type="hidden" name="shopId" value="${user.shopId || ''}" />`}
            ${renderFormField({ name: 'category', label: 'Category', type: 'select', required: true, options: EXPENSE_CATEGORIES })}
            ${renderFormField({ name: 'description', label: 'Description', type: 'text' })}
            ${renderFormField({ name: 'amount', label: 'Amount', type: 'number', required: true, min: 0, step: 0.01 })}
            ${renderFormField({ name: 'date', label: 'Date', type: 'date', required: true })}
            <button type="submit" class="btn btn--primary btn--block">Add Expense</button>
          </form>
        </div>
      `;
      const dateField = modal.querySelector('[name="date"]');
      if (dateField && !dateField.value) dateField.value = new Date().toISOString().split('T')[0];
      modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('#add-expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = getFormData(e.target);
        try {
          await expenseService.add({ ...data, ownerId: isOwner ? user.uid : user.ownerId, createdBy: user.uid });
          showToast('Expense added', 'success');
          modal.innerHTML = '';
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }
};
