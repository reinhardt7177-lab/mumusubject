// 학년별 수학 문제 생성 시스템
// 몬스터 타입과 문제 유형은 완전히 분리 — 모든 몬스터가 전체 문제 풀에서 랜덤 출제

export const GRADES = {
  G12: '1~2학년',
  G34: '3~4학년',
  G56: '5~6학년',
};

export const MONSTER_TYPES = ['slime', 'goblin', 'orc', 'witch'];

export const MONSTER_NAMES = {
  slime:  '슬라임',
  goblin: '고블린',
  orc:    '오크전사',
  witch:  '마녀',
  boss:   '수학 마왕 👑',
};

export class MathQuestionGenerator {
  constructor(grade = GRADES.G12) {
    this.grade = grade;
  }

  setGrade(grade) {
    this.grade = grade;
  }

  // type 파라미터는 하위 호환성을 위해 유지하지만 무시
  // 문제는 학년에 맞는 전체 풀에서 랜덤 선택
  generate(_type) {
    const pool = this._pool();
    return pool[Math.floor(Math.random() * pool.length)]();
  }

  _pool() {
    switch (this.grade) {
      case GRADES.G34: return this._pool34();
      case GRADES.G56: return this._pool56();
      default:         return this._pool12();
    }
  }

  // ─── 1~2학년 문제 풀 ──────────────────────────────────────────
  _pool12() {
    return [
      // 덧셈
      () => { const a = rand(1, 10), b = rand(1, 10); return q(`${a} + ${b} = ?`, a + b); },
      // 뺄셈
      () => { const a = rand(5, 15), b = rand(1, a); return q(`${a} - ${b} = ?`, a - b); },
      // 2단 구구단
      () => { const b = rand(1, 9); return q(`2 × ${b} = ?`, 2 * b); },
      // 5단 구구단
      () => { const b = rand(1, 9); return q(`5 × ${b} = ?`, 5 * b); },
      // 3단 구구단
      () => { const b = rand(1, 9); return q(`3 × ${b} = ?`, 3 * b); },
      // 빈칸 덧셈: □ + b = c
      () => { const ans = rand(2, 9), b = rand(1, 5); return q(`□ + ${b} = ${ans + b},  □ 는?`, ans); },
      // 빈칸 뺄셈: a - □ = c
      () => { const ans = rand(1, 8), b = rand(1, 5); return q(`${ans + b} - □ = ${ans},  □ 는?`, b); },
      // 시계: N시에서 M시간 후
      () => { const h = rand(1, 10), add = rand(1, 3); return q(`${h}시에서 ${add}시간 후는 몇 시?`, h + add); },
      // 100원 묶음
      () => { const n = rand(2, 9); return q(`100원짜리 ${n}개는 모두 몇 원?`, 100 * n); },
      // 10씩 묶음
      () => { const n = rand(2, 9); return q(`10개씩 ${n}묶음은 모두 몇 개?`, 10 * n); },
      // 수열 패턴 (2씩 증가)
      () => {
        const start = rand(1, 5), step = rand(2, 4), cnt = rand(3, 5);
        const seq = Array.from({ length: cnt }, (_, i) => start + i * step);
        return q(`${seq.join(', ')}, □ = ?`, start + cnt * step);
      },
      // 문장제: 남은 개수
      () => { const total = rand(10, 20), eat = rand(1, total - 1); return q(`사탕 ${total}개에서 ${eat}개 먹으면 남은 개수는?`, total - eat); },
      // 문장제: 합
      () => { const a = rand(3, 8), b = rand(3, 8); return q(`어항에 금붕어 ${a}마리, 열대어 ${b}마리 — 모두 몇 마리?`, a + b); },
      // 받아올림 덧셈
      () => { const a = rand(5, 9), b = rand(10 - a, 9); return q(`${a} + ${b} = ?`, a + b); },
    ];
  }

  // ─── 3~4학년 문제 풀 ──────────────────────────────────────────
  _pool34() {
    return [
      // 두 자리 덧셈
      () => { const a = rand(15, 80), b = rand(10, 99 - a); return q(`${a} + ${b} = ?`, a + b); },
      // 두 자리 뺄셈
      () => { const a = rand(30, 99), b = rand(10, a - 5); return q(`${a} - ${b} = ?`, a - b); },
      // 구구단
      () => { const a = rand(2, 9), b = rand(2, 9); return q(`${a} × ${b} = ?`, a * b); },
      // 나눗셈
      () => { const b = rand(2, 9), ans = rand(2, 9); return q(`${b * ans} ÷ ${b} = ?`, ans); },
      // 나머지 있는 나눗셈
      () => { const b = rand(3, 7), qv = rand(2, 8), r = rand(1, b - 1); return q(`${b * qv + r} ÷ ${b}의 나머지는?`, r); },
      // 혼합계산 (덧셈 → 곱셈)
      () => { const a = rand(2, 7), b = rand(2, 5), c = rand(2, 4); return q(`(${a} + ${b}) × ${c} = ?`, (a + b) * c); },
      // 혼합계산 (곱셈 → 덧셈)
      () => { const a = rand(2, 6), b = rand(2, 6), c = rand(1, 9); return q(`${a} × ${b} + ${c} = ?`, a * b + c); },
      // 분수: 전체의 1/N
      () => { const n = rand(2, 5), total = n * rand(2, 6); return q(`${total}의 1/${n}은?`, total / n); },
      // 시간: N시간 M분 = ?분
      () => { const h = rand(1, 3), m = rand(5, 55); return q(`${h}시간 ${m}분은 모두 몇 분?`, h * 60 + m); },
      // 직사각형 넓이
      () => { const w = rand(3, 9), h = rand(3, 9); return q(`가로 ${w}cm, 세로 ${h}cm 직사각형의 넓이는?`, w * h); },
      // 수열 패턴
      () => {
        const start = rand(5, 20), step = rand(3, 7), cnt = rand(3, 5);
        const seq = Array.from({ length: cnt }, (_, i) => start + i * step);
        return q(`${seq.join(', ')}, □ = ?`, start + cnt * step);
      },
      // 돈 계산
      () => { const price = rand(2, 8) * 100, count = rand(2, 5); return q(`${price}원짜리 ${count}개의 값은?`, price * count); },
      // 거스름돈
      () => { const price = rand(2, 9) * 100, paid = 1000; return q(`${price}원 물건에 1000원 내면 거스름돈은?`, paid - price); },
      // 빈칸 곱셈
      () => { const b = rand(2, 9), ans = rand(2, 9); return q(`${b} × □ = ${b * ans},  □ 는?`, ans); },
    ];
  }

  // ─── 5~6학년 문제 풀 ──────────────────────────────────────────
  _pool56() {
    return [
      // 큰 수 덧셈
      () => { const a = rand(100, 500), b = rand(100, 500); return q(`${a} + ${b} = ?`, a + b); },
      // 큰 수 뺄셈
      () => { const a = rand(300, 999), b = rand(100, a - 50); return q(`${a} - ${b} = ?`, a - b); },
      // 두 자리 곱셈
      () => { const a = rand(10, 25), b = rand(2, 12); return q(`${a} × ${b} = ?`, a * b); },
      // 큰 수 나눗셈
      () => { const b = rand(2, 12), ans = rand(10, 25); return q(`${b * ans} ÷ ${b} = ?`, ans); },
      // 혼합계산
      () => { const a = rand(5, 20), b = rand(3, 10), c = rand(2, 5); return q(`${a} × ${b} - ${c} = ?`, a * b - c); },
      // 분수 곱셈 (정수 결과)
      () => { const n = rand(2, 6), m = n * rand(2, 5); return q(`${m} × (1/${n}) = ?`, m / n); },
      // 백분율
      () => {
        const base = rand(2, 10) * 100;
        const pct = [10, 20, 25, 50][rand(0, 3)];
        return q(`${base}의 ${pct}%는?`, base * pct / 100);
      },
      // 최대공약수
      () => {
        const g = rand(2, 9), a = g * rand(2, 5), b = g * rand(2, 5);
        return q(`${a}과 ${b}의 최대공약수는?`, g);
      },
      // 최소공배수
      () => {
        const a = rand(2, 8), b = rand(2, 8);
        return q(`${a}과 ${b}의 최소공배수는?`, lcm(a, b));
      },
      // 속도: 거리 = 속도 × 시간
      () => { const speed = rand(2, 8) * 10, time = rand(2, 5); return q(`시속 ${speed}km로 ${time}시간 가면 몇 km?`, speed * time); },
      // 소수 덧셈 (정수 결과)
      () => { const a = rand(1, 8); return q(`${a}.5 + ${a}.5 = ?`, a * 2 + 1); },
      // 소수 곱셈 (정수 결과): N.5 × 2
      () => { const a = rand(1, 9); return q(`${a}.5 × 2 = ?`, a * 2 + 1); },
      // 비율: 전체에서 N%
      () => { const total = rand(2, 8) * 50, pct = [10, 20, 25, 50][rand(0, 3)]; return q(`전체 ${total}개의 ${pct}%는?`, total * pct / 100); },
      // 거스름돈 (큰 금액)
      () => { const price = rand(3, 9) * 100, paid = Math.ceil(price / 1000) * 1000; return q(`${price}원 물건에 ${paid}원 내면 거스름돈은?`, paid - price); },
    ];
  }
}

function q(question, answer) { return { question, answer }; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return a * b / gcd(a, b); }
