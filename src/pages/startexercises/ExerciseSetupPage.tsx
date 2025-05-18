import styled from "styled-components";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Gnb from "../../components/gnb/Gnb";
// import TextButton from '../../components/buttons/TextBtn';
import { TertiaryButton } from "../../components/buttons/TertiaryButton";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { SecondaryButton } from "../../components/buttons/SecondaryButton";
import TextButton from "../../components/buttons/TextBtn";
import { Stepper } from "../../components/inputs/Stepper";
import { useExerciseStore } from "../../store/useExerciseStore";
import { useSaveExerciseSets } from '../../hooks/useSaveExerciseSets';
import { useUserStore } from '../../store/useUserStore'; // 전화번호 저장소
import axios from "axios";

const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  margin-top: 180px;
  width: 3840px;
  height: 1980px;
  display: flex;
  padding-top: var(--margin-17);
  align-items: center;
`;

const MainContainer = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 80px;
`;

const LeftContainer = styled.div`
  width: 1470px;
  height: 1712px;
  display: flex;
  flex-direction: column;
  gap: 100px;
`;

const TitleContainer = styled.div`
  width: 1470px;
  height: 348px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-6);
`;

const TitleText = styled.div`
  width: 1470px;
  height: 112px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  color: var(--white);
`;

const SubTitleContainer = styled.div`
  width: 1470px;
  height: 192px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  color: var(--gray-300);
`;

const ImageContainer = styled.div`
  width: 1470px;
  height: 1264px;
  border-radius: var(--radius-xl);
  background: var(--effect-gray-gradient);
  color: var(--white);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const ExerciseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RightContainer = styled.div`
  width: 1470px;
  height: 1356px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 356px;
`;

const SetsContainer = styled.div`
  width: 1486px;
  height: 1000px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
  align-items: flex-end;
  overflow-y: auto;
  padding-right: var(--padding-m);
  margin-right: -16px;

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 16px;
  }

  &::-webkit-scrollbar-track {
    background: var(--gray-700);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--gray-600);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--gray-500);
  }
`;

const SetItemContainer = styled.div`
  width: 1454px;
  min-height: 356px;
  display: flex;
  gap: var(--gap-11);
  align-items: center;
  flex-shrink: 0;
`;

const SetText = styled.div`
  width: 230px;
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  color: var(--white);
`;

const VolumeContainer = styled.div`
  width: 1160px;
  height: 356px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-2xl) var(--padding-3xl);
  border-radius: var(--radius-m);
  background: var(--gray-800);
`;

const StepperGroup = styled.div`
  width: 380px;
  height: 252px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-3);
`;

const ButtonGroup = styled.div`
  width: 204px;
  height: 92px;
`;

const ButtonWrapper = styled.div`
  width: 1160px;
  height: 170px;
  display: flex;
  gap: var(--gap-11);
  justify-content: flex-end;
`;

const ExerciseSetupPage = () => {
  const navigate = useNavigate();
  const exercise = useExerciseStore((state) => state.selectedExercise);
  const setSetsGlobal = useExerciseStore((state) => state.setSets);
  const { mutate } = useSaveExerciseSets();
  const phoneNumber = useUserStore((state) => state.phoneNumber);

  // 세트별 무게와 횟수를 관리하는 상태
  interface SetData {
    weight: number;
    reps: number;
  }

  const [sets, setSets] = useState<SetData[]>([{ weight: 5, reps: 5 }]);

  // 운동이 선택되지 않았거나 준비 중인 운동이면 운동 선택 페이지로 이동
  useEffect(() => {
    if (!exercise) {
      navigate("/startexercises");
      return;
    }

    // 운동이 준비 중인 경우
    if (exercise.available === false) {
      alert(
        `${exercise.name}은(는) 현재 준비 중입니다. 다른 운동을 선택해주세요.`
      );
      navigate("/startexercises");
    }
  }, [exercise, navigate]);

  const handleAddSet = () => {
    setSets([...sets, { weight: 5, reps: 5 }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      const newSets = [...sets];
      newSets.splice(index, 1);
      setSets(newSets);
    }
  };

  const handleWeightChange = (value: number, index: number) => {
    const newSets = [...sets];
    newSets[index].weight = value;
    setSets(newSets);
  };

  const handleRepsChange = (value: number, index: number) => {
    const newSets = [...sets];
    newSets[index].reps = value;
    setSets(newSets);
  };

  const handleGoToSelectExercise = () => {
    navigate("/startexercises");
  };

  const handleGoToRealTimeExercise = () => {
    if (!exercise) return;

    // 전화번호 유효성 검사
    if (!phoneNumber) {
      alert('전화번호가 설정되지 않았습니다. 다시 로그인해주세요.');
      navigate('/info');
      return;
    }

    const exerciseType = exercise.type;
    const requests = sets.map(set => ({
      phone_number: phoneNumber.replace(/[^0-9]/g, ''),  // 숫자만 추출
      exerciseType,  // exercise_type -> exerciseType
      exercise_weight: set.weight,
      exercise_cnt: set.reps,
    }));

    console.log('Sending data:', requests);

    mutate(requests, {
      onSuccess: () => {
        setSetsGlobal(sets);
        navigate("/realtime-exercise");
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.data?.error === 'Missing phone_number') {
          alert('전화번호가 설정되지 않았습니다. 다시 로그인해주세요.');
          navigate('/info');
        } else {
          alert('운동 세트 저장에 실패했습니다. 다시 시도해주세요.');
        }
      }
    });
  };

  if (!exercise) {
    return (
      <FullScreen>
        <Gnb />
        <Container>
          <div style={{ color: "white", fontSize: "24px" }}>
            운동을 선택해주세요
          </div>
        </Container>
      </FullScreen>
    );
  }

  return (
    <FullScreen>
      <Gnb />
      <Container>
        <MainContainer>
          <LeftContainer>
            <TitleContainer>
              <TitleText>{exercise.name}</TitleText>
              <SubTitleContainer>
                {exercise.detailDescription}
              </SubTitleContainer>
            </TitleContainer>
            <ImageContainer>
              <ExerciseImage src={exercise.detailImage} alt={exercise.name} />
            </ImageContainer>
          </LeftContainer>
          <RightContainer>
            <SetsContainer>
              <TextButton onClick={handleAddSet}>+ 추가하기</TextButton>
              {sets.map((set, index) => (
                <SetItemContainer key={index}>
                  <SetText>{index + 1} 세트</SetText>
                  <VolumeContainer>
                    <StepperGroup>
                      <Stepper
                        value={set.weight}
                        min={0}
                        max={300}
                        step={5}
                        unit="kg"
                        onChange={(value) => handleWeightChange(value, index)}
                      />
                      <Stepper
                        value={set.reps}
                        min={0}
                        max={100}
                        step={1}
                        unit="회"
                        onChange={(value) => handleRepsChange(value, index)}
                      />
                    </StepperGroup>
                    <ButtonGroup>
                      <SecondaryButton
                        size="s"
                        disabled={sets.length === 1}
                        fontSize="32px"
                        onClick={() => handleRemoveSet(index)}
                      >
                        취소하기
                      </SecondaryButton>
                    </ButtonGroup>
                  </VolumeContainer>
                </SetItemContainer>
              ))}
            </SetsContainer>
            <ButtonWrapper>
              <TertiaryButton
                size="xl"
                fontSize="54px"
                onClick={handleGoToSelectExercise}
              >
                다른 운동하러 가기
              </TertiaryButton>
              <PrimaryButton
                size="xl"
                fontSize="54px"
                onClick={handleGoToRealTimeExercise}
              >
                운동하러 가기
              </PrimaryButton>
            </ButtonWrapper>
          </RightContainer>
        </MainContainer>
      </Container>
    </FullScreen>
  );
};

export default ExerciseSetupPage;
