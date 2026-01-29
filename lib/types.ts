export interface EarringStyle {
    id: string;
    name: string;
    imageSrc: string;
    category: 'stud' | 'drop' | 'hoop' | 'chandelier';
    description: string;
    scale?: number; // Optional scale factor for rendering
}

export interface FaceLandmarks {
    leftEar: { x: number; y: number };
    rightEar: { x: number; y: number };
    faceYaw: number; // Horizontal rotation: negative = looking left, positive = looking right
}

export interface EarringCustomization {
    scale: number;      // Size multiplier (0.5 - 2.0)
    offsetX: number;    // Horizontal offset (-50 to 50 pixels)
    offsetY: number;    // Vertical offset (-50 to 50 pixels, positive = down toward earlobe)
}

export interface Recommendation {
    selectedStyle: string;
    reasoning: string;
    confidence: number;
}
