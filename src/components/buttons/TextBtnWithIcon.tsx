import React from 'react';
import styled, { css } from 'styled-components';

type ButtonSize = 'xl' | 'm';

const sizeStyles = {
  xl: css`
    width: 220px;
    height: 64px;
    font-size: 54px;
    line-height: 64px;
    letter-spacing: -0.54px;
    gap: 8px;
  `,
  m: css`
    width: 169px;
    height: 56px;
    font-size: 40px;
    line-height: 48px;
    letter-spacing: -0.4px;
    gap: 6px;
  `
};

const ButtonContainer = styled.button<{ 
  size: ButtonSize; 
  isSelected?: boolean; 
  disabled?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 700;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  ${props => sizeStyles[props.size]}

  background: ${props => {
    if (props.disabled) return 'var(--gray-600)';
    if (props.isSelected) return 'var(--yellow-700)';
    return 'var(--Yellow-Yellow-400)';
  }};

  &:hover {
    opacity: ${props => props.disabled ? 1 : 0.9};
  }

  svg {
    width: ${props => props.size === 'xl' ? '32px' : '24px'};
    height: ${props => props.size === 'xl' ? '32px' : '24px'};
    path {
      fill: currentColor;
    }
  }
`;

export interface TextBtnWithIconProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: ButtonSize;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const TextBtnWithIcon: React.FC<TextBtnWithIconProps> = ({
  children,
  icon,
  size = 'xl',
  isSelected = false,
  disabled = false,
  onClick
}) => {
  return (
    <ButtonContainer
      size={size}
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </ButtonContainer>
  );
};

export default TextBtnWithIcon; 