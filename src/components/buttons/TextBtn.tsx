import React from 'react';
import styled from 'styled-components';

const TextBtn = styled.button<{ isSelected?: boolean; disabled?: boolean }>`
  width: 164px;
  height: 64px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 700;
  font-size: 32px;
  line-height: 64px;
  letter-spacing: -0.54px;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  color: ${props => {
    if (props.disabled) return 'var(--gray-600)';
    if (props.isSelected) return 'var(--yellow-700)';
    return 'var(--yellow-400)';
  }};

  &:hover {
    opacity: ${props => props.disabled ? 1 : 0.9};
  }
`;

export interface TextBtnProps {
  children: React.ReactNode;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const TextButton: React.FC<TextBtnProps> = ({
  children,
  isSelected = false,
  disabled = false,
  onClick
}) => {
  return (
    <TextBtn
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </TextBtn>
  );
};

export default TextButton;
