// 학년별 수학 문제 생성 시스템
// 학년에 따라 난이도와 문제 유형이 다르게 생성됩니다.

export const GRADES = {
  G12: '1~2학년',
  G34: '3~4학년',
  G56: '5~6학년',
};

export const MONSTER_TYPES = ['add', 'sub', 'mul', 'div'];

export const MONSTER_NAMES = {
  add: '덧셈 몬스터',
  sub: '뺄셈 몬스터',
  mul: '곱셈 몬스터',
  div: '나눗셈 몬스터',
  boss: '수학 마왕 👑',
};

export class MathQuestionGenerator {
  constructor(grade = GRADES.G12) {
    this.grade = grade;
  }

  setGrade(grade) {
    this.grade = grade;
  }

  // type: 'add' | 'sub' | 'mul' | 'div'
  generate(type) {
    switch (this.grade) {
      case GRADES.G12: return this._grade12(type);
      case GRADES.G34: return this._grade34(type);
      case GRADES.G56: return this._grade56(type);
      default:         return this._grade12(type);
    }
  }

  // ─── 1~2학년: 20 이하 기초 연산 ───────────────────────────
  _grade12(type) {
    switch (type) {
      case 'add': {
        const a = rand(1, 10), b = rand(1, 10);
        return { question: `${a} + ${b} = ?`, answer: a + b };
      }
      case 'sub': {
        const a = rand(5, 15), b = rand(1, a);
        return { question: `${a} - ${b} = ?`, answer: a - b };
      }
      case 'mul': {
        const a = rand(2, 5), b = rand(1, 5);
        return { question: `${a} × ${b} = ?`, answer: a * b };
      }
      case 'div': {
        const b = rand(2, 4), ans = rand(1, 5);
        return { question: `${b * ans} ÷ ${b} = ?`, answer: ans };
      }
      default: return this._grade12('add');
    }
  }

  // ─── 3~4학년: 100 이하, 구구단 전체 ─────────────────────────
  _grade34(type) {
    switch (type) {
      case 'add': {
        const a = rand(15, 80), b = rand(10, 99 - a);
        return { question: `${a} + ${b} = ?`, answer: a + b };
      }
      case 'sub': {
        const a = rand(30, 99), b = rand(10, a - 5);
        return { question: `${a} - ${b} = ?`, answer: a - b };
      }
      case 'mul': {
        const a = rand(2, 9), b = rand(2, 9);
        return { question: `${a} × ${b} = ?`, answer: a * b };
      }
      case 'div': {
        const b = rand(2, 9), ans = rand(2, 9);
        return { question: `${b * ans} ÷ ${b} = ?`, answer: ans };
      }
      default: return this._grade34('add');
    }
  }

  // ─── 5~6학년: 큰 수, 혼합계산 ────────────────────────────────
  _grade56(type) {
    switch (type) {
      case 'add': {
        const a = rand(100, 500), b = rand(100, 500);
        return { question: `${a} + ${b} = ?`, answer: a + b };
      }
      case 'sub': {
        const a = rand(300, 999), b = rand(100, a - 50);
        return { question: `${a} - ${b} = ?`, answer: a - b };
      }
      case 'mul': {
        const a = rand(10, 25), b = rand(2, 12);
        return { question: `${a} × ${b} = ?`, answer: a * b };
      }
      case 'div': {
        const b = rand(2, 12), ans = rand(10, 25);
        return { question: `${b * ans} ÷ ${b} = ?`, answer: ans };
      }
      default: return this._grade56('add');
    }
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
