import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import Gnb from "../../components/gnb/Gnb";
import PoseDetector from "../../components/realTimeExercise/PoseDetector";
import { useNavigate } from "react-router-dom";
import { useExerciseStore } from "../../store/useExerciseStore";
import { useUserStore } from "../../store/useUserStore";
import { exercises, Exercise } from "../../data/exercises";
import { NextSetInfo } from "../../types"; // 🎯 수정: types/index.ts에서 import

const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ExerciseContainer = styled.div`
  width: 3020px;
  height: 1980px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
  justify-content: center; /* 중앙 정렬을 위해 추가 */
`;

const TitleContainer = styled.div`
  width: 100%;
  height: 112px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  color: var(--white);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MainContentContainer = styled.div`
  display: flex;
  gap: var(--gap-8);
  height: 1683px;
  align-items: center; /* 수직 중앙 정렬 */
`;

// 비디오 컨테이너 중앙 정렬 및 위치 조정
const VideoContainer = styled.div`
  width: 1920px;
  height: 1080px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// 전체화면 버튼 추가
const FullscreenButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  z-index: 10;
  font-size: 24px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const InfoContainer = styled.div`
  width: 640px;
  height: 1683px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
  justify-content: center; /* 중앙 정렬을 위해 추가 */
`;

const ControlPanel = styled.div`
  width: 100%;
  background-color: var(--gray-800);
  border-radius: var(--radius-m);
  padding: var(--padding-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
`;

// 휴식 오버레이 스타일 추가
const RestOverlay = styled.div`
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
  z-index: 20;
`;

const RestText = styled.div`
  color: var(--yellow-400);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 80px;
  margin-bottom: 20px;
`;

const RestCountdown = styled.div`
  color: var(--white);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 160px;
  margin-bottom: 20px;
`;

const RestSubText = styled.div`
  color: var(--gray-300);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
`;

// 횟수 표시를 위한 스타일
const CountDisplay = styled.div`
  color: var(--yellow-400);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 160px;
  text-align: center;
  margin-bottom: 20px;
`;

// 세트 정보 표시를 위한 스타일
const SetInfoDisplay = styled.div`
  color: var(--white);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
  text-align: center;
  margin-bottom: 30px;
`;

// 정확도 표시를 위한 스타일
const AccuracyDisplay = styled.div`
  color: var(--white);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
`;

// 정확도 바 배경
const AccuracyBarBackground = styled.div`
  width: 100%;
  height: 20px;
  background-color: var(--gray-700);
  border-radius: 10px;
  overflow: hidden;
`;

// 정확도 바 진행
const AccuracyBarProgress = styled.div<{ $value: number }>`
  width: ${(props) => props.$value}%;
  height: 100%;
  background-color: ${(props) => {
    if (props.$value >= 80) return "var(--green-500)";
    if (props.$value >= 50) return "var(--yellow-400)";
    return "var(--red-400)";
  }};
  border-radius: 10px;
  transition: width 0.3s ease;
`;

// 전송 버튼 스타일
const TransmitButton = styled.button<{
  $active?: boolean;
  $disabled?: boolean;
}>`
  background: ${(props) => {
    if (props.$disabled) return "var(--gray-600)";
    return props.$active ? "var(--yellow-500)" : "var(--gray-700)";
  }};
  padding: 20px;
  border-radius: var(--radius-xs);
  color: ${(props) => {
    if (props.$disabled) return "var(--gray-400)";
    return props.$active ? "var(--gray-900)" : "white";
  }};
  border: none;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  font-family: "Pretendard Variable", sans-serif;
  font-size: 36px;
  width: 100%;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
`;

// 피드백 컨테이너
const FeedbackContainer = styled.div`
  flex: 1;
  background-color: var(--gray-800);
  border-radius: var(--radius-m);
  padding: var(--padding-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--gap-4);
  overflow-y: auto;
`;

// 피드백 제목
const FeedbackTitle = styled.div`
  color: var(--white);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
  margin-bottom: 20px;
`;

// 피드백 메시지 - 중요도에 따라 다른 스타일 적용 ($ 접두사 사용)
const FeedbackMessage = styled.div<{ $isImportant?: boolean }>`
  color: ${(props) =>
    props.$isImportant ? "var(--yellow-400)" : "var(--gray-200)"};
  font-family: "Pretendard Variable", sans-serif;
  font-weight: ${(props) => (props.$isImportant ? "700" : "500")};
  font-size: 36px;
  background: ${(props) =>
    props.$isImportant ? "var(--gray-600)" : "var(--gray-700)"};
  padding: 16px;
  border-radius: var(--radius-xs);
  margin-bottom: 10px;
  border-left: ${(props) =>
    props.$isImportant ? "4px solid var(--yellow-400)" : "none"};
`;

// 준비 중 알림 컴포넌트
const PreparingNotice = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--gray-800);
  border-radius: var(--radius-xl);
  color: var(--white);
`;

const PreparingTitle = styled.h2`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 80px;
  margin-bottom: 40px;
  color: var(--red-400);
`;

const PreparingText = styled.p`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 500;
  font-size: 54px;
  line-height: 72px;
  text-align: center;
  max-width: 70%;
`;

const BackButton = styled.button`
  margin-top: 60px;
  padding: 20px 40px;
  background-color: var(--gray-700);
  color: var(--white);
  border: none;
  border-radius: var(--radius-m);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 48px;
  cursor: pointer;

  &:hover {
    background-color: var(--gray-600);
  }
`;

const RealTimeExercisePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const exercise = useExerciseStore((state) => state.selectedExercise);
  const sets = useExerciseStore((state) => state.sets);
  const setSetsGlobal = useExerciseStore((state) => state.setSets);
  const setSelectedExercise = useExerciseStore(
    (state) => state.setSelectedExercise
  );
  const phoneNumber = useUserStore((state) => state.phoneNumber);
  const setUserPhoneNumber = useUserStore((state) => state.setPhoneNumber);
  const videoContainerRef = useRef<HTMLDivElement>(null); // 비디오 컨테이너 참조 추가

  // 테스트용 전화번호 설정
  const testPhoneNumber = "01012345678";

  const [currentSet, setCurrentSet] = useState(1);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [count, setCount] = useState(0);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  // 가정된 정확도 값 (실제로는 서버에서 받아올 수 있습니다)
  const [accuracy, setAccuracy] = useState<number>(75);
  // 3D 모드를 사용하지 않으므로 항상 "2d"로 고정
  const visualizationMode = "2d";
  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 🎯 새로 추가: 세트별 순환 관련 상태
  const [isResting, setIsResting] = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);
  const [nextSetInfo, setNextSetInfo] = useState<{
    weight: number;
    reps: number;
  } | null>(null);

  // 서버 변수명과 운동 이름 매핑
  const exerciseTypeMapping: Record<string, string> = {
    squat: "바벨 스쿼트",
    lunge: "런지",
    shoulder_press: "숄더 프레스",
    dumbbell_shoulder_press: "숄더 프레스",
    side_lateral_raise: "사이드 레터럴 레이즈",
    deadlift: "데드 리프트",
    barbell_curl: "바벨 컬",
    barbell_row: "바벨로우",
    dumbbell_row: "덤벨로우",
    front_raise: "프론트레이즈",
    incline_bench_press: "인클라인 벤치프레스",
  };

  // 🎯 세트 완료 처리 함수
  const handleSetComplete = useCallback(
    (setInfo: NextSetInfo) => {
      console.log("🏁 세트 완료:", setInfo);

      // 1. 전송 중단 (disconnect_client 패킷 자동 전송)
      setIsTransmitting(false);

      if (setInfo.is_last) {
        // 마지막 세트 완료 - 운동 종료
        handleFeedback("모든 세트가 완료되었습니다! 수고하셨습니다.");
        setTimeout(() => {
          navigate("/completed");
        }, 3000);
      } else {
        // 다음 세트가 있음 - 3초 휴식 후 자동 시작
        setIsResting(true);
        setRestCountdown(3);
        setCurrentSet(setInfo.set_number);
        setCount(0); // 카운트 리셋

        // 다음 세트 정보 저장
        if (
          setInfo.next_weight !== undefined &&
          setInfo.next_target_count !== undefined
        ) {
          setNextSetInfo({
            weight: setInfo.next_weight,
            reps: setInfo.next_target_count,
          });
        }

        handleFeedback(
          `${setInfo.set_number - 1}세트 완료! 3초 후 ${
            setInfo.set_number
          }세트 시작합니다.`
        );

        // 3초 카운트다운
        let currentCountdown = 3;
        const countdownInterval = setInterval(() => {
          currentCountdown--;
          setRestCountdown(currentCountdown);

          if (currentCountdown <= 0) {
            clearInterval(countdownInterval);
            setIsResting(false);
            setIsTransmitting(true); // 🟢 다음 세트 자동 시작
            handleFeedback(`${setInfo.set_number}세트 시작!`);
          }
        }, 1000);
      }
    },
    [navigate] // 🎯 수정: handleFeedback 의존성 제거 (아래에서 useCallback으로 정의)
  );

  // 피드백 추가 함수 - useCallback으로 메모이제이션하여 의존성 배열에 안전하게 사용
  const handleFeedback = useCallback((message: string) => {
    // 새 피드백을 추가하고 최대 10개까지만 유지 (너무 많아지지 않도록)
    setFeedbacks((prev) => {
      const newFeedbacks = [...prev, message];
      return newFeedbacks.slice(-10); // 최근 10개만 유지
    });

    // 피드백 메시지에 기반한 정확도 분석 (예시)
    // 실제로는 서버에서 랜드마크 비교 결과에 따라 정확도가 계산되어야 함
    if (message.includes("자세가 정확합니다") || message.includes("좋습니다")) {
      setAccuracy((prev) => Math.min(prev + 5, 100));
    } else if (message.includes("수정") || message.includes("조정")) {
      setAccuracy((prev) => Math.max(prev - 3, 0));
    }
  }, []);

  // URL 파라미터 처리
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlExerciseType = searchParams.get("exercise");
    const urlPhoneNumber = searchParams.get("phone");

    console.log("URL 파라미터:", { urlExerciseType, urlPhoneNumber });

    // URL에서 전화번호가 있으면 설정
    if (urlPhoneNumber && urlPhoneNumber !== phoneNumber) {
      console.log("URL에서 전화번호 설정:", urlPhoneNumber);
      setUserPhoneNumber(urlPhoneNumber);
    }

    // URL에서 운동 타입이 있고, 현재 선택된 운동이 없거나 다르면 설정
    if (urlExerciseType) {
      const exerciseName = exerciseTypeMapping[urlExerciseType];

      if (exerciseName) {
        // exercises 배열에서 해당 운동 찾기
        const targetExercise = exercises.find((ex) => ex.name === exerciseName);

        if (targetExercise) {
          // 현재 선택된 운동과 다르거나 없으면 설정
          if (!exercise || exercise.name !== targetExercise.name) {
            console.log(
              `URL 파라미터로 운동 설정: ${targetExercise.name} (${urlExerciseType})`
            );
            setSelectedExercise(targetExercise);

            // 기본 세트 설정 (1세트, 5kg, 5회)
            if (!sets || sets.length === 0) {
              setSetsGlobal([{ weight: 5, reps: 5 }]);
              console.log("기본 세트 설정: 5kg x 5회");
            }
          }
        } else {
          console.warn(
            `운동을 찾을 수 없습니다: ${exerciseName} (${urlExerciseType})`
          );
        }
      } else {
        console.warn(`매핑되지 않은 운동 타입: ${urlExerciseType}`);
      }
    }
  }, [
    location.search,
    exercise,
    phoneNumber,
    sets,
    setUserPhoneNumber,
    setSelectedExercise,
    setSetsGlobal,
    exerciseTypeMapping, // 🎯 수정: 의존성 배열에 추가
  ]);

  // 전체화면 토글 함수
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 전체화면으로 전환
      if (
        videoContainerRef.current &&
        videoContainerRef.current.requestFullscreen
      ) {
        videoContainerRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch((err) => {
            console.error(`전체화면 오류: ${err.message}`);
          });
      }
    } else {
      // 전체화면 종료
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            console.error(`전체화면 종료 오류: ${err.message}`);
          });
      }
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    console.log("RealTimeExercisePage가 마운트되었습니다.");
    console.log("exercise:", exercise);
    console.log("sets:", sets);
    console.log("phoneNumber:", phoneNumber);

    // URL 파라미터로 운동이 설정되는 경우 리다이렉트하지 않음
    const searchParams = new URLSearchParams(location.search);
    const urlExerciseType = searchParams.get("exercise");

    if (!urlExerciseType && (!exercise || !sets || sets.length === 0)) {
      console.log("필요한 데이터가 없어 설정 페이지로 리다이렉트합니다.");
      navigate("/exercisesetup");
      return;
    }
  }, [exercise, sets, phoneNumber, navigate, location.search]);

  // 카운트 업데이트 콜백 - useCallback으로 메모이제이션
  const handleCountUpdate = useCallback((newCount: number) => {
    // 소켓 통신으로부터 받은 카운트 값을 사용
    setCount(newCount);

    // 세트 완료는 서버에서 next 이벤트로 처리되므로
    // 여기서는 단순히 카운트만 업데이트
  }, []);

  // 전송 상태 토글 (수정된 부분)
  const toggleTransmission = () => {
    if (isResting) {
      // 휴식 중에는 버튼 비활성화
      return;
    }

    const wasTransmitting = isTransmitting;
    setIsTransmitting((prev) => !prev);

    if (wasTransmitting) {
      // 전송을 중단하는 경우 - disconnect_client 패킷 전송
      console.log("🔴 전송 중단 - 사용자가 수동으로 중지");

      // 피드백 및 정확도 초기화
      setFeedbacks([]);
      setAccuracy(75);

      // 피드백 메시지 추가
      handleFeedback("운동이 중단되었습니다. 결과가 저장됩니다.");
    } else {
      // 전송을 시작하는 경우
      console.log("🟢 전송 시작");

      // 피드백 및 정확도 초기화
      setAccuracy(75);
      setFeedbacks([]);

      // 피드백 메시지 추가
      handleFeedback("운동 전송을 시작합니다. 자세를 취해주세요.");
    }
  };

  // 현재 세트 정보 (다음 세트 정보가 있으면 그것을 사용, 없으면 기본 세트 정보 사용)
  const currentSetData =
    nextSetInfo ||
    (sets && sets.length > 0 && currentSet <= sets.length
      ? sets[currentSet - 1]
      : { weight: 0, reps: 0 });

  // 운동 선택으로 돌아가기
  const handleGoBackToExerciseSelection = () => {
    navigate("/startexercises");
  };

  // 운동 유형 매핑 함수 수정
  const getExerciseType = useCallback(
    (exerciseData: Exercise | null): string => {
      // URL 파라미터 우선 확인
      const searchParams = new URLSearchParams(location.search);
      const urlExerciseType = searchParams.get("exercise");

      if (urlExerciseType) {
        console.log(`URL에서 운동 타입 사용: ${urlExerciseType}`);
        return urlExerciseType;
      }

      // 기존 매핑 로직
      if (!exerciseData) {
        console.warn("운동 정보가 없습니다. 기본값 'squat'로 설정합니다.");
        return "squat";
      }

      // 운동 이름 기반 매핑
      if (exerciseData.name === "바벨 스쿼트") return "squat";
      if (exerciseData.name === "숄더 프레스") return "dumbbell_shoulder_press";
      if (exerciseData.name === "런지") return "lunge";
      if (exerciseData.name === "바벨 컬") return "barbell_curl";
      if (exerciseData.name === "사이드 레터럴 레이즈")
        return "side_lateral_raise";
      if (exerciseData.name === "데드 리프트") return "deadlift";
      if (exerciseData.name === "바벨로우") return "barbell_row";
      if (exerciseData.name === "덤벨로우") return "dumbbell_row";
      if (exerciseData.name === "프론트레이즈") return "front_raise";
      if (exerciseData.name === "인클라인 벤치프레스")
        return "incline_bench_press";

      console.warn(
        `알 수 없는 운동 유형: ${exerciseData.name}, 기본값 'squat'로 설정합니다.`
      );
      return "squat";
    },
    [location.search]
  ); // 🎯 수정: useCallback으로 메모이제이션하고 의존성 추가

  // 운동이 없거나 준비중인 경우 대체 UI 표시
  if (!exercise) {
    return (
      <FullScreen>
        <Gnb />
        <Container>
          <PreparingNotice>
            <PreparingTitle>운동 정보를 찾을 수 없습니다</PreparingTitle>
            <PreparingText>운동을 먼저 선택해주세요.</PreparingText>
            <BackButton onClick={handleGoBackToExerciseSelection}>
              운동 선택으로 돌아가기
            </BackButton>
          </PreparingNotice>
        </Container>
      </FullScreen>
    );
  }

  // 운동이 준비중인 경우 - ExerciseSetupPage에서 이미 처리되므로 여기서는 중복 체크
  if (exercise.available === false) {
    return (
      <FullScreen>
        <Gnb />
        <Container>
          <PreparingNotice>
            <PreparingTitle>준비 중인 운동입니다</PreparingTitle>
            <PreparingText>
              {exercise.name}은(는) 현재 준비 중인 운동입니다. 다른 운동을
              선택해주세요.
            </PreparingText>
            <BackButton onClick={handleGoBackToExerciseSelection}>
              운동 선택으로 돌아가기
            </BackButton>
          </PreparingNotice>
        </Container>
      </FullScreen>
    );
  }

  if (!currentSetData) {
    return (
      <FullScreen>
        <Gnb />
        <Container>
          <div style={{ color: "white", fontSize: "24px" }}>
            운동 정보를 불러오는 중입니다...
          </div>
        </Container>
      </FullScreen>
    );
  }

  return (
    <FullScreen>
      <Gnb />
      <Container>
        <ExerciseContainer>
          <TitleContainer>
            <div>{exercise.name}</div>
            <div style={{ fontSize: "54px", color: "var(--gray-300)" }}>
              진행: {currentSet}/{sets?.length || 1} 세트
            </div>
          </TitleContainer>
          <MainContentContainer>
            {/* 왼쪽: 카메라 영역 */}
            <VideoContainer ref={videoContainerRef}>
              <PoseDetector
                phoneNumber={phoneNumber || testPhoneNumber}
                exerciseType={getExerciseType(exercise)}
                visualizationMode={visualizationMode}
                onCountUpdate={handleCountUpdate}
                onFeedback={handleFeedback}
                onSetComplete={handleSetComplete} // 🎯 새로 추가: 세트 완료 콜백
                isTransmitting={isTransmitting}
                isResting={isResting} // 🎯 새로 추가: 휴식 상태 전달
              />

              {/* 🎯 휴식 중 오버레이 */}
              {isResting && (
                <RestOverlay>
                  <RestText>휴식 시간</RestText>
                  <RestCountdown>{restCountdown}</RestCountdown>
                  <RestSubText>다음 세트까지</RestSubText>
                </RestOverlay>
              )}

              {/* 전체화면 버튼 추가 */}
              <FullscreenButton onClick={toggleFullscreen}>
                {isFullscreen ? "전체화면 종료" : "전체화면"}
              </FullscreenButton>
            </VideoContainer>

            {/* 오른쪽: 정보 패널 */}
            <InfoContainer>
              {/* 상단: 횟수, 정확도, 전송 버튼 모음 */}
              <ControlPanel>
                {/* 횟수 표시 */}
                <CountDisplay>{count}</CountDisplay>

                {/* 세트 정보 표시 */}
                <SetInfoDisplay>
                  {currentSet}세트 진행 중
                  <br />
                  {currentSetData.weight}kg × {currentSetData.reps}회
                </SetInfoDisplay>

                {/* 정확도 표시 */}
                <AccuracyDisplay>
                  정확도: {accuracy}%
                  <AccuracyBarBackground>
                    <AccuracyBarProgress $value={accuracy} />
                  </AccuracyBarBackground>
                </AccuracyDisplay>

                {/* 전송 버튼 */}
                <TransmitButton
                  $active={isTransmitting}
                  $disabled={isResting}
                  onClick={toggleTransmission}
                >
                  {isResting
                    ? "휴식 중..."
                    : isTransmitting
                    ? "전송 중지"
                    : "전송 시작"}
                </TransmitButton>
              </ControlPanel>

              {/* 하단: 피드백 메시지 영역 */}
              <FeedbackContainer>
                <FeedbackTitle>실시간 피드백</FeedbackTitle>
                {feedbacks.map((feedback, index) => {
                  // 중요한 피드백 판단 (예: 정확도 관련 피드백이나 세트 완료 메시지 등)
                  const isImportant =
                    feedback.includes("자세가 크게 벗어났습니다") ||
                    feedback.includes("세트 완료") ||
                    feedback.includes("수고하셨습니다") ||
                    feedback.includes("매우 정확합니다") ||
                    feedback.includes("중단되었습니다") ||
                    feedback.includes("시작합니다") ||
                    feedback.includes("시작!");

                  return (
                    <FeedbackMessage key={index} $isImportant={isImportant}>
                      {feedback}
                    </FeedbackMessage>
                  );
                })}
              </FeedbackContainer>
            </InfoContainer>
          </MainContentContainer>
        </ExerciseContainer>
      </Container>
    </FullScreen>
  );
};

export default RealTimeExercisePage;
