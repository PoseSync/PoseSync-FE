# PoseSync-FE

PoseSync 프로젝트의 프론트엔드 리포지토리입니다. 실시간 포즈 감지 및 분석을 위한 웹 애플리케이션입니다.

## 기술 스택

- React
- TypeScript
- Vite
- styled-components
- MediaPipe (예정)

## 시작하기

### 필수 조건

- Node.js
- npm

### 설치

```bash
# 리포지토리 클론
git clone https://github.com/PoseSync/PoseSync-FE.git
cd PoseSync-FE

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 주요 기능 (예정)

- 실시간 포즈 감지
- 포즈 분석 및 피드백
- 사용자 맞춤형 포즈 추천
- 포즈 기록 및 통계

## 프로젝트 구조

```
src/
├── assets/       # 이미지, 아이콘 등 정적 파일
├── components/   # 재사용 가능한 컴포넌트
├── hooks/        # 커스텀 훅
├── pages/        # 페이지 컴포넌트
├── styles/       # 스타일 관련 파일
└── utils/        # 유틸리티 함수
```

## 개발 진행 상황

- [x] 초기 프로젝트 설정
- [x] 기본 페이지 레이아웃
- [ ] MediaPipe 연동
- [ ] 포즈 감지 기능 구현
- [ ] 사용자 인터페이스 개선

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
