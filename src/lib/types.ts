/**
 * Strict Contract for Python Sidecar Output
 * Must match specs/contract.json
 */

export interface HelperSegment {
    start: number;
    end: number;
    text: string;
    speaker_id: string;
}

export type SidecarOutput =
    | { status: 'success'; segments: HelperSegment[] }
    | { status: 'error'; error_message: string };
