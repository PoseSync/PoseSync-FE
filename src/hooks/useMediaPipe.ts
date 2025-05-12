import { useEffect, useRef, useState, useCallback } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { PoseResult, Landmark } from "../types";

// PoseLandmarker 결과 타입 정의
interface PoseLandmarkerResult {
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
  const [rawLandmarks, setRawLandmarks] = useState<Landmark[]>([]);

  // 원본 MediaPipe 결과 저장 (내장 시각화용)
  const [mediaPipeResults, setMediaPipeResults] =
    useState<PoseLandmarkerResult | null>(null);

  // 객체 참조
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const mountedRef = useRef<boolean>(true);
  const videoReadyRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  // 기본 옵션값
  const {
    modelComplexity = 1,
    smoothLandmarks = true,
    minDetectionConfidence = 0.6,
    minTrackingConfidence = 0.5,
    onResults,
  } = options;

  // MediaPipe 초기화 상태 추적
  useEffect(() => {
    mountedRef.current = true;
    console.log("MediaPipe 컴포넌트 마운트됨");

    return () => {
      mountedRef.current = false;
      console.log("MediaPipe 컴포넌트 언마운트됨");
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
        const landmarksWithId = results.landmarks[0].map((lm, index) => ({
          id: index,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        setRawLandmarks(landmarksWithId);

        // PoseResult 객체 생성 (사용자 콜백용)
        const poseResult: PoseResult = {
          poseLandmarks: landmarksWithId,
          poseWorldLandmarks: results.worldLandmarks[0].map((lm, index) => ({
            id: index,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          })),
        };

        // 사용자 콜백 함수 호출
        if (onResults) onResults(poseResult);
      } catch (error) {
        console.error("포즈 결과 처리 중 오류:", error);
      } finally {
        processingRef.current = false;
      }
    },
    [onResults]
  );

  // MediaPipe Tasks 초기화 및 관리
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

    // MediaPipe 인스턴스 정리 함수
    const cleanupMediaPipe = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (poseLandmarkerRef.current) {
        try {
          poseLandmarkerRef.current.close();
          console.log("PoseLandmarker 인스턴스 닫힘");
        } catch (err) {
          console.error("PoseLandmarker 닫기 중 오류:", err);
        }
        poseLandmarkerRef.current = null;
      }
    };

    // 이전 인스턴스 정리
    cleanupMediaPipe();

    // 단일 비동기 초기화 함수
    const initializeMediaPipe = async () => {
      try {
        // MediaPipe Tasks 초기화
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        console.log("파일셋 리졸버 초기화 완료");

        // PoseLandmarker 인스턴스 생성
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          numPoses: 1,
          minPoseDetectionConfidence: minDetectionConfidence,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: minTrackingConfidence,
          outputSegmentationMasks: false,
        });

        console.log("PoseLandmarker 생성 완료");

        if (!mountedRef.current) {
          poseLandmarker.close();
          return;
        }

        poseLandmarkerRef.current = poseLandmarker;

        // 애니메이션 프레임 루프
        const detectPose = async () => {
          if (
            !mountedRef.current ||
            !poseLandmarkerRef.current ||
            !videoElement
          ) {
            return;
          }

          try {
            if (
              videoElement.readyState < 2 ||
              videoElement.paused ||
              videoElement.ended
            ) {
              animationFrameRef.current = requestAnimationFrame(detectPose);
              return;
            }

            // 포즈 감지 수행
            const results = poseLandmarkerRef.current.detect(videoElement);
            handleResults(results as PoseLandmarkerResult);
          } catch (err) {
            console.error("포즈 프레임 전송 중 오류:", err);
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

        cleanupMediaPipe();
      }
    };

    // 초기화 실행
    initializeMediaPipe();

    // 정리 함수
    return () => {
      console.log("MediaPipe Tasks 정리 시작");
      cleanupMediaPipe();
    };
  }, [
    videoElement,
    modelComplexity,
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
