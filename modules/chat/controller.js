import {
  collection, doc, setDoc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { authStore } from '../auth/store.js';
import { shopService } from '../shops/services.js';
import { managerService } from '../managers/services.js';
import { staffService } from '../staff/services.js';
import { showToast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export const chatController = {
  _unsubscribe: null,

  async init(container) {
    const user = authStore.getUser();
    const isOwner = user.role === 'owner';
    const isManager = user.role === 'manager';
    const isStaff = user.role === 'staff';

    let contacts = [];
    if (isOwner) {
      const managers = await managerService.getByOwner(user.uid);
      contacts = managers.map((m) => ({ uid: m.authUid, name: m.name, type: 'manager', shopId: m.shopId }));
    } else if (isManager) {
      const staff = await staffService.getByShop(user.shopId);
      contacts = staff.filter((s) => !s.disabled).map((s) => ({ uid: s.authUid, name: s.name, type: 'staff' }));
      contacts.unshift({ uid: user.ownerId, name: 'Owner', type: 'owner' });
    } else if (isStaff) {
      contacts = [{ uid: user.managerId || user.ownerId, name: 'Manager', type: 'manager' }];
    }

    container.innerHTML = `
      <div class="page-title"><h1>Chat</h1></div>
      <div class="content-grid content-grid--sidebar" style="gap:var(--space-4)">
        <div class="card" id="chat-contacts" style="min-height:400px">
          <div class="card__header"><h3 class="card__title">Contacts</h3></div>
          ${contacts.length ? contacts.map((c) => `
            <div class="chat-contact" data-uid="${c.uid || ''}" style="padding:var(--space-3);cursor:pointer;border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:var(--space-2)">
              ${icons.customers}
              <div><strong>${escapeHtml(c.name)}</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted)">${escapeHtml(c.type)}</span></div>
            </div>
          `).join('') : '<p style="padding:var(--space-4);color:var(--color-text-muted)">No contacts available</p>'}
        </div>
        <div class="card" id="chat-messages" style="min-height:400px;display:flex;flex-direction:column">
          <div class="card__header"><h3 class="card__title" id="chat-title">Select a contact</h3></div>
          <div id="messages-list" style="flex:1;overflow-y:auto;padding:var(--space-3);max-height:400px"></div>
          <form id="chat-form" style="display:none;padding:var(--space-3);border-top:1px solid var(--color-border);display:flex;gap:var(--space-2)">
            <input type="text" class="form-input" name="message" placeholder="Type a message..." style="flex:1" autocomplete="off" />
            <button type="submit" class="btn btn--primary">${icons.send}</button>
          </form>
        </div>
      </div>
    `;

    container.querySelectorAll('.chat-contact').forEach((el) => {
      el.addEventListener('click', () => {
        const targetUid = el.dataset.uid;
        if (!targetUid) return;
        const contact = contacts.find((c) => c.uid === targetUid);
        this.openChat(user.uid, targetUid, contact?.name || 'Chat');
      });
    });
  },

  async openChat(myUid, theirUid, theirName) {
    const chatId = getChatId(myUid, theirUid);
    document.getElementById('chat-title').textContent = theirName;
    const form = document.getElementById('chat-form');
    form.style.display = 'flex';

    if (this._unsubscribe) this._unsubscribe();

    const messagesRef = collection(db, COLLECTIONS.CHATS, chatId, 'messages');
    const messagesList = document.getElementById('messages-list');

    this._unsubscribe = onSnapshot(
      query(messagesRef, orderBy('createdAt', 'asc')),
      (snap) => {
        messagesList.innerHTML = snap.docs.map((d) => {
          const m = d.data();
          const isMine = m.senderId === myUid;
          return `<div style="display:flex;justify-content:${isMine ? 'flex-end' : 'flex-start'};margin-bottom:var(--space-2)">
            <div style="background:${isMine ? 'var(--color-primary)' : 'var(--color-bg-muted)'};color:${isMine ? 'white' : 'inherit'};padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);max-width:70%;word-break:break-word">
              ${escapeHtml(m.text || '')}
              <div style="font-size:0.6875rem;opacity:0.7;margin-top:2px">${m.createdAt?.toDate?.()?.toLocaleTimeString?.() || ''}</div>
            </div>
          </div>`;
        }).join('');
        messagesList.scrollTop = messagesList.scrollHeight;
      },
      (err) => { console.error('[Chat] listener error:', err); }
    );

    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = form.querySelector('[name="message"]');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      try {
        const msgRef = doc(collection(db, COLLECTIONS.CHATS, chatId, 'messages'));
        await setDoc(msgRef, {
          senderId: myUid,
          text,
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, COLLECTIONS.CHATS, chatId), {
          participants: [myUid, theirUid],
          lastMessage: text,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        showToast('Failed to send message', 'error');
      }
    };
  },

  destroy() {
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
  }
};
