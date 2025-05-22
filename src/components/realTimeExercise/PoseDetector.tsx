import React, { useRef, useEffect, useState, useCallback } from "react";
import WebcamCapture from "./WebcamCapture";
import MediaPipeVisualizer from "./MediaPipeVisualizer";
import PoseMatchIndicator from "./PoseMatchIndicator";
import PoseDifferenceVisualizer from "./PoseDifferenceVisualizer";
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { useSocket } from "../../hooks/useSocket";
import { Landmark } from "../../types";

interface PoseDetectorProps {
  phoneNumber: string;
  exerciseType: string;
  visualizationMode: string;
  onCountUpdate: (count: number) => void;
  onFeedback: (message: string) => void;
  isTransmitting: boolean;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({
  phoneNumber,
  exerciseType,
  onCountUpdate,
  onFeedback,
  isTransmitting,
}) => {
  // 기본 상태
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [similarity, setSimilarity] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string>("");

  // 플래그 상수 (상태 변수가 아닌 상수로 정의하여 불필요한 경고 제거)
  const showFace = false;
  const showGuideline = true;
  const showDifferences = true;

  // VideoContainer 크기에 맞게 비디오 크기 조정
  const videoWidth = 2300;
  const videoHeight = 1683;

  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);

  // 비디오 요소 설정 콜백
  const handleVideoElementReady = useCallback(
    (element: HTMLVideoElement | null) => {
      setVideoElement(element);
    },
    []
  );

  // MediaPipe 훅 사용
  const { isLoading: mediaPipeLoading, rawLandmarks } = useMediaPipe(
    videoElement,
    {
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    }
  );

  // Socket.io 훅 사용
  const { isConnected, isConnecting, connect, sendPose, processedResult } =
    useSocket({
      phoneNumber,
      exerciseType,
      autoConnect: false,
    });

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

  // 전신 가시성 체크 함수 - 타입 오류 수정: 의존성 배열에서 함수들 제거
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

  // 자세 유사도 계산
  useEffect(() => {
    // rawLandmarks가 있을 때만 전신 가시성 확인
    if (rawLandmarks.length > 0) {
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
    checkFullBodyVisibility,
    onCountUpdate,
    onFeedback,
  ]);

  // 비디오 요소가 준비되면 자동으로 소켓 연결 시도
  useEffect(() => {
    if (
      videoElement &&
      rawLandmarks.length > 0 &&
      !isConnected &&
      !isConnecting
    ) {
      // 랜드마크가 감지되면 자동 연결 시도
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

      // 타입 오류 수정: rawLandmarks를 Landmark[] 타입으로 변환하여 전송
      const landmarksToSend: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      // 랜드마크 전송
      sendPose(landmarksToSend, requestId);
      setLastFrameTime(now);
    }
  }, [isTransmitting, isConnected, rawLandmarks, sendPose, lastFrameTime]);

  // 서버 처리 결과 MediaPipe 형식 변환
  const processedMediaPipeResults =
    processedResult && processedResult.visualizationLandmarks?.length
      ? convertToMediaPipeFormat(processedResult.visualizationLandmarks)
      : null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* 경고 메시지 표시 */}
      {warningMessage && (
        <div className="absolute top-4 left-0 right-0 mx-auto w-max bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="flex items-center text-sm">⚠️ {warningMessage}</p>
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
          {videoElement && rawLandmarks.length > 0 && (
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

          {/* 서버 처리된 랜드마크 시각화 (파란색) */}
          {videoElement && showGuideline && processedMediaPipeResults && (
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

          {/* 두 랜드마크 간의 차이 시각화 */}
          {videoElement &&
            showDifferences &&
            rawLandmarks.length > 0 &&
            processedResult?.visualizationLandmarks &&
            processedResult.visualizationLandmarks.length > 0 && (
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
        </WebcamCapture>

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

        {/* 화면 우측 상단에 정확도 표시 */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-3 text-white">
          <div className="flex items-center">
            <span className="mr-2">정확도:</span>
            <PoseMatchIndicator similarity={similarity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseDetector;
