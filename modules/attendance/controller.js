import {
  collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS, ATTENDANCE_STATUS } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { staffService } from '../staff/services.js';
import { showToast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

const todayStr = () => new Date().toISOString().split('T')[0];

export const attendanceController = {
  async init(container) {
    const user = authStore.getUser();
    const isStaff = user.role === 'staff';
    const shopId = user.shopId;

    if (isStaff) {
      return this.initStaffView(container, user);
    }

    const staffList = shopId ? await staffService.getByShop(shopId) : await staffService.getByOwner(user.uid);
    const activeStaff = staffList.filter((s) => !s.disabled);
    const today = todayStr();

    const q = query(collection(db, COLLECTIONS.ATTENDANCE), where('shopId', '==', shopId), where('date', '==', today));
    const snap = await getDocs(q);
    const todayRecords = {};
    snap.docs.forEach((d) => { const data = d.data(); todayRecords[data.staffId] = data; });

    container.innerHTML = `
      <div class="page-title"><h1>Attendance</h1><p>${today}</p></div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Staff</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${activeStaff.map((s) => {
                const record = todayRecords[s.id];
                return `<tr>
                  <td>${escapeHtml(s.name)}</td>
                  <td><span class="badge badge--${record?.status === 'present' ? 'success' : record?.status === 'halfDay' ? 'warning' : record ? 'danger' : 'default'}">${record?.status || 'Not Marked'}</span></td>
                  <td>
                    <button class="btn btn--sm btn--outline mark-att" data-staff="${s.id}" data-status="present" ${record?.status === 'present' ? 'disabled' : ''}>Present</button>
                    <button class="btn btn--sm btn--ghost mark-att" data-staff="${s.id}" data-status="halfDay" ${record?.status === 'halfDay' ? 'disabled' : ''}>Half</button>
                    <button class="btn btn--sm btn--ghost mark-att" data-staff="${s.id}" data-status="absent" ${record?.status === 'absent' ? 'disabled' : ''}>Absent</button>
                  </td>
                </tr>`;
              }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted)">No staff</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.mark-att').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const staffId = btn.dataset.staff;
        const status = btn.dataset.status;
        try {
          const docId = `${shopId}_${staffId}_${today}`;
          await setDoc(doc(db, COLLECTIONS.ATTENDANCE, docId), {
            shopId,
            staffId,
            ownerId: user.role === 'owner' ? user.uid : user.ownerId,
            date: today,
            status,
            markedBy: user.uid,
            createdAt: serverTimestamp()
          }, { merge: true });
          showToast(`Marked ${status}`, 'success');
          this.init(container);
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  },

  async initStaffView(container, user) {
    const today = todayStr();
    const q = query(collection(db, COLLECTIONS.ATTENDANCE), where('staffId', '==', user.staffDocId || ''), where('date', '==', today));
    const snap = await getDocs(q);
    const record = snap.docs[0]?.data();

    container.innerHTML = `
      <div class="page-title"><h1>My Attendance</h1></div>
      <div class="card">
        <p>Date: <strong>${today}</strong></p>
        <p>Status: <span class="badge badge--${record?.status === 'present' ? 'success' : record?.status === 'halfDay' ? 'warning' : record ? 'danger' : 'default'}">${record?.status || 'Not Marked Yet'}</span></p>
      </div>
    `;
  }
};
