import styled, { css } from 'styled-components';
import '../../styles/foundation/index.css';

interface IconBtnWithContainerProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  bgColor?: string; 
  borderColor?: string; 
}

interface StyledButtonProps {
  selected: boolean;
  bgColor?: string;
  borderColor?: string;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Pretendard Variable';
  font-weight: 600;
  border: 4px solid var(--yellow-300);
  transition: all 0.2s ease;
  background-color: transparent;
  color: var(--yellow-300);
  cursor: pointer;
  padding: 0;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xs);
  font-size: 48px;

  ${({ selected }) =>
    selected &&
    css`
      background-color: var(--yellow-300);
      color: var(--yellow-600);
    `}

  &:disabled {
    background-color: var(--gray-800);
    color: var(--gray-700);
    cursor: not-allowed;
    border-color: var(--gray-600);
  }
`;

export const IconBtnWithContainer: React.FC<IconBtnWithContainerProps> = ({
  selected = false,
  disabled = false,
  onClick,
  children,
  bgColor,
  borderColor,
}) => {
  return (
    <StyledButton
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      selected={selected}
      bgColor={bgColor}
      borderColor={borderColor}
    >
      {children}
    </StyledButton>
  );
};
