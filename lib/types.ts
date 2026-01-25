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
    faceRotation?: number;
}

export interface Recommendation {
    selectedStyle: string;
    reasoning: string;
    confidence: number;
}
