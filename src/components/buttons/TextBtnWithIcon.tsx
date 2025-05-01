import React from 'react';
import styled, { css } from 'styled-components';
import { Union } from '../iconography/icons/Union';

type ButtonSize = 'xl' | 'm';

const sizeStyles = {
  xl: css`
    width: 220px;
    height: 64px;
    gap: 8px;
  `,
  m: css`
    width: 169px;
    height: 56px;
    gap: 6px;
  `
};

const textStyles = {
  xl: css`
    font-size: 54px;
    line-height: 64px;
    letter-spacing: -0.54px;
  `,
  m: css`
    font-size: 40px;
    line-height: 56px;
    letter-spacing: -0.4px;
  `
};

const ButtonContainer = styled.button<{
  size: ButtonSize;
  buttonWidth?: string | number;
  isSelected?: boolean;
  disabled?: boolean;
}>`
  width: ${({ buttonWidth }) =>
    buttonWidth !== undefined
      ? typeof buttonWidth === 'number'
        ? `${buttonWidth}px`
        : buttonWidth
      : 'auto'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 700;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  ${props => sizeStyles[props.size]}
  background: transparent;
  &:hover {
    opacity: ${props => props.disabled ? 1 : 0.9};
  }
`;

const TextContainer = styled.div<{ size: ButtonSize; textWidth?: string | number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => textStyles[props.size]};
  color: ${props => props.color || 'var(--gray-900)'};
  width: ${({ textWidth }) =>
    textWidth !== undefined
      ? typeof textWidth === 'number'
        ? `${textWidth}px`
        : textWidth
      : 'auto'};
`;

export interface TextBtnWithIconProps {
  children: React.ReactNode;
  buttonWidth?: string | number;
  textWidth?: string | number;
  size?: ButtonSize;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const TextBtnWithIcon: React.FC<TextBtnWithIconProps> = ({
  children,
  buttonWidth,
  textWidth,
  size = 'xl',
  isSelected = false,
  disabled = false,
  onClick
}) => {
  const getUnionColor = () => {
    if (disabled) return 'gray-600';
    if (isSelected) return 'yellow-700';
    return 'yellow-400';
  };

  const getTextColor = () => {
    if (disabled) return 'var(--gray-600)';
    if (isSelected) return 'var(--yellow-700)';
    return 'var(--yellow-400)';
  };

  return (
    <ButtonContainer
      size={size}
      buttonWidth={buttonWidth}
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
    >
      <Union size={size} color={getUnionColor()} />
      <TextContainer size={size} color={getTextColor()} textWidth={textWidth}>
        {children}
      </TextContainer>
    </ButtonContainer>
  );
};

export default TextBtnWithIcon; 