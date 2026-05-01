import { db } from './config';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, orderBy, limit, getDocs,
  serverTimestamp, increment,
  type FieldValue,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  classCode: string;
  coins: number;
  level: number;
  bestLevel: number;
  cleared: boolean;
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

/** 로그인 직후 호출: 프로필이 없으면 만들고, 있으면 그대로 로드. */
export async function ensureUserProfile(
  uid: string,
  name: string,
  classCode: string,
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // 이름·학급은 매번 동기화 (학생이 새 학년에서 다시 입력했을 수 있음)
    const next: Partial<UserProfile> = {};
    if (data.name !== name.trim()) next.name = name.trim();
    if (data.classCode !== classCode.trim()) next.classCode = classCode.trim();
    if (Object.keys(next).length) {
      await updateDoc(ref, { ...next, updatedAt: serverTimestamp() });
    }
    return { ...data, ...next };
  }

  const profile: UserProfile = {
    uid,
    name: name.trim(),
    classCode: classCode.trim(),
    coins: 0,
    level: 1,
    bestLevel: 1,
    cleared: false,
  };
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profile;
}

export async function saveProgress(
  uid: string,
  patch: { coins?: number; level?: number; cleared?: boolean },
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.coins !== undefined) update.coins = patch.coins;
  if (patch.level !== undefined) {
    update.level = patch.level;
    // bestLevel은 누적 최고치만 유지
    update.bestLevel = increment(0); // placeholder
  }
  if (patch.cleared !== undefined) update.cleared = patch.cleared;
  await updateDoc(ref, update);

  if (patch.level !== undefined) {
    // bestLevel을 max(현재값, level)로 업데이트하기 위해 별도 처리
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cur = snap.data() as UserProfile;
      if (patch.level > (cur.bestLevel ?? 1)) {
        await updateDoc(ref, { bestLevel: patch.level });
      }
    }
  }
}

export interface LeaderboardEntry {
  uid: string;
  name: string;
  classCode: string;
  coins: number;
  bestLevel: number;
  cleared: boolean;
}

export async function getLeaderboard(
  classCode: string,
  topN: number = 20,
): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'users'),
    where('classCode', '==', classCode.trim()),
    orderBy('coins', 'desc'),
    limit(topN),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as UserProfile;
    return {
      uid: data.uid,
      name: data.name,
      classCode: data.classCode,
      coins: data.coins ?? 0,
      bestLevel: data.bestLevel ?? data.level ?? 1,
      cleared: data.cleared ?? false,
    };
  });
}
