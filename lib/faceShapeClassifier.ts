import { NormalizedLandmark, FaceShapeName, FaceShapeResult } from '@/lib/types';

// --- Landmark indices (MediaPipe Face Mesh) ---
const FOREHEAD_TOP = 10;
const CHIN_BOTTOM = 152;
const FOREHEAD_LEFT = 67;
const FOREHEAD_RIGHT = 297;
const CHEEKBONE_LEFT = 234;
const CHEEKBONE_RIGHT = 454;
const JAWLINE_LEFT = 172;
const JAWLINE_RIGHT = 397;

function euclidean2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

interface FaceMeasurements {
    faceLength: number;
    foreheadWidth: number;
    cheekboneWidth: number;
    jawlineWidth: number;
    lengthToWidthRatio: number;
    foreheadToJawRatio: number;
    cheekboneDominance: number;
}

function measureFace(landmarks: NormalizedLandmark[]): FaceMeasurements {
    const faceLength = euclidean2D(landmarks[FOREHEAD_TOP], landmarks[CHIN_BOTTOM]);
    const foreheadWidth = euclidean2D(landmarks[FOREHEAD_LEFT], landmarks[FOREHEAD_RIGHT]);
    const cheekboneWidth = euclidean2D(landmarks[CHEEKBONE_LEFT], landmarks[CHEEKBONE_RIGHT]);
    const jawlineWidth = euclidean2D(landmarks[JAWLINE_LEFT], landmarks[JAWLINE_RIGHT]);

    const maxWidth = Math.max(foreheadWidth, cheekboneWidth, jawlineWidth) || 0.001;

    return {
        faceLength,
        foreheadWidth,
        cheekboneWidth,
        jawlineWidth,
        lengthToWidthRatio: faceLength / maxWidth,
        foreheadToJawRatio: foreheadWidth / (jawlineWidth || 0.001),
        cheekboneDominance: cheekboneWidth / (Math.max(foreheadWidth, jawlineWidth) || 0.001),
    };
}

// --- Face shape descriptions & earring recommendations ---

const FACE_SHAPE_INFO: Record<FaceShapeName, {
    description: string;
    studTip: string;
}> = {
    oval: {
        description: 'Balanced proportions with a gently rounded jawline and slightly wider cheekbones. Considered the most versatile face shape for jewelry.',
        studTip: 'Studs enhance an oval face by sitting right at the midpoint of its balanced proportions, drawing the eye to your symmetry without competing with it.',
    },
    round: {
        description: 'Soft, curved features with nearly equal width and length. The cheekbones and face width are the most prominent features.',
        studTip: 'Studs enhance a round face by adding a defined focal point near the ear, breaking up the soft curves and giving the appearance of added structure.',
    },
    square: {
        description: 'Strong jawline with a forehead and jaw of similar width. Angular features give a structured, defined appearance.',
        studTip: 'Studs enhance a square face by introducing a small, rounded accent that softens the strong jawline and angular features without adding bulk.',
    },
    heart: {
        description: 'A wider forehead that narrows to a delicate, pointed chin. Often with high cheekbones creating a romantic silhouette.',
        studTip: 'Studs enhance a heart-shaped face by anchoring attention at ear level — the natural midpoint between the wider forehead and narrower chin — creating visual balance.',
    },
    oblong: {
        description: 'A face that is noticeably longer than it is wide, with a long straight cheek line. Elegant and elongated features.',
        studTip: 'Studs enhance an oblong face by adding width at ear level without elongating it further, helping to visually shorten and balance the face.',
    },
    diamond: {
        description: 'Dramatic cheekbones are the widest point, with a narrow forehead and jawline. Creates a striking, angular appearance.',
        studTip: 'Studs enhance a diamond face by adding fullness at ear level, complementing the wide cheekbones while softening the narrower forehead and jawline.',
    },
};

// --- Classification ---

export function classifyFaceShape(landmarks: NormalizedLandmark[]): FaceShapeResult {
    const m = measureFace(landmarks);

    let shape: FaceShapeName;
    let confidence: number;

    const isLong = m.lengthToWidthRatio > 1.35;
    const isShort = m.lengthToWidthRatio < 1.15;

    const foreheadWiderThanJaw = m.foreheadToJawRatio > 1.15;
    const foreheadJawSimilar = m.foreheadToJawRatio >= 0.9 && m.foreheadToJawRatio <= 1.15;

    const cheekbonesDominant = m.cheekboneDominance > 1.08;

    if (isShort && foreheadJawSimilar) {
        shape = 'round';
        confidence = 0.85;
    } else if (isLong && foreheadJawSimilar && !cheekbonesDominant) {
        shape = 'oblong';
        confidence = 0.80;
    } else if (!isLong && !isShort && foreheadJawSimilar && !cheekbonesDominant) {
        // Balanced length — distinguish square vs oval by jaw-to-cheekbone ratio
        const jawToCheek = m.jawlineWidth / (m.cheekboneWidth || 0.001);
        if (jawToCheek > 0.88) {
            shape = 'square';
            confidence = 0.80;
        } else {
            shape = 'oval';
            confidence = 0.85;
        }
    } else if (foreheadWiderThanJaw && !cheekbonesDominant) {
        shape = 'heart';
        confidence = 0.80;
    } else if (cheekbonesDominant && foreheadWiderThanJaw) {
        if (m.cheekboneDominance > 1.15) {
            shape = 'diamond';
            confidence = 0.75;
        } else {
            shape = 'heart';
            confidence = 0.75;
        }
    } else if (cheekbonesDominant && !foreheadWiderThanJaw) {
        shape = 'diamond';
        confidence = 0.80;
    } else {
        // Default fallback
        shape = 'oval';
        confidence = 0.65;
    }

    const info = FACE_SHAPE_INFO[shape];

    return {
        shape,
        confidence,
        description: info.description,
        studTip: info.studTip,
    };
}
