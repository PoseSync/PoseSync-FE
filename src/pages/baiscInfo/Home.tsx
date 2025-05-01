import React from 'react';
import styled from 'styled-components';
import Logo from '../../components/iconography/Logo';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { useNavigate } from 'react-router-dom';
import Man2 from '../../assets/images/homepage/man2.png';
import Girl1 from '../../assets/images/homepage/girl1.png';
import Man1 from '../../assets/images/homepage/man1.png';

const HomeContainer = styled.div`
  width: 3840px;
  height: 2160px;
  background: var(--yellow-400);
  position: relative;
  overflow: hidden;
`;

const MainBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 201px;
  position: absolute;
  width: 1570px;
  height: 967px;
  left: 210px;
  top: 280px;
`;

const TitleContainer = styled.div`
  width: 1570px;
  height: 596px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-5);
`;

const TextContainer = styled.div`
  width: 1162px;
  height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: var(--padding-l);
`;

const TextStyled = styled.div`
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
`;

const ButtonContainer = styled.div`
  width: 586px;
  height: 170px;
  padding-left: var(--padding-l);
  display: flex;
  align-items: center;
`;

const Man2Image = styled.img`
  position: absolute;
  width: 1191.9522705078125px;
  height: 1196.2244873046875px;
  top: 763.5px;
  left: 1448px;
  object-fit: contain;
  pointer-events: none;
`;

const Girl1Image = styled.img`
  position: absolute;
  width: 1219.59521484375px;
  height: 1235.888671875px;
  left: 2620.41px;
  top: 343.13px;
  object-fit: contain;
  transform: scaleX(-1);
  pointer-events: none;
`;

const Man1Image = styled.img`
  position: absolute;
  width: 1310.9609375px;
  height: 1839.6575927734375px;
  top: 320.34px;
  left: 2011.13px;
  object-fit: contain;
  pointer-events: none;
`;

const DiagonalBg1 = styled.div`
  position: absolute;
  width: 1377.5px;  
  height: 1919px;  
  left: 1133px;
  top: -273px;
  background: linear-gradient(225deg, #F2FFCD -11.87%, rgba(255, 255, 255, 0) 85.56%);
`;
const DiagonalBg2 = styled.div`
  position: absolute;
  width: 1583.5px;
  height: 40px;
  left: 1438px;
  top: 400px;
  background: radial-gradient(50% 50% at 50% 50%, #E4FD9F 0%, rgba(242,255,205,0) 100%);
  opacity: 0.5;
  transform: rotate(-25deg);
  z-index: 0;
`;
const DiagonalBg3 = styled.div`
  position: absolute;
  width: 2986.5px;
  height: 40px;
  left: 1225px;
  top: 600px;
  background: radial-gradient(88.04% 88.04% at 56.57% 41.67%, #F2FFCD 0%, rgba(210,248,104,0) 100%);
  opacity: 0.4;
  transform: rotate(-25deg);
  z-index: 0;
`;
const DiagonalBg4 = styled.div`
  position: absolute;
  width: 1583.5px;
  height: 40px;
  left: 2561px;
  top: 800px;
  background: radial-gradient(100% 100% at 91.22% 0%, #E4FD9F 0%, rgba(242,255,205,0) 95.13%);
  opacity: 0.4;
  transform: rotate(-25deg);
  z-index: 0;
`;
const DiagonalBg5 = styled.div`
  position: absolute;
  width: 1315.94px;
  height: 40px;
  left: 3282px;
  top: 1000px;
  background: radial-gradient(39.24% 39.24% at 50% 50%, #F2FFCD 0%, rgba(255,255,255,0) 100%);
  opacity: 0.3;
  transform: rotate(-25deg);
  z-index: 0;
`;

const Home = () => {
  const navigate = useNavigate();
  return (
    <HomeContainer>
      <DiagonalBg1 />
      <DiagonalBg2 />
      <DiagonalBg3 />
      <DiagonalBg4 />
      <DiagonalBg5 />
      <MainBox>
        <TitleContainer>
          <Logo />
          <TextContainer>
            <TextStyled>
              당신을 위한 가장 완벽한 운동 파트너<br />
              Pose Sync가 함께합니다.
            </TextStyled>
          </TextContainer>
        </TitleContainer>
        <ButtonContainer>
          <SecondaryButton size="xl" fontSize="52px" onClick={() => navigate('/info')}>
            운동 시작하기
          </SecondaryButton>
        </ButtonContainer>
      </MainBox>
      <Man2Image src={Man2} alt="운동하는 남성" />
      <Girl1Image src={Girl1} alt="운동하는 여성" />
      <Man1Image src={Man1} alt="덤벨 운동하는 남성" />
    </HomeContainer>
  );
};

export default Home; 

