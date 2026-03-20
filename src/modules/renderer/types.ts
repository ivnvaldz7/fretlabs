/** Display options for the FretboardSVG component */
export interface FretboardDisplayOptions {
  /** Show string lines from nut to bridge */
  showStrings: boolean;
  /** Show fretboard fill and outline edges */
  showEdges: boolean;
}

export const DEFAULT_DISPLAY_OPTIONS: FretboardDisplayOptions = {
  showStrings: true,
  showEdges: true,
};
