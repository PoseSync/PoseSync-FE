import styled from 'styled-components';
import '../../styles/foundation/index.css';
import { useState } from 'react';

type CardStatus = 'default' | 'focused' | 'selected';

interface ExerciseCardProps {
  status?: CardStatus;
  imageSrc?: string;
  imageAlt?: string;
  subtitle?: string;
  bodyText?: string;
  onClick?: () => void;
}

const CardContainer = styled.div<ExerciseCardProps>`
  width: 880px;
  height: 990px;
  position: relative;
  border-radius: var(--radius-2xl);
  gap: 10px;
  background: ${({ status }) => {
    switch (status) {
      case 'focused':
        return 'var(--yellow-500)';
      case 'selected':
        return 'var(--yellow-300)';
      default:
        return 'var(--gray-700)';
    }
  }};
  box-shadow: ${({ status }) => {
    switch (status) {
      case 'focused':
      case 'selected':
        return '-4px -4px 4px 0px var(--gray-opacity-30), 4px 4px 4px 0px var(--yellow-opacity-10), 0px 4px 20px 0px var(--yellow-300)';
      default:
        return '0px 4px 24px 0px var(--gray-opacity-50), 0px 4px 12px 0px var(--gray-opacity-10)';
    }
  }};
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.85);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(0.87);
  }

  /* 👇 reflection 효과 추가 */
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ status }) => {
      switch (status) {
        case 'focused':
          return 'var(--yellow-500)';
        case 'selected':
          return 'var(--yellow-300)';
        default:
          return 'var(--gray-700)';
      }
    }};
    transform: scaleY(-1);
    opacity: 0.2;
    filter: blur(4px);
    pointer-events: none;
    border-radius: var(--radius-2xl);
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent);
    z-index: 0;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  height: 798px;
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
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 520px;
    height: 520px;
    transform: translate(-50%, -50%);
    background: ${({ status }) => {
      switch (status) {
        case 'focused':
          return 'var(--yellow-200)';
        case 'selected':
          return 'var(--yellow-100)';
        default:
          return 'none';
      }
    }};
    border-radius: 50%;
    filter: ${({ status }) => status === 'default' ? 'none' : 'blur(80px)'};
    z-index: 0;
    opacity: ${({ status }) => status === 'default' ? 0 : 1};
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
  font-family: 'Pretendard Variable';
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  color: ${({ status }) => {
    switch (status) {
      case 'focused':
      case 'selected':
        return 'var(--gray-900)';
      default:
        return 'var(--gray-600)';
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
  font-family: 'Pretendard Variable';
  font-weight: 500;
  font-size: 44px;
  line-height: 56px;
  letter-spacing: -0.44px;
  text-align: center;
  color: ${({ status }) => {
    switch (status) {
      case 'focused':
      case 'selected':
        return 'var(--yellow-900)';
      default:
        return 'var(--gray-600)';
    }
  }};
  margin: 0;
`;

const ReflectionWrapper = styled.div`
  position: absolute;
  top: 100%;
  left: 100px;
  width: 100%;
  height: 990px; /* 카드 높이만큼 */
  overflow: hidden;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);

  /* 📌 그라데이션을 좀 더 진하고 천천히 사라지게 */
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2), transparent);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2), transparent);
`;

const ExerciseCard: React.FC<ExerciseCardProps> = ({ status = 'default', imageSrc, imageAlt, subtitle, bodyText, onClick }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    if (onClick) {
      setIsSelected(true);
      setTimeout(() => {
        onClick();
      }, 500);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
    <CardContainer 
      status={isSelected ? 'selected' : status} 
      onClick={handleClick}
    >
      {/* 실제 카드 내용 */}
      <ContentContainer>
        <ImageContainer status={isSelected ? 'selected' : status}>
          {imageSrc && <StyledImage src={imageSrc} alt={imageAlt || '운동 이미지'} />}
        </ImageContainer>
        <TextContainer>
          <SubtitleContainer>
            {subtitle && <SubtitleText status={isSelected ? 'selected' : status}>{subtitle}</SubtitleText>}
          </SubtitleContainer>
          <Body2Container>
            {bodyText && <Body2Text status={isSelected ? 'selected' : status}>{bodyText}</Body2Text>}
          </Body2Container>
        </TextContainer>
      </ContentContainer>
    </CardContainer>

    {/* 👇 반사되는 복제 카드 */}
    <ReflectionWrapper>
      <CardContainer status={isSelected ? 'selected' : status} style={{ transform: 'scaleY(-1)', opacity: 0.4, filter: 'blur(1px)' }}>
        <ContentContainer>
          <ImageContainer status={isSelected ? 'selected' : status}>
            {imageSrc && <StyledImage src={imageSrc} alt={imageAlt || '운동 이미지'} />}
          </ImageContainer>
          <TextContainer>
            <SubtitleContainer>
              {subtitle && <SubtitleText status={isSelected ? 'selected' : status}>{subtitle}</SubtitleText>}
            </SubtitleContainer>
            <Body2Container>
              {bodyText && <Body2Text status={isSelected ? 'selected' : status}>{bodyText}</Body2Text>}
            </Body2Container>
          </TextContainer>
        </ContentContainer>
      </CardContainer>
    </ReflectionWrapper>
  </div>
);
};

export default ExerciseCard;