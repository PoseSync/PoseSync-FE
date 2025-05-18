import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Gnb from "../../components/gnb/Gnb";
import UnionImg from "../../assets/images/items/Union.png";
import LineImg from "../../assets/images/items/line.png";
import { useUserStore } from "../../store/useUserStore";
import StartExerciseToast from '../../components/resource/StartExerciseToast';
import { useLocation, useNavigate } from 'react-router-dom';

// 결과 데이터 인터페이스 정의
interface AnalysisResult {
  summary?: {
    arm_ratio?: string;
    upper_lower_ratio?: string;
    femur_tibia_ratio?: string;
    hip_height_ratio?: string;
  };
  classifications?: Record<string, unknown>;
  ensemble_result?: Record<string, unknown>;
  db_types?: Record<string, unknown>;
}

// 위치 상태 인터페이스
interface LocationState {
  analysisResult?: AnalysisResult;
}

// 파싱 결과 인터페이스
interface ParsedResult {
  ratio: string;
  resultText: string;
}

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
  width: 3048px;
  height: 1728px;
  position: relative;
`;

const CircleBlur = styled.div`
  position: absolute;
  top: 203.53px;
  left: 815.2px;
  width: 1321.6796875px;
  height: 1321.6796875px;
  border-radius: 50%;
  background: radial-gradient(50% 50% at 50% 50%, #383c42 0%, #0b0c0d 100%);
  pointer-events: none;
`;

const ImageContainer = styled.div`
  position: absolute;
  width: 612.28px;
  height: 1726.52px;
  left: 1168.73px;
  top: 0.74px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LineContainer = styled.div`
  position: absolute;
  width: 1740px;
  height: 1371px;
  top: 315px;
  left: 631px;
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
  gap: 16px;
`;

const HeightText = styled.div`
  width: 243px;
  height: 64px;
  font-family: "Pretendard Variable", sans-serif;
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
  gap: 16px;
  color: var(--white);
`;

const NumberContainer = styled.div`
  width: 151px;
  height: 112px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  display: flex;
`;

const CmContainer = styled.div`
  width: 76px;
  height: 72px;
  font-family: "Pretendard Variable", sans-serif;
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
  gap: 32px;
  border-radius: 32px;
  padding-top: 56px;
  padding-right: 52px;
  padding-bottom: 56px;
  padding-left: 52px;
  background: var(--gray-800);
  overflow: hidden;
`;

const ArmContainer = styled(BaseBodyPartContainer)`
  width: 639px;
  height: 300px;
  top: 443.04px;
`;

const FemurContainer = styled(BaseBodyPartContainer)`
  width: 707px;
  height: 300px;
  top: 1059.04px;
  left: -18.25;
`;

const HipJointContainer = styled(BaseBodyPartContainer)`
  width: 707px;
  height: 300px;
  top: 1043.04px;
  left: 2341px;
`;

const BodyRatioContainer = styled(BaseBodyPartContainer)`
  width: 690px;
  height: 300px;
  top: 443.04px;
  left: 2358px;
`;

const InfoTextBase = styled.div`
  border-radius: 16px;
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard Variable", sans-serif;
`;

const ResultTextBase = styled.div`
  border-radius: 16px;
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Pretendard Variable", sans-serif;
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
  width: 535px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;
const FemurResultText = styled(ResultTextBase)`
  width: 603px;
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
  width: 603px;
  height: 100px;
  font-weight: 700;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  margin-bottom: 0;
`;

const ToastPositioner = styled.div`
  position: absolute;
  top: 1484px;
  left: 19px;
`;

const MeasurementResults: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const height = useUserStore((state) => state.height);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    // location.state에서 체형 분석 결과 가져오기
    if (state && state.analysisResult) {
      setAnalysisResult(state.analysisResult);
    }
  }, [state]);

  // 기본값 설정
  const defaultValues = {
    armRatio: "상완-전완 비율 | 1:0.85",
    armResultText: "상완비율 평균형",
    upperLowerRatio: "상체-하체 비율 | 1:1.05",
    upperLowerResultText: "상하체비율 평균형",
    femurTibiaRatio: "대퇴골-정강이 비율 | 1:0.95",
    femurResultText: "대퇴골비율 평균형",
    hipRatio: "고관절-신장 비율 | 0.20",
    hipResultText: "고관절 너비 평균형",
  };

  // 분석 결과에서 데이터 추출
  const armRatioText =
    analysisResult?.summary?.arm_ratio || defaultValues.armRatio;
  const upperLowerRatioText =
    analysisResult?.summary?.upper_lower_ratio || defaultValues.upperLowerRatio;
  const femurTibiaRatioText =
    analysisResult?.summary?.femur_tibia_ratio || defaultValues.femurTibiaRatio;
  const hipRatioText =
    analysisResult?.summary?.hip_height_ratio || defaultValues.hipRatio;

  // 결과 텍스트 파싱 함수
  const parseResultText = (text: string): ParsedResult => {
    const parts = text.split("|");
    if (parts.length >= 2) {
      // 부분을 사용하지 않더라도 정보 제공을 위해 분리는 함
      // 좌측 부분은 사용하지 않으므로 변수로 할당하지 않음
      // const leftPart = parts[0].trim(); - 이 부분이 오류의 원인
      const rightPart = parts[1].trim();

      const ratioEndIndex = rightPart.search(/[A-Za-z가-힣]/);
      if (ratioEndIndex > 0) {
        const ratio = rightPart.substring(0, ratioEndIndex).trim();
        const resultText = rightPart.substring(ratioEndIndex).trim();
        return { ratio, resultText };
      }
      return { ratio: rightPart, resultText: "" };
    }
    // 구분자가 없는 경우 기본값 반환
    return { ratio: "", resultText: text };
  };

  const armRatioParsed = parseResultText(armRatioText);
  const upperLowerRatioParsed = parseResultText(upperLowerRatioText);
  const femurTibiaParsed = parseResultText(femurTibiaRatioText);
  const hipRatioParsed = parseResultText(hipRatioText);

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
            <img
              src={LineImg}
              alt="Line"
              style={{ width: "100%", height: "100%" }}
            />
          </LineContainer>
          <HeightContainer>
            <HeightText>키</HeightText>
            <HeightValueContainer>
              <NumberContainer>{height}</NumberContainer>
              <CmContainer>cm</CmContainer>
            </HeightValueContainer>
          </HeightContainer>
          <ArmContainer>
            <ArmInfoText>상완-전완 비율 | {armRatioParsed.ratio}</ArmInfoText>
            <ArmResultText>
              {armRatioParsed.resultText || defaultValues.armResultText}
            </ArmResultText>
          </ArmContainer>
          <FemurContainer>
            <FemurInfoText>
              대퇴골-정강이 비율 | {femurTibiaParsed.ratio}
            </FemurInfoText>
            <FemurResultText>
              {femurTibiaParsed.resultText || defaultValues.femurResultText}
            </FemurResultText>
          </FemurContainer>
          <BodyRatioContainer>
            <BodyRatioInfoText>
              상하체 비율 | {upperLowerRatioParsed.ratio}
            </BodyRatioInfoText>
            <BodyRatioResultText>
              {upperLowerRatioParsed.resultText ||
                defaultValues.upperLowerResultText}
            </BodyRatioResultText>
          </BodyRatioContainer>
          <HipJointContainer>
            <HipJointInfoText>
              고관절-신장 비율 | {hipRatioParsed.ratio}
            </HipJointInfoText>
            <HipJointResultText>
              {hipRatioParsed.resultText || defaultValues.hipResultText}
            </HipJointResultText>
          </HipJointContainer>
          <ToastPositioner>
            <StartExerciseToast onStart={() => navigate('/startexercises')} />
          </ToastPositioner>
        </MainBox>
      </MainContainer>
    </FullScreenContainer>
  );
};

export default MeasurementResults;
