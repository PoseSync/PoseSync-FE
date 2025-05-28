import { Landmark } from "../../types";

/**
 * 관절별 가중치 설정
 * 모든 운동에 공통으로 적용되는 가중치
 */
const JOINT_WEIGHTS: Record<number, number> = {
  // 하체 관절 (높은 가중치) - 핵심 관절만 엄격하게
  23: 0.15, // LEFT_HIP
  24: 0.15, // RIGHT_HIP
  25: 0.15, // LEFT_KNEE
  26: 0.15, // RIGHT_KNEE
  27: 0.08, // LEFT_ANKLE
  28: 0.08, // RIGHT_ANKLE

  // 상체 관절 (가중치 축소) - 덜 중요하게
  11: 0.05, // LEFT_SHOULDER
  12: 0.05, // RIGHT_SHOULDER
  13: 0.03, // LEFT_ELBOW
  14: 0.03, // RIGHT_ELBOW
  15: 0.02, // LEFT_WRIST
  16: 0.02, // RIGHT_WRIST

  // 기타 관절들 (낮은 가중치)
  0: 0.01, // NOSE
  9: 0.005, // MOUTH_LEFT
  10: 0.005, // MOUTH_RIGHT
};

/**
 * 두 3D 좌표 간의 유클리드 거리 계산
 */
const calculateDistance = (point1: Landmark, point2: Landmark): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
      Math.pow(point1.y - point2.y, 2) +
      Math.pow(point1.z - point2.z, 2)
  );
};

/**
 * 거리를 정확도 점수로 변환 (더 관대한 버전)
 * @param distance 3D 거리
 * @param maxDistance 최대 허용 거리 (기본값: 0.8로 대폭 증가)
 * @returns 15-100 점수 (최소 15점 보장)
 */
const distanceToScore = (
  distance: number,
  maxDistance: number = 0.8
): number => {
  if (distance >= maxDistance) return 15; // 최소 15점 보장

  const ratio = distance / maxDistance;

  // 3단계 점수 체계로 더 관대하게
  if (ratio <= 0.3) {
    // 매우 가까움: 80-100점 구간
    return 80 + 20 * (1 - ratio / 0.3);
  } else if (ratio <= 0.6) {
    // 중간 거리: 50-80점 구간
    return 50 + 30 * (1 - (ratio - 0.3) / 0.3);
  } else {
    // 먼 거리: 15-50점 구간
    return 15 + 35 * (1 - (ratio - 0.6) / 0.4);
  }
};

/**
 * 사용자 자세와 가이드라인 자세의 정확도 계산
 * 실시간 감지 랜드마크가 가이드라인 랜드마크와 얼마나 겹쳐지는지 측정
 * @param userLandmarks 사용자의 실시간 랜드마크
 * @param guidelineLandmarks 서버에서 받은 가이드라인 랜드마크
 * @returns 15-100 정확도 점수 (더 관대한 점수)
 */
export const calculatePoseAccuracy = (
  userLandmarks: Landmark[],
  guidelineLandmarks: Landmark[]
): number => {
  if (!userLandmarks.length || !guidelineLandmarks.length) {
    return 0;
  }

  let totalScore = 0;
  let totalWeight = 0;
  let validJoints = 0;

  // 각 관절별로 겹침 정도 계산
  Object.entries(JOINT_WEIGHTS).forEach(([jointIdStr, weight]) => {
    const jointId = parseInt(jointIdStr);

    const userJoint = userLandmarks.find((lm) => lm.id === jointId);
    const guideJoint = guidelineLandmarks.find((lm) => lm.id === jointId);

    // 양쪽 모두 존재하고 가시성이 충분한 경우만 계산
    if (
      userJoint &&
      guideJoint &&
      (userJoint.visibility ?? 1) > 0.5 &&
      (guideJoint.visibility ?? 1) > 0.5
    ) {
      // 두 랜드마크 간의 거리 계산
      const distance = calculateDistance(userJoint, guideJoint);

      // 거리를 점수로 변환 (가까울수록 높은 점수)
      const score = distanceToScore(distance);

      totalScore += score * weight;
      totalWeight += weight;
      validJoints++;
    }
  });

  // 유효한 관절이 너무 적으면 점수 패널티 (기준 완화)
  if (validJoints < 4) {
    // 6개 → 4개로 완화
    const penalty = validJoints / 4; // 4개 미만이면 비례 감소
    return totalWeight > 0 ? (totalScore / totalWeight) * penalty : 15;
  }

  const finalScore =
    totalWeight > 0 ? Math.round(totalScore / totalWeight) : 15;

  // 최소 15점 보장
  return Math.max(15, finalScore);
};

/**
 * 정확도를 부드럽게 변화시키는 필터 (급격한 변화 방지)
 */
export class AccuracyFilter {
  private previousAccuracy: number = 0;
  private smoothingFactor: number = 0.5; // 0.3 → 0.5로 더 반응적으로

  /**
   * 필터링된 정확도 반환
   * @param newAccuracy 새로 계산된 정확도
   * @returns 부드럽게 필터링된 정확도
   */
  public filter(newAccuracy: number): number {
    if (this.previousAccuracy === 0) {
      this.previousAccuracy = newAccuracy;
      return newAccuracy;
    }

    // 지수 이동 평균 적용 (더 반응적)
    const filteredAccuracy =
      this.previousAccuracy * (1 - this.smoothingFactor) +
      newAccuracy * this.smoothingFactor;

    this.previousAccuracy = filteredAccuracy;
    return Math.round(filteredAccuracy);
  }

  /**
   * 필터 초기화
   */
  public reset(): void {
    this.previousAccuracy = 0;
  }
}
