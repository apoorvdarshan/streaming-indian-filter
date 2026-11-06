# Streaming Regional Filter (India)

A Chrome extension that hides Indian movies and shows from **Netflix** and
**Prime Video**, including mixed recommendation rows, search cards, and banners.

## Install or update

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. After updating the files, click **Reload** on the extension's card.
4. Refresh open Netflix / Prime Video tabs so they load the new scripts.

The popup's **Filter enabled** and **Save** controls apply settings to already
loaded tabs. Disabling restores hidden elements; removing a custom term restores
its matches without refreshing.

## Automatic filtering

The extension bundles a country-of-origin catalog containing tens of thousands
of Indian films, TV series, and web series from Wikidata. It includes English
names, aliases, original titles where available, and release years. The current
count and catalog build date appear in the popup. No API key is needed.
The previous version's explicit title blocks remain as a small compatibility
fallback for missing catalog records and familiar short names.

- **Title detection:** checks poster image alt text, card attributes, accessible
  labels, text titles, and banner logos rather than relying on one link label.
- **Title variants:** handles punctuation, “Play”/“Watch” labels, season numbers,
  language-edition suffixes, and “The Movie” suffixes.
- **Origin metadata:** uses explicit country-of-origin metadata when a card
  supplies it. A dub's audio language or Indic script alone is not origin proof.
- **Regional categories:** hides explicitly Indian/language category rows while
  filtering individual titles in mixed rows such as “Top 10 in India.”
- **Dynamic pages:** rechecks lazy-loaded posters, text/label changes, new cards,
  and recycled cards. There is no periodic whole-page polling.

**Hide shared-name titles too** is on by default for stronger filtering. Foreign
productions with the same name may also disappear when the card has no year or
origin information. Turn this option off to preserve ambiguous matches. Explicit
origin information and available years help avoid mismatching foreign productions.

Optional extra words or titles (one per line) apply across both sites. Custom
terms use normalized whole-word/phrase matching.

### Supported pages

- Netflix `www.netflix.com`: browse rows, title cards, search/galleries, billboards.
- Prime Video `*.primevideo.com`: modern `article`/list cards, poster-only cards,
  search/detail links, featured banners and carousels.
- Amazon `.com`, `.in`, `.co.uk`: `/gp/video/` pages, including `/detail/` and
  `/dp/` links within those pages.

## Privacy and limitations

Filtering happens locally with only the `storage` permission. The extension
makes **no network requests**, sends no browsing history to a service, and does
not change either platform's recommendations or account settings. Settings sync
through Chrome; the catalog is bundled with the extension.

This is broader than a hand-picked list, but cannot guarantee every title is
removed. Wikidata can have missing, outdated, or incorrect country/name/year
records. Newly released or unlisted titles, unfamiliar page layouts, and posters
with no accessible text can escape detection. Shared names remain inherently
ambiguous without origin metadata. Language rows can also contain foreign dubs.

## Development

Node.js 22 or newer:

```sh
npm ci
npm test
```

Tests cover Prime/Amazon and Netflix fixtures, country and title matching,
shared-name handling, poster-only cards, banners, lazy loading, recycled cards,
settings restoration, and storage failures. These fixtures do not prove current
logged-in Chrome compatibility; verify real streaming pages after reloading.

Rebuild the offline catalog before shipping an update:

```sh
npm run catalog:update
npm test
```

The build script queries Wikidata's public data through the QLever mirror,
collecting productions with country of origin **India** (including coproductions)
and checking for names shared with non-Indian films and series. It validates the
result before replacing `catalog.js`; a failed query preserves the old catalog.
This build step is the only part that contacts a catalog service. It requires no
credentials and sends no viewing history. QLever's source snapshot can lag behind
Wikidata; the recorded build date is the retrieval date.

Data: [Wikidata](https://www.wikidata.org/), structured data under
[CC0](https://www.wikidata.org/wiki/Wikidata:Licensing).
Query service: [QLever](https://qlever.dev/wikidata).
