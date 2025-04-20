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


const Keyboard = () => {
  return (
    <KeyboardContainer>
      <KeypadContainer>
        <NormalRowContainer>
          <NormalButton>
            <ButtonContent>
              <NumberText>1</NumberText>
            </ButtonContent>
          </NormalButton>
          <NormalButton>
            <ButtonContent>
              <NumberText>2</NumberText>
              <AlphabetText>ABC</AlphabetText>
            </ButtonContent>
          </NormalButton>
          <NormalButton>
            <ButtonContent>
              <NumberText>3</NumberText>
              <AlphabetText>DEF</AlphabetText>
            </ButtonContent>
          </NormalButton>
        </NormalRowContainer>
        <TallRowContainer>
          <TallButton>
            <ButtonContent>
              <NumberText>4</NumberText>
              <AlphabetText>GHI</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton>
            <ButtonContent>
              <NumberText>5</NumberText>
              <AlphabetText>JKL</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton>
            <ButtonContent>
              <NumberText>6</NumberText>
              <AlphabetText>MNO</AlphabetText>
            </ButtonContent>
          </TallButton>
        </TallRowContainer>
        <TallRowContainer>
          <TallButton>
            <ButtonContent>
              <NumberText>7</NumberText>
              <AlphabetText>PQRS</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton>
            <ButtonContent>
              <NumberText>8</NumberText>
              <AlphabetText>TUV</AlphabetText>
            </ButtonContent>
          </TallButton>
          <TallButton>
            <ButtonContent>
              <NumberText>9</NumberText>
              <AlphabetText>WXYZ</AlphabetText>
            </ButtonContent>
          </TallButton>
        </TallRowContainer>
        <NormalRowContainer>
          <TransparentButton>
            <ButtonContent>
              <NumberText>+ * #</NumberText>
            </ButtonContent>
          </TransparentButton>
          <NormalButton>
            <ButtonContent>
              <NumberText>0</NumberText>
            </ButtonContent>
          </NormalButton>
          <TransparentButton>
            <ButtonContent>
              <NumberText>⌫</NumberText>
            </ButtonContent>
          </TransparentButton>
        </NormalRowContainer>
      </KeypadContainer>
    </KeyboardContainer>
  );
};

export default Keyboard;
