import React from 'react';
import styled from 'styled-components';
import Gnb from '../../components/gnb/Gnb';
import UnionImg from '../../assets/images/items/Union.png';
import LineImg from '../../assets/images/items/line.png';

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
`;

const CircleBlur = styled.div`
  position: absolute;
  top: 202.79px;
  left: 703.2px;
  width: 1321.6796875px;
  height: 1321.6796875px;
  border-radius: 50%;
  background: radial-gradient(50% 50% at 50% 50%, #383C42 0%, #0B0C0D 100%);
  pointer-events: none;
`;

const ImageContainer = styled.div`
  position: absolute;
  width: 612.2822875976562px;
  height: 1726.5234375px;
  left: 1056.7px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LineContainer = styled.div`
  position: absolute;
  width: 1719.08px;
  height: 1367.45px;
  top: 316.84px;
  left: 527px;
  pointer-events: none;
`;

const HeightContainer = styled.div`
  position: absolute;
  width: 243px;
  height: 192px;
  top: 120.6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--Gap-2);
`;

const HeightText = styled.div`
  width: 243px;
  height: 64px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 500;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  color: var(--white);
  display: flex;
`;

const HeightValueContainer = styled.div`
  width: 243px;
  height: 112px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--Gap-2);
  color: var(--white);
`;

const NumberContainer = styled.div`
  width: 151px;
  height: 112px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  display: flex;
`;

const CmContainer = styled.div`
  width: 76px;
  height: 72px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 54px;
  line-height: 72px;
  letter-spacing: -0.54px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BaseBodyPartContainer = styled.div`
  position: absolute;
  gap: var(--margin-4);
  border-radius: var(--radius-xl);
  padding-top: var(--padding-3xl);
  padding-right: var(--padding-2xl);
  padding-bottom: var(--padding-3xl);
  padding-left: var(--padding-2xl);
  background: var(--gray-800);
  overflow: hidden;
`;

const ArmContainer = styled(BaseBodyPartContainer)`
  width: 527px;
  height: 300px;
  top: 442.3px;
  left: 0;
`;

const FemurContainer = styled(BaseBodyPartContainer)`
  width: 687px;
  height: 300px;
  top: 1058.3px;
  left: 0;
`;

const HipJointContainer = styled(BaseBodyPartContainer)`
  width: 687px;
  height: 300px;
  top: 1058.3px;
  left: 2037.08px;
`;

const BodyRatioContainer = styled(BaseBodyPartContainer)`
  width: 482px;
  height: 300px;
  top: 442.3px;
  left: 2246.08px;
`;

const InfoTextBase = styled.div`
  border-radius: 16px;
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard Variable', sans-serif;
`;

const ResultTextBase = styled.div`
  border-radius: 16px;
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard Variable', sans-serif;
`;

const ArmInfoText = styled(InfoTextBase)`
  width: 423px;
  height: 56px;
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  margin-bottom: 12px;
`;
const FemurInfoText = styled(InfoTextBase)`
  width: 556px;
  height: 56px;
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  margin-bottom: 12px;
`;
const HipJointInfoText = styled(InfoTextBase)`
  width: 555px;
  height: 56px;
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  margin-bottom: 12px;
`;
const BodyRatioInfoText = styled(InfoTextBase)`
  width: 332px;
  height: 56px;
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  margin-bottom: 12px;
`;

const ArmResultText = styled(ResultTextBase)`
  width: 361px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;
const FemurResultText = styled(ResultTextBase)`
  width: 583px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;
const HipJointResultText = styled(ResultTextBase)`
  width: 583px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;
const BodyRatioResultText = styled(ResultTextBase)`
  width: 378px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;

const MeasurementResults = () => {
  return (
    <FullScreenContainer>
      <Gnb />
      <MainContainer>
        <MainBox>
          <CircleBlur />
          <ImageContainer>
            <img src={UnionImg} alt="인체 실루엣" />
          </ImageContainer>
          <LineContainer>
            <img src={LineImg} alt="Line" style={{ width: '100%', height: '100%' }} />
          </LineContainer>
          <HeightContainer>
            <HeightText>키</HeightText>
            <HeightValueContainer>
              <NumberContainer>175</NumberContainer>
              <CmContainer>cm</CmContainer>
            </HeightValueContainer>
          </HeightContainer>
          <ArmContainer>
            <ArmInfoText>상완-전완 비율 | 1:0.85</ArmInfoText>
            <ArmResultText>균형잡힌 편</ArmResultText>
          </ArmContainer>
          <FemurContainer>
            <FemurInfoText>대퇴골 비율 | 신장 대비 약 22%</FemurInfoText>
            <FemurResultText>상대적으로 넓은 편</FemurResultText>
          </FemurContainer>
          <HipJointContainer>
            <HipJointInfoText>고관절 너비 | 신장 대비 약 0.20</HipJointInfoText>
            <HipJointResultText>상대적으로 넓은 편</HipJointResultText>
          </HipJointContainer>
          <BodyRatioContainer>
            <BodyRatioInfoText>상하체 비율 | 1:1.2</BodyRatioInfoText>
            <BodyRatioResultText>상체가 긴 편</BodyRatioResultText>
          </BodyRatioContainer>
        </MainBox>
      </MainContainer>
    </FullScreenContainer>
  );
};

export default MeasurementResults;
