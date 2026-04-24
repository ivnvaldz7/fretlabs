/** Display options for the FretboardSVG component */
export interface FretboardDisplayOptions {
  /** Show string lines from nut to bridge */
  showStrings: boolean;
  /** Show fretboard fill and outline edges */
  showEdges: boolean;
  /** Extend fret lines to the fretboard outline edges */
  extendFrets: boolean;
  /** Show dimension annotations on the fretboard */
  showAnnotations: boolean;
}

export const DEFAULT_DISPLAY_OPTIONS: FretboardDisplayOptions = {
  showStrings: true,
  showEdges: true,
  extendFrets: false,
  showAnnotations: true,
};
