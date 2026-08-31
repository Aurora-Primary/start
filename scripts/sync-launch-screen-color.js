#!/usr/bin/env node
/**
 * Reads the app's actual --background color from src/styles.css (light-mode
 * :root block) and writes it into both native surfaces that need to match it
 * before any web content has painted:
 *
 *   1. ios/App/App/Base.lproj/LaunchScreen.storyboard -- the native launch
 *      screen shown before the app process even finishes launching.
 *   2. capacitor.config.ts's `backgroundColor` -- read by
 *      CAPBridgeViewController and applied to the WKWebView (and its
 *      scrollView) before any HTML/CSS has loaded into it.
 *
 * Without both of these matching the real theme color, there's a visible
 * flash of the wrong color at one of the two handoff points, regardless of
 * what the actual app content looks like once it paints.
 *
 * Runs as part of `build:ios`, before `cap sync ios`, so both stay in sync
 * automatically on every build -- no manual step, and no risk of the two
 * drifting apart from each other.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSS_PATH = path.join(__dirname, '..', 'src', 'styles.css');
const STORYBOARD_PATH = path.join(
  __dirname, '..', 'ios', 'App', 'App', 'Base.lproj', 'LaunchScreen.storyboard'
);
const CAPACITOR_CONFIG_PATH = path.join(__dirname, '..', 'capacitor.config.ts');

function readRootBackground(cssText) {
  // Match the :root { ... } block specifically (light mode), not .dark { ... }.
  const rootMatch = cssText.match(/:root\s*{([^}]*)}/);
  if (!rootMatch) throw new Error('Could not find :root block in styles.css');
  const bgMatch = rootMatch[1].match(/--background:\s*([^;]+);/);
  if (!bgMatch) throw new Error('Could not find --background in :root block');
  return bgMatch[1].trim();
}

function parseOklch(value) {
  // oklch(L C H) or oklch(L C H / A) -- L is 0-1, C is chroma, H is degrees.
  const m = value.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/
  );
  if (!m) throw new Error(`Unrecognized color format (expected oklch()): ${value}`);
  return {
    L: parseFloat(m[1]),
    C: parseFloat(m[2]),
    H: parseFloat(m[3]),
    A: m[4] !== undefined ? parseFloat(m[4]) : 1,
  };
}

function oklchToSrgb({ L, C, H }) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gamma = (c) => {
    const clamped = Math.min(Math.max(c, 0), 1);
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return { r: gamma(rLin), g: gamma(gLin), b: gamma(bLin) };
}

function toHex({ r, g, b }) {
  const c = (v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function updateStoryboard({ r, g, b }) {
  let storyboard = fs.readFileSync(STORYBOARD_PATH, 'utf8');

  if (storyboard.includes('name="launchBackgroundColor"') && storyboard.includes('<namedColor name="launchBackgroundColor">')) {
    // Already converted on a previous run -- just update the color values in place.
    storyboard = storyboard.replace(
      /(<namedColor name="launchBackgroundColor">\s*<color red=")[\d.]+(" green=")[\d.]+(" blue=")[\d.]+("[^/]*\/>)/,
      `$1${r.toFixed(6)}$2${g.toFixed(6)}$3${b.toFixed(6)}$4`
    );
  } else {
    // First run -- convert from the original Capacitor-default systemColor
    // resource (and drop the generic Capacitor logo image reference).
    const oldColorBlock = /<systemColor name="systemBackgroundColor">[\s\S]*?<\/systemColor>/;
    const newColorBlock =
      `<namedColor name="launchBackgroundColor">\n` +
      `        <color red="${r.toFixed(6)}" green="${g.toFixed(6)}" blue="${b.toFixed(6)}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>\n` +
      `    </namedColor>`;

    if (!oldColorBlock.test(storyboard)) {
      throw new Error('Could not find systemBackgroundColor resource block to replace');
    }
    storyboard = storyboard.replace(oldColorBlock, newColorBlock);
    storyboard = storyboard.replace(
      /systemColor="systemBackgroundColor"/,
      'name="launchBackgroundColor"'
    );
    storyboard = storyboard.replace(/\s+image="Splash"/, '');
    storyboard = storyboard.replace(/\s*<image name="Splash"[^/]*\/>\n?/, '');
  }

  fs.writeFileSync(STORYBOARD_PATH, storyboard);
}

function updateCapacitorConfig(hex) {
  let config = fs.readFileSync(CAPACITOR_CONFIG_PATH, 'utf8');

  if (/backgroundColor:\s*"[^"]*"/.test(config)) {
    config = config.replace(/backgroundColor:\s*"[^"]*"/, `backgroundColor: "${hex}"`);
  } else {
    // First run -- insert it right after webDir, with an explanatory comment.
    const anchor = /(webDir:\s*"[^"]*",\n)/;
    if (!anchor.test(config)) {
      throw new Error('Could not find webDir field in capacitor.config.ts to anchor the insert');
    }
    config = config.replace(
      anchor,
      `$1  // Matches the WKWebView's own background (and its scrollView's) to the\n` +
      `  // app's real theme color, applied by CAPBridgeViewController before the\n` +
      `  // page loads. Without this, the webview defaults to its own loading\n` +
      `  // background regardless of what the launch screen or root view show,\n` +
      `  // producing a flash of the wrong color between launch screen and real\n` +
      `  // content. Kept in sync with styles.css by scripts/sync-launch-screen-color.js.\n` +
      `  backgroundColor: "${hex}",\n`
    );
  }

  fs.writeFileSync(CAPACITOR_CONFIG_PATH, config);
}

function main() {
  const cssText = fs.readFileSync(CSS_PATH, 'utf8');
  const rawBackground = readRootBackground(cssText);
  const oklch = parseOklch(rawBackground);
  const rgb = oklchToSrgb(oklch);
  const hex = toHex(rgb);

  console.log(
    `Theme color sync: --background = ${rawBackground} -> ` +
    `rgb(${(rgb.r * 255).toFixed(0)}, ${(rgb.g * 255).toFixed(0)}, ${(rgb.b * 255).toFixed(0)}) / ${hex}`
  );

  updateStoryboard(rgb);
  console.log('LaunchScreen.storyboard updated.');

  updateCapacitorConfig(hex);
  console.log('capacitor.config.ts updated.');
}

main();
