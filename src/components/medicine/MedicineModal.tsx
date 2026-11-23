import { useState, useRef, useMemo, useEffect, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Pill, AlertTriangle, CheckCircle2, Calendar, AlertOctagon, X, Clock, Layers, Truck, Search } from "lucide-react";

export interface MedicineFormData {
    medicine_name: string;
    treatment_type: string;
    expiration_date: string;
    unit: string;
    stock: string | number;
    minimum_stock: string | number;
    description: string;
    batch_number?: string;
    date_added?: string;
    supplier?: string;
    remarks?: string;
}

export interface MedicineItem {
    id: number | string;
    medicine_name: string;
    treatment_type?: string;
    expiration_date?: string | null;
    unit?: string;
    stock?: number | string | null;
    minimum_stock?: number | string | null;
    description?: string | null;
    batch_number?: string | null;
    supplier?: string | null;
    remarks?: string | null;
}

interface MedicineModalProps {
    showForm: boolean;
    closeForm: () => void;
    editingMedicine: MedicineItem | null;
    form: MedicineFormData;
    handleChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    saving: boolean;
    error: string;
    treatmentTypes?: string[];
    existingMedicines?: any[];
    onSelectMedicineTemplate?: (item: any) => void;
}

const DEFAULT_TREATMENT_TYPES = [
    "First Aid",
    "Medication",
    "Wound Care",
    "Cold Compress",
    "Hot Compress",
];

const UNIT_OPTIONS = [
    "Tablet",
    "Capsule",
    "Bottle",
    "Sachet",
    "Tube",
    "Piece",
    "Box",
    "Vial",
    "Ampoule",
];

const PHILIPPINE_CLINIC_MEDICINES = [
    { medicine_name: "Diphenhydramine 25mg", treatment_type: "Medication", unit: "Capsule", minimum_stock: "20", description: "Antihistamine for allergic reactions, hives, and motion sickness" },
    { medicine_name: "Diphenhydramine 50mg", treatment_type: "Medication", unit: "Capsule", minimum_stock: "20", description: "Antihistamine / sedative for severe allergy" },
    { medicine_name: "Paracetamol 500mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "50", description: "Analgesic and antipyretic for fever, headache, and body aches" },
    { medicine_name: "Biogesic 500mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "50", description: "Paracetamol brand for fever and headache relief" },
    { medicine_name: "Ibuprofen 200mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Nonsteroidal anti-inflammatory drug (NSAID) for toothache, dysmenorrhea" },
    { medicine_name: "Ibuprofen 400mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "NSAID for moderate to severe pain and inflammation" },
    { medicine_name: "Mefenamic Acid 500mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "NSAID for toothache, muscle pain, and severe menstrual pain" },
    { medicine_name: "Cetirizine 10mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Non-drowsy antihistamine for rhinitis, itching, and allergic symptoms" },
    { medicine_name: "Loperamide 2mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "25", description: "Antidiarrheal agent for acute diarrhea relief" },
    { medicine_name: "Antacid (Al(OH)3 + Mg(OH)2)", treatment_type: "Medication", unit: "Tablet", minimum_stock: "40", description: "Chewable antacid for hyperacidity, acid reflux, heartburn, and stomach pain" },
    { medicine_name: "Kremil-S", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Antacid + simethicone for upset stomach, gas, and ulcer symptoms" },
    { medicine_name: "Neozep Forte", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Decongestant + paracetamol + antihistamine for cold and nasal congestion" },
    { medicine_name: "Bioflu", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Multi-symptom relief for flu, body aches, fever, and nasal congestion" },
    { medicine_name: "Decolgen Forte", treatment_type: "Medication", unit: "Tablet", minimum_stock: "30", description: "Relief of clogged nose, runny nose, and headache" },
    { medicine_name: "Buscopan 10mg (Hyoscine-N-butylbromide)", treatment_type: "Medication", unit: "Tablet", minimum_stock: "20", description: "Antispasmodic for abdominal cramps, stomach spasms, and dysmenorrhea" },
    { medicine_name: "Oral Rehydration Salts (ORS)", treatment_type: "Medication", unit: "Sachet", minimum_stock: "30", description: "Electrolyte replacement for dehydration caused by diarrhea or heat exhaustion" },
    { medicine_name: "Ascorbic Acid (Vitamin C 500mg)", treatment_type: "Medication", unit: "Tablet", minimum_stock: "50", description: "Daily immune system booster and antioxidant" },
    { medicine_name: "Amoxicillin 500mg", treatment_type: "Medication", unit: "Capsule", minimum_stock: "20", description: "Antibiotic for bacterial infections (prescription required)" },
    { medicine_name: "Salbutamol 2mg", treatment_type: "Medication", unit: "Tablet", minimum_stock: "20", description: "Bronchodilator for asthma and bronchospasm relief" },
    { medicine_name: "Betadine (Povidone Iodine 10%)", treatment_type: "Wound Care", unit: "Bottle", minimum_stock: "10", description: "Topical antiseptic solution for cleaning cuts, abrasions, and wounds" },
    { medicine_name: "70% Isopropyl Alcohol", treatment_type: "First Aid", unit: "Bottle", minimum_stock: "15", description: "Antiseptic and disinfectant for skin sanitization" },
    { medicine_name: "Hydrogen Peroxide 3%", treatment_type: "Wound Care", unit: "Bottle", minimum_stock: "10", description: "Antiseptic cleansing agent for minor abrasions" },
    { medicine_name: "Burn Ointment (Silver Sulfadiazine)", treatment_type: "Wound Care", unit: "Tube", minimum_stock: "5", description: "Topical antimicrobial cream for 1st and 2nd-degree burns" },
    { medicine_name: "Calamine Lotion", treatment_type: "First Aid", unit: "Bottle", minimum_stock: "10", description: "Soothing anti-itch lotion for rashes, insect bites, and contact dermatitis" },
    { medicine_name: "Adhesive Bandages (Band-Aid)", treatment_type: "First Aid", unit: "Piece", minimum_stock: "100", description: "Sterile strip adhesive bandages for minor cuts and finger injuries" },
    { medicine_name: "Sterile Gauze Pads (4x4)", treatment_type: "First Aid", unit: "Piece", minimum_stock: "50", description: "Sterile non-adherent dressing pads for wound coverage" },
    { medicine_name: "Cotton Balls", treatment_type: "First Aid", unit: "Pack", minimum_stock: "20", description: "Absorbent cotton balls for cleaning skin and applying antiseptic" },
    { medicine_name: "Micropore Surgical Tape", treatment_type: "First Aid", unit: "Piece", minimum_stock: "10", description: "Hypoallergenic paper tape for securing dressings" },
    { medicine_name: "Elastic Bandage (2 inch)", treatment_type: "First Aid", unit: "Piece", minimum_stock: "10", description: "Compression bandage for sprains, strains, and joint support" },
    { medicine_name: "Cooling Gel Fever Patch", treatment_type: "Cold Compress", unit: "Pack", minimum_stock: "25", description: "Forehead cooling sheet for reducing body temperature during fever" },
    { medicine_name: "Instant Cold Pack", treatment_type: "Cold Compress", unit: "Pack", minimum_stock: "15", description: "Chemical cold pack for acute sprains, bruises, and swelling reduction" },
    { medicine_name: "Hot Water Bag / Heat Pack", treatment_type: "Hot Compress", unit: "Piece", minimum_stock: "10", description: "Reusable warm compress for menstrual cramps, muscle tension, and stiff neck" },
];

export function MedicineModal({
    showForm,
    closeForm,
    editingMedicine,
    form,
    handleChange,
    handleSubmit,
    saving,
    error,
    treatmentTypes = DEFAULT_TREATMENT_TYPES,
    existingMedicines = [],
    onSelectMedicineTemplate,
}: MedicineModalProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter out "All" if it was passed in treatmentTypes
    const availableTreatments = treatmentTypes.filter((t) => t !== "All");

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Autocomplete suggestions based on query
    const suggestions = useMemo(() => {
        const query = (form.medicine_name || "").toLowerCase().trim();
        if (!query) return [];

        const combined = [...existingMedicines, ...PHILIPPINE_CLINIC_MEDICINES];
        const seen = new Set<string>();
        const list: any[] = [];

        for (const item of combined) {
            const name = item.medicine_name || "";
            const nameLower = name.toLowerCase();
            if (!seen.has(nameLower) && nameLower.includes(query)) {
                seen.add(nameLower);
                list.push(item);
                if (list.length >= 8) break;
            }
        }
        return list;
    }, [form.medicine_name, existingMedicines]);

    const handleChooseMedicine = (item: any) => {
        if (onSelectMedicineTemplate) {
            onSelectMedicineTemplate(item);
        } else {
            handleChange({
                target: { name: "medicine_name", value: item.medicine_name },
            } as any);
            if (item.treatment_type) {
                handleChange({
                    target: { name: "treatment_type", value: item.treatment_type },
                } as any);
            }
            if (item.unit) {
                handleChange({
                    target: { name: "unit", value: item.unit },
                } as any);
            }
            if (item.minimum_stock !== undefined) {
                handleChange({
                    target: { name: "minimum_stock", value: String(item.minimum_stock) },
                } as any);
            }
            if (item.description) {
                handleChange({
                    target: { name: "description", value: item.description },
                } as any);
            }
        }
        setShowDropdown(false);
    };

    if (!showForm) return null;

    // Live preview of stock status
    const currentStock = Number(form.stock || 0);
    const minStock = Number(form.minimum_stock || 0);
    const isOutOfStock = form.stock !== "" && currentStock <= 0;
    const isLowStock = !isOutOfStock && form.stock !== "" && currentStock <= minStock;

    // Detect if medicine with identical name already exists in inventory
    const matchedExistingMedicine = useMemo(() => {
        if (editingMedicine) return null;
        const query = (form.medicine_name || "").toLowerCase().trim();
        if (!query) return null;
        return (existingMedicines || []).find(
            (m: any) => (m.medicine_name || "").toLowerCase().trim() === query
        );
    }, [form.medicine_name, existingMedicines, editingMedicine]);

    // Live preview of 4-Tier expiration status:
    // Expired (< 0 days)
    // Expiring Soon (0 - 30 days)
    // Near Expiration (31 - 90 days)
    // Good (> 90 days)
    let isExpired = false;
    let isExpiringSoon = false;
    let isNearExpiration = false;
    let isGood = false;
    let daysUntilExp: number | null = null;

    if (form.expiration_date) {
        const exp = new Date(form.expiration_date);
        exp.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        daysUntilExp = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExp < 0) {
            isExpired = true;
        } else if (daysUntilExp <= 30) {
            isExpiringSoon = true;
        } else if (daysUntilExp <= 90) {
            isNearExpiration = true;
        } else {
            isGood = true;
        }
    }

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-3 sm:p-5 md:p-6 backdrop-blur-[3px] overflow-y-auto"
            style={{ zIndex: 99999 }}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    closeForm();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="medicine-modal-title"
                className="relative my-auto flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-[#382f25] dark:bg-[#1f1915] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-[#382f25] dark:bg-[#1f1915]/95">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-[#dc667a]">
                            <Pill size={20} />
                        </div>
                        <div>
                            <h2
                                id="medicine-modal-title"
                                className="text-lg font-bold text-stone-800 dark:text-stone-100"
                            >
                                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                            </h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                {editingMedicine
                                    ? "Update medicine information, expiration date, and inventory levels."
                                    : "Enter medicine and batch details to add to clinic inventory with FEFO tracking."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeForm}
                        disabled={saving}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-[#2c221a] dark:hover:text-stone-200 cursor-pointer transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        {/* FEFO Rule Notice Banner */}
                        <div className="rounded-xl border border-[#eedecb] bg-[#fdfbf7] p-3 text-xs text-[#524436] dark:border-stone-800 dark:bg-[#27201a] dark:text-stone-300">
                            <div className="flex items-center gap-2 font-bold text-[#70091f] dark:text-[#f8a598]">
                                <Clock size={15} />
                                Automatic FEFO (First Expired, First Out) Issuing
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#766959] dark:text-stone-400">
                                The system tracks stocks by expiration date and will automatically issue the batch closest to expiring first when given to a patient. Expired batches cannot be dispensed.
                            </p>
                        </div>

                        {/* Existing Medicine Detected Banner - Informs user stock will be combined */}
                        {matchedExistingMedicine && (
                            <div className="rounded-xl border border-blue-300 bg-blue-50/90 p-3.5 text-xs text-blue-900 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
                                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                                    <Layers size={16} />
                                    <span>Existing Medicine Found • Stock will be Combined</span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-blue-800 dark:text-blue-200/90">
                                    <strong>{matchedExistingMedicine.medicine_name}</strong> already exists with <strong>{matchedExistingMedicine.stock} {matchedExistingMedicine.unit || "unit(s)"}</strong> in inventory.
                                    Adding this new batch will combine total stock to <strong>{(Number(matchedExistingMedicine.stock || 0) + Number(form.stock || 0)).toLocaleString()} {form.unit}</strong> without creating duplicate rows.
                                </p>
                            </div>
                        )}

                        {/* Expiration Warning Banner if expired or expiring soon */}
                        {isExpired && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                <AlertOctagon size={17} className="shrink-0 text-red-600" />
                                <span>
                                    <strong>Expired:</strong> This batch expired {Math.abs(daysUntilExp || 0)} day(s) ago. Expired medicines will be automatically excluded from stock issuing.
                                </span>
                            </div>
                        )}

                        {isExpiringSoon && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                                <AlertTriangle size={17} className="shrink-0 text-amber-600" />
                                <span>
                                    <strong>Expiring Soon:</strong> This medicine will expire in {daysUntilExp} day(s). It will be prioritized for dispensing to patients first under FEFO.
                                </span>
                            </div>
                        )}

                        {/* 2-Column Fields Grid */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* 1. Medicine Name (Left) with Autocomplete Dropdown */}
                            <div className="relative flex flex-col gap-1" ref={dropdownRef}>
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Medicine Name
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="medicine_name"
                                        value={form.medicine_name}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => {
                                            if (form.medicine_name.trim()) {
                                                setShowDropdown(true);
                                            }
                                        }}
                                        autoComplete="off"
                                        placeholder="Type to search or enter medicine name..."
                                        required
                                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                    />
                                    {form.medicine_name && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleChange({ target: { name: "medicine_name", value: "" } } as any);
                                                setShowDropdown(false);
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Autocomplete Dropdown */}
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl dark:border-stone-700 dark:bg-[#251f19]">
                                        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                            <span>Matching Medicines</span>
                                            <span>{suggestions.length} found</span>
                                        </div>
                                        {suggestions.map((item, idx) => (
                                            <button
                                                key={`${item.medicine_name}-${idx}`}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleChooseMedicine(item);
                                                }}
                                                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-[#70091f]/5 hover:text-[#70091f] dark:hover:bg-[#70091f]/20 dark:hover:text-[#f8a598] cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Pill size={14} className="text-[#70091f] dark:text-[#f8a598] shrink-0" />
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-stone-800 dark:text-stone-100 truncate block">
                                                            {item.medicine_name}
                                                        </span>
                                                        {item.description && (
                                                            <p className="line-clamp-1 text-[10px] text-stone-400">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {item.treatment_type && (
                                                        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                            {item.treatment_type}
                                                        </span>
                                                    )}
                                                    {item.unit && (
                                                        <span className="text-[10px] text-stone-400">
                                                            {item.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Treatment Type (Right) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Treatment Type
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <select
                                    name="treatment_type"
                                    value={form.treatment_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                >
                                    {availableTreatments.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Batch Number (Left) */}
                            <div className="flex flex-col gap-1">
                                <label className="flex items-center justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
                                    <span className="flex items-center gap-1.5">
                                        <Layers size={14} className="text-stone-400" />
                                        Batch Number
                                    </span>
                                    <span className="text-xs text-stone-400">Optional</span>
                                </label>
                                <input
                                    type="text"
                                    name="batch_number"
                                    value={form.batch_number || ""}
                                    onChange={handleChange}
                                    placeholder="Auto-generated if left blank"
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 4. Date Added (Right) */}
                            <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
                                    <Calendar size={14} className="text-stone-400" />
                                    Date Added
                                </label>
                                <input
                                    type="date"
                                    name="date_added"
                                    value={form.date_added || new Date().toISOString().split("T")[0]}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 5. Expiration Date (Left) */}
                            <div className="flex flex-col gap-1">
                                <label className="flex items-center justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-stone-400" />
                                        Expiration Date
                                    </span>
                                    {isExpired ? (
                                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                                            Expired
                                        </span>
                                    ) : isExpiringSoon ? (
                                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                            Expiring Soon ({daysUntilExp}d)
                                        </span>
                                    ) : isNearExpiration ? (
                                        <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400">
                                            Near Expiration ({daysUntilExp}d)
                                        </span>
                                    ) : isGood ? (
                                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                            Good ({daysUntilExp}d)
                                        </span>
                                    ) : null}
                                </label>
                                <input
                                    type="date"
                                    name="expiration_date"
                                    value={form.expiration_date || ""}
                                    onChange={handleChange}
                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 dark:bg-stone-800 dark:text-stone-100 ${
                                        isExpired
                                            ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-800"
                                            : isExpiringSoon
                                            ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100 dark:border-amber-800"
                                            : isNearExpiration
                                            ? "border-yellow-400 focus:border-yellow-500 focus:ring-yellow-100 dark:border-yellow-800"
                                            : "border-stone-300 focus:border-amber-500 focus:ring-amber-100 dark:border-stone-700"
                                    }`}
                                />
                            </div>

                            {/* 6. Unit of Measure (Right) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Unit of Measure
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                >
                                    {UNIT_OPTIONS.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 7. Stock (Left) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    {editingMedicine ? "Current Stock" : "Initial Stock Quantity"}
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="0"
                                    required
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 8. Minimum Stock (Right) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Minimum Stock (Alert Level)
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="minimum_stock"
                                    min="0"
                                    value={form.minimum_stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    required
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 9. Supplier (Optional) */}
                            <div className="flex flex-col gap-1">
                                <label className="flex items-center justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
                                    <span className="flex items-center gap-1.5">
                                        <Truck size={14} className="text-stone-400" />
                                        Supplier / Source
                                    </span>
                                    <span className="text-xs text-stone-400">Optional</span>
                                </label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={form.supplier || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. DOH / Rural Health Unit"
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 10. Remarks (Optional) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Stock Remarks
                                    <span className="ml-1 text-xs font-normal text-stone-400">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="remarks"
                                    value={form.remarks || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Batch donation, sealed box"
                                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>

                            {/* 11. Live 4-Tier Status Overview (Full width) */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Status Overview & FEFO Priority
                                </label>
                                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs dark:border-stone-800 dark:bg-stone-800/50">
                                    {/* Stock Status badge */}
                                    {isOutOfStock ? (
                                        <div className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                                            <AlertTriangle size={15} />
                                            <span>Out of Stock</span>
                                        </div>
                                    ) : isLowStock ? (
                                        <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                            <AlertTriangle size={15} />
                                            <span>Low Stock</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 size={15} />
                                            <span>In Stock</span>
                                        </div>
                                    )}

                                    <span className="text-stone-300 dark:text-stone-700">|</span>

                                    {/* 4-Tier Expiration status badge */}
                                    {isExpired ? (
                                        <div className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                                            <AlertOctagon size={15} />
                                            <span>Expired ({Math.abs(daysUntilExp || 0)}d ago) • Excluded from Issuing</span>
                                        </div>
                                    ) : isExpiringSoon ? (
                                        <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                                            <Clock size={15} />
                                            <span>Expiring Soon ({daysUntilExp}d left) • Priority 1 for Patient</span>
                                        </div>
                                    ) : isNearExpiration ? (
                                        <div className="flex items-center gap-1.5 font-semibold text-yellow-800 dark:text-yellow-400">
                                            <Clock size={15} />
                                            <span>Near Expiration ({daysUntilExp}d left) • Priority 2 for Patient</span>
                                        </div>
                                    ) : isGood ? (
                                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            <CheckCircle2 size={15} />
                                            <span>Good ({daysUntilExp}d left before expiration)</span>
                                        </div>
                                    ) : (
                                        <span className="text-stone-400">No expiration date set</span>
                                    )}
                                </div>
                            </div>

                            {/* 12. Description (Full width across 2 columns) */}
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Description / Usage Notes
                                    <span className="ml-1 text-xs font-normal text-stone-400">
                                        (Optional)
                                    </span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Indications, dosage directions, or storage instructions..."
                                    className="w-full resize-none rounded-lg border border-stone-300 bg-white p-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider and Action Buttons matching reference layout */}
                    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-stone-200 bg-stone-50/90 px-6 py-4 backdrop-blur-sm dark:border-[#382f25] dark:bg-[#171310]">
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-xs transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50 dark:border-stone-700 dark:bg-[#251e18] dark:text-stone-300 dark:hover:bg-[#302720]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-[#70091f] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? (editingMedicine ? "Updating Medicine..." : matchedExistingMedicine ? "Adding Batch & Combining..." : "Adding Medicine...")
                                : editingMedicine
                                ? "Update Medicine"
                                : matchedExistingMedicine
                                ? "Add Batch & Combine Stock"
                                : "Add Medicine"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
