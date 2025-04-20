import { useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import styled from 'styled-components';
import ExerciseCard from './ExerciseCard';

interface CarouselProps {
  cards: {
    id: string;
    title: string;
    description: string;
    imageSrc: string;
  }[];
}

const CarouselWrapper = styled.div`
  width: 2864px;
  height: 1030px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const SliderContainer = styled.div`
  width: 100%;
  height: 100%;
  .keen-slider {
    display: flex;
    align-items: center;
    height: 100%;
  }
  .keen-slider__slide {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const Carousel: React.FC<CarouselProps> = ({ cards }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 2,
    loop: true,
    mode: "snap",
    slides: {
      perView: 3,
      spacing: 15,
      origin: "center",
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  const getCardStatus = (index: number, cardId: string): 'default' | 'focused' | 'selected' => {
    if (cardId === selectedCardId) return 'selected';
    if (index === currentSlide) return 'focused';
    return 'default';
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  return (
    <CarouselWrapper>
      <SliderContainer>
        <div ref={sliderRef} className="keen-slider">
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className="keen-slider__slide"
              onClick={() => handleCardClick(card.id)}
              style={{ cursor: 'pointer' }}
            >
              <ExerciseCard
                status={getCardStatus(index, card.id)}
                imageSrc={card.imageSrc}
                imageAlt={card.title}
                subtitle={card.title}
                bodyText={card.description}
              />
            </div>
          ))}
        </div>
        {loaded && instanceRef.current && (
          <div className="dots">
            {Array.from(Array(cards.length).keys()).map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  instanceRef.current?.moveToIdx(idx);
                }}
                className={"dot" + (currentSlide === idx ? " active" : "")}
              />
            ))}
          </div>
        )}
      </SliderContainer>
    </CarouselWrapper>
  );
};

export default Carousel;
