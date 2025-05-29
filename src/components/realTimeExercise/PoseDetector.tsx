import React, { useRef, useEffect, useState, useCallback } from "react";
import WebcamCapture from "./WebcamCapture";
import MediaPipeVisualizer from "./MediaPipeVisualizer";
import PoseMatchIndicator from "./PoseMatchIndicator";
import PoseDifferenceVisualizer from "./PoseDifferenceVisualizer";
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { useSocket, NextSetInfo } from "../../hooks/useSocket";
import { useFallMonitorSocket } from "../../hooks/useFallMonitorSocket";
import { Landmark } from "../../types";
import { cleanupMediaPipe } from "../../utils/mediaPipeSingleton";
import { usePoseAnalysis } from "../../hooks/usePoseAnalysis";

interface PoseDetectorProps {
  phoneNumber: string;
  exerciseType: string;
  visualizationMode: string;
  onCountUpdate: (count: number) => void;
  onFeedback: (message: string) => void;
  onAccuracyUpdate: (accuracy: number) => void; // 🆕 추가
  onSetComplete?: (setInfo: NextSetInfo) => void;
  isTransmitting: boolean;
  isResting?: boolean;
  isStartCountdown?: boolean;
  startCountdown?: number;
  onFallDetected?: () => void; // 🚨 낙상 감지 콜백
}

const PoseDetector: React.FC<PoseDetectorProps> = ({
  phoneNumber,
  exerciseType,
  onCountUpdate,
  onFeedback,
  onAccuracyUpdate, // 🆕 추가
  onSetComplete,
  isTransmitting,
  isResting = false,
  isStartCountdown = false,
  startCountdown = 0,
  onFallDetected,
}) => {
  // 기존 상태들...
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [hasDisconnected, setHasDisconnected] = useState<boolean>(false);
  const [mediaLoading, setMediaLoading] = useState<boolean>(true);

  // 자세 분석 훅
  const { accuracy, analyzePose, resetAnalysis } = usePoseAnalysis();

  // 🚨 낙상 감지 소켓 훅
  const {
    isConnected: fallMonitorConnected,
    sendFallMonitorData,
    fallDetected,
    resetFallDetection,
    error: fallMonitorError,
  } = useFallMonitorSocket({
    phoneNumber,
    autoConnect: true, // 컴포넌트 마운트 시 자동 연결
  });

  // 플래그 상수
  const showFace = false;
  const showGuideline = true;
  const showDifferences = true;

  const videoWidth = 1920;
  const videoHeight = 1080;

  const containerRef = useRef<HTMLDivElement>(null);
  const errorMessageRef = useRef<string>("");
  const wasTransmittingRef = useRef<boolean>(false);

  // 비디오 요소 설정 콜백
  const handleVideoElementReady = useCallback(
    (element: HTMLVideoElement | null) => {
      console.log("비디오 요소 준비:", element ? "성공" : "실패");
      setVideoElement(element);
    },
    []
  );

  // MediaPipe 초기화 전 추가 지연
  useEffect(() => {
    if (videoElement) {
      setMediaLoading(true);
      const timer = setTimeout(() => {
        setMediaLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [videoElement]);

  // MediaPipe 훅 사용
  const {
    isLoading: mediaPipeLoading,
    rawLandmarks,
    error: mediaPipeError,
  } = useMediaPipe(videoElement && !mediaLoading ? videoElement : null, {
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.3,
  });

  // 🆕 수정된 운동 분석용 Socket.io 훅 (낙상 감지 콜백 추가)
  const {
    isConnected,
    isConnecting,
    connect,
    disconnectClient,
    sendPose,
    processedResult,
  } = useSocket({
    phoneNumber,
    exerciseType,
    autoConnect: false,
    onSetComplete,
    onFallDetected, // 🆕 운동용 소켓에서도 낙상 감지 처리
  });

  // 🚨 낙상 감지 처리 (useFallMonitorSocket에서만 처리)
  useEffect(() => {
    if (fallDetected) {
      console.log("🚨 낙상이 감지되었습니다!");
      onFeedback("⚠️ 낙상이 감지되었습니다! 응급 연락이 진행 중입니다.");

      // 부모 컴포넌트에 낙상 감지 알림
      if (onFallDetected) {
        onFallDetected();
      }

      // 낙상 감지 상태 초기화 (3초 후)
      setTimeout(() => {
        resetFallDetection();
      }, 3000);
    }
  }, [fallDetected, onFeedback, onFallDetected, resetFallDetection]);

  // 🚨 낙상 감지 데이터 전송 로직
  useEffect(() => {
    if (
      fallMonitorConnected &&
      rawLandmarks.length > 0 &&
      !mediaPipeLoading &&
      !mediaLoading
    ) {
      // 200ms마다 한 번씩 낙상 감지 데이터 전송
      const now = performance.now();
      if (now - lastFrameTime >= 200) {
        const landmarksToSend: Landmark[] = rawLandmarks.map((lm) => ({
          id: lm.id,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        const sendSuccess = sendFallMonitorData(landmarksToSend);
        if (sendSuccess) {
          console.log("📡 낙상 감지 데이터 전송 성공");
        }
      }
    }
  }, [
    fallMonitorConnected,
    rawLandmarks,
    mediaPipeLoading,
    mediaLoading,
    sendFallMonitorData,
    lastFrameTime,
  ]);

  // MediaPipe 오류 상태 표시
  useEffect(() => {
    if (mediaPipeError) {
      console.error("MediaPipe 오류:", mediaPipeError);
      errorMessageRef.current = mediaPipeError.message;
      onFeedback(`포즈 감지 초기화 오류: ${mediaPipeError.message}`);
      cleanupMediaPipe();
    }
  }, [mediaPipeError, onFeedback]);

  // 🚨 낙상 감지 오류 처리
  useEffect(() => {
    if (fallMonitorError) {
      console.error("낙상 감지 오류:", fallMonitorError);
      onFeedback(`낙상 감지 연결 오류: ${fallMonitorError.message}`);
    }
  }, [fallMonitorError, onFeedback]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupMediaPipe();
      resetAnalysis();
      resetFallDetection();
      console.log("PoseDetector 컴포넌트 언마운트 - 모든 리소스 정리됨");
    };
  }, [resetAnalysis, resetFallDetection]);

  // 🎯 운동 분석 전송 상태 변화 감지 (기존 로직 유지)
  useEffect(() => {
    if (isResting || isStartCountdown) {
      wasTransmittingRef.current = isTransmitting;
      return;
    }

    if (wasTransmittingRef.current && !isTransmitting && isConnected) {
      console.log("🔴 운동 분석 전송 중단 감지 - disconnect_client 패킷 전송");
      resetAnalysis();

      if (disconnectClient) {
        disconnectClient();
        setHasDisconnected(true);
        onFeedback("운동 데이터가 서버에 저장되었습니다.");
      }
    }

    if (isTransmitting && hasDisconnected) {
      setHasDisconnected(false);
      console.log("🟢 운동 분석 전송 재시작 - 연결 해제 상태 초기화");
      resetAnalysis();
    }

    wasTransmittingRef.current = isTransmitting;
  }, [
    isTransmitting,
    isConnected,
    isResting,
    isStartCountdown,
    disconnectClient,
    hasDisconnected,
    onFeedback,
    resetAnalysis,
  ]);

  // 전신 가시성 체크 함수 (기존 로직 유지)
  const checkFullBodyVisibility = useCallback((landmarks: Landmark[]) => {
    const requiredJoints = [23, 24, 25, 26, 27, 28];

    const allVisible = requiredJoints.every((id) => {
      const landmark = landmarks.find((lm) => lm.id === id);
      return (
        landmark &&
        landmark.visibility !== undefined &&
        landmark.visibility > 0.5
      );
    });

    if (allVisible) {
      const hip = landmarks.find((lm) => lm.id === 24);
      const ankle = landmarks.find((lm) => lm.id === 28);
      const shoulder = landmarks.find((lm) => lm.id === 12);

      if (hip && ankle && shoulder) {
        const upperBodyLength = Math.abs(hip.y - shoulder.y);
        const lowerBodyLength = Math.abs(ankle.y - hip.y);
        const lowerBodyRatio = lowerBodyLength / upperBodyLength;
        return allVisible && lowerBodyRatio >= 0.7;
      }
    }

    return allVisible;
  }, []);

  // 서버에서 처리된 랜드마크를 MediaPipe 시각화 형식으로 변환 (기존 로직 유지)
  const convertToMediaPipeFormat = useCallback(
    (visualizationLandmarks: Landmark[]) => {
      if (!visualizationLandmarks || visualizationLandmarks.length === 0)
        return null;

      const orderedLandmarks = new Array(33).fill(null);

      visualizationLandmarks.forEach((lm) => {
        const id = lm.id;
        if (id !== undefined && id >= 0 && id < 33) {
          orderedLandmarks[id] = {
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 1.0,
          };
        }
      });

      return {
        landmarks: [orderedLandmarks],
        worldLandmarks: [orderedLandmarks],
      };
    },
    []
  );

  // 🎯 자세 분석 및 피드백 처리 (기존 로직 유지)
  useEffect(() => {
    if (!containerRef.current) return;

    if (rawLandmarks.length > 0) {
      console.log("현재 감지된 랜드마크 수:", rawLandmarks.length);

      const landmarksForCheck: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      const isFullBodyVisible = checkFullBodyVisibility(landmarksForCheck);

      if (!isFullBodyVisible) {
        setWarningMessage(
          "전신이 카메라에 보이지 않습니다. 카메라를 조정해주세요."
        );
      } else {
        setWarningMessage("");
      }
    } else if (!mediaPipeLoading && videoElement && !mediaLoading) {
      setWarningMessage("포즈를 감지할 수 없습니다. 카메라 앞에 서주세요.");
    }

    // 실시간 자세 분석 (운동 분석 전송 중일 때만)
    if (
      rawLandmarks.length > 0 &&
      processedResult &&
      processedResult.visualizationLandmarks &&
      processedResult.visualizationLandmarks.length > 0 &&
      isTransmitting &&
      !isResting &&
      !isStartCountdown
    ) {
      const userLandmarks: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      const feedback = analyzePose(
        userLandmarks,
        processedResult.visualizationLandmarks
      );

      if (feedback) {
        onFeedback(feedback);
      }

      // 🆕 정확도 업데이트
      onAccuracyUpdate(accuracy);
    }

    // 운동 카운트 업데이트
    if (processedResult && processedResult.exerciseCount !== undefined) {
      onCountUpdate(processedResult.exerciseCount);
    }

    if (processedResult && processedResult.feedback) {
      onFeedback(processedResult.feedback);
    }
  }, [
    rawLandmarks,
    processedResult,
    onCountUpdate,
    onFeedback,
    onAccuracyUpdate,
    mediaPipeLoading,
    videoElement,
    mediaLoading,
    checkFullBodyVisibility,
    isTransmitting,
    isResting,
    isStartCountdown,
    analyzePose,
    accuracy,
  ]);

  // 운동 분석용 소켓 자동 연결 (기존 로직 유지)
  useEffect(() => {
    if (
      videoElement &&
      rawLandmarks.length > 0 &&
      !isConnected &&
      !isConnecting &&
      isTransmitting &&
      !hasDisconnected &&
      !isResting &&
      !isStartCountdown
    ) {
      console.log("🟢 운동 분석 소켓 자동 연결 시도");
      connect();
    }
  }, [
    videoElement,
    rawLandmarks.length,
    isConnected,
    isConnecting,
    connect,
    isTransmitting,
    hasDisconnected,
    isResting,
    isStartCountdown,
  ]);

  // 운동 분석 데이터 전송 로직 (기존 로직 유지)
  useEffect(() => {
    if (
      !isTransmitting ||
      !isConnected ||
      rawLandmarks.length === 0 ||
      hasDisconnected ||
      isResting ||
      isStartCountdown
    )
      return;

    const now = performance.now();

    if (now - lastFrameTime >= 100) {
      const requestId = `req_${now}_${Math.floor(Math.random() * 10000)}`;

      const landmarksToSend: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      const sendSuccess = sendPose(landmarksToSend, requestId);
      if (sendSuccess) {
        console.log("운동 분석 데이터 전송 성공");
      }
      setLastFrameTime(now);
    }
  }, [
    isTransmitting,
    isConnected,
    rawLandmarks,
    sendPose,
    lastFrameTime,
    hasDisconnected,
    isResting,
    isStartCountdown,
  ]);

  // 서버 처리 결과 MediaPipe 형식 변환
  const processedMediaPipeResults =
    processedResult && processedResult.visualizationLandmarks?.length
      ? convertToMediaPipeFormat(processedResult.visualizationLandmarks)
      : null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* MediaPipe 로딩 상태 표시 */}
      {(mediaPipeLoading || mediaLoading) && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">
            🔄 포즈 감지 모델 로딩 중...
          </p>
        </div>
      )}

      {/* MediaPipe 오류 상태 표시 */}
      {mediaPipeError && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">
            ❌ 포즈 감지 오류:{" "}
            {errorMessageRef.current || mediaPipeError.message}
          </p>
        </div>
      )}

      {/* 🚨 낙상 감지 상태 표시 */}
      <div className="absolute top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-10">
        <p className="flex items-center text-sm">
          🚨 낙상 감지: {fallMonitorConnected ? "✅ 활성" : "❌ 비활성"}
        </p>
      </div>

      {/* 🚨 낙상 감지 알림 */}
      {fallDetected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-8 py-4 rounded-lg shadow-xl z-50">
          <p className="text-2xl font-bold text-center">🚨 낙상 감지! 🚨</p>
          <p className="text-lg text-center mt-2">응급 연락이 진행 중입니다</p>
        </div>
      )}

      {/* 경고 메시지 표시 */}
      {warningMessage && !mediaPipeLoading && !mediaLoading && (
        <div className="absolute top-4 left-0 right-0 mx-auto w-max bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">⚠️ {warningMessage}</p>
        </div>
      )}

      {/* 연결 해제 상태 표시 */}
      {hasDisconnected && (
        <div className="absolute top-16 left-0 right-0 mx-auto w-max bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">✅ 운동 데이터 저장 완료</p>
        </div>
      )}

      {/* 휴식 상태 표시 */}
      {isResting && (
        <div className="absolute top-24 left-0 right-0 mx-auto w-max bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">😴 휴식 중...</p>
        </div>
      )}

      {/* 시작 카운트다운 상태 표시 */}
      {isStartCountdown && (
        <div className="absolute top-32 left-0 right-0 mx-auto w-max bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">🏃‍♂️ 운동 준비 중...</p>
        </div>
      )}

      {/* 비디오 및 시각화 컴포넌트 (기존 로직 유지) */}
      <div className="w-full h-full">
        <WebcamCapture
          onVideoElementReady={handleVideoElementReady}
          width={videoWidth}
          height={videoHeight}
        >
          {/* 원본 랜드마크 시각화 (녹색) */}
          {videoElement &&
            rawLandmarks.length > 0 &&
            !mediaPipeLoading &&
            !mediaLoading && (
              <MediaPipeVisualizer
                videoElement={videoElement}
                results={{
                  landmarks: [rawLandmarks],
                  worldLandmarks: [rawLandmarks],
                }}
                width={videoWidth}
                height={videoHeight}
                showFace={showFace}
                color="#4ade80"
                lineWidth={3}
                pointSize={2}
              />
            )}

          {/* 서버 처리된 랜드마크 시각화 (파란색) - 연결 해제, 휴식, 시작 카운트다운 중이 아닐 때만 표시 */}
          {videoElement &&
            showGuideline &&
            processedMediaPipeResults &&
            !hasDisconnected &&
            !isResting &&
            !isStartCountdown && (
              <MediaPipeVisualizer
                videoElement={videoElement}
                results={processedMediaPipeResults}
                width={videoWidth}
                height={videoHeight}
                showFace={showFace}
                color="#60a5fa"
                lineWidth={3}
                pointSize={2}
                isGuideline={true}
              />
            )}

          {/* 두 랜드마크 간의 차이 시각화 - 연결 해제, 휴식, 시작 카운트다운 중이 아닐 때만 표시 */}
          {videoElement &&
            showDifferences &&
            rawLandmarks.length > 0 &&
            processedResult?.visualizationLandmarks &&
            processedResult.visualizationLandmarks.length > 0 &&
            !hasDisconnected &&
            !isResting &&
            !isStartCountdown && (
              <PoseDifferenceVisualizer
                videoElement={videoElement}
                userLandmarks={rawLandmarks.map((lm) => ({
                  id: lm.id,
                  x: lm.x,
                  y: lm.y,
                  z: lm.z,
                  visibility: lm.visibility,
                }))}
                guidelineLandmarks={processedResult.visualizationLandmarks}
                width={videoWidth}
                height={videoHeight}
              />
            )}

          {/* 시작 카운트다운 오버레이 - 카메라 스트림 중앙에 표시 */}
          {isStartCountdown && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-30">
              <div className="text-yellow-400 font-bold text-6xl mb-4">
                운동 시작까지
              </div>
              <div className="text-white font-bold text-9xl mb-4">
                {startCountdown}
              </div>
              <div className="text-gray-300 font-semibold text-4xl">
                준비하세요!
              </div>
            </div>
          )}
        </WebcamCapture>

        {(mediaPipeLoading || mediaLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mb-3 mx-auto text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-xl">포즈 감지 모델 로딩 중...</p>
            </div>
          </div>
        )}

        {/* 화면 우측 상단에 정확도 표시 */}
        {!hasDisconnected &&
          !mediaPipeLoading &&
          !mediaLoading &&
          !isResting &&
          !isStartCountdown && (
            <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-3 text-white">
              <div className="flex items-center">
                <span className="mr-2">정확도:</span>
                <PoseMatchIndicator similarity={accuracy} />
              </div>
              <div className="text-xs mt-1">
                랜드마크: {rawLandmarks.length}/33
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default PoseDetector;
