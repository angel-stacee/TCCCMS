import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatNA, formatTemperature, formatDate } from "./formatters";

const BRAND_BURGUNDY: [number, number, number] = [112, 9, 31]; // #70091f
const BRAND_GOLD: [number, number, number] = [138, 111, 80];   // #8a6f50
const TEXT_DARK: [number, number, number] = [40, 40, 40];
const BORDER_COLOR: [number, number, number] = [232, 223, 212];

/**
 * Helper to dynamically load the official TCC logo as a transparent PNG data URL
 * and removes any black/dark background surrounding the circular emblem.
 */
async function loadLogoDataUrl(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return new Promise((resolve) => {
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const size = Math.min(img.width || 240, 300);
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return resolve(null);
                    ctx.drawImage(img, 0, 0, size, size);

                    // Cut out any dark/black background around the circular seal
                    const imgData = ctx.getImageData(0, 0, size, size);
                    const d = imgData.data;
                    const w = size;
                    const h = size;
                    const visited = new Uint8Array(w * h);
                    const queue: number[] = [];

                    const isDark = (idx: number) => {
                        const r = d[idx];
                        const g = d[idx + 1];
                        const b = d[idx + 2];
                        const a = d[idx + 3];
                        return a < 30 || (r <= 48 && g <= 48 && b <= 48);
                    };

                    for (let x = 0; x < w; x++) {
                        const topIdx = (0 * w + x) * 4;
                        if (isDark(topIdx)) {
                            visited[0 * w + x] = 1;
                            queue.push(x, 0);
                        }
                        const botIdx = ((h - 1) * w + x) * 4;
                        if (isDark(botIdx)) {
                            visited[(h - 1) * w + x] = 1;
                            queue.push(x, h - 1);
                        }
                    }
                    for (let y = 0; y < h; y++) {
                        const leftIdx = (y * w + 0) * 4;
                        if (!visited[y * w + 0] && isDark(leftIdx)) {
                            visited[y * w + 0] = 1;
                            queue.push(0, y);
                        }
                        const rightIdx = (y * w + (w - 1)) * 4;
                        if (!visited[y * w + (w - 1)] && isDark(rightIdx)) {
                            visited[y * w + (w - 1)] = 1;
                            queue.push(w - 1, y);
                        }
                    }

                    let head = 0;
                    while (head < queue.length) {
                        const px = queue[head++];
                        const py = queue[head++];
                        const idx = (py * w + px) * 4;
                        d[idx + 3] = 0;

                        const neighbors = [
                            [px - 1, py],
                            [px + 1, py],
                            [px, py - 1],
                            [px, py + 1],
                        ];
                        for (let i = 0; i < neighbors.length; i++) {
                            const nx = neighbors[i][0];
                            const ny = neighbors[i][1];
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                const nPos = ny * w + nx;
                                if (!visited[nPos]) {
                                    visited[nPos] = 1;
                                    const nIdx = nPos * 4;
                                    if (isDark(nIdx)) {
                                        queue.push(nx, ny);
                                    }
                                }
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } catch {
                    resolve(null);
                }
            };
            img.onerror = () => {
                if (img.src.endsWith(".png")) {
                    img.src = "/tcc-logo.jpg";
                } else {
                    resolve(null);
                }
            };
            img.src = "/tcc-logo.png";
        } catch {
            resolve(null);
        }
    });
}

/**
 * Export Monthly Clinic Report as a professional PDF copying the exact layout of the Print Report
 */
export async function exportMonthlyReportPDF(reportData: {
    report?: {
        period?: string;
        month_name?: string;
        year?: number;
        generated_at?: string;
    };
    summary?: {
        total_visits?: number;
        student_visits?: number;
        students_treated?: number;
        faculty_visits?: number;
        staff_visits?: number;
    };
    reasons?: Array<{ reason: string; count: number }>;
    common_illnesses?: Array<{ illness: string; count: number }>;
    medicine_usage?: Array<{
        medicine_name: string;
        unit: string;
        quantity_used: number;
    }>;
    nurse_activity?: Array<{
        nurse_id?: number | null;
        name: string;
        visits: number;
    }>;
    visits?: Array<{
        id: number;
        date: string;
        person: string;
        person_type: string;
        department?: string;
        reason: string;
        symptoms?: string;
        temperature?: string;
        blood_pressure?: string;
        medicine?: string;
        medicine_quantity?: number | string;
        nurse?: string;
    }>;
}) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoData = await loadLogoDataUrl();
    const periodText = reportData.report?.period || `${reportData.report?.month_name || "Monthly"} ${reportData.report?.year || ""}`;

    // ── 1. OFFICIAL INSTITUTIONAL LETTERHEAD ──
    const logoSize = 18;
    const logoX = pageWidth - 14 - logoSize;
    const logoY = 12;
    if (logoData) {
        try {
            doc.addImage(logoData, "PNG", logoX, logoY, logoSize, logoSize);
        } catch {
            // fallback gracefully
        }
    }

    // Header Titles
    doc.setTextColor(112, 9, 31); // #70091f
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TAGOLOAN COMMUNITY COLLEGE", 14, 18);

    // Document Title
    doc.setTextColor(25, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.text("MONTHLY CLINIC ACTIVITY & HEALTH REPORT", 14, 26);

    // Reporting Period Box on the Upper Right (placed to the left of the Logo without overlapping)
    const boxWidth = 38;
    const boxHeight = 12;
    const boxX = logoX - 5 - boxWidth;
    const boxY = 15;
    doc.setDrawColor(232, 223, 212);
    doc.setFillColor(252, 250, 246);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5, "FD");

    const boxCenterX = boxX + boxWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text("REPORTING PERIOD", boxCenterX, boxY + 4.2, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(112, 9, 31);
    doc.text(periodText.toUpperCase(), boxCenterX, boxY + 9, { align: "center" });

    // Meta Divider Bar
    doc.setDrawColor(220, 212, 202);
    doc.setLineWidth(0.4);
    doc.line(14, 32, pageWidth - 14, 32);

    const genDate = reportData.report?.generated_at
        ? new Date(reportData.report.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    const totalRecords = reportData.visits?.length || 0;
    doc.text(`Generated: ${genDate}   |   Total Visits: ${totalRecords}   |   Scope: All clinic visits recorded for ${periodText}`, 14, 37);

    let currentY = 42;

    // ── 2. SUMMARY STATISTICS CARDS (5 Columns matching Print Report) ──
    const summary = reportData.summary || {};
    const totalVisits = Number(summary.total_visits || 0);
    const studentVisits = Number(summary.student_visits || 0);
    const facultyVisits = Number(summary.faculty_visits || 0);
    const staffVisits = Number(summary.staff_visits || 0);

    autoTable(doc, {
        startY: currentY,
        head: [["Total Consultations", "Student Visits", "Faculty Consultations", "Staff Consultations"]],
        body: [[
            String(totalVisits),
            String(studentVisits),
            String(facultyVisits),
            String(staffVisits),
        ]],
        theme: "plain",
        headStyles: {
            fillColor: [248, 244, 238],
            textColor: [112, 9, 31],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
        },
        bodyStyles: {
            textColor: [30, 30, 30],
            fontSize: 12,
            fontStyle: "bold",
            halign: "center",
        },
        styles: {
            cellPadding: 3,
            lineColor: [225, 215, 205],
            lineWidth: 0.25,
        },
        margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ── 3. 2x2 BREAKDOWN GRID (Visit Reasons, Common Illnesses, Medicine Usage, Nurse Activity) ──
    const reasons = (reportData.reasons || []).slice(0, 5);
    const illnesses = (reportData.common_illnesses || []).slice(0, 5);
    const meds = (reportData.medicine_usage || []).slice(0, 5);
    const nurses = (reportData.nurse_activity || []).slice(0, 5);

    const halfTableWidth = 88;
    const rightMarginLeft = pageWidth - 14 - halfTableWidth; // 108mm
    const tableStartY = currentY;

    // Left Column 1: Top Reasons for Consultation
    autoTable(doc, {
        startY: tableStartY,
        head: [["Consultation Reason", "Count", "%"]],
        body: reasons.length > 0 ? reasons.map(r => [
            formatNA(r.reason),
            String(r.count),
            totalVisits > 0 ? `${Math.round((r.count / totalVisits) * 100)}%` : "0%",
        ]) : [["No consultation records", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: BRAND_BURGUNDY,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
        },
        bodyStyles: {
            fontSize: 7,
            textColor: TEXT_DARK,
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
        },
        styles: { cellPadding: 2 },
        margin: { left: 14, right: pageWidth - 14 - halfTableWidth },
        tableWidth: halfTableWidth,
    });
    const leftFinalY1 = (doc as any).lastAutoTable.finalY;

    // Right Column 1: Common Illnesses & Symptoms
    autoTable(doc, {
        startY: tableStartY,
        head: [["Common Illness / Symptom", "Cases", "%"]],
        body: illnesses.length > 0 ? illnesses.map(i => [
            formatNA(i.illness),
            String(i.count),
            totalVisits > 0 ? `${Math.round((i.count / totalVisits) * 100)}%` : "0%",
        ]) : [["No specific symptoms", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: [140, 40, 60],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
        },
        bodyStyles: {
            fontSize: 7,
            textColor: TEXT_DARK,
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
        },
        styles: { cellPadding: 2 },
        margin: { left: rightMarginLeft, right: 14 },
        tableWidth: halfTableWidth,
    });
    const rightFinalY1 = (doc as any).lastAutoTable.finalY;

    const row2StartY = Math.max(leftFinalY1, rightFinalY1) + 5;

    // Left Column 2: Medicine Usage
    autoTable(doc, {
        startY: row2StartY,
        head: [["Medicine Dispensed", "Qty", "Unit"]],
        body: meds.length > 0 ? meds.map(m => [
            formatNA(m.medicine_name),
            String(m.quantity_used),
            formatNA(m.unit),
        ]) : [["No medicines dispensed", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: BRAND_GOLD,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
        },
        bodyStyles: {
            fontSize: 7,
            textColor: TEXT_DARK,
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
        },
        styles: { cellPadding: 2 },
        margin: { left: 14, right: pageWidth - 14 - halfTableWidth },
        tableWidth: halfTableWidth,
    });
    const leftFinalY2 = (doc as any).lastAutoTable.finalY;

    // Right Column 2: Nurse Activity
    autoTable(doc, {
        startY: row2StartY,
        head: [["Attending Nurse / Staff", "Visits Logged"]],
        body: nurses.length > 0 ? nurses.map(n => [
            formatNA(n.name),
            String(n.visits),
        ]) : [["No nurse records", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: [85, 65, 50],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
        },
        bodyStyles: {
            fontSize: 7,
            textColor: TEXT_DARK,
        },
        columnStyles: {
            0: { cellWidth: 58 },
            1: { cellWidth: 30, halign: "center" },
        },
        styles: { cellPadding: 2 },
        margin: { left: rightMarginLeft, right: 14 },
        tableWidth: halfTableWidth,
    });
    const rightFinalY2 = (doc as any).lastAutoTable.finalY;

    currentY = Math.max(leftFinalY2, rightFinalY2) + 7;

    // ── 4. DETAILED CLINIC VISITS REGISTER (Matching Print Report Table) ──
    const visits = reportData.visits || [];

    // Header label matching print view
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(138, 111, 80); // #8a6f50
    doc.text("SUPPORTING DETAIL", 14, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`CLINIC VISIT REGISTER (${visits.length} Records)`, 14, currentY + 4.5);

    autoTable(doc, {
        startY: currentY + 6.5,
        head: [["Date", "Patient", "Type", "Department", "Reason / Symptoms", "Medicine", "Attending Staff"]],
        body: visits.length > 0 ? visits.map(v => [
            formatDate(v.date),
            formatNA(v.person),
            formatNA(v.person_type),
            formatNA(v.department),
            formatNA(v.reason) + (v.symptoms && v.symptoms !== v.reason ? `\n(${v.symptoms})` : ""),
            v.medicine ? `${v.medicine}${v.medicine_quantity ? ` (${v.medicine_quantity})` : ""}` : "None",
            formatNA(v.nurse),
        ]) : [["No clinic visits recorded for this reporting period", "-", "-", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
            fillColor: BRAND_BURGUNDY,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            halign: "center",
        },
        bodyStyles: {
            fontSize: 7,
            textColor: TEXT_DARK,
            valign: "top",
            overflow: "linebreak",
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 30 },
            2: { cellWidth: 16 },
            3: { cellWidth: 32 },
            4: { cellWidth: 38 },
            5: { cellWidth: 24 },
            6: { cellWidth: 22 },
        },
        styles: { cellPadding: 2 },
        margin: { left: 14, right: 14, bottom: 15 },
        didDrawPage: (data) => {
            const pageNum = doc.getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);
            doc.text("Tagoloan Community College · Health Services Clinic · Campus Clinic Management System · Official Monthly Report", 14, doc.internal.pageSize.getHeight() - 8);
            doc.text(`Page ${data.pageNumber} of ${pageNum}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
        },
    });

    // ── 5. OFFICIAL ENDORSEMENT & SIGNATURES (Matching Print Report Footer) ──
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY + 30 > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        finalY = 22;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(112, 9, 31);
    doc.text("OFFICIAL ENDORSEMENT & SIGNATURES", 14, finalY);

    finalY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

    // Prepared by
    doc.text("Prepared by:", 14, finalY);
    doc.line(14, finalY + 12, 75, finalY + 12);
    doc.setFont("helvetica", "bold");
    doc.text("Clinic Staff / Attending Nurse", 14, finalY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Health Services Clinic · Tagoloan Community College", 14, finalY + 20);

    // Noted by
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("Noted by:", pageWidth - 75, finalY);
    doc.line(pageWidth - 75, finalY + 12, pageWidth - 14, finalY + 12);
    doc.setFont("helvetica", "bold");
    doc.text("College Administration", pageWidth - 75, finalY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Tagoloan Community College", pageWidth - 75, finalY + 20);

    const safeFilename = `TCC_Clinic_Monthly_Report_${(reportData.report?.period || "report").replace(/\s+/g, "_")}.pdf`;
    doc.save(safeFilename);
}

export interface PatientMedicalRecordProfile {
    student_id?: string;
    employee_id?: string;
    staff_id?: string;
    patient_id?: string;
    full_name?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    course?: string;
    year_level?: string;
    section?: string;
    department?: string;
    position?: string;
    sex?: string;
    birth_date?: string;
    contact_number?: string;
    address?: string;
    patient_type?: "student" | "faculty" | "staff" | string;
}

/**
 * Export Individual Patient (Student, Faculty, or Staff) Medical Report as a professional PDF
 */
export async function exportPatientMedicalReportPDF(
    patient: PatientMedicalRecordProfile,
    visits: Array<{
        id: number;
        visit_date: string;
        reason: string;
        symptoms?: string;
        temperature?: string;
        blood_pressure?: string;
        assessment?: string;
        treatment?: string;
        medicine_name?: string;
        medicine_quantity?: number | string;
        nurse_name?: string;
        remarks?: string;
        department?: string;
    }>,
    totalVisitsCount: number,
    patientType: "student" | "faculty" | "staff" = "student"
) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoData = await loadLogoDataUrl();

    const isFaculty = patientType === "faculty";
    const isStaff = patientType === "staff";
    const patientKindLabel = isFaculty ? "FACULTY" : isStaff ? "STAFF" : "STUDENT";
    const patientKindTitle = isFaculty ? "Faculty" : isStaff ? "Staff" : "Student";

    // Burgundy Header Banner (Height 26mm)
    doc.setFillColor(112, 9, 31);
    doc.rect(0, 0, pageWidth, 26, "F");

    // TCC Logo on the Right Upper
    if (logoData) {
        doc.addImage(logoData, "PNG", pageWidth - 14 - 18, 4, 18, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.text("TAGOLOAN COMMUNITY COLLEGE", 14, 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`HEALTH SERVICES CLINIC — ${patientKindLabel} MEDICAL RECORD`, 14, 16);

    doc.setFontSize(7);
    doc.text("Baluarte, Tagoloan, Misamis Oriental · clinic@tcc.edu.ph", 14, 21);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("CONFIDENTIAL MEDICAL HISTORY", pageWidth - 36, 17, { align: "right" });

    // Document Subheading
    let currentY = 32;
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`INDIVIDUAL ${patientKindLabel} MEDICAL REPORT`, 14, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const genDate = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    doc.text(`Generated on: ${genDate} | Authorized Clinic Personnel Copy`, 14, currentY + 5);

    currentY += 12;

    // Patient Profile Table
    const fullName = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" ");
    const patientIdNumber = patient.student_id || patient.employee_id || patient.staff_id || patient.patient_id || "N/A";
    const idLabel = isFaculty ? "Faculty ID" : isStaff ? "Staff ID" : "Student ID";

    const leftCol = `${idLabel}: ${formatNA(patientIdNumber)}\nFull Name: ${fullName}\nSex: ${formatNA(patient.sex)}\nDate of Birth: ${formatDate(patient.birth_date)}`;
    
    let rightCol = "";
    if (isFaculty || isStaff) {
        rightCol = `Position: ${formatNA(patient.position)}\nDepartment: ${formatNA(patient.department)}\nContact Number: ${formatNA(patient.contact_number)}\nAddress: ${formatNA(patient.address)}`;
    } else {
        const academicInfo = `${patient.course || "N/A"} - ${patient.year_level || "N/A"}${patient.section ? ` (${patient.section})` : ""}`;
        rightCol = `Course & Year: ${academicInfo}\nDepartment: ${formatNA(patient.department)}\nContact Number: ${formatNA(patient.contact_number)}\nAddress: ${formatNA(patient.address)}`;
    }

    autoTable(doc, {
        startY: currentY,
        head: [[`${patientKindTitle} Profile Information`, isFaculty || isStaff ? "Work & Contact Details" : "Academic & Contact Details"]],
        body: [[leftCol, rightCol]],
        theme: "plain",
        headStyles: {
            fillColor: BRAND_BURGUNDY,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
        },
        bodyStyles: {
            textColor: TEXT_DARK,
            fontSize: 8.5,
        },
        styles: {
            cellPadding: 4,
            lineColor: BORDER_COLOR,
            lineWidth: 0.2,
        },
        margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Consultation History Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(112, 9, 31);
    doc.text(`CHRONOLOGICAL CLINIC CONSULTATION HISTORY (${totalVisitsCount} Consultations)`, 14, currentY);

    autoTable(doc, {
        startY: currentY + 3,
        head: [["Date", "Reason & Symptoms", "Vitals", "Assessment & Diagnosis", "Treatment Provided", "Medication Dispensed", "Attending Nurse", "Remarks"]],
        body: visits.length > 0 ? visits.map(v => [
            formatDate(v.visit_date),
            `${formatNA(v.reason)}${v.symptoms && v.symptoms !== v.reason ? `\nSymptoms: ${v.symptoms}` : ""}`,
            `Temp: ${formatTemperature(v.temperature)}\nBP: ${formatNA(v.blood_pressure)}`,
            formatNA(v.assessment),
            formatNA(v.treatment),
            v.medicine_name ? `${v.medicine_name} (${v.medicine_quantity || 1})` : "None",
            formatNA(v.nurse_name),
            formatNA(v.remarks),
        ]) : [[`No clinic visits recorded for this ${patientKindTitle.toLowerCase()}`, "-", "-", "-", "-", "-", "-", "-"]],
        theme: "grid",
        headStyles: {
            fillColor: BRAND_BURGUNDY,
            textColor: [255, 255, 255],
            fontSize: 8,
            halign: "center",
        },
        bodyStyles: {
            fontSize: 7.5,
            textColor: TEXT_DARK,
            valign: "top",
        },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 32 },
            2: { cellWidth: 20 },
            3: { cellWidth: 26 },
            4: { cellWidth: 26 },
            5: { cellWidth: 22 },
            6: { cellWidth: 20 },
            7: { cellWidth: 18 },
        },
        styles: { cellPadding: 2.5 },
        margin: { left: 14, right: 14, bottom: 15 },
        didDrawPage: (data) => {
            const pageNum = doc.getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setTextColor(130, 130, 130);
            doc.text(`Tagoloan Community College — Health Services Clinic — Confidential ${patientKindTitle} Medical History Record`, 14, doc.internal.pageSize.getHeight() - 8);
            doc.text(`Page ${data.pageNumber} of ${pageNum}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
        },
    });

    // Verification & Endorsement Signature
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY + 30 > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        finalY = 22;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("Certified True & Correct:", 14, finalY);
    doc.line(14, finalY + 12, 75, finalY + 12);
    doc.setFont("helvetica", "bold");
    doc.text("Attending Clinic Nurse / Physician", 14, finalY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Health Services Clinic · Tagoloan Community College", 14, finalY + 20);

    const safeId = String(patientIdNumber).replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`TCC_${patientKindTitle}_Medical_Report_${safeId}.pdf`);
}

/**
 * Backward compatibility alias for Student Medical Report
 */
export async function exportStudentMedicalReportPDF(
    student: any,
    visits: any[],
    totalVisitsCount: number
) {
    return exportPatientMedicalReportPDF(student, visits, totalVisitsCount, "student");
}

export interface ReferralFormData {
    patient_name: string;
    student_id?: string;
    role_label?: string;
    address?: string;
    birth_date?: string;
    age?: string | number;
    course_and_year?: string;
    referred_to?: string;
    visit_date: string;
    reason_for_care?: string;
    reason?: string;
    symptoms?: string;
    diagnosis?: string;
    temperature?: string | number;
    pulse_rate?: string | number;
    respiratory_rate?: string | number;
    blood_pressure?: string;
    interventions?: string;
    treatment?: string;
    referral_reason?: "evaluation" | "dental" | "employment" | "others" | string;
    other_reason?: string;
    remarks?: string;
    rest_days?: string | number;
    attending_nurse?: string;
    nurse_in_charge?: string;
    issue_date?: string;
    document_code?: string;
    revision_no?: string;
}

export type MedicalCertificateData = ReferralFormData;

/**
 * Calculate age in years from birth date string
 */
function computeAgeFromBirthDate(birthDate?: string): string {
    if (!birthDate) return "";
    const b = new Date(birthDate);
    if (isNaN(b.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
        age--;
    }
    return age > 0 ? String(age) : "";
}

/**
 * Export official TCC Referral Form (Appendix D)
 * Matching the official Tagoloan Community College health clinic standard template.
 */
export async function exportReferralFormPDF(cert: ReferralFormData) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoData = await loadLogoDataUrl();

    // 1. Top Outside Headers
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("APPENDIX D", pageWidth / 2, 13, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("REFERRAL FORM", pageWidth / 2, 18, { align: "center" });

    // 2. Outer Framed Blue Border Box (matches official clinic format)
    const boxX = 16;
    const boxY = 22;
    const boxW = pageWidth - 32; // 178mm
    const boxH = 252;

    doc.setDrawColor(107, 164, 217); // Soft institutional blue
    doc.setLineWidth(1.2);
    doc.rect(boxX, boxY, boxW, boxH);

    // 3. Header Inside the Box
    const headerY = boxY + 7;

    // TCC Logo on the Left
    if (logoData) {
        doc.addImage(logoData, "PNG", boxX + 6, headerY, 19, 19);
    }

    // Seal on the Right
    doc.setDrawColor(140, 140, 140);
    doc.setLineWidth(0.5);
    doc.circle(boxX + boxW - 14, headerY + 9, 6.5);

    // Institution Details (Centered in the remaining header space)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("TAGOLOAN COMMUNITY COLLEGE", pageWidth / 2, headerY + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text("Baluarte, Tagoloan, Mis. Oriental", pageWidth / 2, headerY + 8.5, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Member: Association of Local Colleges and Universities (ALCU)", pageWidth / 2, headerY + 12.5, { align: "center" });
    doc.text("Commission on Accreditation (ALCUCOA)", pageWidth / 2, headerY + 16, { align: "center" });

    // 4. Form Document Title
    let curY = headerY + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text("REFERRAL FORM", pageWidth / 2, curY, { align: "center" });

    // 5. Document Control Line
    curY += 7;
    const issueDateStr = cert.issue_date || (cert.visit_date ? formatDate(cert.visit_date) : formatDate(new Date().toISOString()));
    const docCodeStr = cert.document_code || "TCC_O/O: _________";
    const revNoStr = cert.revision_no || "00";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    const padLeft = boxX + 8;
    const rightMargin = boxX + boxW - 8;

    doc.text(`Issue Date: ${issueDateStr}`, padLeft, curY);
    doc.text(`TCC_O/O: ${docCodeStr.startsWith("TCC") ? docCodeStr.replace(/^TCC_O\/O:\s*/, "") : docCodeStr}`, pageWidth / 2, curY, { align: "center" });
    doc.text(`Revision No: ${revNoStr}`, rightMargin, curY, { align: "right" });

    // Subtle divider under control info
    curY += 3;
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(padLeft, curY, rightMargin, curY);

    // 6. Patient Demographic Details
    curY += 8;
    const dateStr = cert.visit_date ? formatDate(cert.visit_date) : formatDate(new Date().toISOString());
    const calculatedAge = cert.age ? String(cert.age) : computeAgeFromBirthDate(cert.birth_date);
    const courseYearStr = cert.course_and_year || cert.role_label || "____________________";

    // Row: Date, Age, Course & Year
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`Date: ${dateStr}`, padLeft, curY);
    doc.text(`Age: ${calculatedAge || "______"}`, padLeft + 65, curY);
    doc.text(`Course & Year: ${courseYearStr}`, padLeft + 98, curY);

    // Row: Referred to
    curY += 7;
    const referredToStr = cert.referred_to || "Tagoloan Municipal Health Office / Hospital";
    doc.text(`Referred to: ${referredToStr}`, padLeft, curY);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(padLeft + 22, curY + 1.2, rightMargin, curY + 1.2);

    // Row: Name
    curY += 7;
    const patientName = (cert.patient_name || "").trim() || "___________________________________________";
    doc.text(`Name: ${patientName}`, padLeft, curY);
    doc.line(padLeft + 13, curY + 1.2, rightMargin, curY + 1.2);

    // Row: Address
    curY += 7;
    const addressStr = cert.address && cert.address !== "N/A" ? cert.address.trim() : "Baluarte, Tagoloan, Misamis Oriental";
    doc.text(`Address: ${addressStr}`, padLeft, curY);
    doc.line(padLeft + 16, curY + 1.2, rightMargin, curY + 1.2);

    // Row: Reason/s for seeking care
    curY += 7;
    doc.text("Reason/s for seeking care:", padLeft, curY);
    const careReason = cert.reason_for_care || cert.symptoms || cert.reason || cert.diagnosis || "Medical Consultation & Examination";
    curY += 5.5;
    doc.setFont("helvetica", "bold");
    doc.text(careReason, padLeft + 4, curY);
    doc.line(padLeft, curY + 1.2, rightMargin, curY + 1.2);

    // Row: Vitals (never fabricate missing clinical measurements)
    curY += 8;
    doc.setFont("helvetica", "normal");
    const tempVal = cert.temperature && cert.temperature !== "N/A" && cert.temperature !== "-"
        ? (String(cert.temperature).includes("°C") ? String(cert.temperature) : `${cert.temperature} °C`)
        : "N/A";
    const prVal = cert.pulse_rate && cert.pulse_rate !== "N/A"
        ? (String(cert.pulse_rate).includes("bpm") ? String(cert.pulse_rate) : `${cert.pulse_rate} bpm`)
        : "N/A";
    const rrVal = cert.respiratory_rate && cert.respiratory_rate !== "N/A"
        ? (String(cert.respiratory_rate).includes("cpm") ? String(cert.respiratory_rate) : `${cert.respiratory_rate} cpm`)
        : "N/A";
    const bpVal = cert.blood_pressure && cert.blood_pressure !== "N/A" && cert.blood_pressure !== "-"
        ? (String(cert.blood_pressure).includes("mmHg") ? String(cert.blood_pressure) : `${cert.blood_pressure} mmHg`)
        : "N/A";

    doc.text(`Temp: ${tempVal}`, padLeft, curY);
    doc.text(`PR: ${prVal}`, padLeft + 42, curY);
    doc.text(`RR: ${rrVal}`, padLeft + 84, curY);
    doc.text(`BP: ${bpVal}`, padLeft + 126, curY);

    // Row: Intervention/s done
    curY += 7;
    doc.text("Intervention/s done:", padLeft, curY);
    const interventionStr = cert.interventions || cert.treatment || cert.remarks || "N/A";
    curY += 5.5;
    doc.setFont("helvetica", "bold");
    doc.text(interventionStr, padLeft + 4, curY);
    doc.line(padLeft, curY + 1.2, rightMargin, curY + 1.2);

    // 7. Reason/s of Referral Checkbox Section
    curY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text("Reason/s of referral:", padLeft, curY);

    // Determine which checkbox is checked
    const referralText = `${cert.referral_reason || ""} ${cert.reason || ""} ${cert.symptoms || ""} ${cert.diagnosis || ""} ${cert.remarks || ""}`.toLowerCase();
    const isDental = referralText.includes("dent") || referralText.includes("tooth") || referralText.includes("teeth") || cert.referral_reason === "dental";
    const isMedCert = referralText.includes("employment") || referralText.includes("job") || referralText.includes("ojt") || cert.referral_reason === "employment";
    const isOthers = cert.referral_reason === "others" || Boolean(cert.other_reason);
    const isFurtherEval = (!isDental && !isMedCert && !isOthers) || cert.referral_reason === "evaluation";

    const drawCheckbox = (x: number, y: number, checked: boolean, label: string, extraUnderline?: string) => {
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.4);
        doc.rect(x, y - 3.2, 3.8, 3.8);

        if (checked) {
            doc.setDrawColor(20, 20, 20);
            doc.setLineWidth(0.55);
            doc.line(x + 0.7, y - 1.2, x + 1.6, y - 0.2);
            doc.line(x + 1.6, y - 0.2, x + 3.2, y - 2.6);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(label, x + 6.5, y);

        if (extraUnderline !== undefined) {
            const startX = x + 6.5 + doc.getTextWidth(label) + 2;
            doc.text(extraUnderline, startX, y);
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.3);
            doc.line(startX, y + 1.2, rightMargin - 10, y + 1.2);
        }
    };

    const cbX = padLeft + 6;
    curY += 6;
    drawCheckbox(cbX, curY, isFurtherEval, "Further evaluation and management");

    curY += 6.5;
    drawCheckbox(cbX, curY, isDental, "Dental check-up/ Dental extraction");

    curY += 6.5;
    drawCheckbox(cbX, curY, isMedCert, "Medical Certificate for employment");

    curY += 6.5;
    const otherDetail = isOthers ? (cert.other_reason || cert.remarks || "") : "";
    drawCheckbox(cbX, curY, isOthers, "Others:", otherDetail);

    // 8. Signatures at Bottom
    const signY = boxY + boxH - 26;
    const nurseName = cert.attending_nurse || "Desiree Joy P. Velez, RN";

    // Left Signature: Referred by
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text("Referred by:", padLeft + 6, signY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(nurseName, padLeft + 6, signY + 9);
    doc.line(padLeft + 6, signY + 10, padLeft + 68, signY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text("SCHOOL NURSE", padLeft + 6, signY + 14);

    // Right Signature: Acknowledge by
    const rightColX = padLeft + 100;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text("Acknowledge by:", rightColX, signY);

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.line(rightColX, signY + 10, rightMargin, signY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text("NURSE IN CHARGE", rightColX, signY + 14);

    // Save PDF
    const safeId = (cert.student_id || cert.patient_name || "Patient").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`TCC_Referral_Form_${safeId}.pdf`);
}

/**
 * Backward compatibility alias so existing calls work seamlessly
 */
export const exportMedicalCertificatePDF = exportReferralFormPDF;

/**
 * ── OFFICIAL MEDICINE INVENTORY & DISPENSING PDF REPORT ──
 */
export async function exportMedicineInventoryReportPDF(data: {
    summary?: {
        total_items?: number;
        total_medicines?: number;
        total_units_in_stock?: number;
        out_of_stock?: number;
        out_of_stock_count?: number;
        low_stock?: number;
        low_stock_count?: number;
        expired?: number;
        expired_count?: number;
        expiring_soon?: number;
        expiring_soon_count?: number;
        total_units_dispensed?: number;
    };
    medicines?: Array<{
        id: number | string;
        medicine_name?: string;
        name?: string;
        treatment_type?: string;
        category?: string;
        unit?: string;
        stock?: number;
        current_stock?: number;
        minimum_stock?: number;
        alert_threshold?: number;
        expiration_date?: string | null;
        total_dispensed?: number;
        status?: string;
    }>;
    generated_at?: string;
}) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. TCC Official Seal
    const logoData = await loadLogoDataUrl();
    if (logoData) {
        try {
            doc.addImage(logoData, "PNG", 14, 10, 19, 19);
        } catch {
            // fallback gracefully
        }
    }

    // Official Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(112, 9, 31);
    doc.text("TAGOLOAN COMMUNITY COLLEGE", 36, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("College Health Services Clinic · Campus Clinic Management System", 36, 19.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("MEDICINE INVENTORY & DISPENSING REPORT", 36, 26);

    // Meta Box on the Upper Right
    doc.setDrawColor(232, 223, 212);
    doc.setFillColor(252, 250, 246);
    doc.roundedRect(pageWidth - 14 - 45, 12, 45, 14, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text("INVENTORY STATUS", pageWidth - 14 - 22.5, 17, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(112, 9, 31);
    doc.text("OFFICIAL AUDIT", pageWidth - 14 - 22.5, 22, { align: "center" });

    // Meta Divider Line
    doc.setDrawColor(220, 212, 202);
    doc.setLineWidth(0.4);
    doc.line(14, 32, pageWidth - 14, 32);

    const genDate = data.generated_at
        ? new Date(data.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const summary = {
        total_items: data.summary?.total_items ?? data.summary?.total_medicines ?? 0,
        total_units_in_stock: data.summary?.total_units_in_stock ?? 0,
        out_of_stock: data.summary?.out_of_stock ?? data.summary?.out_of_stock_count ?? 0,
        low_stock: data.summary?.low_stock ?? data.summary?.low_stock_count ?? 0,
        expired: data.summary?.expired ?? data.summary?.expired_count ?? 0,
        expiring_soon: data.summary?.expiring_soon ?? data.summary?.expiring_soon_count ?? 0,
    };

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    doc.text(`Generated: ${genDate}   |   Catalog Items: ${summary.total_items}   |   Total Units in Stock: ${summary.total_units_in_stock}`, 14, 36);

    // 2. Summary Metric Table
    autoTable(doc, {
        startY: 40,
        head: [["Catalog Items", "Units In Stock", "Low Stock Alert", "Expired Items", "Expiring Soon"]],
        body: [[
            String(summary.total_items),
            String(summary.total_units_in_stock),
            String(summary.low_stock),
            String(summary.expired),
            String(summary.expiring_soon),
        ]],
        theme: "plain",
        headStyles: {
            fillColor: [248, 244, 238],
            textColor: [112, 9, 31],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
        },
        bodyStyles: {
            textColor: [30, 30, 30],
            fontSize: 11,
            fontStyle: "bold",
            halign: "center",
        },
        styles: {
            cellPadding: 2.5,
            lineColor: [225, 215, 205],
            lineWidth: 0.25,
        },
        margin: { left: 14, right: 14 },
    });

    const currentY = (doc as any).lastAutoTable.finalY + 6;

    // 3. Detailed Medicines Table
    const medicinesList = data.medicines || [];
    const tableRows = medicinesList.map((m, idx) => [
        String(idx + 1),
        m.name || m.medicine_name || "Unnamed Medicine",
        m.category || m.treatment_type || "General",
        m.unit || "Unit",
        String(m.current_stock ?? m.stock ?? 0),
        String(m.alert_threshold ?? m.minimum_stock ?? 10),
        formatDate(m.expiration_date),
        String(m.total_dispensed ?? 0),
        m.status || "In Stock",
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [["#", "Medicine Name", "Category", "Unit", "In Stock", "Alert Level", "Expiration", "Dispensed", "Status"]],
        body: tableRows.length > 0 ? tableRows : [["-", "No medicine records in inventory", "-", "-", "-", "-", "-", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: BRAND_BURGUNDY,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            halign: "left",
        },
        bodyStyles: {
            fontSize: 7.5,
            textColor: [35, 35, 35],
        },
        alternateRowStyles: {
            fillColor: [253, 251, 248],
        },
        columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 42, fontStyle: "bold" },
            2: { cellWidth: 26 },
            3: { cellWidth: 16 },
            4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
            5: { cellWidth: 16, halign: "center" },
            6: { cellWidth: 20 },
            7: { cellWidth: 16, halign: "center" },
            8: { cellWidth: 22, fontStyle: "bold" },
        },
        styles: {
            cellPadding: 2.2,
            overflow: "linebreak",
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (pageData) => {
            // Footer on each page
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(150, 150, 150);
            doc.text(
                "TCC Health Services Clinic · Campus Clinic Management System · Confidential Inventory Record",
                14,
                pageHeight - 8
            );
            doc.text(
                `Page ${pageData.pageNumber}`,
                pageWidth - 14,
                pageHeight - 8,
                { align: "right" }
            );
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    // Check if we need a new page for signatures
    if (finalY > pageHeight - 35) {
        doc.addPage();
    }
    const sigBaseY = finalY > pageHeight - 35 ? 30 : finalY;

    // Official Endorsements & Signatures (straight & aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(112, 9, 31);
    doc.text("OFFICIAL ENDORSEMENT & SIGNATURES", 14, sigBaseY);

    const sigColWidth = 65;
    const rightSigX = pageWidth - 14 - sigColWidth;

    // Prepared by
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text("Prepared by:", 14, sigBaseY + 6);
    doc.line(14, sigBaseY + 18, 14 + sigColWidth, sigBaseY + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text("Clinic Staff / Attending Nurse", 14, sigBaseY + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Health Services Clinic · Tagoloan Community College", 14, sigBaseY + 25.5);

    // Noted by
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text("Noted by:", rightSigX, sigBaseY + 6);
    doc.line(rightSigX, sigBaseY + 18, rightSigX + sigColWidth, sigBaseY + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text("College Administration", rightSigX, sigBaseY + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Tagoloan Community College", rightSigX, sigBaseY + 25.5);

    doc.save(`TCC_Medicine_Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
