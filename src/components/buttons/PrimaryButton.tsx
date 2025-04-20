import styled, { css } from 'styled-components';
import '../../styles/foundation/index.css';

type ButtonSize = 'xl' | 'm' | 's';

interface PrimaryButtonProps {
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
  border: none;
  transition: all 0.2s ease;
  gap: 10px;
  padding-right: var(--padding-m);
  padding-left: var(--padding-m);
  color: var(--gray-900);
  background-color: var(--yellow-400);
  cursor: pointer;

  /* Size Styles */
  ${({ size }) => size === 'xl' && css`
    min-width: 180px;
    width: clamp(180px, 100%, 244px);
    height: 170px;
    border-radius: var(--radius-m);
    font-size: 24px;
    line-height: 32px;
  `}

  ${({ size }) => size === 'm' && css`
    min-width: 150px;
    width: clamp(150px, 100%, 201px);
    height: 124px;
    border-radius: var(--radius-s);
    font-size: 16px;
    line-height: 24px;
  `}

  ${({ size }) => size === 's' && css`
    min-width: 120px;
    width: clamp(120px, 100%, 189px);
    height: 92px;
    border-radius: var(--radius-xs);
    font-size: 14px;
    line-height: 20px;
  `}

  /* State Styles */
  ${({ selected }) =>
    selected &&
    css`
      background-color: var(--yellow-500);
    `}

  &:disabled {
    background-color: var(--gray-300);
    color: var(--white);
    cursor: not-allowed;
  }
`;

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
