import { useEffect, useRef, useState, useCallback } from "react";
import { PoseResult } from "../types";
import {
  getMediaPipeInstance,
  cleanupMediaPipe,
} from "../utils/mediaPipeSingleton";

// MediaPipe 결과 타입 정의
interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseLandmarkerResult {
  landmarks?: MediaPipeLandmark[][];
  worldLandmarks?: MediaPipeLandmark[][];
}

interface LandmarkWithId {
  id: number;
  x: number;
  y: number;
  z: number;
  visibility?: number | undefined;
}

interface UseMediaPipeOptions {
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  onResults?: (results: PoseResult) => void;
}

export const useMediaPipe = (
  videoElement: HTMLVideoElement | null,
  options: UseMediaPipeOptions = {}
) => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 랜드마크 상태 관리
  const [rawLandmarks, setRawLandmarks] = useState<LandmarkWithId[]>([]);

  // 원본 MediaPipe 결과 저장 (내장 시각화용)
  const [mediaPipeResults, setMediaPipeResults] =
    useState<PoseLandmarkerResult | null>(null);

  // 객체 참조
  const mountedRef = useRef<boolean>(true);
  const videoReadyRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const maxErrorsRef = useRef<number>(3);

  // 기본 옵션값
  const {
    smoothLandmarks = true,
    minDetectionConfidence = 0.5, // 값 낮춤
    minTrackingConfidence = 0.3, // 값 낮춤
    onResults,
  } = options;

  // MediaPipe 컴포넌트 마운트 상태 추적
  useEffect(() => {
    mountedRef.current = true;
    console.log("MediaPipe 훅 마운트됨");

    return () => {
      mountedRef.current = false;
      console.log("MediaPipe 훅 언마운트됨");

      // 애니메이션 프레임 정리
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // 비디오 요소 준비 상태 추적
  useEffect(() => {
    videoReadyRef.current = !!(videoElement && videoElement.readyState >= 2);
    console.log("비디오 준비 상태 변경:", videoReadyRef.current);

    return () => {
      videoReadyRef.current = false;
    };
  }, [videoElement]);

  // MediaPipe 결과 처리 함수
  const handleResults = useCallback(
    (results: PoseLandmarkerResult) => {
      if (!mountedRef.current || processingRef.current) return;

      processingRef.current = true;

      try {
        // 랜드마크 없음
        if (
          !results.landmarks ||
          results.landmarks.length === 0 ||
          !results.worldLandmarks ||
          results.worldLandmarks.length === 0
        ) {
          processingRef.current = false;
          return;
        }

        // 내장 시각화를 위해 원본 결과 저장
        setMediaPipeResults(results);

        // 원본 랜드마크 저장 (시각화 및 서버 전송용)
        // ID를 추가하여 저장
        const landmarksWithId: LandmarkWithId[] = results.landmarks[0].map(
          (lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z || 0,
            visibility: lm.visibility,
          })
        );

        setRawLandmarks(landmarksWithId);

        // 서버로 전송할 랜드마크는 화면의 거울 상태와 일치해야 함
        const mirrored = landmarksWithId.map((lm) => ({
          ...lm,
          x: 1 - lm.x, // x 좌표 반전 (거울 모드)
        }));

        // PoseResult 객체 생성 (사용자 콜백용)
        const poseResult: PoseResult = {
          poseLandmarks: mirrored,
          poseWorldLandmarks: results.worldLandmarks[0].map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z || 0,
            visibility: lm.visibility,
          })),
        };

        // 사용자 콜백 함수 호출
        if (onResults) onResults(poseResult);

        // 오류 카운터 리셋 (성공적으로 처리됨)
        errorCountRef.current = 0;
      } catch (error) {
        console.error("포즈 결과 처리 중 오류:", error);

        // 오류 카운터 증가
        errorCountRef.current++;

        // 연속 오류가 너무 많으면 재초기화 필요
        if (errorCountRef.current > maxErrorsRef.current) {
          setError(new Error("포즈 결과 처리 중 연속 오류 발생"));

          // 재초기화 (싱글톤 인스턴스 정리)
          cleanupMediaPipe();

          // 오류 카운터 리셋
          errorCountRef.current = 0;
        }
      } finally {
        processingRef.current = false;
      }
    },
    [onResults]
  );

  // MediaPipe Tasks 초기화 및 관리 (안정성 개선)
  useEffect(() => {
    // 비디오 요소 없음
    if (!videoElement) {
      console.log("비디오 요소가 없어 MediaPipe 초기화를 건너뜁니다");
      return;
    }

    // 비디오 준비 안됨
    if (videoElement.readyState < 2) {
      console.log("비디오가 준비되지 않았습니다. 준비되면 초기화합니다");
      return;
    }

    console.log("MediaPipe Tasks 초기화 시작");
    setIsLoading(true);

    // 이전 애니메이션 프레임 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 안정적인 초기화 함수
    const initializeMediaPipe = async () => {
      try {
        // 싱글톤 인스턴스 가져오기
        const poseLandmarker = await getMediaPipeInstance();

        if (!mountedRef.current) {
          return;
        }

        console.log("MediaPipe 인스턴스 준비 완료, 비디오 프레임 처리 시작");

        // 애니메이션 프레임 루프 (성능 최적화)
        let lastVideoTime = -1;
        const detectPose = async () => {
          if (!mountedRef.current || !videoElement || !poseLandmarker) {
            return;
          }

          try {
            // 비디오 상태 확인
            if (
              videoElement.readyState < 2 ||
              videoElement.paused ||
              videoElement.ended
            ) {
              animationFrameRef.current = requestAnimationFrame(detectPose);
              return;
            }

            // 프레임 스키핑으로 성능 최적화 (30fps로 제한)
            const now = performance.now();
            if (now - lastProcessTimeRef.current < 33) {
              // 약 30fps
              animationFrameRef.current = requestAnimationFrame(detectPose);
              return;
            }

            const currentTime = videoElement.currentTime;

            // 비디오 프레임이 변경되었을 때만 처리
            if (currentTime !== lastVideoTime) {
              lastVideoTime = currentTime;
              lastProcessTimeRef.current = now;

              // 포즈 감지 수행
              const results = await poseLandmarker.detectForVideo(
                videoElement,
                now
              );

              handleResults(results as PoseLandmarkerResult);
            }
          } catch (err) {
            console.error("포즈 프레임 처리 중 오류:", err);
            // 오류 카운터 증가
            errorCountRef.current++;

            // 연속 오류가 너무 많으면 재초기화 필요
            if (errorCountRef.current > maxErrorsRef.current) {
              setError(new Error("포즈 프레임 처리 중 연속 오류 발생"));

              // 재초기화 로직
              cleanupMediaPipe();

              // 1초 후 다시 시도
              setTimeout(() => {
                if (mountedRef.current) {
                  errorCountRef.current = 0;
                  initializeMediaPipe();
                }
              }, 1000);

              return;
            }
          }

          animationFrameRef.current = requestAnimationFrame(detectPose);
        };

        // 감지 시작
        animationFrameRef.current = requestAnimationFrame(detectPose);

        if (mountedRef.current) {
          setIsLoading(false);
          setError(null);
          console.log("MediaPipe Tasks 초기화 완료");
        }
      } catch (err) {
        console.error("MediaPipe Tasks 초기화 오류:", err);

        if (mountedRef.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("MediaPipe Tasks 초기화 실패")
          );
          setIsLoading(false);
        }
      }
    };

    // 초기화 실행 (약간의 지연으로 안정성 확보)
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        initializeMediaPipe();
      }
    }, 500);

    // 정리 함수
    return () => {
      clearTimeout(timeoutId);
      console.log("MediaPipe Tasks 정리 시작");

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    videoElement,
    smoothLandmarks,
    minDetectionConfidence,
    minTrackingConfidence,
    handleResults,
  ]);

  return {
    isLoading,
    error,
    rawLandmarks, // 시각화 및 서버 전송용 원본 좌표
    mediaPipeResults, // 내장 시각화용 원본 결과
  };
};
