import styled, { css } from 'styled-components';
import '../../styles/foundation/index.css';

type ButtonSize = 'xl' | 'm';

interface QuaternaryButtonProps {
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

interface StyledButtonProps {
  size: ButtonSize;
  selected: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Pretendard Variable';
  font-weight: 600;
  border: 4px solid var(--gray-200);
  transition: all 0.2s ease;
  gap: 10px;
  padding-right: var(--padding-m);
  padding-left: var(--padding-m);
  color: var(--gray-800);
  background-color: transparent;
  cursor: pointer;
  color: var(--gray-900);
  width: 100%;

  /* Size Styles */
  ${({ size }) => size === 'xl' && css`
    min-width: 180px;
    width: 100%;
    height: 170px;
    border-radius: var(--radius-m);
    font-size: 24px;
    line-height: 32px;
  `}

  ${({ size }) => size === 'm' && css`
    min-width: 150px;
    width: 100%;
    height: 124px;
    border-radius: var(--radius-s);
    font-size: 24px;
    line-height: 32px;
  `}

  /* State Styles */
  ${({ selected }) =>
    selected &&
    css`
      background-color: var(--gray-100);
    `}

  &:disabled {
    background-color: var(--gray-300);
    cursor: not-allowed;
    border: none;
    color: var(--white);
  }
`;

export const QuaternaryButton: React.FC<QuaternaryButtonProps> = ({
  size = 'm',
  selected = false,
  disabled = false,
  onClick,
  children,
}) => {
  return (
    <StyledButton
      size={size}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      selected={selected}
    >
      {children}
    </StyledButton>
  );
};
