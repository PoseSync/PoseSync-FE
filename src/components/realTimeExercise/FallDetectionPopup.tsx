import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";

// 깜빡이는 애니메이션
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`;

// 맥박 애니메이션
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// 전체 화면 오버레이
const FallDetectionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(220, 38, 38, 0.95); /* 빨간색 반투명 배경 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${blink} 1s infinite;
`;

// 팝업 컨테이너
const PopupContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 60px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 600px;
  width: 90%;
  animation: ${pulse} 2s infinite;
  border: 5px solid #dc2626;
`;

// 응급상황 아이콘
const EmergencyIcon = styled.div`
  font-size: 120px;
  margin-bottom: 30px;
  color: #dc2626;
  animation: ${pulse} 1s infinite;
`;

// 제목
const Title = styled.h1`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 800;
  font-size: 48px;
  color: #dc2626;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

// 설명 텍스트
const Description = styled.p`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 32px;
  color: #374151;
  margin-bottom: 30px;
  line-height: 1.4;
`;

// 카운트다운 표시
const CountdownDisplay = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 80px;
  color: #dc2626;
  margin: 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: ${pulse} 1s infinite;
`;

// 취소 버튼
const CancelButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 20px 60px;
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 36px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  margin-top: 20px;

  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// 상태 표시
const StatusText = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 600;
  font-size: 24px;
  color: #6b7280;
  margin-top: 20px;
`;

interface FallDetectionPopupProps {
  isVisible: boolean;
  onCancel: () => void;
  countdown: number;
}

const FallDetectionPopup: React.FC<FallDetectionPopupProps> = ({
  isVisible,
  onCancel,
  countdown,
}) => {
  const [isCountdownActive, setIsCountdownActive] = useState(true);

  // 카운트다운이 0이 되면 자동으로 팝업 사라짐
  useEffect(() => {
    if (countdown <= 0) {
      setIsCountdownActive(false);
    }
  }, [countdown]);

  // 취소 버튼 클릭 처리
  const handleCancel = useCallback(() => {
    setIsCountdownActive(false);
    onCancel();
  }, [onCancel]);

  // 팝업이 보이지 않으면 렌더링하지 않음
  if (!isVisible) {
    return null;
  }

  return (
    <FallDetectionOverlay>
      <PopupContainer>
        <EmergencyIcon>🚨</EmergencyIcon>

        <Title>응급상황 감지</Title>

        <Description>
          낙상이 감지되었습니다
          <br />
          문제가 없으시면 아래 버튼을 눌러주세요
        </Description>

        {isCountdownActive && countdown > 0 ? (
          <>
            <CountdownDisplay>{countdown}</CountdownDisplay>

            <StatusText>
              {countdown}초 후 자동으로 응급연락이 진행됩니다
            </StatusText>

            <CancelButton onClick={handleCancel}>괜찮습니다</CancelButton>
          </>
        ) : (
          <>
            <StatusText
              style={{ color: "#dc2626", fontSize: "28px", fontWeight: "700" }}
            >
              응급연락이 진행 중입니다...
            </StatusText>

            <StatusText style={{ marginTop: "10px" }}>
              구조대가 곧 도착할 예정입니다
            </StatusText>
          </>
        )}
      </PopupContainer>
    </FallDetectionOverlay>
  );
};

export default FallDetectionPopup;
