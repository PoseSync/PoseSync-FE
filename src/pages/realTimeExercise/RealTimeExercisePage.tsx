import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import Gnb from "../../components/gnb/Gnb";
import PoseDetector from "../../components/realTimeExercise/PoseDetector";
import { useNavigate } from "react-router-dom";
import { useExerciseStore } from "../../store/useExerciseStore";
import { useUserStore } from "../../store/useUserStore";

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
  padding-top: var(--margin-6);
`;

const ExerciseContainer = styled.div`
  width: 3020px;
  height: 1800px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
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
`;

const VideoContainer = styled.div`
  width: 2300px;
  height: 1683px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
`;

const InfoContainer = styled.div`
  width: 640px;
  height: 1683px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
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
const AccuracyBarProgress = styled.div<{ value: number }>`
  width: ${(props) => props.value}%;
  height: 100%;
  background-color: ${(props) => {
    if (props.value >= 80) return "var(--green-500)";
    if (props.value >= 50) return "var(--yellow-400)";
    return "var(--red-400)";
  }};
  border-radius: 10px;
  transition: width 0.3s ease;
`;

// 전송 버튼 스타일
const TransmitButton = styled.button<{ active?: boolean }>`
  background: ${(props) =>
    props.active ? "var(--yellow-500)" : "var(--gray-700)"};
  padding: 20px;
  border-radius: var(--radius-xs);
  color: ${(props) => (props.active ? "var(--gray-900)" : "white")};
  border: none;
  cursor: pointer;
  font-family: "Pretendard Variable", sans-serif;
  font-size: 36px;
  width: 100%;
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

// 피드백 메시지 - 중요도에 따라 다른 스타일 적용
const FeedbackMessage = styled.div<{ isImportant?: boolean }>`
  color: ${(props) =>
    props.isImportant ? "var(--yellow-400)" : "var(--gray-200)"};
  font-family: "Pretendard Variable", sans-serif;
  font-weight: ${(props) => (props.isImportant ? "700" : "500")};
  font-size: 36px;
  background: ${(props) =>
    props.isImportant ? "var(--gray-600)" : "var(--gray-700)"};
  padding: 16px;
  border-radius: var(--radius-xs);
  margin-bottom: 10px;
  border-left: ${(props) =>
    props.isImportant ? "4px solid var(--yellow-400)" : "none"};
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
  const exercise = useExerciseStore((state) => state.selectedExercise);
  const sets = useExerciseStore((state) => state.sets);
  const phoneNumber = useUserStore((state) => state.phoneNumber);

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

  useEffect(() => {
    console.log("RealTimeExercisePage가 마운트되었습니다.");
    console.log("exercise:", exercise);
    console.log("sets:", sets);
    console.log("phoneNumber:", phoneNumber);

    // 필요한 데이터가 없으면 설정 페이지로 리다이렉트
    if (!exercise || !sets || sets.length === 0) {
      console.log("필요한 데이터가 없어 설정 페이지로 리다이렉트합니다.");
      navigate("/exercisesetup");
      return;
    }
  }, [exercise, sets, phoneNumber, navigate]);

  // 소켓 서버로부터 오는 응답 처리를 위한 함수
  useEffect(() => {
    // 소켓이 연결되고 전송 중일 때만 필요한 처리
    if (isTransmitting) {
      // 실제 서버와의 통신에서는 이 부분이 구현되어야 함
      // 소켓 통신 부분은 주석 처리하여 타입 오류 방지
      /*
      const handleSocketResult = (data: any) => {
        // 서버로부터 받은 데이터에서 count와 similarity 값 추출
        if (data && typeof data === 'object') {
          // 카운트 정보가 있으면 업데이트
          if ('count' in data && typeof data.count === 'number') {
            setCount(data.count);
          }

          // 유사도/정확도 정보가 있으면 업데이트
          if ('similarity' in data && typeof data.similarity === 'number') {
            setAccuracy(data.similarity);
            
            // 정확도에 따른 자동 피드백 생성 (예시)
            if (data.similarity < 40) {
              handleFeedback("자세가 크게 벗어났습니다. 가이드라인을 참고해주세요.");
            } else if (data.similarity < 60) {
              handleFeedback("자세를 조정해주세요. 기본 자세와 차이가 있습니다.");
            } else if (data.similarity > 90) {
              handleFeedback("자세가 매우 정확합니다. 좋은 움직임입니다!");
            }
          }

          // 피드백 메시지가 있으면 추가
          if ('feedback' in data && typeof data.feedback === 'string' && data.feedback) {
            handleFeedback(data.feedback);
          }
        }
      };

      // 소켓 이벤트 리스너 등록 (실제 구현에서는 해당 소켓 객체에 맞게 수정 필요)
      // socket.on('result', handleSocketResult);

      // 정리 함수
      return () => {
        // 소켓 이벤트 리스너 제거
        // socket.off('result', handleSocketResult);
      };
      */
    }
  }, [isTransmitting, handleFeedback]);

  // 카운트 업데이트 콜백 - useCallback으로 메모이제이션
  const handleCountUpdate = useCallback(
    (newCount: number) => {
      // 소켓 통신으로부터 받은 카운트 값을 사용
      setCount(newCount);

      // 현재 세트 목표 횟수 달성 시 다음 세트로 넘어가기
      if (
        sets &&
        currentSet <= sets.length &&
        newCount >= sets[currentSet - 1]?.reps
      ) {
        if (currentSet < sets.length) {
          // 다음 세트로 넘어가기 전 피드백 추가
          handleFeedback(`${currentSet}세트 완료! 다음 세트를 준비하세요.`);

          setTimeout(() => {
            setCurrentSet((prev) => prev + 1);
            setCount(0);
          }, 3000);
        } else {
          // 모든 세트 완료
          handleFeedback("모든 세트가 완료되었습니다! 수고하셨습니다.");

          setTimeout(() => {
            navigate("/completed");
          }, 5000);
        }
      }
    },
    [sets, currentSet, handleFeedback, navigate]
  );

  // 전송 상태 토글
  const toggleTransmission = () => {
    setIsTransmitting((prev) => !prev);

    // 전송 시작 시 피드백 및 정확도 초기화
    if (!isTransmitting) {
      setAccuracy(75); // 기본 정확도로 리셋
      setFeedbacks([]); // 피드백 메시지 초기화
    }
  };

  // 현재 세트 정보
  const currentSetData =
    sets && sets.length > 0 && currentSet <= sets.length
      ? sets[currentSet - 1]
      : { weight: 0, reps: 0 };

  // 운동 선택으로 돌아가기
  const handleGoBackToExerciseSelection = () => {
    navigate("/startexercises");
  };

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

  // 운동 유형 매핑
  const getExerciseType = (name: string): string => {
    if (name === "바벨 스쿼트") return "squat";
    if (name === "숄더 프레스") return "dumbbell_shoulder_press";
    if (name === "런지") return "lunge";
    if (name === "사이드 레터럴 레이즈") return "lateral_raise";
    if (name === "데드 리프트") return "deadlift";
    if (name === "덤벨/바벨 컬") return "curl";
    if (name === "바벨로우") return "barbell_row";
    if (name === "덤벨로우") return "dumbbell_row";
    if (name === "프론트레이즈") return "front_raise";
    if (name === "인클라인 벤치프레스") return "incline_bench_press";

    // 기본값으로 squat 반환
    console.warn(`알 수 없는 운동 유형: ${name}, 기본값 'squat'로 설정합니다.`);
    return "squat";
  };

  return (
    <FullScreen>
      <Gnb />
      <Container>
        <ExerciseContainer>
          <TitleContainer>
            <div>{exercise.name}</div>
            <div style={{ fontSize: "54px", color: "var(--gray-300)" }}>
              진행: {currentSet}/{sets.length} 세트
            </div>
          </TitleContainer>
          <MainContentContainer>
            {/* 왼쪽: 카메라 영역 */}
            <VideoContainer>
              <PoseDetector
                phoneNumber={phoneNumber || testPhoneNumber}
                exerciseType={getExerciseType(exercise.name)}
                visualizationMode={visualizationMode}
                onCountUpdate={handleCountUpdate}
                onFeedback={handleFeedback}
                isTransmitting={isTransmitting}
              />
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
                    <AccuracyBarProgress value={accuracy} />
                  </AccuracyBarBackground>
                </AccuracyDisplay>

                {/* 전송 버튼 */}
                <TransmitButton
                  active={isTransmitting}
                  onClick={toggleTransmission}
                >
                  {isTransmitting ? "전송 중지" : "전송 시작"}
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
                    feedback.includes("매우 정확합니다");

                  return (
                    <FeedbackMessage key={index} isImportant={isImportant}>
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
