import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { AudioManager } from "./audio";
import { Clock } from "./clock";
import { FalopaShader } from "./falopaShader";
import { VideoManager } from "./video";

export class Lucio {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private faloPass: ShaderPass;
    private clock: Clock;
    private audio: AudioManager;
    private video: VideoManager;

    private distortionFactor: OscillatingValue;
    private rotationFactor: OscillatingValue;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.z = 1;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2b2b2b);

        this.video = new VideoManager();

        const quadGeometry = new THREE.PlaneGeometry(2, 1);
        const quadMaterial = new THREE.MeshBasicMaterial({
            map: this.video.getTexture(),
        });
        const quad = new THREE.Mesh(quadGeometry, quadMaterial);
        this.scene.add(quad);

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.faloPass = new ShaderPass(FalopaShader);
        this.composer.addPass(this.faloPass);

        this.clock = new Clock();
        this.audio = new AudioManager();

        this.distortionFactor = new OscillatingValue(0.0, 0.2, 2000, 0);
        this.rotationFactor = new OscillatingValue(0.0, 0.2, 2000, Math.PI * 0.5);
    }

    public start = () => {
        this.audio.start();
        this.video.start();
        this.resize();
        window.addEventListener("resize", this.resize);

        this.renderer.setAnimationLoop(this.render);
    };

    public dispose = () => {
        window.removeEventListener("resize", this.resize);
    };

    get domElement() {
        return this.renderer.domElement;
    }

    private resize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    private render = () => {
        const timeScale = 0.002;
        const audioLevel = this.audio.getAudioLevel() * 5;
        this.clock.tick(audioLevel);

        const time = this.clock.elapsed;

        this.faloPass.uniforms["time"].value = time * timeScale;

        this.faloPass.uniforms["distortionScale"].value =
            this.distortionFactor.getValue(time) * audioLevel;

        this.faloPass.uniforms["distortionFrequency"].value = 5 * audioLevel;

        this.faloPass.uniforms["tintFactor"].value = audioLevel * 0.5;

        this.faloPass.uniforms["rotationFactor"].value =
            audioLevel * this.rotationFactor.getValue(time);

        this.composer.render();
    };
}

class OscillatingValue {
    constructor(
        private min: number,
        private max: number,
        private period: number,
        private phase: number
    ) {}

    getValue = (time: number) => {
        const currentPlace = Math.sin(time / this.period + this.phase) * 0.5 + 0.5;
        return THREE.MathUtils.lerp(this.min, this.max, currentPlace);
    };
}
