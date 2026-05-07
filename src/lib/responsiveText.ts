// @chenglou/pretext responsive text — stubbed in SPA build.
export const responsiveText = null;

export const DEFAULT_RESPONSIVE_TEXT_FONT_FAMILY =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

export interface ResponsiveTextMetrics {
  heightPx: number;
  lineCount: number;
}

export function prepareResponsiveText(
  _text: string,
  _opts: {
    fontFamily?: string;
    fontSizePx: number;
    fontWeight?: number | string;
    letterSpacingPx?: number;
    lineHeightPx: number;
    whiteSpace?: "normal" | "pre-wrap";
  }
): (maxWidthPx: number) => ResponsiveTextMetrics {
  return (_maxWidthPx: number) => ({ heightPx: 24, lineCount: 1 });
}
