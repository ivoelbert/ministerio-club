export class AudioManager {
    private audioCtx: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;

    constructor() {
        this.audioCtx = new AudioContext();

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
    }

    public async start() {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: "186c5d8e22a5fcd533fc397fc8721aa4bb45a6b8b86ec6bf5e3ef5de61dbd95e",
            },
        });

        const source = this.audioCtx.createMediaStreamSource(stream);
        source.connect(this.analyser);
    }

    public getAudioLevel = () => {
        this.analyser.getByteFrequencyData(this.dataArray);

        const sum = this.dataArray.reduce((acc, curr) => acc + curr);
        return sum / this.dataArray.length / 256;
    };
}
