import * as THREE from "three";

export class VideoManager {
    private videoElement: HTMLVideoElement;

    constructor() {
        this.videoElement = document.createElement("video");
    }

    public async start() {
        const constraints = {
            video: {
                width: 1280,
                height: 720,
                facingMode: "user",
            },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        this.videoElement.srcObject = stream;
        this.videoElement.play();
    }

    public getTexture = () => {
        return new THREE.VideoTexture(this.videoElement);
    };
}
