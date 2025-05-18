import { Landmark } from "../../types";

/**
 * 데드존만 사용하는 단순한 랜드마크 안정화 클래스
 * 서버의 DeadZoneStabilizer와 동일한 로직 구현
 */
export class LandmarkStabilizer {
  // 이전 프레임의 랜드마크 저장
  private prevLandmarks: Map<number, MediaPipeStruct> = new Map();

  // 기본 데드존 값
  private deadZone: number;

  /**
   * @param deadZone 데드존 임계값 (기본값: 0.02)
   */
  constructor(deadZone: number = 0.02) {
    this.deadZone = deadZone;
  }

  /**
   * 데드존 기반 필터링
   * 작은 움직임은 무시 (서버 로직과 동일)
   */
  private applyDeadZone(
    newValue: number,
    oldValue: number,
    deadZone: number
  ): number {
    if (Math.abs(newValue - oldValue) < deadZone) {
      return oldValue;  // 변화가 작으면 이전 값 유지
    }
    return newValue;    // 변화가 크면 새 값 사용
  }

  /**
   * MediaPipe 랜드마크 안정화 - 데드존만 사용
   * @param landmarks 랜드마크 배열
   * @param deadZone 선택적 데드존 임계값
   * @returns 안정화된 랜드마크 배열
   */
  stabilizeMediaPipeLandmarks<T extends MediaPipeStruct>(
    landmarks: T[],
    deadZone?: number
  ): T[] {
    if (!landmarks || landmarks.length === 0) return landmarks;

    // 호출 시 데드존 값이 지정되면 그 값 사용
    const currentDeadZone = deadZone !== undefined ? deadZone : this.deadZone;

    return landmarks.map((landmark, index) => {
      // ID가 있으면 사용, 없으면 인덱스를 ID로 사용
      const id =
        "id" in landmark && typeof landmark.id === "number"
          ? landmark.id
          : index;

      // 이전 값 가져오기 (없으면 현재 값)
      const prevLandmark = this.prevLandmarks.get(id) || landmark;

      // 데드존 적용
      const filteredX = this.applyDeadZone(landmark.x, prevLandmark.x, currentDeadZone);
      const filteredY = this.applyDeadZone(landmark.y, prevLandmark.y, currentDeadZone);

      // z 좌표가 있으면 데드존 적용
      let filteredZ = landmark.z;
      if (typeof landmark.z === "number") {
        const prevZ =
          typeof prevLandmark.z === "number" ? prevLandmark.z : landmark.z;
        filteredZ = this.applyDeadZone(landmark.z, prevZ, currentDeadZone);
      }

      // 안정화된 랜드마크 생성
      const stabilized = {
        ...landmark,
        x: filteredX,
        y: filteredY,
        z: filteredZ,
      } as T;

      // 다음 프레임을 위해 현재 랜드마크 저장
      this.prevLandmarks.set(id, stabilized);

      return stabilized;
    });
  }

  /**
   * 서버에서 처리된 랜드마크 안정화
   */
  stabilizeProcessedLandmarks(
    landmarks: Landmark[],
    deadZone?: number
  ): Landmark[] {
    return this.stabilizeMediaPipeLandmarks(landmarks, deadZone);
  }

  /**
   * 데드존 값 설정
   */
  setDeadZone(deadZone: number): void {
    this.deadZone = deadZone;
  }

  /**
   * 필터 상태 초기화
   */
  reset(): void {
    this.prevLandmarks.clear();
  }
}

// 유연한 타입 적용을 위한 인터페이스
interface MediaPipeStruct {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  id?: number;
  [key: string]: number | undefined;
}

// 전역 인스턴스 생성
// 실시간 랜드마크용 안정화기
export const mediaPipeLandmarkStabilizer = new LandmarkStabilizer(0.02);

// 처리된 랜드마크용 안정화기
export const processedLandmarkStabilizer = new LandmarkStabilizer(0.02);