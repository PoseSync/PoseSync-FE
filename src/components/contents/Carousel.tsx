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
    onClick?: () => void;
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
    opacity: 0.3;
    transition: all 0.5s ease;
    transform: scale(0.723); /* 635.8/880 ≈ 0.723 */
    width: 635.8px;
    height: 715.28px;
  }
  .keen-slider__slide.active {
    opacity: 1;
    transform: scale(1);
    width: 880px;
    height: 990px;
    z-index: 3;
  }
  .keen-slider__slide.semi-active {
    opacity: 0.6;
    transform: scale(0.85); /* 748/880 ≈ 0.85 */
    width: 748px;
    height: 841.5px;
    z-index: 2;
  }
`;

const Carousel: React.FC<CarouselProps> = ({ cards }) => {
  const initialIndex = Math.floor(cards.length / 2);
  const [currentSlide, setCurrentSlide] = useState(initialIndex);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialIndex,
    loop: true,
    mode: "snap",
    slides: {
      perView: 3,
      spacing: -500,
      origin: "center",
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
    },
  });

  const getSlideClass = (index: number) => {
    const distance = Math.abs(index - currentSlide);
    if (distance === 0) return 'active';
    if (distance === 1) return 'semi-active';
    return '';
  };

  return (
    <CarouselWrapper>
      <SliderContainer>
        <div ref={sliderRef} className="keen-slider">
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className={`keen-slider__slide ${getSlideClass(index)}`}
              onClick={() => {
                instanceRef.current?.moveToIdx(index);
                setTimeout(() => {
                  if (card.onClick) card.onClick();
                }, 300);
              }}
              style={{ cursor: 'pointer' }}
            >
              <ExerciseCard
                status={index === currentSlide ? 'focused' : 'default'}
                imageSrc={card.imageSrc}
                imageAlt={card.title}
                subtitle={card.title}
                bodyText={card.description}
              />
            </div>
          ))}
        </div>
      </SliderContainer>
    </CarouselWrapper>
  );
};

export default Carousel;
