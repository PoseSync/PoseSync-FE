import styled from 'styled-components';
import { SecondaryButton } from '../buttons/SecondaryButton';

const ToastContainer = styled.div`
  width: 3011px;
  height: 250px;
  background: var(--yellow-300);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-2xl);
  gap: 32px;
`;

const TextContainer = styled.div`
  width: 1317px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard Variable', sans-serif;
  font-size: 68px;
  font-weight: 700;
  color: var(--gray-900);
`;

const ButtonContainer = styled.div`
  width: 595px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StartExerciseToast = ({ onStart }: { onStart: () => void }) => {
  return (
    <ToastContainer>
      <TextContainer>
        전신 분석 완료! 이제 운동을 시작해볼까요?
      </TextContainer>
      <ButtonContainer>
        <SecondaryButton size="xl" fontSize="48px" onClick={onStart}>
          운동 시작하기
        </SecondaryButton>
      </ButtonContainer>
    </ToastContainer>
  );
};

export default StartExerciseToast;
