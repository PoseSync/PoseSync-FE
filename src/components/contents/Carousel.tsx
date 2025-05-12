import { useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import styled from "styled-components";
import ExerciseCard from "./ExerciseCard";

interface CarouselCard {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  available?: boolean; // 가용성 속성 추가
  onClick?: () => void;
}

interface CarouselProps {
  cards: CarouselCard[];
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
      spacing: -400,
      origin: "center",
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {},
  });

  const getSlideClass = (index: number) => {
    const distance = Math.abs(index - currentSlide);
    if (distance === 0) return "active";
    if (distance === 1) return "semi-active";
    return "";
  };

  // 운동 클릭 핸들러
  const handleExerciseClick = (card: CarouselCard, index: number) => {
    // 준비 중인 운동인 경우 얼럿 표시
    if (card.available === false) {
      alert(
        `${card.title}은(는) 현재 준비 중입니다. 다른 운동을 선택해주세요.`
      );
      return;
    }

    // 사용 가능한 운동이면 슬라이드 이동 후 onClick 실행
    instanceRef.current?.moveToIdx(index);
    setTimeout(() => {
      if (card.onClick) card.onClick();
    }, 300);
  };

  return (
    <CarouselWrapper>
      <SliderContainer>
        <div ref={sliderRef} className="keen-slider">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`keen-slider__slide ${getSlideClass(index)}`}
              onClick={() => handleExerciseClick(card, index)}
              style={{
                cursor: card.available === false ? "not-allowed" : "pointer",
              }}
            >
              <ExerciseCard
                status={index === currentSlide ? "focused" : "default"}
                imageSrc={card.imageSrc}
                imageAlt={card.title}
                subtitle={card.title}
                bodyText={card.description}
                available={card.available}
              />
            </div>
          ))}
        </div>
      </SliderContainer>
    </CarouselWrapper>
  );
};

export default Carousel;
