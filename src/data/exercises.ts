import barbellSquatImg from "../assets/images/exercises/barbell-squat.png";
import lungeImg from "../assets/images/exercises/lunge.png";
import shoulderPressImg from "../assets/images/exercises/shoulder-press.png";
import sideLateralRaiseImg from "../assets/images/exercises/side-lateral-raise.png";
import deadliftImg from "../assets/images/exercises/deadlift.png";
import barbellCurlImg from "../assets/images/exercises/barbell-curl.png";
import barbellRowImg from "../assets/images/exercises/barbell-row.png";
import dumbbellRowImg from "../assets/images/exercises/dumbbell-row.png";
import frontRaiseImg from "../assets/images/exercises/front-raise.png";
import inclineBenchPressImg from "../assets/images/exercises/incline-bench-press.png";

// 상세 이미지 import
import barbellSquatDetailImg from "../assets/images/detailexercises/barbell-squat-detail.png";
import lungeDetailImg from "../assets/images/detailexercises/lunge-detail.png";
import shoulderPressDetailImg from "../assets/images/detailexercises/shoulder-press-detail.png";
import sideLateralRaiseDetailImg from "../assets/images/detailexercises/side-lateral-raise-detail.png";
import deadliftDetailImg from "../assets/images/detailexercises/deadlift-detail.png";
import barbellCurlDetailImg from "../assets/images/detailexercises/barbell-curl-detail.png";
import barbellRowDetailImg from "../assets/images/detailexercises/barbell-row-detail.png";
import dumbbellRowDetailImg from "../assets/images/detailexercises/dumbbell-row-detail.png";
import frontRaiseDetailImg from "../assets/images/detailexercises/front-raise-detail.png";
import inclineBenchPressDetailImg from "../assets/images/detailexercises/incline-bench-press-detail.png";

export interface Exercise {
  name: string;
  image: string;
  detailImage: string;
  cardDescription: string;
  detailDescription: string;
  available: boolean; // 가용성 속성 추가
}

export const exercises: Exercise[] = [
  {
    name: "바벨 스쿼트",
    image: barbellSquatImg,
    detailImage: barbellSquatDetailImg,
    cardDescription:
      "발을 어깨너비로 벌리고, 햄직각이 바닥과 수평을 이룰 때까지 앉았다 일어나는 동작",
    detailDescription:
      "어깨너비로 다리를 벌리고 앉았다 일어나는 동작으로, 햄직각이 바닥과 수평이 될 때까지 내려간다. 바벨을 들면 효과가 강해지며, 대퇴사두근, 대둔근, 척추기립근을 주로 단련한다.",
    available: true, // 사용 가능
  },
  {
    name: "런지",
    image: lungeImg,
    detailImage: lungeDetailImg,
    cardDescription:
      "런지는 다리를 내딛고 앉아 양쪽이하 하부지지를 단련하는 운동이다.",
    detailDescription:
      "런지는 한쪽 다리를 앞으로 내딛고 앉는 동작으로, 엉덩이와 허벅지 주로 단련한다. 밸런스를 덜면 효과가 좋아진다.",
    available: true, // 사용 가능
  },
  {
    name: "숄더 프레스",
    image: shoulderPressImg,
    detailImage: shoulderPressDetailImg,
    cardDescription:
      "숄더 프레스는 덤벨이나 바벨을 머리 위로 밀어 올려 삼각근 등 어깨 근육을 단련하는 운동이야.",
    detailDescription:
      "숄더 프레스는 덤벨이나 바벨을 어깨 높이에서 머리 위로 들어 올려 삼각근 등 어깨 근육을 강화하는 운동이야.",
    available: true, // 사용 가능
  },
  {
    name: "사이드 레터럴 레이즈",
    image: sideLateralRaiseImg,
    detailImage: sideLateralRaiseDetailImg,
    cardDescription:
      "팔을 양옆으로 들어 올려 어깨 옆쪽 근육(삼각근 측면)을 단련하는 운동이야.",
    detailDescription:
      "사이드 레터럴 레이즈는 덤벨을 양옆으로 들어 올려 삼각근 측면을 단련하고 어깨를 넓어 보이게 하는 운동이야.",
    available: false, // 준비 중
  },
  {
    name: "데드 리프트",
    image: deadliftImg,
    detailImage: deadliftDetailImg,
    cardDescription:
      "하체와 상체를 숙여 바벨을 잡고 바닥에서 일어나는 하체 뒷근육과 등을 단련하는 운동.",
    detailDescription:
      "데드리프트는 바벨을 바닥에서 들어 올리는 동작으로, 주로 하체와 허리 근육을 강화하는 전신 운동입니다. 바른 자세로 수행하면 근력 향상과 자세 교정에 효과적입니다.",
    available: false, // 준비 중
  },
  {
    name: "덤벨/바벨 컬",
    image: barbellCurlImg,
    detailImage: barbellCurlDetailImg,
    cardDescription: "팔꿈치를 접어 중량을 들어 이두근을 단련하는 운동",
    detailDescription:
      "덤벨/바벨 컬은 팔을 옆에 고정하고 팔꿈치를 굽혀 들어 올려 이두근을 강화하는 운동으로, 덤벨은 균형, 바벨은 고중량 자극에 효과적이다.",
    available: false, // 준비 중
  },
  {
    name: "바벨로우",
    image: barbellRowImg,
    detailImage: barbellRowDetailImg,
    cardDescription: "상체를 숙여 바벨을 끌어당기며 등을 단련하는 운동",
    detailDescription:
      "바벨로우는 바벨을 고정하고 상체를 숙인 자세에서 바벨을 몸 쪽으로 끌어당겨 광배근과 승모근을 중심으로 등을 강화하는 기본 운동이다.",
    available: false, // 준비 중
  },
  {
    name: "덤벨로우",
    image: dumbbellRowImg,
    detailImage: dumbbellRowDetailImg,
    cardDescription: "상체를 숙여 한 손으로 덤벨을 당겨 등을 단련하는 운동",
    detailDescription:
      "덤벨로우(Dumbbell Row)는 상체를 숙이고 한 손으로 덤벨을 몸 쪽으로 끌어당겨 등을 강화하는 운동으로, 광배근, 승모근, 척추기립근을 집중적으로 단련한다.",
    available: false, // 준비 중
  },
  {
    name: "프론트레이즈",
    image: frontRaiseImg,
    detailImage: frontRaiseDetailImg,
    cardDescription:
      "프론트 레이즈는 팔을 앞으로 들어 올려 어깨 전면을 단련하는 운동",
    detailDescription:
      "프론트 레이즈(Front Raise)는 덤벨이나 바벨을 양쪽으로 들어 올려 어깨 앞쪽 근육(전면 삼각근)을 강화하는 운동이다.",
    available: false, // 준비 중
  },
  {
    name: "인클라인 벤치프레스",
    image: inclineBenchPressImg,
    detailImage: inclineBenchPressDetailImg,
    cardDescription: "상체를 세운 벤치에서 가슴 윗부분을 집중 단련하는 운동",
    detailDescription:
      "인클라인 벤치프레스는 상체를 세운 벤치에 누워 바벨이나 덤벨을 들어 올려 가슴 윗부분(대흉근과 어깨 앞쪽, 전면 삼각근)을 강화하는 운동이다.",
    available: false, // 준비 중
  },
];
