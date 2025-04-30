import styled from 'styled-components';
import PoseSyncLogo from '../../assets/images/logo/PoseSyncLogo4.png';

const LogoContainer = styled.div`
  width: 1540px;
  height: 360px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = () => (
  <LogoContainer>
    <img
      src={PoseSyncLogo}
      alt="Pose Sync Logo"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </LogoContainer>
);

export default Logo;
