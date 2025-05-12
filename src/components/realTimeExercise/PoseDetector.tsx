import { useState, useCallback, useEffect, useRef } from "react";
import WebcamCapture from "./WebcamCapture";
import MediaPipeVisualizer from "./MediaPipeVisualizer";
import PoseMatchIndicator from "./PoseMatchIndicator";
import LandmarkComparisonView from "./LandmarkComparisonView";
import PoseDifferenceVisualizer from "./PoseDifferenceVisualizer";
import PoseVisualizer3D from "./PoseVisualizer3D";
import { useMediaPipe } from "../hooks/useMediaPipe";
import { useSocket } from "../hooks/useSocket";
import { Landmark, MediaPipeLandmark } from "../types";
import { calculatePoseSimilarity } from "../utils/poseUtils";
import LatencyMonitor from "./LatencyMonitor";

interface PoseDetectorProps {
  phoneNumber: string;
  exerciseType: string;
  visualizationMode: string;
}

// MediaPipe 형식 결과 인터페이스
interface MediaPipeResults {
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

const PoseDetector = ({
  phoneNumber,
  exerciseType,
  visualizationMode,
}: PoseDetectorProps) => {
  // 상태 관리
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [showFace, setShowFace] = useState<boolean>(false);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [customServerUrl, setCustomServerUrl] = useState<string>("");
  const [showGuideline, setShowGuideline] = useState<boolean>(true);
  const [similarity, setSimilarity] = useState<number>(0);
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [exercisePhase, setExercisePhase] = useState<"up" | "down" | "hold">(
    "up"
  );
  const [isCountingEnabled, setIsCountingEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showComparisonView, setShowComparisonView] = useState<boolean>(false);
  const [showDifferences, setShowDifferences] = useState<boolean>(true);
  const [isFullBodyVisible, setIsFullBodyVisible] = useState<boolean>(true);
  const [warningMessage, setWarningMessage] = useState<string>("");

  // requestId별 랜드마크 캐시 상태 추가
  const [rawLandmarksCache, setRawLandmarksCache] = useState<
    Record<string, { rawLandmarks: MediaPipeLandmark[]; timestamp: number }>
  >({});

  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);

  // FPS 계산을 위한 참조
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const rawLandmarksRef = useRef<Landmark[]>([]);

  // 운동 카운트 관련 상태
  const lastMatchTimeRef = useRef<number>(0);
  const matchThresholdRef = useRef<number>(0.85); // 85% 이상 일치하면 카운트 (더 엄격하게 변경)
  const exercisePhaseRef = useRef<string>("up");
  const lastPhaseChangeTimeRef = useRef<number>(0);
  const minPhaseDurationRef = useRef<number>(500); // 최소 0.5초 이상 유지되어야 함

  // 전체 화면 토글
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(`전체 화면 전환 오류: ${err.message}`);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error(`전체 화면 종료 오류: ${err.message}`);
        });
    }
  }, []);

  // 비디오 요소 설정 콜백
  const handleVideoElementReady = useCallback(
    (element: HTMLVideoElement | null) => {
      console.log("비디오 요소 준비됨:", element ? "있음" : "없음");
      if (element) {
        console.log(
          "비디오 정보:",
          element.videoWidth,
          "x",
          element.videoHeight,
          "상태:",
          element.readyState
        );
      }
      setVideoElement(element);
    },
    []
  );

  // MediaPipe 훅 사용
  const {
    isLoading: mediaPipeLoading,
    error: mediaPipeError,
    rawLandmarks,
    mediaPipeResults,
  } = useMediaPipe(videoElement, {
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });

  // Socket.io 훅 사용
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    disconnectClient,
    sendPose,
    processedResult, //서버에서 전달받은 결과
    error: socketError,
    connectionAttempts,
    serverUrl,
    setCustomServerUrl: setSocketServerUrl,
    latencyStats,
  } = useSocket({
    phoneNumber,
    exerciseType,
    autoConnect: false,
  });

  // 원본 랜드마크 저장 - 수정: ID 필드 추가
  useEffect(() => {
    if (rawLandmarks && rawLandmarks.length > 0) {
      // 원본 랜드마크에 id 필드를 추가하여 저장
      // rawLandmarksRef.current = rawLandmarks.map((lm, idx) => ({
      //   id: idx, // 인덱스를 ID로 추가
      //   ...lm,
      // }));

      if (showDebug) {
        console.log(
          "원본 랜드마크에 ID 필드 추가됨:",
          rawLandmarksRef.current.length,
          "개 랜드마크"
        );
      }
    }
  }, [rawLandmarks, showDebug]);

  /**
   * 서버에서 처리된 랜드마크를 MediaPipe 시각화 형식으로 변환하는 함수
   * 개선된 역변환 로직 적용
   */
  const convertToMediaPipeFormat = useCallback(
    // (processedLandmarks: Landmark[]): MediaPipeResults | null => {
    (visualizationLandmarks) => {
      // if (!processedLandmarks || processedLandmarks.length === 0)
      //   return null;

      // 😀 서버에서 받은 시각화용 랜드마크를 그대로 MediaPipe format으로 래핑합니다.
      const orderedLandmarks = new Array(33).fill(null);

      // processedLandmarks.forEach((lm) => {
      visualizationLandmarks.forEach((lm) => {
        const id = lm.id ?? -1;
        if (id >= 0 && id < 33) {
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
    [] // dependencies 없이 static 함수로 사용 가능합니다.
  );

  // 전신 가시성 체크 함수
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

    // 하체 길이가 충분히 보이는지 확인 (고관절-발목 간 거리)
    let lowerBodyRatio = 0;
    if (allVisible) {
      const hip = landmarks.find((lm) => lm.id === 24); // 오른쪽 고관절
      const ankle = landmarks.find((lm) => lm.id === 28); // 오른쪽 발목
      const shoulder = landmarks.find((lm) => lm.id === 12); // 오른쪽 어깨

      if (hip && ankle && shoulder) {
        const upperBodyLength = Math.abs(hip.y - shoulder.y);
        const lowerBodyLength = Math.abs(ankle.y - hip.y);
        lowerBodyRatio = lowerBodyLength / upperBodyLength;

        // 하체가 상체의 최소 70% 길이는 되어야 함
        return allVisible && lowerBodyRatio >= 0.7;
      }
    }

    return allVisible;
  }, []);

  // 자세 유사도 계산 useEffect 부분 수정
  useEffect(() => {
    // rawLandmarks가 있을 때만 전신 가시성 확인
    if (rawLandmarks.length > 0) {
      // 전신 가시성 확인 (오직 rawLandmarks로만 체크)
      const fullBodyVisible = checkFullBodyVisibility(rawLandmarks);
      setIsFullBodyVisible(fullBodyVisible);

      if (!fullBodyVisible) {
        setWarningMessage(
          "전신이 카메라에 보이지 않습니다. 카메라를 조정해주세요."
        );
      } else {
        setWarningMessage("");
      }
    }

    // 이후 유사도 계산은 rawLandmarks와 processedResult 모두 필요할 때만 수행
    if (
      rawLandmarks.length > 0 &&
      processedResult &&
      processedResult.visualizationLandmarks &&
      processedResult.visualizationLandmarks.length > 0
    ) {
      // 유사도 계산 (낮을수록 더 유사함)
      const sim = calculatePoseSimilarity(
        processedResult.visualizationLandmarks,
        rawLandmarks
      );
      const similarityPercentage = Math.max(0, Math.min(100, 100 - sim * 100));
      setSimilarity(similarityPercentage);

      // 운동 카운트 로직...
      if (isCountingEnabled) {
        // 기존 카운팅 로직...
      }
    }
  }, [
    rawLandmarks,
    processedResult,
    isCountingEnabled,
    checkFullBodyVisibility,
  ]);

  // 커스텀 서버 URL 설정
  const handleServerUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomServerUrl(e.target.value);
    },
    []
  );

  const applyCustomServerUrl = useCallback(() => {
    if (customServerUrl.trim()) {
      setSocketServerUrl(customServerUrl);
      alert(
        `서버 URL이 ${customServerUrl}로 변경되었습니다. 다시 연결해주세요.`
      );
      if (isConnected) {
        disconnect();
      }
    }
  }, [customServerUrl, setSocketServerUrl, isConnected, disconnect]);

  // FPS 계산
  useEffect(() => {
    const updateFps = () => {
      const now = performance.now();
      frameCountRef.current++;

      // 0.5초마다 FPS 업데이트
      if (now - lastFpsUpdateRef.current > 500) {
        setFps(
          Math.round(
            (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
          )
        );
        lastFpsUpdateRef.current = now;
        frameCountRef.current = 0;
      }

      animationFrameRef.current = requestAnimationFrame(updateFps);
    };

    animationFrameRef.current = requestAnimationFrame(updateFps);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 소켓 연결 토글
  const toggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
      setIsTransmitting(false);
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  // 포즈 데이터 전송 토글
  const toggleTransmission = useCallback(() => {
    setIsTransmitting((prev) => {
      if (prev) {
        disconnectClient();
        return false;
      } else {
        if (!isConnected) connect();
        return true;
      }
    });
  }, [disconnectClient, isConnected, connect]);

  // 디버그 토글
  const toggleDebug = useCallback(() => {
    setShowDebug((prev) => !prev);
  }, []);

  // 얼굴 표시 토글
  const toggleFace = useCallback(() => {
    setShowFace((prev) => !prev);
  }, []);

  // 가이드라인 표시 토글
  const toggleGuideline = useCallback(() => {
    setShowGuideline((prev) => !prev);
  }, []);

  // 랜드마크 차이 표시 토글
  const toggleDifferences = useCallback(() => {
    setShowDifferences((prev) => !prev);
  }, []);

  // 운동 카운트 토글
  const toggleCounting = useCallback(() => {
    setIsCountingEnabled((prev) => !prev);
  }, []);

  // 운동 카운트 초기화
  const resetCounter = useCallback(() => {
    setExerciseCount(0);
    setExercisePhase("up");
    exercisePhaseRef.current = "up";
  }, []);

  // 비디오 요소가 준비되면 자동으로 소켓 연결 시도
  useEffect(() => {
    if (
      videoElement &&
      rawLandmarks.length > 0 &&
      !isConnected &&
      !isConnecting
    ) {
      // 랜드마크가 감지되면 자동 연결 시도
      console.log("랜드마크 감지됨, 소켓 연결 시도");
      connect();
    }
  }, [videoElement, rawLandmarks.length, isConnected, isConnecting, connect]);

  // 데이터 전송 로직
  useEffect(() => {
    if (!isTransmitting || !isConnected || rawLandmarks.length === 0) return;

    const now = performance.now();

    // 최소 100ms 간격으로 전송 (최대 10fps)
    if (now - lastFrameTime >= 100) {
      // requestId 생성
      const requestId = `req_${now}_${Math.floor(Math.random() * 10000)}`;

      // 현재 rawLandmarks 캐싱
      // if (rawLandmarks && rawLandmarks.length > 0) {
      //   setRawLandmarksCache(prev => ({
      //     ...prev,
      //     [requestId]: {
      //       rawLandmarks: [...rawLandmarks],
      //       timestamp: now
      //     }
      //   }));
      // }

      // rawLandmarks에 ID 추가
      const landmarksToSend = rawLandmarks.map((lm, idx) => ({
        ...lm,
        id: idx,
      }));

      // 변환된 정밀 3D 좌표 전송 (requestId와 함께)
      if (sendPose(landmarksToSend, requestId)) {
        // console.log(`전송 완료: ${requestId}`);
      }

      setLastFrameTime(now);
    }
  }, [
    isTransmitting,
    isConnected,
    rawLandmarks,
    sendPose,
    lastFrameTime,
    rawLandmarks,
  ]);

  // 캐시 정리 (메모리 누수 방지)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = performance.now();
      setRawLandmarksCache((prev) => {
        const cleaned = { ...prev };
        Object.keys(cleaned).forEach((key) => {
          // 10초 이상 된 캐시 삭제
          if (now - cleaned[key].timestamp > 10000) {
            delete cleaned[key];
          }
        });
        return cleaned;
      });
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // 에러 메시지
  const errorMessage = mediaPipeError?.message || socketError?.message;

  // 서버 처리 결과 MediaPipe 형식 변환
  const processedMediaPipeResults =
    processedResult && processedResult.visualizationLandmarks?.length
      ? convertToMediaPipeFormat(processedResult.visualizationLandmarks)
      : null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center max-w-full mx-auto px-4 relative"
    >
      <h1 className="text-3xl font-bold mb-4 text-indigo-700">
        PoseSync 실시간 분석 - {exerciseType}
      </h1>

      <div className="w-full flex flex-col gap-6">
        {/* 비디오와 자세 시각화 - 전체 너비로 확장 */}
        <div className="w-full">
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
            {visualizationMode === "2d" ? (
              // 2D 시각화 모드
              <WebcamCapture
                onVideoElementReady={handleVideoElementReady}
                width={1280}
                height={720}
              >
                {/* 원본 랜드마크 시각화 (녹색) */}
                {videoElement && mediaPipeResults && (
                  <MediaPipeVisualizer
                    videoElement={videoElement}
                    results={{
                      // 1차원 원본 배열을 2차원 배열로 감싸기
                      landmarks: [rawLandmarks],
                      worldLandmarks: [rawLandmarks],
                    }}
                    width={1280}
                    height={720}
                    showFace={showFace}
                    color="#4ade80" // 밝은 녹색
                    lineWidth={1}
                    pointSize={1}
                  />
                )}

                {/* 서버 처리된 랜드마크를 MediaPipe 형식으로 시각화 (파란색) */}
                {videoElement && showGuideline && processedMediaPipeResults && (
                  <MediaPipeVisualizer
                    videoElement={videoElement}
                    results={processedMediaPipeResults}
                    width={1280}
                    height={720}
                    showFace={showFace}
                    color="#60a5fa" // 밝은 파란색
                    lineWidth={3}
                    pointSize={4}
                    isGuideline={true}
                  />
                )}

                {/* 두 랜드마크 간의 차이 시각화 */}
                {videoElement &&
                  showDifferences &&
                  rawLandmarks.length > 0 &&
                  processedResult?.visualizationLandmarks &&
                  processedResult.visualizationLandmarks.length > 0 && (
                    <PoseDifferenceVisualizer
                      videoElement={videoElement}
                      userLandmarks={rawLandmarks}
                      guidelineLandmarks={
                        processedResult.visualizationLandmarks
                      }
                      width={1280}
                      height={720}
                    />
                  )}
              </WebcamCapture>
            ) : (
              // 3D 시각화 모드
              <div>
                <WebcamCapture
                  onVideoElementReady={handleVideoElementReady}
                  width={1280}
                  height={720}
                  hidden={true}
                />
                <PoseVisualizer3D
                  userLandmarks={rawLandmarks}
                  guidelineLandmarks={
                    processedResult?.visualizationLandmarks || []
                  }
                  width={1280}
                  height={720}
                  showGuideline={showGuideline}
                  showDifferences={showDifferences}
                />
              </div>
            )}

            {mediaPipeLoading && (
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

            {/* 화면 우측 상단에 운동 카운터와 정확도 표시 */}
            <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-3 text-white">
              <div className="text-3xl font-bold mb-1 flex items-center">
                <span className="mr-2">🏋️</span>
                <span className="text-4xl text-yellow-400">
                  {exerciseCount}
                </span>
                <span className="text-lg opacity-70 ml-1">회</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">정확도:</span>
                <PoseMatchIndicator similarity={similarity} />
              </div>
              <div className="text-sm mt-1">
                현재 상태:
                <span
                  className={
                    exercisePhase === "down"
                      ? "text-green-400 ml-1"
                      : "text-red-400 ml-1"
                  }
                >
                  {exercisePhase === "down" ? "내려감 ↓" : "올라감 ↑"}
                </span>
              </div>
            </div>

            {/* 전체 보이지 않을 때 경고 표시 */}
            {warningMessage && (
              <div className="absolute top-16 left-0 right-0 mx-auto w-max bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="flex items-center text-sm">⚠️ {warningMessage}</p>
              </div>
            )}

            {/* 전체 화면 버튼 (좌측 상단) */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-3 left-3 bg-black bg-opacity-50 p-2 rounded text-white"
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 5.5a.5.5 0 00-.5.5v3a.5.5 0 01-.5.5.5.5 0 01-.5-.5V5a1 1 0 011-1h3.5a.5.5 0 010 1H5zM5 14.5a.5.5 0 00.5.5h3a.5.5 0 01.5.5.5.5 0 01-.5.5H5a1 1 0 01-1-1v-3.5a.5.5 0 11 0V15zm14-14a1 1 0 011 1v3.5a.5.5 0 11-1 0V5a.5.5 0 00-.5-.5h-3a.5.5 0 110-1H19zm0 14a1 1 0 01-1 1h-3.5a.5.5 0 010-1H17a.5.5 0 00.5-.5v-3a.5.5 0 11 0V19z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6.5L11 10.5V6a1 1 0 012 0v4a1 1 0 01-1 1H8a1 1 0 010-2h2.5L6 4.5V9a1 1 0 01-2 0V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6.5L14.5 10H18a1 1 0 010 2h-4a1 1 0 01-1-1V7a1 1 0 012 0v2.5L18.5 6H15a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* 컨트롤 패널 */}
          <div className="mt-4 bg-gray-100 rounded-lg p-4 shadow flex flex-wrap gap-3 justify-center">
            <button
              onClick={toggleConnection}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isConnected
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white shadow`}
              disabled={isConnecting}
            >
              {isConnecting
                ? "연결 중..."
                : isConnected
                ? "서버 연결 해제"
                : "서버 연결"}
            </button>

            {isConnected && (
              <button
                onClick={toggleTransmission}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isTransmitting
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white shadow`}
                disabled={!isConnected}
              >
                {isTransmitting ? "전송 중지" : "전송 시작"}
              </button>
            )}

            <button
              onClick={toggleGuideline}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                showGuideline
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white shadow`}
            >
              {showGuideline ? "가이드라인 숨기기" : "가이드라인 표시"}
            </button>

            <button
              onClick={toggleDifferences}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                showDifferences
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white shadow`}
            >
              {showDifferences ? "차이 표시 숨기기" : "차이 표시"}
            </button>

            <button
              onClick={() => setShowComparisonView(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white shadow"
            >
              랜드마크 비교 분석
            </button>

            <button
              onClick={toggleFace}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                showFace
                  ? "bg-pink-500 hover:bg-pink-600"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white shadow`}
            >
              {showFace ? "얼굴 숨기기" : "얼굴 표시"}
            </button>

            <button
              onClick={toggleCounting}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isCountingEnabled
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white shadow`}
            >
              {isCountingEnabled ? "카운팅 중지" : "카운팅 시작"}
            </button>

            <button
              onClick={resetCounter}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white shadow"
            >
              카운터 초기화
            </button>

            <button
              onClick={toggleDebug}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white shadow"
            >
              {showDebug ? "디버그 숨기기" : "디버그 표시"}
            </button>
          </div>

          {/* 상태 표시 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-500">완료 횟수</p>
              <p className="text-2xl font-bold text-blue-600">
                {exerciseCount}회
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-500">현재 상태</p>
              <p className="text-lg font-bold text-green-600">
                {exercisePhase === "down" ? "내려감" : "올라감"}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-500">정확도</p>
              <p className="text-lg font-bold text-purple-600">
                {Math.round(similarity)}%
              </p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-500">프레임 속도</p>
              <p className="text-lg font-bold text-indigo-600">{fps} FPS</p>
            </div>
          </div>
        </div>
      </div>

      {/* 디버그 정보 */}
      {showDebug && (
        <div className="w-full mt-6 p-3 bg-gray-100 rounded-lg text-xs max-h-60 overflow-y-auto border border-gray-200">
          <h3 className="font-bold mb-1">디버그 정보:</h3>
          <div className="mb-2">
            <p>현재 서버 URL: {serverUrl}</p>
            <div className="flex mt-1">
              <input
                type="text"
                value={customServerUrl}
                onChange={handleServerUrlChange}
                placeholder="새 서버 URL 입력 (http://주소:포트)"
                className="flex-1 text-xs p-1 border rounded"
              />
              <button
                onClick={applyCustomServerUrl}
                className="ml-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                적용
              </button>
            </div>
          </div>

          {/* 가이드라인 상태 확인 */}
          <div className="mb-2">
            <p>가이드라인 상태:</p>
            <p>전신 가시성: {isFullBodyVisible ? "좋음" : "부족"}</p>
            <p>가이드라인 표시: {showGuideline ? "활성화" : "비활성화"}</p>
            <p>
              가이드라인 데이터:{" "}
              {processedResult?.visualizationLandmarks
                ? "수신됨"
                : "수신 대기 중"}
              {processedResult?.visualizationLandmarks &&
                ` (${processedResult.visualizationLandmarks.length}개 랜드마크)`}
            </p>
            <p>
              변환된 가이드라인 데이터:{" "}
              {processedMediaPipeResults ? "준비됨" : "준비되지 않음"}
            </p>
          </div>

          {/* 레이턴시 모니터 추가 */}
          <div className="mb-2">
            <LatencyMonitor
              latencyStats={latencyStats}
              title="소켓 통신 레이턴시"
            />
          </div>

          {/* 캐시 정보 추가 */}
          <div className="mb-2">
            <h4 className="font-medium">랜드마크 캐시 정보:</h4>
            <p>캐시된 요청 수: {Object.keys(rawLandmarksCache).length}</p>
            {Object.keys(rawLandmarksCache).length > 0 && (
              <details>
                <summary>캐시 세부 정보</summary>
                <pre className="text-xs">
                  {JSON.stringify(
                    Object.keys(rawLandmarksCache).reduce((acc, key) => {
                      acc[key] = {
                        timestamp: rawLandmarksCache[key].timestamp,
                        landmarksCount:
                          rawLandmarksCache[key].rawLandmarks.length,
                      };
                      return acc;
                    }, {} as Record<string, any>),
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>

          <p>연결 시도: {connectionAttempts}회</p>
          <p>비디오 상태: {videoElement?.readyState || "없음"}</p>
          <p>
            비디오 크기: {videoElement?.videoWidth || 0} x{" "}
            {videoElement?.videoHeight || 0}
          </p>
          <p>
            원본 랜드마크:{" "}
            {rawLandmarks && rawLandmarks.length > 0
              ? "감지됨"
              : "감지되지 않음"}
          </p>
          <p>
            변환된 랜드마크:{" "}
            {rawLandmarks.length > 0 ? "감지됨" : "감지되지 않음"}
          </p>
          <p>
            안정화된 시각화: {mediaPipeResults ? "사용 중" : "사용되지 않음"}
          </p>
          <p>전신 가시성: {isFullBodyVisible ? "좋음" : "불충분"}</p>
          <p>시각화 방식: MediaPipe DrawingUtils 사용</p>

          {rawLandmarks.length > 0 &&
            processedResult?.visualizationLandmarks && (
              <div className="mt-2">
                <h4 className="font-medium">주요 관절 비교:</h4>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {[11, 12, 23, 24, 25, 26].map((id) => {
                    const userLm = rawLandmarks.find((lm) => lm.id === id);
                    const guideLm =
                      processedResult.visualizationLandmarks?.find(
                        (lm) => lm.id === id
                      );
                    const jointName =
                      id === 11
                        ? "왼쪽 어깨"
                        : id === 12
                        ? "오른쪽 어깨"
                        : id === 23
                        ? "왼쪽 고관절"
                        : id === 24
                        ? "오른쪽 고관절"
                        : id === 25
                        ? "왼쪽 무릎"
                        : id === 26
                        ? "오른쪽 무릎"
                        : `랜드마크 ${id}`;

                    if (!userLm || !guideLm) return null;

                    // 두 랜드마크 간 거리 계산
                    const distance = Math.sqrt(
                      Math.pow(userLm.x - guideLm.x, 2) +
                        Math.pow(userLm.y - guideLm.y, 2) +
                        Math.pow(userLm.z - guideLm.z, 2)
                    );
                    // 거리를 0-100% 스케일로 변환 (거리 0.2가 100%라고 가정)
                    const diff = Math.min(100, distance * 500);

                    return (
                      <div key={id} className="p-1 bg-gray-200 rounded text-xs">
                        <p className="font-medium">
                          {jointName} (ID: {id})
                        </p>
                        <p
                          className={`${
                            diff > 10 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          차이: {diff.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {rawLandmarks && rawLandmarks.length > 0 && (
            <details>
              <summary>첫 번째 원본 랜드마크 데이터</summary>
              <pre>{JSON.stringify(rawLandmarks[0], null, 2)}</pre>
            </details>
          )}

          {rawLandmarks.length > 0 && (
            <details>
              <summary>첫 번째 변환된 랜드마크 데이터</summary>
              <pre>{JSON.stringify(rawLandmarks[0], null, 2)}</pre>
            </details>
          )}

          {processedResult &&
            processedResult.visualizationLandmarks &&
            processedResult.visualizationLandmarks.length > 0 && (
              <details>
                <summary>첫 번째 서버 처리 결과 데이터</summary>
                <pre>
                  {JSON.stringify(
                    processedResult.visualizationLandmarks[0],
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
        </div>
      )}

      {/* 랜드마크 비교 분석 창 */}
      {isConnected &&
        rawLandmarks.length > 0 &&
        processedResult?.visualizationLandmarks && (
          <LandmarkComparisonView
            userLandmarks={rawLandmarks}
            guidelineLandmarks={processedResult.visualizationLandmarks}
            isOpen={showComparisonView}
            onClose={() => setShowComparisonView(false)}
          />
        )}
    </div>
  );
};

export default PoseDetector;
