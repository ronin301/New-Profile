import {
  collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { staffService } from '../staff/services.js';
import { showToast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency } from '../../utils/formatters.js';
import { icons } from '../../components/icons.js';

export const payrollController = {
  async init(container) {
    const user = authStore.getUser();
    const shopId = user.shopId;
    const staffList = shopId ? await staffService.getByShop(shopId) : await staffService.getByOwner(user.uid);
    const activeStaff = staffList.filter((s) => !s.disabled);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const attQ = query(collection(db, COLLECTIONS.ATTENDANCE), where('shopId', '==', shopId || ''));
    const attSnap = await getDocs(attQ);
    const allAtt = attSnap.docs.map((d) => d.data());

    const payrollData = activeStaff.map((s) => {
      const monthAtt = allAtt.filter((a) => a.staffId === s.id && (a.date || '').startsWith(month));
      const present = monthAtt.filter((a) => a.status === 'present').length;
      const halfDay = monthAtt.filter((a) => a.status === 'halfDay').length;
      const absent = monthAtt.filter((a) => a.status === 'absent').length;
      const salary = Number(s.salary) || 0;
      const dailySalary = salary / daysInMonth;
      const effectiveDays = present + (halfDay * 0.5);
      const deduction = (absent * dailySalary);
      const netSalary = Math.max(0, salary - deduction);
      return { ...s, present, halfDay, absent, salary, dailySalary, deduction, netSalary };
    });

    container.innerHTML = `
      <div class="page-title"><h1>Payroll</h1><p>Month: ${month}</p></div>
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>Staff</th><th>Salary</th><th>Daily</th><th>Present</th><th>Half</th><th>Absent</th><th>Deduction</th><th>Net Salary</th><th>Cut?</th></tr></thead>
            <tbody>
              ${payrollData.map((p) => `
                <tr>
                  <td>${escapeHtml(p.name)}</td>
                  <td>${formatCurrency(p.salary)}</td>
                  <td>${formatCurrency(Math.round(p.dailySalary))}</td>
                  <td>${p.present}</td>
                  <td>${p.halfDay}</td>
                  <td>${p.absent}</td>
                  <td style="color:var(--color-error)">${formatCurrency(Math.round(p.deduction))}</td>
                  <td><strong>${formatCurrency(Math.round(p.netSalary))}</strong></td>
                  <td>
                    <button class="btn btn--sm btn--outline no-cut-btn" data-id="${p.id}" data-salary="${p.salary}">No Cut</button>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted)">No staff</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.no-cut-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        showToast(`No deduction applied — full salary: ${formatCurrency(Number(btn.dataset.salary))}`, 'success');
      });
    });
  }
};
