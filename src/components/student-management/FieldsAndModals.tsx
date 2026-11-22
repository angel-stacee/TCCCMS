import { useState, useRef, useEffect, useMemo, type ChangeEventHandler, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Check, MapPin, ChevronDown } from "lucide-react";

interface InputFieldProps {
    label: string;
    value: string | number | null | undefined;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onBeforeInput?: React.FormEventHandler<HTMLInputElement>;
    onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    type?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    min?: string | number;
    max?: string | number;
    maxLength?: number;
    inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
    pattern?: string;
    error?: string;
}
interface SelectFieldProps { label: string; value: string | number | null | undefined; onChange: ChangeEventHandler<HTMLSelectElement>; options: string[]; required?: boolean; disabled?: boolean; }
interface ModalProps { children: ReactNode; onClose: () => void; title: string; maxWidth?: string; }
interface ConfirmationModalProps { open: boolean; title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onClose: () => void; }
interface InfoItemProps { label: string; value: ReactNode; }
interface RecordSectionProps { icon: ReactNode; title: string; children: ReactNode; }

export function InputField({
    label,
    value,
    onChange,
    onKeyDown,
    onBeforeInput,
    onPaste,
    onBlur,
    type = "text",
    required = false,
    placeholder = "",
    disabled = false,
    min,
    max,
    maxLength,
    inputMode,
    pattern,
    error,
}: InputFieldProps) {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>

            <input
                type={type}
                value={value ?? ""}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBeforeInput={onBeforeInput}
                onPaste={onPaste}
                onBlur={onBlur}
                required={required}
                placeholder={placeholder}
                disabled={disabled}
                min={min}
                max={max}
                maxLength={maxLength}
                inputMode={inputMode}
                pattern={pattern}
                className={`w-full rounded-lg border ${
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-stone-300 focus:border-[#70091f] focus:ring-[#70091f]/15"
                } bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 ${
                    hasValue ? "font-semibold text-stone-900 dark:text-stone-100" : "font-normal text-stone-700 placeholder:text-stone-400 dark:text-stone-300 dark:placeholder:text-stone-500"
                }`}
            />

            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
}

export interface AddressOption {
    barangay: string;
    municipality: string;
    province: string;
    fullAddress: string;
}

export const COMMON_BARANGAYS: AddressOption[] = [
    // Tagoloan (Host municipality of TCC - Top priority)
    { barangay: "Baluarte", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Baluarte, Tagoloan, Misamis Oriental" },
    { barangay: "Casinglot", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Casinglot, Tagoloan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Poblacion, Tagoloan, Misamis Oriental" },
    { barangay: "Natumolan", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Natumolan, Tagoloan, Misamis Oriental" },
    { barangay: "Mohon", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Mohon, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Ana", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Santa Ana, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Cruz", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Santa Cruz, Tagoloan, Misamis Oriental" },
    { barangay: "Gracia", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Gracia, Tagoloan, Misamis Oriental" },
    { barangay: "Rosario", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Rosario, Tagoloan, Misamis Oriental" },
    { barangay: "Sugbongcogon", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Sugbongcogon, Tagoloan, Misamis Oriental" },

    // Villanueva (Neighboring Municipality)
    { barangay: "Poblacion 1", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 1, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 2", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 2, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 3", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 3, Villanueva, Misamis Oriental" },
    { barangay: "Katipunan", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Katipunan, Villanueva, Misamis Oriental" },
    { barangay: "Dayawan", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Dayawan, Villanueva, Misamis Oriental" },
    { barangay: "Looc", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Looc, Villanueva, Misamis Oriental" },
    { barangay: "San Martin", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "San Martin, Villanueva, Misamis Oriental" },
    { barangay: "Imelda", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Imelda, Villanueva, Misamis Oriental" },

    // Jasaan (Neighboring Municipality)
    { barangay: "Lower Jasaan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Lower Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Upper Jasaan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Upper Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Aplaya", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Aplaya, Jasaan, Misamis Oriental" },
    { barangay: "Bobontohan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Bobontohan, Jasaan, Misamis Oriental" },
    { barangay: "Kimaya", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Kimaya, Jasaan, Misamis Oriental" },
    { barangay: "Luz Banzon", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Luz Banzon, Jasaan, Misamis Oriental" },
    { barangay: "Solana", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Solana, Jasaan, Misamis Oriental" },
    { barangay: "San Antonio", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "San Antonio, Jasaan, Misamis Oriental" },
    { barangay: "Jampason", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Jampason, Jasaan, Misamis Oriental" },
    { barangay: "IS Cruz", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "IS Cruz, Jasaan, Misamis Oriental" },

    // Claveria
    { barangay: "Poblacion", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Poblacion, Claveria, Misamis Oriental" },
    { barangay: "Patrocinio", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Patrocinio, Claveria, Misamis Oriental" },
    { barangay: "Hinaplanan", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Hinaplanan, Claveria, Misamis Oriental" },
    { barangay: "Tamboboan", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Tamboboan, Claveria, Misamis Oriental" },
    { barangay: "Mat-I", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Mat-I, Claveria, Misamis Oriental" },

    // Cagayan de Oro City (Districts frequented by students)
    { barangay: "Bugo", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Bugo, Cagayan de Oro City" },
    { barangay: "Puerto", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Puerto, Cagayan de Oro City" },
    { barangay: "Tablon", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Tablon, Cagayan de Oro City" },
    { barangay: "Agusan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Agusan, Cagayan de Oro City" },
    { barangay: "Cugman", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Cugman, Cagayan de Oro City" },
    { barangay: "Lapasan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Lapasan, Cagayan de Oro City" },
    { barangay: "Gusa", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Gusa, Cagayan de Oro City" },
    { barangay: "Macasandig", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Macasandig, Cagayan de Oro City" },
    { barangay: "Carmen", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Carmen, Cagayan de Oro City" },
    { barangay: "Kauswagan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Kauswagan, Cagayan de Oro City" },
    { barangay: "Bulua", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Bulua, Cagayan de Oro City" },
    { barangay: "Nazareth", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Nazareth, Cagayan de Oro City" },

    // Balingasag
    { barangay: "Poblacion", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Poblacion, Balingasag, Misamis Oriental" },
    { barangay: "Baliwagan", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Baliwagan, Balingasag, Misamis Oriental" },
    { barangay: "Linggangao", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Linggangao, Balingasag, Misamis Oriental" },
    { barangay: "Hermano", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Hermano, Balingasag, Misamis Oriental" },

    // Other Misamis Oriental Municipalities
    { barangay: "Poblacion", municipality: "Opol", province: "Misamis Oriental", fullAddress: "Poblacion, Opol, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "El Salvador City", province: "Misamis Oriental", fullAddress: "Poblacion, El Salvador City, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Alubijid", province: "Misamis Oriental", fullAddress: "Poblacion, Alubijid, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Initao", province: "Misamis Oriental", fullAddress: "Poblacion, Initao, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Salay", province: "Misamis Oriental", fullAddress: "Poblacion, Salay, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Gingoog City", province: "Misamis Oriental", fullAddress: "Poblacion, Gingoog City, Misamis Oriental" },
];

export interface AddressAutocompleteFieldProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
}

export function AddressAutocompleteField({
    label = "Address",
    value,
    onChange,
    required = false,
    placeholder = "e.g. Baluarte, Tagoloan or type street / purok",
    disabled = false,
    error,
}: AddressAutocompleteFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Outside click listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter matching barangays and municipalities
    const filteredOptions = useMemo(() => {
        const query = (value || "").toLowerCase().trim();
        if (!query) {
            // Show all 10 Tagoloan barangays by default
            return COMMON_BARANGAYS.slice(0, 10);
        }

        // Extract last token or words to match barangay / municipality name
        const cleanQuery = query.replace(/^purok\s*\d+[,.\s]*/i, "").replace(/^zone\s*\d+[,.\s]*/i, "").trim();

        const matches = COMMON_BARANGAYS.filter((item) => {
            const b = item.barangay.toLowerCase();
            const m = item.municipality.toLowerCase();
            const f = item.fullAddress.toLowerCase();
            return f.includes(query) || (cleanQuery && (b.includes(cleanQuery) || m.includes(cleanQuery)));
        });

        if (matches.length > 0) return matches.slice(0, 12);

        // Fallback: search across all barangays
        return COMMON_BARANGAYS.filter((item) => {
            return item.barangay.toLowerCase().includes(cleanQuery) || item.municipality.toLowerCase().includes(cleanQuery);
        }).slice(0, 10);
    }, [value]);

    const handleSelectOption = (option: AddressOption) => {
        const trimmed = (value || "").trim();
        // Check if user already typed a prefix like "Purok 1", "Zone 2", "Sitio...", or specific street
        const prefixMatch = trimmed.match(/^(purok\s*\d+|zone\s*\d+|sitio\s*[\w\s]+|blk\s*\d+\s*lot\s*\d+)[,.\s]*/i);

        let finalAddress = option.fullAddress;
        if (prefixMatch && prefixMatch[1]) {
            const prefix = prefixMatch[1].trim();
            finalAddress = `${prefix}, ${option.fullAddress}`;
        }

        onChange(finalAddress);
        setIsOpen(false);
        setHighlightIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        } else if (e.key === "Enter") {
            if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
                e.preventDefault();
                handleSelectOption(filteredOptions[highlightIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

    return (
        <div ref={containerRef} className="relative flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    (Auto-suggests Barangay & Place)
                </span>
            </div>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    required={required}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    list="tcc-address-datalist"
                    className={`w-full rounded-lg border ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-stone-300 focus:border-[#70091f] focus:ring-[#70091f]/15"
                    } bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 ${
                        hasValue
                            ? "font-semibold text-stone-900 dark:text-stone-100"
                            : "font-normal text-stone-700 placeholder:text-stone-400 dark:text-stone-300 dark:placeholder:text-stone-500"
                    }`}
                />

                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen((prev) => !prev);
                            inputRef.current?.focus();
                        }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                    aria-label="Toggle barangay suggestions"
                >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* Native Mobile Keyboard Datalist Fallback */}
            <datalist id="tcc-address-datalist">
                {COMMON_BARANGAYS.map((b, idx) => (
                    <option key={`dl-${idx}`} value={b.fullAddress} />
                ))}
            </datalist>

            {/* Floating Dropdown Autocomplete Menu */}
            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-stone-700 dark:bg-stone-900 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        <span>Select Barangay / Location</span>
                        <span className="text-[10px] lowercase text-[#70091f] dark:text-[#f8a598]">Tagoloan & Mis. Or.</span>
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isHighlighted = index === highlightIndex;
                                return (
                                    <button
                                        key={`bar-${index}-${option.barangay}-${option.municipality}`}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent input blur before click registers
                                            handleSelectOption(option);
                                        }}
                                        onMouseEnter={() => setHighlightIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2.5 transition text-xs cursor-pointer ${
                                            isHighlighted
                                                ? "bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/25 dark:text-[#f8a598]"
                                                : "text-stone-800 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                                        }`}
                                    >
                                        <MapPin
                                            size={15}
                                            className="mt-0.5 shrink-0 text-[#70091f] dark:text-[#f8a598]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-[13px] leading-tight">
                                                Brgy. {option.barangay}
                                            </p>
                                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                                {option.municipality}, {option.province}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2.5 text-center text-xs text-stone-500 dark:text-stone-400">
                                No matching barangay found. You can continue typing custom address.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

export interface AddressOption {
    barangay: string;
    municipality: string;
    province: string;
    fullAddress: string;
}

export const COMMON_BARANGAYS: AddressOption[] = [
    // Tagoloan (Host municipality of TCC - Top priority)
    { barangay: "Baluarte", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Baluarte, Tagoloan, Misamis Oriental" },
    { barangay: "Casinglot", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Casinglot, Tagoloan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Poblacion, Tagoloan, Misamis Oriental" },
    { barangay: "Natumolan", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Natumolan, Tagoloan, Misamis Oriental" },
    { barangay: "Mohon", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Mohon, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Ana", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Santa Ana, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Cruz", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Santa Cruz, Tagoloan, Misamis Oriental" },
    { barangay: "Gracia", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Gracia, Tagoloan, Misamis Oriental" },
    { barangay: "Rosario", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Rosario, Tagoloan, Misamis Oriental" },
    { barangay: "Sugbongcogon", municipality: "Tagoloan", province: "Misamis Oriental", fullAddress: "Sugbongcogon, Tagoloan, Misamis Oriental" },

    // Villanueva (Neighboring Municipality)
    { barangay: "Poblacion 1", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 1, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 2", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 2, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 3", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Poblacion 3, Villanueva, Misamis Oriental" },
    { barangay: "Katipunan", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Katipunan, Villanueva, Misamis Oriental" },
    { barangay: "Dayawan", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Dayawan, Villanueva, Misamis Oriental" },
    { barangay: "Looc", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Looc, Villanueva, Misamis Oriental" },
    { barangay: "San Martin", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "San Martin, Villanueva, Misamis Oriental" },
    { barangay: "Imelda", municipality: "Villanueva", province: "Misamis Oriental", fullAddress: "Imelda, Villanueva, Misamis Oriental" },

    // Jasaan (Neighboring Municipality)
    { barangay: "Lower Jasaan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Lower Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Upper Jasaan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Upper Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Aplaya", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Aplaya, Jasaan, Misamis Oriental" },
    { barangay: "Bobontohan", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Bobontohan, Jasaan, Misamis Oriental" },
    { barangay: "Kimaya", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Kimaya, Jasaan, Misamis Oriental" },
    { barangay: "Luz Banzon", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Luz Banzon, Jasaan, Misamis Oriental" },
    { barangay: "Solana", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Solana, Jasaan, Misamis Oriental" },
    { barangay: "San Antonio", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "San Antonio, Jasaan, Misamis Oriental" },
    { barangay: "Jampason", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "Jampason, Jasaan, Misamis Oriental" },
    { barangay: "IS Cruz", municipality: "Jasaan", province: "Misamis Oriental", fullAddress: "IS Cruz, Jasaan, Misamis Oriental" },

    // Claveria
    { barangay: "Poblacion", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Poblacion, Claveria, Misamis Oriental" },
    { barangay: "Patrocinio", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Patrocinio, Claveria, Misamis Oriental" },
    { barangay: "Hinaplanan", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Hinaplanan, Claveria, Misamis Oriental" },
    { barangay: "Tamboboan", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Tamboboan, Claveria, Misamis Oriental" },
    { barangay: "Mat-I", municipality: "Claveria", province: "Misamis Oriental", fullAddress: "Mat-I, Claveria, Misamis Oriental" },

    // Cagayan de Oro City (Districts frequented by students)
    { barangay: "Bugo", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Bugo, Cagayan de Oro City" },
    { barangay: "Puerto", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Puerto, Cagayan de Oro City" },
    { barangay: "Tablon", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Tablon, Cagayan de Oro City" },
    { barangay: "Agusan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Agusan, Cagayan de Oro City" },
    { barangay: "Cugman", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Cugman, Cagayan de Oro City" },
    { barangay: "Lapasan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Lapasan, Cagayan de Oro City" },
    { barangay: "Gusa", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Gusa, Cagayan de Oro City" },
    { barangay: "Macasandig", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Macasandig, Cagayan de Oro City" },
    { barangay: "Carmen", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Carmen, Cagayan de Oro City" },
    { barangay: "Kauswagan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Kauswagan, Cagayan de Oro City" },
    { barangay: "Bulua", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Bulua, Cagayan de Oro City" },
    { barangay: "Nazareth", municipality: "Cagayan de Oro City", province: "Misamis Oriental", fullAddress: "Nazareth, Cagayan de Oro City" },

    // Balingasag
    { barangay: "Poblacion", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Poblacion, Balingasag, Misamis Oriental" },
    { barangay: "Baliwagan", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Baliwagan, Balingasag, Misamis Oriental" },
    { barangay: "Linggangao", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Linggangao, Balingasag, Misamis Oriental" },
    { barangay: "Hermano", municipality: "Balingasag", province: "Misamis Oriental", fullAddress: "Hermano, Balingasag, Misamis Oriental" },

    // Other Misamis Oriental Municipalities
    { barangay: "Poblacion", municipality: "Opol", province: "Misamis Oriental", fullAddress: "Poblacion, Opol, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "El Salvador City", province: "Misamis Oriental", fullAddress: "Poblacion, El Salvador City, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Alubijid", province: "Misamis Oriental", fullAddress: "Poblacion, Alubijid, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Initao", province: "Misamis Oriental", fullAddress: "Poblacion, Initao, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Salay", province: "Misamis Oriental", fullAddress: "Poblacion, Salay, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Gingoog City", province: "Misamis Oriental", fullAddress: "Poblacion, Gingoog City, Misamis Oriental" },
];

export interface AddressAutocompleteFieldProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
}

export function AddressAutocompleteField({
    label = "Address",
    value,
    onChange,
    required = false,
    placeholder = "e.g. Baluarte, Tagoloan or type street / purok",
    disabled = false,
    error,
}: AddressAutocompleteFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Outside click listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter matching barangays and municipalities
    const filteredOptions = useMemo(() => {
        const query = (value || "").toLowerCase().trim();
        if (!query) {
            // Show all 10 Tagoloan barangays by default
            return COMMON_BARANGAYS.slice(0, 10);
        }

        // Extract last token or words to match barangay / municipality name
        const cleanQuery = query.replace(/^purok\s*\d+[,.\s]*/i, "").replace(/^zone\s*\d+[,.\s]*/i, "").trim();

        const matches = COMMON_BARANGAYS.filter((item) => {
            const b = item.barangay.toLowerCase();
            const m = item.municipality.toLowerCase();
            const f = item.fullAddress.toLowerCase();
            return f.includes(query) || (cleanQuery && (b.includes(cleanQuery) || m.includes(cleanQuery)));
        });

        if (matches.length > 0) return matches.slice(0, 12);

        // Fallback: search across all barangays
        return COMMON_BARANGAYS.filter((item) => {
            return item.barangay.toLowerCase().includes(cleanQuery) || item.municipality.toLowerCase().includes(cleanQuery);
        }).slice(0, 10);
    }, [value]);

    const handleSelectOption = (option: AddressOption) => {
        const trimmed = (value || "").trim();
        // Check if user already typed a prefix like "Purok 1", "Zone 2", "Sitio...", or specific street
        const prefixMatch = trimmed.match(/^(purok\s*\d+|zone\s*\d+|sitio\s*[\w\s]+|blk\s*\d+\s*lot\s*\d+)[,.\s]*/i);

        let finalAddress = option.fullAddress;
        if (prefixMatch && prefixMatch[1]) {
            const prefix = prefixMatch[1].trim();
            finalAddress = `${prefix}, ${option.fullAddress}`;
        }

        onChange(finalAddress);
        setIsOpen(false);
        setHighlightIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        } else if (e.key === "Enter") {
            if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
                e.preventDefault();
                handleSelectOption(filteredOptions[highlightIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

    return (
        <div ref={containerRef} className="relative flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    (Auto-suggests Barangay & Place)
                </span>
            </div>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    required={required}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    list="tcc-address-datalist"
                    className={`w-full rounded-lg border ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-stone-300 focus:border-[#70091f] focus:ring-[#70091f]/15"
                    } bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 ${
                        hasValue
                            ? "font-semibold text-stone-900 dark:text-stone-100"
                            : "font-normal text-stone-700 placeholder:text-stone-400 dark:text-stone-300 dark:placeholder:text-stone-500"
                    }`}
                />

                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen((prev) => !prev);
                            inputRef.current?.focus();
                        }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                    aria-label="Toggle barangay suggestions"
                >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* Native Mobile Keyboard Datalist Fallback */}
            <datalist id="tcc-address-datalist">
                {COMMON_BARANGAYS.map((b, idx) => (
                    <option key={`dl-${idx}`} value={b.fullAddress} />
                ))}
            </datalist>

            {/* Floating Dropdown Autocomplete Menu */}
            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-stone-700 dark:bg-stone-900 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        <span>Select Barangay / Location</span>
                        <span className="text-[10px] lowercase text-[#70091f] dark:text-[#f8a598]">Tagoloan & Mis. Or.</span>
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isHighlighted = index === highlightIndex;
                                return (
                                    <button
                                        key={`bar-${index}-${option.barangay}-${option.municipality}`}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent input blur before click registers
                                            handleSelectOption(option);
                                        }}
                                        onMouseEnter={() => setHighlightIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-2.5 transition text-xs cursor-pointer ${
                                            isHighlighted
                                                ? "bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/25 dark:text-[#f8a598]"
                                                : "text-stone-800 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                                        }`}
                                    >
                                        <MapPin
                                            size={15}
                                            className="mt-0.5 shrink-0 text-[#70091f] dark:text-[#f8a598]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-[13px] leading-tight">
                                                Brgy. {option.barangay}
                                            </p>
                                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                                {option.municipality}, {option.province}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2.5 text-center text-xs text-stone-500 dark:text-stone-400">
                                No matching barangay found. You can continue typing custom address.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

const MONTH_NAMES = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

export function DateOfBirthField({
    label = "Birth Date",
    value,
    onChange,
    required = false,
    error,
}: {
    label?: string;
    value: string;
    onChange: (dateStr: string) => void;
    required?: boolean;
    error?: string;
}) {
    const normalized = (value || "").replace(/\//g, "-");
    const rawParts = normalized.split("-");

    let selectedYear = "";
    let selectedMonth = "";
    let selectedDay = "";

    if (rawParts.length >= 3) {
        if (/^\d{4}$/.test(rawParts[0])) {
            // YYYY-MM-DD
            selectedYear = rawParts[0];
            selectedMonth = /^\d{1,2}$/.test(rawParts[1]) ? rawParts[1].padStart(2, "0") : "";
            selectedDay = /^\d{1,2}$/.test(rawParts[2]) ? rawParts[2].padStart(2, "0") : "";
        } else if (/^\d{4}$/.test(rawParts[2])) {
            // MM-DD-YYYY
            selectedYear = rawParts[2];
            selectedMonth = /^\d{1,2}$/.test(rawParts[0]) ? rawParts[0].padStart(2, "0") : "";
            selectedDay = /^\d{1,2}$/.test(rawParts[1]) ? rawParts[1].padStart(2, "0") : "";
        } else {
            selectedYear = /^\d{4}$/.test(rawParts[0]) ? rawParts[0] : "";
            selectedMonth = /^\d{1,2}$/.test(rawParts[1]) ? rawParts[1].padStart(2, "0") : "";
            selectedDay = /^\d{1,2}$/.test(rawParts[2]) ? rawParts[2].padStart(2, "0") : "";
        }
    } else if (rawParts.length === 2 && /^\d{4}$/.test(rawParts[0])) {
        selectedYear = rawParts[0];
        selectedMonth = /^\d{1,2}$/.test(rawParts[1]) ? rawParts[1].padStart(2, "0") : "";
    }

    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 1930; y--) {
        years.push(y);
    }

    const maxDays = (() => {
        if (!selectedMonth) return 31;
        const m = parseInt(selectedMonth, 10);
        if (m === 2) {
            const y = parseInt(selectedYear, 10);
            if (!y) return 29;
            return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
        }
        return [4, 6, 9, 11].includes(m) ? 30 : 31;
    })();

    const handlePartChange = (part: "year" | "month" | "day", val: string) => {
        const y = part === "year" ? val : selectedYear;
        const m = part === "month" ? val : selectedMonth;
        let d = part === "day" ? val : selectedDay;

        // Auto-correct day if month changes and day exceeds maxDays
        if (d && m) {
            const monthNum = parseInt(m, 10);
            let limit = 31;
            if (monthNum === 2) {
                const yearNum = parseInt(y, 10);
                limit = yearNum && ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) ? 29 : 28;
            } else if ([4, 6, 9, 11].includes(monthNum)) {
                limit = 30;
            }
            if (parseInt(d, 10) > limit) {
                d = String(limit).padStart(2, "0");
            }
        }

        if (y && m && d) {
            onChange(`${y}-${m}-${d}`);
        } else if (y || m || d) {
            onChange(`${y || ""}-${m || ""}-${d || ""}`);
        } else {
            onChange("");
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            <div className="grid grid-cols-3 gap-2">
                <select
                    value={selectedMonth}
                    onChange={(e) => handlePartChange("month", e.target.value)}
                    required={required}
                    className={`w-full rounded-lg border ${
                        error ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-[#70091f]"
                    } bg-white px-2.5 py-2.5 text-xs sm:text-sm outline-none transition focus:ring-2 focus:ring-[#70091f]/15 dark:border-stone-700 dark:bg-stone-800 ${
                        selectedMonth ? "font-semibold text-stone-900 dark:text-stone-100" : "font-normal text-stone-500 dark:text-stone-400"
                    }`}
                >
                    <option value="" className="text-stone-500 dark:bg-stone-800">Month</option>
                    {MONTH_NAMES.map((m) => (
                        <option key={m.value} value={m.value} className="text-stone-900 dark:bg-stone-800 dark:text-stone-100">
                            {m.label}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedDay}
                    onChange={(e) => handlePartChange("day", e.target.value)}
                    required={required}
                    className={`w-full rounded-lg border ${
                        error ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-[#70091f]"
                    } bg-white px-2.5 py-2.5 text-xs sm:text-sm outline-none transition focus:ring-2 focus:ring-[#70091f]/15 dark:border-stone-700 dark:bg-stone-800 ${
                        selectedDay ? "font-semibold text-stone-900 dark:text-stone-100" : "font-normal text-stone-500 dark:text-stone-400"
                    }`}
                >
                    <option value="" className="text-stone-500 dark:bg-stone-800">Day</option>
                    {Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                        <option key={d} value={d} className="text-stone-900 dark:bg-stone-800 dark:text-stone-100">
                            {d}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={(e) => handlePartChange("year", e.target.value)}
                    required={required}
                    className={`w-full rounded-lg border ${
                        error ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-[#70091f]"
                    } bg-white px-2.5 py-2.5 text-xs sm:text-sm outline-none transition focus:ring-2 focus:ring-[#70091f]/15 dark:border-stone-700 dark:bg-stone-800 ${
                        selectedYear ? "font-semibold text-stone-900 dark:text-stone-100" : "font-normal text-stone-500 dark:text-stone-400"
                    }`}
                >
                    <option value="" className="text-stone-500 dark:bg-stone-800">Year</option>
                    {years.map((y) => (
                        <option key={y} value={String(y)} className="text-stone-900 dark:bg-stone-800 dark:text-stone-100">
                            {y}
                        </option>
                    ))}
                </select>
            </div>

            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}







export function SelectField({
    label,
    value,
    onChange,
    options,
    required = false,
    disabled = false,
}: SelectFieldProps) {
    const stringVal = value !== null && value !== undefined && value !== "" ? String(value) : "";
    const allOptions = (stringVal && !options.includes(stringVal))
        ? [stringVal, ...options]
        : options;
    const hasValue = stringVal !== "";

    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>

            <select
                value={stringVal}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/15 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 ${
                    hasValue ? "font-semibold text-stone-900 dark:text-stone-100" : "font-normal text-stone-500 dark:text-stone-400"
                }`}
            >
                <option value="" className="text-stone-500 dark:bg-stone-800">
                    Select {label}
                </option>

                {allOptions.map((option) => (
                    <option key={option} value={option} className="text-stone-900 dark:bg-stone-800 dark:text-stone-100">
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}







export function Modal({
    children,
    onClose,
    title,
    maxWidth = "max-w-3xl",
}: ModalProps) {
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-3 sm:p-5 md:p-8 backdrop-blur-[3px] overflow-y-auto"
            style={{ zIndex: 99999 }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && onClose) {
                    onClose();
                }
            }}
        >
            <div
                className={`my-auto flex flex-col max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200 dark:bg-[#1f1915] dark:border-[#382f25]`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#e8dfd4] bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-[#382f25] dark:bg-[#1f1915]/95">
                    <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-[#2c221a] dark:hover:text-stone-200 cursor-pointer transition"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}







export function ConfirmationModal({
    open,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    loading = false,
    onConfirm,
    onClose,
}: ConfirmationModalProps) {
    if (!open) {
        return null;
    }

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            style={{ zIndex: 99999 }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && onClose && !loading) {
                    onClose();
                }
            }}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1f1915]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 px-6 py-5">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                            danger
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-600"
                        }`}
                    >
                        {danger ? (
                            <span className="text-2xl font-bold">!</span>
                        ) : (
                            <Check size={24} />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-stone-800 dark:text-white">
                            {title}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-stone-100 bg-stone-50 px-6 py-4 dark:border-[#382f25] dark:bg-[#28201a] sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-[#1f1915] dark:text-stone-200 dark:hover:bg-[#2c221a]"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            danger
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-[#70091f] hover:bg-[#8b1505]"
                        }`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}







export function InfoItem({ label, value }: InfoItemProps) {
    const isBlank =
        value === null ||
        value === undefined ||
        (typeof value === "string" &&
            (value.trim() === "" ||
                value.trim() === "-" ||
                value.toLowerCase() === "null" ||
                value.toLowerCase() === "undefined"));

    return (
        <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs font-medium uppercase text-stone-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium text-stone-800">
                {isBlank ? "N/A" : value}
            </p>
        </div>
    );
}







export function RecordSection({
    icon,
    title,
    children,
}: RecordSectionProps) {
    return (
        <div className="mb-6 last:mb-0">
            <div className="mb-3 flex items-center gap-2.5 border-b border-stone-100 pb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#70091f]/10 text-[#70091f]">
                    {icon}
                </span>

                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {title}
                </h3>
            </div>

            {children}
        </div>
    );
}







