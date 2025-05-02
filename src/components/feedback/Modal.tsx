import styled from 'styled-components';
import { QuaternaryButton } from '../buttons/QuaternaryButton';
import { SecondaryButton } from '../buttons/SecondaryButton';

const ModalContainer = styled.div`
  width: 884px;
  height: 450px;
  top: 154px;
  left: 50%;
  transform: translateX(-50%);
  position: fixed;
  border-radius: var(--radius-xl);
  padding: 0 var(--padding-l) var(--padding-s) var(--padding-l);
  gap: var(--gap-7);
  background-color: var(--white);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TopContainer = styled.div`
  width: 796px;
  height: 160px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-2);
`;

const SubtitleContainer = styled.div`
  width: 100%;
  height: 80px;
  font-family: 'Pretendard Variable';
  font-weight: 700;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  vertical-align: middle;
  color: var(--gray-900);
`;

const BodyContainer = styled.div`
  width: 100%;
  height: 64px;
  font-family: 'Pretendard Variable';
  font-weight: 500;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  text-align: center;
  vertical-align: middle;
  color: var(--gray-600);
`;

const BottomContainer = styled.div`
  width: 796px;
  height: 124px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const ButtonContainer = styled.div`
  width: 390px;
  height: 124px;
`;

interface ModalContentProps {
  subtitle: string;
  body: string;
  leftButtonText: string;
  rightButtonText: string;
}

const Modal = ({ subtitle, body, leftButtonText, rightButtonText }: ModalContentProps) => {
  return (
    <ModalContainer>
      <TopContainer>
        <SubtitleContainer>{subtitle}</SubtitleContainer>
        <BodyContainer>{body}</BodyContainer>
      </TopContainer>
      <BottomContainer>
        <ButtonContainer>
          <QuaternaryButton size="m">{leftButtonText}</QuaternaryButton>
        </ButtonContainer>
        <ButtonContainer>
          <SecondaryButton size="m">{rightButtonText}</SecondaryButton>
        </ButtonContainer>
      </BottomContainer>
    </ModalContainer>
  );
};

export default Modal;
