import React from 'react';
import styled from 'styled-components';
import Gnb from '../../components/gnb/Gnb';
import UnionImg from '../../assets/images/items/Union.png';

const FullScreenContainer = styled.div`
  width: 3840px;
  height: 2160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gray-900);
  position: relative;
`;

const MainContainer = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
`;

const MainBox = styled.div`
  width: 2728.078125px;
  height: 1726.5233154296875px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 612.2822875976562px;
  height: 1726.5234375px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const MeasurementResults = () => {
  return (
    <FullScreenContainer>
      <Gnb />
      <MainContainer>
        <MainBox>
          <ImageContainer>
            <StyledImage src={UnionImg} alt="인체 실루엣" />
          </ImageContainer>
          {/* 메인 컨텐츠 영역 */}
        </MainBox>
      </MainContainer>
    </FullScreenContainer>
  );
};

export default MeasurementResults;
