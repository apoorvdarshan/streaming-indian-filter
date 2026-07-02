# Netflix Regional Filter (India)

A Chrome extension that hides Indian shows and movies from Netflix — browse
rows, search results, and the billboard banner.

## Install

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this folder
4. Open (or refresh) netflix.com

## How it works

Netflix doesn't label titles with their country of origin in the page, so the
extension filters heuristically, in four layers:

1. **Category rows** — hides entire rows whose name matches keywords like
   "Bollywood Movies", "Indian TV Dramas", "Hindi-Language Films", "Tamil",
   "Telugu", etc.
2. **Known titles** — a built-in list of ~90 well-known Indian Netflix
   originals and hits (Sacred Games, Delhi Crime, RRR, Heeramandi, ...).
3. **Indic script** — any title rendered in Devanagari, Tamil, Telugu,
   Bengali, Kannada, Malayalam, Gujarati, or Punjabi script is hidden.
4. **Your blocklist** — click the extension icon to add extra words or exact
   titles (one per line), or to toggle the filter off.

## Limitations

Because origin isn't exposed in the DOM, an Indian title with an
English-language name that isn't in the built-in list and doesn't sit in an
Indian category row can slip through — add it to the blocklist via the popup
and it's gone. Filtering is visual only; it doesn't change your Netflix
recommendations profile.
