export interface EarringStyle {
    id: string;
    name: string;
    imageSrc: string;
    category: 'stud' | 'drop' | 'hoop' | 'chandelier';
    description: string;
    scale?: number; // Optional scale factor for rendering
}

export interface HeadPose {
    yaw: number;    // Horizontal rotation in radians: negative = looking left, positive = looking right
    pitch: number;  // Vertical rotation in radians: negative = looking down, positive = looking up
    roll: number;   // Tilt in radians: negative = tilting left, positive = tilting right
}

export interface FaceLandmarks {
    leftEarLobe: { x: number; y: number };   // Estimated left earlobe position (normalized 0-1)
    rightEarLobe: { x: number; y: number };  // Estimated right earlobe position (normalized 0-1)
    headPose: HeadPose;                       // Full 3-axis head rotation
    faceScale: number;                        // Inter-pupillary distance in normalized coords
    faceDepth: number;                        // Average z-depth of face center landmarks
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
