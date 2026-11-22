export interface AddressOption {
    barangay: string;
    municipality: string;
    province: string;
    region?: string;
    fullAddress: string;
}

/**
 * Comprehensive coverage of Mindanao addresses across all 6 regions:
 * - Region X: Northern Mindanao (Misamis Oriental, Bukidnon, Lanao del Norte, Misamis Occidental, Camiguin)
 * - Region XI: Davao Region (Davao City, Davao del Norte, Davao del Sur, Davao Oriental, Davao de Oro, Davao Occidental)
 * - Region XII: SOCCSKSARGEN (General Santos City, South Cotabato, Cotabato / North Cotabato, Sultan Kudarat, Sarangani)
 * - Region IX: Zamboanga Peninsula (Zamboanga City, Zamboanga del Sur, Zamboanga del Norte, Zamboanga Sibugay)
 * - Region XIII: Caraga (Agusan del Norte, Agusan del Sur, Surigao del Norte, Surigao del Sur, Dinagat Islands)
 * - BARMM: Bangsamoro (Cotabato City, Lanao del Sur / Marawi, Maguindanao del Norte, Maguindanao del Sur, Basilan, Sulu, Tawi-Tawi)
 */
export const MINDANAO_ADDRESSES: AddressOption[] = [
    // =========================================================================
    // REGION X - NORTHERN MINDANAO
    // =========================================================================

    // 1. Tagoloan, Misamis Oriental (Host Municipality of TCC - Top Priority)
    { barangay: "Baluarte", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Baluarte, Tagoloan, Misamis Oriental" },
    { barangay: "Casinglot", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Casinglot, Tagoloan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Tagoloan, Misamis Oriental" },
    { barangay: "Natumolan", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Natumolan, Tagoloan, Misamis Oriental" },
    { barangay: "Mohon", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Mohon, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Ana", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Santa Ana, Tagoloan, Misamis Oriental" },
    { barangay: "Santa Cruz", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Santa Cruz, Tagoloan, Misamis Oriental" },
    { barangay: "Gracia", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Gracia, Tagoloan, Misamis Oriental" },
    { barangay: "Rosario", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Rosario, Tagoloan, Misamis Oriental" },
    { barangay: "Sugbongcogon", municipality: "Tagoloan", province: "Misamis Oriental", region: "Region X", fullAddress: "Sugbongcogon, Tagoloan, Misamis Oriental" },

    // 2. Villanueva, Misamis Oriental (Neighboring Municipality)
    { barangay: "Poblacion 1", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion 1, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 2", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion 2, Villanueva, Misamis Oriental" },
    { barangay: "Poblacion 3", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion 3, Villanueva, Misamis Oriental" },
    { barangay: "Katipunan", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Katipunan, Villanueva, Misamis Oriental" },
    { barangay: "Dayawan", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Dayawan, Villanueva, Misamis Oriental" },
    { barangay: "Looc", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Looc, Villanueva, Misamis Oriental" },
    { barangay: "San Martin", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "San Martin, Villanueva, Misamis Oriental" },
    { barangay: "Imelda", municipality: "Villanueva", province: "Misamis Oriental", region: "Region X", fullAddress: "Imelda, Villanueva, Misamis Oriental" },

    // 3. Jasaan, Misamis Oriental (Neighboring Municipality)
    { barangay: "Lower Jasaan", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Lower Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Upper Jasaan", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Upper Jasaan, Jasaan, Misamis Oriental" },
    { barangay: "Aplaya", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Aplaya, Jasaan, Misamis Oriental" },
    { barangay: "Bobontohan", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Bobontohan, Jasaan, Misamis Oriental" },
    { barangay: "Kimaya", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Kimaya, Jasaan, Misamis Oriental" },
    { barangay: "Luz Banzon", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Luz Banzon, Jasaan, Misamis Oriental" },
    { barangay: "Solana", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Solana, Jasaan, Misamis Oriental" },
    { barangay: "San Antonio", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "San Antonio, Jasaan, Misamis Oriental" },
    { barangay: "Jampason", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "Jampason, Jasaan, Misamis Oriental" },
    { barangay: "IS Cruz", municipality: "Jasaan", province: "Misamis Oriental", region: "Region X", fullAddress: "IS Cruz, Jasaan, Misamis Oriental" },

    // 4. Claveria, Misamis Oriental
    { barangay: "Poblacion", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Claveria, Misamis Oriental" },
    { barangay: "Patrocinio", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Patrocinio, Claveria, Misamis Oriental" },
    { barangay: "Hinaplanan", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Hinaplanan, Claveria, Misamis Oriental" },
    { barangay: "Tamboboan", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Tamboboan, Claveria, Misamis Oriental" },
    { barangay: "Mat-I", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Mat-I, Claveria, Misamis Oriental" },
    { barangay: "Lanise", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Lanise, Claveria, Misamis Oriental" },
    { barangay: "Aposkahoy", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Aposkahoy, Claveria, Misamis Oriental" },
    { barangay: "Malagana", municipality: "Claveria", province: "Misamis Oriental", region: "Region X", fullAddress: "Malagana, Claveria, Misamis Oriental" },

    // 5. Cagayan de Oro City (Misamis Oriental)
    { barangay: "Bugo", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Bugo, Cagayan de Oro City" },
    { barangay: "Puerto", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Puerto, Cagayan de Oro City" },
    { barangay: "Tablon", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Tablon, Cagayan de Oro City" },
    { barangay: "Agusan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Agusan, Cagayan de Oro City" },
    { barangay: "Cugman", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Cugman, Cagayan de Oro City" },
    { barangay: "Lapasan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Lapasan, Cagayan de Oro City" },
    { barangay: "Gusa", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Gusa, Cagayan de Oro City" },
    { barangay: "Macasandig", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Macasandig, Cagayan de Oro City" },
    { barangay: "Carmen", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Carmen, Cagayan de Oro City" },
    { barangay: "Kauswagan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Kauswagan, Cagayan de Oro City" },
    { barangay: "Bulua", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Bulua, Cagayan de Oro City" },
    { barangay: "Nazareth", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Nazareth, Cagayan de Oro City" },
    { barangay: "Camaman-an", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Camaman-an, Cagayan de Oro City" },
    { barangay: "Puntod", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Puntod, Cagayan de Oro City" },
    { barangay: "Macabalan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Macabalan, Cagayan de Oro City" },
    { barangay: "Patag", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Patag, Cagayan de Oro City" },
    { barangay: "Bonbon", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Bonbon, Cagayan de Oro City" },
    { barangay: "Bayabas", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Bayabas, Cagayan de Oro City" },
    { barangay: "Canitoan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Canitoan, Cagayan de Oro City" },
    { barangay: "Iponan", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Iponan, Cagayan de Oro City" },
    { barangay: "Lumbia", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Lumbia, Cagayan de Oro City" },
    { barangay: "Balulang", municipality: "Cagayan de Oro City", province: "Misamis Oriental", region: "Region X", fullAddress: "Balulang, Cagayan de Oro City" },

    // 6. Other Misamis Oriental Municipalities & Cities
    { barangay: "Poblacion", municipality: "Balingasag", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Balingasag, Misamis Oriental" },
    { barangay: "Baliwagan", municipality: "Balingasag", province: "Misamis Oriental", region: "Region X", fullAddress: "Baliwagan, Balingasag, Misamis Oriental" },
    { barangay: "Linggangao", municipality: "Balingasag", province: "Misamis Oriental", region: "Region X", fullAddress: "Linggangao, Balingasag, Misamis Oriental" },
    { barangay: "Hermano", municipality: "Balingasag", province: "Misamis Oriental", region: "Region X", fullAddress: "Hermano, Balingasag, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Opol", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Opol, Misamis Oriental" },
    { barangay: "Barra", municipality: "Opol", province: "Misamis Oriental", region: "Region X", fullAddress: "Barra, Opol, Misamis Oriental" },
    { barangay: "Igpit", municipality: "Opol", province: "Misamis Oriental", region: "Region X", fullAddress: "Igpit, Opol, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "El Salvador City", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, El Salvador City, Misamis Oriental" },
    { barangay: "Molugan", municipality: "El Salvador City", province: "Misamis Oriental", region: "Region X", fullAddress: "Molugan, El Salvador City, Misamis Oriental" },
    { barangay: "Amoros", municipality: "El Salvador City", province: "Misamis Oriental", region: "Region X", fullAddress: "Amoros, El Salvador City, Misamis Oriental" },
    { barangay: "Sinaloc", municipality: "El Salvador City", province: "Misamis Oriental", region: "Region X", fullAddress: "Sinaloc, El Salvador City, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Alubijid", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Alubijid, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Laguindingan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Laguindingan, Misamis Oriental" },
    { barangay: "Moog", municipality: "Laguindingan", province: "Misamis Oriental", region: "Region X", fullAddress: "Moog, Laguindingan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Gitagum", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Gitagum, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Libertad", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Libertad, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Initao", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Initao, Misamis Oriental" },
    { barangay: "Tubigan", municipality: "Initao", province: "Misamis Oriental", region: "Region X", fullAddress: "Tubigan, Initao, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Naawan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Naawan, Misamis Oriental" },
    { barangay: "Linangkayan", municipality: "Naawan", province: "Misamis Oriental", region: "Region X", fullAddress: "Linangkayan, Naawan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Manticao", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Manticao, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Lugait", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Lugait, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Lagonglong", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Lagonglong, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Salay", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Salay, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Binuangan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Binuangan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Sugbongcogon", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Sugbongcogon, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Kinoguitan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Kinoguitan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Balingoan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Balingoan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Talisayan", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Talisayan, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Medina", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Medina, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Gingoog City", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Gingoog City, Misamis Oriental" },
    { barangay: "Lunao", municipality: "Gingoog City", province: "Misamis Oriental", region: "Region X", fullAddress: "Lunao, Gingoog City, Misamis Oriental" },
    { barangay: "Anakan", municipality: "Gingoog City", province: "Misamis Oriental", region: "Region X", fullAddress: "Anakan, Gingoog City, Misamis Oriental" },
    { barangay: "Poblacion", municipality: "Magsaysay", province: "Misamis Oriental", region: "Region X", fullAddress: "Poblacion, Magsaysay, Misamis Oriental" },

    // 7. Bukidnon (Northern Mindanao)
    { barangay: "Poblacion", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Malaybalay City, Bukidnon" },
    { barangay: "Casisang", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Casisang, Malaybalay City, Bukidnon" },
    { barangay: "Sumpong", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Sumpong, Malaybalay City, Bukidnon" },
    { barangay: "Kalasungay", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Kalasungay, Malaybalay City, Bukidnon" },
    { barangay: "Aglayan", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Aglayan, Malaybalay City, Bukidnon" },
    { barangay: "Canayan", municipality: "Malaybalay City", province: "Bukidnon", region: "Region X", fullAddress: "Canayan, Malaybalay City, Bukidnon" },
    { barangay: "Poblacion", municipality: "Valencia City", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Valencia City, Bukidnon" },
    { barangay: "Bagontaas", municipality: "Valencia City", province: "Bukidnon", region: "Region X", fullAddress: "Bagontaas, Valencia City, Bukidnon" },
    { barangay: "Batangan", municipality: "Valencia City", province: "Bukidnon", region: "Region X", fullAddress: "Batangan, Valencia City, Bukidnon" },
    { barangay: "Lumbo", municipality: "Valencia City", province: "Bukidnon", region: "Region X", fullAddress: "Lumbo, Valencia City, Bukidnon" },
    { barangay: "Mailag", municipality: "Valencia City", province: "Bukidnon", region: "Region X", fullAddress: "Mailag, Valencia City, Bukidnon" },
    { barangay: "Tankulan", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Tankulan, Manolo Fortich, Bukidnon" },
    { barangay: "Damilag", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Damilag, Manolo Fortich, Bukidnon" },
    { barangay: "Ala-e", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Ala-e, Manolo Fortich, Bukidnon" },
    { barangay: "Dicklum", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Dicklum, Manolo Fortich, Bukidnon" },
    { barangay: "Agusan Canyon", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Agusan Canyon, Manolo Fortich, Bukidnon" },
    { barangay: "Lingion", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Lingion, Manolo Fortich, Bukidnon" },
    { barangay: "Lunocan", municipality: "Manolo Fortich", province: "Bukidnon", region: "Region X", fullAddress: "Lunocan, Manolo Fortich, Bukidnon" },
    { barangay: "Base Camp", municipality: "Maramag", province: "Bukidnon", region: "Region X", fullAddress: "Base Camp, Maramag, Bukidnon" },
    { barangay: "Dologon", municipality: "Maramag", province: "Bukidnon", region: "Region X", fullAddress: "Dologon, Maramag, Bukidnon" },
    { barangay: "North Poblacion", municipality: "Maramag", province: "Bukidnon", region: "Region X", fullAddress: "North Poblacion, Maramag, Bukidnon" },
    { barangay: "South Poblacion", municipality: "Maramag", province: "Bukidnon", region: "Region X", fullAddress: "South Poblacion, Maramag, Bukidnon" },
    { barangay: "Poblacion", municipality: "Quezon", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Quezon, Bukidnon" },
    { barangay: "Libertad", municipality: "Quezon", province: "Bukidnon", region: "Region X", fullAddress: "Libertad, Quezon, Bukidnon" },
    { barangay: "Salawagan", municipality: "Quezon", province: "Bukidnon", region: "Region X", fullAddress: "Salawagan, Quezon, Bukidnon" },
    { barangay: "Poblacion", municipality: "Impasugong", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Impasugong, Bukidnon" },
    { barangay: "Impalutao", municipality: "Impasugong", province: "Bukidnon", region: "Region X", fullAddress: "Impalutao, Impasugong, Bukidnon" },
    { barangay: "Poblacion", municipality: "Talakag", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Talakag, Bukidnon" },
    { barangay: "Tikalaan", municipality: "Talakag", province: "Bukidnon", region: "Region X", fullAddress: "Tikalaan, Talakag, Bukidnon" },
    { barangay: "Imbatug", municipality: "Baungon", province: "Bukidnon", region: "Region X", fullAddress: "Imbatug, Baungon, Bukidnon" },
    { barangay: "Danatag", municipality: "Baungon", province: "Bukidnon", region: "Region X", fullAddress: "Danatag, Baungon, Bukidnon" },
    { barangay: "Poblacion", municipality: "Libona", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Libona, Bukidnon" },
    { barangay: "Kinawe", municipality: "Libona", province: "Bukidnon", region: "Region X", fullAddress: "Kinawe, Libona, Bukidnon" },
    { barangay: "Kisolon", municipality: "Sumilao", province: "Bukidnon", region: "Region X", fullAddress: "Kisolon, Sumilao, Bukidnon" },
    { barangay: "Poblacion", municipality: "Malitbog", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Malitbog, Bukidnon" },
    { barangay: "Poblacion", municipality: "Lantapan", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Lantapan, Bukidnon" },
    { barangay: "Kibangay", municipality: "Lantapan", province: "Bukidnon", region: "Region X", fullAddress: "Kibangay, Lantapan, Bukidnon" },
    { barangay: "Poblacion", municipality: "Pangantucan", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Pangantucan, Bukidnon" },
    { barangay: "North Poblacion", municipality: "Don Carlos", province: "Bukidnon", region: "Region X", fullAddress: "North Poblacion, Don Carlos, Bukidnon" },
    { barangay: "Poblacion", municipality: "Kitaotao", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Kitaotao, Bukidnon" },
    { barangay: "Poblacion", municipality: "Dangcagan", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Dangcagan, Bukidnon" },
    { barangay: "Poblacion", municipality: "Kibawe", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Kibawe, Bukidnon" },
    { barangay: "Poblacion", municipality: "Damulog", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Damulog, Bukidnon" },
    { barangay: "Poblacion", municipality: "Kadingilan", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Kadingilan, Bukidnon" },
    { barangay: "Halapitan", municipality: "San Fernando", province: "Bukidnon", region: "Region X", fullAddress: "Halapitan, San Fernando, Bukidnon" },
    { barangay: "Poblacion", municipality: "Cabanglasan", province: "Bukidnon", region: "Region X", fullAddress: "Poblacion, Cabanglasan, Bukidnon" },

    // 8. Iligan City & Lanao del Norte (Northern Mindanao)
    { barangay: "Poblacion", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Iligan City, Lanao del Norte" },
    { barangay: "Tubod", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Tubod, Iligan City, Lanao del Norte" },
    { barangay: "Tibanga", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Tibanga, Iligan City, Lanao del Norte" },
    { barangay: "Suarez", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Suarez, Iligan City, Lanao del Norte" },
    { barangay: "Tambacan", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Tambacan, Iligan City, Lanao del Norte" },
    { barangay: "Hinaplanon", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Hinaplanon, Iligan City, Lanao del Norte" },
    { barangay: "Dalipuga", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Dalipuga, Iligan City, Lanao del Norte" },
    { barangay: "Buru-un", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Buru-un, Iligan City, Lanao del Norte" },
    { barangay: "Santa Filomena", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Santa Filomena, Iligan City, Lanao del Norte" },
    { barangay: "San Miguel", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "San Miguel, Iligan City, Lanao del Norte" },
    { barangay: "Pala-o", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Pala-o, Iligan City, Lanao del Norte" },
    { barangay: "Maria Cristina", municipality: "Iligan City", province: "Lanao del Norte", region: "Region X", fullAddress: "Maria Cristina, Iligan City, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Tubod", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Tubod, Lanao del Norte" },
    { barangay: "Pigcarangan", municipality: "Tubod", province: "Lanao del Norte", region: "Region X", fullAddress: "Pigcarangan, Tubod, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Kauswagan", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Kauswagan, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Linamon", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Linamon, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Kolambugan", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Kolambugan, Lanao del Norte" },
    { barangay: "Mukas", municipality: "Kolambugan", province: "Lanao del Norte", region: "Region X", fullAddress: "Mukas, Kolambugan, Lanao del Norte" },
    { barangay: "Lanipao", municipality: "Lala", province: "Lanao del Norte", region: "Region X", fullAddress: "Lanipao, Lala, Lanao del Norte" },
    { barangay: "Maranding", municipality: "Lala", province: "Lanao del Norte", region: "Region X", fullAddress: "Maranding, Lala, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Baroy", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Baroy, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Bacolod", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Bacolod, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Maigo", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Maigo, Lanao del Norte" },
    { barangay: "Poblacion", municipality: "Sultan Naga Dimaporo", province: "Lanao del Norte", region: "Region X", fullAddress: "Poblacion, Sultan Naga Dimaporo, Lanao del Norte" },

    // 9. Misamis Occidental (Northern Mindanao)
    { barangay: "Catadman-Manabay", municipality: "Ozamiz City", province: "Misamis Occidental", region: "Region X", fullAddress: "Catadman-Manabay, Ozamiz City, Misamis Occidental" },
    { barangay: "Aguada", municipality: "Ozamiz City", province: "Misamis Occidental", region: "Region X", fullAddress: "Aguada, Ozamiz City, Misamis Occidental" },
    { barangay: "Banadero", municipality: "Ozamiz City", province: "Misamis Occidental", region: "Region X", fullAddress: "Banadero, Ozamiz City, Misamis Occidental" },
    { barangay: "San Roque", municipality: "Ozamiz City", province: "Misamis Occidental", region: "Region X", fullAddress: "San Roque, Ozamiz City, Misamis Occidental" },
    { barangay: "Tinago", municipality: "Ozamiz City", province: "Misamis Occidental", region: "Region X", fullAddress: "Tinago, Ozamiz City, Misamis Occidental" },
    { barangay: "Poblacion 1", municipality: "Oroquieta City", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion 1, Oroquieta City, Misamis Occidental" },
    { barangay: "Lower Langcangan", municipality: "Oroquieta City", province: "Misamis Occidental", region: "Region X", fullAddress: "Lower Langcangan, Oroquieta City, Misamis Occidental" },
    { barangay: "Mobod", municipality: "Oroquieta City", province: "Misamis Occidental", region: "Region X", fullAddress: "Mobod, Oroquieta City, Misamis Occidental" },
    { barangay: "Maloro", municipality: "Tangub City", province: "Misamis Occidental", region: "Region X", fullAddress: "Maloro, Tangub City, Misamis Occidental" },
    { barangay: "Mantic", municipality: "Tangub City", province: "Misamis Occidental", region: "Region X", fullAddress: "Mantic, Tangub City, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Clarin", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Clarin, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Jimenez", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Jimenez, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Plaridel", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Plaridel, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Calamba", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Calamba, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Tudela", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Tudela, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Sinacaban", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Sinacaban, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Lopez Jaena", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Lopez Jaena, Misamis Occidental" },
    { barangay: "Poblacion", municipality: "Baliangao", province: "Misamis Occidental", region: "Region X", fullAddress: "Poblacion, Baliangao, Misamis Occidental" },

    // 10. Camiguin (Northern Mindanao)
    { barangay: "Poblacion", municipality: "Mambajao", province: "Camiguin", region: "Region X", fullAddress: "Poblacion, Mambajao, Camiguin" },
    { barangay: "Balbagon", municipality: "Mambajao", province: "Camiguin", region: "Region X", fullAddress: "Balbagon, Mambajao, Camiguin" },
    { barangay: "Yumbing", municipality: "Mambajao", province: "Camiguin", region: "Region X", fullAddress: "Yumbing, Mambajao, Camiguin" },
    { barangay: "Agoho", municipality: "Mambajao", province: "Camiguin", region: "Region X", fullAddress: "Agoho, Mambajao, Camiguin" },
    { barangay: "Poblacion", municipality: "Mahinog", province: "Camiguin", region: "Region X", fullAddress: "Poblacion, Mahinog, Camiguin" },
    { barangay: "Benoni", municipality: "Mahinog", province: "Camiguin", region: "Region X", fullAddress: "Benoni, Mahinog, Camiguin" },
    { barangay: "Poblacion", municipality: "Catarman", province: "Camiguin", region: "Region X", fullAddress: "Poblacion, Catarman, Camiguin" },
    { barangay: "Poblacion", municipality: "Guinsiliban", province: "Camiguin", region: "Region X", fullAddress: "Poblacion, Guinsiliban, Camiguin" },
    { barangay: "Poblacion", municipality: "Sagay", province: "Camiguin", region: "Region X", fullAddress: "Poblacion, Sagay, Camiguin" },

    // =========================================================================
    // REGION XI - DAVAO REGION
    // =========================================================================

    // 1. Davao City
    { barangay: "Poblacion", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Davao City" },
    { barangay: "Buhangin", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Buhangin, Davao City" },
    { barangay: "Matina Crossing", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Matina Crossing, Davao City" },
    { barangay: "Matina Aplaya", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Matina Aplaya, Davao City" },
    { barangay: "Talomo", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Talomo, Davao City" },
    { barangay: "Toril", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Toril, Davao City" },
    { barangay: "Calinan", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Calinan, Davao City" },
    { barangay: "Bunawan", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Bunawan, Davao City" },
    { barangay: "Agdao", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Agdao, Davao City" },
    { barangay: "Panacan", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Panacan, Davao City" },
    { barangay: "Sasa", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Sasa, Davao City" },
    { barangay: "Tibungco", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Tibungco, Davao City" },
    { barangay: "Mintal", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Mintal, Davao City" },
    { barangay: "Tugbok", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Tugbok, Davao City" },
    { barangay: "Maa", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Maa, Davao City" },
    { barangay: "Bangkal", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Bangkal, Davao City" },
    { barangay: "Cabantian", municipality: "Davao City", province: "Davao del Sur", region: "Region XI", fullAddress: "Cabantian, Davao City" },

    // 2. Davao del Norte
    { barangay: "Magugpo Poblacion", municipality: "Tagum City", province: "Davao del Norte", region: "Region XI", fullAddress: "Magugpo Poblacion, Tagum City, Davao del Norte" },
    { barangay: "Mankilam", municipality: "Tagum City", province: "Davao del Norte", region: "Region XI", fullAddress: "Mankilam, Tagum City, Davao del Norte" },
    { barangay: "Apokon", municipality: "Tagum City", province: "Davao del Norte", region: "Region XI", fullAddress: "Apokon, Tagum City, Davao del Norte" },
    { barangay: "Visayan Village", municipality: "Tagum City", province: "Davao del Norte", region: "Region XI", fullAddress: "Visayan Village, Tagum City, Davao del Norte" },
    { barangay: "San Miguel", municipality: "Tagum City", province: "Davao del Norte", region: "Region XI", fullAddress: "San Miguel, Tagum City, Davao del Norte" },
    { barangay: "New Pandan", municipality: "Panabo City", province: "Davao del Norte", region: "Region XI", fullAddress: "New Pandan, Panabo City, Davao del Norte" },
    { barangay: "Sto. Nino", municipality: "Panabo City", province: "Davao del Norte", region: "Region XI", fullAddress: "Sto. Nino, Panabo City, Davao del Norte" },
    { barangay: "Gredu", municipality: "Panabo City", province: "Davao del Norte", region: "Region XI", fullAddress: "Gredu, Panabo City, Davao del Norte" },
    { barangay: "Babak", municipality: "Island Garden City of Samal", province: "Davao del Norte", region: "Region XI", fullAddress: "Babak, Island Garden City of Samal, Davao del Norte" },
    { barangay: "Penaplata", municipality: "Island Garden City of Samal", province: "Davao del Norte", region: "Region XI", fullAddress: "Penaplata, Island Garden City of Samal, Davao del Norte" },
    { barangay: "Kaputian", municipality: "Island Garden City of Samal", province: "Davao del Norte", region: "Region XI", fullAddress: "Kaputian, Island Garden City of Samal, Davao del Norte" },
    { barangay: "Poblacion", municipality: "Carmen", province: "Davao del Norte", region: "Region XI", fullAddress: "Poblacion, Carmen, Davao del Norte" },
    { barangay: "Poblacion", municipality: "Sto. Tomas", province: "Davao del Norte", region: "Region XI", fullAddress: "Poblacion, Sto. Tomas, Davao del Norte" },
    { barangay: "Poblacion", municipality: "Kapalong", province: "Davao del Norte", region: "Region XI", fullAddress: "Poblacion, Kapalong, Davao del Norte" },

    // 3. Davao del Sur
    { barangay: "Zone 1", municipality: "Digos City", province: "Davao del Sur", region: "Region XI", fullAddress: "Zone 1, Digos City, Davao del Sur" },
    { barangay: "Zone 2", municipality: "Digos City", province: "Davao del Sur", region: "Region XI", fullAddress: "Zone 2, Digos City, Davao del Sur" },
    { barangay: "Zone 3", municipality: "Digos City", province: "Davao del Sur", region: "Region XI", fullAddress: "Zone 3, Digos City, Davao del Sur" },
    { barangay: "Aplaya", municipality: "Digos City", province: "Davao del Sur", region: "Region XI", fullAddress: "Aplaya, Digos City, Davao del Sur" },
    { barangay: "Tres de Mayo", municipality: "Digos City", province: "Davao del Sur", region: "Region XI", fullAddress: "Tres de Mayo, Digos City, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Santa Cruz", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Santa Cruz, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Bansalan", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Bansalan, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Hagonoy", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Hagonoy, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Matanao", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Matanao, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Padada", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Padada, Davao del Sur" },
    { barangay: "Poblacion", municipality: "Malalag", province: "Davao del Sur", region: "Region XI", fullAddress: "Poblacion, Malalag, Davao del Sur" },

    // 4. Davao Oriental
    { barangay: "Central", municipality: "Mati City", province: "Davao Oriental", region: "Region XI", fullAddress: "Central, Mati City, Davao Oriental" },
    { barangay: "Dahican", municipality: "Mati City", province: "Davao Oriental", region: "Region XI", fullAddress: "Dahican, Mati City, Davao Oriental" },
    { barangay: "Matiao", municipality: "Mati City", province: "Davao Oriental", region: "Region XI", fullAddress: "Matiao, Mati City, Davao Oriental" },
    { barangay: "Sainz", municipality: "Mati City", province: "Davao Oriental", region: "Region XI", fullAddress: "Sainz, Mati City, Davao Oriental" },
    { barangay: "Poblacion", municipality: "Lupon", province: "Davao Oriental", region: "Region XI", fullAddress: "Poblacion, Lupon, Davao Oriental" },
    { barangay: "Poblacion", municipality: "Banaybanay", province: "Davao Oriental", region: "Region XI", fullAddress: "Poblacion, Banaybanay, Davao Oriental" },
    { barangay: "Poblacion", municipality: "Governor Generoso", province: "Davao Oriental", region: "Region XI", fullAddress: "Poblacion, Governor Generoso, Davao Oriental" },
    { barangay: "Poblacion", municipality: "Baganga", province: "Davao Oriental", region: "Region XI", fullAddress: "Poblacion, Baganga, Davao Oriental" },
    { barangay: "Poblacion", municipality: "Cateel", province: "Davao Oriental", region: "Region XI", fullAddress: "Poblacion, Cateel, Davao Oriental" },

    // 5. Davao de Oro (Compostela Valley)
    { barangay: "Poblacion", municipality: "Nabunturan", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Nabunturan, Davao de Oro" },
    { barangay: "Basak", municipality: "Nabunturan", province: "Davao de Oro", region: "Region XI", fullAddress: "Basak, Nabunturan, Davao de Oro" },
    { barangay: "Poblacion", municipality: "Monkayo", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Monkayo, Davao de Oro" },
    { barangay: "Poblacion", municipality: "Compostela", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Compostela, Davao de Oro" },
    { barangay: "Poblacion", municipality: "Pantukan", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Pantukan, Davao de Oro" },
    { barangay: "Poblacion", municipality: "Maragusan", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Maragusan, Davao de Oro" },
    { barangay: "Poblacion", municipality: "Maco", province: "Davao de Oro", region: "Region XI", fullAddress: "Poblacion, Maco, Davao de Oro" },

    // 6. Davao Occidental
    { barangay: "Poblacion", municipality: "Malita", province: "Davao Occidental", region: "Region XI", fullAddress: "Poblacion, Malita, Davao Occidental" },
    { barangay: "Poblacion", municipality: "Santa Maria", province: "Davao Occidental", region: "Region XI", fullAddress: "Poblacion, Santa Maria, Davao Occidental" },
    { barangay: "Poblacion", municipality: "Don Marcelino", province: "Davao Occidental", region: "Region XI", fullAddress: "Poblacion, Don Marcelino, Davao Occidental" },
    { barangay: "Poblacion", municipality: "Jose Abad Santos", province: "Davao Occidental", region: "Region XI", fullAddress: "Poblacion, Jose Abad Santos, Davao Occidental" },

    // =========================================================================
    // REGION XII - SOCCSKSARGEN
    // =========================================================================

    // 1. General Santos City
    { barangay: "Dadiangas East", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Dadiangas East, General Santos City" },
    { barangay: "Dadiangas West", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Dadiangas West, General Santos City" },
    { barangay: "Dadiangas North", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Dadiangas North, General Santos City" },
    { barangay: "Dadiangas South", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Dadiangas South, General Santos City" },
    { barangay: "Calumpang", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Calumpang, General Santos City" },
    { barangay: "Labangal", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Labangal, General Santos City" },
    { barangay: "Lagao", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Lagao, General Santos City" },
    { barangay: "San Isidro", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "San Isidro, General Santos City" },
    { barangay: "City Heights", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "City Heights, General Santos City" },
    { barangay: "Fatima", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Fatima, General Santos City" },
    { barangay: "Tambler", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Tambler, General Santos City" },
    { barangay: "Bula", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Bula, General Santos City" },
    { barangay: "Apopong", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Apopong, General Santos City" },
    { barangay: "Mabuhay", municipality: "General Santos City", province: "South Cotabato", region: "Region XII", fullAddress: "Mabuhay, General Santos City" },

    // 2. South Cotabato
    { barangay: "Zone I", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Zone I, Koronadal City, South Cotabato" },
    { barangay: "Zone II", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Zone II, Koronadal City, South Cotabato" },
    { barangay: "Zone III", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Zone III, Koronadal City, South Cotabato" },
    { barangay: "Zone IV", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Zone IV, Koronadal City, South Cotabato" },
    { barangay: "General Paulino Santos", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "General Paulino Santos, Koronadal City, South Cotabato" },
    { barangay: "Morales", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Morales, Koronadal City, South Cotabato" },
    { barangay: "Sto. Nino", municipality: "Koronadal City", province: "South Cotabato", region: "Region XII", fullAddress: "Sto. Nino, Koronadal City, South Cotabato" },
    { barangay: "Poblacion", municipality: "Polomolok", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Polomolok, South Cotabato" },
    { barangay: "Cannery Site", municipality: "Polomolok", province: "South Cotabato", region: "Region XII", fullAddress: "Cannery Site, Polomolok, South Cotabato" },
    { barangay: "Poblacion", municipality: "Surallah", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Surallah, South Cotabato" },
    { barangay: "Poblacion", municipality: "Tupi", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Tupi, South Cotabato" },
    { barangay: "Poblacion", municipality: "Tampakan", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Tampakan, South Cotabato" },
    { barangay: "Poblacion", municipality: "Banga", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Banga, South Cotabato" },
    { barangay: "Poblacion", municipality: "Norala", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Norala, South Cotabato" },
    { barangay: "Poblacion", municipality: "Lake Sebu", province: "South Cotabato", region: "Region XII", fullAddress: "Poblacion, Lake Sebu, South Cotabato" },

    // 3. Cotabato (North Cotabato)
    { barangay: "Poblacion", municipality: "Kidapawan City", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Kidapawan City, Cotabato" },
    { barangay: "Sudapin", municipality: "Kidapawan City", province: "Cotabato", region: "Region XII", fullAddress: "Sudapin, Kidapawan City, Cotabato" },
    { barangay: "Singao", municipality: "Kidapawan City", province: "Cotabato", region: "Region XII", fullAddress: "Singao, Kidapawan City, Cotabato" },
    { barangay: "Manongol", municipality: "Kidapawan City", province: "Cotabato", region: "Region XII", fullAddress: "Manongol, Kidapawan City, Cotabato" },
    { barangay: "Poblacion 1", municipality: "Midsayap", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion 1, Midsayap, Cotabato" },
    { barangay: "Poblacion 2", municipality: "Midsayap", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion 2, Midsayap, Cotabato" },
    { barangay: "Poblacion", municipality: "Kabacan", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Kabacan, Cotabato" },
    { barangay: "Poblacion", municipality: "Pikit", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Pikit, Cotabato" },
    { barangay: "Poblacion", municipality: "Makilala", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Makilala, Cotabato" },
    { barangay: "Poblacion", municipality: "M'lang", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, M'lang, Cotabato" },
    { barangay: "Poblacion", municipality: "Antipas", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Antipas, Cotabato" },
    { barangay: "Poblacion", municipality: "Carmen", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Carmen, Cotabato" },
    { barangay: "Poblacion", municipality: "Pigcawayan", province: "Cotabato", region: "Region XII", fullAddress: "Poblacion, Pigcawayan, Cotabato" },

    // 4. Sultan Kudarat
    { barangay: "Poblacion", municipality: "Tacurong City", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Poblacion, Tacurong City, Sultan Kudarat" },
    { barangay: "New Isabela", municipality: "Tacurong City", province: "Sultan Kudarat", region: "Region XII", fullAddress: "New Isabela, Tacurong City, Sultan Kudarat" },
    { barangay: "Buenaflor", municipality: "Tacurong City", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Buenaflor, Tacurong City, Sultan Kudarat" },
    { barangay: "Kalawag I", municipality: "Isulan", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Kalawag I, Isulan, Sultan Kudarat" },
    { barangay: "Kalawag II", municipality: "Isulan", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Kalawag II, Isulan, Sultan Kudarat" },
    { barangay: "Poblacion", municipality: "Lebak", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Poblacion, Lebak, Sultan Kudarat" },
    { barangay: "Poblacion", municipality: "Esperanza", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Poblacion, Esperanza, Sultan Kudarat" },
    { barangay: "Poblacion", municipality: "Kalamansig", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Poblacion, Kalamansig, Sultan Kudarat" },
    { barangay: "Poblacion", municipality: "Lambayong", province: "Sultan Kudarat", region: "Region XII", fullAddress: "Poblacion, Lambayong, Sultan Kudarat" },

    // 5. Sarangani
    { barangay: "Poblacion", municipality: "Alabel", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Alabel, Sarangani" },
    { barangay: "Kawas", municipality: "Alabel", province: "Sarangani", region: "Region XII", fullAddress: "Kawas, Alabel, Sarangani" },
    { barangay: "Poblacion", municipality: "Glan", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Glan, Sarangani" },
    { barangay: "Gumasa", municipality: "Glan", province: "Sarangani", region: "Region XII", fullAddress: "Gumasa, Glan, Sarangani" },
    { barangay: "Poblacion", municipality: "Malungon", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Malungon, Sarangani" },
    { barangay: "Poblacion", municipality: "Kiamba", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Kiamba, Sarangani" },
    { barangay: "Poblacion", municipality: "Maitum", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Maitum, Sarangani" },
    { barangay: "Poblacion", municipality: "Maasim", province: "Sarangani", region: "Region XII", fullAddress: "Poblacion, Maasim, Sarangani" },

    // =========================================================================
    // REGION IX - ZAMBOANGA PENINSULA
    // =========================================================================

    // 1. Zamboanga City
    { barangay: "Canelar", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Canelar, Zamboanga City" },
    { barangay: "Pasonanca", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Pasonanca, Zamboanga City" },
    { barangay: "Santa Maria", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Santa Maria, Zamboanga City" },
    { barangay: "Tetuan", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Tetuan, Zamboanga City" },
    { barangay: "Tumaga", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Tumaga, Zamboanga City" },
    { barangay: "Baliwasan", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Baliwasan, Zamboanga City" },
    { barangay: "San Roque", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "San Roque, Zamboanga City" },
    { barangay: "Guiwan", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Guiwan, Zamboanga City" },
    { barangay: "Putik", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Putik, Zamboanga City" },
    { barangay: "Talon-Talon", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Talon-Talon, Zamboanga City" },
    { barangay: "Calarian", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Calarian, Zamboanga City" },
    { barangay: "Ayala", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Ayala, Zamboanga City" },
    { barangay: "Mercedes", municipality: "Zamboanga City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Mercedes, Zamboanga City" },

    // 2. Zamboanga del Sur
    { barangay: "San Jose", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "San Jose, Pagadian City, Zamboanga del Sur" },
    { barangay: "San Pedro", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "San Pedro, Pagadian City, Zamboanga del Sur" },
    { barangay: "Balangasan", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Balangasan, Pagadian City, Zamboanga del Sur" },
    { barangay: "Gatas", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Gatas, Pagadian City, Zamboanga del Sur" },
    { barangay: "Tuburan", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Tuburan, Pagadian City, Zamboanga del Sur" },
    { barangay: "Santa Lucia", municipality: "Pagadian City", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Santa Lucia, Pagadian City, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Aurora", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Aurora, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Molave", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Molave, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Dumingag", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Dumingag, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Mahayag", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Mahayag, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Tambulig", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Tambulig, Zamboanga del Sur" },
    { barangay: "Poblacion", municipality: "Labangan", province: "Zamboanga del Sur", region: "Region IX", fullAddress: "Poblacion, Labangan, Zamboanga del Sur" },

    // 3. Zamboanga del Norte
    { barangay: "Central", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Central, Dipolog City, Zamboanga del Norte" },
    { barangay: "Barra", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Barra, Dipolog City, Zamboanga del Norte" },
    { barangay: "Biasong", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Biasong, Dipolog City, Zamboanga del Norte" },
    { barangay: "Turno", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Turno, Dipolog City, Zamboanga del Norte" },
    { barangay: "Estaka", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Estaka, Dipolog City, Zamboanga del Norte" },
    { barangay: "Miputak", municipality: "Dipolog City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Miputak, Dipolog City, Zamboanga del Norte" },
    { barangay: "Poblacion", municipality: "Dapitan City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Poblacion, Dapitan City, Zamboanga del Norte" },
    { barangay: "Sunset Boulevard", municipality: "Dapitan City", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Sunset Boulevard, Dapitan City, Zamboanga del Norte" },
    { barangay: "Poblacion", municipality: "Sindangan", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Poblacion, Sindangan, Zamboanga del Norte" },
    { barangay: "Poblacion", municipality: "Liloy", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Poblacion, Liloy, Zamboanga del Norte" },
    { barangay: "Poblacion", municipality: "Labason", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Poblacion, Labason, Zamboanga del Norte" },
    { barangay: "Poblacion", municipality: "Siocon", province: "Zamboanga del Norte", region: "Region IX", fullAddress: "Poblacion, Siocon, Zamboanga del Norte" },

    // 4. Zamboanga Sibugay
    { barangay: "Poblacion", municipality: "Ipil", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Poblacion, Ipil, Zamboanga Sibugay" },
    { barangay: "Sanito", municipality: "Ipil", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Sanito, Ipil, Zamboanga Sibugay" },
    { barangay: "Tiayon", municipality: "Ipil", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Tiayon, Ipil, Zamboanga Sibugay" },
    { barangay: "Poblacion", municipality: "Titay", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Poblacion, Titay, Zamboanga Sibugay" },
    { barangay: "Poblacion", municipality: "Kabasalan", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Poblacion, Kabasalan, Zamboanga Sibugay" },
    { barangay: "Poblacion", municipality: "Buug", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Poblacion, Buug, Zamboanga Sibugay" },
    { barangay: "Poblacion", municipality: "Diplahan", province: "Zamboanga Sibugay", region: "Region IX", fullAddress: "Poblacion, Diplahan, Zamboanga Sibugay" },

    // =========================================================================
    // REGION XIII - CARAGA
    // =========================================================================

    // 1. Agusan del Norte
    { barangay: "Doongan", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Doongan, Butuan City, Agusan del Norte" },
    { barangay: "Libertad", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Libertad, Butuan City, Agusan del Norte" },
    { barangay: "San Vicente", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "San Vicente, Butuan City, Agusan del Norte" },
    { barangay: "Villa Kananga", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Villa Kananga, Butuan City, Agusan del Norte" },
    { barangay: "Ampayon", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Ampayon, Butuan City, Agusan del Norte" },
    { barangay: "Bancasi", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Bancasi, Butuan City, Agusan del Norte" },
    { barangay: "Baan", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Baan, Butuan City, Agusan del Norte" },
    { barangay: "Holy Redeemer", municipality: "Butuan City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Holy Redeemer, Butuan City, Agusan del Norte" },
    { barangay: "Poblacion 1", municipality: "Cabadbaran City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion 1, Cabadbaran City, Agusan del Norte" },
    { barangay: "Mabini", municipality: "Cabadbaran City", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Mabini, Cabadbaran City, Agusan del Norte" },
    { barangay: "Poblacion", municipality: "Buenavista", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion, Buenavista, Agusan del Norte" },
    { barangay: "Poblacion", municipality: "Nasipit", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion, Nasipit, Agusan del Norte" },
    { barangay: "Triangulo", municipality: "Nasipit", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Triangulo, Nasipit, Agusan del Norte" },
    { barangay: "Poblacion", municipality: "Carmen", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion, Carmen, Agusan del Norte" },
    { barangay: "Poblacion", municipality: "Tubay", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion, Tubay, Agusan del Norte" },
    { barangay: "Poblacion", municipality: "Jabonga", province: "Agusan del Norte", region: "Region XIII", fullAddress: "Poblacion, Jabonga, Agusan del Norte" },

    // 2. Agusan del Sur
    { barangay: "Taglatawan", municipality: "Bayugan City", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Taglatawan, Bayugan City, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Bayugan City", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Bayugan City, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "San Francisco", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, San Francisco, Agusan del Sur" },
    { barangay: "Hubang", municipality: "San Francisco", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Hubang, San Francisco, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Prosperidad", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Prosperidad, Agusan del Sur" },
    { barangay: "Patin-ay", municipality: "Prosperidad", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Patin-ay, Prosperidad, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Trento", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Trento, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Bunawan", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Bunawan, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Rosario", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Rosario, Agusan del Sur" },
    { barangay: "Poblacion", municipality: "Esperanza", province: "Agusan del Sur", region: "Region XIII", fullAddress: "Poblacion, Esperanza, Agusan del Sur" },

    // 3. Surigao del Norte & Siargao Island
    { barangay: "Washington", municipality: "Surigao City", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Washington, Surigao City, Surigao del Norte" },
    { barangay: "Taft", municipality: "Surigao City", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Taft, Surigao City, Surigao del Norte" },
    { barangay: "San Juan", municipality: "Surigao City", province: "Surigao del Norte", region: "Region XIII", fullAddress: "San Juan, Surigao City, Surigao del Norte" },
    { barangay: "Luna", municipality: "Surigao City", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Luna, Surigao City, Surigao del Norte" },
    { barangay: "Lipata", municipality: "Surigao City", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Lipata, Surigao City, Surigao del Norte" },
    { barangay: "General Luna", municipality: "Siargao Island", province: "Surigao del Norte", region: "Region XIII", fullAddress: "General Luna, Siargao Island, Surigao del Norte" },
    { barangay: "Dapa", municipality: "Siargao Island", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Dapa, Siargao Island, Surigao del Norte" },
    { barangay: "Del Carmen", municipality: "Siargao Island", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Del Carmen, Siargao Island, Surigao del Norte" },
    { barangay: "Poblacion", municipality: "Placer", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Poblacion, Placer, Surigao del Norte" },
    { barangay: "Poblacion", municipality: "Claver", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Poblacion, Claver, Surigao del Norte" },
    { barangay: "Poblacion", municipality: "Mainit", province: "Surigao del Norte", region: "Region XIII", fullAddress: "Poblacion, Mainit, Surigao del Norte" },

    // 4. Surigao del Sur
    { barangay: "Bongtod", municipality: "Tandag City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Bongtod, Tandag City, Surigao del Sur" },
    { barangay: "Bag-ong Lungsod", municipality: "Tandag City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Bag-ong Lungsod, Tandag City, Surigao del Sur" },
    { barangay: "Telaje", municipality: "Tandag City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Telaje, Tandag City, Surigao del Sur" },
    { barangay: "Dagocdoc", municipality: "Tandag City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Dagocdoc, Tandag City, Surigao del Sur" },
    { barangay: "Mangagoy", municipality: "Bislig City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Mangagoy, Bislig City, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Bislig City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Bislig City, Surigao del Sur" },
    { barangay: "Tabon", municipality: "Bislig City", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Tabon, Bislig City, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Hinatuan", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Hinatuan, Surigao del Sur" },
    { barangay: "Cambatong", municipality: "Hinatuan", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Cambatong, Hinatuan, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Barobo", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Barobo, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Tagbina", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Tagbina, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Cantilan", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Cantilan, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "Lianga", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, Lianga, Surigao del Sur" },
    { barangay: "Poblacion", municipality: "San Agustin", province: "Surigao del Sur", region: "Region XIII", fullAddress: "Poblacion, San Agustin, Surigao del Sur" },

    // 5. Dinagat Islands
    { barangay: "Poblacion", municipality: "San Jose", province: "Dinagat Islands", region: "Region XIII", fullAddress: "Poblacion, San Jose, Dinagat Islands" },
    { barangay: "Poblacion", municipality: "Basilisa", province: "Dinagat Islands", region: "Region XIII", fullAddress: "Poblacion, Basilisa, Dinagat Islands" },
    { barangay: "Poblacion", municipality: "Dinagat", province: "Dinagat Islands", region: "Region XIII", fullAddress: "Poblacion, Dinagat, Dinagat Islands" },
    { barangay: "Poblacion", municipality: "Cagdianao", province: "Dinagat Islands", region: "Region XIII", fullAddress: "Poblacion, Cagdianao, Dinagat Islands" },

    // =========================================================================
    // BARMM - BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO
    // =========================================================================

    // 1. Cotabato City
    { barangay: "Poblacion 1", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Poblacion 1, Cotabato City" },
    { barangay: "Poblacion 2", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Poblacion 2, Cotabato City" },
    { barangay: "Rosary Heights 1", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Rosary Heights 1, Cotabato City" },
    { barangay: "Rosary Heights 3", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Rosary Heights 3, Cotabato City" },
    { barangay: "Rosary Heights 7", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Rosary Heights 7, Cotabato City" },
    { barangay: "Tamontaka", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Tamontaka, Cotabato City" },
    { barangay: "Kalanganan", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Kalanganan, Cotabato City" },
    { barangay: "Bagua", municipality: "Cotabato City", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Bagua, Cotabato City" },

    // 2. Lanao del Sur & Marawi City
    { barangay: "Basak Malutlut", municipality: "Marawi City", province: "Lanao del Sur", region: "BARMM", fullAddress: "Basak Malutlut, Marawi City, Lanao del Sur" },
    { barangay: "Banggolo", municipality: "Marawi City", province: "Lanao del Sur", region: "BARMM", fullAddress: "Banggolo, Marawi City, Lanao del Sur" },
    { barangay: "Saduc", municipality: "Marawi City", province: "Lanao del Sur", region: "BARMM", fullAddress: "Saduc, Marawi City, Lanao del Sur" },
    { barangay: "Datu Saber", municipality: "Marawi City", province: "Lanao del Sur", region: "BARMM", fullAddress: "Datu Saber, Marawi City, Lanao del Sur" },
    { barangay: "Gadongan", municipality: "Marawi City", province: "Lanao del Sur", region: "BARMM", fullAddress: "Gadongan, Marawi City, Lanao del Sur" },
    { barangay: "Poblacion", municipality: "Wao", province: "Lanao del Sur", region: "BARMM", fullAddress: "Poblacion, Wao, Lanao del Sur" },
    { barangay: "Poblacion", municipality: "Malabang", province: "Lanao del Sur", region: "BARMM", fullAddress: "Poblacion, Malabang, Lanao del Sur" },
    { barangay: "Poblacion", municipality: "Balabagan", province: "Lanao del Sur", region: "BARMM", fullAddress: "Poblacion, Balabagan, Lanao del Sur" },
    { barangay: "Poblacion", municipality: "Saguiaran", province: "Lanao del Sur", region: "BARMM", fullAddress: "Poblacion, Saguiaran, Lanao del Sur" },

    // 3. Maguindanao del Norte
    { barangay: "Awang", municipality: "Datu Odin Sinsuat", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Awang, Datu Odin Sinsuat, Maguindanao del Norte" },
    { barangay: "Dalican", municipality: "Datu Odin Sinsuat", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Dalican, Datu Odin Sinsuat, Maguindanao del Norte" },
    { barangay: "Capiton", municipality: "Datu Odin Sinsuat", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Capiton, Datu Odin Sinsuat, Maguindanao del Norte" },
    { barangay: "Poblacion", municipality: "Parang", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Poblacion, Parang, Maguindanao del Norte" },
    { barangay: "Polloc", municipality: "Parang", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Polloc, Parang, Maguindanao del Norte" },
    { barangay: "Salimbao", municipality: "Sultan Kudarat", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Salimbao, Sultan Kudarat, Maguindanao del Norte" },
    { barangay: "Poblacion", municipality: "Upi", province: "Maguindanao del Norte", region: "BARMM", fullAddress: "Poblacion, Upi, Maguindanao del Norte" },

    // 4. Maguindanao del Sur
    { barangay: "Poblacion", municipality: "Buluan", province: "Maguindanao del Sur", region: "BARMM", fullAddress: "Poblacion, Buluan, Maguindanao del Sur" },
    { barangay: "Maganoy", municipality: "Shariff Aguak", province: "Maguindanao del Sur", region: "BARMM", fullAddress: "Maganoy, Shariff Aguak, Maguindanao del Sur" },
    { barangay: "Poblacion", municipality: "Datu Piang", province: "Maguindanao del Sur", region: "BARMM", fullAddress: "Poblacion, Datu Piang, Maguindanao del Sur" },
    { barangay: "Poblacion", municipality: "Datu Paglas", province: "Maguindanao del Sur", region: "BARMM", fullAddress: "Poblacion, Datu Paglas, Maguindanao del Sur" },
    { barangay: "Poblacion", municipality: "Ampatuan", province: "Maguindanao del Sur", region: "BARMM", fullAddress: "Poblacion, Ampatuan, Maguindanao del Sur" },

    // 5. Basilan
    { barangay: "Port Area", municipality: "Isabela City", province: "Basilan", region: "BARMM", fullAddress: "Port Area, Isabela City, Basilan" },
    { barangay: "Eastside", municipality: "Isabela City", province: "Basilan", region: "BARMM", fullAddress: "Eastside, Isabela City, Basilan" },
    { barangay: "Westside", municipality: "Isabela City", province: "Basilan", region: "BARMM", fullAddress: "Westside, Isabela City, Basilan" },
    { barangay: "Menzi", municipality: "Isabela City", province: "Basilan", region: "BARMM", fullAddress: "Menzi, Isabela City, Basilan" },
    { barangay: "Malinis", municipality: "Lamitan City", province: "Basilan", region: "BARMM", fullAddress: "Malinis, Lamitan City, Basilan" },
    { barangay: "Maganda", municipality: "Lamitan City", province: "Basilan", region: "BARMM", fullAddress: "Maganda, Lamitan City, Basilan" },
    { barangay: "Poblacion", municipality: "Maluso", province: "Basilan", region: "BARMM", fullAddress: "Poblacion, Maluso, Basilan" },

    // 6. Sulu
    { barangay: "Walled City", municipality: "Jolo", province: "Sulu", region: "BARMM", fullAddress: "Walled City, Jolo, Sulu" },
    { barangay: "San Raymundo", municipality: "Jolo", province: "Sulu", region: "BARMM", fullAddress: "San Raymundo, Jolo, Sulu" },
    { barangay: "Asturias", municipality: "Jolo", province: "Sulu", region: "BARMM", fullAddress: "Asturias, Jolo, Sulu" },
    { barangay: "Tulay", municipality: "Jolo", province: "Sulu", region: "BARMM", fullAddress: "Tulay, Jolo, Sulu" },
    { barangay: "Poblacion", municipality: "Patikul", province: "Sulu", region: "BARMM", fullAddress: "Poblacion, Patikul, Sulu" },
    { barangay: "Poblacion", municipality: "Indanan", province: "Sulu", region: "BARMM", fullAddress: "Poblacion, Indanan, Sulu" },
    { barangay: "Poblacion", municipality: "Maimbung", province: "Sulu", region: "BARMM", fullAddress: "Poblacion, Maimbung, Sulu" },

    // 7. Tawi-Tawi
    { barangay: "Poblacion", municipality: "Bongao", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Poblacion, Bongao, Tawi-Tawi" },
    { barangay: "Tubig Boh", municipality: "Bongao", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Tubig Boh, Bongao, Tawi-Tawi" },
    { barangay: "Simandagit", municipality: "Bongao", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Simandagit, Bongao, Tawi-Tawi" },
    { barangay: "Poblacion", municipality: "Panglima Sugala", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Poblacion, Panglima Sugala, Tawi-Tawi" },
    { barangay: "Poblacion", municipality: "Simunul", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Poblacion, Simunul, Tawi-Tawi" },
    { barangay: "Poblacion", municipality: "Sitangkai", province: "Tawi-Tawi", region: "BARMM", fullAddress: "Poblacion, Sitangkai, Tawi-Tawi" },
];

/** Alias for backward compatibility */
export const COMMON_BARANGAYS = MINDANAO_ADDRESSES;
