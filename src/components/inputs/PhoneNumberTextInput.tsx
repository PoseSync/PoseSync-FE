import React, { useState } from 'react';
import styled, { css } from 'styled-components';

interface PhoneNumberTextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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
    border: none
  `}
  ${({ state }) => state === 'disabled' && css`
    border: none;
  `}
`;

const PhoneInput = styled.input<{ state: InputState }>`
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

export const PhoneNumberTextInput: React.FC<PhoneNumberTextInputProps> = ({
  value = '',
  onChange,
  disabled = false,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 상태 판별
  let state: InputState = 'default';
  if (disabled) state = 'disabled';
  else if (isFocused) state = 'typing';
  else if (isHovered) state = 'focus';
  else if (value.replace(/[^0-9]/g, '').length > 0) state = 'typed';

  // 항상 '010  -  '이 앞에 붙도록 강제 + 자동 하이픈 처리
  const prefix = '010  -  ';
  // prefix 이후의 숫자만 추출
  const getNumbers = (input: string) => input.replace(/[^0-9]/g, '');
  // prefix 이후의 입력값만 관리
  const raw = value.startsWith(prefix) ? value.slice(prefix.length) : value.replace(/^010\s*-?\s*/, '');
  const numbers = getNumbers(raw).slice(0, 9); // 최대 9자리

  let formatted = '';
  if (numbers.length <= 4) {
    formatted = numbers;
  } else {
    formatted = numbers.slice(0, 4) + '  -  ' + numbers.slice(4);
  }
  const displayValue = prefix + formatted;

  return (
    <div className={className}>
      <Container
        state={state}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <PhoneInput
          state={state}
          value={displayValue}
          onChange={e => {
            let inputValue = e.target.value;
            // prefix 앞부분이 지워지면 복구
            if (!inputValue.startsWith(prefix)) {
              inputValue = prefix + inputValue.replace(/^010\s*-?\s*/, '');
            }
            // prefix 이후 숫자만 추출
            const raw = inputValue.slice(prefix.length);
            const numbers = raw.replace(/[^0-9]/g, '').slice(0, 9);
            let formatted = '';
            if (numbers.length <= 4) {
              formatted = numbers;
            } else {
              formatted = numbers.slice(0, 4) + '  -  ' + numbers.slice(4);
            }
            const nextValue = prefix + formatted;
            onChange?.(nextValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          maxLength={prefix.length + 13} // 010  -  12345  -  6789
        />
      </Container>
    </div>
  );
};
