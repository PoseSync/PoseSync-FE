/**
 * One Euro Filter
 * 노이즈를 줄이면서도 지연을 최소화하는 필터링 알고리즘
 */
export class LowPassFilter {
  private alpha: number;
  private y: number | null = null;

  /**
   * @param alpha 필터 계수 (기본값: 0.5)
   */
  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  /**
   * 값을 필터링하여 반환
   *
   * @param value 필터링할 값
   * @returns 필터링된 값
   */
  filter(value: number): number {
    if (this.y === null) {
      this.y = value;
      return value;
    } else {
      const s = this.alpha * value + (1 - this.alpha) * this.y;
      this.y = s;
      return s;
    }
  }

  /**
   * 필터 계수 설정
   *
   * @param alpha 새 필터 계수
   */
  setAlpha(alpha: number): void {
    this.alpha = alpha;
  }

  /**
   * 필터 상태 초기화
   */
  reset(): void {
    this.y = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;
  private lastValue: number | null = null;

  /**
   * @param minCutoff 최소 차단 주파수 (값이 작을수록 더 강한 필터링)
   * @param beta 속도에 따른 필터링 강도를 조절하는 매개변수 (값이 클수록 빠른 움직임에 더 민감)
   * @param dCutoff 미분(속도) 차단 주파수
   */
  constructor(
    minCutoff: number = 1.0,
    beta: number = 0.0,
    dCutoff: number = 1.0
  ) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  /**
   * 주어진 차단 주파수와 시간 간격으로부터 필터의 알파값 계산
   *
   * @param cutoff 차단 주파수
   * @param dt 시간 간격
   * @returns 알파 값
   */
  private computeAlpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    let te = 1.0;
    if (dt !== 0) {
      te = dt;
    }
    return 1.0 / (1.0 + tau / te);
  }

  /**
   * 값을 필터링하여 반환
   *
   * @param value 필터링할 값
   * @param timestamp 현재 타임스탬프 (기본값: 현재 시간)
   * @returns 필터링된 값
   */
  filter(value: number, timestamp?: number): number {
    // 타임스탬프 기본값 = 현재 시간
    const currentTime =
      timestamp !== undefined ? timestamp : performance.now() / 1000.0;

    // 첫 번째 값 처리
    if (this.lastTime === null) {
      this.lastValue = value;
      this.lastTime = currentTime;
      return value;
    }

    // 시간 간격 계산
    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 속도 추정 (1차 미분)
    let dx = 0;
    if (dt > 0 && this.lastValue !== null) {
      dx = (value - this.lastValue) / dt;
    }

    // 미분값 필터링
    const dxCutoff = this.dCutoff;
    this.dxFilter.setAlpha(this.computeAlpha(dxCutoff, dt));
    const dxFiltered = this.dxFilter.filter(dx);

    // 속도에 따른 차단 주파수 조정
    const cutoff = this.minCutoff + this.beta * Math.abs(dxFiltered);
    this.xFilter.setAlpha(this.computeAlpha(cutoff, dt));

    // 값 필터링 및 저장
    const filteredValue = this.xFilter.filter(value);
    this.lastValue = value;

    return filteredValue;
  }

  /**
   * 필터 상태 초기화
   */
  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
    this.lastValue = null;
  }
}
