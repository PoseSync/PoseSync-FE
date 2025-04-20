import styled from 'styled-components';
import '../../styles/foundation/index.css';

type CardStatus = 'default' | 'focused' | 'selected';

interface ExerciseCardProps {
  status?: CardStatus;
  imageSrc?: string;
  imageAlt?: string;
  subtitle?: string;
  bodyText?: string;
}

const CardContainer = styled.div<ExerciseCardProps>`
  width: 880px;
  height: 990px;
  position: relative;
  top: 20px;
  left: 20px;
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
`;

const ContentContainer = styled.div`
  width: 692px;
  height: 798px;
  gap: 10px;
  padding-bottom: var(--padding-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ImageContainer = styled.div<{ status?: CardStatus }>`
  width: 530px;
  height: 530px;
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
    width: 450px;
    height: 450px;
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
  width: 505.08px;
  height: 505.08px;
  position: absolute;
  top: 12.46px;
  left: 12.46px;
  user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
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

const ExerciseCard: React.FC<ExerciseCardProps> = ({ status = 'default', imageSrc, imageAlt, subtitle, bodyText }) => {
  return (
    <CardContainer status={status}>
      <ContentContainer>
        <ImageContainer status={status}>
          {imageSrc && <StyledImage src={imageSrc} alt={imageAlt || '운동 이미지'} />}
        </ImageContainer>
        <TextContainer>
          <SubtitleContainer>
            {subtitle && <SubtitleText status={status}>{subtitle}</SubtitleText>}
          </SubtitleContainer>
          <Body2Container>
            {bodyText && <Body2Text status={status}>{bodyText}</Body2Text>}
          </Body2Container>
        </TextContainer>
      </ContentContainer>
    </CardContainer>
  );
};

export default ExerciseCard;
