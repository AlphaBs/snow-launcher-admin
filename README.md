# Snow Launcher Admin

Snow Launcher 관리자 대시보드 (Vue 3 + TypeScript + Tailwind CSS)

## 개발 환경

```bash
pnpm install
pnpm dev
```

## 환경 변수

`.env.local` 파일을 생성하고 아래 변수를 설정하세요.

```env
VITE_API_BASE_URL=https://your-api-server.com
```

## 배포

Firebase Hosting으로 배포합니다. 빌드 후 `./public` 디렉토리에 출력된 파일이 배포됩니다.

### 사전 준비

- [Firebase CLI](https://firebase.google.com/docs/cli) 설치
- Firebase 로그인: `firebase login`

### 배포 명령어

```bash
pnpm deploy
```

빌드(타입 체크 포함)와 Firebase Hosting 배포를 한 번에 실행합니다.

### 배포 URL

- https://snow-launcher.web.app
- https://snow-launcher.firebaseapp.com

### API 라우팅

`/servers/**` 및 `/api/**` 경로는 Cloud Run 서비스(`snow-launcher-hub-function`, asia-northeast3)로 프록시됩니다.
