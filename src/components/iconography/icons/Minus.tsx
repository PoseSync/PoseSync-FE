import React from 'react';
import styled from 'styled-components';

interface MinusProps {
  color?: 'yellow-300' | 'yellow-600' | 'gray-700';
}

const MinusContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MinusImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export const Minus: React.FC<MinusProps> = ({
  color = 'gray-700',
}) => {
  const imagePath = `/src/assets/images/icon/minus/minus-${color}.png`;

  return (
    <MinusContainer>
      <MinusImage src={imagePath} alt={`minus-${color}`} />
    </MinusContainer>
  );
};
