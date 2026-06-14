import {
  collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, createUserWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { app, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

function generateStaffId(name, shopName) {
  const cleanName = (name || 'Staff').replace(/\s+/g, '');
  const cleanShop = (shopName || 'Shop').replace(/\s+/g, '');
  const code = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${cleanName}_${cleanShop}_${code}`;
}

function generateStaffEmail(staffId) {
  return `${staffId.toLowerCase().replace(/[^a-z0-9]/g, '')}@kba-staff.internal`;
}

class StaffService {
  async create({ shopId, ownerId, managerId, name, password, shopName }) {
    const staffId = generateStaffId(name, shopName);
    const email = generateStaffEmail(staffId);

    const secondaryApp = initializeApp(app.options, `StaffSecondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    let authUid;
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      authUid = credential.user.uid;

      const secondaryDb = getFirestore(secondaryApp);
      await setDoc(doc(secondaryDb, COLLECTIONS.USERS, authUid), {
        uid: authUid,
        role: 'staff',
        name,
        email,
        staffId,
        shopId,
        ownerId,
        managerId: managerId || null,
        disabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await signOut(secondaryAuth);
    } finally {
      await deleteApp(secondaryApp);
    }

    const staffRef = doc(collection(db, COLLECTIONS.STAFF));
    const staff = {
      id: staffRef.id,
      authUid,
      staffId,
      shopId,
      ownerId,
      managerId: managerId || null,
      name,
      email,
      salary: 0,
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(staffRef, staff);
    eventBus.emit(EVENTS.STAFF_CREATED, staff);
    return { ...staff, password };
  }

  async getByShop(shopId) {
    const q = query(collection(db, COLLECTIONS.STAFF), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.STAFF), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getById(id) {
    const snap = await getDoc(doc(db, COLLECTIONS.STAFF, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async update(id, data) {
    await updateDoc(doc(db, COLLECTIONS.STAFF, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    const updated = await this.getById(id);
    eventBus.emit(EVENTS.STAFF_UPDATED, updated);
    return updated;
  }

  async remove(id) {
    const staff = await this.getById(id);
    await updateDoc(doc(db, COLLECTIONS.STAFF, id), {
      disabled: true,
      updatedAt: serverTimestamp()
    });
    if (staff?.authUid) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, staff.authUid), {
          disabled: true,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[Staff] user profile disable skipped:', err?.message);
      }
    }
    eventBus.emit(EVENTS.STAFF_REMOVED, staff);
  }

  async setSalary(id, salary) {
    return this.update(id, { salary: Number(salary) || 0 });
  }
}

export const staffService = new StaffService();
