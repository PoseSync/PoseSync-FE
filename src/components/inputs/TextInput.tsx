import React, { useState } from 'react';
import styled, { css } from 'styled-components';

interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

type InputState = 'default' | 'focus' | 'typing' | 'typed' | 'disabled';

const Container = styled.div<{ state: InputState }>`
  width: 1470px;
  height: 170px;
  border-radius: var(--radius-m);
  background-color: var(--gray-800);
  border: none;
  display: flex;
  align-items: center;
  gap: var(--gap-4);
  padding: var(--padding-xs);
  transition: all 0.2s;

  ${({ state }) => state === 'focus' && css`
    border: 3px solid var(--yellow-300);
  `}
  ${({ state }) => state === 'typing' && css`
    border: 3px solid var(--yellow-300);
  `}
  ${({ state }) => state === 'typed' && css`
    border: none;
  `}
  ${({ state }) => state === 'disabled' && css`
    border: none;
  `}
`;

const StyledInput = styled.input<{ state: InputState }>`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Pretendard Variable';
  font-weight: 700;
  font-size: 92px;
  line-height: 114px;
  letter-spacing: -0.96px;
  color: var(--white);
  text-align: center;

  &::placeholder {
    color: var(--white);
  }
  ${({ state }) => state === 'disabled' && css`
    color: var(--gray-700);
    cursor: not-allowed;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const PlaceholderText = styled.span`
  font-family: 'Pretendard Variable';
  font-weight: 700;
  font-size: 92px;
  line-height: 114px;
  letter-spacing: -0.96px;
  color: var(--white);
  margin-left: 16px;
`;

export const TextInput: React.FC<TextInputProps> = ({
  value = '',
  onChange,
  disabled = false,
  className,
  placeholder,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 상태 판별
  let state: InputState = 'default';
  if (disabled) state = 'disabled';
  else if (isFocused) state = 'typing';
  else if (isHovered) state = 'focus';
  else if (value.length > 0) state = 'typed';

  return (
    <div className={className}>
      <Container
        state={state}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <InputContainer>
          <StyledInput
            state={state}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
          />
          {placeholder && <PlaceholderText>{placeholder}</PlaceholderText>}
        </InputContainer>
      </Container>
    </div>
  );
};
