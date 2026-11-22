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

    // ── 1. OFFICIAL INSTITUTIONAL LETTERHEAD (White Background matching Print Report) ──
    // Transparent TCC Logo on the Right Upper
    if (logoData) {
        doc.addImage(logoData, "PNG", pageWidth - 14 - 22, 11, 22, 22);
    }

    // Header Titles
    doc.setTextColor(112, 9, 31); // #70091f
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("TAGOLOAN COMMUNITY COLLEGE", 14, 15);

    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("HEALTH SERVICES CLINIC — CAMPUS CLINIC MANAGEMENT SYSTEM", 14, 20.5);

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Baluarte, Tagoloan, Misamis Oriental · clinic@tcc.edu.ph", 14, 25);

    // Document Title
    doc.setTextColor(25, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("MONTHLY CLINIC ACTIVITY & HEALTH REPORT", 14, 33);

    // Reporting Period Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Report Period: ", 14, 38);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(112, 9, 31);
    doc.text(periodText.toUpperCase(), 34, 38);

    // Reporting Period Box on the Upper Right (matching print view)
    doc.setDrawColor(232, 223, 212);
    doc.setFillColor(252, 250, 246);
    doc.roundedRect(pageWidth - 14 - 40, 25, 40, 12, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text("REPORTING PERIOD", pageWidth - 14 - 20, 29, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(112, 9, 31);
    doc.text(periodText.toUpperCase(), pageWidth - 14 - 20, 34, { align: "center" });

    // Meta Divider Bar
    doc.setDrawColor(220, 212, 202);
    doc.setLineWidth(0.4);
    doc.line(14, 42, pageWidth - 14, 42);

    const genDate = reportData.report?.generated_at
        ? new Date(reportData.report.generated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    const totalRecords = reportData.visits?.length || 0;
    doc.text(`Generated: ${genDate}   |   Total Visits: ${totalRecords}   |   Scope: All clinic visits recorded for ${periodText}`, 14, 46);

    let currentY = 50;

    // ── 2. SUMMARY STATISTICS CARDS (5 Columns matching Print Report) ──
    const summary = reportData.summary || {};
    const totalVisits = Number(summary.total_visits || 0);
    const studentsTreated = Number(summary.students_treated ?? summary.student_visits ?? 0);
    const studentVisits = Number(summary.student_visits || 0);
    const facultyVisits = Number(summary.faculty_visits || 0);
    const staffVisits = Number(summary.staff_visits || 0);

    autoTable(doc, {
        startY: currentY,
        head: [["Total Visits", "Students Treated", "Student Visits", "Faculty Visits", "Staff Visits"]],
        body: [[
            String(totalVisits),
            String(studentsTreated),
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
        ]) : [["No specific complaints", "-", "-"]],
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
        head: [["Date", "Patient Name", "Type", "Department", "Reason / Symptoms", "Medicine", "Nurse"]],
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
            valign: "middle",
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 32 },
            2: { cellWidth: 16 },
            3: { cellWidth: 30 },
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

export interface MedicalCertificateData {
    patient_name: string;
    student_id?: string;
    role_label?: string;
    address?: string;
    visit_date: string;
    diagnosis?: string;
    reason?: string;
    symptoms?: string;
    temperature?: string | number;
    blood_pressure?: string;
    treatment?: string;
    rest_days?: string | number;
    remarks?: string;
    attending_nurse?: string;
}

/**
 * Export official Medical Certificate matching Philippine clinic standards
 * with official TCC logo in the upper right.
 */
export async function exportMedicalCertificatePDF(cert: MedicalCertificateData) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoData = await loadLogoDataUrl();

    // 1. Official Header with Logo on the Right Upper
    if (logoData) {
        doc.addImage(logoData, "PNG", pageWidth - 14 - 24, 12, 24, 24);
    }

    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Republic of the Philippines", 14, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(112, 9, 31); // TCC Burgundy
    doc.text("TAGOLOAN COMMUNITY COLLEGE", 14, 23);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("HEALTH SERVICES & CAMPUS CLINIC", 14, 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Baluarte, Tagoloan, Misamis Oriental · clinic@tcc.edu.ph", 14, 34);

    // Decorative Burgundy Accent Line
    doc.setDrawColor(112, 9, 31);
    doc.setLineWidth(1.2);
    doc.line(14, 42, pageWidth - 14, 42);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.4);
    doc.line(14, 43.5, pageWidth - 14, 43.5);

    // 2. Document Title (Centered & Bold)
    let y = 60;
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("MEDICAL CERTIFICATE", pageWidth / 2, y, { align: "center" });

    // 3. Date (Upper Right)
    y = 74;
    const issueDate = cert.visit_date ? formatDate(cert.visit_date) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Date: ${issueDate}`, pageWidth - 14, y, { align: "right" });

    // 4. Salutation
    y = 90;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("To Whom It May Concern:", 14, y);

    // 5. Certification Paragraph matching user's reference
    y = 104;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    const patientName = cert.patient_name || "the patient named herein";
    const patientAddress = cert.address && cert.address !== "N/A" ? cert.address : "Tagoloan, Misamis Oriental";
    const visitDateStr = cert.visit_date ? formatDate(cert.visit_date) : "the indicated consultation date";

    const p1 = `THIS IS TO CERTIFY that ${patientName} of ${patientAddress} was examined and treated at the Tagoloan Community College Health Services Clinic on ${visitDateStr} with the following diagnosis:`;
    
    const linesP1 = doc.splitTextToSize(p1, pageWidth - 28);
    doc.text(linesP1, 14, y);
    y += (linesP1.length * 6.5) + 10;

    // 6. Clinical Diagnosis Card / Underlined box
    const diagnosisText = cert.diagnosis || cert.symptoms || cert.reason || "Clinical Consultation & Treatment";
    const vitalsText = `Vital Signs: Temperature: ${formatTemperature(cert.temperature)}  |  Blood Pressure: ${formatNA(cert.blood_pressure)}`;

    doc.setFillColor(252, 250, 248);
    doc.setDrawColor(180, 150, 140);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(112, 9, 31);
    doc.text("DIAGNOSIS / FINDINGS:", 19, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(diagnosisText, 19, y + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(vitalsText, 19, y + 23);

    y += 40;

    // 7. Rest Period / Medical Attention Recommendation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    const restDays = cert.rest_days ? `${cert.rest_days} day(s)` : (cert.remarks || "one (1) day");
    const recommendation = `And would need medical attention / rest for ${restDays} barring complication.`;
    const linesRec = doc.splitTextToSize(recommendation, pageWidth - 28);
    doc.text(linesRec, 14, y);
    y += (linesRec.length * 6.5) + 6;

    if (cert.treatment && cert.treatment !== "N/A" && cert.treatment !== "-") {
        const treatText = `Treatment Provided: ${cert.treatment}`;
        const linesTreat = doc.splitTextToSize(treatText, pageWidth - 28);
        doc.text(linesTreat, 14, y);
        y += (linesTreat.length * 6.5) + 6;
    }

    // 8. Purpose Note
    y += 10;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Note: This certificate is issued upon the request of the patient for institutional / academic validation purposes only.", 14, y);

    // 9. Attending Nurse / Healthcare Officer Signature Block on the Bottom Right
    const sigY = pageHeight - 65;
    const sigX = pageWidth - 80;

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.6);
    doc.line(sigX, sigY, pageWidth - 14, sigY);

    const nurseName = cert.attending_nurse || "Angel Stacee Sabandal";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(nurseName, sigX + ((pageWidth - 14 - sigX) / 2), sigY + 5.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Attending Clinic Nurse", sigX + ((pageWidth - 14 - sigX) / 2), sigY + 10.5, { align: "center" });
    doc.text("Tagoloan Community College Clinic", sigX + ((pageWidth - 14 - sigX) / 2), sigY + 14.5, { align: "center" });

    // 10. Official Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text("TCC Health Services Clinic · Baluarte, Tagoloan, Misamis Oriental · Est. 2003", 14, pageHeight - 10);
    doc.text("Valid with Official Clinic Stamp", pageWidth - 14, pageHeight - 10, { align: "right" });

    const safeId = (cert.student_id || cert.patient_name || "Patient").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`TCC_Medical_Certificate_${safeId}.pdf`);
}

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
