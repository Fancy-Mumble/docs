/**
 * Fetch SVGs from the public PlantUML server and write them to
 * public/diagrams/ so they can be committed and served as static
 * files without any build-time network dependency.
 *
 * Run once (or whenever a diagram changes):
 *   node scripts/generate-diagrams.mjs
 */

import { deflateRawSync } from 'node:zlib';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/diagrams');

// PlantUML's custom base-64 alphabet
const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function plantumlEncode(source) {
  const buf = deflateRawSync(Buffer.from(source.trim(), 'utf8'), { level: 9 });
  let out = '';
  for (let i = 0; i < buf.length; i += 3) {
    const b0 = buf[i];
    const b1 = i + 1 < buf.length ? buf[i + 1] : 0;
    const b2 = i + 2 < buf.length ? buf[i + 2] : 0;
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0x3) << 4) | (b1 >> 4)];
    out += ALPHABET[((b1 & 0xf) << 2) | (b2 >> 6)];
    out += ALPHABET[b2 & 0x3f];
  }
  return out;
}

// ------------------------------------------------------------------ //
// Diagram definitions
//
// IMPORTANT: use \\n (JS escape → literal \n in the string) wherever
// you need a line-break inside a PlantUML quoted label.  A real
// newline inside quotes is a PlantUML syntax error.
// ------------------------------------------------------------------ //

/**
 * Maximum rendered width in pixels for every diagram.
 * PlantUML's `scale max N width` directive caps the output size at
 * generation time so the SVG viewBox is already correct.
 */
const MAX_WIDTH_PX = 720;

// Theme file is the single source of truth for colors and style.
// Its content is inlined into every diagram sent to the PlantUML server
// (the server cannot access local files, so !theme from path won't work).
const THEME = readFileSync(join(__dirname, '../tools/puml-theme-fancy.puml'), 'utf8').trim();

// CSS companion: font override + dark-mode palette swaps.
// Loaded from one file so both pipelines stay in sync.
const _svgCss = readFileSync(join(__dirname, '../tools/puml-theme-fancy-svg.css'), 'utf8');
const SVG_STYLE = `<style>\n${_svgCss}</style>`;

/** Injected at the top of every diagram source (after @startuml). */
const PREAMBLE = `scale max ${MAX_WIDTH_PX} width
${THEME}`;

/** Inject PREAMBLE right after the opening @startuml line. */
function withPreamble(source) {
  return source.replace(/(@startuml[^\n]*)/, `$1\n${PREAMBLE}`);
}

const DIAGRAMS = {
  'arch-overview': `
@startuml
left to right direction

component "Fancy Mumble App" as App
component "Fancy Mumble Server" as Server
cloud "Push Service\\n(FCM, optional)" as Push

App -[#5e35b1]-> Server : TCP/UDP 64738  voice & control
App -[#5e35b1]-> Server : TCP 64739  file uploads
App -[#5e35b1]-> Server : UDP 10000  screen sharing
Server -[#5e35b1]-> Push : HTTPS 443
@enduml`,

  'file-server-tls': `
@startuml
left to right direction

actor "Mumble Client" as App
actor "Browser" as Web
node "Reverse Proxy (optional)\\nnginx, Traefik, Caddy, ..." as RP #fff8e1
node "File Server\\nport 64739, plain HTTP" as FS

App -[#5e35b1]-> RP : HTTPS 443
Web -[#5e35b1]-> RP : HTTPS 443
RP -[#5e35b1]-> FS : HTTP 64739\\n(behind proxy)

App .[#9e9e9e].> FS : HTTP 64739\\n(direct, LAN only)
Web .[#9e9e9e].> FS : HTTP 64739\\n(direct, LAN only)

note bottom of FS
  No built-in TLS.
  Skip the proxy only on
  a trusted private network.
end note
@enduml`,

  'port-flow': `
@startuml
left to right direction

actor "Mumble Client" as C
actor "Browser" as Web
node "Reverse Proxy (optional)\\nnginx, Traefik, Caddy, ..." as RP #fff8e1

node "Server" {
  [TCP/UDP 64738\\nVoice & Control] as P1
  [TCP 64739\\nFile Server (HTTP)] as P2
  [UDP 10000\\nScreen-share Relay] as P3
  [TCP 6502\\nAdmin RPC] as P4
}

C -[#5e35b1]-> P1 : always required
C -[#5e35b1]-> P3 : screen sharing
C -[#9e9e9e]-> P4 : admin tools only

C -[#5e35b1]-> RP : HTTPS 443
Web -[#5e35b1]-> RP : HTTPS 443
RP -[#5e35b1]-> P2 : HTTP 64739

C .[#9e9e9e].> P2 : HTTP 64739\\n(direct, LAN only)
Web .[#9e9e9e].> P2 : HTTP 64739\\n(direct, LAN only)

note right of P4
  loopback only
  by default
end note
@enduml`,

  'connect-states': `
@startuml
hide empty description

[*] --> Idle
Idle --> Connecting : connect
Connecting --> Bootstrapping : handshake complete
Bootstrapping --> Connected : channels & users loaded
Connected --> [*] : disconnect
@enduml`,
};

// ------------------------------------------------------------------ //

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, source] of Object.entries(DIAGRAMS)) {
  const encoded = plantumlEncode(withPreamble(source));
  const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
  process.stdout.write(`Fetching ${name} … `);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED (HTTP ${res.status})`);
    process.exit(1);
  }

  let svg = await res.text();

  // Inject font + dark-mode CSS immediately after the opening <svg> tag.
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1\n${SVG_STYLE}`);
  // PlantUML hardcodes rx="4" for component diagrams regardless of roundcorner;
  // rewrite to match the hand-written SVG style.
  svg = svg.replace(/\brx="4" ry="4"/g, 'rx="8" ry="8"');

  // Detect a PlantUML error SVG (contains "Syntax Error" or "error" title)
  if (/Syntax Error|<title>Error/i.test(svg)) {
    console.error('FAILED (PlantUML reported a syntax error in the diagram)');
    console.error(svg.slice(0, 800));
    process.exit(1);
  }

  // Strip XML declaration and DOCTYPE - safe to inline or serve directly
  svg = svg
    .replace(/<\?xml[\s\S]*?\?>\s*/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/g, '');

  // Rewrite the root <svg> element:
  //  1. Strip all fixed dimensions and inline styles - viewBox alone drives
  //     the aspect ratio.  width="100%" + height auto (from CSS on the
  //     container) makes the SVG scale proportionally in both axes.
  //  2. Remove preserveAspectRatio="none" (PlantUML default) which distorts
  //     content when the element is resized.
  svg = svg.replace(/<svg\b([^>]*)>/, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s+width="[^"]*"/g, '')
      .replace(/\s+height="[^"]*"/g, '')
      .replace(/\s+style="[^"]*"/g, '')
      .replace(/\s+preserveAspectRatio="[^"]*"/g, '');
    return `<svg${cleaned} width="100%" style="max-width:${MAX_WIDTH_PX}px;height:auto;">`;
  });
  // Replace every baked-in font-family attribute with the system font stack.
  svg = svg.replace(/\bfont-family="[^"]*"/g,
    `font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"`);

  const outPath = join(OUT_DIR, `${name}.svg`);
  writeFileSync(outPath, svg, 'utf8');
  console.log(`saved → public/diagrams/${name}.svg`);
}

console.log('Done.');
