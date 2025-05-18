import Badge from "../../components/contents/Badge";
import Keyboard from "../../components/resource/Keyboard";
import styled from "styled-components";
import { useState } from "react";
import { TertiaryButton } from "../../components/buttons/TertiaryButton";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";

const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  position: relative;
`;

const LeftContainer = styled.div`
  width: 1470px;
  height: 1708px;
  position: absolute;
  top: 226px;
  left: 410px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl);
  background: var(--gray-800);
`;

const RightContainer = styled.div`
  width: 1470px;
  height: 544px;
  position: absolute;
  top: 230px;
  left: 1960px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
`;

const RightTopContainer = styled.div`
  width: 1470px;
  height: 314px;
  display: flex;
  flex-direction: column;
  gap: var(--gap-6);
`;

const PhoneLabelContainer = styled.div`
  width: 1470px;
  height: 100px;
  font-family: "Pretendard Variable";
  font-weight: 600;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  color: var(--white);
  display: flex;
  align-items: center;
`;

const InnerContentContainer = styled.div`
  width: 1146px;
  height: 1455.3px;
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const TopInfoContainer = styled.div`
  width: 1146px;
  height: 376px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-6);
`;

const TopInfoContentContainer = styled.div`
  width: 1146px;
  height: 204px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-4);
`;

const Title = styled.div`
  font-family: "Pretendard Variable";
  font-weight: 600;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  color: var(--white);
`;

const SubTitle = styled.div`
  font-family: "Pretendard Variable";
  font-weight: 500;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  color: var(--gray-300, #a8b0bd);
  background: transparent;
`;

const ButtonRowContainer = styled.div`
  width: 1470px;
  height: 170px;
  display: flex;
  flex-direction: row;
  gap: var(--margin-5);
  & > * {
    flex: 1;
    min-width: 0;
  }
`;

const HeightInputRow = styled.div`
  width: 1470px;
  height: 170px;
  display: flex;
  align-items: center;
  background: var(--gray-800);
  border-radius: var(--radius-m);
  padding: 0 var(--padding-m);
  font-size: 92px;
  font-family: "Pretendard Variable";
  font-weight: 700;
  color: var(--white);
  justify-content: center;
  position: relative;
`;

const HeightValue = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CmLabel = styled.span`
  font-size: 92px;
  font-family: "Pretendard Variable";
  font-weight: 700;
  color: var(--white);
`;

const HeightInput = () => {
  const [height, setHeight] = useState("");
  const navigate = useNavigate();
  const setUserHeight = useUserStore((state) => state.setHeight);

  // 키패드 입력 처리 함수
  const handleKeyboardInput = (key: string) => {
    if (key === "backspace") {
      setHeight((prev) => prev.slice(0, -1));
    } else if (/^[0-9]$/.test(key)) {
      if (height.length >= 3) return;
      setHeight((prev) => prev + key);
    }
  };

  // 키 입력이 2자리 이상이면 완료로 간주
  const isHeightComplete = height.length >= 2;

  // 전역 키 상태 입력
  const handleNext = () => {
    if (isHeightComplete) {
      setUserHeight(height);
      navigate("/measurement"); // 수정된 부분: '/measurement-results'에서 '/measurement'로 변경
    }
  };

  return (
    <FullScreen>
      <LeftContainer>
        <InnerContentContainer>
          <TopInfoContainer>
            <TopInfoContentContainer>
              <Badge>02</Badge>
              <Title>키를 입력해주세요.</Title>
            </TopInfoContentContainer>
            <SubTitle>Ai 체형측정을 위한 기본정보를 입력해주세요.</SubTitle>
          </TopInfoContainer>
          <Keyboard onInput={handleKeyboardInput} />
        </InnerContentContainer>
      </LeftContainer>
      <RightContainer>
        <RightTopContainer>
          <PhoneLabelContainer>키 (cm)</PhoneLabelContainer>
          <HeightInputRow>
            <HeightValue>
              {height}
              <CmLabel>cm</CmLabel>
            </HeightValue>
          </HeightInputRow>
        </RightTopContainer>
        <ButtonRowContainer>
          <TertiaryButton
            size="xl"
            fontSize="48px"
            onClick={() => navigate("/info")}
          >
            이전으로
          </TertiaryButton>
          <PrimaryButton
            size="xl"
            fontSize="48px"
            selected={isHeightComplete}
            disabled={!isHeightComplete}
            onClick={handleNext}
          >
            다음으로
          </PrimaryButton>
        </ButtonRowContainer>
      </RightContainer>
    </FullScreen>
  );
};

export default HeightInput;
