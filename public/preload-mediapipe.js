// MediaPipe 관련 라이브러리 미리 로드
(function preloadMediaPipe() {
  console.log("MediaPipe 사전 로드 스크립트 실행...");

  // WASM 모듈 사전 로드
  const preloadUrls = [
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/vision_wasm_internal.js",
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/vision_wasm_internal.wasm",
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  ];

  // 브라우저가 미리 로드하도록 URL 등록
  if (window.fetch) {
    preloadUrls.forEach((url) => {
      try {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;
        link.as = url.endsWith(".js")
          ? "script"
          : url.endsWith(".wasm")
          ? "fetch"
          : "fetch";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
        console.log(`미리 로드: ${url}`);
      } catch (e) {
        console.warn(`미리 로드 실패: ${url}`, e);
      }
    });
  }

  // Module 객체가 이미 존재하는 경우 arguments 충돌 방지
  window.addEventListener("DOMContentLoaded", () => {
    const originalModule = window.Module;
    if (originalModule) {
      console.log("기존 Module 객체 감지됨, 충돌 방지를 위한 조치 적용");

      // Module 객체를 안전하게 초기화할 수 있도록 함수 제공
      window.safeInitModule = function (moduleConfig) {
        // 기존 Module 객체 백업
        const backupModule = Object.assign({}, window.Module);

        // Module 객체 초기화
        window.Module = moduleConfig;

        // 기존 값 중 필요한 것 복원
        if (backupModule.arguments_) {
          window.Module.arguments_ = backupModule.arguments_;
        }

        return window.Module;
      };
    }
  });
})();
