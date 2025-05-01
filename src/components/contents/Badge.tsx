import '../../styles/foundation/index.css';
import styled from 'styled-components';

interface BadgeProps {
  children: React.ReactNode;
}

const BadgeContainer = styled.div`
  width: 224px;
  height: 72px;
  border-radius: var(--radius-xs);
  padding: 0 var(--padding-m);
  background-color: var(--yellow-400);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Body1 = styled.span`
  font-family: 'Pretendard Variable';
  font-weight: 500;
  font-size: 48px;
  line-height: 64px;
  letter-spacing: -0.48px;
  text-align: center;
  color: var(--yellow-700);
`;

const Badge = ({ children }: BadgeProps) => {
  return (
    <BadgeContainer>
      <Body1>{children}</Body1>
    </BadgeContainer>
  );
};

export default Badge;

