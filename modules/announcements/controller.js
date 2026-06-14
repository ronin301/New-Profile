import {
  collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS, ANNOUNCEMENT_TYPES } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { shopService } from '../shops/services.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { renderFormField } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

function toMillis(v) {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  return new Date(v).getTime() || 0;
}

export const announcementsController = {
  async init(container) {
    const user = authStore.getUser();
    const isOwner = user.role === 'owner';
    const isManager = user.role === 'manager';
    const shops = isOwner ? await shopService.getByOwner(user.uid) : [];

    let announcements = [];
    if (isOwner) {
      const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      const q = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), where('shopIds', 'array-contains', user.shopId));
      const snap = await getDocs(q);
      announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    announcements.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    const canCreate = isOwner || isManager;

    container.innerHTML = `
      <div class="page-title">
        <h1>Announcements</h1>
        ${canCreate ? `<button class="btn btn--primary" id="add-announcement-btn">${icons.plus} New Announcement</button>` : ''}
      </div>
      <div id="announcements-list">
        ${announcements.length ? announcements.map((a) => `
          <div class="card" style="margin-bottom:var(--space-3)">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2)">
              <span class="badge badge--${a.type === 'emergency' ? 'danger' : a.type === 'important' ? 'warning' : 'success'}">${escapeHtml(a.type || 'normal')}</span>
              <strong>${escapeHtml(a.title)}</strong>
            </div>
            <p style="color:var(--color-text-muted);margin-bottom:var(--space-2)">${escapeHtml(a.message)}</p>
            <div style="font-size:0.75rem;color:var(--color-text-muted)">${a.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}</div>
          </div>
        `).join('') : '<div class="empty-state"><p>No announcements</p></div>'}
      </div>
      <div id="ann-modal"></div>
    `;

    if (canCreate) {
      document.getElementById('add-announcement-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('ann-modal');
        modal.innerHTML = `
          <div class="modal-backdrop is-visible"></div>
          <div class="modal is-visible">
            <div class="modal__header"><h3>New Announcement</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
            <form id="add-ann-form" class="modal__body">
              ${renderFormField({ name: 'title', label: 'Title', type: 'text', required: true })}
              ${renderFormField({ name: 'message', label: 'Message', type: 'textarea', required: true, rows: 4 })}
              ${renderFormField({ name: 'type', label: 'Type', type: 'select', required: true, options: ANNOUNCEMENT_TYPES })}
              ${isOwner && shops.length ? `
                <div class="form-group">
                  <label class="form-label">Select Shops</label>
                  ${shops.map((s) => `<label style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)"><input type="checkbox" name="shopIds" value="${s.id}" checked /> ${escapeHtml(s.name)}</label>`).join('')}
                </div>
              ` : ''}
              <button type="submit" class="btn btn--primary btn--block">Send Announcement</button>
            </form>
          </div>
        `;
        modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
        modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
        modal.querySelector('#add-ann-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = getFormData(e.target);
          const selectedShops = Array.from(modal.querySelectorAll('[name="shopIds"]:checked')).map((cb) => cb.value);
          try {
            const ref = doc(collection(db, COLLECTIONS.ANNOUNCEMENTS));
            await setDoc(ref, {
              id: ref.id,
              ownerId: isOwner ? user.uid : user.ownerId,
              shopIds: isOwner ? selectedShops : [user.shopId],
              title: data.title,
              message: data.message,
              type: data.type || 'normal',
              createdBy: user.uid,
              readBy: [],
              createdAt: serverTimestamp()
            });
            showToast('Announcement sent', 'success');
            modal.innerHTML = '';
            this.init(container);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    }
  }
};
