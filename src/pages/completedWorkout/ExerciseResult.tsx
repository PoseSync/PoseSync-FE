import React from 'react';
import styled from 'styled-components';
import Gnb from '../../components/gnb/Gnb';
import CheckImg from '../../assets/images/items/check.png';
import XImg from '../../assets/images/items/x.png';
import { useExerciseStore } from '../../store/useExerciseStore';

const Container = styled.div`
  width: 3840px;
  height: 2160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gray-900);
`;

const MainContainer = styled.div`
  width: 3840px;
  height: 1980px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const MainBox = styled.div`
  width: 3020px;
  height: 1445px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end; 
  gap: 80px;
`;

const LeftContainer = styled.div`
  width: 1780px;
  height: 1445px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

const TextContainer = styled.div`
  width: 1780px;
  height: 112px;
  font-family: 'Pretendard Variable', sans-serif;
  font-weight: 600;
  font-size: 88px;
  line-height: 112px;
  letter-spacing: -0.88px;
  color: var(--white);
`;

const ImageContainer = styled.div`
  width: 1780px;
  height: 1264px;
`;

const RightContainer = styled.div`
  width: 1160px;
  height: 1264px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 97px;
`;

const SetBox = styled.div`
  width: 1160px;
  height: 997px;
  display: flex;
  flex-direction: column;
  gap: var(--margin-5);
`;

const SetItem = styled.div`
  width: 1160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--gray-800);
  padding: var(--padding-m) var(--padding-3xl) var(--padding-m) var(--padding-3xl);
  border-radius: var(--radius-m);
`;

const SetItemDetail = styled.div`
  width: 1048px;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SetKgCount = styled.div`
  width: 605px;
  height: 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--margin-16);
`;

const Set = styled.div`
    width: 174px;
    height: 80px;
    display: flex;
    gap: var(--margin-1);
    align-items: center;
    font-family: 'Pretendard Variable', sans-serif;
    font-weight: 700;
    font-size: 60px;
    line-height: 80px;
    letter-spacing: -0.6px;
    color: var(--white);
`;

const SetVolume = styled.div`
    width: 311px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--margin-4);
    font-family: 'Pretendard Variable', sans-serif;
    font-weight: 700;
    font-size: 60px;
    line-height: 80px;
    letter-spacing: -0.6px;
    text-align: center;
    color: var(--white);
`;

const ItemContainer = styled.div`
    width: 80px;
    height: 80px;
`;

const ExerciseResult = () => {
  const exercise = useExerciseStore(state => state.selectedExercise);
  const sets = useExerciseStore(state => state.sets);
  return (
    <Container>
      <Gnb />
      <MainContainer>
        <MainBox>
            <LeftContainer>
                <TextContainer>
                    {exercise ? exercise.name : ''}
                </TextContainer>
                <ImageContainer>
                    {exercise && (
                      <img src={exercise.detailImage} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                </ImageContainer>
            </LeftContainer>
            <RightContainer>
                <SetBox>
                  {sets.map((set, index) => (
                    <SetItem key={index}>
                      <SetItemDetail>
                        <SetKgCount>
                          <Set>
                            {index + 1}세트
                          </Set>
                          <SetVolume>
                            {set.weight} kg  x  {set.reps} 회
                          </SetVolume>
                        </SetKgCount>
                      </SetItemDetail>
                      <ItemContainer>
                        <img src={CheckImg} alt="체크 표시" style={{ width: '80px', height: '80px' }} />
                      </ItemContainer>
                    </SetItem>
                  ))}
                </SetBox>

            </RightContainer>
        </MainBox>
      </MainContainer>
    </Container>
  );
};

export default ExerciseResult;
