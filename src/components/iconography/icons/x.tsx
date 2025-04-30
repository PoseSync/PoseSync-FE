import React from 'react';
import styled from 'styled-components';

interface XProps {
  color?: 'gray-900';
}

const XContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const XImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export const X: React.FC<XProps> = ({
  color = 'gray-900',
}) => {
  const imagePath = `/src/assets/images/icon/x/x-${color}.png`;

  return (
    <XContainer>
      <XImage src={imagePath} alt={`x-${color}`} />
    </XContainer>
  );
};
