import styled from 'styled-components';
import Gnb from '../../components/gnb/Gnb';
// import TextButton from '../../components/buttons/TextBtn';
import { TertiaryButton } from '../../components/buttons/TertiaryButton';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import TextButton from '../../components/buttons/TextBtn';
import { Stepper } from '../../components/inputs/Stepper';

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
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  color: var(--white);
`;

const SubTitleContainer = styled.div`
  width: 1470px;
  height: 192px;
  font-family: 'Pretendard Variable', sans-serif;
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
  background: var(--gray-800);
  color: var(--white);
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
  width: 1470px;
  height: 448px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-5);
  align-items: flex-end;
`;

const SetItemContainer = styled.div`
  width: 1470px;
  height: 356px;
  display: flex;
  gap: var(--gap-11);
  align-items: center;
`;

const SetText = styled.div`
  width: 230px;
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: 'Pretendard Variable', sans-serif;
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
  return (
    <FullScreen>
      <Gnb />
      <Container>
      <MainContainer>
        <LeftContainer>
          <TitleContainer>
            <TitleText>동적 설정</TitleText>
            <SubTitleContainer>동적 설정</SubTitleContainer>
          </TitleContainer>
          <ImageContainer>
            이미지 동적 설정 - 이미지 받으면 data에 이미지 추가하고 진행, 색 설정 삭제
          </ImageContainer>
        </LeftContainer>
        <RightContainer>
          <SetsContainer>
            <TextButton>+ 추가하기</TextButton>
            <SetItemContainer>
              <SetText>1 세트</SetText>
              <VolumeContainer>
                <StepperGroup>
                  <Stepper value={5} min={0} max={100} unit="kg" onChange={() => {}} />
                  <Stepper value={5} min={0} max={100} unit="회" onChange={() => {}} />
                </StepperGroup>
                <ButtonGroup>
                  <PrimaryButton size="s" disabled fontSize="32px">취소하기</PrimaryButton>
                </ButtonGroup>
              </VolumeContainer>
            </SetItemContainer>
          </SetsContainer>
          <ButtonWrapper>
            <TertiaryButton size="xl" fontSize="54px">다른 운동하러 가기</TertiaryButton>
            <PrimaryButton size="xl" fontSize="54px">운동하러 가기</PrimaryButton>
          </ButtonWrapper>
        </RightContainer>
      </MainContainer>
      </Container>
    </FullScreen>
  );
};

export default ExerciseSetupPage;
