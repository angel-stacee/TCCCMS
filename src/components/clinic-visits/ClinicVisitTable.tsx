import type { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, FileBadge, FileText, Pencil, Search, Stethoscope, Trash2, X } from "lucide-react";
import { ReasonBadge } from "../../utils/reasonColors";
import { formatNA, formatTemperature, mapCourseToDepartment } from "../../utils/formatters";

export interface VisitRecord { id: number | string; visit_date?: string | null; reason?: string | null; department?: string | null; [key: string]: any; }
interface VisitPagination { current_page: number; last_page: number; total: number; per_page: number; }
interface ClinicVisitTableProps {
    search: string;
    setSearch: (value: string) => void;
    loading: boolean;
    pageLoading: boolean;
    filteredVisits: VisitRecord[];
    getPatientName: (visit: VisitRecord) => { name: string; id?: string; type?: string };
    getNurseName: (nurse: any) => string;
    getMedicineName: (medicine: any) => string;
    getMedicineUnit: (medicine: any) => string;
    formatDate: (date: string | null | undefined) => string;
    handleEdit: (visit: VisitRecord) => void;
    deleteVisit: VisitRecord | null;
    setDeleteVisit: Dispatch<SetStateAction<VisitRecord | null>>;
    handleDelete: () => void;
    visitPagination: VisitPagination;
    fetchVisits: (page?: number, searchTerm?: string) => Promise<void>;
    onOpenMedicalReport?: (visit: VisitRecord) => void;
    onDownloadCertificate?: (visit: VisitRecord) => void;
    onViewVisit?: (visit: VisitRecord) => void;
}

export function ClinicVisitTable({
    search,
    setSearch,
    loading,
    pageLoading,
    filteredVisits,
    getPatientName,
    getNurseName,
    getMedicineName,
    getMedicineUnit,
    formatDate,
    handleEdit,
    deleteVisit,
    setDeleteVisit,
    handleDelete,
    visitPagination,
    fetchVisits,
    onOpenMedicalReport,
    onDownloadCertificate,
    onViewVisit,
}: ClinicVisitTableProps) {
    return (
        <>

            <div className="overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm dark:border-stone-800 dark:bg-[#211c17]">
                <div className="flex flex-col gap-1 border-b border-[#e8dfd4] px-4 py-3 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
                    <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#3d3329] dark:text-stone-100">
                            Clinic Visit Records
                        </h2>

                        <p className="mt-0.5 text-[11px] sm:text-xs text-[#887d70] dark:text-stone-400">
                            Showing {filteredVisits.length} of {visitPagination.total} recorded visits
                        </p>
                    </div>
                </div>

                {/* DESKTOP / LAPTOP TABLE VIEW (Auto-fits PC & Laptop screens without forced overflow) */}
                <div className="hidden md:block overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[1080px] table-auto">
                        <thead>
                            <tr className="border-b border-[#e8dfd4] bg-[#fcfaf6] dark:border-stone-800 dark:bg-[#261f19]">
                                <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Patient
                                </th>
                                <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Nurse on Duty
                                </th>
                                <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Reason
                                </th>
                                <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Department
                                </th>
                                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Visit Date
                                </th>
                                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Temperature
                                </th>
                                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Blood Pressure
                                </th>
                                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f]">
                                    Treatment
                                </th>
                                <th className="px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f]">
                                    Medicine
                                </th>
                                <th className="px-3.5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#887d70] dark:text-[#a99d8f] whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {pageLoading ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="px-5 py-12 text-center text-xs text-[#887d70] dark:text-stone-400"
                                    >
                                        Loading clinic visits...
                                    </td>
                                </tr>
                            ) : filteredVisits.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="px-5 py-12 text-center"
                                    >
                                        <Stethoscope
                                            size={30}
                                            className="mx-auto mb-2 text-[#ded4c9] dark:text-stone-600"
                                        />
                                        <p className="text-sm font-semibold text-[#54483a] dark:text-stone-200">
                                            No clinic visits found
                                        </p>
                                        <p className="mt-1 text-xs text-[#887d70] dark:text-stone-400">
                                            No clinic visit records match your search.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVisits.map((visit) => {
                                    const patient = getPatientName(visit);
                                    const medicineName = getMedicineName(visit.medicine);
                                    const dept =
                                        visit.department ||
                                        (visit.student?.course
                                            ? mapCourseToDepartment(visit.student.course)
                                            : visit.faculty?.department || visit.staff?.department);

                                    return (
                                        <tr
                                            key={visit.id}
                                            className="border-b border-[#eee7de] transition hover:bg-[#fcfaf6] dark:border-stone-800 dark:hover:bg-[#261f19]"
                                        >
                                            <td className="px-3.5 py-3">
                                                <p className="text-xs font-bold text-[#3c332a] dark:text-stone-100">
                                                    {formatNA(patient.name)}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-[#887d70] dark:text-stone-400">
                                                    {formatNA(patient.type)}
                                                    {patient.id ? ` • ${patient.id}` : ""}
                                                </p>
                                            </td>

                                            <td className="px-3.5 py-3">
                                                <p className="text-xs font-medium text-[#3c332a] dark:text-stone-200">
                                                    {formatNA(getNurseName(visit.nurse))}
                                                </p>
                                                {visit.nurse?.role && (
                                                    <p className="mt-0.5 text-[10px] text-[#887d70] dark:text-stone-400">
                                                        {visit.nurse.role}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-3.5 py-3 whitespace-nowrap">
                                                <ReasonBadge reason={visit.reason} symptoms={visit.symptoms} />
                                            </td>

                                            <td className="max-w-[200px] px-3.5 py-3 text-xs text-[#766959] dark:text-stone-300 truncate" title={dept || ""}>
                                                {formatNA(dept)}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-[#766959] dark:text-stone-300 whitespace-nowrap">
                                                {formatDate(visit.visit_date)}
                                            </td>

                                            <td className="px-3 py-3 text-xs font-medium text-[#766959] dark:text-stone-300 whitespace-nowrap">
                                                {formatTemperature(visit.temperature)}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-[#766959] dark:text-stone-300 whitespace-nowrap">
                                                {formatNA(visit.blood_pressure)}
                                            </td>

                                            <td className="max-w-[130px] px-3 py-3 text-xs text-[#766959] dark:text-stone-300 truncate" title={visit.treatment || ""}>
                                                {formatNA(visit.treatment)}
                                            </td>

                                            <td className="min-w-[140px] px-3.5 py-3 text-xs text-[#766959] dark:text-stone-300">
                                                {medicineName ? (
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-[#3d3329] dark:text-stone-100 leading-snug truncate" title={medicineName}>
                                                            {medicineName}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            {visit.medicine?.unit && (
                                                                <span className="inline-flex items-center rounded-md border border-[#e8dfd4] bg-[#fcfaf6] px-1.5 py-0.2 text-[9px] font-medium text-[#766959] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 whitespace-nowrap">
                                                                    Unit: {visit.medicine.unit}
                                                                </span>
                                                            )}
                                                            {visit.medicine_quantity && (
                                                                <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap">
                                                                    Qty: {visit.medicine_quantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#a99d8f] dark:text-stone-500">-</span>
                                                )}
                                            </td>

                                            <td className="px-3.5 py-3">
                                                <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenMedicalReport?.(visit)}
                                                        className="inline-flex h-7.5 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2 text-xs font-semibold text-[#70091f] shadow-xs transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                                        title="View Patient Medical Certificate & History"
                                                        aria-label="View Patient Medical Certificate & History"
                                                    >
                                                        <FileBadge size={13} className="shrink-0" />
                                                        <span className="hidden xl:inline">Medical Certificate</span>
                                                        <span className="xl:hidden">Med Cert</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onViewVisit
                                                                ? onViewVisit(visit)
                                                                : onOpenMedicalReport?.(visit)
                                                        }
                                                        className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                                                        title="View visit details"
                                                        aria-label="View visit details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(visit)}
                                                        className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/60 dark:bg-stone-800 dark:text-amber-400 cursor-pointer"
                                                        title="Edit visit"
                                                        aria-label="Edit visit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteVisit(visit)}
                                                        className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-stone-800 dark:text-red-400 cursor-pointer"
                                                        title="Delete visit"
                                                        aria-label="Delete visit"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW (Auto-fits phone & small screens without horizontal scroll) */}
                <div className="block md:hidden divide-y divide-[#eee7de] dark:divide-stone-800">
                    {pageLoading ? (
                        <div className="p-6 text-center text-xs text-[#887d70] dark:text-stone-400">
                            Loading clinic visits...
                        </div>
                    ) : filteredVisits.length === 0 ? (
                        <div className="p-8 text-center">
                            <Stethoscope size={28} className="mx-auto mb-2 text-[#ded4c9] dark:text-stone-600" />
                            <p className="text-sm font-semibold text-[#54483a] dark:text-stone-200">
                                No clinic visits found
                            </p>
                            <p className="mt-1 text-xs text-[#887d70] dark:text-stone-400">
                                No clinic visit records match your search.
                            </p>
                        </div>
                    ) : (
                        filteredVisits.map((visit) => {
                            const patient = getPatientName(visit);
                            const medicineName = getMedicineName(visit.medicine);
                            const dept =
                                visit.department ||
                                (visit.student?.course
                                    ? mapCourseToDepartment(visit.student.course)
                                    : visit.faculty?.department || visit.staff?.department);

                            return (
                                <div key={visit.id} className="p-4 space-y-3 transition hover:bg-[#fcfaf6] dark:hover:bg-[#261f19]">
                                    {/* Patient & Date Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-[#3c332a] dark:text-stone-100">
                                                    {formatNA(patient.name)}
                                                </h3>
                                                <span className="rounded-full bg-[#fcebe7] px-2 py-0.2 text-[10px] font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                    {patient.type || "Patient"}
                                                </span>
                                            </div>
                                            {patient.id && (
                                                <p className="text-[11px] text-[#887d70] dark:text-stone-400">
                                                    ID: {patient.id}
                                                </p>
                                            )}
                                        </div>

                                        <span className="shrink-0 rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] px-2 py-1 text-[11px] font-medium text-[#766959] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                            {formatDate(visit.visit_date)}
                                        </span>
                                    </div>

                                    {/* Reason, Department & Nurse */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <ReasonBadge reason={visit.reason} symptoms={visit.symptoms} />
                                        {dept && (
                                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300 truncate max-w-[200px]">
                                                {dept}
                                            </span>
                                        )}
                                        <span className="text-[11px] text-[#887d70] dark:text-stone-400">
                                            Nurse: <strong className="text-stone-800 dark:text-stone-200">{formatNA(getNurseName(visit.nurse))}</strong>
                                        </span>
                                    </div>

                                    {/* Vitals Strip */}
                                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e8dfd4] bg-[#faf7f2]/60 p-2.5 dark:border-stone-800 dark:bg-[#1a1511]">
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-[#887d70] dark:text-stone-400">
                                                Temperature
                                            </span>
                                            <span className="text-xs font-semibold text-[#3d3329] dark:text-stone-200">
                                                {formatTemperature(visit.temperature)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-[#887d70] dark:text-stone-400">
                                                Blood Pressure
                                            </span>
                                            <span className="text-xs font-semibold text-[#3d3329] dark:text-stone-200">
                                                {formatNA(visit.blood_pressure)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Treatment & Medicine */}
                                    {(visit.treatment || medicineName) && (
                                        <div className="text-xs space-y-1 rounded-xl bg-white p-2.5 border border-[#eee7de] dark:bg-stone-900 dark:border-stone-800">
                                            {visit.treatment && (
                                                <p className="text-[#3d3329] dark:text-stone-200">
                                                    <span className="font-semibold text-stone-500 dark:text-stone-400">Treatment: </span>
                                                    {visit.treatment}
                                                </p>
                                            )}
                                            {medicineName && (
                                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                    <span className="font-semibold text-stone-500 dark:text-stone-400">Medicine: </span>
                                                    <span className="font-bold text-[#3d3329] dark:text-stone-100">{medicineName}</span>
                                                    {visit.medicine?.unit && (
                                                        <span className="text-[10px] text-stone-500">({visit.medicine.unit})</span>
                                                    )}
                                                    {visit.medicine_quantity && (
                                                        <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                            Qty: {visit.medicine_quantity}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mobile Actions Bar */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-[#f0e7dd] dark:border-stone-800/80">
                                        <button
                                            type="button"
                                            onClick={() => onOpenMedicalReport?.(visit)}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#70091f]/40 bg-[#fdf5f3] py-2 px-3 text-xs font-semibold text-[#70091f] shadow-xs transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                        >
                                            <FileBadge size={14} className="shrink-0" />
                                            <span>Medical Certificate</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => (onViewVisit ? onViewVisit(visit) : onOpenMedicalReport?.(visit))}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 cursor-pointer"
                                            title="View visit"
                                            aria-label="View visit"
                                        >
                                            <Eye size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleEdit(visit)}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/60 dark:bg-stone-800 dark:text-amber-400 cursor-pointer"
                                            title="Edit visit"
                                            aria-label="Edit visit"
                                        >
                                            <Pencil size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDeleteVisit(visit)}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-stone-800 dark:text-red-400 cursor-pointer"
                                            title="Delete visit"
                                            aria-label="Delete visit"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RESPONSIVE PAGINATION FOOTER */}
            <div className="mt-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                <span className="font-semibold text-center sm:text-left">
                    Page <span className="font-bold text-[#70091f] dark:text-[#f8a598]">{visitPagination.current_page}</span> of <span className="font-bold">{visitPagination.last_page || 1}</span> ({visitPagination.total} total)
                </span>
                <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        disabled={visitPagination.current_page <= 1}
                        onClick={() => fetchVisits(visitPagination.current_page - 1, search)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                    >
                        <ChevronLeft size={14} strokeWidth={2.5} />
                        <span>Previous</span>
                    </button>

                    <button
                        type="button"
                        disabled={visitPagination.current_page >= visitPagination.last_page}
                        onClick={() => fetchVisits(visitPagination.current_page + 1, search)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                    >
                        <span>Next</span>
                        <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>


                {deleteVisit && typeof document !== "undefined" && createPortal(
                    <div
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                        style={{ zIndex: 99999 }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setDeleteVisit(null);
                            }
                        }}
                    >
                        <div
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1f1915] border border-stone-200 dark:border-[#382f25]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                    <Trash2 size={20} />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-[#3c332a] dark:text-stone-100">
                                        Delete Clinic Visit?
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-[#887d70] dark:text-stone-300">
                                        Are you sure you want to delete this clinic visit record? This action cannot be undone.
                                    </p>

                                    <div className="mt-3 rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-3 dark:border-[#382f25] dark:bg-[#28201a]">
                                        <p className="text-xs font-bold text-[#3d3329] dark:text-stone-100">
                                            {getPatientName(deleteVisit).name}
                                        </p>

                                        <p className="mt-1 text-[10px] text-[#887d70] dark:text-stone-400">
                                            {formatDate(deleteVisit.visit_date)}{" "}
                                            •{" "}
                                            {deleteVisit.reason || "Clinic Visit"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteVisit(null)}
                                    className="rounded-xl border border-[#e8dfd4] px-4 py-2.5 text-sm font-semibold text-[#766959] transition hover:bg-[#fcfaf6] dark:border-stone-700 dark:bg-[#1f1915] dark:text-stone-300 dark:hover:bg-[#2c221a]"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                                >
                                    <Trash2 size={15} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

        </>
    );
}
