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
    recommendations: FaceShapeResult['recommendations'];
}> = {
    oval: {
        description: 'Balanced proportions with a gently rounded jawline and slightly wider cheekbones. Considered the most versatile face shape for jewelry.',
        recommendations: [
            { category: 'stud', reasoning: 'Studs complement without overpowering your balanced features.', suitability: 'excellent' },
            { category: 'drop', reasoning: 'Drop earrings enhance your natural symmetry beautifully.', suitability: 'excellent' },
            { category: 'hoop', reasoning: 'Hoops of any size work well with oval faces.', suitability: 'good' },
            { category: 'chandelier', reasoning: 'Chandelier earrings add glamour without disrupting proportions.', suitability: 'good' },
        ],
    },
    round: {
        description: 'Soft, curved features with nearly equal width and length. The cheekbones and face width are the most prominent features.',
        recommendations: [
            { category: 'drop', reasoning: 'Long drops create a lengthening effect that flatters round faces.', suitability: 'excellent' },
            { category: 'chandelier', reasoning: 'Angular chandelier designs add dimension and elongate.', suitability: 'excellent' },
            { category: 'hoop', reasoning: 'Elongated hoops complement the soft curves of a round face.', suitability: 'good' },
            { category: 'stud', reasoning: 'Small studs can make a round face appear wider.', suitability: 'avoid' },
        ],
    },
    square: {
        description: 'Strong jawline with a forehead and jaw of similar width. Angular features give a structured, defined appearance.',
        recommendations: [
            { category: 'hoop', reasoning: 'Round hoops soften angular jawline features beautifully.', suitability: 'excellent' },
            { category: 'drop', reasoning: 'Curved drop designs counterbalance the strong jaw.', suitability: 'excellent' },
            { category: 'stud', reasoning: 'Rounded studs soften the angles of a square face.', suitability: 'good' },
            { category: 'chandelier', reasoning: 'Choose curved chandelier styles to complement angular features.', suitability: 'good' },
        ],
    },
    heart: {
        description: 'A wider forehead that narrows to a delicate, pointed chin. Often with high cheekbones creating a romantic silhouette.',
        recommendations: [
            { category: 'chandelier', reasoning: 'Wider at the bottom, they balance the narrower chin perfectly.', suitability: 'excellent' },
            { category: 'drop', reasoning: 'Teardrop shapes add width at the jawline for balance.', suitability: 'excellent' },
            { category: 'stud', reasoning: 'Simple studs keep the focus at ear level, a balanced zone.', suitability: 'good' },
            { category: 'hoop', reasoning: 'Medium hoops add width near the jaw, which is flattering.', suitability: 'good' },
        ],
    },
    oblong: {
        description: 'A face that is noticeably longer than it is wide, with a long straight cheek line. Elegant and elongated features.',
        recommendations: [
            { category: 'stud', reasoning: 'Studs add width at ear level without adding length.', suitability: 'excellent' },
            { category: 'hoop', reasoning: 'Round hoops create width that balances the long face shape.', suitability: 'excellent' },
            { category: 'chandelier', reasoning: 'Short, wide chandeliers work well for adding width.', suitability: 'good' },
            { category: 'drop', reasoning: 'Long drops can make an oblong face appear even longer.', suitability: 'avoid' },
        ],
    },
    diamond: {
        description: 'Dramatic cheekbones are the widest point, with a narrow forehead and jawline. Creates a striking, angular appearance.',
        recommendations: [
            { category: 'drop', reasoning: 'Drop earrings with wider bottoms balance the narrow jawline.', suitability: 'excellent' },
            { category: 'chandelier', reasoning: 'Chandelier styles complement the dramatic cheekbone structure.', suitability: 'excellent' },
            { category: 'stud', reasoning: 'Wider studs add fullness at ear level.', suitability: 'good' },
            { category: 'hoop', reasoning: 'Hoops add width and softness to the angular features.', suitability: 'good' },
        ],
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
        recommendations: info.recommendations,
    };
}
