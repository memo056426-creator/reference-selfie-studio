import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SelfieSelections } from '../types/selfie';

const app = initializeApp(firebaseConfig);
function createFirestoreDb() {
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = createFirestoreDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required by firebase-integration-rpc skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface SavedPresetRecord {
  id: string;
  userId: string;
  title: string;
  promptText: string;
  selfieType: string;
  framing: string;
  roomStyle: string;
  lighting: string;
  aspectRatio: string;
  selectionsJson: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

/**
 * Saves a prompt preset to Firestore with defensive payload bounds matching firebase-blueprint.json
 */
export async function savePresetToFirestore(
  title: string,
  promptText: string,
  selections: SelfieSelections
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('يرجى تسجيل الدخول لحفظ الإعدادات في حسابك.');
  }

  const presetId = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeTitle = title.trim().slice(0, 120) || 'سيلفي غرفة نوم';
  const safePrompt = promptText.trim().slice(0, 2500);
  if (safePrompt.length < 20) {
    throw new Error('البرومبت قصير جدًا للحفظ.');
  }
  const serializedSelections = JSON.stringify(selections).slice(0, 5000);

  const path = `presets/${presetId}`;
  try {
    await setDoc(doc(db, 'presets', presetId), {
      userId: currentUser.uid,
      title: safeTitle,
      promptText: safePrompt,
      selfieType: selections.selfieType,
      framing: selections.framing,
      roomStyle: selections.roomStyle,
      lighting: selections.lighting,
      aspectRatio: selections.aspectRatio,
      selectionsJson: serializedSelections,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return presetId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePresetFromFirestore(presetId: string): Promise<void> {
  const path = `presets/${presetId}`;
  try {
    await deleteDoc(doc(db, 'presets', presetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserPresets(
  userId: string,
  onData: (presets: SavedPresetRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, 'presets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedPresetRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SavedPresetRecord, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'presets');
      } catch (wrappedErr: any) {
        if (onError) onError(wrappedErr);
      }
    }
  );
}
