# Publications

The publications page is generated from `bibliography.bib` in this folder.
The file is parsed at build time by `src/lib/bibtex.ts` (using
[`@retorquere/bibtex-parser`](https://github.com/retorquere/bibtex-parser),
which also converts LaTeX accents and commands to Unicode).

To add or update a publication, edit `bibliography.bib` (or export it from
Zotero, JabRef, etc.) and rebuild the site. No other changes are needed.

## How entries are interpreted

| BibTeX                                      | Used for                                                    |
|---------------------------------------------|-------------------------------------------------------------|
| `author`                                    | Author list; your name (see `bibAuthorLastName` in `src/constants.ts`) is highlighted and determines First/Last authorship |
| `title`, `year`, `month`                    | Title and sort order (newest first)                         |
| `journal`, `volume`, `number`, `pages`      | Venue line for `@article`                                   |
| `booktitle`, `editor`, `publisher`          | Venue line for `@inproceedings` / `@incollection`           |
| `school`, `institution`                     | Venue line for theses and reports                           |
| `doi`                                       | Title link and **DOI** button                               |
| `url`                                       | Title link if there is no DOI                               |
| `eprint` + `eprinttype` (or `archiveprefix`) | Preprint button (see below)                                |
| `preprint_url`                              | Preprint link for servers not listed below                  |
| `slide_url`                                 | **Slides** button                                           |
| `pdf/<citation key>.pdf`                    | **PDF** button (file name must match the key exactly)       |
| `abstract`                                  | Shown when clicking on a publication; searchable            |

## Preprints

The preprint version of a publication is given with the standard BibLaTeX
`eprint` and `eprinttype` fields. The button is labelled with the server name
and is shown next to the **DOI** button, so a published paper can link to both
versions. If the preprint is the publication itself (e.g. a working paper on
Figshare, with the same DOI), only the preprint button is shown. These servers are recognised (case-insensitive):

| `eprinttype`                                   | `eprint`                         | Example                         |
|------------------------------------------------|----------------------------------|---------------------------------|
| `arXiv`                                        | arXiv ID                         | `2311.10260`                    |
| `SocArXiv`, `PsyArXiv`, `MetaArXiv`, `EdArXiv` | OSF ID (or its DOI/URL)          | `abc12`, `10.31235/osf.io/abc12` |
| `OSF`                                          | OSF ID                           | `abc12`                         |
| `bioRxiv`, `medRxiv`                           | DOI                              | `10.1101/2024.01.01.123456`     |
| `SSRN`                                         | SSRN abstract ID                 | `1234567`                       |
| `HAL`                                          | HAL ID                           | `hal-01234567`                  |
| `Zenodo`                                       | Zenodo record ID                 | `1234567`                       |
| `Figshare`                                     | DOI                              | `10.6084/m9.figshare.29302004`  |

An `eprint` without `eprinttype` is treated as arXiv if it looks like an arXiv
ID. For any other server, also add `preprint_url`; the button is then labelled
with the `eprinttype` (or "Preprint" if there is none). An unknown `eprinttype`
without `preprint_url` is ignored, with a warning during the build. New servers
can be added to `PREPRINT_SERVERS` in `src/lib/bibtex.ts`.

```bibtex
eprinttype   = {Preprints.org},
eprint       = {202401.0001},
preprint_url = {https://www.preprints.org/manuscript/202401.0001},
```

## Publication types (used by the Type filter)

| Entry type                          | Type                                      |
|-------------------------------------|-------------------------------------------|
| `@article`                          | Journal (Preprint if there is no journal or the journal is arXiv) |
| `@inproceedings`, `@conference`     | Conference                                |
| `@incollection`, `@inbook`          | Book chapter                              |
| `@book`                             | Book                                      |
| `@phdthesis`, `@mastersthesis`      | Thesis                                    |
| `@techreport`, `@report`            | Report (Preprint if `type` is "Working Paper") |
| `@misc` and others                  | Preprint if it has a preprint, otherwise Other |

Each publication also has a **BibTeX** button that copies the original entry
(without `abstract`, `slide_url` and `preprint_url`) to the clipboard.
