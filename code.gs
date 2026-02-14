/***********************
 * ORG SCHEMA API (JSON store) - VERZIJA SA KOEFICIJENTIMA I USLOVIMA RADA
 ************************/

const STORE_KEY = 'ORG_SCHEMA_JSON';
const META_KEY  = 'ORG_SCHEMA_META';

function doGet() {
  ensureStoreInitialized_();
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Organizacijska Šema – ŠPD Unsko-sanske Šume')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSchema() {
  ensureStoreInitialized_();
  const props = PropertiesService.getScriptProperties();
  const jsonStr = props.getProperty(STORE_KEY) || '';
  const metaStr = props.getProperty(META_KEY) || '';
  let data = null;
  let meta = null;

  try { data = jsonStr ? JSON.parse(jsonStr) : null; } catch (e) { data = null; }
  try { meta = metaStr ? JSON.parse(metaStr) : null; } catch (e) { meta = null; }

  return {
    ok: true,
    schema: data,
    meta: meta || {}
  };
}

function saveSchema(payload) {
  ensureStoreInitialized_();
  if (!payload) throw new Error('saveSchema: payload je prazan.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    if (!payload.organizationalStructure) {
      throw new Error('saveSchema: nedostaje organizationalStructure.');
    }
    if (!payload.orgPositions) {
      payload.orgPositions = {};
    }

    const now = new Date();
    const meta = {
      version: (getMeta_().version || 0) + 1,
      savedAt: now.toISOString(),
      savedBy: Session.getActiveUser().getEmail() || 'anonymous',
    };

    props.setProperty(STORE_KEY, JSON.stringify(payload));
    props.setProperty(META_KEY, JSON.stringify(meta));

    return { ok: true, meta };
  } finally {
    lock.releaseLock();
  }
}

function resetSchemaToDefault() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(STORE_KEY, getDefaultSchema_());
    props.setProperty(META_KEY, JSON.stringify({
      version: 1,
      seededAt: new Date().toISOString(),
      seededFrom: 'DEFAULT_SCHEMA'
    }));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function ensureStoreInitialized_() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty(STORE_KEY);
  if (existing && existing.trim()) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const again = props.getProperty(STORE_KEY);
    if (again && again.trim()) return;

    props.setProperty(STORE_KEY, getDefaultSchema_());
    props.setProperty(META_KEY, JSON.stringify({
      version: 1,
      seededAt: new Date().toISOString(),
      seededFrom: 'DEFAULT_SCHEMA'
    }));
  } finally {
    lock.releaseLock();
  }
}

function getMeta_() {
  const props = PropertiesService.getScriptProperties();
  const metaStr = props.getProperty(META_KEY) || '';
  try { return metaStr ? JSON.parse(metaStr) : {}; } catch (e) { return {}; }
}

// =====================================================================
// POMOĆNE FUNKCIJE - kreiranje pozicijskog objekta sa koeficijentom
// Izvor koeficijenata: "Pregled koeficijenata, složenosti i uslova rada"
// =====================================================================
function p_(title, stepen, koef, usloviRada) {
  usloviRada = usloviRada || 0;
  var ukupno = Math.round((koef * (1 + usloviRada / 100)) * 100) / 100;
  return {
    title: title,
    stepen: stepen || '',
    koef: koef || null,
    usloviRada: usloviRada || 0,
    ukupno: (usloviRada > 0 ? ukupno : koef) || null,
    employee: { name: '', education: '', experience: '', other: '' }
  };
}

function pu_(title, stepen, napomena) {
  return {
    title: title,
    stepen: stepen || '',
    koef: null,
    usloviRada: 0,
    ukupno: null,
    napomena: napomena || 'Ugovor - Statut',
    employee: { name: '', education: '', experience: '', other: '' }
  };
}

function getDefaultSchema_() {
  var schema = {
    organizationalStructure: {
      id: "uprava",
      name: "UPRAVA",
      level: 0,
      children: [
        { name: "URED DIREKTORA", id: "ured_direktora", level: 1 },
        { name: "ODJEL INTERNE REVIZIJE", id: "odjel_interne_revizije", level: 1 },
        { name: "ODJELJENJE INTERNE KONTROLE", id: "odjeljenje_interne_kontrole", level: 1 },
        { name: "ODJELJENJE ZA JAVNE NABAVKE", id: "odjeljenje_javne_nabavke", level: 1 },
        { name: "ODJELJENJE MATERIJALNO FINANSIJSKOG UPRAVLJANJA I KONTROLE", id: "odjeljenje_mfuk", level: 1 },
        { name: "ODJELJENJE ZA GEODETSKE POSLOVE", id: "odjeljenje_geodetski", level: 1 },
        { name: "SEKTOR PRIPREME PROIZVODNJE", id: "sektor_priprema", level: 1 },
        { name: "SEKTOR ISKORIŠTAVANJA ŠUMA", id: "sektor_iskoristavanje", level: 1 },
        {
          name: "SEKTOR ZA UZGAJANJE ŠUMA I LOVSTVO",
          id: "sektor_uzgajanje",
          level: 1,
          children: [
            { name: "SLUŽBA ZA POŠUMLJAVANJE I SJEMENARSTVO", id: "sluzba_posumljavanje", level: 2 },
            { name: "SLUŽBA ZA LOVSTVO I POLJOPRIVREDU", id: "sluzba_lovstvo", level: 2 }
          ]
        },
        { name: "SEKTOR INTEGRALNE ZAŠTITE ŠUMA", id: "sektor_zastita", level: 1 },
        { name: "SEKTOR ZA EKOLOGIJU I ZAŠTITNE ŠUME", id: "sektor_ekologija", level: 1 },
        { name: "SEKTOR UREĐIVANJA ŠUMA", id: "sektor_uredjivanje", level: 1 },
        { name: "SEKTOR INFORMATIČKIH POSLOVA", id: "sektor_it", level: 1 },
        {
          name: "SEKTOR PRAVNIH POSLOVA",
          id: "sektor_pravni",
          level: 1,
          children: [
            { name: "SLUŽBA ZA IMOVINSKO-PRAVNE POSLOVE", id: "sluzba_imovinsko_pravni", level: 2 },
            { name: "SLUŽBA ZA KADROVSKE I OPĆE POSLOVE", id: "sluzba_kadrovski", level: 2 },
            { name: "SLUŽBA ZA ZAŠTITU ZAPOSLENIKA, IMOVINE I PPZ", id: "sluzba_zastita_zaposleni", level: 2 }
          ]
        },
        {
          name: "SEKTOR EKONOMSKIH POSLOVA",
          id: "sektor_ekonomski",
          level: 1,
          children: [
            { name: "SLUŽBA PLANA, ANALIZE I RAZVOJA", id: "sluzba_plan", level: 2 },
            { name: "SLUŽBA ZA KOMERCIJALNE POSLOVE", id: "sluzba_komercijalni", level: 2 },
            { name: "SLUŽBA ZA FINANSIJSKE POSLOVE", id: "sluzba_finansijski", level: 2 },
            { name: "SLUŽBA ZA RAČUNOVODSTVO", id: "sluzba_racunovodstvo", level: 2 }
          ]
        },
        {
          name: "PODRUŽNICE",
          id: "podruznice",
          level: 1,
          children: [
            { name: "PODRUŽNICA ŠUMARIJA BIHAĆ", id: "podruznica_bihac", level: 2 },
            { name: "PODRUŽNICA ŠUMARIJA BOSANSKI PETROVAC", id: "podruznica_petrovac", level: 2 },
            { name: "PODRUŽNICA ŠUMARIJA SANSKI MOST", id: "podruznica_sanski", level: 2 },
            { name: "PODRUŽNICA ŠUMARIJA KLJUČ", id: "podruznica_kljuc", level: 2 },
            { name: "PODRUŽNICA ŠUMARIJA CAZIN", id: "podruznica_cazin", level: 2 },
            { name: "PODRUŽNICA RASADNIK CAZIN", id: "podruznica_rasadnik", level: 2 },
            { name: "POGON GOSPODARENJA ZA OPĆINU BOSANSKA KRUPA", id: "pogon_krupa", level: 2 },
            { name: "PODRUŽNICA GRAĐENJE MEHANIZACIJA I ODRŽAVANJE BOSANSKI PETROVAC", id: "podruznica_gradjenje", level: 2 }
          ]
        }
      ]
    },
    orgPositions: getDefaultPositions_()
  };
  return JSON.stringify(schema);
}

function getDefaultPositions_() {
  return {

    // ── UPRAVA (r.b. 1-4 - ugovor/Statut) ──
    "UPRAVA": [
      pu_("Direktor - Predsjednik Uprave",                     "Član 61. Statuta",        "Ugovor - član 56. stav (1) Statuta"),
      pu_("Izvršni direktor za oblast šumarstva - Član Uprave","Član 61. Statuta",        "Ugovor - član 56. stav (2) Statuta"),
      pu_("Izvršni direktor za oblast ekonomije - Član Uprave","Član 61. Statuta",        "Ugovor - Statut"),
      pu_("Izvršni direktor za oblast prava - Član Uprave",    "Član 61. Statuta",        "Ugovor - Statut")
    ],

    // ── URED DIREKTORA ──
    "URED DIREKTORA": [
      p_("Šef ureda direktora",                               "VSS VII/240-300 ECTS",    3.60),
      pu_("Sekretar ŠPD-a",                                   "Član 25. Statuta",        "Ugovor - član 25. stav (4) Statuta"),
      p_("Stručni saradnik za naučno-istraživački rad",       "VSS VII/240-300 ECTS",    3.20),
      p_("Stručni saradnik za upravljanje promjenama i razvoj","VSS VII/240-300 ECTS",   3.20),
      p_("Stručni saradnik za razvoj i pripremu projekata",   "VSS VII/240-300 ECTS",    3.20),
      p_("Stručni saradnik za certificiranje",                "VSS VII/240-300 ECTS",    3.20),
      p_("Referent informisanja",                             "VSS VII/180-240 ECTS",    2.69),
      p_("Sekretarica Uprave",                                "SSS",                     1.90),
      p_("Vozač direktora",                                   "SSS/KV",                  2.09)
    ],

    // ── ODJEL INTERNE REVIZIJE ──
    "ODJEL INTERNE REVIZIJE": [
      pu_("Direktor odjela interne revizije",                 "VSS VII/240 ECTS",        "Ugovor - član 80. Statuta"),
      p_("Rukovodilac jedinice - Glavni interni revizor",     "VSS VII/240 ECTS",        3.40),
      p_("Interni revizor (1)",                               "VSS VII/240 ECTS",        3.20),
      p_("Interni revizor (2)",                               "VSS VII/240 ECTS",        3.20),
      p_("Interni revizor (3)",                               "VSS VII/240 ECTS",        3.20)
    ],

    // ── ODJELJENJE INTERNE KONTROLE ──
    "ODJELJENJE INTERNE KONTROLE": [
      p_("Rukovodilac odjeljenja interne kontrole",           "VSS VII/240-300 ECTS",    3.20),
      p_("Tehnički kontrolor (1)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (2)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (3)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (4)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (5)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (6)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (7)",                            "VSS VII/180 ECTS / SSS",  2.11, 4),
      p_("Tehnički kontrolor (8)",                            "VSS VII/180 ECTS / SSS",  2.11, 4)
    ],

    // ── ODJELJENJE ZA JAVNE NABAVKE ──
    "ODJELJENJE ZA JAVNE NABAVKE": [
      p_("Rukovodilac - Službenik za javne nabavke",          "VSS VII/240 ECTS",        3.20),
      p_("Referent za javne nabavke (1)",                     "VSS VII/180-240 ECTS",    2.60),
      p_("Referent za javne nabavke (2)",                     "VSS VII/180-240 ECTS",    2.60),
      p_("Referent za javne nabavke (3)",                     "VSS VII/180-240 ECTS",    2.60)
    ],

    // ── ODJELJENJE MATERIJALNO FINANSIJSKOG UPRAVLJANJA I KONTROLE ──
    "ODJELJENJE MATERIJALNO FINANSIJSKOG UPRAVLJANJA I KONTROLE": [
      p_("Rukovodilac odjeljenja MF upravljanja i kontrole",  "VSS VII/180-240 ECTS",    3.20),
      p_("Kontrolor MF poslovanja - Likvidator (1)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (2)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (3)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (4)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (5)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (6)",          "VSS VII/180-240 ECTS",    2.89),
      p_("Kontrolor MF poslovanja - Likvidator (7)",          "VSS VII/180-240 ECTS",    2.89)
    ],

    // ── ODJELJENJE ZA GEODETSKE POSLOVE ──
    "ODJELJENJE ZA GEODETSKE POSLOVE": [
      p_("Rukovodilac odjeljenja za geodetske poslove",       "VSS VII/180-240 ECTS",    3.20),
      p_("Referent za geodetske poslove",                     "SSS",                     2.17),
      p_("Geometar (1)",                                      "SSS",                     2.17, 6),
      p_("Geometar (2)",                                      "SSS",                     2.17, 6),
      p_("Geometar (3)",                                      "SSS",                     2.17, 6),
      p_("Geometar (4)",                                      "SSS",                     2.17, 6),
      p_("Operater",                                          "SSS",                     1.76)
    ],

    // ── SEKTOR PRIPREME PROIZVODNJE ──
    "SEKTOR PRIPREME PROIZVODNJE": [
      p_("Rukovodilac sektora pripreme proizvodnje",          "VSS VII/240-300 ECTS",    3.60),
      p_("Tehnolog za praćenje šumsko-gospodarskih osnova",   "VSS VII/240-300 ECTS",    2.80),
      p_("Vodeći projektant (1)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Vodeći projektant (2)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Vodeći projektant (3)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Vodeći projektant (4)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Vodeći projektant (5)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Vodeći projektant (6)",                             "VSS VII/240-300 ECTS",    3.20, 5),
      p_("Projektant u visokim šumama",                       "VSS VII/240-300 ECTS",    3.00, 10),
      p_("Projektant u izdanačkim šumama",                    "VSS VII/180-240 ECTS/SSS",2.09, 10),
      p_("Pomoćni projektant",                                "VSS VII/180-300 ECTS",    2.20, 10),
      p_("Referent za administrativno-tehničke poslove",      "SSS",                     1.90),
      p_("Operater (1)",                                      "SSS",                     1.76),
      p_("Operater (2)",                                      "SSS",                     1.76),
      p_("Operater (3)",                                      "SSS",                     1.76),
      p_("Operater (4)",                                      "SSS",                     1.76),
      p_("Operater (5)",                                      "SSS",                     1.76),
      p_("Pomoćni radnik u pripremi proizvodnje",             "NK",                      1.40, 10)
    ],

    // ── SEKTOR ISKORIŠTAVANJA ŠUMA ──
    "SEKTOR ISKORIŠTAVANJA ŠUMA": [
      p_("Rukovodilac sektora iskorištavanja šuma",           "VSS VII/240-300 ECTS",    3.49),
      p_("Referent za putnu infrastrukturu i objekte",        "VSS VII/180-240 ECTS",    2.87),
      p_("Referent za mehanizaciju",                          "VSS VII/180-240 ECTS",    2.87),
      p_("Evidentičar direkcije",                             "SSS",                     1.95),
      p_("Vozač direkcije - kat. B",                          "SSS/KV kat. B",           1.81),
      p_("Vozač direkcije - kat. D",                          "SSS/KV kat. D",           1.90)
    ],

    // ── SEKTOR ZA UZGAJANJE ŠUMA I LOVSTVO ──
    "SEKTOR ZA UZGAJANJE ŠUMA I LOVSTVO": [
      p_("Rukovodilac sektora uzgajanja šuma i lovstva",      "VSS VII/240-300 ECTS",    3.49)
    ],

    // ── SLUŽBA ZA POŠUMLJAVANJE I SJEMENARSTVO ──
    "SLUŽBA ZA POŠUMLJAVANJE I SJEMENARSTVO": [
      p_("Rukovodilac službe za pošumljavanje i sjemenarstvo","VSS VII/240-300 ECTS",    3.00, 8),
      p_("Referent za pošumljavanje i sjemenarstvo (1)",      "VSS VII/180-240 ECTS",    2.60),
      p_("Referent za pošumljavanje i sjemenarstvo (2)",      "VSS VII/180-240 ECTS",    2.60)
    ],

    // ── SLUŽBA ZA LOVSTVO I POLJOPRIVREDU ──
    "SLUŽBA ZA LOVSTVO I POLJOPRIVREDU": [
      p_("Rukovodilac službe za lovstvo i poljoprivredu",     "VSS VII/180-240 ECTS",    3.00, 8),
      p_("Lovočuvar",                                         "SSS",                     1.62, 6),
      p_("Pomoćni radnik u lovištu",                          "NK",                      1.40, 10)
    ],

    // ── SEKTOR INTEGRALNE ZAŠTITE ŠUMA ──
    "SEKTOR INTEGRALNE ZAŠTITE ŠUMA": [
      p_("Rukovodilac sektora integralne zaštite šuma",       "VSS VII/240-300 ECTS",    3.49),
      p_("Referent zaštite šuma",                             "VSS VII/240-300 ECTS",    3.09)
    ],

    // ── SEKTOR ZA EKOLOGIJU I ZAŠTITNE ŠUME ──
    "SEKTOR ZA EKOLOGIJU I ZAŠTITNE ŠUME": [
      p_("Rukovodilac sektora za ekologiju i zaštitne šume",  "VSS VII/240-300 ECTS",    3.49),
      p_("Referent ekologije i zaštitnih šuma",               "VSS VII/180-300 ECTS",    2.60),
      p_("Terenski operativac",                               "SSS",                     1.90),
      p_("Poslovođa šumarske radionice",                      "SSS",                     2.09),
      p_("Poslovođa stolarske radionice",                     "VŠS",                     2.20),
      p_("Rukovaoc brentom i stolarskim mašinama",            "KV",                      1.81, 6),
      p_("Pomoćnik rukovaoca brentom i stol. mašinama (1)",   "PK/NK",                   1.62),
      p_("Pomoćnik rukovaoca brentom i stol. mašinama (2)",   "PK/NK",                   1.62),
      p_("Tesar - Zidar - Bravar - Viljuškarista",            "KV",                      1.67, 6),
      p_("Traktorista poljopr. traktora - Pomoćni radnik",    "KV/PK",                   1.67, 6),
      p_("Rukovaoc CNC mašine - Programer",                   "SSS",                     1.81),
      p_("Limar - Pomoćni radnik",                            "SSS",                     1.67, 6),
      p_("Plinski i vodoinstalater - Pomoćni radnik",         "SSS",                     1.67, 6),
      p_("Pomoćni radnik",                                    "NK",                      1.40, 10),
      p_("Portir - Pomoćni radnik",                           "SSS/NK",                  1.40)
    ],

    // ── SEKTOR UREĐIVANJA ŠUMA ──
    "SEKTOR UREĐIVANJA ŠUMA": [
      p_("Rukovodilac sektora uređivanja šuma",               "VSS VII/240-300 ECTS",    3.60),
      p_("Vođa sekcije",                                      "VSS VII/240-300 ECTS",    3.03, 4),
      p_("Referent za GIS",                                   "VSS VII/180-240 ECTS",    2.80),
      p_("Projektant uređivanja šuma",                        "VSS VII/240-300 ECTS",    2.79, 4),
      p_("Projektant na procjeni šuma - Taksator",            "VSS VII/180-240 ECTS/SSS",2.01, 10),
      p_("Vozač",                                             "SSS/KV kat. B",           1.81),
      p_("Pomoćni radnik u uređivanju šuma",                  "NK",                      1.40, 10)
    ],

    // ── SEKTOR INFORMATIČKIH POSLOVA ──
    "SEKTOR INFORMATIČKIH POSLOVA": [
      p_("Rukovodilac sektora informatičkih poslova",         "VSS VII/240 ECTS",        3.40),
      p_("Informatičar - Programer (1)",                      "VSS VII/180-240 ECTS",    2.80),
      p_("Informatičar - Programer (2)",                      "VSS VII/180-240 ECTS",    2.80),
      p_("Informatičar - Tehničar (1)",                       "SSS",                     2.20),
      p_("Informatičar - Tehničar (2)",                       "SSS",                     2.20)
    ],

    // ── SEKTOR PRAVNIH POSLOVA ──
    "SEKTOR PRAVNIH POSLOVA": [
      p_("Rukovodilac sektora pravnih poslova",               "VSS VII/240 ECTS",        3.49)
    ],

    // ── SLUŽBA ZA IMOVINSKO-PRAVNE POSLOVE ──
    "SLUŽBA ZA IMOVINSKO-PRAVNE POSLOVE": [
      p_("Rukovodilac službe za imovinsko-pravne poslove",    "VSS VII/240 ECTS",        3.26),
      p_("Referent za zastupanje",                            "VSS VII/240 ECTS",        2.89),
      p_("Referent za pravne poslove (1)",                    "VSS VII/240 ECTS / VŠS",  2.60),
      p_("Referent za pravne poslove (2)",                    "VSS VII/240 ECTS / VŠS",  2.60),
      p_("Referent za pravne poslove (3)",                    "VSS VII/240 ECTS / VŠS",  2.60),
      p_("Referent za pravne poslove (4)",                    "VSS VII/240 ECTS / VŠS",  2.60)
    ],

    // ── SLUŽBA ZA KADROVSKE I OPĆE POSLOVE ──
    "SLUŽBA ZA KADROVSKE I OPĆE POSLOVE": [
      p_("Rukovodilac službe za kadrovske i opće poslove",    "VSS VII/240 ECTS",        3.24),
      p_("Referent radnih odnosa",                            "VSS VII/240 ECTS",        2.60),
      p_("Referent protokola (1)",                            "SSS",                     1.95),
      p_("Referent protokola (2)",                            "SSS",                     1.95),
      p_("Arhivar (1)",                                       "SSS",                     1.95),
      p_("Arhivar (2)",                                       "SSS",                     1.95),
      p_("Čistačica (1)",                                     "NK",                      1.50),
      p_("Čistačica (2)",                                     "NK",                      1.50),
      p_("Čistačica (3)",                                     "NK",                      1.50),
      p_("Čistačica (4)",                                     "NK",                      1.50),
      p_("Domar - Ložač - Kurir (1)",                         "SSS/KV",                  1.76),
      p_("Domar - Ložač - Kurir (2)",                         "SSS/KV",                  1.76),
      p_("Portir direkcije (1)",                              "SSS",                     1.71),
      p_("Portir direkcije (2)",                              "SSS",                     1.71)
    ],

    // ── SLUŽBA ZA ZAŠTITU ZAPOSLENIKA, IMOVINE I PPZ ──
    "SLUŽBA ZA ZAŠTITU ZAPOSLENIKA, IMOVINE I PPZ": [
      p_("Rukovodilac službe za zaštitu zaposlenika, imovine i PPZ","VSS VII/180-240 ECTS",2.90),
      p_("Referent zaštite na radu",                          "VSS VII/180-240 ECTS",    2.60),
      p_("Referent PPZ (1)",                                  "VSS VII/180 / SSS",       1.90),
      p_("Referent PPZ (2)",                                  "VSS VII/180 / SSS",       1.90),
      p_("Referent PPZ (3)",                                  "VSS VII/180 / SSS",       1.90),
      p_("Referent PPZ (4)",                                  "VSS VII/180 / SSS",       1.90),
      p_("Referent PPZ (5)",                                  "VSS VII/180 / SSS",       1.90),
      p_("Vozač - Vatrogasac - Pomoćni radnik",               "SSS/KV",                  1.68, 10)
    ],

    // ── SEKTOR EKONOMSKIH POSLOVA ──
    "SEKTOR EKONOMSKIH POSLOVA": [
      p_("Rukovodilac sektora ekonomskih poslova",            "VSS VII/240 ECTS",        3.49)
    ],

    // ── SLUŽBA PLANA, ANALIZE I RAZVOJA ──
    "SLUŽBA PLANA, ANALIZE I RAZVOJA": [
      p_("Rukovodilac službe plana, analize i razvoja",       "VSS VII/180-240 ECTS",    3.24),
      p_("Planer - Analitičar (1)",                           "VSS VII/180-240 ECTS",    2.90),
      p_("Planer - Analitičar (2)",                           "VSS VII/180-240 ECTS",    2.90),
      p_("Operativni planer - Statističar",                   "SSS",                     2.00)
    ],

    // ── SLUŽBA ZA KOMERCIJALNE POSLOVE ──
    "SLUŽBA ZA KOMERCIJALNE POSLOVE": [
      p_("Rukovodilac službe za komercijalne poslove",        "VSS VII/180-240 ECTS",    3.24),
      p_("Referent nabave",                                   "VSS VII/180-240 ECTS",    2.80),
      p_("Referent prodaje (1)",                              "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Referent prodaje (2)",                              "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Referent prodaje (3)",                              "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Referent prodaje (4)",                              "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Referent prodaje sporednih proizvoda",              "VSS VII/180-240 ECTS/VŠS",2.40),
      p_("Referent za fakturisanje (1)",                      "SSS",                     1.90),
      p_("Referent za fakturisanje (2)",                      "SSS",                     1.90),
      p_("Referent za fakturisanje (3)",                      "SSS",                     1.90),
      p_("Referent za fakturisanje (4)",                      "SSS",                     1.90),
      p_("Referent za fakturisanje (5)",                      "SSS",                     1.90),
      p_("Magaciner centralnog magacina",                     "SSS",                     1.90),
      p_("Magaciner direkcije i pogona gospodarenja",         "VSS VII/180-240 ECTS",    2.20)
    ],

    // ── SLUŽBA ZA FINANSIJSKE POSLOVE ──
    "SLUŽBA ZA FINANSIJSKE POSLOVE": [
      p_("Rukovodilac službe za finansijske poslove",         "VSS VII/180-240 ECTS",    3.24),
      p_("Referent likvidator i naplata (1)",                 "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Referent likvidator i naplata (2)",                 "VSS VII/180-240 ECTS/VŠS",2.60),
      p_("Blagajnik - Obračunski",                            "SSS",                     2.09),
      p_("Prodavač - Obračunski - Pomoćna blagajna (1)",      "SSS",                     1.90),
      p_("Prodavač - Obračunski - Pomoćna blagajna (2)",      "SSS",                     1.90),
      p_("Prodavač - Obračunski - Pomoćna blagajna (3)",      "SSS",                     1.90),
      p_("Prodavač - Obračunski - Pomoćna blagajna (4)",      "SSS",                     1.90),
      p_("Prodavač - Obračunski - Blagajna - Fakturista (1)", "SSS",                     1.90),
      p_("Prodavač - Obračunski - Blagajna - Fakturista (2)", "SSS",                     1.90)
    ],

    // ── SLUŽBA ZA RAČUNOVODSTVO ──
    "SLUŽBA ZA RAČUNOVODSTVO": [
      p_("Rukovodilac službe za računovodstvo",               "VSS VII/180-240 ECTS",    3.29),
      p_("Glavni knjigovođa",                                 "VSS VII/180-240 ECTS/VŠS",2.76),
      p_("Konter - Finansijski knjigovođa (1)",               "VSS VII/180-240 ECTS",    2.60),
      p_("Konter - Finansijski knjigovođa (2)",               "VSS VII/180-240 ECTS",    2.60),
      p_("Knjigovođa stalnih sredstava i osiguranja",         "SSS",                     2.00),
      p_("Knjigovođa dobavljača",                             "SSS",                     2.00),
      p_("Knjigovođa kupaca (1)",                             "SSS",                     2.00),
      p_("Knjigovođa kupaca (2)",                             "SSS",                     2.00),
      p_("Knjigovođa plaća",                                  "SSS",                     2.00),
      p_("Knjigovođa za obračun i evidenciju poreza",         "SSS",                     2.00),
      p_("Knjigovođa centralnog magacina",                    "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (1)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (2)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (3)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (4)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (5)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (6)",        "SSS",                     1.90),
      p_("Knjigovođa mat. i pogon. knjigovodstva (7)",        "SSS",                     1.90)
    ],

    // ══ PODRUŽNICA ŠUMARIJA BIHAĆ ══
    "PODRUŽNICA ŠUMARIJA BIHAĆ": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.81),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.24),
      p_("Tehnolog za gospodarenje šumama",                   "VSS VII/240-300 ECTS",    3.09, 5),
      p_("Evidentičar",                                       "SSS",                     1.81),
      p_("Administrativni radnik - Operater",                 "SSS",                     1.81),
      p_("Poslovođa iskorištavanja šuma (1)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (2)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (3)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (1)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (2)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (3)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (4)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa vlastite režije",                         "VSS VII/180 / SSS",       2.07, 6),
      p_("Primač na šuma panju (1)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (2)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (3)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (4)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (5)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (6)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (7)",                          "SSS",                     2.10, 10),
      p_("Radnik u primci (1)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (2)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (3)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (4)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (5)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (6)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (7)",                               "SSS",                     1.75, 10),
      p_("Otpremač drvnih sortimenata (1)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (2)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (3)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (4)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (5)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (6)",                   "SSS",                     1.95, 5),
      p_("Osmatrač šuma i šumskog zemljišta",                 "SSS/KV",                  1.75, 10),
      p_("Vozač - Pomoćni radnik (1)",                        "SSS/KV kat. B",           1.81),
      p_("Vozač - Pomoćni radnik (2)",                        "SSS/KV kat. B",           1.81),
      p_("Domar - Ložač - Kurir",                             "SSS/KV",                  1.76),
      p_("Čistačica",                                         "NK",                      1.50),
      p_("Sjekač (1)",                                        "PK",                      1.64, 10),
      p_("Sjekač (2)",                                        "PK",                      1.64, 10),
      p_("Sjekač (3)",                                        "PK",                      1.64, 10),
      p_("Sjekač (4)",                                        "PK",                      1.64, 10),
      p_("Sjekač (5)",                                        "PK",                      1.64, 10),
      p_("Sjekač (6)",                                        "PK",                      1.64, 10),
      p_("Sjekač (7)",                                        "PK",                      1.64, 10),
      p_("Sjekač (8)",                                        "PK",                      1.64, 10),
      p_("Uzgojni radnik",                                    "PK",                      1.56, 10),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (3)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (4)",                  "KV/PK",                   1.75, 10),
      p_("Automehaničar",                                     "KV",                      1.81, 6)
    ],

    // ══ PODRUŽNICA ŠUMARIJA BOSANSKI PETROVAC ══
    "PODRUŽNICA ŠUMARIJA BOSANSKI PETROVAC": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    4.00),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.24),
      p_("Tehnolog za gospodarenje šumama",                   "VSS VII/240-300 ECTS",    3.09, 5),
      p_("Evidentičar",                                       "SSS",                     1.81),
      p_("Administrativni radnik - Operater",                 "SSS",                     1.81),
      p_("Poslovođa iskorištavanja šuma (1)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (2)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (3)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (1)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (2)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (3)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (4)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa vlastite režije",                         "VSS VII/180 / SSS",       2.07, 6),
      p_("Primač na šuma panju (1)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (2)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (3)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (4)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (5)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (6)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (7)",                          "SSS",                     2.10, 10),
      p_("Radnik u primci (1)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (2)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (3)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (4)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (5)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (6)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (7)",                               "SSS",                     1.75, 10),
      p_("Otpremač drvnih sortimenata (1)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (2)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (3)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (4)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (5)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (6)",                   "SSS",                     1.95, 5),
      p_("Osmatrač šuma i šumskog zemljišta",                 "SSS/KV",                  1.75, 10),
      p_("Vozač - Pomoćni radnik (1)",                        "SSS/KV kat. B",           1.81),
      p_("Vozač - Pomoćni radnik (2)",                        "SSS/KV kat. B",           1.81),
      p_("Domar - Ložač - Kurir",                             "SSS/KV",                  1.76),
      p_("Čistačica",                                         "NK",                      1.50),
      p_("Sjekač (1)",                                        "PK",                      1.64, 10),
      p_("Sjekač (2)",                                        "PK",                      1.64, 10),
      p_("Sjekač (3)",                                        "PK",                      1.64, 10),
      p_("Sjekač (4)",                                        "PK",                      1.64, 10),
      p_("Sjekač (5)",                                        "PK",                      1.64, 10),
      p_("Sjekač (6)",                                        "PK",                      1.64, 10),
      p_("Sjekač (7)",                                        "PK",                      1.64, 10),
      p_("Sjekač (8)",                                        "PK",                      1.64, 10),
      p_("Uzgojni radnik",                                    "PK",                      1.56, 10),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (3)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (4)",                  "KV/PK",                   1.75, 10),
      p_("Automehaničar",                                     "KV",                      1.81, 6)
    ],

    // ══ PODRUŽNICA ŠUMARIJA SANSKI MOST ══
    "PODRUŽNICA ŠUMARIJA SANSKI MOST": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.81),
      p_("Pomoćnik upravnika (1)",                            "VSS VII/240-300 ECTS",    3.24),
      p_("Pomoćnik upravnika (2)",                            "VSS VII/240-300 ECTS",    3.24),
      p_("Tehnolog za gospodarenje šumama",                   "VSS VII/240-300 ECTS",    3.09, 5),
      p_("Evidentičar",                                       "SSS",                     1.81),
      p_("Administrativni radnik - Operater",                 "SSS",                     1.81),
      p_("Poslovođa iskorištavanja šuma (1)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (2)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (3)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (4)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (5)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (1)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (2)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (3)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa vlastite režije",                         "VSS VII/180 / SSS",       2.07, 6),
      p_("Primač na šuma panju (1)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (2)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (3)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (4)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (5)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (6)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (7)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (8)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (9)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (10)",                         "SSS",                     2.10, 10),
      p_("Primač na šuma panju (11)",                         "SSS",                     2.10, 10),
      p_("Radnik u primci (1)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (2)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (3)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (4)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (5)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (6)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (7)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (8)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (9)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (10)",                              "SSS",                     1.75, 10),
      p_("Radnik u primci (11)",                              "SSS",                     1.75, 10),
      p_("Otpremač drvnih sortimenata (1)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (2)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (3)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (4)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (5)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (6)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (7)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (8)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (9)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (10)",                  "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (11)",                  "SSS",                     1.95, 5),
      p_("Osmatrač šuma i šumskog zemljišta",                 "SSS/KV",                  1.75, 10),
      p_("Vozač - Pomoćni radnik (1)",                        "SSS/KV kat. B",           1.81),
      p_("Vozač - Pomoćni radnik (2)",                        "SSS/KV kat. B",           1.81),
      p_("Domar - Ložač - Kurir",                             "SSS/KV",                  1.76),
      p_("Čistačica (1)",                                     "NK",                      1.50),
      p_("Čistačica (2)",                                     "NK",                      1.50),
      p_("Sjekač (1)",                                        "PK",                      1.64, 10),
      p_("Sjekač (2)",                                        "PK",                      1.64, 10),
      p_("Sjekač (3)",                                        "PK",                      1.64, 10),
      p_("Sjekač (4)",                                        "PK",                      1.64, 10),
      p_("Sjekač (5)",                                        "PK",                      1.64, 10),
      p_("Sjekač (6)",                                        "PK",                      1.64, 10),
      p_("Sjekač (7)",                                        "PK",                      1.64, 10),
      p_("Sjekač (8)",                                        "PK",                      1.64, 10),
      p_("Sjekač (9)",                                        "PK",                      1.64, 10),
      p_("Sjekač (10)",                                       "PK",                      1.64, 10),
      p_("Uzgojni radnik",                                    "PK",                      1.56, 10),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (3)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (4)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (5)",                  "KV/PK",                   1.75, 10),
      p_("Magaciner - Mehaničar motornih pila",               "SSS/KV",                  1.81)
    ],

    // ══ PODRUŽNICA ŠUMARIJA KLJUČ ══
    "PODRUŽNICA ŠUMARIJA KLJUČ": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.81),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.24),
      p_("Tehnolog za gospodarenje šumama",                   "VSS VII/240-300 ECTS",    3.09, 5),
      p_("Evidentičar",                                       "SSS",                     1.81),
      p_("Administrativni radnik - Operater",                 "SSS",                     1.81),
      p_("Poslovođa iskorištavanja šuma (1)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (2)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (3)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (1)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (2)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (3)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa vlastite režije",                         "VSS VII/180 / SSS",       2.07, 6),
      p_("Primač na šuma panju (1)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (2)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (3)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (4)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (5)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (6)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (7)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (8)",                          "SSS",                     2.10, 10),
      p_("Radnik u primci (1)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (2)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (3)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (4)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (5)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (6)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (7)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (8)",                               "SSS",                     1.75, 10),
      p_("Otpremač drvnih sortimenata (1)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (2)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (3)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (4)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (5)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (6)",                   "SSS",                     1.95, 5),
      p_("Osmatrač šuma i šumskog zemljišta",                 "SSS/KV",                  1.75, 10),
      p_("Vozač - Pomoćni radnik (1)",                        "SSS/KV kat. B",           1.81),
      p_("Vozač - Pomoćni radnik (2)",                        "SSS/KV kat. B",           1.81),
      p_("Domar - Ložač - Kurir - Magaciner",                 "SSS/KV",                  1.81),
      p_("Čistačica",                                         "NK",                      1.50),
      p_("Sjekač (1)",                                        "PK",                      1.64, 10),
      p_("Sjekač (2)",                                        "PK",                      1.64, 10),
      p_("Sjekač (3)",                                        "PK",                      1.64, 10),
      p_("Sjekač (4)",                                        "PK",                      1.64, 10),
      p_("Sjekač (5)",                                        "PK",                      1.64, 10),
      p_("Sjekač (6)",                                        "PK",                      1.64, 10),
      p_("Sjekač (7)",                                        "PK",                      1.64, 10),
      p_("Sjekač (8)",                                        "PK",                      1.64, 10),
      p_("Uzgojni radnik",                                    "PK",                      1.56, 10),
      p_("Automehaničar (1)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (2)",                                 "KV",                      1.81, 6),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (3)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (4)",                  "KV/PK",                   1.75, 10)
    ],

    // ══ PODRUŽNICA ŠUMARIJA CAZIN ══
    "PODRUŽNICA ŠUMARIJA CAZIN": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.52),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.05),
      p_("Tehnolog za gospodarenje šumama",                   "VSS VII/240-300 ECTS",    3.09, 5),
      p_("Administrativni radnik - Operater",                 "SSS",                     1.81),
      p_("Evidentičar",                                       "SSS",                     1.81),
      p_("Poslovođa iskorištavanja šuma (1)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (2)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa iskorištavanja šuma (3)",                 "VSS VII/180 / SSS",       2.16, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (1)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (2)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa uzgoja, zaštite šuma i ekologije (3)",    "VSS VII/180 / SSS",       2.07, 6),
      p_("Poslovođa vlastite režije",                         "VSS VII/180 / SSS",       2.07, 6),
      p_("Primač na šuma panju (1)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (2)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (3)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (4)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (5)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (6)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (7)",                          "SSS",                     2.10, 10),
      p_("Primač na šuma panju (8)",                          "SSS",                     2.10, 10),
      p_("Radnik u primci (1)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (2)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (3)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (4)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (5)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (6)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (7)",                               "SSS",                     1.75, 10),
      p_("Radnik u primci (8)",                               "SSS",                     1.75, 10),
      p_("Otpremač drvnih sortimenata (1)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (2)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (3)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (4)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (5)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (6)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (7)",                   "SSS",                     1.95, 5),
      p_("Otpremač drvnih sortimenata (8)",                   "SSS",                     1.95, 5),
      p_("Osmatrač šuma i šumskog zemljišta",                 "SSS/KV",                  1.75, 10),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (3)",                  "KV/PK",                   1.75, 10),
      p_("Traktorista - Pomoćni radnik (4)",                  "KV/PK",                   1.75, 10),
      p_("Vozač - Pomoćni radnik (1)",                        "SSS/KV kat. B",           1.81),
      p_("Vozač - Pomoćni radnik (2)",                        "SSS/KV kat. B",           1.81),
      p_("Domar - Ložač - Kurir - Magaciner",                 "SSS/KV",                  1.81),
      p_("Čistačica (1)",                                     "NK",                      1.50),
      p_("Čistačica (2)",                                     "NK",                      1.50),
      p_("Sjekač (1)",                                        "PK",                      1.64, 10),
      p_("Sjekač (2)",                                        "PK",                      1.64, 10),
      p_("Sjekač (3)",                                        "PK",                      1.64, 10),
      p_("Sjekač (4)",                                        "PK",                      1.64, 10),
      p_("Sjekač (5)",                                        "PK",                      1.64, 10),
      p_("Sjekač (6)",                                        "PK",                      1.64, 10),
      p_("Sjekač (7)",                                        "PK",                      1.64, 10),
      p_("Sjekač (8)",                                        "PK",                      1.64, 10),
      p_("Uzgojni radnik",                                    "PK",                      1.56, 10),
      p_("Portir - Pomoćni radnik",                           "SSS/NK",                  1.62)
    ],

    // ══ PODRUŽNICA RASADNIK CAZIN ══
    "PODRUŽNICA RASADNIK CAZIN": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.33),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    2.76),
      p_("Poslovođa za rasadničku proizvodnju i sjemenarstvo","SSS",                     2.09),
      p_("Referent za organizaciju proizvodnje",              "VSS VII/180-240 ECTS",    2.60),
      p_("Administrativni radnik - Evidentičar - Operater",   "SSS",                     1.81),
      p_("Poslovođa za hortikulturnu proizvodnju - Magaciner","SSS",                     2.09),
      p_("Mehaničar - Vozač",                                 "KV",                      1.75, 10),
      p_("Traktorista - Pomoćni radnik (1)",                  "KV/PK",                   1.67, 6),
      p_("Traktorista - Pomoćni radnik (2)",                  "KV/PK",                   1.67, 6),
      p_("Rasadničar - Pomoćni radnik (1)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (2)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (3)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (4)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (5)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (6)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (7)",                   "PK",                      1.54, 10),
      p_("Rasadničar - Pomoćni radnik (8)",                   "PK",                      1.54, 10),
      p_("Pomoćni radnik",                                    "NK",                      1.40, 10),
      p_("Čistačica - Kurir",                                 "NK",                      1.50)
    ],

    // ══ POGON GOSPODARENJA ZA OPĆINU BOSANSKA KRUPA ══
    "POGON GOSPODARENJA ZA OPĆINU BOSANSKA KRUPA": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.81),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.24),
      p_("Referent kamionskih puteva i građevina - Glavni inžinjer","VSS VII/180-240 ECTS",2.69),
      p_("Tehnički rukovodilac kamenoloma",                   "VSS VII/180-240 ECTS",    2.60),
      p_("Poslovođa održavanja mašina i vozila",              "SSS/VKV",                 2.09),
      p_("Poslovođa mehanizacije i transporta",               "SSS",                     2.09),
      p_("Administrativni radnik - Evidentičar - Operater",   "SSS",                     1.81),
      p_("Magaciner - Radnik na pumpi",                       "SSS",                     1.81),
      p_("Automehaničar (1)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (2)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (3)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (4)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (5)",                                 "KV",                      1.81, 6),
      p_("Bravar - Mehaničar",                                "KV",                      1.81, 6),
      p_("Tokar - Mehaničar",                                 "KV",                      1.81, 6),
      p_("Autoelektričar - Mehaničar",                        "KV",                      1.81, 6),
      p_("Traktorista - Vozač - Pomoćni radnik (1)",          "KV/PK",                   1.75, 10),
      p_("Traktorista - Vozač - Pomoćni radnik (2)",          "KV/PK",                   1.75, 10),
      p_("Traktorista - Vozač - Pomoćni radnik (3)",          "KV/PK",                   1.75, 10),
      p_("Traktorista - Vozač - Pomoćni radnik (4)",          "KV/PK",                   1.75, 10),
      p_("Vozač kamiona (1)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (2)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (3)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (4)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (5)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (6)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (7)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (8)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (9)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (10)",                                "SSS/KV",                  1.81),
      p_("Vozač kamiona (11)",                                "SSS/KV",                  1.81),
      p_("Vozač kamiona (12)",                                "SSS/KV",                  1.81),
      p_("Vozač kamiona (13)",                                "SSS/KV",                  1.81),
      p_("Vozač kamiona (14)",                                "SSS/KV",                  1.81),
      p_("Vozač kamiona (15)",                                "SSS/KV",                  1.81),
      p_("Rukovaoc rovokopačem (1)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (2)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (3)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (4)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (5)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc utovarivačem (1)",                         "SSS/KV",                  1.90),
      p_("Rukovaoc utovarivačem (2)",                         "SSS/KV",                  1.90),
      p_("Rukovaoc greiderom (1)",                            "SSS/KV",                  1.90),
      p_("Rukovaoc greiderom (2)",                            "SSS/KV",                  1.90),
      p_("Rukovaoc valjkom",                                  "SSS/KV",                  1.90),
      p_("Rukovaoc buldožerom",                               "SSS/KV",                  1.90),
      p_("Rukovaoc mješalicom betona - Pomoćni radnik",       "KV/NK",                   1.40, 10),
      p_("Rukovaoc postrojenjima u kamenolomu - Pom. radnik", "KV/NK",                   1.40, 10),
      p_("Pomoćni radnik",                                    "NK",                      1.40, 10),
      p_("Čistačica",                                         "NK",                      1.50)
    ],

    // ══ PODRUŽNICA GRAĐENJE MEHANIZACIJA I ODRŽAVANJE BOSANSKI PETROVAC ══
    "PODRUŽNICA GRAĐENJE MEHANIZACIJA I ODRŽAVANJE BOSANSKI PETROVAC": [
      p_("Upravnik",                                          "VSS VII/240-300 ECTS",    3.43),
      p_("Pomoćnik upravnika",                                "VSS VII/240-300 ECTS",    3.05),
      p_("Referent kamionskih puteva i građevina",            "VSS VII/180-240 ECTS",    2.69),
      p_("Poslovođa održavanja mašina i vozila",              "SSS/VKV",                 2.09),
      p_("Poslovođa mehanizacije i transporta",               "SSS",                     2.09),
      p_("Administrativni radnik - Evidentičar - Operater",   "SSS",                     1.81),
      p_("Magaciner - Radnik na pumpi",                       "SSS",                     1.81),
      p_("Automehaničar (1)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (2)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (3)",                                 "KV",                      1.81, 6),
      p_("Automehaničar (4)",                                 "KV",                      1.81, 6),
      p_("Bravar - Mehaničar",                                "KV",                      1.81, 6),
      p_("Tokar - Mehaničar",                                 "KV",                      1.81, 6),
      p_("Autoelektričar - Mehaničar",                        "KV",                      1.81, 6),
      p_("Vozač kamiona (1)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (2)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (3)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (4)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (5)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (6)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (7)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (8)",                                 "SSS/KV",                  1.81),
      p_("Vozač kamiona (9)",                                 "SSS/KV",                  1.81),
      p_("Traktorista - Vozač - Pomoćni radnik (1)",          "KV/PK",                   1.75, 10),
      p_("Traktorista - Vozač - Pomoćni radnik (2)",          "KV/PK",                   1.75, 10),
      p_("Traktorista - Vozač - Pomoćni radnik (3)",          "KV/PK",                   1.75, 10),
      p_("Rukovaoc rovokopačem (1)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (2)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc rovokopačem (3)",                          "SSS/KV",                  1.90),
      p_("Rukovaoc utovarivačem",                             "SSS/KV",                  1.90),
      p_("Rukovaoc greiderom",                                "SSS/KV",                  1.90),
      p_("Rukovaoc valjkom",                                  "SSS/KV",                  1.90),
      p_("Rukovaoc buldožerom",                               "SSS/KV",                  1.90),
      p_("Čistačica",                                         "NK",                      1.50)
    ]

  };
}