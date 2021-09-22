export class Clock {
    private time = 0;
    private previosTime = performance.now();

    public tick(scale: number) {
        const newTime = performance.now();
        const delta = newTime - this.previosTime;
        this.previosTime = newTime;

        this.time += delta * 0.01 + scale;
    }

    get elapsed() {
        return this.time;
    }
}
