import '../../styles/foundation/index.css';
import styled from 'styled-components';

const KeyboardContainer = styled.div`
  width: 1146px;
  height: 889.3px;
  display: flex;
  flex-direction: column;
  background-color: #353537;
`;

const KeypadContainer = styled.div`
  width: 1146px;
  height: 672.32px;
  display: flex;
  flex-direction: column;
  gap: 21.39px;
  padding: 24.45px 18.34px 21.39px 18.34px;
`;

const NormalRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 1109.33px;
  height: 140.58px;
  gap: 18.34px;
`;

const TallRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 1109.33px;
  height: 143.63px;
  gap: 18.34px;
`;

const ButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  color: white;
  padding-top: 20px;
`;

const NumberText = styled.span`
  font-size: 64px;
  font-weight: bold;
  line-height: 1;
`;

const AlphabetText = styled.span`
  font-size: 24px;
  font-weight: bold;
  margin-top: 12px;
  letter-spacing: 4px;
`;

const NormalButton = styled.button`
  width: 357.55px;
  height: 140.58px;
  border-radius: 15.28px;
  background: #727274;
  box-shadow: 0px 3.06px 0px 0px #000000;
  border: none;
  cursor: pointer;
`;

const TallButton = styled.button`
  width: 357.5px;
  height: 143.63px;
  border-radius: 15.28px;
  background: #727274;
  box-shadow: 0px 3.06px 0px 0px #000000;
  border: none;
  cursor: pointer;
`;

const TransparentButton = styled.button`
  width: 357.55px;
  height: 140.58px;
  border-radius: 15.28px;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const BottomContainer = styled.div`
  width: 1146px;
  height: 216.98px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HomeIndicatorWrapper = styled.div`
  width: 1146px;
  height: 103.9px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: transparent;
`;

const HomeIndicator = styled.div`
  width: 421.73px;
  height: 15.28px;
  border-radius: 305.6px;
  background: var(--white);
`;

interface KeyboardProps {
  onInput?: (value: string) => void;
}

const Keyboard = ({ onInput }: KeyboardProps) => {
  return (
    <KeyboardContainer>
      <KeypadContainer>
        <NormalRowContainer>
          <NormalButton onClick={() => onInput?.('1')}>
            <ButtonContent>
              <NumberText>1</NumberText>
            </ButtonContent>
          </NormalButton>
          <NormalButton onClick={() => onInput?.('2')}>
            <ButtonContent>
              <NumberText>2</NumberText>
              <AlphabetText>ABC</AlphabetText>
            </ButtonContent>
          </NormalButton>
          <NormalButton onClick={() => onInput?.('3')}>
            <ButtonContent>
              <NumberText>3</NumberText>
              <AlphabetText>DEF</AlphabetText>
            </ButtonContent>
          </NormalButton>
        </NormalRowContainer>
        <TallRowContainer>
          <TallButton onClick={() => onInput?.('4')}>
            <ButtonContent>
              <NumberText>4</NumberText>
              <AlphabetText>GHI</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton onClick={() => onInput?.('5')}>
            <ButtonContent>
              <NumberText>5</NumberText>
              <AlphabetText>JKL</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton onClick={() => onInput?.('6')}>
            <ButtonContent>
              <NumberText>6</NumberText>
              <AlphabetText>MNO</AlphabetText>
            </ButtonContent>
          </TallButton>
        </TallRowContainer>
        <TallRowContainer>
          <TallButton onClick={() => onInput?.('7')}>
            <ButtonContent>
              <NumberText>7</NumberText>
              <AlphabetText>PQRS</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton onClick={() => onInput?.('8')}>
            <ButtonContent>
              <NumberText>8</NumberText>
              <AlphabetText>TUV</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton onClick={() => onInput?.('9')}>
            <ButtonContent>
              <NumberText>9</NumberText>
              <AlphabetText>WXYZ</AlphabetText>
            </ButtonContent>
          </TallButton>
        </TallRowContainer>
        <NormalRowContainer>
          <TransparentButton onClick={() => onInput?.('+*#')}>
            <ButtonContent>
              <NumberText>+ * #</NumberText>
            </ButtonContent>
          </TransparentButton>
          <NormalButton onClick={() => onInput?.('0')}>
            <ButtonContent>
              <NumberText>0</NumberText>
            </ButtonContent>
          </NormalButton>
          <TransparentButton onClick={() => onInput?.('backspace')}>
            <ButtonContent>
              <NumberText>⌫</NumberText>
            </ButtonContent>
          </TransparentButton>
        </NormalRowContainer>
      </KeypadContainer>
      <BottomContainer>
        <HomeIndicatorWrapper>
          <HomeIndicator />
        </HomeIndicatorWrapper>
      </BottomContainer>
    </KeyboardContainer>
  );
};

export default Keyboard;
