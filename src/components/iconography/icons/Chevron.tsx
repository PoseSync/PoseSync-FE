import React from 'react';
import styled from 'styled-components';

interface ChevronProps {
  color?: 'yellow-400' | 'gray-900';
  className?: string;
}

const ChevronContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChevronImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export const Chevron: React.FC<ChevronProps> = ({
  color = 'yellow-400',
  className,
}) => {
  const imagePath = `/src/assets/images/icon/chevron/chevron-left-${color}.png`;

  return (
    <ChevronContainer className={className}>
      <ChevronImage src={imagePath} alt={`chevron-left-${color}`} />
    </ChevronContainer>
  );
};
