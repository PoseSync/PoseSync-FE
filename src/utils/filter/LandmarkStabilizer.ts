import { OneEuroFilter } from "./OneEuroFilter";
import { Landmark, TransformedLandmark } from "../../types";

/**
 * 랜드마크 안정화를 위한 클래스
 * One Euro Filter를 사용하여 랜드마크 좌표의 노이즈를 줄임
 */
export class LandmarkStabilizer {
  // 각 랜드마크 ID의 X, Y 좌표를 위한 필터
  private xFilters: Map<number, OneEuroFilter> = new Map();
  private yFilters: Map<number, OneEuroFilter> = new Map();
  private zFilters: Map<number, OneEuroFilter> = new Map();

  // 필터 파라미터
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;

  // 이전 프레임의 랜드마크 (보간용)
  private prevLandmarks: Map<number, MediaPipeStruct> = new Map();

  /**
   * @param minCutoff - 최소 cutoff 주파수 (낮을수록 더 많은 필터링)
   * @param beta - 속도 기반 스무딩 파라미터 (높을수록 빠른 움직임에서 덜 지연됨)
   * @param dCutoff - 미분 cutoff 주파수
   */
  constructor(
    minCutoff: number = 0.001,
    beta: number = 0.1,
    dCutoff: number = 1.0
  ) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  /**
   * 랜드마크 ID에 해당하는 필터를 가져오거나 생성
   */
  private getOrCreateFilters(id: number): {
    xFilter: OneEuroFilter;
    yFilter: OneEuroFilter;
    zFilter: OneEuroFilter;
  } {
    if (!this.xFilters.has(id)) {
      this.xFilters.set(
        id,
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff)
      );
      this.yFilters.set(
        id,
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff)
      );
      this.zFilters.set(
        id,
        new OneEuroFilter(this.minCutoff, this.beta, this.dCutoff)
      );
    }

    return {
      xFilter: this.xFilters.get(id)!,
      yFilter: this.yFilters.get(id)!,
      zFilter: this.zFilters.get(id)!,
    };
  }

  /**
   * 데드존 기반 필터링
   * 작은 움직임은 무시
   */
  private applyDeadZone(
    newValue: number,
    oldValue: number,
    threshold: number
  ): number {
    if (Math.abs(newValue - oldValue) < threshold) {
      return oldValue;
    }
    return newValue;
  }

  /**
   * MediaPipe 랜드마크 안정화
   * @param landmarks 랜드마크 배열
   * @param timestamp 현재 타임스탬프 (기본값: 현재 시간)
   * @param deadZone 데드존 임계값 (기본값: 0.002) - 작은 움직임 무시
   * @returns 안정화된 랜드마크 배열
   */
  stabilizeMediaPipeLandmarks<T extends MediaPipeStruct>(
    landmarks: T[],
    timestamp: number = performance.now(),
    deadZone: number = 0.002
  ): T[] {
    if (!landmarks || landmarks.length === 0) return landmarks;

    return landmarks.map((landmark, index) => {
      // ID가 있으면 사용, 없으면 인덱스를 ID로 사용
      const id =
        "id" in landmark && typeof landmark.id === "number"
          ? landmark.id
          : index;

      // 필터 가져오기
      const { xFilter, yFilter, zFilter } = this.getOrCreateFilters(id);

      // 이전 값 가져오기 (없으면 현재 값)
      const prevLandmark = this.prevLandmarks.get(id) || landmark;

      // 데드존 적용 후 필터링
      const filteredX = xFilter.filter(
        this.applyDeadZone(landmark.x, prevLandmark.x, deadZone),
        timestamp / 1000.0 // 초 단위로 변환
      );

      const filteredY = yFilter.filter(
        this.applyDeadZone(landmark.y, prevLandmark.y, deadZone),
        timestamp / 1000.0
      );

      // z 좌표가 있으면 필터링
      let filteredZ = landmark.z;
      if (typeof landmark.z === "number") {
        const prevZ =
          typeof prevLandmark.z === "number" ? prevLandmark.z : landmark.z;
        filteredZ = zFilter.filter(
          this.applyDeadZone(landmark.z, prevZ, deadZone),
          timestamp / 1000.0
        );
      }

      // 가시성이 갑자기 변경되는 것 방지
      let visibility = landmark.visibility;
      if (
        typeof visibility === "number" &&
        typeof prevLandmark.visibility === "number"
      ) {
        // 가시성이 급격히 변경되는 것 방지 (스무딩)
        if (Math.abs(visibility - prevLandmark.visibility) > 0.3) {
          visibility = 0.7 * prevLandmark.visibility + 0.3 * visibility;
        }
      }

      // 안정화된 랜드마크
      const stabilized = {
        ...landmark,
        x: filteredX,
        y: filteredY,
        z: filteredZ,
        visibility: visibility,
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
    landmarks: TransformedLandmark[],
    timestamp: number = performance.now(),
    deadZone: number = 0.002
  ): TransformedLandmark[] {
    return this.stabilizeMediaPipeLandmarks(landmarks, timestamp, deadZone);
  }

  /**
   * 필터 상태 초기화
   */
  reset(): void {
    this.xFilters.forEach((filter) => filter.reset());
    this.yFilters.forEach((filter) => filter.reset());
    this.zFilters.forEach((filter) => filter.reset());
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
  [key: string]: any;
}

// 전역 인스턴스 생성
// 실시간 랜드마크용 안정화기
export const mediaPipeLandmarkStabilizer = new LandmarkStabilizer(0.001, 0.1);

// 처리된 랜드마크용 안정화기 (약간 다른 파라미터)
export const processedLandmarkStabilizer = new LandmarkStabilizer(0.001, 0.05);
