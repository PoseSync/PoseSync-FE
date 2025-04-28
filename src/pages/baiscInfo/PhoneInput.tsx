import Badge from '../../components/contents/Badge';
import Keyboard from '../../components/resource/Keyboard';
import { PhoneNumberTextInput } from '../../components/inputs/PhoneNumberTextInput';
import styled from 'styled-components';
import { useState } from 'react';
import { TertiaryButton } from '../../components/buttons/TertiaryButton';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { useNavigate } from 'react-router-dom';

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
  font-family: 'Pretendard Variable';
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
  font-family: 'Pretendard Variable';
  font-weight: 600;
  font-size: 80px;
  line-height: 100px;
  letter-spacing: -0.8px;
  color: var(--white);
`;

const SubTitle = styled.div`
  font-family: 'Pretendard Variable';
  font-weight: 500;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  color: var(--gray-300, #A8B0BD);
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

const PHONE_PREFIX = '010  -  ';

const PhoneInput = () => {
  const [phoneValue, setPhoneValue] = useState('');
  const navigate = useNavigate();

  // 키패드 입력 처리 함수
  const handleKeyboardInput = (key: string) => {
    // prefix 이후의 숫자만 추출
    const raw = phoneValue.startsWith(PHONE_PREFIX)
      ? phoneValue.slice(PHONE_PREFIX.length)
      : phoneValue.replace(/^010\s*-?\s*/, '');
    const onlyNumbers = raw.replace(/[^0-9]/g, '');

    if (key === 'backspace') {
      // prefix 이후 번호만 지우기
      if (onlyNumbers.length === 0) return;
      const newNumbers = onlyNumbers.slice(0, -1);
      let formatted = '';
      if (newNumbers.length <= 4) {
        formatted = newNumbers;
      } else {
        formatted = newNumbers.slice(0, 4) + '  -  ' + newNumbers.slice(4);
      }
      setPhoneValue(PHONE_PREFIX + formatted);
    } else if (key === '+*#') {
      // 특수문자 입력 처리 필요시 여기에
    } else {
      // 8자리 이상이면 입력 막기
      if (onlyNumbers.length >= 8) return;
      const newNumbers = onlyNumbers + key;
      if (!/^[0-9]$/.test(key)) return; // 숫자만 입력
      let formatted = '';
      if (newNumbers.length <= 4) {
        formatted = newNumbers;
      } else {
        formatted = newNumbers.slice(0, 4) + '  -  ' + newNumbers.slice(4);
      }
      setPhoneValue(PHONE_PREFIX + formatted);
    }
  };

  // 전화번호가 11자리(숫자만)면 완료로 간주
  const isPhoneComplete = phoneValue.replace(/[^0-9]/g, '').length === 11;

  return (
    <FullScreen>
      <LeftContainer>
        <InnerContentContainer>
          <TopInfoContainer>
            <TopInfoContentContainer>
              <Badge>01</Badge>
              <Title>전화번호를 입력해주세요.</Title>
            </TopInfoContentContainer>
            <SubTitle>
              전화번호를 통해 Ai 신체 분석 및 실시간 운동 자세에 관한 피드백을 보내드립니다.
            </SubTitle>
          </TopInfoContainer>
          <Keyboard onInput={handleKeyboardInput} />
        </InnerContentContainer>
      </LeftContainer>
      <RightContainer>
        <RightTopContainer>
          <PhoneLabelContainer>전화번호</PhoneLabelContainer>
          <PhoneNumberTextInput value={phoneValue} onChange={setPhoneValue} />
        </RightTopContainer>
        <ButtonRowContainer>
          <TertiaryButton size="xl" fontSize="48px" onClick={() => navigate('/')}>이전으로</TertiaryButton>
          <PrimaryButton
            size="xl"
            fontSize="48px"
            selected={isPhoneComplete}
            disabled={!isPhoneComplete}
            onClick={() => {
              if (isPhoneComplete) navigate('/height');
            }}
          >
            다음으로
          </PrimaryButton>
        </ButtonRowContainer>
      </RightContainer>
    </FullScreen>
  );
};

export default PhoneInput;
