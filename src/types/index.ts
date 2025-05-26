// MediaPipe 포즈 랜드마크 좌표 타입
export interface Landmark {
  id: number; // id 속성 추가 (옵셔널)
  x: number;
  y: number;
  z: number;
  visibility?: number;
  [key: string]: number | undefined;
}

// MediaPipe 전체 결과 타입 (Tasks API 호환용으로 수정)
export interface PoseResult {
  poseLandmarks: Landmark[]; // 2D 랜드마크 (화면 좌표계)
  poseWorldLandmarks: Landmark[]; // 3D 랜드마크 (미터 단위)
}

// 변환된 좌표계 랜드마크 타입
export interface TransformedLandmark extends Landmark {
  id: number;
}

// MediaPipe 결과 타입 (내장 시각화용)
export interface MediaPipeResult {
  landmarks?: {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }[][];
  worldLandmarks?: {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }[][];
}

// 가이드라인 포즈 데이터 타입
export interface GuidelinePose {
  id: string;
  name: string;
  landmarks: TransformedLandmark[];
}

// Socket.io 통신을 위한 데이터 타입
export interface SocketData {
  phoneNumber: string;
  exerciseType: string;
  landmarks: TransformedLandmark[];
}

// ProcessedResult 인터페이스에 count 필드 추가
export interface ProcessedResult {
  visualizationLandmarks: TransformedLandmark[]; // 서버 역변환된 시각화용 랜드마크
  exerciseCount?: number; // 운동 횟수 (기존 필드)
  count?: number; // 🎯 서버에서 보내는 실제 운동 횟수 필드
  similarity?: number; // 자세 유사도
  feedback?: string; // 피드백 메시지
  requestId?: string; // 요청 ID
}

// 🎯 수정된 서버에서 보내는 next 이벤트 데이터 타입 (null 허용)
export interface NextSetInfo {
  set_number: number | null; // 다음 세트 번호 (마지막일 때 null)
  next_weight: number | null; // 다음 세트 무게 (마지막일 때 null)
  next_target_count: number | null; // 다음 세트 목표 횟수 (마지막일 때 null)
  is_last: boolean; // 마지막 세트 여부
  count: number; // 횟수 초기화 용도
}

// MediaPipeLandmark 인터페이스 확인/추가
export interface MediaPipeLandmark {
  id: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// 사람 중심 축 정의를 위한 타입
export interface HumanCentricAxes {
  xAxis: [number, number, number];
  yAxis: [number, number, number];
  zAxis: [number, number, number];
  origin: { x: number; y: number; z: number }; // 원점 정보 추가 (옵셔널 아님)
}
