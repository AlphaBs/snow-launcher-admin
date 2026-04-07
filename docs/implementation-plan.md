# Snow Launcher Admin - 구현 계획

## 1. 페이지 구조

### Admin 영역 (BasicAuth 인증 필요)
로그인 후 접근 가능. 모든 요청에 `Authorization: Basic <credentials>` 헤더 포함.

```
/admin/login          -- 로그인 (서버 ID + 비밀번호 입력 → BasicAuth 저장)
/admin/channels       -- 채널 목록/생성
/admin/channels/:id   -- 채널 상세 (수정, 삭제, 인스턴스/유저 관리)
/admin/servers        -- 서버 목록/생성
/admin/servers/:id    -- 서버 상세 (수정, 삭제, 비밀번호 변경, 복제)
/admin/instances      -- 인스턴스 목록/생성
/admin/instances/:id  -- 인스턴스 상세 (스키마/데이터/파일스키마 관리, 삭제, 비밀번호 변경)
```

### User 영역 (인증 없음 또는 X-Instance-Password)
```
/channels/:id         -- 채널 조회 (public 채널은 인증 없음, private은 X-User-Id 헤더)
/instances/:id        -- 인스턴스 조회 (인증 없음)
/instances/:id/edit   -- 인스턴스 데이터 수정 (X-Instance-Password 필요)
/servers/:id          -- 서버 조회 (인증 없음)
```

---

## 2. API-페이지 매핑

### Channels

| API | 인증 | Admin 페이지 | User 페이지 |
|-----|------|-------------|-------------|
| GET /channels | BasicAuth | 채널 목록 | - |
| POST /channels | BasicAuth | 채널 생성 폼 | - |
| GET /channels/:id | 없음 (private: X-User-Id) | 채널 상세 | 채널 조회 |
| PUT /channels/:id | BasicAuth | 채널 수정 | - |
| DELETE /channels/:id | BasicAuth | 채널 삭제 | - |
| GET /channels/:id/users | BasicAuth | 유저 목록 | - |
| POST /channels/:id/users | BasicAuth | 유저 추가 | - |
| DELETE /channels/:id/users/:userId | BasicAuth | 유저 제거 | - |
| POST /channels/:id/instances | BasicAuth | 인스턴스 추가 | - |
| DELETE /channels/:id/instances/:instanceId | BasicAuth | 인스턴스 제거 | - |

### Servers

| API | 인증 | Admin 페이지 | User 페이지 |
|-----|------|-------------|-------------|
| GET /servers | BasicAuth | 서버 목록 | - |
| POST /servers | BasicAuth | 서버 생성 | - |
| GET /servers/:id | 없음 | 서버 상세 | 서버 조회 |
| PUT /servers/:id | 없음* | 서버 수정 | - |
| DELETE /servers/:id | BasicAuth | 서버 삭제 | - |
| POST /servers/:id/changePassword | BasicAuth | 비밀번호 변경 | - |
| POST /servers/:id/clone | BasicAuth | 서버 복제 | - |

> *PUT /servers/:id는 swagger에 security 명시 없음. 실제 동작 확인 필요.

### Instances

| API | 인증 | Admin 페이지 | User 페이지 |
|-----|------|-------------|-------------|
| GET /snowfrost/instances | BasicAuth | 인스턴스 목록 | - |
| POST /snowfrost/instances | BasicAuth | 인스턴스 생성 | - |
| GET /snowfrost/instances/:id | 없음 | 인스턴스 상세 | 인스턴스 조회 |
| PUT /snowfrost/instances/:id | X-Instance-Password | - | 데이터 수정 |
| DELETE /snowfrost/instances/:id | BasicAuth | 인스턴스 삭제 | - |
| POST .../changePassword | BasicAuth | 비밀번호 변경 | - |
| GET .../schema | 없음 | 스키마 조회 | 스키마 조회 |
| PUT .../schema | BasicAuth | 스키마 교체 | - |
| GET .../data | 없음 | 데이터 조회 | 데이터 조회 |
| GET .../fileSchema | 없음 | 파일스키마 조회 | 파일스키마 조회 |
| PUT .../fileSchema | BasicAuth | 파일스키마 수정 | - |
| POST .../files/:field/presign | X-Instance-Password | - | 파일 업로드 |
| POST .../files/:field/commit | X-Instance-Password | - | 파일 커밋 |
| DELETE .../files/:field | X-Instance-Password | - | 파일 삭제 |

---

## 3. 동적 폼 시스템

### 3-1. Server 데이터 (자유 스키마)

서버 데이터는 `GET /servers/:id` 응답이 `additionalProperties: true`인 자유 형식 JSON.
저장된 값의 JavaScript 타입을 기준으로 폼 필드를 자동 생성한다.

```
타입 판별 규칙:
- typeof value === "string"   → TextField
- typeof value === "number"   → NumberField
- typeof value === "boolean"  → Checkbox
- Array.isArray(value)        → 배열 에디터 (각 항목을 재귀적으로 렌더)
- typeof value === "object"   → 중첩 폼 (각 key를 재귀적으로 렌더)
- null / undefined            → TextField (기본값)
```

추가 기능:
- key 추가/삭제 기능 (자유 스키마이므로 필드를 동적으로 관리)
- 새 필드 추가 시 타입 선택 드롭다운 (string, number, boolean, object, array)
- JSON 직접 편집 모드 토글 (폼 ↔ JSON 에디터 전환)

### 3-2. Instance 데이터 (schema 기반)

인스턴스는 `schema` 필드가 JSON Schema 형식으로 데이터의 구조를 정의한다.
`data`는 이 schema를 만족하는 값이다.

```
JSON Schema type → 폼 필드 매핑:
- type: "string"              → TextField
- type: "string" + enum       → Select (드롭다운)
- type: "number" / "integer"  → NumberField
- type: "boolean"             → Checkbox
- type: "array"               → 배열 에디터 (items schema로 반복)
- type: "object"              → 중첩 폼 (properties로 재귀)
```

schema 메타데이터 활용:
- `title` → 필드 라벨
- `description` → 도움말 텍스트
- `default` → 기본값
- `required` → 필수 표시
- `minimum` / `maximum` → NumberField 범위 제한
- `minLength` / `maxLength` → TextField 길이 제한
- `pattern` → 입력 유효성 검사

### 3-3. 공통 폼 컴포넌트 구조

```
src/components/form/
  DynamicForm.vue          -- schema 또는 값 기반으로 폼 자동 생성
  DynamicFormField.vue     -- 단일 필드 (타입에 따라 적절한 input 렌더)
  TextField.vue
  NumberField.vue
  CheckboxField.vue
  SelectField.vue
  ArrayField.vue           -- 배열 항목 추가/삭제/정렬
  ObjectField.vue          -- 중첩 객체 (재귀)
  JsonEditor.vue           -- JSON 직접 편집 모드
```

---

## 4. 인증 처리

### Admin (BasicAuth)
- 로그인 페이지에서 서버 ID + 비밀번호 입력
- `btoa(id:password)` 로 인코딩하여 Pinia auth store에 저장
- openapi-fetch middleware로 모든 `/admin` 요청에 `Authorization` 헤더 자동 추가
- 로그아웃 시 store 초기화
- Vue Router `beforeEach` 가드로 미인증 시 로그인 페이지 리다이렉트

### User (X-Instance-Password)
- 인스턴스 데이터 수정/파일 업로드 페이지 진입 시 비밀번호 입력 프롬프트
- 입력된 비밀번호를 세션 동안 유지 (Pinia store, 인스턴스별로 관리)
- 요청 시 `X-Instance-Password` 헤더에 포함

---

## 5. 디렉토리 구조

```
src/
  api/
    client.ts              -- openapi-fetch 클라이언트 (기존)
    schema.d.ts            -- 자동 생성 타입 (기존)
    adminClient.ts         -- BasicAuth 미들웨어 적용 클라이언트
  stores/
    auth.ts                -- admin 인증 상태 (BasicAuth credentials)
    instancePassword.ts    -- 인스턴스별 비밀번호 캐시
  router/
    index.ts               -- 라우터 설정
    guards.ts              -- admin 인증 가드
  views/
    admin/
      AdminLogin.vue
      channels/
        ChannelList.vue
        ChannelDetail.vue
      servers/
        ServerList.vue
        ServerDetail.vue
      instances/
        InstanceList.vue
        InstanceDetail.vue
    user/
      ChannelView.vue
      ServerView.vue
      InstanceView.vue
      InstanceEdit.vue
  components/
    form/                  -- 동적 폼 시스템 (3-3 참고)
    layout/
      AdminLayout.vue      -- admin 사이드바 + 헤더
      UserLayout.vue       -- user 레이아웃
    common/
      ConfirmDialog.vue
      PasswordPrompt.vue
```

---

## 6. 구현 순서

### Phase 1: 기반
1. 라우터 구성 (admin/user 분리, 가드)
2. Pinia auth store + adminClient (BasicAuth 미들웨어)
3. AdminLayout, UserLayout 컴포넌트

### Phase 2: Admin CRUD
4. 서버 목록/생성/상세/수정/삭제/복제/비밀번호 변경
5. 인스턴스 목록/생성/상세/삭제/비밀번호 변경
6. 채널 목록/생성/상세/수정/삭제/인스턴스 관리/유저 관리

### Phase 3: 동적 폼
7. 기본 폼 컴포넌트 (TextField, NumberField, Checkbox, Select)
8. DynamicForm - 값 타입 기반 자동 생성 (서버용)
9. DynamicForm - JSON Schema 기반 자동 생성 (인스턴스용)
10. ArrayField, ObjectField (재귀 렌더)
11. JSON 직접 편집 모드

### Phase 4: User 페이지
12. 인스턴스 조회 페이지
13. 인스턴스 데이터 수정 (X-Instance-Password + 동적 폼)
14. 파일 업로드 (presign → upload → commit 플로우)
15. 채널/서버 조회 페이지

### Phase 5: 마무리
16. 에러 핸들링 (403, 404 등)
17. 반응형 레이아웃
