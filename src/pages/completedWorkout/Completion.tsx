import React from 'react';
import styled from 'styled-components';
import Gnb from '../../components/gnb/Gnb';
import DumbellImg from '../../assets/images/items/dumbell.png';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  width: 3840px;
  height: 2160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--gray-900);
`;

const MainBox = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ContentContainer = styled.div`
  width: 1800px;
  height: 1447px;
  padding: 60px 370px 90px 370px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--radius-2xl);
  background: var(--gray-800);
`;

const ItemContainer = styled.div`
  width: 1000px;
  height: 1184px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-16);
`;

const TopContainer = styled.div`
  width: 1000px;
  height: 894px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-8);
`;

const ImageContainer = styled.div`
  width: 1000px;
  height: 570px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TextContainer = styled.div`
  width: 812px;
  height: 264px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-5);
`;

const TitleContainer = styled.div`
  width: 812px;
  height: 100px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BodyContainer = styled.div`
  width: 741px;
  height: 128px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 700;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  color: #fff;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ButtonWrapper = styled.div`
  width: 675px;
  height: 170px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Completion = () => {
  const navigate = useNavigate();
  return (
    <Container>
      <Gnb />
      <MainBox>
        <ContentContainer>
          <ItemContainer>
            <TopContainer>
              <ImageContainer>
                <img src={DumbellImg} alt="덤벨 이미지" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </ImageContainer>
              <TextContainer>
                <TitleContainer>목표한 운동을 완료했어요!</TitleContainer>
                <BodyContainer>수고하셨습니다. 운동 효과가 궁금하다면<br/>아래 버튼을 눌러 확인해보세요!</BodyContainer>
              </TextContainer>
            </TopContainer>
            <ButtonWrapper>
                <PrimaryButton size="xl" fontSize="64px" onClick={() => navigate('/exercise-result')}>운동 결과 보러가기</PrimaryButton>
              </ButtonWrapper>
          </ItemContainer>
        </ContentContainer>
      </MainBox>
    </Container>
  );
};

export default Completion;

