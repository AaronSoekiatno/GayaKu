/**
 * Exponential Moving Average (EMA) filter for smoothing MediaPipe landmark values.
 * Eliminates frame-to-frame jitter while maintaining responsiveness.
 */
export class LandmarkSmoother {
    private prevValues: Map<string, number> = new Map();
    private alpha: number;

    /**
     * @param alpha Smoothing factor (0-1). Lower = smoother but more latent.
     *              0.35 is a good balance for face landmarks at 30-60fps.
     */
    constructor(alpha: number = 0.35) {
        this.alpha = alpha;
    }

    smooth(key: string, newValue: number): number {
        const prev = this.prevValues.get(key);
        if (prev === undefined) {
            this.prevValues.set(key, newValue);
            return newValue;
        }
        const smoothed = prev + this.alpha * (newValue - prev);
        this.prevValues.set(key, smoothed);
        return smoothed;
    }

    reset(): void {
        this.prevValues.clear();
    }
}
