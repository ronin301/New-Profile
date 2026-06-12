import { billingService } from './services.js';
import { billingStore } from './store.js';
import { renderInvoiceList } from './ui.js';
import { downloadInvoicePDF, printInvoicePDF } from '../../utils/pdf-generator.js';
import { showToast } from '../../components/toast.js';
import { authStore } from '../auth/store.js';
import { shopService } from '../shops/services.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

export const invoicesAdminController = {
  async init(container) {
    const user = authStore.getUser();
    const shops = await shopService.getByOwner(user.uid);

    container.innerHTML = `
      <div class="page-title"><h1>Invoices</h1><p>View all invoices across shops</p></div>
      ${shops.length > 1 ? `
        <div class="card" style="margin-bottom:var(--space-4)">
          <select id="shop-filter" class="form-select">
            <option value="">All Shops</option>
            ${shops.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div id="invoices-list"></div>
    `;

    let allInvoices = [];
    for (const shop of shops) {
      try {
        const invoices = await billingService.getByShop(shop.id);
        allInvoices = allInvoices.concat(invoices);
      } catch (err) {
        console.warn('[Invoices] load failed for shop:', shop.id, err?.message);
      }
    }
    billingStore.set(allInvoices);
    document.getElementById('invoices-list').innerHTML = renderInvoiceList(allInvoices);

    this.bindActions();

    const filter = document.getElementById('shop-filter');
    if (filter) {
      filter.addEventListener('change', () => {
        const filtered = filter.value
          ? allInvoices.filter((i) => i.shopId === filter.value)
          : allInvoices;
        document.getElementById('invoices-list').innerHTML = renderInvoiceList(filtered);
        this.bindActions();
      });
    }
  },

  bindActions() {
    document.querySelectorAll('.download-invoice').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const invoice = billingStore.getById(btn.dataset.id);
        if (!invoice) return showToast('Invoice not found', 'error');
        try {
          await downloadInvoicePDF(invoice, `invoice-${invoice.invoiceNumber}.pdf`);
          showToast('PDF downloaded', 'success');
        } catch (err) {
          showToast(err.message || 'PDF generation failed', 'error');
        }
      });
    });
    document.querySelectorAll('.print-invoice').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const invoice = billingStore.getById(btn.dataset.id);
        if (!invoice) return showToast('Invoice not found', 'error');
        try { await printInvoicePDF(invoice); } catch (err) { showToast(err.message, 'error'); }
      });
    });
  }
};
