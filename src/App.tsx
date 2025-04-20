import styled from 'styled-components';
import './styles/foundation/index.css';
import Badge from './components/contents/Badge';
import Keyboard from './components/resource/Keyboard';
import Carousel from './components/contents/Carousel';

import weightImage from './assets/ex1.png';

const Container = styled.div`
  min-height: 100vh;
  background-color: var(--gray-900);
  padding: var(--padding-m);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gap-4);
  margin-bottom: var(--margin-4);
`;

const Box = styled.div<{ bgColor: string }>`
  height: 80px;
  background-color: ${props => props.bgColor};
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-family: var(--font-family);
  font-size: var(--font-size-m);
`;

const TypographyTest = styled.div`
  margin: var(--margin-4) 0;
  padding: var(--padding-m);
  background-color: var(--white);
  border-radius: var(--radius-m);

  h1 {
    font-family: var(--font-family);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--gray-900);
    margin-bottom: var(--margin-2);
  }

  p {
    font-family: var(--font-family);
    font-size: var(--font-size-m);
    color: var(--gray-600);
    line-height: var(--line-height-m);
  }
`;

const SpacingTest = styled.div`
  margin: var(--margin-4) 0;
  padding: var(--padding-m);
  background-color: var(--white);
  border-radius: var(--radius-m);

  .spacing-item {
    height: 40px;
    background-color: var(--blue-100);
    margin-bottom: var(--margin-2);
    border-radius: var(--radius-xs);
  }
`;

function App() {
  const carouselCards = [
    {
      id: '1',
      title: '바벨 스쿼트',
      description: '발을 어깨너비로 벌리고, 허벅지가 바닥과 수평을 이룰 때까지 앉았다 일어나는 동작',
      imageSrc: weightImage,
    },
    {
      id: '2',
      title: '데드리프트',
      description: '바벨을 잡고 허리를 펴며 일어서는 동작으로 전신 근력 운동',
      imageSrc: weightImage,
    },
    {
      id: '3',
      title: '벤치프레스',
      description: '벤치에 누워 가슴 근육을 사용해 바벨을 밀어올리는 상체 운동',
      imageSrc: weightImage,
    },
    {
      id: '4',
      title: '오버헤드 프레스',
      description: '바벨을 머리 위로 들어올리는 어깨 운동',
      imageSrc: weightImage,
    },
    {
      id: '5',
      title: '바벨 로우',
      description: '상체를 숙이고 바벨을 당기는 등 운동',
      imageSrc: weightImage,
    },
  ];

  return (
    <Container>
      {/* 색상 테스트 */}
      <h2>색상 테스트</h2>
      <Grid>
        <Box bgColor="var(--gray-900)">Gray 900</Box>
        <Box bgColor="var(--blue-900)">Blue 900</Box>
        <Box bgColor="var(--yellow-900)">Yellow 900</Box>
        <Box bgColor="var(--red-900)">Red 900</Box>
        <Box bgColor="var(--purple-900)">Purple 900</Box>
        <Box bgColor="var(--pink-900)">Pink 900</Box>
      </Grid>

      {/* 타이포그래피 테스트 */}
      <TypographyTest>
        <h1>타이포그래피 테스트</h1>
        <p>
          이것은 타이포그래피 테스트입니다. 폰트 패밀리, 크기, 줄 간격 등을 확인할 수 있습니다.
          여러 줄의 텍스트를 입력하여 줄 간격과 가독성을 테스트해보세요.
        </p>
      </TypographyTest>

      {/* 간격 테스트 */}
      <SpacingTest>
        <h2>간격 테스트</h2>
        <div className="spacing-item" style={{ width: 'var(--gap-1)' }}>gap-1</div>
        <div className="spacing-item" style={{ width: 'var(--gap-4)' }}>gap-4</div>
        <div className="spacing-item" style={{ width: 'var(--gap-8)' }}>gap-8</div>
        <div className="spacing-item" style={{ width: 'var(--padding-m)' }}>padding-m</div>
        <div className="spacing-item" style={{ width: 'var(--margin-4)' }}>margin-4</div>
      </SpacingTest>

      {/* 둥근 모서리 테스트 */}
      <div style={{ margin: 'var(--margin-4) 0' }}>
        <h2>둥근 모서리 테스트</h2>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--gap-4)',
          marginBottom: 'var(--margin-4)'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'var(--blue-500)',
            borderRadius: 'var(--radius-xs)'
          }}>radius-xs</div>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'var(--blue-500)',
            borderRadius: 'var(--radius-s)'
          }}>radius-s</div>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'var(--blue-500)',
            borderRadius: 'var(--radius-m)'
          }}>radius-m</div>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        gap: 'var(--gap-4)',
        marginBottom: 'var(--margin-4)'
      }}>
        <Badge>badge</Badge>
        <Badge>Body 1</Badge>
      </div>

      {/* 키보드 컴포넌트 */}
      <Keyboard />

      {/* 운동 카드 컴포넌트 예제들은 주석 처리
      <ExerciseCard 
        imageSrc={weightImage}
        imageAlt="스쿼트 운동 이미지"
        subtitle="Subtitle 1"
        bodyText="반드시 두 줄로 문장을 끝냅니다."
      />

      <ExerciseCard 
        status="focused"
        imageSrc={weightImage}
        imageAlt="스쿼트 운동 이미지"
        subtitle="Subtitle 1"
        bodyText="반드시 두 줄로 문장을 끝냅니다."
      />

      <ExerciseCard 
        status="selected"
        imageSrc={weightImage}
        imageAlt="스쿼트 운동 이미지"
        subtitle="Subtitle 1"
        bodyText="반드시 두 줄로 문장을 끝냅니다."
      />
      */}

      {/* Carousel 컴포넌트 */}
      <div style={{ 
        marginTop: 'var(--margin-4)',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <Carousel cards={carouselCards} />
      </div>
    </Container>
  );
}

export default App;