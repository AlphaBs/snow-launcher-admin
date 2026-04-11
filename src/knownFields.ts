export interface KnownField {
  displayName: string
  description: string
  index: number
}

export type KnownFieldMap = Record<string, KnownField>

export const knownFields: KnownFieldMap = {
  id: {
    displayName: 'ID',
    description: '고유 식별자',
    index: 100,
  },
  lastUpdatedAt: {
    displayName: '마지막 업데이트',
    description: '데이터가 마지막으로 수정된 시각',
    index: 90,
  },
  notice: {
    displayName: '공지사항',
    description: '사용자에게 표시되는 공지사항',
    index: 80,
  },
  quickMultiplayerServer: {
    displayName: '접속할 서버 주소',
    description: '빠른 멀티플레이어 접속에 사용되는 서버 주소',
    index: 70,
  },
  enableSRVResolving: {
    displayName: 'SRV 레코드 사용 여부',
    description: '서버 주소를 SRV 레코드로 resolve할지 여부',
    index: 65,
  },
  startVersion: {
    displayName: '실행할 버전',
    description: '클라이언트가 실행할 게임 버전',
    index: 60,
  },
  updateServerType: {
    displayName: '업데이트 서버 타입',
    description: '업데이트 서버의 종류',
    index: 55,
  },
  updateServerId: {
    displayName: '업데이트 서버 ID',
    description: '업데이트 서버의 식별자',
    index: 50,
  },
  updateServerUrl: {
    displayName: '업데이트 서버 URL',
    description: '업데이트 파일을 받아올 서버 주소',
    index: 45,
  },
  includes: {
    displayName: '항상 업데이트할 파일 목록',
    description: '업데이트 시 항상 포함되는 파일 패턴 목록',
    index: 40,
  },
  excludes: {
    displayName: '업데이트 제외할 파일 목록',
    description: '업데이트 시 제외되는 파일 패턴 목록',
    index: 35,
  },
}
