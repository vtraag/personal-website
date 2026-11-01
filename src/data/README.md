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
| `eprint` (+ `eprinttype`/`archiveprefix`)   | **arXiv** button                                            |
| `slide_url`                                 | **Slides** button                                           |
| `abstract`                                  | Shown when clicking on a publication; searchable            |

## Publication types (used by the Type filter)

| Entry type                          | Type                                      |
|-------------------------------------|-------------------------------------------|
| `@article`                          | Journal (Preprint if there is no journal or the journal is arXiv) |
| `@inproceedings`, `@conference`     | Conference                                |
| `@incollection`, `@inbook`          | Book chapter                              |
| `@book`                             | Book                                      |
| `@phdthesis`, `@mastersthesis`      | Thesis                                    |
| `@techreport`, `@report`            | Report                                    |
| `@misc` and others                  | Preprint if it has an arXiv eprint, otherwise Other |

Each publication also has a **BibTeX** button that copies the original entry
(without `abstract` and `slide_url`) to the clipboard.
