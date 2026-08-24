# Streaming Regional Filter (India)

A Chrome extension that hides Indian shows and movies from **Netflix** and
**Prime Video** — browse rows, search results, and banners.

## Install

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this folder
4. Open (or refresh) netflix.com / primevideo.com

## How it works

Neither site labels titles with their country of origin in the page, so the
extension filters heuristically, in four layers:

1. **Category rows** — hides entire rows whose name matches keywords like
   "Bollywood Movies", "Indian TV Dramas", "Movies in Hindi", "Tamil",
   "Telugu", etc.
2. **Known titles** — a built-in list of ~120 well-known Indian titles across
   both platforms (Sacred Games, Delhi Crime, RRR, Mirzapur, Panchayat,
   The Family Man, ...).
3. **Indic script** — any title rendered in Devanagari, Tamil, Telugu,
   Bengali, Kannada, Malayalam, Gujarati, or Punjabi script is hidden.
4. **Your blocklist** — click the extension icon to add extra words or exact
   titles (one per line), or to toggle the filter off. The list is shared
   across both sites.

Per-site details:

- **Netflix** — filters `lolomo` browse rows, `.title-card`s (rows, search,
  galleries), and the billboard banner.
- **Prime Video** — filters carousels by heading, cards via their
  `data-card-title` attribute, and any link to a `/detail/` title page. Works
  on primevideo.com and the `/gp/video` section of amazon.com / .in / .co.uk.

## Limitations

Because origin isn't exposed in the DOM, an Indian title with an
English-language name that isn't in the built-in list and doesn't sit in an
Indian category row can slip through — add it to the blocklist via the popup
and it's gone. Filtering is visual only; it doesn't change either platform's
recommendation profile.

## Connect

- [Profile](https://apoorvdarshan.com)
- [X](https://x.com/aporvv)
- [GitHub](https://github.com/apoorvdarshan)
- [LinkedIn](https://www.linkedin.com/in/aopv/)
- [Product Hunt](https://www.producthunt.com/@aov)
- [YouTube](https://www.youtube.com/@aopv)
- [Twitch](https://www.twitch.tv/apoorvv)
- [Instagram](https://www.instagram.com/aporvvv)
- [TrustMRR](https://trustmrr.com/founder/apoorvdarshan)
- [Sponsor on GitHub](https://github.com/sponsors/apoorvdarshan)
- [Ko-fi](https://ko-fi.com/apv)
- [Grokipedia](https://grokipedia.com/page/Apoorv_Darshan)
- Email: [apoorvdarshan@gmail.com](mailto:apoorvdarshan@gmail.com), [ad13dtu@gmail.com](mailto:ad13dtu@gmail.com), [apoorv@fud-ai.app](mailto:apoorv@fud-ai.app)
- [Schedule a meeting](https://cal.com/aporvv)
- [Hacker News](https://news.ycombinator.com/user?id=apoorvdarshan)
- [Pinterest](https://www.pinterest.com/a0pv)
- [Spotify](https://open.spotify.com/user/31lawlmexv2yrccl6xbhxggb6bza)
