import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Gnb from "../../components/gnb/Gnb";
import { exercises } from "../../data/exercises";
import Carousel from "../../components/contents/Carousel";
import { useExerciseStore } from "../../store/useExerciseStore";

const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
`;

const MainContainer = styled.div`
  margin-top: 180px;
  width: 3840px;
  height: 1980px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  justify-content: center;
`;

const CenterContainer = styled.div`
  width: 2835px;
  height: 1793px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const TitleContainer = styled.div`
  width: 1141px;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  margin-bottom: var(--gap-5);
`;

const TitleText = styled.div`
  width: 1141px;
  height: 112px;
  overflow: hidden;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  text-align: center;
  color: var(--white);
`;

const SubTitleText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 54px;
  line-height: 72px;
  letter-spacing: -0.54px;
  text-align: center;
  color: var(--gray-200);
`;

const SelectExercise = () => {
  const navigate = useNavigate();
  const setSelectedExercise = useExerciseStore(
    (state) => state.setSelectedExercise
  );

  // 각 운동의 가용성 정보를 포함하여 카드 데이터 생성
  const carouselCards = exercises.map((ex) => ({
    id: ex.name,
    title: ex.name,
    description: ex.cardDescription,
    imageSrc: ex.image,
    available: ex.available, // 가용성 정보 추가
    onClick: () => {
      // 가용성 확인 (Carousel 컴포넌트에서도 확인하지만 여기서도 이중 체크)
      if (!ex.available) {
        alert(`${ex.name}은(는) 현재 준비 중입니다. 다른 운동을 선택해주세요.`);
        return;
      }

      setSelectedExercise(ex);
      setTimeout(() => {
        navigate("/exercisesetup");
      }, 500);
    },
  }));

  return (
    <FullScreen>
      <Gnb />
      <MainContainer>
        <CenterContainer>
          <TitleContainer>
            <TitleText>운동을 선택해주세요.</TitleText>
            <SubTitleText>
              Pose Sync는 10가지 운동 자세를 측정할 수 있습니다.
            </SubTitleText>
          </TitleContainer>
          <Carousel cards={carouselCards} />
        </CenterContainer>
      </MainContainer>
    </FullScreen>
  );
};

export default SelectExercise;
