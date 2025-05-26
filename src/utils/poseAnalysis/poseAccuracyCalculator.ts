import { Landmark } from "../../types";

/**
 * 관절별 가중치 설정
 * 모든 운동에 공통으로 적용되는 가중치
 */
const JOINT_WEIGHTS: Record<number, number> = {
  // 하체 관절 (높은 가중치)
  23: 0.12, // LEFT_HIP
  24: 0.12, // RIGHT_HIP
  25: 0.12, // LEFT_KNEE
  26: 0.12, // RIGHT_KNEE
  27: 0.1, // LEFT_ANKLE
  28: 0.1, // RIGHT_ANKLE

  // 상체 관절 (중간 가중치)
  11: 0.08, // LEFT_SHOULDER
  12: 0.08, // RIGHT_SHOULDER
  13: 0.06, // LEFT_ELBOW
  14: 0.06, // RIGHT_ELBOW
  15: 0.04, // LEFT_WRIST
  16: 0.04, // RIGHT_WRIST

  // 기타 관절들 (낮은 가중치)
  0: 0.02, // NOSE
  9: 0.01, // MOUTH_LEFT
  10: 0.01, // MOUTH_RIGHT
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
 * 거리를 정확도 점수로 변환
 * @param distance 3D 거리
 * @param maxDistance 최대 허용 거리 (이 거리 이상이면 0점)
 * @returns 0-100 점수
 */
const distanceToScore = (
  distance: number,
  maxDistance: number = 0.25
): number => {
  if (distance >= maxDistance) return 0;
  return ((maxDistance - distance) / maxDistance) * 100;
};

/**
 * 사용자 자세와 가이드라인 자세의 정확도 계산
 * 실시간 감지 랜드마크가 가이드라인 랜드마크와 얼마나 겹쳐지는지 측정
 * @param userLandmarks 사용자의 실시간 랜드마크
 * @param guidelineLandmarks 서버에서 받은 가이드라인 랜드마크
 * @returns 0-100 정확도 점수
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

  // 유효한 관절이 너무 적으면 점수 패널티
  if (validJoints < 6) {
    const penalty = validJoints / 6; // 6개 미만이면 비례 감소
    return totalWeight > 0 ? (totalScore / totalWeight) * penalty : 0;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

/**
 * 정확도를 부드럽게 변화시키는 필터 (급격한 변화 방지)
 */
export class AccuracyFilter {
  private previousAccuracy: number = 0;
  private smoothingFactor: number = 0.3; // 0.3 정도로 부드럽게

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

    // 지수 이동 평균 적용
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
