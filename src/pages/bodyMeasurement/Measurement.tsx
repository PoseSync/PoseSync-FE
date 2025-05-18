import React, { useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUserStore } from "../../store/useUserStore";
import io, { Socket } from "socket.io-client";

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

// Window 타입 확장
declare global {
  interface Window {
    Pose: {
      new (options?: { locateFile: (file: string) => string }): Pose;
    };
  }
}

// 컴포넌트 스타일
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const animationRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullBodyDetectionTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pose 결과 처리 콜백 (의존성 문제 해결을 위해 useCallback 사용)
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

      // 가시성 높은 랜드마크 개수 계산
      const visibleCount = formattedLandmarks.filter(
        (lm) => lm.visibility !== undefined && lm.visibility > 0.5
      ).length;
      setVisibleLandmarksCount(visibleCount);

      // 콘솔에 감지된 랜드마크 개수 표시
      console.log(`감지된 랜드마크: ${visibleCount}/33 (가시성 > 0.5)`);

      // 전신 감지 여부 확인
      const bodyVisible = isFullBodyVisible(formattedLandmarks);

      // 전신 감지 상태 업데이트
      if (
        bodyVisible &&
        !fullBodyDetected &&
        !analyzing &&
        countdown === null
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
      } else if (!bodyVisible && !analyzing) {
        // 전신이 감지되지 않으면 타이머 초기화
        setBodyDetectionState("waiting");
        if (fullBodyDetectionTimerRef.current) {
          clearTimeout(fullBodyDetectionTimerRef.current);
          fullBodyDetectionTimerRef.current = null;
        }
        setFullBodyDetected(false);
      }
    },
    [fullBodyDetected, analyzing, countdown]
  );

  // 전신 포즈 감지 여부 확인
  const isFullBodyVisible = (landmarks: Landmark[]): boolean => {
    if (landmarks.length < 33) return false;

    // 주요 관절 ID 목록
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

    // 모든 주요 관절의 가시성 확인
    return keyJoints.every((id) => {
      const landmark = landmarks.find((lm) => lm.id === id);
      return (
        landmark &&
        landmark.visibility !== undefined &&
        landmark.visibility > 0.5
      );
    });
  };

  // 카운트다운 시작
  const startCountdown = (): void => {
    setCountdown(10); // 10초 카운트다운 시작

    // 기존 타이머 제거
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // 카운트다운 타이머 시작
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // 카운트다운 종료
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // 자동으로 측정 시작
          startAnalysis();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 초기 상태로 리셋
  const resetToInitialState = (): void => {
    setAnalyzing(false);
    setCountdown(null);
    setFullBodyDetected(false);
    setBodyDetectionState("waiting");

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
  };

  // 카메라 초기화
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera(): Promise<void> {
      try {
        // 카메라 접근 권한 요청
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });

        // 비디오 엘리먼트에 스트림 설정
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // 메타데이터 로드 시 재생 시작
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

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 애니메이션 프레임 취소
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // 타이머 정리
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

      // 카메라 스트림 정리
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Pose 모델 정리
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, []);

  // 카메라 프레임 전송 루프
  const startCamera = (): void => {
    if (!videoRef.current || !poseRef.current) return;

    const sendFrame = async (): Promise<void> => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        await poseRef.current?.send({ image: videoRef.current });
      }

      // 다음 프레임 처리 요청
      animationRef.current = requestAnimationFrame(sendFrame);
    };

    // 프레임 전송 시작
    sendFrame();
  };

  // 소켓 연결 및 Pose 모델 초기화
  useEffect(() => {
    if (!videoReady) return;

    // 소켓 연결
    socketRef.current = io("http://localhost:5001");

    socketRef.current.on("connect", () => {
      console.log("소켓 서버에 연결되었습니다.");
    });

    socketRef.current.on("body_analysis_result", (data: AnalysisResponse) => {
      console.log("체형 분석 결과:", data);

      // 분석 타임아웃 제거
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }

      if (data.success) {
        // 분석 완료 후 결과 페이지로 이동
        setTimeout(() => {
          navigate("/measurement-results", {
            state: { analysisResult: data.result },
          });
        }, 2000);
      } else {
        // 실패 처리
        resetToInitialState();
        alert("체형 분석에 실패했습니다. 다시 시도해주세요.");
      }
    });

    // MediaPipe Pose 모델 초기화
    const initPose = async (): Promise<void> => {
      if (typeof window.Pose !== "undefined") {
        try {
          // Pose 모델 인스턴스 생성
          poseRef.current = new window.Pose({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
          });

          // Pose 모델 옵션 설정
          poseRef.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          // 결과 콜백 등록
          poseRef.current.onResults(handlePoseResults);

          // 카메라 프레임 전송 시작
          startCamera();

          console.log("MediaPipe Pose 모델 초기화 완료");
        } catch (error) {
          console.error("Pose 모델 초기화 실패:", error);
        }
      } else {
        // Pose가 로드되지 않았으면 100ms 후 다시 시도
        setTimeout(initPose, 100);
      }
    };

    initPose();

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [videoReady, navigate, handlePoseResults]); // handlePoseResults 의존성 추가

  // 체형 분석 시작 함수
  const startAnalysis = (): void => {
    if (!landmarks.length || !socketRef.current) {
      console.log("랜드마크가 감지되지 않거나 소켓 연결이 없습니다.");
      return;
    }

    setAnalyzing(true);
    setCountdown(null);
    setBodyDetectionState("analyzing");

    console.log("체형 분석 시작:", {
      landmarks: landmarks,
      phoneNumber: phoneNumber,
      height: parseInt(height, 10),
    });

    // 기존 타임아웃 제거
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // 30초 타임아웃 설정 - 이 시간 내에 응답이 없으면 초기 상태로 돌아감
    analysisTimeoutRef.current = setTimeout(() => {
      console.log("측정 시간 초과 (30초)");
      resetToInitialState();
      alert("측정 시간이 초과되었습니다. 다시 시도해주세요.");
    }, 30000);

    // 서버에 체형 분석 요청
    socketRef.current.emit("analyze_body", {
      landmarks: landmarks,
      phoneNumber: phoneNumber,
      height: parseInt(height, 10) || 170, // 기본값 설정
    });
  };

  // 분석 취소
  const handleCancelAnalysis = (): void => {
    resetToInitialState();
  };

  // 상태 기반 메시지 선택
  const getStatusMessage = (): string => {
    if (analyzing) {
      return "신체 측정 중입니다. 잠시만 기다려주세요.";
    } else if (countdown !== null) {
      return "잠시 자세를 유지해 주세요. 곧 측정이 시작됩니다.";
    } else if (bodyDetectionState === "detected") {
      return "전신이 감지되었습니다. 자세를 유지해 주세요.";
    } else if (bodyDetectionState === "stable") {
      return "좋습니다! 자세를 계속 유지해 주세요.";
    } else {
      return ""; // 여기서 메시지 제거
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
            : "자세를 유지해 주세요"}
        </BodyGuideText>

        {/* 디버그 정보 표시 */}
        <DebugOverlay>감지된 랜드마크: {visibleLandmarksCount}/33</DebugOverlay>

        {/* 카운트다운 오버레이 */}
        {countdown !== null && (
          <CountdownOverlay>
            <CountdownText>{countdown}</CountdownText>
          </CountdownOverlay>
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
          onClick={analyzing ? handleCancelAnalysis : startAnalysis}
        >
          {analyzing ? "측정 그만하기" : "측정 시작하기"}
        </PrimaryButton>
      </ButtonBox>
    </FullScreen>
  );
};

export default Measurement;
