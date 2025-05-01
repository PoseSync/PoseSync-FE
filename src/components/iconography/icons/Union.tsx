import React from 'react';
import styled from 'styled-components';

interface UnionProps {
  color?: 'yellow-400' | 'yellow-700' | 'gray-600';
  size?: 'xl' | 'm';
}

const UnionContainer = styled.div<{ size: 'xl' | 'm' }>`
  width: ${({ size }) => (size === 'xl' ? '40px' : '32px')};
  height: ${({ size }) => (size === 'xl' ? '40px' : '32px')};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UnionImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export const Union: React.FC<UnionProps> = ({
  color = 'yellow-400',
  size = 'm',
}) => {
  const imagePath = `/src/assets/images/icon/union/Union-${color}.png`;

  return (
    <UnionContainer size={size}>
      <UnionImage src={imagePath} alt={`union-${color}`} />
    </UnionContainer>
  );
};
