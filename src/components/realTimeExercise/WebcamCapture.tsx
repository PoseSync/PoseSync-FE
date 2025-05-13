import { useRef, useEffect, useState } from "react";

interface WebcamCaptureProps {
  onVideoElementReady: (videoElement: HTMLVideoElement | null) => void;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  videoElement?: HTMLVideoElement | null;
  hidden?: boolean;
}

const WebcamCapture = ({
  onVideoElementReady,
  width = 640,
  height = 480,
  children,
  videoElement: externalVideoElement,
  hidden = false,
}: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  // 외부에서 전달받은 videoElement가 있는 경우, 그것을 사용하고 카메라를 새로 초기화하지 않음
  const shouldInitCamera = !externalVideoElement;

  // 사용 가능한 카메라 장치 가져오기
  useEffect(() => {
    // 외부 비디오 요소가 제공된 경우 카메라 목록을 가져올 필요 없음
    if (externalVideoElement) {
      setCameraReady(true);
      return;
    }

    const getAvailableCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        console.log("사용 가능한 카메라 목록:", videoDevices);
        setAvailableCameras(videoDevices);

        // RGB 카메라 우선 선택 (Depth 단어가 포함되지 않은 카메라 찾기)
        const rgbCamera = videoDevices.find(
          (device) => !device.label.toLowerCase().includes("depth")
        );

        if (rgbCamera) {
          console.log("RGB 카메라 자동 선택:", rgbCamera.label);
          setSelectedCamera(rgbCamera.deviceId);
        } else if (videoDevices.length > 0) {
          console.log("첫 번째 카메라 선택:", videoDevices[0].label);
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("카메라 목록 가져오기 오류:", err);
      }
    };

    getAvailableCameras();
  }, [externalVideoElement]);

  // 카메라 선택 핸들러
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedCamera(deviceId);
    console.log("카메라 변경:", deviceId);
  };

  // 카메라 초기화 및 비디오 스트림 설정
  useEffect(() => {
    // 외부 비디오 요소가 제공된 경우 카메라 초기화를 건너뜀
    if (externalVideoElement || !shouldInitCamera) {
      if (externalVideoElement) {
        onVideoElementReady(externalVideoElement);
        setCameraReady(true);
      }
      return;
    }

    let mounted = true;
    let videoStream: MediaStream | null = null;

    // 카메라 액세스 및 비디오 스트림 얻기
    const setupCamera = async () => {
      if (!videoRef.current || !selectedCamera) return;

      // 이전 스트림 정리
      if (videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      try {
        console.log("카메라 스트림 요청 중...", selectedCamera);
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedCamera },
            width: { ideal: width },
            height: { ideal: height },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // 마운트 상태 확인
        if (!mounted || !videoRef.current) return;

        videoStream = stream;
        const videoTrack = stream.getVideoTracks()[0];
        console.log("카메라 획득:", videoTrack.label);

        // 비디오 요소에 스트림 설정
        videoRef.current.srcObject = stream;

        // 비디오 메타데이터 로드 처리
        const handleLoadedMetadata = () => {
          if (!mounted || !videoRef.current) return;

          console.log(
            "비디오 메타데이터 로드됨:",
            videoRef.current.videoWidth,
            "x",
            videoRef.current.videoHeight
          );

          videoRef.current
            .play()
            .then(() => {
              if (!mounted) return;
              console.log("비디오 재생 시작");
              setCameraReady(true);

              // 부모 컴포넌트에 비디오 요소 전달
              if (videoRef.current) {
                onVideoElementReady(videoRef.current);
              }
            })
            .catch((err) => {
              if (!mounted) return;
              console.error("비디오 재생 실패:", err);
              setError("비디오를 재생할 수 없습니다: " + err.message);
            });
        };

        // 이벤트 리스너 등록
        videoRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );

        // 이미 메타데이터가 로드된 경우
        if (videoRef.current.readyState >= 2) {
          handleLoadedMetadata();
        }

        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener(
              "loadedmetadata",
              handleLoadedMetadata
            );
          }
        };
      } catch (err) {
        if (!mounted) return;

        console.error("카메라 액세스 오류:", err);
        setError("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
      }
    };

    if (selectedCamera) {
      setupCamera();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      mounted = false;

      // 비디오 스트림 정리
      if (videoStream) {
        videoStream.getTracks().forEach((track) => {
          track.stop();
          console.log("카메라 트랙 정지:", track.label);
        });
      }

      // 외부 비디오 요소가 없을 경우에만 부모 컴포넌트에 null 전달
      if (!externalVideoElement) {
        onVideoElementReady(null);
      }
    };
  }, [
    width,
    height,
    onVideoElementReady,
    selectedCamera,
    externalVideoElement,
    shouldInitCamera,
  ]);

  // 외부 비디오 요소가 있는 경우 해당 요소를 렌더링
  if (externalVideoElement) {
    return (
      <div className="relative w-full h-full">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 rounded z-10">
            {error}
          </div>
        )}

        {/* 비디오 요소 크기 조절을 위한 컨테이너 */}
        <div className="w-full h-full">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {availableCameras.length > 1 && (
        <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 p-1 rounded">
          <select
            value={selectedCamera || ""}
            onChange={handleCameraChange}
            className="text-xs bg-transparent text-white border border-gray-600 rounded px-1 py-0.5"
          >
            {availableCameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `카메라 ${camera.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 rounded z-10">
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        width={width}
        height={height}
        className={`w-full h-full object-cover rounded-lg ${
          hidden ? "hidden" : ""
        }`}
        style={{ transform: "scaleX(-1)" }} // 인라인 스타일로 거울 모드 적용
        autoPlay
        playsInline
        muted
      />

      {cameraReady && children}
    </div>
  );
};

export default WebcamCapture;
