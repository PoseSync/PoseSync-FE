import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import styled from 'styled-components';
import ExerciseCard from './ExerciseCard';
import { Swiper as SwiperType } from 'swiper';

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
  width: 2835px;
  height: 990px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
`;

const Carousel: React.FC<CarouselProps> = ({ cards }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [centerIndex, setCenterIndex] = useState(0);

  return (
    <CarouselWrapper>
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={5}
        loop={true}
        coverflowEffect={{
          rotate: 0,
          stretch: -300, 
          depth: 100,    
          modifier: 1.5, 
          slideShadows: false,
        }}
        style={{ width: '100%', height: '100%' }}
        modules={[EffectCoverflow]}
        onSwiper={swiper => {
          swiperRef.current = swiper;
          setCenterIndex(swiper.realIndex);
        }}
        onSlideChange={swiper => setCenterIndex(swiper.realIndex)}
      >
        {cards.map((card, idx) => (
          <SwiperSlide key={card.id}>
            <ExerciseCard
              status={idx === centerIndex ? 'focused' : 'default'}
              imageSrc={card.imageSrc}
              imageAlt={card.title}
              subtitle={card.title}
              bodyText={card.description}
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slideToLoop(idx, 500);
                }
                setTimeout(() => {
                  if (card.onClick) card.onClick();
                }, 500);
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </CarouselWrapper>
  );
};

export default Carousel;
