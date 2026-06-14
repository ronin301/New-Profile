import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, collection
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this._ready = false;
    this._resolveReady = null;
    this._readyPromise = new Promise((resolve) => { this._resolveReady = resolve; });

    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          this.currentUser = firebaseUser;
          this.userProfile = await this.fetchUserProfile(firebaseUser.uid);
        } else {
          this.currentUser = null;
          this.userProfile = null;
        }
      } catch (err) {
        console.error('[Auth] Failed to load user profile:', err);
        this.userProfile = null;
      } finally {
        if (!this._ready) {
          this._ready = true;
          this._resolveReady();
        }
        eventBus.emit(EVENTS.AUTH_STATE_CHANGED, this.userProfile);
      }
    });
  }

  async waitForSession() {
    await this._readyPromise;
    return this.userProfile;
  }

  async fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) return null;
    return { uid, ...snap.data() };
  }

  async registerOwner({ name, email, mobile, password }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const profile = {
      uid: credential.user.uid,
      role: 'owner',
      name,
      email,
      mobile,
      shopId: null,
      ownerId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), profile);
    this.userProfile = profile;
    return profile;
  }

  async login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await this.fetchUserProfile(credential.user.uid);
    if (!profile) throw new Error('User profile not found. Contact support.');
    return profile;
  }

  async loginOwner(email, password) {
    const profile = await this.login(email, password);
    if (profile.role !== 'owner') {
      await signOut(auth);
      throw new Error('This is not an owner account. Please use the correct login page.');
    }
    this.userProfile = profile;
    return profile;
  }

  async loginManager(managerId, password) {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'manager'),
      where('managerId', '==', managerId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      const profile = await this.login(managerId, password);
      if (profile.role !== 'manager') {
        await signOut(auth);
        throw new Error('This is not a manager account.');
      }
      this.userProfile = profile;
      return profile;
    }

    const managerData = snap.docs[0].data();
    if (managerData.disabled) {
      throw new Error('This manager account has been disabled. Contact the owner.');
    }

    const profile = await this.login(managerData.email, password);
    if (profile.role !== 'manager') {
      await signOut(auth);
      throw new Error('This is not a manager account.');
    }
    this.userProfile = profile;
    return profile;
  }

  async loginStaff(staffId, password) {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'staff'),
      where('staffId', '==', staffId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      const profile = await this.login(staffId, password);
      if (profile.role !== 'staff') {
        await signOut(auth);
        throw new Error('This is not a staff account.');
      }
      this.userProfile = profile;
      return profile;
    }

    const staffData = snap.docs[0].data();
    if (staffData.disabled) {
      throw new Error('This staff account has been disabled. Contact your manager.');
    }

    const profile = await this.login(staffData.email, password);
    if (profile.role !== 'staff') {
      await signOut(auth);
      throw new Error('This is not a staff account.');
    }
    this.userProfile = profile;
    return profile;
  }

  async logout() {
    await signOut(auth);
    this.userProfile = null;
    this.currentUser = null;
    eventBus.emit(EVENTS.AUTH_LOGOUT);
  }

  async updateUserProfile(uid, data) {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    this.userProfile = await this.fetchUserProfile(uid);
    return this.userProfile;
  }

  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  async sendPasswordReset(email) {
    await sendPasswordResetEmail(auth, email);
  }

  async updateOnlineStatus(uid, isOnline) {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (err) {
      console.warn('[Auth] Online status update failed:', err?.message);
    }
  }
}

export const authService = new AuthService();
