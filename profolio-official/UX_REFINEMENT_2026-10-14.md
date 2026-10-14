# ProFolio: refined discovery experience

## Design decisions

- Warm ivory surfaces, ink teal navigation, muted wine actions and brass text accents. Color tokens also define the dark palette.
- Original supplied ProFolio artwork remains beneath search in a compact two-column desktop introduction; it occupies the full content width on mobile.
- Shared search filters sit above both map and list. Minimum price and bedroom criteria use native disclosure instead of competing with the first search view.
- Map and results have aligned panels on larger screens. Tablet and mobile cards use full-width photography; list mode uses a photo-led grid.
- Primary text and prices are easier to read. Actions and navigation have clear selected/focus states and generous touch dimensions.
- Removed the redundant list-heading panel. Sample-data disclosure remains visible.

## Research

- [EstateBook design case study](https://www.mosaeed.design/work/estatebook): discovery, evaluation, saving and returning form one journey; secondary property information is layered.
- [Aurelia Estates source](https://github.com/dgitalcode/Real-Estate-Template): reference for restrained editorial typography and photographic hierarchy. No template code or property claims were copied.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): considered during control sizing and spacing.

## Validation

- Unique HTML IDs, local assets, existing primary actions and button handlers checked.
- Shared-filter DOM placement, disclosure structure, CSS block balance, JavaScript syntax and diff checks passed.
- Measured contrast on ivory: main text 13.21:1, muted text 4.87:1, brass text 5.31:1, wine actions 10.79:1. Dark muted text 7.56:1.
- Browser checks and release evidence are recorded with the pull request.
