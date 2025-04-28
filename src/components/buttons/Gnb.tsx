import styled from 'styled-components';
import '../../styles/foundation/index.css';

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

export { GnbContainer, GnbInnerContainer };

