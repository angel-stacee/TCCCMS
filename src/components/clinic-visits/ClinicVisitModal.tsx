import { useState, useEffect, useRef, useCallback, type FormEventHandler } from "react";
import { createPortal } from "react-dom";
import {
    Pill,
    Search,
    X,
    Stethoscope,
    ChevronDown,
    ChevronUp,
    Clock,
    AlertCircle,
    CheckCircle2,
    History,
    UserCheck,
    UserPlus,
    Loader2,
    RotateCcw,
    GraduationCap,
    Building2,
    Briefcase,
    Phone,
    MapPin,
    Calendar,
    Activity,
    ShieldCheck,
    QrCode,
} from "lucide-react";
import api from "../../services/api";
import type { VisitRecord } from "./ClinicVisitTable";
import { parseAndNormalizeTemperature, mapCourseToDepartment, formatDate } from "../../utils/formatters";
import { QuickRegisterPatientModal } from "./QuickRegisterPatientModal";

const TEMPERATURE_OPTIONS = [
    { value: "36.0 °C", label: "36.0 °C" },
    { value: "36.2 °C", label: "36.2 °C" },
    { value: "36.4 °C", label: "36.4 °C" },
    { value: "36.5 °C", label: "36.5 °C (Normal)" },
    { value: "36.6 °C", label: "36.6 °C" },
    { value: "36.7 °C", label: "36.7 °C" },
    { value: "36.8 °C", label: "36.8 °C" },
    { value: "36.9 °C", label: "36.9 °C" },
    { value: "37.0 °C", label: "37.0 °C" },
    { value: "37.1 °C", label: "37.1 °C" },
    { value: "37.2 °C", label: "37.2 °C" },
    { value: "37.3 °C", label: "37.3 °C" },
    { value: "37.4 °C", label: "37.4 °C" },
    { value: "37.5 °C", label: "37.5 °C (Low Grade Fever)" },
    { value: "37.6 °C", label: "37.6 °C" },
    { value: "37.7 °C", label: "37.7 °C" },
    { value: "37.8 °C", label: "37.8 °C" },
    { value: "37.9 °C", label: "37.9 °C" },
    { value: "38.0 °C", label: "38.0 °C (Fever)" },
    { value: "38.2 °C", label: "38.2 °C" },
    { value: "38.5 °C", label: "38.5 °C" },
    { value: "39.0 °C", label: "39.0 °C" },
];

const BLOOD_PRESSURE_OPTIONS = [
    { value: "120/80", label: "120/80 (Normal)" },
    { value: "110/70", label: "110/70" },
    { value: "110/80", label: "110/80" },
    { value: "120/70", label: "120/70" },
    { value: "120/75", label: "120/75" },
    { value: "120/85", label: "120/85" },
    { value: "130/80", label: "130/80 (Pre-hypertension)" },
    { value: "130/85", label: "130/85" },
    { value: "130/90", label: "130/90" },
    { value: "140/90", label: "140/90 (Hypertension Stage 1)" },
    { value: "140/95", label: "140/95" },
    { value: "150/90", label: "150/90" },
    { value: "150/100", label: "150/100 (Hypertension Stage 2)" },
    { value: "100/70", label: "100/70" },
    { value: "100/60", label: "100/60" },
    { value: "90/60", label: "90/60 (Low BP / Hypotension)" },
];

const REASON_OPTIONS = [
    "Fever",
    "Headache",
    "Stomachache",
    "Cough / Cold",
    "Dizziness",
    "Injury / Wound",
    "Body Pain",
    "Check-up",
    "First Aid",
    "Medication",
    "Medical Concern",
];

const SYMPTOMS_OPTIONS = [
    "Fever / Chills",
    "Headache / Migraine",
    "Stomachache / Abdominal Pain",
    "Cough and Colds",
    "Dizziness / Lightheadedness",
    "Nausea / Vomiting",
    "Dysmenorrhea (Menstrual Cramps)",
    "Sore Throat / Tonsillitis",
    "Open Wound / Laceration / Abrasion",
    "Sprain / Muscle Strain / Body Pain",
    "Toothache / Dental Pain",
    "Asthma / Difficulty Breathing",
    "Hyperventilation / Panic",
    "Eye Irritation / Redness",
    "Allergic Reaction / Skin Rash",
    "Fatigue / General Weakness",
    "Nosebleed (Epistaxis)",
    "Diarrhea / Loose Stool",
    "Chest Discomfort",
    "Fainting / Syncope",
];

const ASSESSMENT_OPTIONS = [
    "Normal Vital Signs / Mild Condition",
    "Febrile State / Suspected Viral Infection",
    "Acute Upper Respiratory Tract Infection (URTI)",
    "Acute Gastroenteritis / Indigestion",
    "Tension / Stress Headache",
    "Dysmenorrhea",
    "Minor Trauma / Abrasion / Wound",
    "Musculoskeletal Strain / Sprain",
    "Bronchial Asthma in Exacerbation",
    "Vasovagal Syncope / Fainting Episode",
    "Elevated Blood Pressure (Hypertension)",
    "Mild Allergic Reaction",
    "Dental Pain / Caries",
    "Hyperventilation Syndrome / Anxiety",
    "Under Observation in Clinic",
    "Referred to Hospital / Attending Physician",
];

const REMARKS_OPTIONS = [
    "Rested in clinic and returned to class",
    "Excused and sent home",
    "Medication administered; advised to rest",
    "First aid applied; advised to monitor",
    "Cold / warm compress applied",
    "Hydrated and vital signs stabilized",
    "Referred to hospital / emergency room",
    "Referred to private physician",
    "Parent / Guardian notified",
    "Advised to follow up tomorrow",
    "Patient refused medication / treatment",
];

interface PatientOption {
    id: string | number;
    type: "student" | "faculty" | "staff" | string;
    label: string;
    identifier: string;
    name: string;
}

interface ClinicVisitModalProps {
    showForm: boolean;
    closeForm: () => void;
    editingVisit: VisitRecord | null;
    formData: any;
    handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    loading: boolean;
    patientSearch: string;
    setPatientSearch: (value: string) => void;
    showPatientDropdown: boolean;
    setShowPatientDropdown: (value: boolean) => void;
    filteredPatients: PatientOption[];
    selectPatient: (patient: PatientOption) => void;
    nurses: any[];
    getNurseName: (nurse: any) => string;
    getToday: () => string;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    handleTreatmentChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    treatments: string[];
    treatmentNeedsMedicine: (treatment: string) => boolean;
    medicineSearch: string;
    setMedicineSearch: (value: string) => void;
    showMedicineDropdown: boolean;
    setShowMedicineDropdown: (value: boolean) => void;
    filteredMedicines: any[];
    selectMedicine: (medicine: any) => void;
    getMedicineName: (medicine: any) => string;
    getMedicineUnit: (medicine: any) => string;
    getMedicineStock: (medicine: any) => number;
    getMedicineTreatment: (medicine: any) => string;
    selectedMedicine: any;
    onPatientRegistered?: (patient: any, type: "student" | "faculty" | "staff") => void;
}

export function ClinicVisitModal({
    showForm,
    closeForm,
    editingVisit,
    formData,
    handleChange,
    handleSubmit,
    loading,
    patientSearch,
    setPatientSearch,
    showPatientDropdown,
    setShowPatientDropdown,
    filteredPatients,
    selectPatient,
    nurses,
    getNurseName,
    getToday,
    setFormData,
    handleTreatmentChange,
    treatments,
    treatmentNeedsMedicine,
    medicineSearch,
    setMedicineSearch,
    showMedicineDropdown,
    setShowMedicineDropdown,
    filteredMedicines,
    selectMedicine,
    getMedicineName,
    getMedicineUnit,
    getMedicineStock,
    getMedicineTreatment,
    selectedMedicine,
    onPatientRegistered,
}: ClinicVisitModalProps) {
    const [customFields, setCustomFields] = useState<Record<string, boolean>>({});
    const patientDropdownRef = useRef<HTMLDivElement>(null);
    const medicineDropdownRef = useRef<HTMLDivElement>(null);
    const idScanInputRef = useRef<HTMLInputElement>(null);

    // Patient Identification & Medical History States
    const [idScanInput, setIdScanInput] = useState("");
    const [identifying, setIdentifying] = useState(false);
    const [lookupStatus, setLookupStatus] = useState<"idle" | "found" | "not_found" | "error">("idle");
    const [identifiedPatient, setIdentifiedPatient] = useState<any | null>(null);
    const [searchedId, setSearchedId] = useState("");
    const [showMedicalHistory, setShowMedicalHistory] = useState(false);
    const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [idInputError, setIdInputError] = useState("");

    // Patient Lookup Function
    const handleIdLookup = useCallback(
        async (idToQuery: string) => {
            const cleanId = idToQuery.trim();
            if (!cleanId) {
                setIdInputError("Please enter or scan a Patient ID number.");
                return;
            }
            setIdInputError("");
            setIdentifying(true);
            setSearchedId(cleanId);

            try {
                const response = await api.get("/patients/lookup", {
                    params: { id: cleanId },
                });

                if (response.data && response.data.found && response.data.patient) {
                    const p = response.data.patient;
                    const pType = (response.data.type || "student") as "student" | "faculty" | "staff";
                    const enrichedPatient = { ...p, type: pType };
                    setIdentifiedPatient(enrichedPatient);
                    setLookupStatus("found");

                    // Connect new clinic visit to existing patient profile via foreign key
                    setFormData((prev: any) => ({
                        ...prev,
                        student_id: pType === "student" ? p.id : "",
                        faculty_id: pType === "faculty" ? p.id : "",
                        staff_id: pType === "staff" ? p.id : "",
                        department: p.course
                            ? mapCourseToDepartment(p.course)
                            : (p.department || prev.department || ""),
                    }));

                    setPatientSearch(`${p.student_id || p.identifier} - ${p.full_name || p.name}`);
                    setShowPatientDropdown(false);
                    setShowManualSearch(false);
                } else {
                    setIdentifiedPatient(null);
                    setLookupStatus("not_found");
                }
            } catch (err: any) {
                console.error("Patient lookup failed:", err);
                if (err.response?.status === 404 || err.response?.data?.found === false) {
                    setIdentifiedPatient(null);
                    setLookupStatus("not_found");
                } else {
                    setLookupStatus("error");
                }
            } finally {
                setIdentifying(false);
            }
        },
        [setFormData, setPatientSearch, setShowPatientDropdown]
    );

    // Initialize or sync state on modal open / edit
    useEffect(() => {
        if (!showForm) {
            setIdScanInput("");
            setLookupStatus("idle");
            setIdentifiedPatient(null);
            setSearchedId("");
            setShowMedicalHistory(false);
            setShowManualSearch(false);
            setIdInputError("");
            return;
        }

        if (editingVisit) {
            // When editing an existing visit, populate identified patient if available
            const student = editingVisit.student;
            const faculty = editingVisit.faculty;
            const staff = editingVisit.staff;

            const existingIdentifier = student?.student_id || faculty?.employee_id || staff?.staff_id;
            if (existingIdentifier) {
                setIdScanInput(existingIdentifier);
                handleIdLookup(existingIdentifier);
            }
        } else {
            // If new visit and form is empty, focus scanner input
            setTimeout(() => {
                idScanInputRef.current?.focus();
            }, 100);
        }
    }, [showForm, editingVisit, handleIdLookup]);

    // Handle Quick Register Success
    const handleQuickRegisterSuccess = (created: any, type: "student" | "faculty" | "staff") => {
        setQuickRegisterOpen(false);
        const fullName = `${created.first_name || ""} ${created.middle_name ? created.middle_name + " " : ""}${created.last_name || ""}`.trim();
        const enriched = {
            id: created.id,
            student_id: created.student_id,
            employee_id: created.employee_id,
            staff_id: created.staff_id,
            identifier: created.student_id || created.employee_id || created.staff_id || idScanInput,
            first_name: created.first_name,
            middle_name: created.middle_name,
            last_name: created.last_name,
            full_name: fullName,
            name: fullName,
            course: created.course,
            year_level: created.year_level,
            section: created.section,
            position: created.position,
            department: created.department || (created.course ? mapCourseToDepartment(created.course) : ""),
            sex: created.sex,
            birth_date: created.birth_date,
            contact_number: created.contact_number,
            address: created.address,
            total_visits: 0,
            medical_history: [],
            type,
        };

        setIdentifiedPatient(enriched);
        setLookupStatus("found");
        setFormData((prev: any) => ({
            ...prev,
            student_id: type === "student" ? created.id : "",
            faculty_id: type === "faculty" ? created.id : "",
            staff_id: type === "staff" ? created.id : "",
            department: enriched.department || prev.department || "",
        }));
        setPatientSearch(`${enriched.identifier} - ${enriched.full_name}`);
        setIdScanInput(enriched.identifier);

        if (onPatientRegistered) {
            onPatientRegistered(created, type);
        }
    };

    // Reset current patient to re-scan
    const handleResetPatient = () => {
        setIdentifiedPatient(null);
        setLookupStatus("idle");
        setIdScanInput("");
        setSearchedId("");
        setPatientSearch("");
        setShowMedicalHistory(false);
        setIdInputError("");
        setFormData((prev: any) => ({
            ...prev,
            student_id: "",
            faculty_id: "",
            staff_id: "",
        }));
        setTimeout(() => {
            idScanInputRef.current?.focus();
        }, 50);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                patientDropdownRef.current &&
                !patientDropdownRef.current.contains(event.target as Node)
            ) {
                setShowPatientDropdown(false);
            }
            if (
                medicineDropdownRef.current &&
                !medicineDropdownRef.current.contains(event.target as Node)
            ) {
                setShowMedicineDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setShowPatientDropdown, setShowMedicineDropdown]);

    if (!showForm) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-3 sm:p-5 md:p-6 backdrop-blur-[3px] overflow-y-auto"
            style={{ zIndex: 99999 }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    closeForm();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="visit-form-modal-title"
                className="relative my-auto flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-stone-200 dark:bg-[#1f1915] dark:border-[#382f25] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-[#382f25] dark:bg-[#1f1915]/95">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-[#dc667a]">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <h2
                                id="visit-form-modal-title"
                                className="text-lg font-bold text-stone-800 dark:text-stone-100"
                            >
                                {editingVisit ? "Edit Clinic Visit" : "Add New Clinic Visit"}
                            </h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                {editingVisit
                                    ? "Update patient visit details, vital signs, and treatment records."
                                    : "Record a new patient consultation, symptoms, and medical treatment."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeForm}
                        disabled={loading}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-[#2c221a] dark:hover:text-stone-200 cursor-pointer transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                        {/* 1. Automatic Patient Identification & Existing Record Section (Full width: md:col-span-2) */}
                        <div className="md:col-span-2 space-y-3">
                            {/* If Patient NOT yet identified and NOT in not_found state */}
                            {!identifiedPatient && lookupStatus !== "not_found" && (
                                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4.5 dark:border-[#382f25] dark:bg-[#251e18]/60 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-[#dc667a]">
                                                <QrCode size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                                    Automatic Patient Identification
                                                </h3>
                                                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                                    Scan barcode or enter Student ID to automatically verify existing records and prevent duplicates
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowManualSearch(!showManualSearch)}
                                            className="text-xs font-semibold text-[#70091f] hover:underline dark:text-[#dc667a] self-start sm:self-auto cursor-pointer"
                                        >
                                            {showManualSearch ? "← Switch to ID Scanner" : "Search by Name / Dropdown →"}
                                        </button>
                                    </div>

                                    {!showManualSearch ? (
                                        <div>
                                            <div className="flex items-stretch gap-2">
                                                <div className="relative flex-1">
                                                    <QrCode
                                                        size={18}
                                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                                                    />
                                                    <input
                                                        ref={idScanInputRef}
                                                        type="text"
                                                        value={idScanInput}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setIdScanInput(val);
                                                            setIdInputError("");
                                                            // Automatic scan trigger if 8 digits (standard student ID format)
                                                            if (val.trim().length === 8 && /^\d+$/.test(val.trim())) {
                                                                handleIdLookup(val.trim());
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleIdLookup(idScanInput);
                                                            }
                                                        }}
                                                        placeholder="Scan or enter Student ID (e.g. 20241407) and press Enter..."
                                                        className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                                    />
                                                    {idScanInput && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIdScanInput("");
                                                                setIdInputError("");
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleIdLookup(idScanInput)}
                                                    disabled={identifying || !idScanInput.trim()}
                                                    className="flex items-center gap-1.5 rounded-xl bg-[#70091f] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8b1505] disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
                                                >
                                                    {identifying ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            <span>Searching...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Search size={14} />
                                                            <span>Lookup ID</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {idInputError && (
                                                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                                    <AlertCircle size={13} />
                                                    {idInputError}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        /* Fallback Name Autocomplete Search */
                                        <div ref={patientDropdownRef} className="relative">
                                            <div className="relative">
                                                <Search
                                                    size={16}
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                                                />
                                                <input
                                                    type="text"
                                                    value={patientSearch}
                                                    onChange={(event) => {
                                                        const nextValue = event.target.value;
                                                        setPatientSearch(nextValue);
                                                        setShowPatientDropdown(true);
                                                    }}
                                                    onFocus={() => setShowPatientDropdown(true)}
                                                    placeholder="Type student, faculty, or staff name..."
                                                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-8 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                                />
                                                {patientSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPatientSearch("");
                                                        }}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {showPatientDropdown && (
                                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800">
                                                    {filteredPatients.length === 0 ? (
                                                        <div className="px-4 py-5 text-center text-xs text-stone-500">
                                                            No patient found matching search.
                                                        </div>
                                                    ) : (
                                                        filteredPatients.map((patient) => (
                                                            <button
                                                                key={`${patient.type}-${patient.id}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    selectPatient(patient);
                                                                    setIdScanInput(patient.identifier);
                                                                    handleIdLookup(patient.identifier);
                                                                }}
                                                                className="w-full border-b border-stone-100 px-4 py-2.5 text-left transition last:border-b-0 hover:bg-stone-50 dark:border-stone-700/60 dark:hover:bg-stone-700/50 cursor-pointer"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                                                            {patient.name}
                                                                        </p>
                                                                        <p className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-400">
                                                                            ID: {patient.identifier}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                                                                        {patient.label}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* If Patient ID was NOT found in database (Requirement 3) */}
                            {lookupStatus === "not_found" && (
                                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-5 dark:border-amber-800/80 dark:bg-amber-950/30 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200">
                                                <AlertCircle size={22} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                                                    No Existing Patient Record Found
                                                </h4>
                                                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                                    ID number <strong className="font-mono bg-amber-200/80 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-100">{searchedId}</strong> is not registered in the system.
                                                </p>
                                                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                                                    To ensure clinical record integrity and prevent future duplicates, register this patient profile first. Once saved, their record will immediately link to this clinic visit.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleResetPatient}
                                                className="rounded-xl border border-amber-300 bg-white/90 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-xs hover:bg-amber-100/60 dark:border-amber-800 dark:bg-stone-800 dark:text-amber-200 cursor-pointer"
                                            >
                                                Try Another ID
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickRegisterOpen(true)}
                                                className="flex items-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#70091f]/20 hover:bg-[#8b1505] transition cursor-pointer"
                                            >
                                                <UserPlus size={15} />
                                                <span>+ Register New Patient</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* If Patient IS IDENTIFIED (Requirement 1 & 4: Verified Existing Record Card + Medical History) */}
                            {identifiedPatient && (
                                <div className="rounded-2xl border-2 border-emerald-500/40 bg-white p-4.5 shadow-sm dark:border-emerald-500/30 dark:bg-[#1a231e]/50 animate-in fade-in duration-200">
                                    {/* Header / Verified Badge Row */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-stone-100 dark:border-stone-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                                        <ShieldCheck size={13} />
                                                        {identifiedPatient.total_visits > 0
                                                            ? "Existing Patient Record Verified"
                                                            : "New Registered Patient Profile Linked"}
                                                    </span>
                                                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                                        {identifiedPatient.student_id ? `Student ID: ${identifiedPatient.student_id}` : `ID: ${identifiedPatient.identifier}`}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                                                    {identifiedPatient.full_name || identifiedPatient.name}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                                <strong className="text-[#70091f] dark:text-[#dc667a] font-bold">
                                                    {identifiedPatient.total_visits}
                                                </strong>{" "}
                                                {identifiedPatient.total_visits === 1 ? "Past Consultation" : "Past Consultations"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={handleResetPatient}
                                                className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition cursor-pointer"
                                                title="Change patient or scan another ID"
                                            >
                                                <RotateCcw size={13} />
                                                <span>Change / Re-scan</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detailed Registered Demographic Information (Requirement 1) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-3.5 text-xs">
                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Course / Program
                                            </span>
                                            <p className="font-bold text-stone-800 dark:text-stone-200">
                                                {identifiedPatient.course || identifiedPatient.department || "N/A"}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Year & Section
                                            </span>
                                            <p className="font-bold text-stone-800 dark:text-stone-200">
                                                {identifiedPatient.year_level || "N/A"} {identifiedPatient.section ? `(${identifiedPatient.section})` : ""}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Sex / Gender
                                            </span>
                                            <p className="font-bold text-stone-800 dark:text-stone-200">
                                                {identifiedPatient.sex || "N/A"}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Birth Date & Age
                                            </span>
                                            <p className="font-bold text-stone-800 dark:text-stone-200">
                                                {identifiedPatient.birth_date ? formatDate(identifiedPatient.birth_date) : "N/A"}
                                                {identifiedPatient.age ? ` (${identifiedPatient.age} yrs)` : ""}
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Contact Number
                                            </span>
                                            <p className="font-bold text-stone-800 dark:text-stone-200">
                                                {identifiedPatient.contact_number || "N/A"}
                                            </p>
                                        </div>

                                        <div className="col-span-2 sm:col-span-2 lg:col-span-3">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                                                Address
                                            </span>
                                            <p className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                                                {identifiedPatient.address || "Tagoloan, Misamis Oriental"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collapsible Patient Consultation History (Requirement 4) */}
                                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                                        <button
                                            type="button"
                                            onClick={() => setShowMedicalHistory(!showMedicalHistory)}
                                            className="flex w-full items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800 transition cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <History size={15} className="text-[#70091f] dark:text-[#dc667a]" />
                                                <span>
                                                    Patient Medical & Consultation History ({identifiedPatient.total_visits} Records)
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-normal text-stone-500">
                                                {showMedicalHistory ? "Hide History" : "View History"}
                                                {showMedicalHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </span>
                                        </button>

                                        {showMedicalHistory && (
                                            <div className="mt-2.5 rounded-xl border border-stone-200 bg-stone-50/50 p-3 dark:border-stone-700/80 dark:bg-stone-900/40">
                                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/80 dark:border-stone-700/60 text-[11px] text-stone-500">
                                                    <span>Historical consultations are permanently preserved and read-only.</span>
                                                    <span className="font-bold text-[#70091f] dark:text-[#dc667a]">
                                                        Total Visits: {identifiedPatient.total_visits}
                                                    </span>
                                                </div>

                                                {(!identifiedPatient.medical_history || identifiedPatient.medical_history.length === 0) ? (
                                                    <p className="py-4 text-center text-xs text-stone-500 italic">
                                                        No previous consultation history recorded. This visit will be logged as Visit #1.
                                                    </p>
                                                ) : (
                                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                                        {identifiedPatient.medical_history.map((hist: any, index: number) => (
                                                            <div
                                                                key={hist.id || index}
                                                                className="rounded-lg border border-stone-200 bg-white p-3 text-xs dark:border-stone-700 dark:bg-stone-800/90 shadow-2xs"
                                                            >
                                                                <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Calendar size={13} className="text-stone-400" />
                                                                        {formatDate(hist.visit_date)}
                                                                    </span>
                                                                    <span className="text-[11px] font-semibold text-stone-500">
                                                                        Attending: {hist.nurse_name || "Nurse on duty"}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-100 dark:border-stone-700/60 text-[11px]">
                                                                    <div>
                                                                        <span className="text-stone-400">Reason:</span>{" "}
                                                                        <strong className="text-stone-800 dark:text-stone-200">{hist.reason || "N/A"}</strong>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-stone-400">Symptoms:</span>{" "}
                                                                        <span className="text-stone-700 dark:text-stone-300">{hist.symptoms || "None"}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-stone-400">Vitals:</span>{" "}
                                                                        <span className="text-stone-700 dark:text-stone-300">
                                                                            {hist.temperature || "N/A"} • {hist.blood_pressure || "N/A"}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-stone-400">Medicine:</span>{" "}
                                                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                                            {hist.medicine_name ? `${hist.medicine_name} (${hist.medicine_quantity || 1} ${hist.medicine_unit || "unit"})` : "None"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {(hist.assessment || hist.treatment || hist.remarks) && (
                                                                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-stone-100 dark:border-stone-700/40 text-[10.5px] text-stone-600 dark:text-stone-400 flex flex-wrap gap-x-4">
                                                                        {hist.assessment && <span><strong>Assessment:</strong> {hist.assessment}</span>}
                                                                        {hist.treatment && <span><strong>Treatment:</strong> {hist.treatment}</span>}
                                                                        {hist.remarks && <span><strong>Remarks:</strong> {hist.remarks}</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Nurse on Duty (Right) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Nurse on Duty
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <select
                                name="nurse_id"
                                value={formData.nurse_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Nurse on Duty</option>
                                {nurses.map((nurse) => (
                                    <option key={nurse.id} value={nurse.id}>
                                        {getNurseName(nurse)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Visit Date (Left) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Visit Date
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <input
                                type="date"
                                name="visit_date"
                                value={formData.visit_date}
                                onChange={handleChange}
                                min={!editingVisit ? getToday() : undefined}
                                required
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            />
                        </div>

                        {/* Department (Right) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Department
                            </label>

                            <input
                                type="text"
                                name="department"
                                value={formData.department || ""}
                                onChange={handleChange}
                                placeholder="e.g. College of Information Technology (BSIT)"
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            />
                            <p className="text-[10px] text-stone-400">
                                Auto-retrieved from patient record (editable)
                            </p>
                        </div>

                        {/* 4. Reason for Visit (Left) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Reason for Visit
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <select
                                value={
                                    customFields.reason
                                        ? "__custom__"
                                        : REASON_OPTIONS.includes(formData.reason)
                                        ? formData.reason
                                        : formData.reason
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, reason: true }));
                                        setFormData((prev: any) => ({ ...prev, reason: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, reason: false }));
                                        setFormData((prev: any) => ({ ...prev, reason: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                required
                            >
                                <option value="">Select Reason</option>
                                {REASON_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom reason)</option>
                            </select>
                            {(customFields.reason ||
                                (!REASON_OPTIONS.includes(formData.reason) && formData.reason)) && (
                                <input
                                    type="text"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={(event) =>
                                        setFormData((prev: any) => ({
                                            ...prev,
                                            reason: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter specific visit reason..."
                                    className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                    required
                                />
                            )}
                        </div>

                        {/* 5. Temperature (Left) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Temperature
                            </label>
                            <select
                                value={
                                    customFields.temperature
                                        ? "__custom__"
                                        : TEMPERATURE_OPTIONS.some((o) => o.value === formData.temperature)
                                        ? formData.temperature
                                        : formData.temperature
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, temperature: true }));
                                        setFormData((prev: any) => ({ ...prev, temperature: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, temperature: false }));
                                        setFormData((prev: any) => ({ ...prev, temperature: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Temperature</option>
                                {TEMPERATURE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom)</option>
                            </select>
                            {(customFields.temperature ||
                                (!TEMPERATURE_OPTIONS.some((o) => o.value === formData.temperature) &&
                                    formData.temperature)) && (
                                <>
                                    <input
                                        type="text"
                                        name="temperature"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                        onBlur={(event) => {
                                            const raw = event.target.value.trim();
                                            if (raw) {
                                                const normalized = parseAndNormalizeTemperature(raw);
                                                if (normalized) {
                                                    setFormData((prev: any) => ({
                                                        ...prev,
                                                        temperature: `${normalized} °C`,
                                                    }));
                                                }
                                            }
                                        }}
                                        placeholder="e.g. 36.5 °C or 98.6 °F"
                                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                    />
                                    <p className="text-[10px] text-stone-500 mt-0.5">
                                        Auto-standardized to °C. Fahrenheit (°F) converts automatically.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* 6. Blood Pressure (Right) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Blood Pressure
                            </label>
                            <select
                                value={
                                    customFields.blood_pressure
                                        ? "__custom__"
                                        : BLOOD_PRESSURE_OPTIONS.some((o) => o.value === formData.blood_pressure)
                                        ? formData.blood_pressure
                                        : formData.blood_pressure
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, blood_pressure: true }));
                                        setFormData((prev: any) => ({ ...prev, blood_pressure: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, blood_pressure: false }));
                                        setFormData((prev: any) => ({ ...prev, blood_pressure: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Blood Pressure</option>
                                {BLOOD_PRESSURE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom)</option>
                            </select>
                            {(customFields.blood_pressure ||
                                (!BLOOD_PRESSURE_OPTIONS.some((o) => o.value === formData.blood_pressure) &&
                                    formData.blood_pressure)) && (
                                <input
                                    type="text"
                                    name="blood_pressure"
                                    value={formData.blood_pressure}
                                    onChange={handleChange}
                                    placeholder="e.g. 120/80"
                                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            )}
                        </div>

                        {/* 7. Symptoms (Left) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Symptoms
                            </label>
                            <select
                                value={
                                    customFields.symptoms
                                        ? "__custom__"
                                        : SYMPTOMS_OPTIONS.includes(formData.symptoms)
                                        ? formData.symptoms
                                        : formData.symptoms
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, symptoms: true }));
                                        setFormData((prev: any) => ({ ...prev, symptoms: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, symptoms: false }));
                                        setFormData((prev: any) => ({ ...prev, symptoms: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Symptoms</option>
                                {SYMPTOMS_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom)</option>
                            </select>
                            {(customFields.symptoms ||
                                (!SYMPTOMS_OPTIONS.includes(formData.symptoms) && formData.symptoms)) && (
                                <input
                                    type="text"
                                    name="symptoms"
                                    value={formData.symptoms}
                                    onChange={handleChange}
                                    placeholder="Describe custom symptoms..."
                                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            )}
                        </div>

                        {/* 8. Assessment (Right) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Assessment
                            </label>
                            <select
                                value={
                                    customFields.assessment
                                        ? "__custom__"
                                        : ASSESSMENT_OPTIONS.includes(formData.assessment)
                                        ? formData.assessment
                                        : formData.assessment
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, assessment: true }));
                                        setFormData((prev: any) => ({ ...prev, assessment: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, assessment: false }));
                                        setFormData((prev: any) => ({ ...prev, assessment: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Assessment</option>
                                {ASSESSMENT_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom)</option>
                            </select>
                            {(customFields.assessment ||
                                (!ASSESSMENT_OPTIONS.includes(formData.assessment) && formData.assessment)) && (
                                <input
                                    type="text"
                                    name="assessment"
                                    value={formData.assessment}
                                    onChange={handleChange}
                                    placeholder="Describe custom assessment..."
                                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            )}
                        </div>

                        {/* 9. Treatment (Left) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Treatment
                            </label>

                            <select
                                name="treatment"
                                value={formData.treatment}
                                onChange={handleTreatmentChange}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Treatment</option>
                                {treatments.map((treatment) => (
                                    <option key={treatment} value={treatment}>
                                        {treatment}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 10. Medicine / Supply (Right) */}
                        <div ref={medicineDropdownRef} className="relative flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 text-sm font-bold text-stone-900 dark:text-stone-100">
                                    <Pill size={15} />
                                    Medicine / Supply
                                    {treatmentNeedsMedicine(formData.treatment) && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>

                                {formData.medicine_id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData((previous: any) => ({
                                                ...previous,
                                                medicine_id: "",
                                                medicine_quantity: "",
                                            }));
                                            setMedicineSearch("");
                                            setShowMedicineDropdown(false);
                                        }}
                                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Type-to-Search Medicine Input with Toggle */}
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                                />

                                <input
                                    type="text"
                                    value={medicineSearch || (selectedMedicine ? getMedicineName(selectedMedicine) : "")}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setMedicineSearch(nextValue);
                                        setShowMedicineDropdown(true);

                                        if (!nextValue.trim()) {
                                            setFormData((previous: any) => ({
                                                ...previous,
                                                medicine_id: "",
                                                medicine_quantity: "",
                                            }));
                                        }
                                    }}
                                    onFocus={() => setShowMedicineDropdown(true)}
                                    placeholder="Type to search medicine or supply..."
                                    required={treatmentNeedsMedicine(formData.treatment) && !formData.medicine_id}
                                    className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-14 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    {(medicineSearch || formData.medicine_id) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMedicineSearch("");
                                                setFormData((previous: any) => ({
                                                    ...previous,
                                                    medicine_id: "",
                                                    medicine_quantity: "",
                                                }));
                                                setShowMedicineDropdown(true);
                                            }}
                                            aria-label="Clear medicine search"
                                            className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
                                        aria-label="Toggle medicine dropdown"
                                        className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                                    >
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-200 ${
                                                showMedicineDropdown ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Dropdown Options List */}
                            {showMedicineDropdown && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-stone-50/95 px-3 py-1.5 text-[11px] font-bold text-stone-500 backdrop-blur-sm dark:border-stone-700/60 dark:bg-stone-800/95 dark:text-stone-400">
                                        <span>Select Medicine / Supply</span>
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                            {filteredMedicines.length} Available
                                        </span>
                                    </div>

                                    {filteredMedicines.length === 0 ? (
                                        <div className="px-4 py-5 text-center text-xs text-stone-500 dark:text-stone-400">
                                            No matching medicine or supply found.
                                        </div>
                                    ) : (
                                        filteredMedicines.map((medicine: any) => {
                                            const name = getMedicineName(medicine);
                                            const unit = getMedicineUnit(medicine);
                                            const stock = getMedicineStock(medicine);
                                            const outOfStock = stock <= 0;
                                            const isCurrentlySelected =
                                                String(formData.medicine_id) === String(medicine.id);
                                            const disableMedicine = outOfStock && !isCurrentlySelected;

                                            return (
                                                <button
                                                    key={medicine.id}
                                                    type="button"
                                                    disabled={disableMedicine}
                                                    onClick={() => {
                                                        selectMedicine(medicine);
                                                        setShowMedicineDropdown(false);
                                                    }}
                                                    className={`w-full border-b border-stone-100 px-3.5 py-2.5 text-left transition last:border-b-0 dark:border-stone-700/60 ${
                                                        disableMedicine
                                                            ? "cursor-not-allowed bg-stone-50/50 opacity-50 dark:bg-stone-900/30"
                                                            : isCurrentlySelected
                                                              ? "bg-amber-50 font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                                                              : "cursor-pointer hover:bg-amber-50/60 dark:hover:bg-stone-700/50"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-bold text-stone-800 dark:text-stone-100">
                                                                {name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone-500 dark:text-stone-400">
                                                                {medicine.expiration_date ? (
                                                                    <span className={`font-semibold ${
                                                                        medicine.expiration_status === "Expiring Soon"
                                                                            ? "text-amber-600 dark:text-amber-400 font-bold"
                                                                            : medicine.expiration_status === "Near Expiration"
                                                                            ? "text-yellow-700 dark:text-yellow-400"
                                                                            : "text-emerald-700 dark:text-emerald-400"
                                                                    }`}>
                                                                        Earliest Exp: {medicine.expiration_date} ({medicine.expiration_status || "Good"})
                                                                    </span>
                                                                ) : (
                                                                    <span>Standard inventory stock</span>
                                                                )}
                                                                {medicine.fefo_batch_number && (
                                                                    <span>• Batch: {medicine.fefo_batch_number}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0 text-right">
                                                            <span
                                                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                    outOfStock
                                                                        ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                                                        : stock <= 10
                                                                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                                                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                                }`}
                                                            >
                                                                {stock > 0
                                                                    ? `${stock} ${unit} left`
                                                                    : "Out of stock"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {selectedMedicine && (
                                <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                                                {getMedicineName(selectedMedicine)}
                                            </p>
                                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                                Available Unexpired Stock: <strong className="text-stone-800 dark:text-stone-200">{getMedicineStock(selectedMedicine)} {getMedicineUnit(selectedMedicine)}</strong>
                                            </p>
                                        </div>
                                        {selectedMedicine.expiration_status && (
                                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                                selectedMedicine.expiration_status === "Expiring Soon"
                                                    ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                                                    : selectedMedicine.expiration_status === "Near Expiration"
                                                    ? "bg-yellow-200 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-200"
                                                    : "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                                            }`}>
                                                {selectedMedicine.expiration_status}
                                                {selectedMedicine.days_until_expiration !== null && selectedMedicine.days_until_expiration !== undefined
                                                    ? ` (${selectedMedicine.days_until_expiration}d)`
                                                    : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* FEFO Priority Batch Indicator */}
                                    <div className="mt-2.5 rounded-lg border border-amber-300 bg-white/80 p-2.5 dark:border-amber-800 dark:bg-stone-900/60">
                                        <div className="flex items-start gap-2">
                                            <Clock size={15} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <div className="text-xs text-stone-700 dark:text-stone-300">
                                                <p className="font-bold text-amber-900 dark:text-amber-200">
                                                    FEFO Automatic Selection (First Expired, First Out)
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-stone-600 dark:text-stone-400">
                                                    Will give to patient: <strong className="text-stone-900 dark:text-stone-100">{selectedMedicine.fefo_batch_number || "Eligible Batch"}</strong>
                                                    {selectedMedicine.expiration_date ? ` (Expires: ${selectedMedicine.expiration_date})` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-2.5">
                                        <label className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                            Quantity Given to Patient
                                            <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="medicine_quantity"
                                            min="1"
                                            max={getMedicineStock(selectedMedicine)}
                                            value={formData.medicine_quantity}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter quantity to dispense"
                                            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                        />
                                        {formData.medicine_quantity && Number(formData.medicine_quantity) > Number(selectedMedicine.fefo_batch_quantity || 0) && Number(selectedMedicine.fefo_batch_quantity || 0) > 0 && (
                                            <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                                Notice: Requested ({formData.medicine_quantity}) exceeds batch stock ({selectedMedicine.fefo_batch_quantity}). Remaining {Number(formData.medicine_quantity) - Number(selectedMedicine.fefo_batch_quantity)} will automatically be issued from next nearest expiring batch.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 11. Remarks (Full width md:col-span-2) */}
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                Remarks
                            </label>
                            <select
                                value={
                                    customFields.remarks
                                        ? "__custom__"
                                        : REMARKS_OPTIONS.includes(formData.remarks)
                                        ? formData.remarks
                                        : formData.remarks
                                        ? "__custom__"
                                        : ""
                                }
                                onChange={(event) => {
                                    const val = event.target.value;
                                    if (val === "__custom__") {
                                        setCustomFields((prev) => ({ ...prev, remarks: true }));
                                        setFormData((prev: any) => ({ ...prev, remarks: "" }));
                                    } else {
                                        setCustomFields((prev) => ({ ...prev, remarks: false }));
                                        setFormData((prev: any) => ({ ...prev, remarks: val }));
                                    }
                                }}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                            >
                                <option value="">Select Remarks</option>
                                {REMARKS_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                                <option value="__custom__">Other (Type custom)</option>
                            </select>
                            {(customFields.remarks ||
                                (!REMARKS_OPTIONS.includes(formData.remarks) && formData.remarks)) && (
                                <input
                                    type="text"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    placeholder="Enter custom remarks..."
                                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            )}
                        </div>
                    </div>
                    </div>

                    {/* Divider and Action Buttons pinned at bottom */}
                    <div className="flex shrink-0 items-center justify-between border-t border-stone-200 bg-stone-50/90 px-6 py-4 backdrop-blur-sm dark:border-[#382f25] dark:bg-[#171310]">
                        <div className="flex items-center gap-2">
                            {!formData.student_id && !formData.faculty_id && !formData.staff_id && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    <AlertCircle size={14} />
                                    <span>Scan or verify patient identity before saving</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={loading}
                                className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-xs transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50 dark:border-stone-700 dark:bg-[#251e18] dark:text-stone-300 dark:hover:bg-[#302720] cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading || (!formData.student_id && !formData.faculty_id && !formData.staff_id)}
                                className="flex items-center gap-2 rounded-xl bg-[#70091f] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving Consultation Record...</span>
                                    </>
                                ) : editingVisit ? (
                                    "Update Clinic Visit"
                                ) : (
                                    "Save Clinic Visit"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Quick Register Patient Modal Integration */}
            <QuickRegisterPatientModal
                open={quickRegisterOpen}
                initialId={searchedId || idScanInput}
                onClose={() => setQuickRegisterOpen(false)}
                onSuccess={handleQuickRegisterSuccess}
            />
        </div>,
        document.body
    );
}

