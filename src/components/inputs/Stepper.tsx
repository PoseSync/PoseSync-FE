import React from 'react';
import styled from 'styled-components';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

const StepperContainer = styled.div`
  width: 380px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  top: 20px;
  left: 20px;
  background: transparent;
`;

const ValueText = styled.span`
  width: 133px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard Variable';
  font-weight: 700;
  font-size: 56px;
  color: var(--white);
  margin: 0 var(--margin-2);
`;

const UnitText = styled.span`
  font-family: 'Pretendard Variable';
  font-weight: 400;
  font-size: 36px;
  color: var(--white);
  margin-left: 8px;
`;

const StepperButton = styled.button<{ disabled?: boolean }>`
  width: 72px;
  height: 72px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Pretendard Variable';
  font-weight: 600;
  border-radius: var(--radius-xs);
  border-width: 3px;
  border: 3px solid var(--Yellow-Yellow-300, #D2F868);
  transition: all 0.2s ease;
  background-color: transparent;
  color: var(--yellow-300);
  cursor: pointer;
  padding: 0;
  font-size: 48px;

  &:disabled {
    background-color: var(--gray-800);
    color: var(--gray-700);
    cursor: not-allowed;
    border-color: var(--gray-600);
  }
`;

export const Stepper: React.FC<StepperProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  className,
}) => {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      const next = Math.max(value - step, min);
      onChange(next);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      const next = Math.min(value + step, max);
      onChange(next);
    }
  };

  return (
    <StepperContainer className={className}>
      <StepperButton onClick={handleDecrement} disabled={!canDecrement}>
        –
      </StepperButton>
      <ValueText>{value}{unit && <UnitText>{unit}</UnitText>}</ValueText>
      <StepperButton onClick={handleIncrement} disabled={!canIncrement}>
        +
      </StepperButton>
    </StepperContainer>
  );
};
