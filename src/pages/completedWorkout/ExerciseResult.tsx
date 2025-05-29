import React from "react";
import styled from "styled-components";
import Gnb from "../../components/gnb/Gnb";
import CheckImg from "../../assets/images/items/check.png";
import { useExerciseStore } from "../../store/useExerciseStore";
import { TertiaryButton } from "../../components/buttons/TertiaryButton";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";
import { useGetExerciseSetResult } from "../../hooks/useGetExerciseSetResult";

const Container = styled.div`
  width: 3840px;
  height: 2160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gray-900);
`;

const MainContainer = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const MainBox = styled.div`
  width: 3020px;
  height: 1445px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 80px;
`;

const LeftContainer = styled.div`
  width: 1780px;
  height: 1445px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

const TextContainer = styled.div`
  width: 1780px;
  height: 112px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  color: var(--white);
`;

const ImageContainer = styled.div`
  width: 1780px;
  height: 1264px;
`;

const RightContainer = styled.div`
  width: 1160px;
  height: 1264px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 97px;
`;

const SetBox = styled.div`
  width: 1160px;
  height: 997px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-5);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: var(--padding-m);

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

const SetItem = styled.div`
  width: 1160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--gray-800);
  padding: var(--padding-m) var(--padding-3xl) var(--padding-m)
    var(--padding-3xl);
  border-radius: var(--radius-m);
`;

const SetItemDetail = styled.div`
  width: 1048px;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SetKgCount = styled.div`
  width: 800px;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--margin-16);
`;

const Set = styled.div`
  width: 174px;
  height: 80px;
  display: flex;
  gap: var(--margin-1);
  align-items: center;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  color: var(--white);
`;

const SetVolume = styled.div`
  width: 500px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--margin-4);
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  color: var(--white);
`;

const ItemContainer = styled.div`
  width: 80px;
  height: 80px;
`;

const ButtonWrapper = styled.div`
  width: 1160px;
  height: 170px;
  display: flex;
  gap: var(--gap-11);
  justify-content: flex-end;
`;

const ExerciseResult = () => {
  const navigate = useNavigate();
  const exercise = useExerciseStore((state) => state.selectedExercise);
  const sets = useExerciseStore((state) => state.sets); // Zustand에서 세트 정보 가져오기
  const phoneNumber = useUserStore((state) => state.phoneNumber);

  // API 호출 대신 Zustand 스토어의 세트 정보 사용
  const { data, isLoading, error } = useGetExerciseSetResult(
    phoneNumber.replace(/[^0-9]/g, "") // 숫자만 추출
  );

  const handleGoToHome = () => {
    navigate("/");
  };

  const handleGoToSelectExercise = () => {
    navigate("/startexercises");
  };

  // 세트 데이터 결정 - API 데이터가 있으면 사용, 없으면 Zustand 데이터 사용
  const displaySets =
    data?.sets ||
    sets?.map((set, index) => ({
      id: index + 1,
      exercise_weight: set.weight,
      target_count: set.reps,
      is_success: true, // 🎯 항상 성공으로 표시
      current_count: set.reps, // 목표 횟수와 동일하게 설정
      is_finished: true,
      routine_group: 1,
      exercise_type: exercise?.type || "unknown",
      created_at: new Date().toISOString(),
    })) ||
    [];

  return (
    <Container>
      <Gnb />
      <MainContainer>
        <MainBox>
          <LeftContainer>
            <TextContainer>
              {exercise ? exercise.name : "운동 완료"}
            </TextContainer>
            <ImageContainer>
              {exercise && (
                <img
                  src={exercise.detailImage}
                  alt={exercise.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </ImageContainer>
          </LeftContainer>
          <RightContainer>
            <SetBox>
              {isLoading && (
                <div
                  style={{
                    color: "white",
                    fontSize: "48px",
                    textAlign: "center",
                  }}
                >
                  로딩 중...
                </div>
              )}
              {error && (
                <div
                  style={{
                    color: "red",
                    fontSize: "48px",
                    textAlign: "center",
                  }}
                >
                  에러 발생
                </div>
              )}
              {displaySets.length > 0 &&
                displaySets.map((set, index) => (
                  <SetItem key={set.id || index}>
                    <SetItemDetail>
                      <SetKgCount>
                        <Set>{index + 1} set</Set>
                        <SetVolume>
                          {set.exercise_weight} kg x {set.target_count} 회
                        </SetVolume>
                      </SetKgCount>
                    </SetItemDetail>
                    <ItemContainer>
                      <img
                        src={CheckImg} // 🎯 항상 체크 표시로 변경
                        alt="체크 표시"
                        style={{ width: "80px", height: "80px" }}
                      />
                    </ItemContainer>
                  </SetItem>
                ))}
              {displaySets.length === 0 && !isLoading && (
                <div
                  style={{
                    color: "white",
                    fontSize: "48px",
                    textAlign: "center",
                    padding: "100px 0",
                  }}
                >
                  운동 결과가 없습니다.
                </div>
              )}
            </SetBox>
            <ButtonWrapper>
              <TertiaryButton
                size="xl"
                fontSize="54px"
                onClick={handleGoToHome}
              >
                첫 화면으로 나가기
              </TertiaryButton>
              <PrimaryButton
                size="xl"
                fontSize="54px"
                onClick={handleGoToSelectExercise}
              >
                운동 선택하러 가기
              </PrimaryButton>
            </ButtonWrapper>
          </RightContainer>
        </MainBox>
      </MainContainer>
    </Container>
  );
};

export default ExerciseResult;
