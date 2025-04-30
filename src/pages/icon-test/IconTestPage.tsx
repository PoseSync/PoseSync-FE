import styled from 'styled-components';
import { Chevron } from '../../components/iconography/icons/Chevron';
import { Union } from '../../components/iconography/icons/Union';
import { Minus } from '../../components/iconography/icons/Minus';
import { X } from '../../components/iconography/icons/x';
import { TextBtnWithIcon } from '../../components/buttons/TextBtnWithIcon';

const TestContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  background-color: var(--gray-900);
`;

const IconContainer = styled.div`
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--gray-800);
  border-radius: var(--radius-m);
`;

const IconTestPage = () => {
  return (
    <TestContainer>
      <h1 style={{ color: 'white' }}>Chevron Icon Test</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <IconContainer>
          <Chevron color="yellow-400" />
        </IconContainer>
        <IconContainer>
          <Chevron color="gray-900" />
        </IconContainer>
      </div>

      <h1 style={{ color: 'white' }}>Union Icon Test</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <IconContainer>
          <Union size="xl" color="yellow-400" />
        </IconContainer>
        <IconContainer>
          <Union size="xl" color="yellow-700" />
        </IconContainer>
        <IconContainer>
          <Union size="xl" color="gray-600" />
        </IconContainer>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <IconContainer>
          <Union size="m" color="yellow-400" />
        </IconContainer>
        <IconContainer>
          <Union size="m" color="yellow-700" />
        </IconContainer>
        <IconContainer>
          <Union size="m" color="gray-600" />
        </IconContainer>
      </div>

      <h1 style={{ color: 'white' }}>Minus Icon Test</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <IconContainer>
          <Minus color="yellow-300" />
        </IconContainer>
        <IconContainer>
          <Minus color="yellow-600" />
        </IconContainer>
        <IconContainer>
          <Minus color="gray-700" />
        </IconContainer>
      </div>

      <h1 style={{ color: 'white' }}>X Icon Test</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <IconContainer>
          <X color="gray-900" />
        </IconContainer>
      </div>

      <h1 style={{ color: 'white' }}>TextBtnWithIcon Test</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <TextBtnWithIcon size="xl">텍스트</TextBtnWithIcon>
          <TextBtnWithIcon size="xl" isSelected>선택됨</TextBtnWithIcon>
          <TextBtnWithIcon size="xl" disabled>비활성화</TextBtnWithIcon>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <TextBtnWithIcon size="m" buttonWidth={300} textWidth={200}>추가하기</TextBtnWithIcon>
          <TextBtnWithIcon size="m" isSelected>선택됨</TextBtnWithIcon>
          <TextBtnWithIcon size="m" disabled>비활성화</TextBtnWithIcon>
        </div>
      </div>
    </TestContainer>
  );
};

export default IconTestPage; 