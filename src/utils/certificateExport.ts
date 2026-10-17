import { Student, InstituteProfile, CertificateRecord } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface CertificateExportOptions {
  startDate: string;
  endDate: string;
  courseName: string;
  qrDataUrl?: string;
  verificationUrl?: string;
  sealDataUrl?: string;
}

// SVG string for the official seal
export const OFFICIAL_SEAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <path id="top-arc-seal" d="M 45,200 A 155,155 0 0,1 355,200" fill="none" />
    <path id="bottom-arc-seal" d="M 355,200 A 155,155 0 0,1 45,200" fill="none" />
  </defs>
  <circle cx="200" cy="200" r="196" fill="#ffffff" />
  <circle cx="200" cy="200" r="192" fill="none" stroke="#0a215c" stroke-width="7" />
  <circle cx="200" cy="200" r="183" fill="none" stroke="#0a215c" stroke-width="2.5" />
  <circle cx="200" cy="200" r="132" fill="none" stroke="#0a215c" stroke-width="3.5" />
  <text fill="#0a215c" font-family="'Arial Black', 'Montserrat', Arial, sans-serif" font-weight="900" font-size="25.5" letter-spacing="3.8">
    <textPath href="#top-arc-seal" startOffset="50%" text-anchor="middle">
      CORTEXX AI INSTITUTE
    </textPath>
  </text>
  <polygon points="56,200 60,208 69,209 62,216 64,225 56,220 48,225 50,216 43,209 52,208" fill="#0a215c" />
  <polygon points="344,200 348,208 357,209 350,216 352,225 344,220 336,225 338,216 331,209 340,208" fill="#0a215c" />
  <text fill="#0a215c" font-family="'Arial Black', 'Montserrat', Arial, sans-serif" font-weight="900" font-size="14.8" letter-spacing="2.8">
    <textPath href="#bottom-arc-seal" startOffset="50%" text-anchor="middle">
      WHERE THINKING MEETS TECHNOLOGY
    </textPath>
  </text>
  <g transform="translate(200, 160) scale(1.15)">
    <path d="M -2,-52 C -20,-52 -45,-38 -45,-12 C -45,2 -35,12 -42,24 C -48,34 -38,50 -20,52 C -10,53 -4,50 -2,48 Z" 
          fill="#ffffff" stroke="#0a215c" stroke-width="3.2" stroke-linejoin="round" />
    <path d="M -8,-40 C -18,-38 -32,-32 -28,-18 C -26,-10 -15,-10 -18,2" fill="none" stroke="#0a215c" stroke-width="2.6" stroke-linecap="round" />
    <path d="M -6,-24 L -18,-18 L -14,-4" fill="none" stroke="#0a215c" stroke-width="2.4" stroke-linecap="round" />
    <path d="M -35,-8 L -24,4 L -26,18 L -10,18" fill="none" stroke="#0a215c" stroke-width="2.6" stroke-linecap="round" />
    <path d="M -30,22 L -20,28 L -18,40" fill="none" stroke="#0a215c" stroke-width="2.4" stroke-linecap="round" />
    <path d="M -8,10 L -4,32" fill="none" stroke="#0a215c" stroke-width="2.4" stroke-linecap="round" />
    <circle cx="-28" cy="-18" r="3" fill="#0a215c" />
    <circle cx="-18" cy="2" r="3" fill="#0a215c" />
    <circle cx="-35" cy="-8" r="2.8" fill="#0a215c" />
    <circle cx="-10" cy="18" r="3" fill="#0a215c" />
    <circle cx="-30" cy="22" r="2.8" fill="#0a215c" />
    <circle cx="-18" cy="40" r="3" fill="#0a215c" />
    <path d="M 2,-52 C 20,-52 45,-38 45,-12 C 45,2 35,12 42,24 C 48,34 38,50 20,52 C 10,53 4,50 2,48 Z" 
          fill="#0a215c" stroke="#0a215c" stroke-width="3.2" stroke-linejoin="round" />
    <path d="M 8,-40 C 18,-38 32,-32 28,-18 C 26,-10 15,-10 18,2" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" />
    <path d="M 6,-24 L 18,-18 L 14,-4" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 35,-8 L 24,4 L 26,18 L 10,18" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" />
    <path d="M 30,22 L 20,28 L 18,40" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 8,10 L 4,32" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
    <circle cx="28" cy="-18" r="2.8" fill="#ffffff" />
    <circle cx="18" cy="2" r="2.8" fill="#ffffff" />
    <circle cx="35" cy="-8" r="2.5" fill="#ffffff" />
    <circle cx="10" cy="18" r="2.8" fill="#ffffff" />
    <circle cx="30" cy="22" r="2.5" fill="#ffffff" />
    <circle cx="18" cy="40" r="2.8" fill="#ffffff" />
    <line x1="0" y1="-50" x2="0" y2="48" stroke="#0a215c" stroke-width="3" />
  </g>
  <text x="200" y="254" text-anchor="middle" font-family="'Century Gothic', 'Montserrat', Arial, sans-serif" font-weight="900" font-size="28" fill="#0a215c" letter-spacing="1">
    Cortexx AI
  </text>
  <g transform="translate(200, 268)">
    <line x1="-70" y1="0" x2="-10" y2="0" stroke="#0a215c" stroke-width="2.2" stroke-linecap="round" />
    <polygon points="0,-4 4,0 0,4 -4,0" fill="#0a215c" />
    <line x1="10" y1="0" x2="70" y2="0" stroke="#0a215c" stroke-width="2.2" stroke-linecap="round" />
  </g>
</svg>`;

// SVG string for the authentic Cortexx AI top-left logo with dual-brain icon
export const CORTEXX_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" width="420" height="100" fill="none">
  <defs>
    <linearGradient id="cortexxOrangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFAA00" />
      <stop offset="50%" stop-color="#FF6A00" />
      <stop offset="100%" stop-color="#DD3B00" />
    </linearGradient>
    <linearGradient id="cortexxDarkCircuit" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <filter id="cortexxGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dual Brain Icon -->
  <g transform="translate(10, 6) scale(0.88)">
    <circle cx="50" cy="50" r="38" fill="url(#cortexxOrangeGlow)" opacity="0.22" filter="url(#cortexxGlowEffect)" />
    <!-- Left Brain Hemisphere Orange -->
    <path d="M 48 18 C 36 18 20 28 20 44 C 20 54 26 62 26 70 C 26 78 36 84 48 84 Z" fill="url(#cortexxOrangeGlow)" stroke="#ea580c" stroke-width="1.2" />
    <path d="M 48 26 L 36 26 L 30 32 L 25 32" stroke="#FFF7ED" stroke-width="2" stroke-linecap="round" />
    <path d="M 48 38 L 38 38 L 32 44 L 23 44" stroke="#FFF7ED" stroke-width="2" stroke-linecap="round" />
    <path d="M 48 50 L 32 50 L 28 56 L 24 64" stroke="#FFF7ED" stroke-width="2" stroke-linecap="round" />
    <path d="M 48 62 L 38 62 L 32 68 L 30 76" stroke="#FFF7ED" stroke-width="2" stroke-linecap="round" />
    <path d="M 48 74 L 40 74 L 38 78" stroke="#FFF7ED" stroke-width="2" stroke-linecap="round" />
    <circle cx="25" cy="32" r="2.5" fill="#FFFFFF" />
    <circle cx="23" cy="44" r="2.5" fill="#FFFFFF" />
    <circle cx="24" cy="64" r="2.5" fill="#FFFFFF" />
    <circle cx="30" cy="76" r="2.5" fill="#FFFFFF" />
    <circle cx="35" cy="50" r="2" fill="#FFE082" />

    <!-- Right Brain Hemisphere Navy -->
    <path d="M 52 18 C 64 18 80 28 80 44 C 80 54 74 62 74 70 C 74 78 64 84 52 84 Z" fill="url(#cortexxDarkCircuit)" stroke="#0f172a" stroke-width="1.2" />
    <path d="M 52 26 L 64 26 L 70 32 L 75 32" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" opacity="0.9" />
    <path d="M 52 38 L 62 38 L 68 44 L 77 44" stroke="#fb923c" stroke-width="1.8" stroke-linecap="round" opacity="0.95" />
    <path d="M 52 50 L 68 50 L 72 56 L 76 64" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" opacity="0.9" />
    <path d="M 52 62 L 62 62 L 68 68 L 70 76" stroke="#fb923c" stroke-width="1.8" stroke-linecap="round" opacity="0.95" />
    <path d="M 52 74 L 60 74 L 62 78" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round" opacity="0.9" />
    <circle cx="75" cy="32" r="2.2" fill="#f8fafc" />
    <circle cx="77" cy="44" r="2.5" fill="#FF8800" />
    <circle cx="76" cy="64" r="2.2" fill="#f8fafc" />
    <circle cx="70" cy="76" r="2.2" fill="#FF8800" />

    <line x1="50" y1="18" x2="50" y2="84" stroke="#FFAA00" stroke-width="2.5" stroke-dasharray="3 2" />
    <circle cx="50" cy="50" r="3" fill="#FF6A00" />
  </g>

  <!-- Typography: Pure Bold Black + Orange Accent -->
  <text x="110" y="52" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="36" fill="#000000" letter-spacing="-0.5">
    Cortexx <tspan fill="#ea580c">AI</tspan>
  </text>
  <text x="112" y="74" font-family="Arial, sans-serif" font-weight="800" font-size="11.5" fill="#1e293b" letter-spacing="2">
    WHERE THINKING MEETS TECHNOLOGY
  </text>
</svg>`;

let cachedSealDataUrl: string | null = null;
let cachedLogoDataUrl: string | null = null;

/**
 * Converts the official seal SVG into a high-res raster PNG data URL.
 */
export async function getOfficialSealPngDataUrl(size = 400): Promise<string> {
  if (cachedSealDataUrl) return cachedSealDataUrl;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([OFFICIAL_SEAL_SVG], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          cachedSealDataUrl = canvas.toDataURL('image/png');
          resolve(cachedSealDataUrl);
        } else {
          resolve('');
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
}

/**
 * Converts the Cortexx AI Logo SVG into a high-res raster PNG data URL.
 */
export async function getCortexxLogoPngDataUrl(width = 600, height = 143): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([CORTEXX_LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          cachedLogoDataUrl = canvas.toDataURL('image/png');
          resolve(cachedLogoDataUrl);
        } else {
          resolve('');
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
}

/**
 * Utility: Converts modern CSS color functions like "oklch(...)" into standard hex/rgba.
 */
let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

export function convertOklchToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) {
    return str;
  }
  return str.replace(/oklch\([^)]+\)/g, (match) => {
    try {
      if (!helperCanvas) {
        helperCanvas = document.createElement('canvas');
        helperCanvas.width = 1;
        helperCanvas.height = 1;
        helperCtx = helperCanvas.getContext('2d');
      }
      if (helperCtx) {
        helperCtx.fillStyle = '#000000';
        helperCtx.fillStyle = match;
        const res = helperCtx.fillStyle;
        if (res && !res.includes('oklch')) {
          return res;
        }
      }
    } catch {
      // fallback
    }
    return '#111827';
  });
}

/**
 * Generates and downloads a Professional Course Completion Certificate
 * as a genuine Microsoft Word (.doc) document in Landscape orientation.
 */
export function downloadCertificateAsDoc(
  student: Student,
  certRecord: CertificateRecord,
  options: CertificateExportOptions,
  profile: InstituteProfile = INSTITUTE_PROFILE
): void {
  const verifyUrl = options.verificationUrl || `https://cortexxai-app.vercel.app/?verify=${certRecord.verificationCode}`;
  const qrImgTag = options.qrDataUrl 
    ? `<img src="${options.qrDataUrl}" width="75" height="75" style="border: 2px solid #b45309; padding: 2px; background: #fff;" />` 
    : `<div style="width:75px; height:75px; border:1px dashed #b45309; font-size:8pt; text-align:center; padding-top:25px;">QR CODE</div>`;

  const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <meta charset="utf-8">
  <title>Certificate - ${student.name} (${certRecord.id})</title>
  <style>
    @page Section1 {
      size: 841.9pt 595.3pt; /* A4 Landscape */
      margin: 20pt 20pt 20pt 20pt;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #111827;
      background-color: #fdfbf7;
      margin: 0;
      padding: 0;
    }
    .certificate-border {
      border: 6px double #b45309;
      padding: 24pt 36pt;
      text-align: center;
      background-color: #ffffff;
      height: 490pt;
      position: relative;
    }
    .top-header-table {
      width: 100%;
      margin-bottom: 10pt;
    }
    .left-corner-heading {
      font-size: 16pt;
      font-weight: 900;
      color: #000000;
      font-family: 'Arial Black', Arial, sans-serif;
      letter-spacing: 0.5px;
    }
    .left-corner-tagline {
      font-size: 8pt;
      font-weight: bold;
      color: #1e293b;
      font-family: Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .institute-title {
      font-size: 22pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 2px;
      margin-bottom: 2px;
      font-family: 'Arial Black', Arial, sans-serif;
      text-transform: uppercase;
    }
    .institute-tagline {
      font-size: 9.5pt;
      color: #b45309;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 14px;
      font-family: Arial, sans-serif;
      font-weight: bold;
    }
    .cert-title {
      font-size: 26pt;
      font-weight: bold;
      color: #9a3412;
      letter-spacing: 2px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .cert-subtitle {
      font-size: 11pt;
      color: #4b5563;
      margin-bottom: 18px;
      font-family: Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .student-name {
      font-size: 28pt;
      font-weight: bold;
      color: #0f172a;
      border-bottom: 2px solid #b45309;
      display: inline-block;
      padding-bottom: 6px;
      margin-bottom: 14px;
      font-family: 'Georgia', serif;
    }
    .cert-body {
      font-size: 12pt;
      color: #374151;
      line-height: 1.5;
      margin-bottom: 18px;
      max-width: 600pt;
      margin-left: auto;
      margin-right: auto;
    }
    .course-highlight {
      font-size: 16pt;
      font-weight: bold;
      color: #c2410c;
      margin: 6px 0;
    }
    .footer-table {
      width: 100%;
      margin-top: 20pt;
    }
    .footer-cell {
      width: 20%;
      text-align: center;
      vertical-align: bottom;
      font-family: Arial, sans-serif;
    }
    .signature-line {
      border-top: 1.5px solid #000000;
      width: 120pt;
      margin: 6pt auto 4pt auto;
    }
    .sign-label {
      font-size: 9pt;
      font-weight: bold;
      color: #000000;
    }
    .date-val {
      font-size: 11pt;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #000000;
      margin-bottom: 2pt;
    }
    .official-seal-box {
      width: 80pt;
      height: 80pt;
      margin: 0 auto;
      text-align: center;
    }
  </style>
</head>
<body>
<div class="Section1">
  <div class="certificate-border">
    <!-- Top Header: Bold Dark Black Left Corner Heading & RHS QR Code -->
    <table class="top-header-table">
      <tr>
        <td style="text-align: left; vertical-align: top;">
          <div class="left-corner-heading">
            ⚡ CORTEXX AI
          </div>
          <div class="left-corner-tagline">
            Where Thinking Meets Technology
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div>${qrImgTag}</div>
          <div style="font-size: 7.5pt; color: #b45309; font-weight: bold; margin-top: 2px;">SCAN TO VERIFY</div>
        </td>
      </tr>
    </table>

    <!-- Institute Title: Fixed to CORTEXX AI INSTITUTE -->
    <div class="institute-title">${profile.name}</div>
    <div class="institute-tagline">Where Thinking Meets Technology</div>

    <!-- Title -->
    <div class="cert-title">Certificate of Completion</div>
    <div class="cert-subtitle">This is proudly presented to</div>

    <!-- Student Name -->
    <div>
      <span class="student-name">${student.name}</span>
    </div>

    <!-- Body -->
    <div class="cert-body">
      has successfully completed the professional curriculum for the
      <div class="course-highlight">${options.courseName}</div>
      <div style="font-size: 10pt; color: #6b7280; margin-top: 2px;">Duration: ${options.startDate} to ${options.endDate}</div>
      <p style="margin-top: 8px; font-size: 11pt;">
        at ${profile.name}, demonstrating exceptional understanding of core concepts, practical skills, and successful project application in Artificial Intelligence & Technology.
      </p>
    </div>

    <!-- Footer: Date LHS, 3 Signatures, and Centered Official Seal with Clean Spacing -->
    <table class="footer-table">
      <tr>
        <!-- Date & ID -->
        <td class="footer-cell" style="text-align: left;">
          <div class="date-val">${certRecord.issueDate}</div>
          <div class="signature-line" style="width: 100pt; margin-left: 0;"></div>
          <div class="sign-label">Date of Issue</div>
          <div style="font-size: 8pt; color: #111827; margin-top: 2px; font-family: monospace; font-weight: bold;">ID: ${certRecord.id}</div>
        </td>

        <!-- 1st Signatory: Keval Gajjar -->
        <td class="footer-cell">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 16pt; color: #000000; font-weight: bold; margin-bottom: 0;">Keval Gajjar</div>
          <div class="signature-line"></div>
          <div class="sign-label">Keval Gajjar</div>
          <div style="font-size: 8pt; color: #374151; font-weight: bold;">Founder & CEO</div>
        </td>

        <!-- Centered Attached Official Seal -->
        <td class="footer-cell">
          <div class="official-seal-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="80" height="80">
              <circle cx="100" cy="100" r="96" fill="#ffffff" stroke="#0a215c" stroke-width="4" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#0a215c" stroke-width="1.5" />
              <circle cx="100" cy="100" r="68" fill="none" stroke="#0a215c" stroke-width="2" />
              <text x="100" y="38" text-anchor="middle" fill="#0a215c" font-size="9" font-weight="900" font-family="Arial">CORTEXX AI INSTITUTE</text>
              <text x="100" y="172" text-anchor="middle" fill="#0a215c" font-size="6" font-weight="900" font-family="Arial">WHERE THINKING MEETS TECHNOLOGY</text>
              <text x="100" y="105" text-anchor="middle" fill="#0a215c" font-size="24">🧠</text>
              <text x="100" y="128" text-anchor="middle" fill="#0a215c" font-size="11" font-weight="bold" font-family="Arial">Cortexx AI</text>
            </svg>
          </div>
        </td>

        <!-- 2nd Signatory: Hiren Raval -->
        <td class="footer-cell">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 16pt; color: #000000; font-weight: bold; margin-bottom: 0;">Hiren Raval</div>
          <div class="signature-line"></div>
          <div class="sign-label">Hiren Raval</div>
          <div style="font-size: 8pt; color: #374151; font-weight: bold;">Head of AI Engineering</div>
        </td>

        <!-- 3rd Signatory: Shweta Malaviya -->
        <td class="footer-cell" style="text-align: right;">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 16pt; color: #000000; font-weight: bold; margin-bottom: 0;">Shweta Malaviya</div>
          <div class="signature-line" style="margin-right: 0;"></div>
          <div class="sign-label">Shweta Malaviya</div>
          <div style="font-size: 8pt; color: #374151; font-weight: bold;">Academic Director</div>
        </td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + docContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificate_${certRecord.id}_${student.name.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a certificate element as a high-resolution PDF document in landscape orientation.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  studentName: string,
  certId: string
): Promise<void> {
  await downloadCertificateDirectlyAsPdf({
    id: certId,
    studentId: 'st',
    studentName,
    courseName: 'Practical AI Master Course',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    verificationCode: 'COR-VERIFY-DIRECT',
    createdAt: new Date().toISOString(),
  });
}

/**
 * Directly downloads any certificate as a pristine, high-resolution vector PDF.
 * Generates exact typography, perfect decorative underlines, and signature positioning
 * with ZERO lines striking through text or dates.
 */
export async function downloadCertificateDirectlyAsPdf(
  cert: CertificateRecord,
  student?: Student
): Promise<void> {
  const studentName = student?.name || cert.studentName;
  const verifyUrl = `https://cortexxai-app.vercel.app/?verify=${cert.verificationCode}`;

  // 1. Generate QR code
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });
  } catch {
    qrDataUrl = '';
  }

  // 2. Fetch official seal PNG and authentic Cortexx logo PNG
  const [sealPng, logoPng] = await Promise.all([
    getOfficialSealPngDataUrl(400),
    getCortexxLogoPngDataUrl(600, 143),
  ]);

  // 3. Render pixel-perfect vector PDF
  generateDirectVectorPdf(cert, studentName, qrDataUrl, sealPng, logoPng);
}

/**
 * Master Vector PDF Generator with mathematical layout precision:
 * - Student Name underline is placed comfortably below descenders (no strikethrough).
 * - Date and all 3 signatures sit cleanly ABOVE the horizontal line.
 * - Printed names and titles sit comfortably BELOW the horizontal line.
 * - Center Official Seal is scaled and centered.
 * - Top Left renders the authentic Cortexx dual-brain circuit logo.
 */
function generateDirectVectorPdf(
  cert: CertificateRecord,
  studentName: string,
  qrDataUrl: string,
  sealPngDataUrl: string,
  logoPngDataUrl?: string
): void {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 1. Certificate Ivory Outer Background
  pdf.setFillColor(253, 251, 247);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Double Decorative Border
  pdf.setDrawColor(180, 83, 9); // Amber 700
  pdf.setLineWidth(5);
  pdf.rect(22, 22, pageWidth - 44, pageHeight - 44);
  pdf.setLineWidth(1.5);
  pdf.rect(28, 28, pageWidth - 56, pageHeight - 56);

  // 3. Inner Clean Canvas Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(32, 32, pageWidth - 64, pageHeight - 64, 'F');

  // 4. Top Left Header: Official Cortexx Logo PNG
  if (logoPngDataUrl) {
    try {
      pdf.addImage(logoPngDataUrl, 'PNG', 46, 40, 168, 40);
    } catch {
      renderFallbackLogoText(pdf, 46, 58);
    }
  } else {
    renderFallbackLogoText(pdf, 46, 58);
  }

  // 5. Top Right: Verification QR Code
  if (qrDataUrl) {
    try {
      pdf.setDrawColor(180, 83, 9);
      pdf.setLineWidth(1.5);
      pdf.rect(pageWidth - 110, 38, 62, 62);
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - 109, 39, 60, 60);

      pdf.setFontSize(7);
      pdf.setTextColor(180, 83, 9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCAN TO VERIFY', pageWidth - 79, 110, { align: 'center' });
    } catch {
      // ignore
    }
  }

  // 6. Institute Title: CORTEXX AI INSTITUTE (No duplicate INSTITUTE)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42); // slate 900
  pdf.text(INSTITUTE_PROFILE.name.toUpperCase(), pageWidth / 2, 126, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(180, 83, 9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WHERE THINKING MEETS TECHNOLOGY', pageWidth / 2, 142, { align: 'center' });

  // 7. Certificate of Completion Headline
  pdf.setFont('times', 'bold');
  pdf.setFontSize(27);
  pdf.setTextColor(154, 52, 18); // Amber 800
  pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 180, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105); // slate 600
  pdf.text('THIS IS PROUDLY PRESENTED TO', pageWidth / 2, 202, { align: 'center' });

  // 8. Student Name with Generous Daylight Above Underline (Zero Strikethrough)
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(15, 23, 42);
  pdf.text(studentName, pageWidth / 2, 240, { align: 'center' });

  // Underline drawn cleanly 16 points below text baseline to clear all descenders
  pdf.setDrawColor(180, 83, 9);
  pdf.setLineWidth(2);
  const nameWidth = pdf.getTextWidth(studentName);
  const halfLineWidth = Math.max(nameWidth / 2 + 25, 110);
  pdf.line(pageWidth / 2 - halfLineWidth, 256, pageWidth / 2 + halfLineWidth, 256);

  // 9. Body Paragraph
  pdf.setFont('times', 'normal');
  pdf.setFontSize(13);
  pdf.setTextColor(51, 65, 85);
  pdf.text('has successfully completed the professional curriculum for the', pageWidth / 2, 285, { align: 'center' });

  // Course Highlight
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(194, 65, 12); // Orange 700
  pdf.text(cert.courseName, pageWidth / 2, 308, { align: 'center' });

  // Duration
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Duration: ${cert.startDate} to ${cert.endDate}`, pageWidth / 2, 326, { align: 'center' });

  // Accreditation Text
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `at ${INSTITUTE_PROFILE.name}, demonstrating exceptional understanding of core concepts, practical skills,`,
    pageWidth / 2,
    350,
    { align: 'center' }
  );
  pdf.text('and successful project application in Artificial Intelligence & Technology.', pageWidth / 2, 366, { align: 'center' });

  // 10. Subtle Decorative Divider Line
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.6);
  pdf.line(60, 408, pageWidth - 60, 408);

  // 11. FOOTER: Date, Signatories, and Centered Seal with Perfect Vertical Spacing
  // Baseline of cursive/date: y = 450
  // Horizontal signature line: y = 464 (clears signature completely)
  // Printed Name / Label: y = 478
  // Title / ID: y = 492

  // --- Col 1: Date of Issue & Certificate ID ---
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(cert.issueDate, 60, 450);

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(60, 464, 145, 464);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('DATE OF ISSUE', 60, 478);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(31, 41, 55);
  pdf.text(`ID: ${cert.id}`, 60, 492);

  // --- Col 2: 1st Signatory (Keval Gajjar) ---
  pdf.setFont('times', 'italic');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Keval Gajjar', 220, 448, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(160, 464, 280, 464);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Keval Gajjar', 220, 478, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Founder & CEO', 220, 492, { align: 'center' });

  // --- Col 3: Centered Official Seal ---
  if (sealPngDataUrl) {
    try {
      const sealSize = 82;
      pdf.addImage(sealPngDataUrl, 'PNG', pageWidth / 2 - sealSize / 2, 424, sealSize, sealSize);
    } catch {
      // ignore
    }
  }

  // --- Col 4: 2nd Signatory (Hiren Raval) ---
  pdf.setFont('times', 'italic');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Hiren Raval', pageWidth - 220, 448, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(pageWidth - 280, 464, pageWidth - 160, 464);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Hiren Raval', pageWidth - 220, 478, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Head of AI Engineering', pageWidth - 220, 492, { align: 'center' });

  // --- Col 5: 3rd Signatory (Shweta Malaviya) ---
  pdf.setFont('times', 'italic');
  pdf.setFontSize(17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Shweta Malaviya', pageWidth - 80, 448, { align: 'center' });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.2);
  pdf.line(pageWidth - 145, 464, pageWidth - 15, 464);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Shweta Malaviya', pageWidth - 80, 478, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Academic Director', pageWidth - 80, 492, { align: 'center' });

  // Save PDF file
  pdf.save(`Certificate_${cert.id}_${studentName.replace(/\s+/g, '_')}.pdf`);
}

function renderFallbackLogoText(pdf: jsPDF, x: number, y: number): void {
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('CORTEXX AI', x, y);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.text('WHERE THINKING MEETS TECHNOLOGY', x, y + 14);
}

/**
 * Downloads multiple certificates in batch as PDFs sequentially.
 */
export async function downloadBulkCertificatesAsPdf(
  certs: CertificateRecord[],
  students: Student[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = certs.length;
  for (let i = 0; i < total; i++) {
    const cert = certs[i];
    const student = students.find(s => s.id === cert.studentId);
    if (onProgress) {
      onProgress(i + 1, total);
    }
    await downloadCertificateDirectlyAsPdf(cert, student);
    // Brief pause to allow the browser to complete the file download trigger
    await new Promise((r) => setTimeout(r, 650));
  }
}
