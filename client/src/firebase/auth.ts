import { auth } from './config';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User,
  type AuthError,
} from 'firebase/auth';

/**
 * 학생이 입력한 이름+학급을 결정적인 영문 이메일로 변환.
 * - Firebase Auth 이메일은 ASCII만 안전하므로 한글 이름을 hex로 인코딩.
 * - 같은 (이름, 학급) → 항상 같은 이메일 → 비번으로 식별.
 */
function synthEmail(name: string, classCode: string): string {
  const raw = `${classCode.trim()}::${name.trim()}`;
  const bytes = new TextEncoder().encode(raw);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `u${hex}@mumulegend.app`;
}

export interface LoginResult {
  user: User;
  isNewUser: boolean;
}

/**
 * 비번이 비어있으면 익명 로그인.
 * 비번이 있으면 (이름+학급) 기반 이메일로 시도:
 *   - 사용자 없으면 새로 가입
 *   - 사용자 있으면 비번 체크해서 로그인 (틀리면 에러 throw)
 */
export async function loginOrSignUp(
  name: string,
  classCode: string,
  password: string,
): Promise<LoginResult> {
  if (!password) {
    const cred = await signInAnonymously(auth);
    return { user: cred.user, isNewUser: true };
  }

  const email = synthEmail(name, classCode);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user, isNewUser: false };
  } catch (err) {
    const code = (err as AuthError).code;
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      // 신규 가입 시도
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return { user: cred.user, isNewUser: true };
      } catch (signupErr) {
        const sc = (signupErr as AuthError).code;
        if (sc === 'auth/email-already-in-use' || sc === 'auth/wrong-password') {
          throw new Error('이미 같은 이름·학급 학생이 있어요. 비밀번호를 확인하세요.');
        }
        if (sc === 'auth/weak-password') {
          throw new Error('비밀번호는 6자리 이상이어야 해요.');
        }
        throw signupErr;
      }
    }
    if (code === 'auth/wrong-password') {
      throw new Error('비밀번호가 틀려요.');
    }
    throw err;
  }
}
