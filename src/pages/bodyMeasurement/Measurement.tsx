import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const FullScreen = styled.div`
  width: 3840px;
  height: 2160px;
  background-color: var(--gray-900);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  padding: 0;
`;

const LottieBox = styled.div`
  width: 1160px;
  height: 749px;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 486px;
`;

const TextBox = styled.div`
  width: 1160px;
  height: 160px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 60px;
  line-height: 80px;
  letter-spacing: -0.6px;
  text-align: center;
  color: var(--white);
  margin-top: 172px;
`;

const ButtonBox = styled.div`
  width: 1160px;
  height: 170px;
  margin-top: 130px;
`;

const Measurement = () => {
  const navigate = useNavigate();
  return (
    <FullScreen>
      <LottieBox>
        디자이너가 Lottie를 줘야합니다
      </LottieBox>
      <TextBox>
        신체 측정 중입니다.<br />
        잠시만 기다려주세요.
      </TextBox>
      <ButtonBox>
        <PrimaryButton size="xl" fontSize="32px" onClick={() => navigate('/')}>측정 그만하기</PrimaryButton>
      </ButtonBox>
    </FullScreen>
  );
};

export default Measurement;

