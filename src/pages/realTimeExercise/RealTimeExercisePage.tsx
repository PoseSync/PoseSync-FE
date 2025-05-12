// RealTimeExercisePage.tsx의 수정된 버전

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Gnb from "../../components/gnb/Gnb";
import PoseDetector from "../../components/realTimeExercise/PoseDetector";
import { useNavigate } from "react-router-dom";
import { useExerciseStore } from "../../store/useExerciseStore";
import { useUserStore } from "../../store/useUserStore";

// styled-components에서 타입 지정
interface StatusContainerProps {
  active?: boolean; // DOM에 전달되지 않도록 isSelected 대신 active 사용
}

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

const ExerciseDetailsContainer = styled.div`
  width: 100%;
  height: 1683px;
  display: flex;
  gap: var(--gap-8);
`;

const VideoContainer = styled.div`
  width: 2000px;
  height: 1683px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
`;

const InfoContainer = styled.div`
  width: 940px;
  height: 1683px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
`;

const StatusContainer = styled.div<StatusContainerProps>`
  width: 940px;
  height: 170px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--gray-800);
  border-radius: var(--radius-m);
  padding: var(--padding-m);
`;

const CountContainer = styled.div`
  width: 940px;
  height: 330px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
  background: var(--gray-800);
  border-radius: var(--radius-m);
  padding: var(--padding-2xl);
`;

const FeedbackContainer = styled.div`
  flex: 1;
  width: 940px;
  background: var(--gray-800);
  border-radius: var(--radius-m);
  padding: var(--padding-2xl);
  overflow-y: auto;
`;

const SetData = styled.div`
  width: 100%;
  height: 100px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  color: var(--white);
`;

const CountText = styled.div`
  width: 100%;
  height: 200px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 160px;
  line-height: 200px;
  letter-spacing: -1.6px;
  color: var(--yellow-400);
  text-align: center;
`;

// 버튼 스타일 추가
const TransmitButton = styled.button<{ active?: boolean }>`
  background: ${(props) =>
    props.active ? "var(--yellow-500)" : "var(--gray-700)"};
  padding: 10px 20px;
  border-radius: var(--radius-xs);
  color: ${(props) => (props.active ? "var(--gray-900)" : "white")};
  border: none;
  cursor: pointer;
  font-family: "Pretendard Variable", sans-serif;
  font-size: 24px;
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
  // 3D 모드를 사용하지 않으므로 항상 "2d"로 고정
  const visualizationMode = "2d";

  useEffect(() => {
    console.log("RealTimeExercisePage가 마운트되었습니다.");
    console.log("exercise:", exercise);
    console.log("sets:", sets);
    console.log("phoneNumber:", phoneNumber);

    // 필요한 데이터가 없으면 설정 페이지로 리다이렉트
    if (!exercise || !sets || sets.length === 0) {
      console.log("필요한 데이터가 없어 설정 페이지로 리다이렉트합니다.");
      navigate("/exercisesetup");
    }
  }, [exercise, sets, phoneNumber, navigate]);

  // 피드백 추가 함수
  const handleFeedback = (message: string) => {
    setFeedbacks((prev) => [...prev, message]);
  };

  // 카운트 업데이트 콜백
  const handleCountUpdate = (newCount: number) => {
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
  };

  // 전송 상태 토글
  const toggleTransmission = () => {
    setIsTransmitting((prev) => !prev);
  };

  // 현재 세트 정보
  const currentSetData =
    sets && sets.length > 0 && currentSet <= sets.length
      ? sets[currentSet - 1]
      : { weight: 0, reps: 0 };

  if (!exercise || !currentSetData) {
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
    return "squat"; // 기본값
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
          <ExerciseDetailsContainer>
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
            <InfoContainer>
              <StatusContainer>
                <div style={{ color: "white", fontSize: "48px" }}>
                  {currentSetData.weight}kg × {currentSetData.reps}회
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <TransmitButton
                    active={isTransmitting}
                    onClick={toggleTransmission}
                  >
                    {isTransmitting ? "전송 중지" : "전송 시작"}
                  </TransmitButton>
                </div>
              </StatusContainer>
              <CountContainer>
                <SetData>{currentSet}세트 진행 중</SetData>
                <CountText>{count}</CountText>
              </CountContainer>
              <FeedbackContainer>
                <div
                  style={{
                    color: "white",
                    fontSize: "48px",
                    marginBottom: "24px",
                  }}
                >
                  실시간 피드백
                </div>
                {feedbacks.map((feedback, index) => (
                  <div
                    key={index}
                    style={{
                      color: "var(--gray-200)",
                      fontSize: "40px",
                      marginBottom: "16px",
                      padding: "16px",
                      background: "var(--gray-700)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    {feedback}
                  </div>
                ))}
              </FeedbackContainer>
            </InfoContainer>
          </ExerciseDetailsContainer>
        </ExerciseContainer>
      </Container>
    </FullScreen>
  );
};

export default RealTimeExercisePage;
