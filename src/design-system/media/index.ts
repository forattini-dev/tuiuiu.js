/**
 * Media Components
 *
 * Components for displaying media content like ASCII art, images, and graphics.
 *
 * Color support:
 * - Named colors: 'red', 'cyan', 'magenta', etc.
 * - Hex colors: '#ff0000', '#0ff'
 * - RGB (True Color): 'rgb(255, 128, 0)' - 16.7 million colors!
 * - ANSI 256: 'ansi256(196)' - 256 colors
 */

export {
  // Picture components
  Picture,
  FramedPicture,
  ColoredPicture,

  // Pixel grid utilities
  createPixelGrid,
  createPixelGridFromColors,
  renderPixelGrid,

  // Sprite/animation utilities
  createSprite,
  getSpriteFrame,
  nextSpriteFrame,

  // Effects
  createGradientBar,
  rainbowText,
  createShadowedText,

  // Pre-made patterns
  AsciiPatterns,
  createBanner,

  // Types
  type Pixel,
  type PixelGrid,
  type ColorPalette,
  type PictureProps,
  type FramedPictureProps,
  type ColoredPictureProps,
  type PictureFit,
  type PictureAlignX,
  type PictureAlignY,
  type Sprite,
  type GradientStop,
} from './picture.js';
