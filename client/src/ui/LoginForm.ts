export interface LoginInput {
  name: string;
  classCode: string;
  password: string; // 빈 문자열이면 익명
}

export type LoginValidator = (input: LoginInput) => Promise<string | null>;

const STYLE = `
  #mumu-login-overlay {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    font-family: 'Malgun Gothic', monospace, sans-serif;
  }
  #mumu-login-overlay .card {
    background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%);
    padding: 28px;
    border-radius: 14px;
    border: 2px solid #FFD700;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 215, 0, 0.2) inset;
    width: 340px;
    max-width: 90vw;
  }
  #mumu-login-overlay h2 {
    color: #FFD700; margin: 0 0 6px;
    font-size: 22px; text-align: center; letter-spacing: 1px;
  }
  #mumu-login-overlay .subtitle {
    color: #aaccff; font-size: 13px; text-align: center; margin: 0 0 20px;
  }
  #mumu-login-overlay label {
    display: block; color: #ccc; font-size: 13px;
    margin: 10px 0 4px; font-weight: 600;
  }
  #mumu-login-overlay input {
    width: 100%; padding: 10px 12px;
    font-size: 15px; font-family: inherit;
    border: 1px solid #555; background: #0a0a1a; color: #fff;
    border-radius: 6px; box-sizing: border-box;
    outline: none; transition: border-color .15s;
  }
  #mumu-login-overlay input:focus { border-color: #FFD700; }
  #mumu-login-overlay .hint {
    font-size: 11px; color: #888; margin-top: 4px;
  }
  #mumu-login-overlay .err {
    color: #ff6688; font-size: 12px;
    margin: 8px 0 0; min-height: 16px;
  }
  #mumu-login-overlay button {
    width: 100%; padding: 12px;
    font-size: 16px; font-family: inherit; font-weight: bold;
    background: #FFD700; color: #000;
    border: none; border-radius: 6px;
    cursor: pointer; margin-top: 16px;
    transition: background .15s;
  }
  #mumu-login-overlay button:hover:not(:disabled) { background: #ffec5c; }
  #mumu-login-overlay button:disabled { background: #888; cursor: wait; }
`;

export function showLoginForm(validate: LoginValidator): Promise<LoginInput> {
  return new Promise((resolve) => {
    const styleTag = document.createElement('style');
    styleTag.textContent = STYLE;
    document.head.appendChild(styleTag);

    const overlay = document.createElement('div');
    overlay.id = 'mumu-login-overlay';
    overlay.innerHTML = `
      <form class="card" autocomplete="off">
        <h2>⚔ 모험 시작 ⚔</h2>
        <div class="subtitle">이름과 학급을 입력하세요</div>

        <label for="mumu-name">이름</label>
        <input id="mumu-name" type="text" required maxlength="10" placeholder="예: 김민수" />

        <label for="mumu-class">학급</label>
        <input id="mumu-class" type="text" required maxlength="20" placeholder="예: 5-3 또는 별빛반" />

        <label for="mumu-pw">비밀번호 (선택)</label>
        <input id="mumu-pw" type="password" maxlength="20" placeholder="6자리 이상 (비우면 익명)" />
        <div class="hint">비번 입력 시 다른 기기에서도 디스코인 유지</div>

        <p class="err" id="mumu-err"></p>
        <button type="submit" id="mumu-submit">시작 ▶</button>
      </form>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('form') as HTMLFormElement;
    const nameInput = overlay.querySelector('#mumu-name') as HTMLInputElement;
    const classInput = overlay.querySelector('#mumu-class') as HTMLInputElement;
    const pwInput = overlay.querySelector('#mumu-pw') as HTMLInputElement;
    const errBox = overlay.querySelector('#mumu-err') as HTMLElement;
    const submit = overlay.querySelector('#mumu-submit') as HTMLButtonElement;

    nameInput.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input: LoginInput = {
        name: nameInput.value.trim(),
        classCode: classInput.value.trim(),
        password: pwInput.value.trim(),
      };
      if (!input.name || !input.classCode) {
        errBox.textContent = '이름과 학급은 필수예요.';
        return;
      }
      if (input.password && input.password.length < 6) {
        errBox.textContent = '비밀번호는 6자리 이상이어야 해요.';
        return;
      }
      submit.disabled = true;
      submit.textContent = '확인 중…';
      errBox.textContent = '';
      try {
        const err = await validate(input);
        if (err) {
          errBox.textContent = err;
          submit.disabled = false;
          submit.textContent = '시작 ▶';
          return;
        }
        document.body.removeChild(overlay);
        document.head.removeChild(styleTag);
        resolve(input);
      } catch (e) {
        errBox.textContent = e instanceof Error ? e.message : '오류가 발생했어요.';
        submit.disabled = false;
        submit.textContent = '시작 ▶';
      }
    });
  });
}
