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

let cachedSealDataUrl: string | null = null;

/**
 * Converts the official seal SVG into a high-res raster PNG data URL.
 * This guarantees html2canvas and jsPDF can render the seal without failing on SVG textPath.
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
 * Utility: Converts modern CSS color functions like "oklch(...)" into standard hex/rgba
 * so html2canvas never throws "Attempting to parse an unsupported color function 'oklch'".
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
      padding-bottom: 4px;
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
      margin-top: 15pt;
    }
    .footer-cell {
      width: 20%;
      text-align: center;
      vertical-align: bottom;
      font-family: Arial, sans-serif;
    }
    .signature-line {
      border-top: 1.5px solid #000000;
      width: 130pt;
      margin: 0 auto 3px auto;
    }
    .sign-label {
      font-size: 8.5pt;
      font-weight: bold;
      color: #000000;
    }
    .date-val {
      font-size: 10pt;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #000000;
      margin-bottom: 4px;
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

    <!-- Institute Title: Fixed to CORTEXX AI INSTITUTE (No Duplicate INSTITUTE) -->
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

    <!-- Footer: Date LHS, 3 Signatures (Keval Gajjar, Hiren Raval, Shweta Malaviya), and Centered Official Seal -->
    <table class="footer-table">
      <tr>
        <!-- Date & ID -->
        <td class="footer-cell" style="text-align: left;">
          <div class="date-val">${certRecord.issueDate}</div>
          <div class="signature-line" style="width: 100pt;"></div>
          <div class="sign-label">Issue Date</div>
          <div style="font-size: 7.5pt; color: #111827; margin-top: 2px; font-family: monospace; font-weight: bold;">ID: ${certRecord.id}</div>
        </td>

        <!-- 1st Signatory: Keval Gajjar -->
        <td class="footer-cell">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 14pt; color: #000000; font-weight: bold; margin-bottom: 2px;">Keval Gajjar</div>
          <div class="signature-line"></div>
          <div class="sign-label">Keval Gajjar</div>
          <div style="font-size: 7.5pt; color: #374151; font-weight: bold;">Founder & CEO</div>
        </td>

        <!-- Centered Attached Official Seal -->
        <td class="footer-cell">
          <div class="official-seal-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="75" height="75">
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
          <div style="font-family: 'Brush Script MT', cursive; font-size: 14pt; color: #000000; font-weight: bold; margin-bottom: 2px;">Hiren Raval</div>
          <div class="signature-line"></div>
          <div class="sign-label">Hiren Raval</div>
          <div style="font-size: 7.5pt; color: #374151; font-weight: bold;">Head of AI Engineering</div>
        </td>

        <!-- 3rd Signatory: Shweta Malaviya -->
        <td class="footer-cell" style="text-align: right;">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 14pt; color: #000000; font-weight: bold; margin-bottom: 2px;">Shweta Malaviya</div>
          <div class="signature-line"></div>
          <div class="sign-label">Shweta Malaviya</div>
          <div style="font-size: 7.5pt; color: #374151; font-weight: bold;">Academic Director</div>
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
 * Fully sanitized against modern "oklch" color parser errors in html2canvas.
 */
export async function downloadCertificateAsPdf(
  element: HTMLElement,
  studentName: string,
  certId: string
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#fdfbf7',
      onclone: (clonedDoc: Document) => {
        // Sanitize any oklch color string in <style> elements
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach(tag => {
          if (tag.textContent && tag.textContent.includes('oklch')) {
            tag.textContent = convertOklchToRgb(tag.textContent);
          }
        });

        // Intercept getComputedStyle in the cloned document window to sanitize any oklch color values
        const win = clonedDoc.defaultView || window;
        try {
          const origGetComputedStyle = win.getComputedStyle.bind(win);
          win.getComputedStyle = function (el: Element, pseudo?: string | null) {
            const style = origGetComputedStyle(el, pseudo);
            return new Proxy(style, {
              get(target: any, prop: string) {
                if (prop === 'getPropertyValue') {
                  return (propertyName: string) => {
                    const val = target.getPropertyValue(propertyName);
                    return typeof val === 'string' && val.includes('oklch') ? convertOklchToRgb(val) : val;
                  };
                }
                const val = target[prop];
                if (typeof val === 'string' && val.includes('oklch')) {
                  return convertOklchToRgb(val);
                }
                return typeof val === 'function' ? val.bind(target) : val;
              },
            });
          };
        } catch {
          // ignore proxy failure
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    pdf.save(`Certificate_${certId}_${studentName.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.warn('html2canvas on element failed, generating direct vector PDF:', err);
    // Fallback directly to direct vector export
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
}

/**
 * Directly downloads any certificate as a high-resolution PDF without requiring
 * the preview modal to be open on screen.
 * Uses an isolated sandbox iframe to completely eliminate Tailwind v4 oklch collisions.
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
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 });
  } catch {
    qrDataUrl = '';
  }

  // 2. Get official seal as raster PNG (prevents html2canvas SVG issues)
  const sealPng = await getOfficialSealPngDataUrl(350);

  // 3. Create isolated sandbox iframe to completely isolate styles from Tailwind v4 oklch
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1140px';
  iframe.style.height = '820px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Could not access iframe document');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background-color: #fdfbf7; font-family: 'Georgia', serif; }
          </style>
        </head>
        <body style="background-color: #fdfbf7; padding: 24px;">
          <div id="cert-root" style="border: 8px double #b45309; background-color: #ffffff; padding: 28px 36px; text-align: center; color: #111827; box-sizing: border-box; width: 1080px;">
            <!-- Top Bar: Left Corner Heading in Dark Black Bold & Right Side QR Code -->
            <table style="width: 100%; margin-bottom: 8px;">
              <tr>
                <td style="text-align: left; vertical-align: middle;">
                  <div style="font-size: 20px; font-weight: 900; color: #000000; font-family: 'Arial Black', Arial, sans-serif; letter-spacing: 0.5px;">
                    ⚡ CORTEXX AI
                  </div>
                  <div style="font-size: 9px; font-weight: 800; color: #111827; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
                    Where Thinking Meets Technology
                  </div>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <div style="display: inline-block; text-align: center;">
                    ${qrDataUrl ? `<img src="${qrDataUrl}" width="70" height="70" style="border: 2px solid #b45309; padding: 2px; background: #fff;" />` : ''}
                    <div style="font-size: 8px; font-weight: 900; color: #b45309; font-family: Arial, sans-serif; margin-top: 2px;">SCAN TO VERIFY</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Institute Title: Fixed to CORTEXX AI INSTITUTE -->
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; font-family: 'Arial Black', Arial, sans-serif; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">
              ${INSTITUTE_PROFILE.name}
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #9a3412; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; margin-bottom: 12px;">
              Where Thinking Meets Technology
            </div>

            <!-- Certificate Title -->
            <div style="font-size: 32px; font-weight: 900; color: #9a3412; text-transform: uppercase; letter-spacing: 2px; font-family: Georgia, serif; margin-bottom: 4px;">
              Certificate of Completion
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; font-family: Arial, sans-serif; margin-bottom: 14px;">
              This is proudly presented to
            </div>

            <!-- Student Name -->
            <div style="margin-bottom: 16px;">
              <span style="font-size: 36px; font-weight: 900; color: #0f172a; border-bottom: 3px solid #b45309; padding: 0 24px 4px 24px; display: inline-block; font-family: Georgia, serif;">
                ${studentName}
              </span>
            </div>

            <!-- Body -->
            <div style="font-size: 15px; color: #334155; line-height: 1.6; max-width: 820px; margin: 0 auto 20px auto; font-family: Georgia, serif;">
              has successfully completed the professional curriculum for the
              <div style="font-size: 22px; font-weight: 900; color: #c2410c; margin: 6px 0; font-family: Arial, sans-serif;">
                ${cert.courseName}
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #64748b; font-family: monospace; margin-bottom: 8px;">
                Duration: ${cert.startDate} to ${cert.endDate}
              </div>
              <div style="font-size: 13px; color: #475569;">
                at ${INSTITUTE_PROFILE.name}, demonstrating exceptional understanding of core concepts, practical skills, and successful project application in Artificial Intelligence & Technology.
              </div>
            </div>

            <!-- Footer Table: Date LHS, Signatories, and Centered Attached Official Seal -->
            <table style="width: 100%; border-top: 1.5px solid rgba(180, 83, 9, 0.25); padding-top: 14px; margin-top: 12px;">
              <tr>
                <!-- Date of Issue -->
                <td style="width: 20%; text-align: left; vertical-align: bottom;">
                  <div style="font-size: 13px; font-weight: 900; color: #000000; font-family: monospace;">${cert.issueDate}</div>
                  <div style="border-top: 2px solid #000000; width: 100px; padding-top: 4px; font-size: 10px; font-weight: 900; color: #000000; font-family: Arial, sans-serif; text-transform: uppercase;">
                    Date of Issue
                  </div>
                  <div style="font-size: 9px; font-weight: 800; color: #000000; font-family: monospace; margin-top: 2px;">
                    ID: ${cert.id}
                  </div>
                </td>

                <!-- 1st Signatory: Keval Gajjar -->
                <td style="width: 20%; text-align: center; vertical-align: bottom;">
                  <div style="font-family: 'Brush Script MT', cursive; font-size: 20px; font-weight: 900; color: #000000; margin-bottom: 2px;">Keval Gajjar</div>
                  <div style="border-top: 1.5px solid #000000; width: 130px; margin: 0 auto; padding-top: 3px; font-size: 11px; font-weight: 900; color: #000000; font-family: Arial, sans-serif;">
                    Keval Gajjar
                  </div>
                  <div style="font-size: 9px; font-weight: 700; color: #334155; font-family: Arial, sans-serif;">Founder & CEO</div>
                </td>

                <!-- Centered Official Seal -->
                <td style="width: 20%; text-align: center; vertical-align: middle;">
                  ${sealPng 
                    ? `<img src="${sealPng}" width="95" height="95" style="display: block; margin: 0 auto;" />`
                    : `<div style="width: 80px; height: 80px; border-radius: 50%; border: 3px double #0a215c; margin: 0 auto; line-height: 80px; font-size: 10px; font-weight: bold; color: #0a215c;">OFFICIAL SEAL</div>`
                  }
                </td>

                <!-- 2nd Signatory: Hiren Raval -->
                <td style="width: 20%; text-align: center; vertical-align: bottom;">
                  <div style="font-family: 'Brush Script MT', cursive; font-size: 20px; font-weight: 900; color: #000000; margin-bottom: 2px;">Hiren Raval</div>
                  <div style="border-top: 1.5px solid #000000; width: 130px; margin: 0 auto; padding-top: 3px; font-size: 11px; font-weight: 900; color: #000000; font-family: Arial, sans-serif;">
                    Hiren Raval
                  </div>
                  <div style="font-size: 9px; font-weight: 700; color: #334155; font-family: Arial, sans-serif;">Head of AI Engineering</div>
                </td>

                <!-- 3rd Signatory: Shweta Malaviya -->
                <td style="width: 20%; text-align: right; vertical-align: bottom;">
                  <div style="font-family: 'Brush Script MT', cursive; font-size: 20px; font-weight: 900; color: #000000; margin-bottom: 2px;">Shweta Malaviya</div>
                  <div style="border-top: 1.5px solid #000000; width: 130px; margin-left: auto; padding-top: 3px; font-size: 11px; font-weight: 900; color: #000000; font-family: Arial, sans-serif;">
                    Shweta Malaviya
                  </div>
                  <div style="font-size: 9px; font-weight: 700; color: #334155; font-family: Arial, sans-serif;">Academic Director</div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Small delay to ensure styles and images inside iframe are settled
    await new Promise(r => setTimeout(r, 120));

    const certRoot = iframeDoc.getElementById('cert-root') || iframeDoc.body;

    const canvas = await html2canvas(certRoot as HTMLElement, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#fdfbf7',
      windowWidth: 1140,
      windowHeight: 820,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    pdf.save(`Certificate_${cert.id}_${studentName.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.warn('Sandbox html2canvas encountered issue, falling back to direct vector PDF:', err);
    generateDirectVectorPdf(cert, studentName, qrDataUrl, sealPng);
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Direct Vector PDF generator as a guaranteed fallback.
 * Uses jsPDF pure vector drawing and embedding so it never relies on html2canvas or CSS color parsers.
 */
function generateDirectVectorPdf(
  cert: CertificateRecord,
  studentName: string,
  qrDataUrl: string,
  sealPngDataUrl: string
): void {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(253, 251, 247);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Decorative Borders
  pdf.setDrawColor(180, 83, 9);
  pdf.setLineWidth(5);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
  pdf.setLineWidth(1.5);
  pdf.rect(26, 26, pageWidth - 52, pageHeight - 52);

  // Top Left Header
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('CORTEXX AI', 45, 55);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);
  pdf.text('WHERE THINKING MEETS TECHNOLOGY', 45, 68);

  // Top Right QR Code
  if (qrDataUrl) {
    try {
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - 110, 36, 60, 60);
      pdf.setFontSize(6.5);
      pdf.setTextColor(180, 83, 9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCAN TO VERIFY', pageWidth - 80, 104, { align: 'center' });
    } catch {
      // ignore
    }
  }

  // Institute Title: CORTEXX AI INSTITUTE
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42);
  pdf.text(INSTITUTE_PROFILE.name.toUpperCase(), pageWidth / 2, 115, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(180, 83, 9);
  pdf.text('WHERE THINKING MEETS TECHNOLOGY', pageWidth / 2, 130, { align: 'center' });

  // Certificate of Completion
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(154, 52, 18);
  pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 175, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text('THIS IS PROUDLY PRESENTED TO', pageWidth / 2, 195, { align: 'center' });

  // Student Name
  pdf.setFont('times', 'bold');
  pdf.setFontSize(30);
  pdf.setTextColor(15, 23, 42);
  pdf.text(studentName, pageWidth / 2, 240, { align: 'center' });

  // Underline under Student Name
  pdf.setDrawColor(180, 83, 9);
  pdf.setLineWidth(2);
  const nameWidth = pdf.getTextWidth(studentName);
  pdf.line((pageWidth - nameWidth) / 2 - 15, 248, (pageWidth + nameWidth) / 2 + 15, 248);

  // Body Text
  pdf.setFont('times', 'normal');
  pdf.setFontSize(13);
  pdf.setTextColor(51, 65, 85);
  pdf.text('has successfully completed the professional curriculum for the', pageWidth / 2, 280, { align: 'center' });

  // Course Highlight
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(194, 65, 12);
  pdf.text(cert.courseName, pageWidth / 2, 308, { align: 'center' });

  // Duration
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Duration: ${cert.startDate} to ${cert.endDate}`, pageWidth / 2, 326, { align: 'center' });

  // Accreditation Text
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `at ${INSTITUTE_PROFILE.name}, demonstrating exceptional understanding of core concepts, practical skills,`,
    pageWidth / 2,
    352,
    { align: 'center' }
  );
  pdf.text('and successful project application in Artificial Intelligence & Technology.', pageWidth / 2, 368, { align: 'center' });

  // Footer Divider Line
  pdf.setDrawColor(180, 83, 9);
  pdf.setLineWidth(0.8);
  pdf.line(50, 420, pageWidth - 50, 420);

  // Footer Items
  // 1. Issue Date & ID
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(cert.issueDate, 60, 455);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(60, 462, 140, 462);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('DATE OF ISSUE', 60, 474);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`ID: ${cert.id}`, 60, 486);

  // 2. Keval Gajjar
  pdf.setFont('times', 'italic');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Keval Gajjar', 220, 455, { align: 'center' });
  pdf.line(160, 462, 280, 462);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Keval Gajjar', 220, 474, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Founder & CEO', 220, 486, { align: 'center' });

  // 3. Centered Official Seal
  if (sealPngDataUrl) {
    try {
      pdf.addImage(sealPngDataUrl, 'PNG', pageWidth / 2 - 38, 430, 76, 76);
    } catch {
      // ignore
    }
  }

  // 4. Hiren Raval
  pdf.setFont('times', 'italic');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Hiren Raval', pageWidth - 220, 455, { align: 'center' });
  pdf.line(pageWidth - 280, 462, pageWidth - 160, 462);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Hiren Raval', pageWidth - 220, 474, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Head of AI Engineering', pageWidth - 220, 486, { align: 'center' });

  // 5. Shweta Malaviya
  pdf.setFont('times', 'italic');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Shweta Malaviya', pageWidth - 90, 455, { align: 'center' });
  pdf.line(pageWidth - 145, 462, pageWidth - 35, 462);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Shweta Malaviya', pageWidth - 90, 474, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Academic Director', pageWidth - 90, 486, { align: 'center' });

  pdf.save(`Certificate_${cert.id}_${studentName.replace(/\s+/g, '_')}.pdf`);
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
