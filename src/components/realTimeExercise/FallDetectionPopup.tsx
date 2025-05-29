import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";

// 🔥 부드러운 맥박 애니메이션 (깜빡임 제거)
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

// 🔥 배경만 살짝 깜빡이게 (버튼은 안정적으로)
const backgroundPulse = keyframes`
  0%, 90% { background: rgba(220, 38, 38, 0.95); }
  95%, 100% { background: rgba(220, 38, 38, 0.85); }
`;

// 전체 화면 오버레이 - 깜빡임 대신 배경 맥박만
const FallDetectionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(220, 38, 38, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${backgroundPulse} 3s infinite; /* 🔥 더 느리고 부드럽게 */
`;

// 팝업 컨테이너 - 안정적으로 고정
const PopupContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 60px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 600px;
  width: 90%;
  border: 5px solid #dc2626;
  /* 🔥 깜빡임 제거, 안정적인 표시 */
  opacity: 1;
  transform: scale(1);
`;

// 응급상황 아이콘만 맥박
const EmergencyIcon = styled.div`
  font-size: 120px;
  margin-bottom: 30px;
  color: #dc2626;
  animation: ${pulse} 2s infinite; /* 🔥 더 부드럽게 */
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

// 카운트다운 표시만 맥박
const CountdownDisplay = styled.div`
  font-family: "Pretendard Variable", sans-serif;
  font-weight: 700;
  font-size: 80px;
  color: #dc2626;
  margin: 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: ${pulse} 1.5s infinite; /* 🔥 부드럽게 */
`;

// 🔥 안정적인 취소 버튼 (애니메이션 없음)
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
  transition: all 0.2s ease; /* 🔥 더 빠른 반응 */
  margin-top: 20px;

  /* 🔥 버튼 안정성 강화 */
  opacity: 1;
  transform: none;

  &:hover {
    background: #059669;
    transform: translateY(-1px); /* 🔥 작은 움직임 */
    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
    background: #047857;
  }

  /* 🔥 포커스 상태 추가 (키보드 접근성) */
  &:focus {
    outline: 3px solid #34d399;
    outline-offset: 2px;
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

// 🔥 추가: 닫기 버튼 (비상시)
const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 1);
  }
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

  // 🔥 ESC 키로도 취소 가능하게
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isVisible]);

  // 취소 버튼 클릭 처리
  const handleCancel = useCallback(() => {
    console.log("🚨 사용자가 낙상 감지 취소");
    setIsCountdownActive(false);
    onCancel();
  }, [onCancel]);

  // 🔥 클릭 이벤트 전파 방지 (팝업 외부 클릭해도 닫히지 않게)
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 오버레이 클릭 시에는 아무것도 하지 않음
  }, []);

  const handlePopupClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 팝업 내부 클릭 시 이벤트 전파 방지
  }, []);

  // 팝업이 보이지 않으면 렌더링하지 않음
  if (!isVisible) {
    return null;
  }

  return (
    <FallDetectionOverlay onClick={handleOverlayClick}>
      <PopupContainer
        onClick={handlePopupClick}
        style={{ position: "relative" }}
      >
        {/* 🔥 비상 닫기 버튼 */}
        <CloseButton onClick={handleCancel} title="닫기 (ESC)">
          ✕
        </CloseButton>

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

            {/* 🔥 응급연락 진행 중에도 취소 버튼 제공 */}
            <CancelButton
              onClick={handleCancel}
              style={{ background: "#f59e0b", marginTop: "20px" }}
            >
              응급연락 취소
            </CancelButton>
          </>
        )}
      </PopupContainer>
    </FallDetectionOverlay>
  );
};

export default FallDetectionPopup;
