import {
  collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS, LEAVE_TYPES } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { showToast } from '../../components/toast.js';
import { getFormData } from '../../components/form.js';
import { renderFormField } from '../../components/form.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

function toMillis(v) {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  return new Date(v).getTime() || 0;
}

export const leaveController = {
  async init(container) {
    const user = authStore.getUser();
    const isStaff = user.role === 'staff';

    let requests = [];
    if (isStaff) {
      const q = query(collection(db, COLLECTIONS.LEAVE_REQUESTS), where('staffUid', '==', user.uid));
      const snap = await getDocs(q);
      requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      const q = query(collection(db, COLLECTIONS.LEAVE_REQUESTS), where('shopId', '==', user.shopId || ''));
      const snap = await getDocs(q);
      requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    requests.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    container.innerHTML = `
      <div class="page-title">
        <h1>Leave Requests</h1>
        ${isStaff ? `<button class="btn btn--primary" id="request-leave-btn">${icons.plus} Request Leave</button>` : ''}
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr>${!isStaff ? '<th>Staff</th>' : ''}<th>Type</th><th>Date</th><th>Reason</th><th>Status</th>${!isStaff ? '<th>Actions</th>' : ''}</tr></thead>
            <tbody>
              ${requests.map((r) => `
                <tr>
                  ${!isStaff ? `<td>${escapeHtml(r.staffName || '-')}</td>` : ''}
                  <td>${escapeHtml(r.leaveType)}</td>
                  <td>${escapeHtml(r.date)}</td>
                  <td>${escapeHtml(r.reason || '-')}</td>
                  <td><span class="badge badge--${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}">${escapeHtml(r.status)}</span></td>
                  ${!isStaff ? `<td>
                    ${r.status === 'pending' ? `
                      <button class="btn btn--sm btn--outline approve-leave" data-id="${r.id}">Approve</button>
                      <button class="btn btn--sm btn--ghost reject-leave" data-id="${r.id}">Reject</button>
                    ` : '-'}
                  </td>` : ''}
                </tr>
              `).join('') || `<tr><td colspan="${isStaff ? 4 : 6}" style="text-align:center;color:var(--color-text-muted)">No leave requests</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div id="leave-modal"></div>
    `;

    if (isStaff) {
      document.getElementById('request-leave-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('leave-modal');
        modal.innerHTML = `
          <div class="modal-backdrop is-visible"></div>
          <div class="modal is-visible">
            <div class="modal__header"><h3>Request Leave</h3><button class="btn btn--ghost close-modal">${icons.close}</button></div>
            <form id="leave-form" class="modal__body">
              ${renderFormField({ name: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: LEAVE_TYPES })}
              ${renderFormField({ name: 'date', label: 'Date', type: 'date', required: true })}
              ${renderFormField({ name: 'reason', label: 'Reason', type: 'textarea', rows: 3 })}
              <button type="submit" class="btn btn--primary btn--block">Submit Request</button>
            </form>
          </div>
        `;
        modal.querySelector('.close-modal').addEventListener('click', () => { modal.innerHTML = ''; });
        modal.querySelector('.modal-backdrop').addEventListener('click', () => { modal.innerHTML = ''; });
        modal.querySelector('#leave-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = getFormData(e.target);
          try {
            const ref = doc(collection(db, COLLECTIONS.LEAVE_REQUESTS));
            await setDoc(ref, {
              id: ref.id,
              staffUid: user.uid,
              staffName: user.name,
              shopId: user.shopId,
              ownerId: user.ownerId,
              leaveType: data.leaveType,
              date: data.date,
              reason: data.reason || '',
              status: 'pending',
              createdAt: serverTimestamp()
            });
            showToast('Leave request submitted', 'success');
            modal.innerHTML = '';
            this.init(container);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });
    }

    container.querySelectorAll('.approve-leave').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await updateDoc(doc(db, COLLECTIONS.LEAVE_REQUESTS, btn.dataset.id), { status: 'approved', updatedAt: serverTimestamp() });
          showToast('Leave approved', 'success');
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    container.querySelectorAll('.reject-leave').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await updateDoc(doc(db, COLLECTIONS.LEAVE_REQUESTS, btn.dataset.id), { status: 'rejected', updatedAt: serverTimestamp() });
          showToast('Leave rejected', 'success');
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }
};
