import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import styled from "styled-components";
import ExerciseCard from "./ExerciseCard";
import { Swiper as SwiperType } from "swiper";

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
  position: relative;

  .swiper {
    width: 3200px !important;
    margin-left: -200px;
  }

  .swiper-wrapper {
    align-items: center;
  }
`;

const Carousel: React.FC<CarouselProps> = ({ cards }) => {
  const swiperRef = useRef<SwiperType | null>(null);

  // 바벨 스쿼트의 초기 인덱스 찾기
  const initialIndex = cards.findIndex((card) => card.title === "바벨 스쿼트");
  const [centerIndex, setCenterIndex] = useState(
    initialIndex !== -1 ? initialIndex : 2
  );
  const timeoutRef = useRef<number | null>(null);

  const handleSlideChange = (swiper: SwiperType) => {
    // 이전 timeout 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 짧은 딜레이 후 인덱스 업데이트 (깜빡임 방지)
    timeoutRef.current = window.setTimeout(() => {
      setCenterIndex(swiper.realIndex);
    }, 20);
  };

  return (
    <CarouselWrapper>
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={5}
        spaceBetween={0}
        initialSlide={initialIndex !== -1 ? initialIndex : 2}
        loop={true}
        speed={600}
        loopAdditionalSlides={3}
        coverflowEffect={{
          rotate: 0,
          stretch: -300,
          depth: 100,
          modifier: 1.5,
          slideShadows: false,
        }}
        modules={[EffectCoverflow]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setCenterIndex(swiper.realIndex);
        }}
        onSlideChange={handleSlideChange}
      >
        {cards.map((card, idx) => (
          <SwiperSlide key={card.id}>
            <ExerciseCard
              status={idx === centerIndex ? "focused" : "default"}
              imageSrc={card.imageSrc}
              imageAlt={card.title}
              subtitle={card.title}
              bodyText={card.description}
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slideToLoop(idx, 600);
                }
                setTimeout(() => {
                  if (card.onClick) card.onClick();
                }, 600);
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </CarouselWrapper>
  );
};

export default Carousel;