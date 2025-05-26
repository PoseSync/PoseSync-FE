import { useState, useRef, useCallback } from "react";
import { Landmark } from "../types";
import {
  calculatePoseAccuracy,
  AccuracyFilter,
} from "../utils/poseAnalysis/poseAccuracyCalculator";
import { FeedbackGenerator } from "../utils/poseAnalysis/feedbackGenerator";

interface UsePoseAnalysisReturn {
  accuracy: number;
  analyzePose: (
    userLandmarks: Landmark[],
    guidelineLandmarks: Landmark[]
  ) => string;
  resetAnalysis: () => void;
}

/**
 * 실시간 자세 분석 훅
 * 정확도 계산과 피드백 생성을 관리
 */
export const usePoseAnalysis = (): UsePoseAnalysisReturn => {
  const [accuracy, setAccuracy] = useState<number>(0);

  // 정확도 필터와 피드백 생성기 인스턴스
  const accuracyFilterRef = useRef<AccuracyFilter>(new AccuracyFilter());
  const feedbackGeneratorRef = useRef<FeedbackGenerator>(
    new FeedbackGenerator()
  );

  /**
   * 자세 분석 실행
   * @param userLandmarks 사용자 실시간 랜드마크
   * @param guidelineLandmarks 가이드라인 랜드마크
   * @returns 피드백 메시지 (빈 문자열이면 업데이트 없음)
   */
  const analyzePose = useCallback(
    (userLandmarks: Landmark[], guidelineLandmarks: Landmark[]): string => {
      // 1. 정확도 계산
      const rawAccuracy = calculatePoseAccuracy(
        userLandmarks,
        guidelineLandmarks
      );

      // 2. 정확도 필터링 (부드러운 변화)
      const filteredAccuracy = accuracyFilterRef.current.filter(rawAccuracy);
      setAccuracy(filteredAccuracy);

      // 3. 피드백 생성
      const feedback =
        feedbackGeneratorRef.current.generateFeedback(filteredAccuracy);

      return feedback;
    },
    []
  );

  /**
   * 분석 상태 초기화
   */
  const resetAnalysis = useCallback(() => {
    setAccuracy(0);
    accuracyFilterRef.current.reset();
    feedbackGeneratorRef.current.reset();
  }, []);

  return {
    accuracy,
    analyzePose,
    resetAnalysis,
  };
};
