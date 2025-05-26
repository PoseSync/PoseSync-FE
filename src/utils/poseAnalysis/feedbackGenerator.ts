//정확도 범위별 피드백 메시지

const FEEDBACK_MESSAGES: Record<string, string[]> = {
  excellent: [
    "완벽한 자세입니다! 👏",
    "훌륭합니다! 이 자세를 유지하세요! 💪",
    "최고의 자세를 보여주고 있습니다! ⭐",
    "완벽해요! 계속 이런 자세로 해주세요! 🔥",
  ],
  good: [
    "좋은 자세를 유지하고 있습니다! 💪",
    "거의 완벽해요! 조금만 더! 👍",
    "잘하고 있습니다! 계속 유지하세요! 🔥",
    "좋습니다! 이 자세를 계속 유지해주세요! ✨",
  ],
  fair: [
    "자세를 조금 더 정확하게 해주세요",
    "가이드라인에 더 가깝게 맞춰주세요",
    "조금 더 집중해서 자세를 잡아보세요",
    "파란색 가이드라인을 따라 자세를 맞춰주세요",
  ],
  poor: [
    "자세를 크게 수정해주세요",
    "가이드라인과 차이가 큽니다. 자세를 확인해주세요",
    "올바른 자세로 다시 시도해주세요",
    "가이드라인을 보고 자세를 교정해주세요",
  ],
  very_poor: [
    "자세가 많이 틀어졌습니다. 천천히 다시 맞춰주세요",
    "안전을 위해 자세를 크게 교정해주세요",
    "가이드라인을 참고해서 자세를 완전히 다시 잡아주세요",
    "파란색 가이드라인에 맞춰 자세를 처음부터 다시 해주세요",
  ],
};

/**
 * 격려 메시지 (간헐적으로 표시)
 */
const ENCOURAGEMENT_MESSAGES = [
  "잘하고 있어요! 💪",
  "힘내세요! 🔥",
  "조금만 더 화이팅! ✨",
  "집중하고 있네요! 👏",
  "꾸준히 하고 있어요! 💯",
];

/**
 * 정확도에 따른 피드백 레벨 결정
 */
const getAccuracyLevel = (accuracy: number): keyof typeof FEEDBACK_MESSAGES => {
  if (accuracy >= 85) return "excellent";
  if (accuracy >= 70) return "good";
  if (accuracy >= 55) return "fair";
  if (accuracy >= 35) return "poor";
  return "very_poor";
};

/**
 * 배열에서 랜덤 메시지 선택
 */
const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * 실시간 피드백 생성기 클래스
 */
export class FeedbackGenerator {
  private lastFeedbackTime: number = 0;
  private lastAccuracyLevel: string = "";
  private feedbackCooldown: number = 2000; // 2초마다 피드백 업데이트
  private encouragementCounter: number = 0;

  /**
   * 정확도에 따른 실시간 피드백 생성
   * @param accuracy 정확도 점수 (0-100)
   * @returns 피드백 메시지 (빈 문자열이면 업데이트 없음)
   */
  public generateFeedback(accuracy: number): string {
    const currentTime = Date.now();
    const accuracyLevel = getAccuracyLevel(accuracy);

    // 쿨다운 시간이 지나지 않았으면 빈 문자열 반환
    if (currentTime - this.lastFeedbackTime < this.feedbackCooldown) {
      return "";
    }

    // 정확도 레벨이 변경되었거나 일정 시간이 지났을 때만 피드백 업데이트
    if (
      accuracyLevel !== this.lastAccuracyLevel ||
      currentTime - this.lastFeedbackTime > this.feedbackCooldown
    ) {
      this.lastFeedbackTime = currentTime;
      this.lastAccuracyLevel = accuracyLevel;
      this.encouragementCounter++;

      // 10번에 한 번은 격려 메시지 (정확도가 중간 이상일 때)
      if (this.encouragementCounter % 10 === 0 && accuracy >= 55) {
        return getRandomMessage(ENCOURAGEMENT_MESSAGES);
      }

      // 일반 피드백 메시지
      return getRandomMessage(FEEDBACK_MESSAGES[accuracyLevel]);
    }

    return "";
  }

  /**
   * 피드백 생성기 초기화
   */
  public reset(): void {
    this.lastFeedbackTime = 0;
    this.lastAccuracyLevel = "";
    this.encouragementCounter = 0;
  }

  /**
   * 쿨다운 시간 설정
   * @param cooldown 밀리초 단위 쿨다운 시간
   */
  public setCooldown(cooldown: number): void {
    this.feedbackCooldown = cooldown;
  }
}
