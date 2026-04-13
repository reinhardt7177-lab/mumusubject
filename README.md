# 🎮 mumusubject

초등학생 전 교과 대상 교육용 JRPG 플랫폼

## 🌟 비전

지브리풍 2D 그래픽과 탑뷰 게임 플레이로 학생들이 "놀이"처럼 즐기며 배우는 교과 학습 게임

## 📚 프로젝트 구조

```
mumusubject/
├── CLAUDE.md              # 프로젝트 컨텍스트
├── SKILLS.md              # 오브젝트 제작 가이드
├── README.md              # 이 파일
├── client/                # Phaser.js 프론트엔드
├── server/                # Socket.io + Node.js 멀티플레이어 서버
└── supabase/              # DB 스키마 및 설정
```

## 🚀 시작하기

### 1. 클라이언트 설치

```bash
cd client
npm install
npm run dev
```

### 2. 서버 설치

```bash
cd server
npm install
npm run dev
```

## 📖 개발 문서

- **[CLAUDE.md](./mumusubject-CLAUDE.md)** — 프로젝트 개요, 기술 스택, 개발 계획
- **SKILLS.md** — 게임 오브젝트 제작 가이드 (그래픽, 애니메이션 등)

## 🎯 현재 개발 순서

1️⃣ **수학** (🔨 진행 중) — 킹수학 벤치마킹
2️⃣ 국어
3️⃣ 사회
4️⃣ 과학
5️⃣ 영어
6️⃣ 음악
7️⃣ 미술
8️⃣ 체육
9️⃣ 도덕
🔟 실과

## 📋 기술 스택

- **게임 엔진**: Phaser.js
- **멀티플레이어**: Socket.io + Node.js
- **백엔드**: Supabase (Auth, DB, Storage)
- **배포**: Vercel (클라이언트), Railway (서버)

## ✅ 개발 원칙

✨ 퀄리티 최우선  
🎓 교육적 맥락 유지  
👶 학생 친화적 UI  
👨‍🏫 교사 통제 가능  
📈 단계별 개발

---

자세한 내용은 [CLAUDE.md](./mumusubject-CLAUDE.md)를 참고하세요.
