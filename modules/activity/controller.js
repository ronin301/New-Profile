import {
  collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

function toMillis(v) {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  return new Date(v).getTime() || 0;
}

export async function logActivity(data) {
  try {
    const ref = doc(collection(db, COLLECTIONS.ACTIVITY_LOG));
    await setDoc(ref, {
      id: ref.id,
      ownerId: data.ownerId,
      shopId: data.shopId || null,
      action: data.action,
      details: data.details || '',
      performedBy: data.performedBy,
      performerRole: data.performerRole || 'unknown',
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('[ActivityLog] write failed:', err?.message);
  }
}

export const activityController = {
  async init(container) {
    const user = authStore.getUser();
    let logs = [];
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOG),
        where('ownerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      logs = logs.slice(0, 200);
    } catch (err) {
      console.error('[ActivityLog] load failed:', err);
    }

    container.innerHTML = `
      <div class="page-title"><h1>Activity Log</h1></div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Time</th><th>Action</th><th>Details</th><th>By</th><th>Role</th></tr></thead>
            <tbody>
              ${logs.length ? logs.map((l) => `
                <tr>
                  <td>${l.createdAt?.toDate?.()?.toLocaleString?.() || '-'}</td>
                  <td>${escapeHtml(l.action)}</td>
                  <td>${escapeHtml(l.details || '-')}</td>
                  <td>${escapeHtml(l.performedBy || '-')}</td>
                  <td><span class="badge">${escapeHtml(l.performerRole)}</span></td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted)">No activity recorded</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

// Auto-log events
[EVENTS.SALE_CREATED, EVENTS.INVOICE_CREATED, EVENTS.SHOP_CREATED, EVENTS.SHOP_UPDATED,
 EVENTS.CUSTOMER_CREATED, EVENTS.MANAGER_CREATED, EVENTS.STAFF_CREATED,
 EVENTS.ATTENDANCE_MARKED, EVENTS.EXPENSE_CREATED].forEach((evt) => {
  eventBus.on(evt, (payload) => {
    if (payload?.ownerId) {
      logActivity({
        ownerId: payload.ownerId,
        shopId: payload.shopId,
        action: evt,
        details: payload.name || payload.id || '',
        performedBy: payload.createdBy || payload.ownerId || '',
        performerRole: 'system'
      });
    }
  });
});
