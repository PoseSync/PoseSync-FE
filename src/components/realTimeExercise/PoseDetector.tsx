import React, { useRef, useEffect, useState, useCallback } from "react";
import WebcamCapture from "./WebcamCapture";
import MediaPipeVisualizer from "./MediaPipeVisualizer";
import PoseMatchIndicator from "./PoseMatchIndicator";
import PoseDifferenceVisualizer from "./PoseDifferenceVisualizer";
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { useSocket, NextSetInfo } from "../../hooks/useSocket";
import { Landmark } from "../../types";
import { cleanupMediaPipe } from "../../utils/mediaPipeSingleton";

interface PoseDetectorProps {
  phoneNumber: string;
  exerciseType: string;
  visualizationMode: string;
  onCountUpdate: (count: number) => void;
  onFeedback: (message: string) => void;
  onSetComplete?: (setInfo: NextSetInfo) => void; // 🎯 세트 완료 콜백
  isTransmitting: boolean;
  isResting?: boolean; // 🎯 휴식 상태
  isStartCountdown?: boolean; // 🆕 시작 카운트다운 상태
  startCountdown?: number; // 🆕 시작 카운트다운 값
}

const PoseDetector: React.FC<PoseDetectorProps> = ({
  phoneNumber,
  exerciseType,
  onCountUpdate,
  onFeedback,
  onSetComplete,
  isTransmitting,
  isResting = false, // 🎯 기본값 false
  isStartCountdown = false, // 🆕 기본값 false
  startCountdown = 0, // 🆕 기본값 0
}) => {
  // 기본 상태
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [similarity, setSimilarity] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [hasDisconnected, setHasDisconnected] = useState<boolean>(false); // 연결 해제 상태 추적
  const [mediaLoading, setMediaLoading] = useState<boolean>(true);

  // 플래그 상수 (상태 변수가 아닌 상수로 정의하여 불필요한 경고 제거)
  const showFace = false;
  const showGuideline = true;
  const showDifferences = true;

  // VideoContainer 크기에 맞게 비디오 크기 조정 - 1920x1080으로 수정
  const videoWidth = 1920;
  const videoHeight = 1080;

  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);
  const errorMessageRef = useRef<string>("");

  // 🎯 이전 전송 상태 추적
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

  // MediaPipe 훅 사용 (더 관대한 설정으로 안정성 확보)
  const {
    isLoading: mediaPipeLoading,
    rawLandmarks,
    error: mediaPipeError,
  } = useMediaPipe(videoElement && !mediaLoading ? videoElement : null, {
    smoothLandmarks: true,
    minDetectionConfidence: 0.5, // 기존 0.6에서 0.5로 낮춤
    minTrackingConfidence: 0.3, // 기존 0.5에서 0.3으로 낮춤
  });

  // Socket.io 훅 사용 - 🎯 onSetComplete 콜백 추가
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
    onSetComplete, // 🎯 세트 완료 콜백 전달
  });

  // MediaPipe 오류 상태 표시
  useEffect(() => {
    if (mediaPipeError) {
      console.error("MediaPipe 오류:", mediaPipeError);
      errorMessageRef.current = mediaPipeError.message;
      onFeedback(`포즈 감지 초기화 오류: ${mediaPipeError.message}`);

      // MediaPipe 인스턴스 정리 후 재시도
      cleanupMediaPipe();
    }
  }, [mediaPipeError, onFeedback]);

  // 랜드마크 감지 상태 로깅
  useEffect(() => {
    if (rawLandmarks.length > 0) {
      console.log("랜드마크 감지됨:", rawLandmarks.length, "개");
    } else if (!mediaPipeLoading && videoElement && !mediaLoading) {
      console.log("랜드마크 감지되지 않음");
    }
  }, [rawLandmarks.length, mediaPipeLoading, videoElement, mediaLoading]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // MediaPipe 정리
      cleanupMediaPipe();
      console.log("PoseDetector 컴포넌트 언마운트 - MediaPipe 정리됨");
    };
  }, []);

  // 🎯 isTransmitting 상태 변화 감지하여 disconnect_client 패킷 전송
  useEffect(() => {
    // 전송 중이었다가 중단된 경우 (휴식 상태나 시작 카운트다운이 아닐 때만)
    if (
      wasTransmittingRef.current &&
      !isTransmitting &&
      isConnected &&
      !isResting &&
      !isStartCountdown // 🆕 시작 카운트다운 중이 아닐 때만
    ) {
      console.log("🔴 전송 중단 감지 - disconnect_client 패킷 전송");

      if (disconnectClient) {
        disconnectClient();
        setHasDisconnected(true);
        onFeedback("운동 데이터가 서버에 저장되었습니다.");
      }
    }

    // 전송 상태가 다시 시작되면 연결 해제 상태 초기화
    if (isTransmitting && hasDisconnected) {
      setHasDisconnected(false);
      console.log("🟢 전송 재시작 - 연결 해제 상태 초기화");
    }

    // 현재 전송 상태를 이전 상태로 저장
    wasTransmittingRef.current = isTransmitting;
  }, [
    isTransmitting,
    isConnected,
    isResting,
    isStartCountdown, // 🆕 시작 카운트다운 의존성 추가
    disconnectClient,
    hasDisconnected,
    onFeedback,
  ]);

  // 전신 가시성 체크 함수 - 안정화된 버전
  const checkFullBodyVisibility = useCallback((landmarks: Landmark[]) => {
    // 필수 랜드마크 ID (하체 관절)
    const requiredJoints = [
      23,
      24, // 왼쪽/오른쪽 고관절
      25,
      26, // 왼쪽/오른쪽 무릎
      27,
      28, // 왼쪽/오른쪽 발목
    ];

    // 모든 필수 관절의 가시성 확인
    const allVisible = requiredJoints.every((id) => {
      const landmark = landmarks.find((lm) => lm.id === id);
      return (
        landmark &&
        landmark.visibility !== undefined &&
        landmark.visibility > 0.5
      );
    });

    // 하체 길이가 충분히 보이는지 확인
    if (allVisible) {
      const hip = landmarks.find((lm) => lm.id === 24); // 오른쪽 고관절
      const ankle = landmarks.find((lm) => lm.id === 28); // 오른쪽 발목
      const shoulder = landmarks.find((lm) => lm.id === 12); // 오른쪽 어깨

      if (hip && ankle && shoulder) {
        const upperBodyLength = Math.abs(hip.y - shoulder.y);
        const lowerBodyLength = Math.abs(ankle.y - hip.y);
        const lowerBodyRatio = lowerBodyLength / upperBodyLength;

        // 하체가 상체의 최소 70% 길이는 되어야 함
        return allVisible && lowerBodyRatio >= 0.7;
      }
    }

    return allVisible;
  }, []);

  // 서버에서 처리된 랜드마크를 MediaPipe 시각화 형식으로 변환
  const convertToMediaPipeFormat = useCallback(
    (visualizationLandmarks: Landmark[]) => {
      if (!visualizationLandmarks || visualizationLandmarks.length === 0)
        return null;

      // 서버에서 받은 시각화용 랜드마크를 MediaPipe format으로 변환
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

  // 자세 유사도 계산 - 안정화된 버전
  useEffect(() => {
    // 컴포넌트가 마운트 상태인지 확인
    if (!containerRef.current) return;

    // rawLandmarks가 있을 때만 전신 가시성 확인
    if (rawLandmarks.length > 0) {
      console.log("현재 감지된 랜드마크 수:", rawLandmarks.length);

      // 타입 오류 수정: rawLandmarks를 Landmark[] 타입으로 변환
      const landmarksForCheck: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      // 전신 가시성 확인
      const isFullBodyVisible = checkFullBodyVisibility(landmarksForCheck);

      if (!isFullBodyVisible) {
        setWarningMessage(
          "전신이 카메라에 보이지 않습니다. 카메라를 조정해주세요."
        );
      } else {
        setWarningMessage("");
      }
    } else if (!mediaPipeLoading && videoElement && !mediaLoading) {
      // MediaPipe가 로딩이 완료되었는데도 랜드마크가 감지되지 않는 경우
      setWarningMessage("포즈를 감지할 수 없습니다. 카메라 앞에 서주세요.");
    }

    // 유사도 계산 및 운동 카운트 업데이트
    if (
      rawLandmarks.length > 0 &&
      processedResult &&
      processedResult.visualizationLandmarks &&
      processedResult.visualizationLandmarks.length > 0
    ) {
      // 유사도 계산
      // 단순화를 위해 먼저 유사도 값을 계산 없이 설정
      const similarityPercentage = processedResult.similarity ?? 70; // 기본값 제공
      setSimilarity(similarityPercentage);

      // 운동 카운트 업데이트
      if (processedResult.exerciseCount !== undefined) {
        onCountUpdate(processedResult.exerciseCount);
      }

      // 피드백 처리
      if (processedResult.feedback) {
        onFeedback(processedResult.feedback);
      }
    }
  }, [
    rawLandmarks,
    processedResult,
    onCountUpdate,
    onFeedback,
    mediaPipeLoading,
    videoElement,
    mediaLoading,
    checkFullBodyVisibility, // 이제 useCallback으로 안정화됨
  ]);

  // 비디오 요소가 준비되면 자동으로 소켓 연결 시도
  useEffect(() => {
    if (
      videoElement &&
      rawLandmarks.length > 0 &&
      !isConnected &&
      !isConnecting &&
      isTransmitting && // 전송 중일 때만 연결 시도
      !hasDisconnected && // 연결 해제되지 않았을 때만
      !isResting && // 🎯 휴식 중이 아닐 때만 연결 시도
      !isStartCountdown // 🆕 시작 카운트다운 중이 아닐 때만 연결 시도
    ) {
      // 랜드마크가 감지되고 전송 중일 때만 자동 연결 시도
      console.log("🟢 자동 소켓 연결 시도");
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
    isResting, // 🎯 휴식 상태 의존성 추가
    isStartCountdown, // 🆕 시작 카운트다운 의존성 추가
  ]);

  // 데이터 전송 로직
  useEffect(() => {
    if (
      !isTransmitting ||
      !isConnected ||
      rawLandmarks.length === 0 ||
      hasDisconnected ||
      isResting || // 🎯 휴식 중에는 전송하지 않음
      isStartCountdown // 🆕 시작 카운트다운 중에는 전송하지 않음
    )
      return;

    const now = performance.now();

    // 최소 100ms 간격으로 전송 (최대 10fps)
    if (now - lastFrameTime >= 100) {
      // requestId 생성
      const requestId = `req_${now}_${Math.floor(Math.random() * 10000)}`;

      // 타입 오류 수정: rawLandmarks를 Landmark[] 타입으로 변환하여 전송
      const landmarksToSend: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      // 랜드마크 전송
      const sendSuccess = sendPose(landmarksToSend, requestId);
      if (sendSuccess) {
        console.log("랜드마크 데이터 전송 성공");
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
    isResting, // 🎯 휴식 상태 의존성 추가
    isStartCountdown, // 🆕 시작 카운트다운 의존성 추가
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

      {/* 🎯 휴식 상태 표시 */}
      {isResting && (
        <div className="absolute top-24 left-0 right-0 mx-auto w-max bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">😴 휴식 중...</p>
        </div>
      )}

      {/* 🆕 시작 카운트다운 상태 표시 */}
      {isStartCountdown && (
        <div className="absolute top-32 left-0 right-0 mx-auto w-max bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">🏃‍♂️ 운동 준비 중...</p>
        </div>
      )}

      {/* 비디오 및 시각화 컴포넌트 */}
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
                color="#4ade80" // 밝은 녹색
                lineWidth={3}
                pointSize={2}
              />
            )}

          {/* 서버 처리된 랜드마크 시각화 (파란색) - 연결 해제, 휴식, 시작 카운트다운 중이 아닐 때만 표시 */}
          {videoElement &&
            showGuideline &&
            processedMediaPipeResults &&
            !hasDisconnected &&
            !isResting && // 🎯 휴식 중에는 가이드라인 숨김
            !isStartCountdown && ( // 🆕 시작 카운트다운 중에는 가이드라인 숨김
              <MediaPipeVisualizer
                videoElement={videoElement}
                results={processedMediaPipeResults}
                width={videoWidth}
                height={videoHeight}
                showFace={showFace}
                color="#60a5fa" // 밝은 파란색
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
            !isResting && // 🎯 휴식 중에는 차이 시각화 숨김
            !isStartCountdown && ( // 🆕 시작 카운트다운 중에는 차이 시각화 숨김
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

          {/* 🆕 시작 카운트다운 오버레이 - 카메라 스트림 중앙에 표시 */}
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

        {/* 화면 우측 상단에 정확도 표시 - 연결 해제, 휴식, 시작 카운트다운 중이 아닐 때만 표시 */}
        {!hasDisconnected &&
          !mediaPipeLoading &&
          !mediaLoading &&
          !isResting &&
          !isStartCountdown && ( // 🆕 시작 카운트다운 중에는 정확도 숨김
            <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-3 text-white">
              <div className="flex items-center">
                <span className="mr-2">정확도:</span>
                <PoseMatchIndicator similarity={similarity} />
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
