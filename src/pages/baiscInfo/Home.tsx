import React from 'react';
import styled from 'styled-components';
import Logo from '../../components/iconography/Logo';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { useNavigate } from 'react-router-dom';
import Man2 from '../../assets/images/homepage/man2.png';
import Girl1 from '../../assets/images/homepage/girl1.png';
import Man1 from '../../assets/images/homepage/man1.png';
import Rectangle1 from '../../assets/images/homepage/Rectangle1.png';
import Rectangle2 from '../../assets/images/homepage/Rectangle2.png';
import Rectangle3 from '../../assets/images/homepage/Rectangle3.png';
import Rectangle4 from '../../assets/images/homepage/Rectangle4.png';
import Rectangle5 from '../../assets/images/homepage/Rectangle5.png';

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

const RectangleBlur1 = styled.div`
  position: absolute;
  width: 1377.5009765625px;
  height: 1919px;
  top: -273px;
  left: 1133px;
`;

const RectangleBlur2 = styled.div`
  position: absolute;
  width: 1583.498046875px;
  height: 1914px;
  top: -484.5px;
  left: 1638px;
`;

const RectangleBlur3 = styled.div`
  position: absolute;
  width: 2986.49853515625px;
  height: 2395px;
  top: -101.5px;
  left: 1225px;
`;

const RectangleBlur4 = styled.div`
  position: absolute;
  width: 1583.498046875px;
  height: 1914px;
  top: 588px;
  left: 2561px;
`;

const RectangleBlur5 = styled.div`
  position: absolute;
  width: 1315.9415283203125px;
  height: 1919px;
  top: 65px;
  left: 3282px;
`;

const Home = () => {
  const navigate = useNavigate();
  return (
    <HomeContainer>
      <RectangleBlur1>
        <img src={Rectangle1} alt="Rectangle1"/>
      </RectangleBlur1>
      <RectangleBlur2>
        <img src={Rectangle2} alt="Rectangle2"/>
      </RectangleBlur2>
      <RectangleBlur3>
        <img src={Rectangle3} alt="Rectangle3"/>
      </RectangleBlur3>
      <RectangleBlur4>
        <img src={Rectangle4} alt="Rectangle4"/>
      </RectangleBlur4>
      <RectangleBlur5>
        <img src={Rectangle5} alt="Rectangle5"/>
      </RectangleBlur5>
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

