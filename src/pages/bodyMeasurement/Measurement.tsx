import React, { useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUserStore } from "../../store/useUserStore";
import axios from "axios";

// 타입 선언
interface Landmark {
  id: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseResults {
  poseLandmarks?: PoseLandmark[];
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

// MediaPipe 관련 타입 선언
interface Pose {
  setOptions(options: PoseOptions): void;
  onResults(callback: (results: PoseResults) => void): void;
  send(data: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

interface PoseOptions {
  modelComplexity: number;
  smoothLandmarks: boolean;
  enableSegmentation: boolean;
  smoothSegmentation: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

// MediaPipe Module 타입 정의
interface MediaPipeModule {
  arguments_?: string[];
  [key: string]: unknown;
}

// Window 타입 확장
declare global {
  interface Window {
    Pose: {
      new (options?: { locateFile: (file: string) => string }): Pose;
    };
    Module: MediaPipeModule;
    gc?: () => void;
  }
}

// MediaPipe 정리 함수 (임시 구현)
const cleanupMediaPipe = (): void => {
  try {
    // Module 객체 정리
    if (window.Module) {
      const moduleBackup: MediaPipeModule = {
        arguments_: window.Module.arguments_,
      };
      window.Module = moduleBackup;
      console.log("MediaPipe Module 정리 완료");
    }

    // 가비지 컬렉션 힌트
    if (window.gc) {
      window.gc();
    }
  } catch (error) {
    console.error("MediaPipe 정리 중 오류:", error);
  }
};

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
  background: rgba(0, 0, 0, 0.7);
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

// 📌 프레임 수집 진행률 표시
const CollectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 8;
`;

const CollectionProgress = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 60px;
  color: var(--white);
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  width: 400px;
  height: 20px;
  background: var(--gray-700);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background: var(--yellow-400);
  transition: width 0.3s ease;
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
  width: 200px;
  height: 200px;
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

  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [fullBodyDetected, setFullBodyDetected] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bodyDetectionState, setBodyDetectionState] =
    useState<string>("waiting");
  const [visibleLandmarksCount, setVisibleLandmarksCount] = useState<number>(0);

  // 📌 프레임 수집 관련 상태
  const [frameBuffer, setFrameBuffer] = useState<Landmark[][]>([]);
  const [isCollectingFrames, setIsCollectingFrames] = useState<boolean>(false);
  const [collectionProgress, setCollectionProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const animationRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullBodyDetectionTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔥 로그 출력 제한을 위한 ref 추가
  const logThrottleRef = useRef<number>(0);

  // 분석 상태 추적을 위한 ref 추가
  const analysingRef = useRef<boolean>(false);
  const analysisCompletedRef = useRef<boolean>(false);

  // 📌 프레임 수집 설정
  const REQUIRED_FRAMES = 50;

  // 초기 상태로 리셋
  const resetToInitialState = useCallback((): void => {
    analysingRef.current = false;
    setAnalyzing(false);
    setCountdown(null);
    setFullBodyDetected(false);
    setBodyDetectionState("waiting");

    // 📌 프레임 수집 관련 상태도 리셋
    setIsCollectingFrames(false);
    setFrameBuffer([]);
    setCollectionProgress(0);

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
  }, []);

  // 📌 프레임 수집 시작 함수
  const startFrameCollection = useCallback((): void => {
    console.log(`🎬 ${REQUIRED_FRAMES}프레임 수집 시작`);
    setIsCollectingFrames(true);
    setFrameBuffer([]);
    setCollectionProgress(0);
    setBodyDetectionState("collecting");
  }, [REQUIRED_FRAMES]);

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

  // 🔥 수정된 HTTP API를 사용한 서버 전송 함수 (소켓 제거)
  const sendFramesToServer = useCallback(
    async (frames: Landmark[][]) => {
      analysingRef.current = true;
      setAnalyzing(true);
      setBodyDetectionState("analyzing");

      // 🔥 전화번호에서 숫자만 추출
      const numericPhoneNumber = phoneNumber.replace(/[^0-9]/g, "");

      console.log("프레임 체형 분석 데이터 전송:", {
        frameCount: frames.length,
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
            landmarks: frames, // 프레임 배열
            phoneNumber: numericPhoneNumber, // 숫자만 포함된 전화번호
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

  // 카운트다운 시작
  const startCountdown = useCallback((): void => {
    setCountdown(10);

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

  // 🔥 수정된 Pose 결과 처리 콜백 (의존성 배열 수정)
  const handlePoseResults = useCallback(
    (results: PoseResults): void => {
      if (!results || !results.poseLandmarks) return;

      // 랜드마크 데이터 형식 맞추기
      const formattedLandmarks: Landmark[] = results.poseLandmarks.map(
        (landmark, index) => ({
          id: index,
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
          visibility: landmark.visibility,
        })
      );

      // 랜드마크 상태 업데이트
      setLandmarks(formattedLandmarks);

      // 🔥 가시성 높은 랜드마크 개수 계산 (항상 실행 - 프레임 수집 중에도)
      const visibleCount = formattedLandmarks.filter(
        (lm) => lm.visibility !== undefined && lm.visibility > 0.5
      ).length;
      setVisibleLandmarksCount(visibleCount);

      // 🔥 로그 출력 제한 (1초에 한 번만)
      const now = Date.now();
      if (now - logThrottleRef.current > 1000) {
        console.log(`감지된 랜드마크: ${visibleCount}/33 (가시성 > 0.5)`);
        logThrottleRef.current = now;
      }

      // 📌 프레임 수집 중일 때 버퍼에 추가
      setFrameBuffer((prevBuffer) => {
        // 현재 수집 상태와 버퍼 길이를 함수 내부에서 확인
        if (isCollectingFrames && prevBuffer.length < REQUIRED_FRAMES) {
          const newBuffer = [...prevBuffer, formattedLandmarks];
          const progress = (newBuffer.length / REQUIRED_FRAMES) * 100;
          setCollectionProgress(progress);

          // 프레임 수집 완료
          if (newBuffer.length === REQUIRED_FRAMES) {
            console.log(`✅ ${REQUIRED_FRAMES}프레임 수집 완료! 분석 시작...`);
            sendFramesToServer(newBuffer);
            setIsCollectingFrames(false);
            setCollectionProgress(0);
            return [];
          }

          return newBuffer;
        }
        return prevBuffer; // 수집 중이 아니면 기존 버퍼 유지
      });

      // 프레임 수집 중일 때는 다른 로직 실행 안함
      if (isCollectingFrames) {
        return;
      }

      // 전신 감지 여부 확인
      const bodyVisible = isFullBodyVisible(formattedLandmarks);

      // 전신 감지 상태 업데이트
      if (
        bodyVisible &&
        !fullBodyDetected &&
        !analyzing &&
        countdown === null &&
        !isCollectingFrames
      ) {
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
      } else if (!bodyVisible && !analyzing && !isCollectingFrames) {
        // 전신이 감지되지 않으면 타이머 초기화
        setBodyDetectionState("waiting");
        if (fullBodyDetectionTimerRef.current) {
          clearTimeout(fullBodyDetectionTimerRef.current);
          fullBodyDetectionTimerRef.current = null;
        }
        setFullBodyDetected(false);
      }
    },
    [
      fullBodyDetected,
      analyzing,
      countdown,
      isCollectingFrames,
      REQUIRED_FRAMES,
      sendFramesToServer,
      isFullBodyVisible,
      startCountdown,
    ]
  );

  // 🔥 수정된 카메라 프레임 전송 루프 (프레임 처리 최적화)
  const startCamera = useCallback((): void => {
    if (!videoRef.current || !poseRef.current) return;

    const sendFrame = async (): Promise<void> => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        // 🔥 분석 중이 아닐 때만 MediaPipe로 프레임 전송 (성능 최적화)
        if (!analyzing) {
          await poseRef.current?.send({ image: videoRef.current });
        }
      }

      animationRef.current = requestAnimationFrame(sendFrame);
    };

    sendFrame();
  }, [analyzing]);

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
                  setVideoReady(true);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

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

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // MediaPipe 인스턴스 정리
      if (poseRef.current) {
        try {
          poseRef.current.close();
          poseRef.current = null;
          console.log("Pose 인스턴스 정리 완료");
        } catch (e) {
          console.error("Pose 인스턴스 정리 중 오류:", e);
        }
      }

      // WASM 모듈 상태 초기화 (전역 변수 정리)
      if (window.Module) {
        try {
          // 필요한 속성만 유지
          const moduleBackup: MediaPipeModule = {
            arguments_: window.Module.arguments_,
          };

          // Module 객체 초기화
          window.Module = moduleBackup;
          console.log("Module 객체 정리 완료");
        } catch (e) {
          console.error("Module 객체 정리 중 오류:", e);
        }
      }

      // 체형 분석 중단 시 완료 상태 제거
      if (analysingRef.current === false && !analysisCompletedRef.current) {
        sessionStorage.removeItem("bodyAnalysisCompleted");
      }

      // 모든 MediaPipe 인스턴스 정리 (싱글톤)
      cleanupMediaPipe();

      // 1초 후 가비지 컬렉션 힌트
      setTimeout(() => {
        if (window.gc) window.gc();
      }, 1000);
    };
  }, []);

  // 🔥 수정된 Pose 모델 초기화 (소켓 연결 제거)
  useEffect(() => {
    if (!videoReady) return;

    const initPose = async (): Promise<void> => {
      if (typeof window.Pose !== "undefined") {
        try {
          poseRef.current = new window.Pose({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
          });

          poseRef.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          poseRef.current.onResults(handlePoseResults);
          startCamera();

          console.log("MediaPipe Pose 모델 초기화 완료");
        } catch (error) {
          console.error("Pose 모델 초기화 실패:", error);
        }
      } else {
        setTimeout(initPose, 100);
      }
    };

    initPose();
  }, [videoReady, handlePoseResults, startCamera]);

  // 체형 분석 시작 함수 (수동 시작용)
  const startAnalysis = (): void => {
    if (!landmarks.length) {
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
    if (analyzing) {
      return "신체 측정 중입니다. 잠시만 기다려주세요.";
    } else if (isCollectingFrames) {
      return `정확한 측정을 위해 자세를 유지해주세요. (${frameBuffer.length}/${REQUIRED_FRAMES})`;
    } else if (countdown !== null) {
      return "잠시 자세를 유지해 주세요. 곧 측정이 시작됩니다.";
    } else if (bodyDetectionState === "detected") {
      return "전신이 감지되었습니다. 자세를 유지해 주세요.";
    } else if (bodyDetectionState === "stable") {
      return "좋습니다! 자세를 계속 유지해 주세요.";
    } else {
      return "";
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
            ? "자세를 유지해 주세요 - 프레임 수집 중"
            : "자세를 유지해 주세요"}
        </BodyGuideText>

        {/* 디버그 정보 표시 */}
        <DebugOverlay>
          감지된 랜드마크: {visibleLandmarksCount}/33
          {isCollectingFrames && (
            <div>
              수집된 프레임: {frameBuffer.length}/{REQUIRED_FRAMES}
            </div>
          )}
        </DebugOverlay>

        {/* 카운트다운 오버레이 */}
        {countdown !== null && (
          <CountdownOverlay>
            <CountdownText>{countdown}</CountdownText>
          </CountdownOverlay>
        )}

        {/* 📌 프레임 수집 진행률 오버레이 */}
        {isCollectingFrames && (
          <CollectionOverlay>
            <CollectionProgress>
              프레임 수집 중... {frameBuffer.length}/{REQUIRED_FRAMES}
            </CollectionProgress>
            <ProgressBar>
              <ProgressFill progress={collectionProgress} />
            </ProgressBar>
            <div style={{ color: "var(--white)", fontSize: "32px" }}>
              자세를 유지해 주세요
            </div>
          </CollectionOverlay>
        )}

        {/* 분석 중 오버레이 */}
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
