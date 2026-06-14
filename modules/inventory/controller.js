import {
  collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { shopService } from '../shops/services.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { renderFormField } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency } from '../../utils/formatters.js';
import { icons } from '../../components/icons.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class InventoryService {
  async getByShop(shopId) {
    const q = query(collection(db, COLLECTIONS.INVENTORY), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.INVENTORY), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async add(data) {
    const ref = doc(collection(db, COLLECTIONS.INVENTORY));
    const item = {
      id: ref.id,
      shopId: data.shopId,
      ownerId: data.ownerId,
      productName: data.productName,
      sku: data.sku || '',
      stock: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      purchaseCost: Number(data.purchaseCost) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      supplier: data.supplier || '',
      damaged: Number(data.damaged) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, item);
    eventBus.emit(EVENTS.INVENTORY_UPDATED, item);
    return item;
  }

  async update(id, data) {
    await updateDoc(doc(db, COLLECTIONS.INVENTORY, id), { ...data, updatedAt: serverTimestamp() });
    eventBus.emit(EVENTS.INVENTORY_UPDATED, { id, ...data });
  }
}

const inventoryService = new InventoryService();

export const inventoryController = {
  async init(container) {
    const user = authStore.getUser();
    const isOwner = user.role === 'owner';
    const shops = isOwner ? await shopService.getByOwner(user.uid) : [];
    let items = [];
    if (isOwner) {
      items = await inventoryService.getByOwner(user.uid);
    } else if (user.shopId) {
      items = await inventoryService.getByShop(user.shopId);
    }

    const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold);
    const outOfStock = items.filter((i) => i.stock <= 0);

    container.innerHTML = `
      <div class="page-title">
        <h1>Inventory</h1>
        <button class="btn btn--primary" id="add-inventory-btn">${icons.plus} Add Item</button>
      </div>
      <div class="stats-grid" style="margin-bottom:var(--space-4)">
        <div class="card stat-card"><span class="stat-card__label">Total Items</span><span class="stat-card__value">${items.length}</span></div>
        <div class="card stat-card"><span class="stat-card__label">Low Stock</span><span class="stat-card__value" style="color:var(--color-warning)">${lowStock.length}</span></div>
        <div class="card stat-card"><span class="stat-card__label">Out of Stock</span><span class="stat-card__value" style="color:var(--color-error)">${outOfStock.length}</span></div>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Purchase</th><th>Selling</th><th>Supplier</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${items.length ? items.map((i) => `
                <tr>
                  <td>${escapeHtml(i.productName)}</td>
                  <td>${escapeHtml(i.sku || '-')}</td>
                  <td>${i.stock}</td>
                  <td>${formatCurrency(i.purchaseCost)}</td>
                  <td>${formatCurrency(i.sellingPrice)}</td>
                  <td>${escapeHtml(i.supplier || '-')}</td>
                  <td><span class="badge badge--${i.stock <= 0 ? 'danger' : i.stock <= i.lowStockThreshold ? 'warning' : 'success'}">${i.stock <= 0 ? 'Out' : i.stock <= i.lowStockThreshold ? 'Low' : 'OK'}</span></td>
                  <td><button class="btn btn--sm btn--outline edit-inv-btn" data-id="${i.id}">Edit</button></td>
                </tr>
              `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted)">No inventory items</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div id="inv-modal"></div>
    `;

    document.getElementById('add-inventory-btn').addEventListener('click', () => {
      const modal = document.getElementById('inv-modal');
      modal.innerHTML = `
        <div class="modal-backdrop is-visible"></div>
        <div class="modal is-visible">
          <div class="modal__header"><h3>Add Inventory Item</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
          <form id="add-inv-form" class="modal__body">
            ${isOwner && shops.length ? `<div class="form-group"><label class="form-label">Shop *</label><select class="form-select" name="shopId" required>${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>` : `<input type="hidden" name="shopId" value="${user.shopId || ''}" />`}
            ${renderFormField({ name: 'productName', label: 'Product Name', type: 'text', required: true })}
            ${renderFormField({ name: 'sku', label: 'SKU', type: 'text' })}
            ${renderFormField({ name: 'stock', label: 'Stock Quantity', type: 'number', min: 0, required: true })}
            ${renderFormField({ name: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number', min: 0 })}
            ${renderFormField({ name: 'purchaseCost', label: 'Purchase Cost', type: 'number', min: 0, step: 0.01 })}
            ${renderFormField({ name: 'sellingPrice', label: 'Selling Price', type: 'number', min: 0, step: 0.01 })}
            ${renderFormField({ name: 'supplier', label: 'Supplier', type: 'text' })}
            <button type="submit" class="btn btn--primary btn--block">Add Item</button>
          </form>
        </div>
      `;
      modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('#add-inv-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = getFormData(e.target);
        try {
          await inventoryService.add({ ...data, ownerId: isOwner ? user.uid : user.ownerId });
          showToast('Item added', 'success');
          modal.innerHTML = '';
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    container.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-inv-btn');
      if (!editBtn) return;
      const item = items.find((i) => i.id === editBtn.dataset.id);
      if (!item) return;
      const modal = document.getElementById('inv-modal');
      modal.innerHTML = `
        <div class="modal-backdrop is-visible"></div>
        <div class="modal is-visible">
          <div class="modal__header"><h3>Edit Item</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
          <form id="edit-inv-form" class="modal__body">
            ${renderFormField({ name: 'productName', label: 'Product Name', type: 'text', required: true }, item.productName)}
            ${renderFormField({ name: 'stock', label: 'Stock', type: 'number', min: 0, required: true }, String(item.stock))}
            ${renderFormField({ name: 'purchaseCost', label: 'Purchase Cost', type: 'number', min: 0, step: 0.01 }, String(item.purchaseCost))}
            ${renderFormField({ name: 'sellingPrice', label: 'Selling Price', type: 'number', min: 0, step: 0.01 }, String(item.sellingPrice))}
            ${renderFormField({ name: 'supplier', label: 'Supplier', type: 'text' }, item.supplier || '')}
            ${renderFormField({ name: 'damaged', label: 'Damaged Count', type: 'number', min: 0 }, String(item.damaged || 0))}
            <button type="submit" class="btn btn--primary btn--block">Save</button>
          </form>
        </div>
      `;
      modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
      modal.querySelector('#edit-inv-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const data = getFormData(ev.target);
        try {
          await inventoryService.update(item.id, {
            productName: data.productName,
            stock: Number(data.stock),
            purchaseCost: Number(data.purchaseCost),
            sellingPrice: Number(data.sellingPrice),
            supplier: data.supplier,
            damaged: Number(data.damaged)
          });
          showToast('Item updated', 'success');
          modal.innerHTML = '';
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }
};
