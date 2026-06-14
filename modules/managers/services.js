import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { app, auth, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { shopService } from '../shops/services.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

function generateManagerId(name, shopName) {
  const cleanName = (name || 'Manager').replace(/\s+/g, '');
  const cleanShop = (shopName || 'Shop').replace(/\s+/g, '');
  const code = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `${cleanName}_${cleanShop}_${code}`;
}

function generateManagerEmail(managerId) {
  return `${managerId.toLowerCase().replace(/[^a-z0-9]/g, '')}@kba-manager.internal`;
}

class ManagerService {
  async createManagerAuth(email, password, profile = null) {
    const secondaryApp = initializeApp(app.options, `Secondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = credential.user.uid;
      if (profile) {
        const secondaryDb = getFirestore(secondaryApp);
        await setDoc(doc(secondaryDb, COLLECTIONS.USERS, uid), {
          uid,
          role: 'manager',
          name: profile.name,
          email,
          managerId: profile.managerId,
          mobile: profile.mobile || '',
          shopId: profile.shopId,
          ownerId: profile.ownerId,
          disabled: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await signOut(secondaryAuth);
      return uid;
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  async create({ shopId, ownerId, name, password, shopName }) {
    const managerId = generateManagerId(name, shopName);
    const email = generateManagerEmail(managerId);

    const authUid = await this.createManagerAuth(email, password, {
      name, shopId, ownerId, managerId, mobile: ''
    });

    const managerRef = doc(collection(db, COLLECTIONS.MANAGERS));
    const manager = {
      id: managerRef.id,
      shopId,
      ownerId,
      authUid,
      managerId,
      name,
      email,
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(managerRef, manager);
    await shopService.linkManager(shopId, managerRef.id);
    eventBus.emit(EVENTS.MANAGER_CREATED, manager);
    return { ...manager, password };
  }

  async getByShop(shopId, ownerId = null) {
    const clauses = [where('shopId', '==', shopId)];
    if (ownerId) clauses.push(where('ownerId', '==', ownerId));
    const q = query(collection(db, COLLECTIONS.MANAGERS), ...clauses);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.MANAGERS), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getById(managerId) {
    const snap = await getDoc(doc(db, COLLECTIONS.MANAGERS, managerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async update(id, data) {
    await updateDoc(doc(db, COLLECTIONS.MANAGERS, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    const manager = await this.getById(id);
    eventBus.emit(EVENTS.MANAGER_UPDATED, manager);
    return manager;
  }

  async disable(id) {
    const manager = await this.getById(id);
    await this.update(id, { disabled: true });
    if (manager?.authUid) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, manager.authUid), {
          disabled: true,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Managers] user disable skipped:', err?.message);
      }
    }
    eventBus.emit(EVENTS.MANAGER_DISABLED, manager);
  }

  async enable(id) {
    const manager = await this.getById(id);
    await this.update(id, { disabled: false });
    if (manager?.authUid) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, manager.authUid), {
          disabled: false,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Managers] user enable skipped:', err?.message);
      }
    }
    eventBus.emit(EVENTS.MANAGER_ENABLED, manager);
  }

  async updateManagerPassword(managerId) {
    const manager = await this.getById(managerId);
    if (!manager?.email) throw new Error('Manager not found or email missing');
    await sendPasswordResetEmail(auth, manager.email);
    await this.update(managerId, { passwordResetSentAt: serverTimestamp() });
  }

  async updateForShop(shopId, ownerId, { name, email, password }) {
    const managers = await this.getByShop(shopId, ownerId);
    if (!managers.length) {
      if (!password) throw new Error('A password is required to create the manager account.');
      const shop = await shopService.getById(shopId);
      return this.create({ shopId, ownerId, name, password, shopName: shop?.name || 'Shop' });
    }

    const manager = managers[0];
    const updates = { name, updatedAt: serverTimestamp() };
    if (email) updates.email = email;

    await updateDoc(doc(db, COLLECTIONS.MANAGERS, manager.id), updates);

    if (manager.authUid) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, manager.authUid), {
          name,
          ...(email ? { email } : {}),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[KBA][managers] manager profile name sync skipped:', err?.code || err?.message || err);
      }
    }
  }
}

export const managerService = new ManagerService();
