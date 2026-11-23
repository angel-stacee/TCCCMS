import { useState, useEffect, type FormEventHandler } from "react";
import { UserPlus, X, AlertCircle, CheckCircle2, GraduationCap, Building2, Briefcase } from "lucide-react";
import api from "../../services/api";

interface QuickRegisterPatientModalProps {
    open: boolean;
    initialId: string;
    onClose: () => void;
    onSuccess: (patient: any, type: "student" | "faculty" | "staff") => void;
}

const COURSES = ["BSIT", "BSBA", "MidWifery", "BSHM", "BLIS", "BSED", "BSCRIM"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SEX_OPTIONS = ["Male", "Female"];

export function QuickRegisterPatientModal({
    open,
    initialId,
    onClose,
    onSuccess,
}: QuickRegisterPatientModalProps) {
    const [patientType, setPatientType] = useState<"student" | "faculty" | "staff">("student");
    const [formData, setFormData] = useState({
        student_id: initialId || "",
        first_name: "",
        middle_name: "",
        last_name: "",
        course: "BSIT",
        year_level: "1st Year",
        section: "1A",
        position: "Instructor I",
        department: "College of Information Technology (BSIT)",
        sex: "Male",
        birth_date: "2004-01-01",
        contact_number: "09",
        address: "Tagoloan, Misamis Oriental",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setFormData((prev) => ({
                ...prev,
                student_id: initialId || prev.student_id,
            }));
            setError("");
        }
    }, [open, initialId]);

    if (!open) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        const idVal = formData.student_id.trim();
        if (!idVal) {
            setError("ID number is required.");
            return;
        }

        if (patientType === "student") {
            if (!idVal.startsWith("20")) {
                setError("Student ID must start with 20 (e.g. 20241041).");
                return;
            }
            if (idVal.length > 8) {
                setError("Student ID cannot exceed 8 digits.");
                return;
            }
        }

        const phoneVal = formData.contact_number.trim();
        if (!/^09\d{9}$/.test(phoneVal)) {
            setError("Contact number must be an 11-digit number starting with 09 (e.g. 09123456789).");
            return;
        }

        setSaving(true);

        try {
            if (patientType === "student") {
                const payload = {
                    student_id: idVal,
                    first_name: formData.first_name.trim(),
                    middle_name: formData.middle_name.trim() || null,
                    last_name: formData.last_name.trim(),
                    course: formData.course,
                    year_level: formData.year_level,
                    section: formData.section.trim() || null,
                    sex: formData.sex,
                    birth_date: formData.birth_date,
                    contact_number: phoneVal,
                    address: formData.address.trim(),
                };

                const res = await api.post("/students", payload);
                const created = res.data?.student || res.data;
                onSuccess(created, "student");
            } else if (patientType === "faculty") {
                const payload = {
                    employee_id: idVal,
                    first_name: formData.first_name.trim(),
                    middle_name: formData.middle_name.trim() || null,
                    last_name: formData.last_name.trim(),
                    position: formData.position,
                    department: formData.department,
                    sex: formData.sex,
                    birth_date: formData.birth_date,
                    contact_number: phoneVal,
                    address: formData.address.trim(),
                };

                const res = await api.post("/faculties", payload);
                const created = res.data?.faculty || res.data;
                onSuccess(created, "faculty");
            } else {
                const payload = {
                    staff_id: idVal,
                    first_name: formData.first_name.trim(),
                    middle_name: formData.middle_name.trim() || null,
                    last_name: formData.last_name.trim(),
                    position: formData.position,
                    department: formData.department,
                    sex: formData.sex,
                    birth_date: formData.birth_date,
                    contact_number: phoneVal,
                    address: formData.address.trim(),
                };

                const res = await api.post("/staff", payload);
                const created = res.data?.staff || res.data;
                onSuccess(created, "staff");
            }
        } catch (err: any) {
            console.error("Patient registration error:", err);
            const msg =
                err.response?.data?.errors?.student_id?.[0] ||
                err.response?.data?.errors?.employee_id?.[0] ||
                err.response?.data?.errors?.staff_id?.[0] ||
                err.response?.data?.errors?.contact_number?.[0] ||
                err.response?.data?.message ||
                "Failed to register patient profile. Please verify all inputs.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1f1914] overflow-hidden my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-[#e8dfd4] bg-gradient-to-r from-[#70091f]/10 via-[#8b1505]/5 to-transparent px-6 py-4 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-white shadow-sm">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-stone-900 dark:text-white">
                                Register New Patient Profile
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                Create an official clinic record for ID: <span className="font-mono font-bold text-[#70091f] dark:text-[#f8a598]">{formData.student_id || initialId}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Patient Category Selector */}
                <div className="flex border-b border-stone-200 bg-stone-50 px-6 py-2.5 dark:border-stone-800 dark:bg-stone-900/50">
                    <div className="inline-flex rounded-xl bg-stone-200/80 p-1 text-xs font-semibold dark:bg-stone-800">
                        <button
                            type="button"
                            onClick={() => setPatientType("student")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                                patientType === "student"
                                    ? "bg-white text-[#70091f] shadow-xs dark:bg-stone-700 dark:text-white"
                                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                            }`}
                        >
                            <GraduationCap size={14} />
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => setPatientType("faculty")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                                patientType === "faculty"
                                    ? "bg-white text-[#70091f] shadow-xs dark:bg-stone-700 dark:text-white"
                                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                            }`}
                        >
                            <Building2 size={14} />
                            Faculty
                        </button>
                        <button
                            type="button"
                            onClick={() => setPatientType("staff")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                                patientType === "staff"
                                    ? "bg-white text-[#70091f] shadow-xs dark:bg-stone-700 dark:text-white"
                                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                            }`}
                        >
                            <Briefcase size={14} />
                            Staff
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* ID Number */}
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                {patientType === "student" ? "Student ID *" : patientType === "faculty" ? "Faculty Employee ID *" : "Staff ID *"}
                            </label>
                            <input
                                type="text"
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                required
                                placeholder={patientType === "student" ? "e.g. 20241041" : "e.g. EMP-2024"}
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-mono font-semibold text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                            {patientType === "student" && (
                                <p className="mt-1 text-[11px] text-stone-500">
                                    Must start with 20 and be up to 8 digits. Unique per student profile.
                                </p>
                            )}
                        </div>

                        {/* First Name */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Juan"
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>

                        {/* Middle Name */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Middle Name (Optional)
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                                placeholder="e.g. Santos"
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Dela Cruz"
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>

                        {/* Sex */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Sex *
                            </label>
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            >
                                {SEX_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Student specific: Course & Year Level */}
                        {patientType === "student" ? (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                        Course / Program *
                                    </label>
                                    <select
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                                    >
                                        {COURSES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                            Year Level *
                                        </label>
                                        <select
                                            name="year_level"
                                            value={formData.year_level}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                                        >
                                            {YEAR_LEVELS.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                            Section
                                        </label>
                                        <input
                                            type="text"
                                            name="section"
                                            value={formData.section}
                                            onChange={handleChange}
                                            placeholder="e.g. 1A"
                                            className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                        Position / Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Instructor I or Staff Aide"
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                        Department / Office *
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. College of Information Technology"
                                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                                    />
                                </div>
                            </>
                        )}

                        {/* Birth Date */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Birth Date *
                            </label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                required
                                max={new Date().toISOString().split("T")[0]}
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Contact Number *
                            </label>
                            <input
                                type="text"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                required
                                placeholder="09xxxxxxxxx"
                                maxLength={11}
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-mono font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>

                        {/* Address */}
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-bold text-stone-700 dark:text-stone-300">
                                Residential Address *
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Baluarte, Tagoloan, Misamis Oriental"
                                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#70091f]/30 transition hover:bg-[#8b1505] active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    <span>Registering Patient...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Register &amp; Proceed to Consultation</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
