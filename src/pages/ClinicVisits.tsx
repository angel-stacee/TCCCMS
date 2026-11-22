import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Stethoscope,
    Pencil,
    Trash2,
    Search,
    UserRound,
    Activity,
    Plus,
    X,
    Pill,
    CalendarDays,
    CircleHelp,
    CheckCircle2,
    FileBadge,
    FileText,
    RotateCcw,
} from "lucide-react";
import api from "../services/api";
import { getCachedRecord } from "../services/recordCache";
import { ClinicVisitTable, type VisitRecord } from "../components/clinic-visits/ClinicVisitTable";
import { ClinicVisitModal } from "../components/clinic-visits/ClinicVisitModal";
import { RestoreVisitsModal } from "../components/clinic-visits/RestoreVisitsModal";
import FloatingToast from "../components/common/FloatingToast";
import { addClinicNotification } from "../services/notifications";
import { formatNA, formatTemperature, formatDate, mapCourseToDepartment } from "../utils/formatters";
import { exportMedicalCertificatePDF } from "../utils/pdfExport";
import { InfoItem, Modal, RecordSection } from "../components/student-management/FieldsAndModals";
import { ReasonBadge } from "../utils/reasonColors";

const EMPTY_FORM = {
    student_id: "",
    faculty_id: "",
    staff_id: "",
    nurse_id: "",
    department: "",
    visit_date: "",
    reason: "",
    symptoms: "",
    temperature: "",
    blood_pressure: "",
    assessment: "",
    treatment: "",
    medicine_id: "",
    medicine_quantity: "",
    remarks: "",
};

const TREATMENTS = [
    "First Aid",
    "Medication",
    "Wound Care",
    "Cold Compress",
    "Hot Compress",
    "Observation",
    "Referral",
    "Other",
];

const normalizeVisitDateSearch = (value) => {
    const usDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
    const parts = usDate
        ? [Number(usDate[3]), Number(usDate[1]), Number(usDate[2])]
        : isoDate
          ? [Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3])]
          : null;

    if (!parts) return "";

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day, 12);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};







const TREATMENTS_WITH_MEDICINE = [
    "First Aid",
    "Medication",
    "Wound Care",
    "Cold Compress",
    "Hot Compress",
];







const treatmentNeedsMedicine = (treatment: string) => {
    return TREATMENTS_WITH_MEDICINE.includes(treatment);
};

function ClinicVisits() {
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [visitPagination, setVisitPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 25,
    });
    const [students, setStudents] = useState([]);
    const [studentTotal, setStudentTotal] = useState(0);
    const [facultyStaffTotal, setFacultyStaffTotal] = useState(0);
    const [faculties, setFaculties] = useState([]);
    const [staff, setStaff] = useState([]);
    const [nurses, setNurses] = useState([]);
    const [medicines, setMedicines] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [viewingVisit, setViewingVisit] = useState<VisitRecord | null>(null);
    const [deleteVisit, setDeleteVisit] = useState<VisitRecord | null>(null);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "delete" | "info" | "error" | "warning">("info");
    const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | undefined>(undefined);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    const [medicalReportTarget, setMedicalReportTarget] = useState<{
        patient: any;
        type: "student" | "faculty" | "staff";
        visit?: any;
    } | null>(null);
    const [medicalReportData, setMedicalReportData] = useState<any | null>(null);
    const [loadingMedicalReport, setLoadingMedicalReport] = useState(false);

    const [formData, setFormData] = useState({
        ...EMPTY_FORM,
    });

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [patientTypeFilter, setPatientTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [treatmentFilter, setTreatmentFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");

    const hasActiveFilters = Boolean(
        search.trim() ||
        patientTypeFilter !== "all" ||
        dateFilter !== "all" ||
        treatmentFilter !== "all" ||
        sortBy !== "date_desc"
    );

    const resetAllFilters = () => {
        setSearch("");
        setPatientTypeFilter("all");
        setDateFilter("all");
        setTreatmentFilter("all");
        setSortBy("date_desc");
    };

    const [patientSearch, setPatientSearch] = useState("");
    const [showPatientDropdown, setShowPatientDropdown] =
        useState(false);

    const [medicineSearch, setMedicineSearch] = useState("");
    const [showMedicineDropdown, setShowMedicineDropdown] =
        useState(false);







    const normalizeData = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    const getFullName = (person) => {
        if (!person) {
            return "Unknown";
        }

        return `${person.first_name || ""} ${
            person.middle_name || ""
        } ${person.last_name || ""}`
            .replace(/\s+/g, " ")
            .trim();
    };

    const getNurseName = (nurse) => {
        if (!nurse) {
            return "Unknown Nurse";
        }

        if (nurse.name) {
            return nurse.name;
        }

        return getFullName(nurse);
    };

    const getMedicineName = (medicine) => {
        if (!medicine) {
            return "";
        }

        return (
            medicine.medicine_name ||
            medicine.name ||
            medicine.medication_name ||
            medicine.medicine ||
            ""
        );
    };

    const getMedicineUnit = (medicine) => {
        if (!medicine) {
            return "";
        }

        return medicine.unit || "";
    };

    const getMedicineStock = (medicine) => {
        if (!medicine) {
            return 0;
        }

        return Number(medicine.stock || 0);
    };

    const getMedicineTreatment = (medicine) => {
        if (!medicine) {
            return "";
        }

        return String(
            medicine.treatment_type || ""
        ).trim();
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const value = String(date).slice(0, 10);
        const parts = value.split("-");

        if (parts.length !== 3) {
            return value;
        }

        return `${parts[1]}/${parts[2]}/${parts[0]}`;
    };

    const formatDateInput = (date) => {
        if (!date) {
            return "";
        }

        return String(date).slice(0, 10);
    };

    const getToday = () => {
        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            today.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const getErrorMessage = (
        error,
        fallback = "Something went wrong."
    ) => {
        const validationErrors =
            error.response?.data?.errors;

        if (validationErrors) {
            const messages = Object.values(
                validationErrors
            )
                .flat()
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join("\n");
            }
        }

        return (
            error.response?.data?.message ||
            fallback
        );
    };







    const getPatientName = (visit) => {
        if (visit.student) {
            return {
                name: getFullName(visit.student),
                id: visit.student.student_id || "",
                type: "Student",
            };
        }

        if (visit.faculty) {
            return {
                name: getFullName(visit.faculty),
                id: visit.faculty.employee_id || "",
                type: "Faculty",
            };
        }

        if (visit.staff) {
            return {
                name: getFullName(visit.staff),
                id: visit.staff.staff_id || "",
                type: "Staff",
            };
        }

        return {
            name: "Unknown Patient",
            id: "",
            type: "",
        };
    };

    const patientOptions = useMemo(() => {
        return [
            ...students.map((student) => ({
                id: student.id,
                type: "student",
                label: "Student",
                identifier: student.student_id || "",
                name: getFullName(student),
                course: student.course || "",
                department: student.department || (student.course ? mapCourseToDepartment(student.course) : ""),
            })),

            ...faculties.map((faculty) => ({
                id: faculty.id,
                type: "faculty",
                label: "Faculty",
                identifier: faculty.employee_id || "",
                name: getFullName(faculty),
                department: faculty.department || "",
            })),

            ...staff.map((person) => ({
                id: person.id,
                type: "staff",
                label: "Staff",
                identifier: person.staff_id || "",
                name: getFullName(person),
                department: person.department || "",
            })),
        ];
    }, [students, faculties, staff]);

    const filteredPatients = useMemo(() => {
        const keyword = patientSearch
            .toLowerCase()
            .trim();

        if (!keyword) {
            return patientOptions;
        }

        const tokens = keyword.split(/[\s,]+/).filter((t) => t && t !== "-");

        return patientOptions.filter((patient) => {
            const name = (patient.name || "").toLowerCase();
            const identifier = (patient.identifier || "").toLowerCase();
            const label = (patient.label || "").toLowerCase();
            const combined = `${identifier} ${name} ${label}`;

            if (combined.includes(keyword) || name.includes(keyword) || identifier.includes(keyword)) {
                return true;
            }

            return tokens.length > 0 && tokens.every((token) => combined.includes(token));
        });
    }, [patientOptions, patientSearch]);

    const selectPatient = (patient) => {
        const autoDepartment =
            patient.department && patient.department !== "N/A"
                ? patient.department
                : patient.course
                  ? mapCourseToDepartment(patient.course)
                  : "";

        setFormData((previous) => ({
            ...previous,

            student_id:
                patient.type === "student"
                    ? patient.id
                    : "",

            faculty_id:
                patient.type === "faculty"
                    ? patient.id
                    : "",

            staff_id:
                patient.type === "staff"
                    ? patient.id
                    : "",

            department:
                autoDepartment || previous.department || "",
        }));

        setPatientSearch(
            `${patient.identifier} - ${patient.name}`
        );

        setShowPatientDropdown(false);
    };

    // Automatically fill department from registered student/faculty/staff record
    useEffect(() => {
        if (!formData.department) {
            let matched = null;
            if (formData.student_id) {
                matched = patientOptions.find(
                    (p) => p.type === "student" && String(p.id) === String(formData.student_id)
                );
            } else if (formData.faculty_id) {
                matched = patientOptions.find(
                    (p) => p.type === "faculty" && String(p.id) === String(formData.faculty_id)
                );
            } else if (formData.staff_id) {
                matched = patientOptions.find(
                    (p) => p.type === "staff" && String(p.id) === String(formData.staff_id)
                );
            }
            if (matched?.department && matched.department !== "N/A") {
                setFormData((prev) => ({
                    ...prev,
                    department: matched.department,
                }));
            }
        }
    }, [formData.student_id, formData.faculty_id, formData.staff_id, patientOptions, formData.department]);









    const filteredMedicines = useMemo(() => {
        const keyword = medicineSearch
            .toLowerCase()
            .trim();
        const selectedTreatment = (formData.treatment || "").toLowerCase().trim();

        const filtered = medicines.filter((medicine) => {
            const medicineTreatment = getMedicineTreatment(medicine).toLowerCase();
            const name = getMedicineName(medicine).toLowerCase();
            const unit = getMedicineUnit(medicine).toLowerCase();

            return (
                !keyword ||
                name.includes(keyword) ||
                unit.includes(keyword) ||
                medicineTreatment.includes(keyword)
            );
        });

        if (selectedTreatment) {
            return [...filtered].sort((a, b) => {
                const aTreatment = getMedicineTreatment(a).toLowerCase();
                const bTreatment = getMedicineTreatment(b).toLowerCase();
                const aMatch = aTreatment === selectedTreatment || aTreatment === "all";
                const bMatch = bTreatment === selectedTreatment || bTreatment === "all";
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });
        }

        return filtered;
    }, [medicines, medicineSearch, formData.treatment]);

    const selectedMedicine = useMemo(() => {
        return medicines.find(
            (medicine) =>
                String(medicine.id) ===
                String(formData.medicine_id)
        );
    }, [
        medicines,
        formData.medicine_id,
    ]);

    const selectMedicine = (medicine) => {
        setFormData((previous) => ({
            ...previous,
            medicine_id: medicine.id,
            medicine_quantity: previous.medicine_quantity && Number(previous.medicine_quantity) >= 1 ? previous.medicine_quantity : "1",
        }));

        setMedicineSearch(
            getMedicineName(medicine)
        );

        setShowMedicineDropdown(false);
    };







    const fetchVisits = useCallback(async (page = 1, searchTerm = "") => {
        try {
            const normalizedSearch = searchTerm.trim();
            const response = await getCachedRecord(
                `clinic-visits:list:${page}:${normalizedSearch}`,
                () => api.get("/clinic-visits", {
                    params: {
                        page,
                        per_page: 25,
                        search: normalizedSearch || undefined,
                    },
                })
            );

            setVisits(
                Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                      ? response.data
                      : []
            );
            setVisitPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                per_page: response.data?.per_page || 25,
            });
        } catch (error) {
            console.error(
                "Error fetching clinic visits:",
                error
            );

            setVisits([]);
            setVisitPagination({
                current_page: 1,
                last_page: 1,
                total: 0,
                per_page: 25,
            });
        }
    }, []);

    const fetchOptions = async () => {
        try {
            const response = await getCachedRecord(
                "clinic-visit-options:all",
                () => api.get("/clinic-visit-options")
            );
            const options = response.data || {};
            setStudents(normalizeData(options.students));
            setStaff(normalizeData(options.staff));
            setFaculties(normalizeData(options.faculties));
            setNurses(normalizeData(options.nurses));
            setMedicines(normalizeData(options.medicines));
            setStudentTotal(Number(options.totals?.students || 0));
            setFacultyStaffTotal(Number(options.totals?.faculties || 0) + Number(options.totals?.staff || 0));
        } catch (error) {
            console.error("Error fetching clinic visit options:", error);
            setStudents([]);
            setStaff([]);
            setFaculties([]);
            setNurses([]);
            setMedicines([]);
            setStudentTotal(0);
            setFacultyStaffTotal(0);
        }
    };

    const fetchMedicines = async () => {
        try {
            const response = await getCachedRecord(
                "clinic-visit-options:medicines",
                () => api.get("/clinic-visit-options", {
                    params: { medicine_search: "" },
                })
            );
            setMedicines(normalizeData(response.data?.medicines));
        } catch (error) {
            console.error(
                "Error fetching medicines:",
                error
            );

            setMedicines([]);
        }
    };

    const fetchAllData = async () => {
        setPageLoading(true);

        await Promise.all([
            fetchVisits(),
            fetchOptions(),
        ]);

        setPageLoading(false);
    };

    useEffect(() => {
        const timeout = setTimeout(() => fetchAllData(), 0);

        return () => clearTimeout(timeout);
    }, []);

    const initialVisitSearch = useRef(true);
    useEffect(() => {
        if (initialVisitSearch.current) {
            initialVisitSearch.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            fetchVisits(1, search);
        }, 250);

        return () => clearTimeout(timeout);
    }, [search, fetchVisits]);

    useEffect(() => {
        const term = patientSearch.trim();

        if (!showPatientDropdown) {
            return undefined;
        }

        let cancelled = false;
        const timeout = setTimeout(async () => {
            try {
                const response = await getCachedRecord(
                    `clinic-visit-options:patients:${term.toLowerCase()}`,
                    () => api.get("/clinic-visit-options", {
                        params: term ? { patient_search: term } : {},
                    })
                );

                if (!cancelled) {
                    setStudents(normalizeData(response.data?.students));
                    setStaff(normalizeData(response.data?.staff));
                    setFaculties(normalizeData(response.data?.faculties));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Patient option search error:", error);
                    setStudents([]);
                    setStaff([]);
                    setFaculties([]);
                }
            }
        }, 200);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [patientSearch, showPatientDropdown]);

    useEffect(() => {
        const term = medicineSearch.trim();

        if (!showMedicineDropdown) {
            return undefined;
        }

        let cancelled = false;
        const timeout = setTimeout(async () => {
            try {
                const response = await getCachedRecord(
                    `clinic-visit-options:medicine-search:${term.toLowerCase()}`,
                    () => api.get("/clinic-visit-options", {
                        params: term ? { medicine_search: term } : {},
                    })
                );

                if (!cancelled) {
                    setMedicines(normalizeData(response.data?.medicines));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Medicine option search error:", error);
                    setMedicines([]);
                }
            }
        }, 200);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [medicineSearch, showMedicineDropdown]);







    useEffect(() => {
        const handleMedicineStockUpdated = () => {
            fetchMedicines();
        };

        window.addEventListener(
            "medicine-stock-updated",
            handleMedicineStockUpdated
        );

        return () => {
            window.removeEventListener(
                "medicine-stock-updated",
                handleMedicineStockUpdated
            );
        };
    }, []);

    useEffect(() => {
        if (!showForm) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                closeForm();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showForm, loading]);







    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleTreatmentChange = (event) => {
        const value = event.target.value;








        setFormData((previous) => ({
            ...previous,
            treatment: value,
            medicine_id: "",
            medicine_quantity: "",
        }));

        setMedicineSearch("");
        setShowMedicineDropdown(false);
    };







    const openAddForm = () => {
        setEditingVisit(null);

        const storedUser = (() => {
            try {
                const u = localStorage.getItem("user");
                return u ? JSON.parse(u) : null;
            } catch {
                return null;
            }
        })();

        const defaultNurseId =
            (storedUser?.id && nurses.some((n) => Number(n.id) === Number(storedUser.id)))
                ? storedUser.id
                : nurses[0]?.id || "";

        setFormData({
            ...EMPTY_FORM,
            nurse_id: defaultNurseId,
            visit_date: getToday(),
        });

        setPatientSearch("");
        setMedicineSearch("");

        setShowPatientDropdown(false);
        setShowMedicineDropdown(false);

        setShowForm(true);
    };







    const handleEdit = (visit) => {
        setEditingVisit(visit);

        const treatment =
            visit.treatment || "";

        setFormData({
            student_id: visit.student_id || "",
            faculty_id: visit.faculty_id || "",
            staff_id: visit.staff_id || "",

            nurse_id:
                visit.nurse_id ||
                visit.nurse?.id ||
                "",

            visit_date: formatDateInput(
                visit.visit_date
            ),

            reason: visit.reason || "",

            symptoms: visit.symptoms || "",

            temperature:
                visit.temperature || "",

            blood_pressure:
                visit.blood_pressure || "",

            assessment:
                visit.assessment || "",

            treatment: treatment,

            medicine_id:
                visit.medicine_id ||
                visit.medicine?.id ||
                "",

            medicine_quantity:
                visit.medicine_quantity || "",

            department:
                visit.department ||
                (visit.student?.course
                    ? mapCourseToDepartment(visit.student.course)
                    : (visit.faculty?.department || visit.staff?.department || "")),

            remarks: visit.remarks || "",
        });

        if (visit.student) {
            setPatientSearch(
                `${visit.student.student_id || ""} - ${getFullName(
                    visit.student
                )}`
            );
        } else if (visit.faculty) {
            setPatientSearch(
                `${visit.faculty.employee_id || ""} - ${getFullName(
                    visit.faculty
                )}`
            );
        } else if (visit.staff) {
            setPatientSearch(
                `${visit.staff.staff_id || ""} - ${getFullName(
                    visit.staff
                )}`
            );
        } else {
            setPatientSearch("");
        }

        setMedicineSearch(
            getMedicineName(visit.medicine)
        );

        setShowPatientDropdown(false);
        setShowMedicineDropdown(false);

        setShowForm(true);
    };







    const persistVisit = async (payload, visitToUpdate = null) => {
        setLoading(true);

        try {
            if (visitToUpdate) {
                await api.put(
                    `/clinic-visits/${visitToUpdate.id}`,
                    payload
                );
                setToastMessage("Clinic visit updated successfully.");
            } else {
                await api.post("/clinic-visits", payload);
                setToastMessage("Clinic visit added successfully.");
            }

            await Promise.all([
                fetchVisits(
                    visitToUpdate ? visitPagination.current_page : 1,
                    search
                ),
            ]);

            window.dispatchEvent(new Event("medicine-stock-updated"));
            setShowForm(false);
            setEditingVisit(null);
            setFormData({ ...EMPTY_FORM });
            setPatientSearch("");
            setMedicineSearch("");
            setShowPatientDropdown(false);
            setShowMedicineDropdown(false);

            addClinicNotification({
                type: visitToUpdate ? "edit" : "add",
                title: visitToUpdate ? "Clinic Visit Updated" : "Clinic Visit Added",
                description: `Visit on ${payload.visit_date || "today"} ${visitToUpdate ? "updated" : "recorded"}`,
                category: "visit",
            });
        } catch (error) {
            console.error("Error saving clinic visit:", error);
            setToastType("error");
            setToastMessage(
                getErrorMessage(
                    error,
                    "Failed to save clinic visit."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        const patientCount = [
            formData.student_id,
            formData.faculty_id,
            formData.staff_id,
        ].filter(Boolean).length;

        if (patientCount === 0) {
            setToastType("warning");
            setToastMessage("Please select a Student, Faculty, or Staff.");
            return;
        }

        if (patientCount > 1) {
            setToastType("warning");
            setToastMessage("Please select only one patient.");
            return;
        }

        if (!formData.nurse_id) {
            setToastType("warning");
            setToastMessage("Please select a nurse on duty.");
            return;
        }

        if (!formData.visit_date) {
            setToastType("warning");
            setToastMessage("Please select the visit date.");
            return;
        }

        if (!formData.reason.trim()) {
            setToastType("warning");
            setToastMessage("Please enter the reason for visit.");
            return;
        }

        if (
            treatmentNeedsMedicine(formData.treatment) &&
            !formData.medicine_id
        ) {
            setToastType("warning");
            setToastMessage(
                `Please select a medicine / supply for ${formData.treatment}.`
            );
            return;
        }

        if (
            formData.medicine_id &&
            (
                !formData.medicine_quantity ||
                Number(
                    formData.medicine_quantity
                ) < 1
            )
        ) {
            setToastType("warning");
            setToastMessage(
                "Please enter a valid quantity used (at least 1)."
            );
            return;
        }

        if (
            !editingVisit &&
            selectedMedicine &&
            Number(
                formData.medicine_quantity
            ) >
                getMedicineStock(
                    selectedMedicine
                )
        ) {
            setToastType("warning");
            setToastMessage(
                `Not enough stock. Available stock: ${getMedicineStock(
                    selectedMedicine
                )}.`
            );
            return;
        }

        const payload = {
            student_id:
                formData.student_id || null,

            faculty_id:
                formData.faculty_id || null,

            staff_id:
                formData.staff_id || null,

            nurse_id:
                formData.nurse_id || null,

            visit_date:
                formData.visit_date,

            reason:
                formData.reason.trim(),

            symptoms:
                formData.symptoms.trim() ||
                null,

            temperature:
                formData.temperature.trim() ||
                null,

            blood_pressure:
                formData.blood_pressure.trim() ||
                null,

            assessment:
                formData.assessment.trim() ||
                null,

            treatment:
                formData.treatment || null,

            medicine_id:
                formData.medicine_id || null,

            medicine_quantity:
                formData.medicine_id
                    ? Number(
                          formData.medicine_quantity
                      ) || 1
                    : null,

            remarks:
                formData.remarks.trim() ||
                null,
        };

        await persistVisit(payload, editingVisit);
    };







    const handleRestoreQuick = async (id: number | string) => {
        try {
            await api.post(`/clinic-visits/${id}/restore`);
            setToastMessage("Clinic visit restored successfully.");
            setToastAction(undefined);
            await fetchVisits(visitPagination.current_page, search);
            window.dispatchEvent(new Event("medicine-stock-updated"));
        } catch (error) {
            console.error("Error restoring clinic visit:", error);
            setToastMessage("Failed to restore clinic visit.");
        }
    };

    const handleDelete = async () => {
        if (!deleteVisit) {
            return;
        }

        try {
            const deletedId = deleteVisit.id;
            const patient = getPatientName(deleteVisit);

            await api.delete(
                `/clinic-visits/${deletedId}`
            );

            setToastMessage(`Visit record for ${patient.name || "Patient"} deleted.`);
            setToastAction({
                label: "Undo",
                onClick: () => handleRestoreQuick(deletedId),
            });

            addClinicNotification({
                type: "delete",
                title: "Clinic Visit Deleted",
                description: `Visit record for ${patient.name || "Patient"} removed`,
                category: "visit",
            });

            await Promise.all([
                fetchVisits(
                    visits.length === 1 && visitPagination.current_page > 1
                        ? visitPagination.current_page - 1
                        : visitPagination.current_page,
                    search
                ),
            ]);

            window.dispatchEvent(
                new Event(
                    "medicine-stock-updated"
                )
            );
        } catch (error) {
            console.error(
                "Error deleting clinic visit:",
                error
            );

            setToastType("error");
            setToastMessage(
                getErrorMessage(
                    error,
                    "Failed to delete clinic visit."
                )
            );
        } finally {
            setDeleteVisit(null);
        }
    };

    const openMedicalReportForVisit = async (visit: VisitRecord) => {
        let patientObj: any = null;
        let type: "student" | "faculty" | "staff" = "student";

        if (visit.student) {
            patientObj = visit.student;
            type = "student";
        } else if (visit.faculty) {
            patientObj = visit.faculty;
            type = "faculty";
        } else if (visit.staff) {
            patientObj = visit.staff;
            type = "staff";
        } else if (visit.student_id) {
            patientObj = { id: visit.student_id, student_id: visit.student_id, full_name: visit.patient_name };
            type = "student";
        } else if (visit.faculty_id) {
            patientObj = { id: visit.faculty_id, employee_id: visit.faculty_id, full_name: visit.patient_name };
            type = "faculty";
        } else if (visit.staff_id) {
            patientObj = { id: visit.staff_id, staff_id: visit.staff_id, full_name: visit.patient_name };
            type = "staff";
        }

        if (!patientObj || !patientObj.id) {
            const fallbackPatient = {
                full_name: visit.patient_name || getPatientName(visit).name || "Patient",
                department: visit.department,
            };
            setMedicalReportTarget({
                patient: fallbackPatient,
                type,
                visit,
            });
            setMedicalReportData({
                patient_type: type,
                patient: fallbackPatient,
                visits: [visit],
                total_visits: 1,
            });
            return;
        }

        setMedicalReportTarget({ patient: patientObj, type, visit });
        setLoadingMedicalReport(true);
        try {
            let endpoint = `/students/${patientObj.id}/medical-history`;
            if (type === "faculty") endpoint = `/faculties/${patientObj.id}/medical-history`;
            else if (type === "staff") endpoint = `/staff/${patientObj.id}/medical-history`;

            const res = await api.get(endpoint);
            setMedicalReportData(res.data);
        } catch (err) {
            console.error("Failed to load medical history:", err);
            const dept = type === "student" ? (patientObj.department || mapCourseToDepartment(patientObj.course)) : (patientObj.department || "N/A");
            setMedicalReportData({
                patient_type: type,
                patient: {
                    ...patientObj,
                    full_name: getFullName(patientObj),
                    department: dept,
                },
                visits: [visit],
                total_visits: 1,
            });
        } finally {
            setLoadingMedicalReport(false);
        }
    };

    const closeMedicalReport = () => {
        setMedicalReportTarget(null);
        setMedicalReportData(null);
    };

    const handleDownloadCertificateForVisit = (specificVisit?: any) => {
        const visit = specificVisit || medicalReportTarget?.visit;
        if (!visit) return;
        const patient = getPatientName(visit);
        const patientData = medicalReportData?.patient || medicalReportTarget?.patient || {};
        const roleLabel = (patient.type === "Faculty" || medicalReportTarget?.type === "faculty")
            ? `Faculty (${visit.faculty?.position || patientData.position || "Instructor"} - ${visit.department || patientData.department || "Faculty"})`
            : (patient.type === "Staff" || medicalReportTarget?.type === "staff")
            ? `Staff (${visit.staff?.position || patientData.position || "Staff"} - ${visit.department || patientData.department || "Office"})`
            : `Student (${visit.student?.course || patientData.course || ""})`;

        exportMedicalCertificatePDF({
            patient_name: patient.name || patientData.full_name || getFullName(patientData),
            student_id: patient.id || patientData.student_id || patientData.employee_id || patientData.staff_id,
            role_label: roleLabel,
            address: visit.student?.address || visit.faculty?.address || visit.staff?.address || patientData.address || "Tagoloan, Misamis Oriental",
            visit_date: visit.visit_date || new Date().toISOString(),
            diagnosis: visit.assessment || visit.symptoms || visit.reason || "Clinical Consultation & Treatment",
            reason: visit.reason,
            symptoms: visit.symptoms,
            temperature: visit.temperature,
            blood_pressure: visit.blood_pressure,
            treatment: visit.treatment,
            remarks: visit.remarks,
            attending_nurse: getNurseName(visit.nurse) || "Angel Stacee Sabandal",
        });
    };







    const closeForm = () => {
        if (loading) {
            return;
        }

        setShowForm(false);
        setEditingVisit(null);

        setFormData({
            ...EMPTY_FORM,
        });

        setPatientSearch("");
        setMedicineSearch("");

        setShowPatientDropdown(false);
        setShowMedicineDropdown(false);
    };







    const filteredVisits = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        const normalizedDate = normalizeVisitDateSearch(keyword);
        const tokens = keyword.split(/[\s,]+/).filter((t) => t && t !== "-");

        const now = new Date();
        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const thisMonthPrefix = todayStr.slice(0, 7);

        return (visits || [])
            .filter((visit) => {
                const patient = getPatientName(visit);
                const pType = (patient.type || "").toLowerCase();

                // 1. Patient Type Filter
                if (patientTypeFilter !== "all" && pType !== patientTypeFilter.toLowerCase()) {
                    return false;
                }

                // 2. Treatment Filter
                if (treatmentFilter !== "all" && (visit.treatment || "").toLowerCase() !== treatmentFilter.toLowerCase()) {
                    return false;
                }

                // 3. Date Range Filter
                if (dateFilter !== "all") {
                    const rawDate = String(visit.visit_date || "").slice(0, 10);
                    if (!rawDate) return false;
                    if (dateFilter === "today" && rawDate !== todayStr) return false;
                    if (dateFilter === "week" && rawDate < sevenDaysAgo) return false;
                    if (dateFilter === "month" && !rawDate.startsWith(thisMonthPrefix)) return false;
                    if (dateFilter === "30days" && rawDate < thirtyDaysAgo) return false;
                }

                // 4. Keyword search
                if (!keyword) return true;

                const nurseName = getNurseName(visit.nurse);
                const medicineName = getMedicineName(visit.medicine);
                const fullContent = `
                    ${patient.id || ""}
                    ${patient.name || ""}
                    ${patient.type || ""}
                    ${nurseName}
                    ${visit.reason || ""}
                    ${visit.symptoms || ""}
                    ${visit.assessment || ""}
                    ${visit.treatment || ""}
                    ${medicineName}
                    ${visit.medicine_quantity || ""}
                    ${visit.visit_date || ""}
                    ${formatDate(visit.visit_date)}
                    ${visit.temperature || ""}
                    ${visit.blood_pressure || ""}
                    ${visit.remarks || ""}
                `.toLowerCase();

                if (fullContent.includes(keyword)) return true;
                if (tokens.length > 0 && tokens.every((token) => fullContent.includes(token))) return true;
                if (normalizedDate && String(visit.visit_date || "").slice(0, 10) === normalizedDate) return true;

                return false;
            })
            .sort((a, b) => {
                if (sortBy === "date_desc") {
                    const dateA = String(a.visit_date || "");
                    const dateB = String(b.visit_date || "");
                    return dateB.localeCompare(dateA);
                }
                if (sortBy === "date_asc") {
                    const dateA = String(a.visit_date || "");
                    const dateB = String(b.visit_date || "");
                    return dateA.localeCompare(dateB);
                }
                if (sortBy === "name_asc") {
                    const nameA = (getPatientName(a).name || "").toLowerCase();
                    const nameB = (getPatientName(b).name || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                if (sortBy === "name_desc") {
                    const nameA = (getPatientName(a).name || "").toLowerCase();
                    const nameB = (getPatientName(b).name || "").toLowerCase();
                    return nameB.localeCompare(nameA);
                }
                return 0;
            });
    }, [visits, search, patientTypeFilter, dateFilter, treatmentFilter, sortBy]);







    return (
        <div className="tcc-module-page min-h-screen w-full px-3.5 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <FloatingToast
                message={toastMessage}
                type={toastType}
                onClose={() => {
                    setToastMessage("");
                    setToastAction(undefined);
                }}
                action={toastAction}
            />
            <div className="w-full space-y-4">


                <div className="tcc-module-header mb-4 sm:mb-5 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
                    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#fcebe7] text-[#70091f]">
                                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#70091f]">
                                    Clinic Management
                                </p>

                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#3d3329] truncate">
                                    Clinic Visits
                                </h1>

                                <p className="mt-0.5 sm:mt-1 text-xs text-[#887d70] line-clamp-1 sm:line-clamp-none">
                                    View and manage student, faculty, and staff clinic visit records.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setShowRestoreModal(true)}
                                className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-[#e8dfd4] bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-[#6d5942] shadow-xs transition hover:bg-[#fcfaf6] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#211c17] dark:text-[#e5dcd1] dark:hover:bg-[#2c231a] cursor-pointer"
                                title="Restore deleted clinic visits"
                            >
                                <RotateCcw size={15} className="text-[#8a6f50]" />
                                <span>Restore Deleted</span>
                            </button>

                            <button
                                type="button"
                                onClick={openAddForm}
                                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b1505] active:scale-[0.99] cursor-pointer"
                            >
                                <Plus size={17} />
                                <span>Add Clinic Visit</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inline Notification Banner */}
                {toastMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-950 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs dark:bg-emerald-900/60 dark:text-emerald-300">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">Notification</p>
                                <p className="text-xs opacity-90 leading-relaxed">{toastMessage}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {toastAction && (
                                <button
                                    type="button"
                                    onClick={toastAction.onClick}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    <span>{toastAction.label}</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setToastMessage("");
                                    setToastAction(undefined);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-black/5 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-200 transition cursor-pointer"
                                aria-label="Dismiss notification"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}


                <div className="mb-4 sm:mb-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">

                    <div className="rounded-xl border border-[#e8dfd4] bg-white p-3 sm:p-4 shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-[#70091f]">
                                <Stethoscope size={18} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs text-[#887d70] truncate">
                                    Total Visits
                                </p>

                                <p className="text-lg sm:text-2xl font-bold text-[#3c332a] dark:text-stone-100">
                                    {visitPagination.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#e8dfd4] bg-white p-3 sm:p-4 shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <UserRound size={18} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs text-[#887d70] truncate">
                                    Students
                                </p>

                                <p className="text-lg sm:text-2xl font-bold text-[#3c332a] dark:text-stone-100">
                                    {studentTotal}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#e8dfd4] bg-white p-3 sm:p-4 shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <UserRound size={18} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs text-[#887d70] truncate">
                                    Faculty & Staff
                                </p>

                                <p className="text-lg sm:text-2xl font-bold text-[#3c332a] dark:text-stone-100">
                                    {facultyStaffTotal}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#e8dfd4] bg-white p-3 sm:p-4 shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                                <Activity size={18} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs text-[#887d70] truncate">
                                    Nurses
                                </p>

                                <p className="text-lg sm:text-2xl font-bold text-[#3c332a] dark:text-stone-100">
                                    {nurses.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <ClinicVisitModal
                    showForm={showForm}
                    closeForm={closeForm}
                    editingVisit={editingVisit}
                    formData={formData}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    patientSearch={patientSearch}
                    setPatientSearch={setPatientSearch}
                    showPatientDropdown={showPatientDropdown}
                    setShowPatientDropdown={setShowPatientDropdown}
                    filteredPatients={filteredPatients}
                    selectPatient={selectPatient}
                    nurses={nurses}
                    getNurseName={getNurseName}
                    getToday={getToday}
                    setFormData={setFormData}
                    handleTreatmentChange={handleTreatmentChange}
                    treatments={TREATMENTS}
                    treatmentNeedsMedicine={treatmentNeedsMedicine}
                    medicineSearch={medicineSearch}
                    setMedicineSearch={setMedicineSearch}
                    showMedicineDropdown={showMedicineDropdown}
                    setShowMedicineDropdown={setShowMedicineDropdown}
                    filteredMedicines={filteredMedicines}
                    selectMedicine={selectMedicine}
                    getMedicineName={getMedicineName}
                    getMedicineUnit={getMedicineUnit}
                    getMedicineStock={getMedicineStock}
                    getMedicineTreatment={getMedicineTreatment}
                    selectedMedicine={selectedMedicine}
                />

                {/* Search and Filters Controls */}
                <div className="mb-4 sm:mb-6 rounded-2xl border border-[#e8dfd4] bg-white p-3.5 sm:p-5 shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12 sm:gap-3">
                        {/* Search Input */}
                        <div className="relative col-span-1 sm:col-span-2 lg:col-span-4">
                            <label htmlFor="visit-search" className="sr-only">
                                Search clinic visits
                            </label>
                            <Search
                                size={18}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a99d8f] dark:text-[#887d70]"
                            />
                            <input
                                id="visit-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by ID, name, reason, medicine, date..."
                                autoComplete="off"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] py-2.5 pl-10 pr-10 text-sm text-[#3d3329] outline-none transition placeholder:text-[#a99d8f] focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:placeholder:text-[#887d70] dark:focus:border-[#70091f] dark:focus:bg-[#211c17]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#a99d8f] hover:bg-[#f6f1e9] hover:text-[#3c332a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70091f] dark:text-[#887d70] dark:hover:bg-[#382f25] dark:hover:text-[#f8f3eb]"
                                >
                                    <X size={15} aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        {/* Patient Type Filter */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label htmlFor="patient-type-filter" className="sr-only">
                                Filter by Patient Type
                            </label>
                            <select
                                id="patient-type-filter"
                                value={patientTypeFilter}
                                onChange={(e) => setPatientTypeFilter(e.target.value)}
                                aria-label="Filter by Patient Type"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#70091f] dark:focus:bg-[#211c17]"
                            >
                                <option value="all">All Patients</option>
                                <option value="student">Students</option>
                                <option value="faculty">Faculty</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label htmlFor="date-filter" className="sr-only">
                                Filter by Date
                            </label>
                            <select
                                id="date-filter"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                aria-label="Filter by Date"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#70091f] dark:focus:bg-[#211c17]"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="30days">Past 30 Days</option>
                            </select>
                        </div>

                        {/* Treatment Filter */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label htmlFor="treatment-filter" className="sr-only">
                                Filter by Treatment
                            </label>
                            <select
                                id="treatment-filter"
                                value={treatmentFilter}
                                onChange={(e) => setTreatmentFilter(e.target.value)}
                                aria-label="Filter by Treatment"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#70091f] dark:focus:bg-[#211c17]"
                            >
                                <option value="all">All Treatments</option>
                                {TREATMENTS.map((treatment) => (
                                    <option key={treatment} value={treatment}>
                                        {treatment}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                            <label htmlFor="sort-filter" className="sr-only">
                                Sort visits
                            </label>
                            <select
                                id="sort-filter"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                aria-label="Sort visits"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#70091f] dark:focus:bg-[#211c17]"
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="name_asc">Patient Name (A-Z)</option>
                                <option value="name_desc">Patient Name (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {/* Active filter summary bar & Reset */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0e7dd] pt-3 text-xs text-[#887d70] dark:border-[#382f25] dark:text-[#c4b5a3]">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                    Active filters:
                                </span>
                                {search.trim() && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcebe7] px-2.5 py-0.5 font-medium text-[#675948] dark:bg-[#382f25] dark:text-[#ded4c9]">
                                        Keyword: "{search.trim()}"
                                        <button
                                            type="button"
                                            onClick={() => setSearch("")}
                                            aria-label="Remove search filter"
                                            className="text-[#887d70] hover:text-[#3d3329] dark:hover:text-[#f8f3eb]"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                {patientTypeFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcebe7] px-2.5 py-0.5 font-medium text-[#675948] dark:bg-[#382f25] dark:text-[#ded4c9]">
                                        Type: {patientTypeFilter}
                                        <button
                                            type="button"
                                            onClick={() => setPatientTypeFilter("all")}
                                            aria-label="Remove patient type filter"
                                            className="text-[#887d70] hover:text-[#3d3329] dark:hover:text-[#f8f3eb]"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                {dateFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcebe7] px-2.5 py-0.5 font-medium text-[#675948] dark:bg-[#382f25] dark:text-[#ded4c9]">
                                        Date: {dateFilter === "today" ? "Today" : dateFilter === "week" ? "This Week" : dateFilter === "month" ? "This Month" : "Past 30 Days"}
                                        <button
                                            type="button"
                                            onClick={() => setDateFilter("all")}
                                            aria-label="Remove date filter"
                                            className="text-[#887d70] hover:text-[#3d3329] dark:hover:text-[#f8f3eb]"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                {treatmentFilter !== "all" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcebe7] px-2.5 py-0.5 font-medium text-[#675948] dark:bg-[#382f25] dark:text-[#ded4c9]">
                                        Treatment: {treatmentFilter}
                                        <button
                                            type="button"
                                            onClick={() => setTreatmentFilter("all")}
                                            aria-label="Remove treatment filter"
                                            className="text-[#887d70] hover:text-[#3d3329] dark:hover:text-[#f8f3eb]"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                {sortBy !== "date_desc" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fcebe7] px-2.5 py-0.5 font-medium text-[#675948] dark:bg-[#382f25] dark:text-[#ded4c9]">
                                        Sort: {sortBy === "date_asc" ? "Oldest First" : sortBy === "name_asc" ? "Patient Name (A-Z)" : "Patient Name (Z-A)"}
                                        <button
                                            type="button"
                                            onClick={() => setSortBy("date_desc")}
                                            aria-label="Reset sort"
                                            className="text-[#887d70] hover:text-[#3d3329] dark:hover:text-[#f8f3eb]"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                <span className="ml-1 text-[#887d70]">
                                    ({filteredVisits.length} {filteredVisits.length === 1 ? "record" : "records"} found)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="font-semibold text-[#70091f] hover:underline dark:text-[#c4a07d]"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}
                </div>

                <ClinicVisitTable
                    search={search}
                    setSearch={setSearch}
                    loading={loading}
                    pageLoading={pageLoading}
                    filteredVisits={filteredVisits}
                    getPatientName={getPatientName}
                    getNurseName={getNurseName}
                    getMedicineName={getMedicineName}
                    getMedicineUnit={getMedicineUnit}
                    formatDate={formatDate}
                    handleEdit={handleEdit}
                    deleteVisit={deleteVisit}
                    setDeleteVisit={setDeleteVisit}
                    handleDelete={handleDelete}
                    visitPagination={visitPagination}
                    fetchVisits={fetchVisits}
                    onOpenMedicalReport={openMedicalReportForVisit}
                    onDownloadCertificate={handleDownloadCertificateForVisit}
                    onViewVisit={setViewingVisit}
                />

                {/* Individual Patient Medical Certificate Modal */}
                {medicalReportTarget && (
                    <Modal
                        title={`Individual ${medicalReportTarget.type === "faculty" ? "Faculty" : medicalReportTarget.type === "staff" ? "Staff" : "Student"} Medical Certificate`}
                        onClose={closeMedicalReport}
                        maxWidth="max-w-5xl"
                    >
                        <div className="p-6">
                            {/* Header & Export Actions */}
                            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#70091f]/30 bg-gradient-to-r from-[#70091f]/10 via-[#8b1505]/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#70091f]/50 dark:from-[#70091f]/20">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#70091f] text-white shadow-md shadow-[#70091f]/30">
                                        <Stethoscope size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#2d050d] dark:text-white">
                                            {formatNA(medicalReportData?.patient?.full_name || getFullName(medicalReportTarget.patient) || medicalReportTarget.patient?.full_name)}
                                        </h3>
                                        <p className="text-xs text-[#70091f] dark:text-[#f8a598] font-medium">
                                            {medicalReportTarget.type === "faculty"
                                                ? `Faculty ID: ${formatNA(medicalReportTarget.patient.employee_id || medicalReportTarget.patient.student_id || medicalReportTarget.patient.id)} · ${formatNA(medicalReportTarget.patient.position)} · ${formatNA(medicalReportTarget.patient.department)}`
                                                : medicalReportTarget.type === "staff"
                                                ? `Staff ID: ${formatNA(medicalReportTarget.patient.staff_id || medicalReportTarget.patient.student_id || medicalReportTarget.patient.id)} · ${formatNA(medicalReportTarget.patient.position)} · ${formatNA(medicalReportTarget.patient.department)}`
                                                : `Student ID: ${formatNA(medicalReportTarget.patient.student_id || medicalReportTarget.patient.id)} · ${formatNA(medicalReportTarget.patient.course)} ${medicalReportTarget.patient.year_level ? `- ${medicalReportTarget.patient.year_level}` : ""}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadCertificateForVisit()}
                                        disabled={loadingMedicalReport}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] active:scale-95 disabled:opacity-50 cursor-pointer"
                                        title="Download Official Medical Certificate"
                                    >
                                        <FileBadge size={16} className="shrink-0" />
                                        Download Medical Certificate
                                    </button>
                                </div>
                            </div>

                            {/* Patient Demographics Profile */}
                            <div className="mb-6 rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-5 dark:border-[#4e4234] dark:bg-[#211c17]">
                                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#70091f] dark:text-[#f8a598]">
                                    {medicalReportTarget.type === "faculty" ? "Faculty" : medicalReportTarget.type === "staff" ? "Staff" : "Student"} Profile &amp; Demographics
                                </h4>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs sm:text-sm">
                                    <div>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">
                                            {medicalReportTarget.type === "faculty" ? "Faculty ID" : medicalReportTarget.type === "staff" ? "Staff ID" : "Student ID"}
                                        </span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                            {formatNA(medicalReportTarget.patient.employee_id || medicalReportTarget.patient.staff_id || medicalReportTarget.patient.student_id || medicalReportTarget.patient.id)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Full Name</span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                            {formatNA(medicalReportData?.patient?.full_name || getFullName(medicalReportTarget.patient) || medicalReportTarget.patient?.full_name)}
                                        </span>
                                    </div>
                                    {medicalReportTarget.type === "student" ? (
                                        <>
                                            <div>
                                                <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Course</span>
                                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportTarget.patient.course)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Year &amp; Section</span>
                                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                    {formatNA(
                                                        medicalReportTarget.patient.year_level && medicalReportTarget.patient.section
                                                            ? `${medicalReportTarget.patient.year_level} - ${medicalReportTarget.patient.section}`
                                                            : medicalReportTarget.patient.year_level || medicalReportTarget.patient.section
                                                    )}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Department / College</span>
                                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                    {formatNA(medicalReportData?.patient?.department || medicalReportTarget.patient.department || mapCourseToDepartment(medicalReportTarget.patient.course))}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Position</span>
                                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportTarget.patient.position)}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Department</span>
                                                <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                    {formatNA(medicalReportData?.patient?.department || medicalReportTarget.patient.department)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Sex</span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportTarget.patient.sex)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Birth Date</span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatDate(medicalReportTarget.patient.birth_date)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Contact Number</span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportTarget.patient.contact_number)}</span>
                                    </div>
                                    <div className={medicalReportTarget.type === "student" ? "col-span-3" : "col-span-4 sm:col-span-2"}>
                                        <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Address</span>
                                        <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportTarget.patient.address)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Consultation History */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#70091f] dark:text-[#f8a598]">
                                        Consultation History (Chronological Order)
                                    </h4>
                                    <span className="text-xs font-medium text-[#887d70] dark:text-[#a99d8f]">
                                        Total Visits: {medicalReportData?.total_visits ?? (medicalReportData?.visits?.length || 1)}
                                    </span>
                                </div>

                                {loadingMedicalReport ? (
                                    <div className="flex h-40 items-center justify-center rounded-xl border border-[#e8dfd4] bg-white dark:border-[#4e4234] dark:bg-[#211c17]">
                                        <div className="flex items-center gap-2 text-sm text-[#70091f]">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                                            <span>Loading official medical records...</span>
                                        </div>
                                    </div>
                                ) : (medicalReportData?.visits || []).length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#d9cebf] bg-[#fcfaf6] p-8 text-center dark:border-[#4e4234] dark:bg-[#211c17]">
                                        <p className="text-sm font-medium text-[#766959] dark:text-[#c4b5a5]">
                                            No clinic visits on record for this patient.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-[#e8dfd4] dark:border-[#4e4234]">
                                        <table className="w-full min-w-[850px] text-left text-xs sm:text-sm">
                                            <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Reason</th>
                                                    <th className="px-4 py-3">Symptoms</th>
                                                    <th className="px-4 py-3">Temp</th>
                                                    <th className="px-4 py-3">BP</th>
                                                    <th className="px-4 py-3">Assessment &amp; Treatment</th>
                                                    <th className="px-4 py-3">Medicine</th>
                                                    <th className="px-4 py-3">Nurse</th>
                                                    <th className="px-4 py-3">Remarks</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                                                {(medicalReportData?.visits || []).map((v: any, idx: number) => (
                                                    <tr key={v.id || idx} className="hover:bg-[#fcfaf6] dark:hover:bg-[#2a221a]">
                                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-[#3d3329] dark:text-[#f8f3eb]">
                                                            {formatDate(v.visit_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <ReasonBadge reason={v.reason} />
                                                        </td>
                                                        <td className="px-4 py-3 max-w-[150px] truncate text-[#766959] dark:text-[#c4b5a5]" title={v.symptoms || ""}>
                                                            {formatNA(v.symptoms)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[#3d3329] dark:text-[#f8f3eb]">
                                                            {formatTemperature(v.temperature)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[#766959] dark:text-[#c4b5a5]">
                                                            {formatNA(v.blood_pressure)}
                                                        </td>
                                                        <td className="px-4 py-3 max-w-[180px] text-[#766959] dark:text-[#c4b5a5]">
                                                            <div className="truncate font-medium text-[#3d3329] dark:text-[#f8f3eb]" title={v.assessment || ""}>
                                                                {formatNA(v.assessment)}
                                                            </div>
                                                            <div className="truncate text-xs text-[#887d70] dark:text-[#a99d8f]" title={v.treatment || ""}>
                                                                {formatNA(v.treatment)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-[#766959] dark:text-[#c4b5a5]">
                                                            {v.medicine ? (
                                                                <span>
                                                                    {v.medicine.name || v.medicine.medicine_name} ({v.quantity || v.medicine_quantity || 1} {v.medicine.unit || "pcs"})
                                                                </span>
                                                            ) : v.medicine_name ? (
                                                                <span>
                                                                    {v.medicine_name} ({v.medicine_quantity || v.quantity || 1})
                                                                </span>
                                                            ) : (
                                                                formatNA(null)
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-[#766959] dark:text-[#c4b5a5]">
                                                            {formatNA(v.nurse?.name || (typeof v.nurse === "string" ? v.nurse : v.nurse_name))}
                                                        </td>
                                                        <td className="px-4 py-3 max-w-[120px] truncate text-[#887d70] dark:text-[#a99d8f]" title={v.remarks || ""}>
                                                            {formatNA(v.remarks)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadCertificateForVisit(v)}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 cursor-pointer"
                                                                title="Download Medical Certificate for this consultation"
                                                            >
                                                                <FileBadge size={12} className="shrink-0" />
                                                                Med Cert
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Individual Clinic Visit Details Modal */}
                {viewingVisit && (
                    <Modal
                        title="Clinic Visit Details"
                        onClose={() => setViewingVisit(null)}
                        maxWidth="max-w-3xl"
                    >
                        <div className="p-6">
                            {/* Top Patient Header Card */}
                            <div className="mb-6 rounded-2xl bg-amber-50/70 border border-amber-200/60 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        {(() => {
                                            const patientInfo = getPatientName(viewingVisit);
                                            return (
                                                <>
                                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                        {patientInfo.type}
                                                    </div>
                                                    <h3 className="mt-2 text-xl font-bold text-[#302820] dark:text-white">
                                                        {patientInfo.name}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                                                        ID: {formatNA(patientInfo.id || viewingVisit.student_id || viewingVisit.faculty_id || viewingVisit.staff_id)}
                                                        {" · "}
                                                        {viewingVisit.student?.course || viewingVisit.faculty?.department || viewingVisit.staff?.department || viewingVisit.department || "General"}
                                                    </p>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-center shadow-xs dark:border-stone-800 dark:bg-stone-900">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                            Visit Date
                                        </p>
                                        <p className="mt-0.5 text-sm font-bold text-[#70091f] dark:text-[#f8a598]">
                                            {formatDate(viewingVisit.visit_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Visit Details Section */}
                            <RecordSection icon={<Stethoscope size={14} />} title="Clinical Assessment & Vitals">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <InfoItem label="Reason" value={<ReasonBadge reason={viewingVisit.reason} />} />
                                    <InfoItem label="Temperature" value={formatTemperature(viewingVisit.temperature)} />
                                    <InfoItem label="Blood Pressure" value={viewingVisit.blood_pressure ? `${viewingVisit.blood_pressure} mmHg` : "N/A"} />
                                    <InfoItem label="Attending Nurse" value={getNurseName(viewingVisit)} />
                                </div>
                                {viewingVisit.symptoms && (
                                    <div className="mt-3">
                                        <InfoItem label="Symptoms Reported" value={viewingVisit.symptoms} />
                                    </div>
                                )}
                            </RecordSection>

                            {/* Treatment & Medicine Section */}
                            <RecordSection icon={<Pill size={14} />} title="Treatment & Medication">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoItem label="Treatment / Action" value={viewingVisit.treatment || "N/A"} />
                                    <InfoItem 
                                        label="Medicine Dispensed" 
                                        value={viewingVisit.medicine ? `${getMedicineName(viewingVisit.medicine)} (Qty: ${viewingVisit.medicine_quantity || 1} ${getMedicineUnit(viewingVisit.medicine)})` : "None"} 
                                    />
                                </div>
                                {viewingVisit.remarks && (
                                    <div className="mt-3">
                                        <InfoItem label="Remarks / Clinical Notes" value={viewingVisit.remarks} />
                                    </div>
                                )}
                            </RecordSection>

                            {/* Modal Footer Actions */}
                            <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = viewingVisit;
                                        setViewingVisit(null);
                                        openMedicalReportForVisit(target);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#70091f]/40 bg-[#fdf5f3] px-4 py-2.5 text-xs font-semibold text-[#70091f] transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                >
                                    <FileBadge size={14} className="shrink-0" />
                                    Medical Certificate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = viewingVisit;
                                        setViewingVisit(null);
                                        handleEdit(target);
                                    }}
                                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400 cursor-pointer"
                                >
                                    Edit Visit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingVisit(null)}
                                    className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Restore Deleted Visits Modal */}
                <RestoreVisitsModal
                    open={showRestoreModal}
                    onClose={() => setShowRestoreModal(false)}
                    onRestored={() => fetchVisits(visitPagination.current_page, search)}
                />
            </div>
        </div>
    );
}

export default ClinicVisits;
