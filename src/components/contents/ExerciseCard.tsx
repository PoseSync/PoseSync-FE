import styled from "styled-components";
import "../../styles/foundation/index.css";
import { useState } from "react";

type CardStatus = "default" | "focused" | "selected" | "disabled";

interface ExerciseCardProps {
  status?: CardStatus;
  imageSrc?: string;
  imageAlt?: string;
  subtitle?: string;
  bodyText?: string;
  onClick?: () => void;
  available?: boolean; // 가용성 속성 추가
}

const CardContainer = styled.div<ExerciseCardProps>`
  width: 880px;
  height: 990px;
  position: relative;
  border-radius: var(--radius-2xl);
  gap: 10px;
  background: ${({ status }) => {
    switch (status) {
      case "focused":
        return "var(--yellow-500)";
      case "selected":
        return "var(--yellow-300)";
      case "disabled":
        return "var(--gray-800)"; // 비활성화된 운동은 더 어두운 배경
      default:
        return "var(--gray-700)";
    }
  }};
  box-shadow: ${({ status }) => {
    switch (status) {
      case "focused":
      case "selected":
        return "-4px -4px 4px 0px var(--gray-opacity-30), 4px 4px 4px 0px var(--yellow-opacity-10), 0px 4px 20px 0px var(--yellow-300)";
      default:
        return "0px 4px 24px 0px var(--gray-opacity-50), 0px 4px 12px 0px var(--gray-opacity-10)";
    }
  }};
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.85);
  transition: all 0.3s ease;
  opacity: ${({ available }) =>
    available === false ? 0.6 : 1}; // 준비 중인 운동은 반투명하게

  &:hover {
    transform: scale(${({ available }) => (available === false ? 0.85 : 0.87)});
    cursor: ${({ available }) =>
      available === false ? "not-allowed" : "pointer"};
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  height: 798px;
  padding: var(--padding-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-3);
`;

const ImageContainer = styled.div<{ status?: CardStatus }>`
  width: 600px;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: visible;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 520px;
    height: 520px;
    transform: translate(-50%, -50%);
    background: ${({ status }) => {
      switch (status) {
        case "focused":
          return "var(--yellow-200)";
        case "selected":
          return "var(--yellow-100)";
        default:
          return "none";
      }
    }};
    border-radius: 50%;
    filter: ${({ status }) => (status === "default" ? "none" : "blur(80px)")};
    z-index: 0;
    opacity: ${({ status }) => (status === "default" ? 0 : 1)};
  }
`;

const StyledImage = styled.img`
  width: 580px;
  height: 580px;
  position: relative;
  user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
  object-fit: contain;
`;

const TextContainer = styled.div`
  width: 692px;
  height: 216px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-3);
`;

const SubtitleContainer = styled.div`
  width: 692px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SubtitleText = styled.h2<{ status?: CardStatus }>`
  font-family: "Pretendard Variable";
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  color: ${({ status }) => {
    switch (status) {
      case "focused":
      case "selected":
        return "var(--gray-900)";
      default:
        return "var(--gray-600)";
    }
  }};
  margin: 0;
`;

const Body2Container = styled.div`
  width: 692px;
  height: 112px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Body2Text = styled.p<{ status?: CardStatus }>`
  font-family: "Pretendard Variable";
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  text-align: center;
  color: ${({ status }) => {
    switch (status) {
      case "focused":
      case "selected":
        return "var(--yellow-900)";
      default:
        return "var(--gray-600)";
    }
  }};
  margin: 0;
`;

// 준비 중 표시 컴포넌트 추가
const PreparingBadge = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: var(--red-500);
  color: white;
  padding: 8px 20px;
  border-radius: var(--radius-xs);
  font-family: "Pretendard Variable";
  font-weight: 700;
  font-size: 36px;
  z-index: 10;
`;

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  status = "default",
  imageSrc,
  imageAlt,
  subtitle,
  bodyText,
  onClick,
  available = true, // 기본값은 true (사용 가능)
}) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    if (!available) return; // 준비 중인 운동은 클릭 이벤트 무시

    if (onClick) {
      setIsSelected(true);
      setTimeout(() => {
        onClick();
      }, 500);
    }
  };

  return (
    <CardContainer
      status={isSelected ? "selected" : status}
      onClick={handleClick}
      data-available={available}
    >
      {!available && <PreparingBadge>준비 중</PreparingBadge>}
      <ContentContainer>
        <ImageContainer status={isSelected ? "selected" : status}>
          {imageSrc && (
            <StyledImage src={imageSrc} alt={imageAlt || "운동 이미지"} />
          )}
        </ImageContainer>
        <TextContainer>
          <SubtitleContainer>
            {subtitle && (
              <SubtitleText status={isSelected ? "selected" : status}>
                {subtitle}
              </SubtitleText>
            )}
          </SubtitleContainer>
          <Body2Container>
            {bodyText && (
              <Body2Text status={isSelected ? "selected" : status}>
                {bodyText}
              </Body2Text>
            )}
          </Body2Container>
        </TextContainer>
      </ContentContainer>
    </CardContainer>
  );
};

export default ExerciseCard;