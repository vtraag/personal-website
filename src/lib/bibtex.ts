// ============================================================================
// BibTeX → publications
// ============================================================================
// Parses src/data/bibliography.bib at build time and converts every entry into
// the structure used by the publications page. To add a publication, simply
// add it to the .bib file (e.g. export from Zotero/JabRef) and rebuild.

import { parse } from '@retorquere/bibtex-parser/js';
import bibSource from '../data/bibliography.bib?raw';
import { SITE_DATA } from '../constants';

export interface Author {
    name: string;
    isMe: boolean;
}

export interface Preprint {
    server: string;
    id: string;
    url: string;
}

export interface Publication {
    id: string;
    title: string;
    authors: Author[];
    authorsText: string;
    venue: string;
    year: number;
    month: number;
    authorship: 'first' | 'last' | 'other';
    publicationType: string;
    abstract: string;
    doi: string;
    link: string;
    preprint: Preprint | null;
    slides: string;
    pdf: string;
    bibtex: string;
}

const MONTHS: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Fields can be strings, numbers, or (for list-like fields such as publisher)
// arrays. Normalise everything to a plain trimmed string.
function str(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map(str).filter(Boolean).join(', ');
    return String(value).replace(/\s+/g, ' ').trim();
}

// Light clean-up of leftover LaTeX math, e.g. "$\sim$407M" or "$45\%$".
function cleanText(text: string): string {
    return text
        .replace(/\$\s*\\sim\s*\$/g, '~')
        .replace(/\$([^$]*)\$/g, '$1')
        .replace(/\\%/g, '%')
        .replace(/\\sim\b/g, '~');
}

function parseMonth(value: unknown): number {
    const m = str(value).toLowerCase();
    if (!m) return 0;
    const n = parseInt(m, 10);
    if (!isNaN(n)) return n;
    return MONTHS[m.slice(0, 3)] ?? 0;
}

function formatAuthor(a: { firstName?: string; lastName?: string; prefix?: string; suffix?: string; name?: string }): string {
    if (a.name) return a.name;
    return [a.firstName, a.prefix, a.lastName, a.suffix].filter(Boolean).join(' ');
}

function isOwner(a: { firstName?: string; lastName?: string }): boolean {
    return (a.lastName ?? '').toLowerCase() === SITE_DATA.bibAuthorLastName.toLowerCase();
}

// Preprint servers recognised in `eprinttype` (or `archiveprefix`), keyed by
// lower-case name. `eprint` holds the server's identifier for the preprint.
const osf = (server: string) => (id: string) => `https://osf.io/preprints/${server}/${id}`;
const viaDoi = (id: string) => `https://doi.org/${id}`;

const PREPRINT_SERVERS: Record<string, { name: string; url: (id: string) => string }> = {
    arxiv:     { name: 'arXiv',     url: id => `https://arxiv.org/abs/${id}` },
    socarxiv:  { name: 'SocArXiv',  url: osf('socarxiv') },
    psyarxiv:  { name: 'PsyArXiv',  url: osf('psyarxiv') },
    metaarxiv: { name: 'MetaArXiv', url: osf('metaarxiv') },
    edarxiv:   { name: 'EdArXiv',   url: osf('edarxiv') },
    osf:       { name: 'OSF',       url: id => `https://osf.io/${id}` },
    biorxiv:   { name: 'bioRxiv',   url: viaDoi },
    medrxiv:   { name: 'medRxiv',   url: viaDoi },
    ssrn:      { name: 'SSRN',      url: id => `https://ssrn.com/abstract=${id}` },
    hal:       { name: 'HAL',       url: id => `https://hal.science/${id}` },
    zenodo:    { name: 'Zenodo',    url: id => `https://zenodo.org/records/${id}` },
    figshare:  { name: 'Figshare',  url: viaDoi },
};

const OSF_SERVERS = new Set(['socarxiv', 'psyarxiv', 'metaarxiv', 'edarxiv', 'osf']);

function normaliseEprint(key: string, id: string): string {
    id = id.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    // OSF preprints are often given as a DOI ("10.31235/osf.io/abc12") or URL.
    if (OSF_SERVERS.has(key)) id = id.replace(/^(https?:\/\/)?(10\.\d+\/)?osf\.io\/(preprints\/\w+\/)?/i, '');
    return id;
}

// Preprint version of a publication, from `eprint` + `eprinttype`, or from the
// site-only `preprint_url` field for servers not listed above.
function preprint(f: Record<string, unknown>): Preprint | null {
    const type = str(f.eprinttype || f.archiveprefix);
    const key = type.toLowerCase();
    let id = str(f.eprint);
    const preprintUrl = str(f.preprint_url);

    // Without an explicit archive, only accept identifiers that look like arXiv IDs.
    const server = PREPRINT_SERVERS[key]
        ?? (!type && /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/i.test(id) ? PREPRINT_SERVERS.arxiv : undefined);
    if (id && server) id = normaliseEprint(key || 'arxiv', id);

    const url = preprintUrl || (id && server ? server.url(id) : '');
    if (!url) {
        if (id && type) console.warn(`[bibtex] Unknown eprinttype "${type}"; add preprint_url to link it.`);
        return null;
    }
    return { server: server?.name ?? (type || 'Preprint'), id: server ? id : '', url };
}

// Venue text for a preprint, e.g. "arXiv:2311.10260" or "SocArXiv".
function preprintVenue(p: Preprint | null): string {
    if (!p) return 'Preprint';
    return p.server === 'arXiv' && p.id ? `arXiv:${p.id}` : p.server;
}

// Whether a journal field actually names a preprint server.
function isPreprintJournal(journal: string, p: Preprint | null): boolean {
    return /rxiv/i.test(journal) || (!!p && journal.toLowerCase() === p.server.toLowerCase());
}

function publicationType(type: string, f: Record<string, unknown>, pre: Preprint | null): string {
    const journal = str(f.journal);
    switch (type) {
        case 'article':
            return journal && !isPreprintJournal(journal, pre) ? 'Journal' : 'Preprint';
        case 'inproceedings':
        case 'conference':
            return 'Conference';
        case 'incollection':
        case 'inbook':
            return 'Book chapter';
        case 'book':
            return 'Book';
        case 'phdthesis':
        case 'mastersthesis':
            return 'Thesis';
        case 'techreport':
        case 'report':
            return /working paper/i.test(str(f.type)) ? 'Preprint' : 'Report';
        default:
            return pre ? 'Preprint' : 'Other';
    }
}

// "+032801" → "032801", "412--412" → "412", "1--10" → "1–10"
function formatPages(pages: string): string {
    const [start, end] = pages.replace(/^\+/, '').split(/\s*[-–—]+\s*/);
    if (!end || start === end) return start ?? '';
    return `${start}–${end}`;
}

function venue(type: string, f: Record<string, unknown>, pre: Preprint | null): string {
    const journal = str(f.journal);
    const volume = str(f.volume);
    const number = str(f.number);
    const pages = formatPages(str(f.pages));

    switch (type) {
        case 'article': {
            if (!journal || isPreprintJournal(journal, pre)) return preprintVenue(pre);
            let v = journal;
            if (volume) v += ` ${volume}${number ? `(${number})` : ''}`;
            if (pages) v += `${volume ? ':' : ', '}${pages}`;
            return v;
        }
        case 'inproceedings':
        case 'conference':
        case 'incollection':
        case 'inbook': {
            const editors = Array.isArray(f.editor) ? f.editor.map(formatAuthor) : [];
            let v = `In: ${editors.length ? `${editors.join(', ')} (ed${editors.length > 1 ? 's' : ''}.), ` : ''}${str(f.booktitle)}`;
            if (pages) v += `, pp. ${pages}`;
            const publisher = str(f.publisher);
            if (publisher) v += `. ${publisher}`;
            return v;
        }
        case 'book':
            return str(f.publisher);
        case 'phdthesis':
            return `PhD thesis, ${str(f.school)}`;
        case 'mastersthesis':
            return `Master's thesis, ${str(f.school)}`;
        case 'techreport':
        case 'report':
            // e.g. "Research on Research Institute, Working Paper No. 22"
            return [str(f.institution), str(f.number) && [str(f.type), `No. ${str(f.number)}`].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        default: {
            const v = str(f.howpublished || f.publisher || f.journal);
            if (pre && (!v || isPreprintJournal(v, pre))) return preprintVenue(pre);
            return v;
        }
    }
}

// PDFs in src/data/pdf/, named after the citation key (case-sensitive), are
// bundled with the site and linked from the publications page.
const pdfFiles = import.meta.glob('../data/pdf/*.pdf', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const pdfs = new Map(Object.entries(pdfFiles).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.pdf$/, ''),
    url,
]));

// Split the raw .bib source into entries so we can offer the original BibTeX
// for each publication (useful for "copy BibTeX").
function rawEntries(source: string): Map<string, string> {
    const map = new Map<string, string>();
    const chunks = source.split(/^(?=@)/m);
    for (const chunk of chunks) {
        const m = chunk.match(/^@\s*\w+\s*[{(]\s*([^,\s]+)\s*,/);
        if (!m) continue;
        // Drop non-standard, site-only fields from the exported BibTeX.
        const cleaned = chunk
            .trim()
            .replace(/^\s*(slide_url|preprint_url|abstract)\s*=.*$\n?/gim, '');
        map.set(m[1], cleaned);
    }
    return map;
}

function load(): Publication[] {
    const { entries, errors } = parse(bibSource);
    if (errors.length) {
        console.warn('[bibtex] Problems while parsing bibliography.bib:', errors);
    }
    const raw = rawEntries(bibSource);

    const pubs = entries.map((entry): Publication => {
        const f = entry.fields as Record<string, unknown>;
        const type = entry.type.toLowerCase();
        const rawAuthors = (Array.isArray(f.author) ? f.author : []) as Parameters<typeof formatAuthor>[0][];
        const authors = rawAuthors.map(a => ({ name: formatAuthor(a), isMe: isOwner(a) }));

        const myIndex = rawAuthors.findIndex(isOwner);
        let authorship: Publication['authorship'] = 'other';
        if (myIndex === 0) authorship = 'first';
        else if (myIndex > 0 && myIndex === rawAuthors.length - 1) authorship = 'last';

        const pre = preprint(f);
        const doi = str(f.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
        const url = str(f.url);
        const link = doi ? `https://doi.org/${doi}` : url || pre?.url || '';

        return {
            id: entry.key,
            title: cleanText(str(f.title)),
            authors,
            authorsText: authors.map(a => a.name).join(', '),
            venue: cleanText(venue(type, f, pre)),
            year: parseInt(str(f.year), 10) || 0,
            month: parseMonth(f.month),
            authorship,
            publicationType: publicationType(type, f, pre),
            abstract: cleanText(str(f.abstract)),
            doi,
            link,
            preprint: pre,
            slides: str(f.slide_url),
            pdf: pdfs.get(entry.key) ?? '',
            bibtex: raw.get(entry.key) ?? '',
        };
    });

    const keys = new Set(pubs.map(p => p.id));
    for (const name of pdfs.keys()) {
        if (!keys.has(name)) console.warn(`[bibtex] src/data/pdf/${name}.pdf does not match any citation key.`);
    }

    // Newest first; within a year, by month (unknown months last).
    return pubs.sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0));
}

export const publications: Publication[] = load();
