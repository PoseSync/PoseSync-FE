import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import '../../styles/foundation/index.css';
import PoseSyncLogo1 from '../../assets/images/logo/PoseSyncLogo1.png';
import { TertiaryButton } from '../buttons/TertiaryButton';

const GnbContainer = styled.div`
  width: 3840px;
  height: 180px;
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--padding-l);
  padding-right: var(--padding-3xl);
  padding-bottom: var(--padding-l);
  padding-left: var(--padding-3xl);
`;

const GnbInnerContainer = styled.div`
  width: 3728px;
  height: 92px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImg = styled.img`
  width: 274px;
  height: 64px;
  object-fit: contain;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`;

const Gnb = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <GnbContainer>
      <GnbInnerContainer>
        <LeftContainer>
          <LogoImg src={PoseSyncLogo1} alt="Pose Sync 로고" />
        </LeftContainer>
        <RightContainer>
          <TertiaryButton 
            size="s" 
            fontSize="36px"
            onClick={handleLogout}
          >
            로그아웃
          </TertiaryButton>
        </RightContainer>
      </GnbInnerContainer>
    </GnbContainer>
  );
};

export default Gnb;

