import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// 싱글톤 인스턴스 및 상태 변수
let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker> | null = null;

/**
 * MediaPipe PoseLandmarker 인스턴스를 싱글톤으로 관리하는 함수
 * 인스턴스가 이미 존재하면 재사용하고, 없으면 새로 생성
 */
export const getMediaPipeInstance = async (): Promise<PoseLandmarker> => {
  // 이미 인스턴스가 있으면 바로 반환
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  // 초기화 중이면 진행 중인 Promise 반환
  if (initPromise) {
    return initPromise;
  }

  isInitializing = true;

  // 초기화 프로미스 생성
  initPromise = (async () => {
    try {
      console.log("MediaPipe 싱글톤 인스턴스 초기화 시작");

      // 여러 버전 시도 (안정성 확보)
      let vision;
      try {
        // 먼저 안정적인 버전 시도
        vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        console.log("MediaPipe 0.10.3 버전 로드 성공");
      } catch (error) {
        console.warn("0.10.3 버전 로드 실패, 최신 버전 시도:", error);
        try {
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
          );
          console.log("MediaPipe 0.10.8 버전 로드 성공");
        } catch (fallbackError) {
          console.error("모든 MediaPipe 버전 로드 실패:", fallbackError);
          throw fallbackError;
        }
      }

      // PoseLandmarker 인스턴스 생성 (좀 더 관대한 설정)
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU", // GPU 대신 CPU 사용으로 안정성 확보
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.3, // 더 관대한 설정
        minTrackingConfidence: 0.3, // 더 관대한 설정
        outputSegmentationMasks: false,
      });

      console.log("MediaPipe 싱글톤 인스턴스 초기화 완료");
      isInitializing = false;
      return poseLandmarkerInstance;
    } catch (error) {
      console.error("MediaPipe 싱글톤 인스턴스 초기화 실패:", error);
      isInitializing = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

/**
 * MediaPipe 인스턴스 정리 함수
 * 컴포넌트 언마운트 시 호출
 */
export const cleanupMediaPipe = () => {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
      console.log("MediaPipe 인스턴스 정리 완료");
    } catch (error) {
      console.error("MediaPipe 인스턴스 정리 중 오류:", error);
    }
    poseLandmarkerInstance = null;
  }
  initPromise = null;
  isInitializing = false;
};

/**
 * MediaPipe 인스턴스 상태 확인
 * @returns 초기화 상태 객체
 */
export const getMediaPipeStatus = () => {
  return {
    isInitialized: !!poseLandmarkerInstance,
    isInitializing,
  };
};
