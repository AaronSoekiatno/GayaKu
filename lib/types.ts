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
    scale: number;           // Size multiplier (0.5 - 2.0)
    leftOffsetX: number;     // Left earring horizontal offset
    leftOffsetY: number;     // Left earring vertical offset
    rightOffsetX: number;    // Right earring horizontal offset
    rightOffsetY: number;    // Right earring vertical offset
}

export interface Recommendation {
    selectedStyle: string;
    reasoning: string;
    confidence: number;
}
