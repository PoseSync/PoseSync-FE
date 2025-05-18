/**
 * One Euro Filter
 * 노이즈를 줄이면서도 지연을 최소화하는 필터링 알고리즘
 *
 * 참고: https://cristal.univ-lille.fr/~casiez/1euro/
 */

export class LowPassFilter {
  private alpha: number = 0;
  private initialized: boolean = false;
  // prevValue를 public으로 변경
  public prevValue: number = 0;

  constructor(alpha: number = 0.5) {
    this.alpha = alpha;
  }

  /**
   * 새 값 필터링
   */
  public filter(value: number): number {
    if (!this.initialized) {
      this.prevValue = value;
      this.initialized = true;
      return value;
    }

    const filteredValue =
      this.alpha * value + (1 - this.alpha) * this.prevValue;
    this.prevValue = filteredValue;
    return filteredValue;
  }

  /**
   * 알파 값 설정
   */
  public setAlpha(alpha: number): void {
    this.alpha = alpha;
  }

  /**
   * 초기화 상태 재설정
   */
  public reset(): void {
    this.initialized = false;
  }
}

export class OneEuroFilter {
  private x: LowPassFilter;
  private dx: LowPassFilter;
  private lastTime: number | null = null;

  // 필터 파라미터
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;

  /**
   * @param minCutoff - 최소 cutoff 주파수 (낮을수록 더 많은 필터링)
   * @param beta - 속도 기반 스무딩 파라미터 (높을수록 빠른 움직임에서 덜 지연됨)
   * @param dCutoff - 미분 cutoff 주파수
   */
  constructor(
    minCutoff: number = 1.0,
    beta: number = 0.0,
    dCutoff: number = 1.0
  ) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = new LowPassFilter();
    this.dx = new LowPassFilter();
  }

  /**
   * 스무딩 계수 계산
   */
  private computeAlpha(cutoff: number, deltaTime: number): number {
    // 시간 상수 계산
    const tau = 1.0 / (2 * Math.PI * cutoff);
    // 알파 값 계산
    return 1.0 / (1.0 + tau / deltaTime);
  }

  /**
   * 1-Euro 필터 적용
   */
  filter(value: number, timestamp?: number): number {
    // 타임스탬프 기본값 = 현재 시간
    const currentTime =
      timestamp !== undefined ? timestamp : performance.now() / 1000.0;

    // 첫 호출 시 초기화
    if (this.lastTime === null) {
      this.lastTime = currentTime;
      this.x.filter(value);
      return value;
    }

    // 시간 간격 계산 (초 단위)
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 너무 작은 시간 간격은 처리하지 않음
    if (deltaTime < 1e-5) {
      return this.x.prevValue;
    }

    // 미분 계산 (속도)
    const dx = (value - this.x.prevValue) / deltaTime;

    // 미분에 대한 필터링 계수 설정
    const dxAlpha = this.computeAlpha(this.dCutoff, deltaTime);
    this.dx.setAlpha(dxAlpha);

    // 미분 필터링
    const filteredDx = this.dx.filter(dx);

    // 속도에 기반한 적응형 cutoff 계산
    const cutoff = this.minCutoff + this.beta * Math.abs(filteredDx);

    // 위치에 대한 필터링 계수 설정
    const xAlpha = this.computeAlpha(cutoff, deltaTime);
    this.x.setAlpha(xAlpha);

    // 최종 필터링 결과 반환
    return this.x.filter(value);
  }

  /**
   * 필터 상태 초기화
   */
  reset(): void {
    this.x.reset();
    this.dx.reset();
    this.lastTime = null;
  }
}
