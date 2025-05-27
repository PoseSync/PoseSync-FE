import React, { useEffect, useState, useRef, useCallback } from "react";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUserStore } from "../../store/useUserStore";
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { useBodyAnalysisAudio } from "../../hooks/useBodyAnalysisAudio"; // 🎵 체형분석 음성 훅 추가
import { cleanupMediaPipe } from "../../utils/mediaPipeSingleton";
import Lottie from "lottie-react";
import axios from "axios";

// 타입 선언
interface Landmark {
  id: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface AnalysisResult {
  summary: {
    arm_ratio: string;
    upper_lower_ratio: string;
    femur_tibia_ratio: string;
    hip_height_ratio: string;
  };
  classifications: Record<string, unknown>;
  ensemble_result: Record<string, unknown>;
  db_types: Record<string, unknown>;
}

interface AnalysisResponse {
  success: boolean;
  result: AnalysisResult;
}

// 기존 styled-components들
const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  padding: 0;
`;

const CameraBox = styled.div`
  width: 1160px;
  height: 749px;
  background: var(--gray-800);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 486px;
  border-radius: var(--radius-m);
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;

const AnalysisOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const CountdownOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9;
`;

const CountdownText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 120px;
  color: var(--yellow-400);
  text-shadow: 0 0 10px rgba(201, 243, 83, 0.7);
`;

const BodyGuideText = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 40px;
  color: var(--white);
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 0;
`;

const DebugOverlay = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  font-family: monospace;
  z-index: 50;
`;

const LottieContainer = styled.div`
  width: 300px;
  height: 300px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AnalysisText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
  color: var(--white);
  text-align: center;
  margin-bottom: 20px;
`;

const AnalysisSubText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 400;
  font-size: 32px;
  color: var(--gray-300);
  text-align: center;
`;

const LoadingText = styled.div`
  width: 1160px;
  height: 160px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  color: var(--white);
  margin-top: 172px;
`;

const ButtonBox = styled.div`
  width: 1160px;
  height: 170px;
  margin-top: 130px;
`;

// 🔍 개선된 전신 감지 오버레이
const FullBodyGuideOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
`;

const GuideTitle = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 64px;
  color: var(--yellow-400);
  margin-bottom: 30px;
  text-align: center;
`;

const GuideText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 40px;
  color: var(--white);
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.4;
`;

const StabilityIndicator = styled.div<{ $stable: boolean }>`
  width: 200px;
  height: 20px;
  background: ${(props) =>
    props.$stable ? "var(--green-500)" : "var(--red-400)"};
  border-radius: 10px;
  margin: 20px 0;
  transition: background 0.3s ease;
`;

const Measurement: React.FC = () => {
  const navigate = useNavigate();
  const height = useUserStore((state) => state.height);
  const phoneNumber = useUserStore((state) => state.phoneNumber);

  // 🎵 체형분석 음성 훅 사용
  const { playAnalysisStartGuide, stopAllAudio } = useBodyAnalysisAudio();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [fullBodyDetected, setFullBodyDetected] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bodyDetectionState, setBodyDetectionState] =
    useState<string>("waiting");
  const [visibleLandmarksCount, setVisibleLandmarksCount] = useState<number>(0);
  const [isCollectingFrames, setIsCollectingFrames] = useState<boolean>(false);

  // 🔍 개선된 전신 감지 상태
  const [bodyStabilityCount, setBodyStabilityCount] = useState<number>(0);
  const [showFullBodyGuide, setShowFullBodyGuide] = useState<boolean>(true);

  // 🎬 Lottie 애니메이션 상태
  const [animationData, setAnimationData] = useState(null);

  // 📌 프레임 수집 관련 ref
  const frameBufferRef = useRef<{
    landmarks: Landmark[][];
    worldLandmarks: Landmark[][];
  }>({ landmarks: [], worldLandmarks: [] });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullBodyDetectionTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 🔍 안정성 타이머

  // 🔥 로그 출력 제한을 위한 ref
  const logThrottleRef = useRef<number>(0);

  // 분석 상태 추적을 위한 ref
  const analysingRef = useRef<boolean>(false);
  const analysisCompletedRef = useRef<boolean>(false);

  // 📌 측정 설정 - 10초 동안 수집
  const COLLECTION_TIME_SECONDS = 10;
  const FRAME_COLLECTION_INTERVAL = 200;
  const STABILITY_REQUIRED_FRAMES = 15; // 🔍 3초간 안정적으로 감지되어야 함 (15프레임)

  // 🎬 Lottie 애니메이션 로드
  useEffect(() => {
    fetch("/animations/Main Scene.json")
      .then((response) => response.json())
      .then((data) => {
        setAnimationData(data);
        console.log("✅ Lottie 애니메이션 로드 완료");
      })
      .catch((error) => {
        console.error("❌ Lottie 애니메이션 로드 실패:", error);
      });
  }, []);

  // Tasks API MediaPipe 훅 사용
  const {
    isLoading: mediaPipeLoading,
    rawLandmarks,
    rawWorldLandmarks,
    error: mediaPipeError,
  } = useMediaPipe(videoElement, {
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.3,
  });

  // 비디오 요소 설정 콜백
  const handleVideoElementReady = useCallback(
    (element: HTMLVideoElement | null) => {
      console.log("비디오 요소 준비:", element ? "성공" : "실패");
      setVideoElement(element);
    },
    []
  );

  // 초기 상태로 리셋
  const resetToInitialState = useCallback((): void => {
    analysingRef.current = false;
    setAnalyzing(false);
    setCountdown(null);
    setFullBodyDetected(false);
    setBodyDetectionState("waiting");
    setBodyStabilityCount(0); // 🔍 안정성 카운터 리셋
    setShowFullBodyGuide(true); // 🔍 가이드 다시 표시

    // 프레임 수집 관련 상태도 리셋
    setIsCollectingFrames(false);
    frameBufferRef.current = { landmarks: [], worldLandmarks: [] };

    // 🎵 음성 중단
    stopAllAudio();

    // 모든 타이머 제거
    [
      countdownTimerRef,
      fullBodyDetectionTimerRef,
      analysisTimeoutRef,
      collectionTimerRef,
      stabilityTimerRef,
    ].forEach((timerRef) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });
  }, [stopAllAudio]);

  // 체형 분석 완료 시 세션 스토리지에 완료 상태 저장
  const handleAnalysisComplete = useCallback(
    (result: AnalysisResult): void => {
      sessionStorage.setItem("bodyAnalysisCompleted", "true");
      analysisCompletedRef.current = true;

      // 🎵 음성 중단
      stopAllAudio();

      navigate("/measurement-results", {
        state: { analysisResult: result },
      });
    },
    [navigate, stopAllAudio]
  );

  // 🔍 개선된 전신 포즈 감지 여부 확인
  const isFullBodyVisible = useCallback((landmarks: Landmark[]): boolean => {
    if (landmarks.length < 33) return false;

    // 🎯 더 엄격한 키포인트 체크
    const criticalJoints = [
      11,
      12, // 양쪽 어깨
      23,
      24, // 양쪽 고관절
      25,
      26, // 양쪽 무릎
      27,
      28, // 양쪽 발목
    ];

    const visibleCriticalJoints = criticalJoints.filter((id) => {
      const landmark = landmarks.find((lm) => lm.id === id);
      return (
        landmark &&
        landmark.visibility !== undefined &&
        landmark.visibility > 0.7
      ); // 더 높은 임계값
    });

    // 8개 중 7개 이상 보여야 함
    if (visibleCriticalJoints.length < 7) return false;

    // 🎯 신체 비율 체크 (전신이 적절히 보이는지)
    const leftShoulder = landmarks.find((lm) => lm.id === 11);
    const rightShoulder = landmarks.find((lm) => lm.id === 12);
    const leftHip = landmarks.find((lm) => lm.id === 23);
    const rightHip = landmarks.find((lm) => lm.id === 24);
    const leftAnkle = landmarks.find((lm) => lm.id === 27);
    const rightAnkle = landmarks.find((lm) => lm.id === 28);

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return false;
    }

    // 어깨 중점과 고관절 중점 계산
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;

    // 상체와 하체 길이 비율 체크
    const upperBodyLength = Math.abs(hipMidY - shoulderMidY);
    const lowerBodyLength = Math.abs(ankleMidY - hipMidY);

    // 하체가 상체의 최소 80% 이상은 되어야 함 (더 엄격)
    const bodyRatio = lowerBodyLength / upperBodyLength;
    if (bodyRatio < 0.8) return false;

    // 🎯 좌우 대칭성 체크
    const leftBodyLength = Math.abs(leftAnkle.y - leftShoulder.y);
    const rightBodyLength = Math.abs(rightAnkle.y - rightShoulder.y);
    const symmetryRatio =
      Math.min(leftBodyLength, rightBodyLength) /
      Math.max(leftBodyLength, rightBodyLength);

    // 좌우 길이가 너무 다르면 안됨 (85% 이상 대칭이어야 함)
    if (symmetryRatio < 0.85) return false;

    return true;
  }, []);

  // HTTP API를 사용한 서버 전송 함수
  const sendFramesToServer = useCallback(
    async (frames: {
      landmarks: Landmark[][];
      worldLandmarks: Landmark[][];
    }) => {
      analysingRef.current = true;
      setAnalyzing(true);
      setBodyDetectionState("analyzing");

      const numericPhoneNumber = phoneNumber.replace(/[^0-9]/g, "");

      console.log("프레임 체형 분석 데이터 전송:", {
        landmarksFrameCount: frames.landmarks.length,
        worldLandmarksFrameCount: frames.worldLandmarks.length,
        phoneNumber: numericPhoneNumber,
        height: parseInt(height, 10),
      });

      // 기존 타임아웃 제거
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // 45초 타임아웃 설정
      analysisTimeoutRef.current = setTimeout(() => {
        console.log("측정 시간 초과 (45초)");
        resetToInitialState();
        alert("측정 시간이 초과되었습니다. 다시 시도해주세요.");
      }, 45000);

      try {
        const response = await axios.post<AnalysisResponse>(
          "http://127.0.0.1:5001/api/body-analysis/analyze",
          {
            landmarks: frames.landmarks,
            world_landmarks: frames.worldLandmarks,
            phoneNumber: numericPhoneNumber,
          }
        );

        // 타임아웃 클리어
        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = null;
        }

        console.log("체형 분석 결과:", response.data);

        if (response.data.success) {
          handleAnalysisComplete(response.data.result);
        } else {
          resetToInitialState();
          alert("체형 분석에 실패했습니다. 다시 시도해주세요.");
        }
      } catch (error) {
        console.error("체형 분석 API 오류:", error);

        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
          analysisTimeoutRef.current = null;
        }

        analysingRef.current = false;
        resetToInitialState();
        alert("체형 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    },
    [phoneNumber, height, handleAnalysisComplete, resetToInitialState]
  );

  // 📌 프레임 수집 시작 함수
  const startFrameCollection = useCallback((): void => {
    console.log(`🎬 ${COLLECTION_TIME_SECONDS}초 동안 프레임 수집 시작`);

    // 🎵 체형분석 시작 음성 재생
    playAnalysisStartGuide();

    setIsCollectingFrames(true);
    setAnalyzing(true);
    frameBufferRef.current = { landmarks: [], worldLandmarks: [] };
    setBodyDetectionState("collecting");
    setShowFullBodyGuide(false); // 🔍 가이드 숨김

    let collectionCount = 0;
    const maxFrames = Math.floor(
      (COLLECTION_TIME_SECONDS * 1000) / FRAME_COLLECTION_INTERVAL
    );

    const collectFrame = () => {
      if (
        !rawLandmarks ||
        rawLandmarks.length === 0 ||
        !rawWorldLandmarks ||
        rawWorldLandmarks.length === 0
      ) {
        if (collectionCount < maxFrames) {
          collectionTimerRef.current = setTimeout(
            collectFrame,
            FRAME_COLLECTION_INTERVAL
          );
        }
        return;
      }

      const formattedLandmarks: Landmark[] = rawLandmarks.map((lm) => ({
        id: lm.id,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      const formattedWorldLandmarks: Landmark[] = rawWorldLandmarks.map(
        (lm) => ({
          id: lm.id,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        })
      );

      frameBufferRef.current = {
        landmarks: [...frameBufferRef.current.landmarks, formattedLandmarks],
        worldLandmarks: [
          ...frameBufferRef.current.worldLandmarks,
          formattedWorldLandmarks,
        ],
      };

      collectionCount++;
      console.log(`프레임 수집: ${collectionCount}/${maxFrames}`);

      if (collectionCount < maxFrames) {
        collectionTimerRef.current = setTimeout(
          collectFrame,
          FRAME_COLLECTION_INTERVAL
        );
      } else {
        console.log(
          `✅ ${COLLECTION_TIME_SECONDS}초 프레임 수집 완료! 분석 시작...`
        );
        setIsCollectingFrames(false);

        setTimeout(() => {
          sendFramesToServer(frameBufferRef.current);
        }, 500);
      }
    };

    collectFrame();
  }, [
    rawLandmarks,
    rawWorldLandmarks,
    sendFramesToServer,
    playAnalysisStartGuide,
  ]);

  // 🔍 개선된 자동 측정 시작 로직
  const startAutoMeasurement = useCallback((): void => {
    console.log("🎯 자동 체형분석 시작!");
    setBodyDetectionState("starting");
    setShowFullBodyGuide(false);

    // 1초 후 측정 시작
    setTimeout(() => {
      startFrameCollection();
    }, 1000);
  }, [startFrameCollection]);

  // 카메라 초기화
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera(): Promise<void> {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => {
                  console.log("카메라 준비 완료");
                  handleVideoElementReady(videoRef.current);
                })
                .catch((err) => {
                  console.error("비디오 재생 실패:", err);
                });
            }
          };
        }
      } catch (error) {
        console.error("카메라 접근 에러:", error);
      }
    }

    setupCamera();

    return () => {
      // 모든 타이머 정리
      [
        countdownTimerRef,
        fullBodyDetectionTimerRef,
        analysisTimeoutRef,
        collectionTimerRef,
        stabilityTimerRef,
      ].forEach((timerRef) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      });

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (analysingRef.current === false && !analysisCompletedRef.current) {
        sessionStorage.removeItem("bodyAnalysisCompleted");
      }

      // 🎵 음성 정리
      stopAllAudio();
      cleanupMediaPipe();
    };
  }, [handleVideoElementReady, stopAllAudio]);

  // 🔍 개선된 MediaPipe 랜드마크 처리
  useEffect(() => {
    if (
      !rawLandmarks ||
      rawLandmarks.length === 0 ||
      !rawWorldLandmarks ||
      rawWorldLandmarks.length === 0
    )
      return;

    const visibleCount = rawLandmarks.filter(
      (lm) => lm.visibility !== undefined && lm.visibility > 0.5
    ).length;
    setVisibleLandmarksCount(visibleCount);

    const now = Date.now();
    if (now - logThrottleRef.current > 1000) {
      console.log(`감지된 랜드마크: ${visibleCount}/33 (가시성 > 0.5)`);
      logThrottleRef.current = now;
    }

    // 프레임 수집 중이거나 분석 중이면 전신 감지 로직 건너뛰기
    if (isCollectingFrames || analyzing) return;

    const formattedLandmarks: Landmark[] = rawLandmarks.map((lm) => ({
      id: lm.id,
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    }));

    const bodyVisible = isFullBodyVisible(formattedLandmarks);

    if (bodyVisible) {
      // 🔍 연속적으로 전신이 감지되는 경우 안정성 카운터 증가
      setBodyStabilityCount((prev) => {
        const newCount = prev + 1;
        console.log(
          `🎯 전신 감지 안정성: ${newCount}/${STABILITY_REQUIRED_FRAMES}`
        );
        return newCount;
      });

      setBodyDetectionState("detected");

      // 🔍 충분히 안정적으로 감지되면 자동 측정 시작
      if (
        bodyStabilityCount >= STABILITY_REQUIRED_FRAMES &&
        !fullBodyDetected
      ) {
        console.log("🎯 전신 안정적으로 감지됨 - 자동 측정 시작!");
        setFullBodyDetected(true);
        setBodyStabilityCount(0);
        startAutoMeasurement();
      }
    } else {
      // 전신이 감지되지 않으면 안정성 카운터 리셋
      if (bodyStabilityCount > 0) {
        console.log("🔄 전신 감지 중단 - 안정성 카운터 리셋");
        setBodyStabilityCount(0);
      }
      setBodyDetectionState("waiting");
      setFullBodyDetected(false);
    }
  }, [
    rawLandmarks,
    rawWorldLandmarks,
    isCollectingFrames,
    analyzing,
    isFullBodyVisible,
    bodyStabilityCount,
    fullBodyDetected,
    startAutoMeasurement,
  ]);

  // 체형 분석 시작 함수 (수동 시작용)
  const startAnalysis = (): void => {
    if (
      !rawLandmarks ||
      rawLandmarks.length === 0 ||
      !rawWorldLandmarks ||
      rawWorldLandmarks.length === 0
    ) {
      console.log("랜드마크가 감지되지 않습니다.");
      return;
    }

    startFrameCollection();
  };

  // 분석 취소
  const handleCancelAnalysis = (): void => {
    resetToInitialState();
  };

  // 🔍 상태 기반 메시지 선택 (개선됨)
  const getStatusMessage = (): string => {
    if (analyzing && !isCollectingFrames) {
      return "신체 측정 분석 중입니다. 잠시만 기다려주세요.";
    } else if (isCollectingFrames) {
      return "측정 중입니다. 자세를 유지해 주세요.";
    } else if (bodyDetectionState === "starting") {
      return "곧 측정이 시작됩니다. 자세를 유지해 주세요.";
    } else if (bodyDetectionState === "detected") {
      const progress = Math.min(
        (bodyStabilityCount / STABILITY_REQUIRED_FRAMES) * 100,
        100
      );
      return `전신 감지 중... (${Math.round(progress)}%)`;
    } else {
      return "전신이 보이도록 카메라 앞에 서주세요.";
    }
  };

  return (
    <FullScreen>
      <CameraBox>
        <Video ref={videoRef} autoPlay playsInline muted />

        {/* 🔍 개선된 전신 감지 가이드 오버레이 */}
        {showFullBodyGuide && !analyzing && !isCollectingFrames && (
          <FullBodyGuideOverlay>
            <GuideTitle>체형 분석 준비</GuideTitle>
            <GuideText>
              카메라에서 2m 정도 떨어져서
              <br />
              전신이 모두 보이도록 서주세요
            </GuideText>
            <StabilityIndicator $stable={bodyStabilityCount > 5} />
            <GuideText style={{ fontSize: "32px", color: "var(--gray-300)" }}>
              {bodyDetectionState === "detected"
                ? `안정성 확인 중... ${Math.round(
                    (bodyStabilityCount / STABILITY_REQUIRED_FRAMES) * 100
                  )}%`
                : "전신을 인식하는 중..."}
            </GuideText>
          </FullBodyGuideOverlay>
        )}

        {/* 가이드 텍스트 */}
        <BodyGuideText>
          {bodyDetectionState === "waiting"
            ? "전신이 보이도록 카메라 앞에 서주세요"
            : bodyDetectionState === "detected"
            ? `전신 감지 중... (${Math.round(
                (bodyStabilityCount / STABILITY_REQUIRED_FRAMES) * 100
              )}%)`
            : bodyDetectionState === "starting"
            ? "측정 준비 중..."
            : isCollectingFrames
            ? "측정 중 - 자세를 유지해 주세요"
            : analyzing
            ? "분석 중 - 잠시만 기다려주세요"
            : "자세를 유지해 주세요"}
        </BodyGuideText>

        {/* 디버그 정보 표시 */}
        <DebugOverlay>
          감지된 랜드마크: {visibleLandmarksCount}/33
          {isCollectingFrames && <div>프레임 수집 중...</div>}
          {analyzing && !isCollectingFrames && <div>분석 중...</div>}
        </DebugOverlay>

        {/* MediaPipe 오류 상태 표시 */}
        {mediaPipeError && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 0, 0, 0.8)",
              color: "white",
              padding: "20px",
              borderRadius: "10px",
              zIndex: 100,
            }}
          >
            MediaPipe 오류: {mediaPipeError.message}
          </div>
        )}

        {/* 카운트다운 오버레이 */}
        {countdown !== null && (
          <CountdownOverlay>
            <CountdownText>{countdown}</CountdownText>
          </CountdownOverlay>
        )}

        {/* 📌 분석 중 오버레이 (프레임 수집 + 서버 분석 모두 포함) */}
        {analyzing && (
          <AnalysisOverlay>
            <LottieContainer>
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  로딩 중...
                </div>
              )}
            </LottieContainer>
            <AnalysisText>
              {isCollectingFrames ? "측정 중..." : "분석 중..."}
            </AnalysisText>
            <AnalysisSubText>
              {isCollectingFrames
                ? "자세를 유지해 주세요"
                : "AI가 신체를 분석하고 있습니다"}
            </AnalysisSubText>
          </AnalysisOverlay>
        )}

        {/* MediaPipe 로딩 중 오버레이 */}
        {mediaPipeLoading && (
          <AnalysisOverlay>
            <div
              style={{ color: "white", fontSize: "48px", textAlign: "center" }}
            >
              포즈 감지 모델 로딩 중...
            </div>
          </AnalysisOverlay>
        )}
      </CameraBox>

      <LoadingText>{getStatusMessage()}</LoadingText>

      <ButtonBox>
        <PrimaryButton
          size="xl"
          fontSize="32px"
          onClick={
            analyzing || isCollectingFrames
              ? handleCancelAnalysis
              : startAnalysis
          }
        >
          {analyzing || isCollectingFrames ? "측정 그만하기" : "측정 시작하기"}
        </PrimaryButton>
      </ButtonBox>
    </FullScreen>
  );
};

export default Measurement;
