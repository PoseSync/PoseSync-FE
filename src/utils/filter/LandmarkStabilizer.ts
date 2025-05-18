import { Landmark } from "../../types";

/**
 * 랜드마크 안정화를 위한 클래스
 * 데드존 필터를 사용하여 랜드마크 좌표의 노이즈를 줄임
 */
export class LandmarkStabilizer {
  private deadZone: number;
  private prevLandmarks: Record<number, Landmark> = {};

  /**
   * @param deadZone 움직임을 무시할 임계값 (기본값: 0.01)
   */
  constructor(deadZone: number = 0.01) {
    this.deadZone = deadZone;
  }

  /**
   * 데드존 적용: 변화량이 임계값보다 작으면 이전 값 유지
   */
  private applyDeadZone(newValue: number, oldValue: number): number {
    if (Math.abs(newValue - oldValue) < this.deadZone) {
      return oldValue; // 변화가 작으면 이전 값 유지
    }
    return newValue; // 변화가 크면 새 값 사용
  }

  /**
   * MediaPipe 랜드마크 안정화
   *
   * @param landmarks 랜드마크 배열
   * @param deadZone 기본값 대신 사용할 데드존 (선택사항)
   * @returns 안정화된 랜드마크 배열
   */
  stabilizeMediaPipeLandmarks<T extends Landmark>(
    landmarks: T[],
    deadZone?: number
  ): T[] {
    if (!landmarks || landmarks.length === 0) {
      return landmarks;
    }

    // 호출 시 데드존 값이 지정되면 임시로 값 변경
    let originalDeadZone: number | undefined;
    if (deadZone !== undefined) {
      originalDeadZone = this.deadZone;
      this.deadZone = deadZone;
    }

    const stabilizedLandmarks: T[] = [];

    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];

      // ID가 있으면 사용, 없으면 인덱스를 ID로 사용
      const landmarkId = landmark.id !== undefined ? landmark.id : i;

      // 이전 위치 가져오기 (없으면 현재 위치)
      const prevLandmark = this.prevLandmarks[landmarkId] || landmark;

      // 데드존 적용
      const stabilized = { ...landmark } as T; // 원본 복사

      // x 좌표에 데드존 적용
      stabilized.x = this.applyDeadZone(landmark.x, prevLandmark.x);

      // y 좌표에 데드존 적용
      stabilized.y = this.applyDeadZone(landmark.y, prevLandmark.y);

      // z 좌표가 있으면 데드존 적용
      if (landmark.z !== undefined) {
        stabilized.z = this.applyDeadZone(
          landmark.z,
          prevLandmark.z !== undefined ? prevLandmark.z : landmark.z
        );
      }

      // 가시성이 있으면 데드존 적용 (파이썬 코드에는 없지만 필요한 경우)
      if (
        landmark.visibility !== undefined &&
        prevLandmark.visibility !== undefined
      ) {
        stabilized.visibility = this.applyDeadZone(
          landmark.visibility,
          prevLandmark.visibility
        );
      }

      stabilizedLandmarks.push(stabilized);

      // 다음 프레임을 위해 현재 위치 저장
      this.prevLandmarks[landmarkId] = stabilized;
    }

    // 원래 데드존 값으로 복원
    if (originalDeadZone !== undefined) {
      this.deadZone = originalDeadZone;
    }

    return stabilizedLandmarks;
  }

  /**
   * 서버에서 처리된 랜드마크 안정화
   */
  stabilizeProcessedLandmarks(
    landmarks: Landmark[],
    deadZone?: number
  ): Landmark[] {
    // MediaPipe 랜드마크 안정화와 동일한 로직을 사용
    return this.stabilizeMediaPipeLandmarks(landmarks, deadZone);
  }

  /**
   * 데드존 값 업데이트
   */
  setDeadZone(deadZone: number): void {
    this.deadZone = deadZone;
  }

  /**
   * 이전 위치 기록 초기화
   */
  reset(): void {
    this.prevLandmarks = {};
  }
}

// 전역 인스턴스 생성
// 실시간 랜드마크용 안정화기
export const mediaPipeLandmarkStabilizer = new LandmarkStabilizer(0.02);

// 처리된 랜드마크용 안정화기 (약간 다른 파라미터)
export const processedLandmarkStabilizer = new LandmarkStabilizer(0.02);
