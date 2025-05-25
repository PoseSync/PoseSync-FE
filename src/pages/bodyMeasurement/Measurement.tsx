import React, { useEffect, useState, useRef, useCallback } from "react";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUserStore } from "../../store/useUserStore";
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { cleanupMediaPipe } from "../../utils/mediaPipeSingleton";
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

// 컴포넌트 스타일들
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
  transform: scaleX(-1); /* 거울 효과 */
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

const Measurement: React.FC = () => {
  const navigate = useNavigate();
  const height = useUserStore((state) => state.height);
  const phoneNumber = useUserStore((state) => state.phoneNumber);

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

  // 📌 프레임 수집 관련 ref (state 대신 ref 사용)
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

  // 🔥 로그 출력 제한을 위한 ref 추가
  const logThrottleRef = useRef<number>(0);

  // 분석 상태 추적을 위한 ref 추가
  const analysingRef = useRef<boolean>(false);
  const analysisCompletedRef = useRef<boolean>(false);

  // 📌 측정 설정 - 10초 동안 수집
  const COLLECTION_TIME_SECONDS = 10; // 10초 동안 수집
  const FRAME_COLLECTION_INTERVAL = 200; // 200ms마다 프레임 수집 (총 50프레임)

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

    // 프레임 수집 관련 상태도 리셋
    setIsCollectingFrames(false);
    frameBufferRef.current = { landmarks: [], worldLandmarks: [] };

    // 모든 타이머 제거
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (fullBodyDetectionTimerRef.current) {
      clearTimeout(fullBodyDetectionTimerRef.current);
      fullBodyDetectionTimerRef.current = null;
    }

    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }

    if (collectionTimerRef.current) {
      clearTimeout(collectionTimerRef.current);
      collectionTimerRef.current = null;
    }
  }, []);

  // 체형 분석 완료 시 세션 스토리지에 완료 상태 저장
  const handleAnalysisComplete = useCallback(
    (result: AnalysisResult): void => {
      // 체형 분석 완료 상태 저장
      sessionStorage.setItem("bodyAnalysisCompleted", "true");
      analysisCompletedRef.current = true;

      // 결과 페이지로 이동
      navigate("/measurement-results", {
        state: { analysisResult: result },
      });
    },
    [navigate]
  );

  // 전신 포즈 감지 여부 확인
  const isFullBodyVisible = useCallback((landmarks: Landmark[]): boolean => {
    if (landmarks.length < 33) return false;

    const keyJoints = [
      11,
      12,
      13,
      14,
      15,
      16, // 어깨, 팔꿈치, 손목
      23,
      24,
      25,
      26,
      27,
      28, // 엉덩이, 무릎, 발목
    ];

    return keyJoints.every((id) => {
      const landmark = landmarks.find((lm) => lm.id === id);
      return (
        landmark &&
        landmark.visibility !== undefined &&
        landmark.visibility > 0.5
      );
    });
  }, []);

  // 🔥 HTTP API를 사용한 서버 전송 함수
  const sendFramesToServer = useCallback(
    async (frames: {
      landmarks: Landmark[][];
      worldLandmarks: Landmark[][];
    }) => {
      analysingRef.current = true;
      setAnalyzing(true);
      setBodyDetectionState("analyzing");

      // 🔥 전화번호에서 숫자만 추출
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

      // 45초 타임아웃 설정 (프레임 처리 시간 고려)
      analysisTimeoutRef.current = setTimeout(() => {
        console.log("측정 시간 초과 (45초)");
        resetToInitialState();
        alert("측정 시간이 초과되었습니다. 다시 시도해주세요.");
      }, 45000);

      try {
        // 🔥 HTTP API로 체형 분석 요청
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
          // 체형 분석 완료 상태 저장 및 결과 페이지로 이동
          handleAnalysisComplete(response.data.result);
        } else {
          resetToInitialState();
          alert("체형 분석에 실패했습니다. 다시 시도해주세요.");
        }
      } catch (error) {
        console.error("체형 분석 API 오류:", error);

        // 타임아웃 클리어
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

  // 📌 프레임 수집 시작 함수 (타이머 기반으로 변경)
  const startFrameCollection = useCallback((): void => {
    console.log(`🎬 ${COLLECTION_TIME_SECONDS}초 동안 프레임 수집 시작`);
    setIsCollectingFrames(true);
    setAnalyzing(true); // 📌 로티 애니메이션 시작
    frameBufferRef.current = { landmarks: [], worldLandmarks: [] };
    setBodyDetectionState("collecting");

    let collectionCount = 0;
    const maxFrames = Math.floor(
      (COLLECTION_TIME_SECONDS * 1000) / FRAME_COLLECTION_INTERVAL
    ); // 최대 50프레임

    // 200ms마다 프레임 수집
    const collectFrame = () => {
      if (
        !rawLandmarks ||
        rawLandmarks.length === 0 ||
        !rawWorldLandmarks ||
        rawWorldLandmarks.length === 0
      ) {
        // 랜드마크가 없으면 다시 시도
        if (collectionCount < maxFrames) {
          collectionTimerRef.current = setTimeout(
            collectFrame,
            FRAME_COLLECTION_INTERVAL
          );
        }
        return;
      }

      // 현재 랜드마크 수집
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

      // 버퍼에 추가
      frameBufferRef.current = {
        landmarks: [...frameBufferRef.current.landmarks, formattedLandmarks],
        worldLandmarks: [
          ...frameBufferRef.current.worldLandmarks,
          formattedWorldLandmarks,
        ],
      };

      collectionCount++;
      console.log(`프레임 수집: ${collectionCount}/${maxFrames}`);

      // 아직 더 수집할 프레임이 있으면 계속
      if (collectionCount < maxFrames) {
        collectionTimerRef.current = setTimeout(
          collectFrame,
          FRAME_COLLECTION_INTERVAL
        );
      } else {
        // 수집 완료
        console.log(
          `✅ ${COLLECTION_TIME_SECONDS}초 프레임 수집 완료! 분석 시작...`
        );
        setIsCollectingFrames(false);

        // 수집된 프레임으로 서버 전송 (분석 상태 유지)
        setTimeout(() => {
          sendFramesToServer(frameBufferRef.current);
        }, 500); // 0.5초 후 전송
      }
    };

    // 첫 번째 프레임 수집 시작
    collectFrame();
  }, [rawLandmarks, rawWorldLandmarks, sendFramesToServer]);

  // 카운트다운 시작
  const startCountdown = useCallback((): void => {
    setCountdown(3);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // 📌 카운트다운 종료 후 프레임 수집 시작
          startFrameCollection();
          return null;
        }
        return prev - 1;
      });
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
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      if (fullBodyDetectionTimerRef.current) {
        clearTimeout(fullBodyDetectionTimerRef.current);
        fullBodyDetectionTimerRef.current = null;
      }

      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }

      if (collectionTimerRef.current) {
        clearTimeout(collectionTimerRef.current);
        collectionTimerRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // 체형 분석 중단 시 완료 상태 제거
      if (analysingRef.current === false && !analysisCompletedRef.current) {
        sessionStorage.removeItem("bodyAnalysisCompleted");
      }

      // MediaPipe 정리
      cleanupMediaPipe();
    };
  }, [handleVideoElementReady]);

  // MediaPipe 훅에서 받은 랜드마크 처리
  useEffect(() => {
    if (
      !rawLandmarks ||
      rawLandmarks.length === 0 ||
      !rawWorldLandmarks ||
      rawWorldLandmarks.length === 0
    )
      return;

    // 🔥 가시성 높은 랜드마크 개수 계산
    const visibleCount = rawLandmarks.filter(
      (lm) => lm.visibility !== undefined && lm.visibility > 0.5
    ).length;
    setVisibleLandmarksCount(visibleCount);

    // 🔥 로그 출력 제한 (1초에 한 번만)
    const now = Date.now();
    if (now - logThrottleRef.current > 1000) {
      console.log(`감지된 랜드마크: ${visibleCount}/33 (가시성 > 0.5)`);
      logThrottleRef.current = now;
    }

    // rawLandmarks를 Landmark[] 타입으로 변환
    const formattedLandmarks: Landmark[] = rawLandmarks.map((lm) => ({
      id: lm.id,
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    }));

    // 프레임 수집 중이 아니고, 분석 중이 아니고, 카운트다운 중이 아닐 때만 전신 감지 로직 실행
    if (!isCollectingFrames && !analyzing && countdown === null) {
      // 전신 감지 여부 확인
      const bodyVisible = isFullBodyVisible(formattedLandmarks);

      // 전신 감지 상태 업데이트
      if (bodyVisible && !fullBodyDetected) {
        setBodyDetectionState("detected");

        // 전신이 감지되면 3초 유지되는지 확인 후 카운트다운 시작
        if (fullBodyDetectionTimerRef.current) {
          clearTimeout(fullBodyDetectionTimerRef.current);
        }

        fullBodyDetectionTimerRef.current = setTimeout(() => {
          setFullBodyDetected(true);
          setBodyDetectionState("stable");
          startCountdown();
        }, 3000);
      } else if (!bodyVisible) {
        // 전신이 감지되지 않으면 타이머 초기화
        setBodyDetectionState("waiting");
        if (fullBodyDetectionTimerRef.current) {
          clearTimeout(fullBodyDetectionTimerRef.current);
          fullBodyDetectionTimerRef.current = null;
        }
        setFullBodyDetected(false);
      }
    }
  }, [
    rawLandmarks,
    rawWorldLandmarks,
    fullBodyDetected,
    analyzing,
    countdown,
    isCollectingFrames,
    isFullBodyVisible,
    startCountdown,
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

  // 상태 기반 메시지 선택
  const getStatusMessage = (): string => {
    if (analyzing && !isCollectingFrames) {
      return "신체 측정 분석 중입니다. 잠시만 기다려주세요.";
    } else if (isCollectingFrames) {
      return "측정 중입니다. 자세를 유지해 주세요.";
    } else if (countdown !== null) {
      return "잠시 자세를 유지해 주세요. 곧 측정이 시작됩니다.";
    } else if (bodyDetectionState === "detected") {
      return "전신이 감지되었습니다. 자세를 유지해 주세요.";
    } else if (bodyDetectionState === "stable") {
      return "좋습니다! 자세를 계속 유지해 주세요.";
    } else {
      return "전신이 보이도록 카메라 앞에 서주세요.";
    }
  };

  return (
    <FullScreen>
      <CameraBox>
        <Video ref={videoRef} autoPlay playsInline muted />

        {/* 가이드 텍스트 */}
        <BodyGuideText>
          {bodyDetectionState === "waiting"
            ? "전신이 보이도록 카메라 앞에 서주세요"
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
              <div
                id="lottie-container"
                style={{ width: "100%", height: "100%" }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <lottie-player 
                      src="https://assets1.lottiefiles.com/packages/lf20_p8bfn5to.json"
                      background="transparent"
                      speed="1"
                      style="width: 100%; height: 100%;"
                      loop
                      autoplay
                    ></lottie-player>
                  `,
                }}
              />
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
