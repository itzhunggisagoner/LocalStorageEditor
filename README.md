<p align="center">
  <img src="resources/Logo.png" alt="Local Storage Editor" width="220">
</p>

<h1 align="center">LocalStorageEditor</h1>

<p align="center">
  A small Chrome extension for looking at, changing and cleaning up the localStorage of any website.
</p>

<p align="center">
  <a href="https://github.com/itzhunggisagoner/LocalStorageEditor/releases">Download</a>·
  <a href="https://itzhunggisagoner.github.io/LocalStorageEditor/">Try it online</a>·
  <a href="LICENSE">MIT License</a>
</p>

---

## What it does

Open the popup on any site and you get every key that site stores in your browser.

- **View** all keys and values for the current site
- **Search** keys and values at the same time
- **Add** a new key, or **edit** an existing one (renaming works too)
- **Delete** a single item, or clear everything for the site
- **Copy** a value with one click
- **Format JSON** before you edit a big stored object

Renaming a key saves the new one before removing the old one, and overwriting a key that already exists asks first.

## Install

### From the releases page

1. Download the latest zip from the [Releases page](https://github.com/itzhunggisagoner/LocalStorageEditor/releases) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the folder that contains `manifest.json`.
4. Pin the extension, open any website and click its icon.

## Project layout

```
manifest.json     extension manifest (MV3)
popup.html        popup markup
popup.js          all the logic
app.css           editor styles
popup.css         popup sizing
resources/        logo, icons and the Torus font
docs/             the demo site on GitHub Pages
```

The demo site runs the same `popup.js` against its own localStorage. If you change `popup.js`, `app.css` or anything in `resources/`, copy it into `docs/` too, since GitHub Pages only serves that folder.

## Font

The interface uses Torus. Put `Torus.otf` in `resources/` (and `docs/resources/` for the demo site). Without it, the extension falls back to a system font.

## Credits

Created by me [itzhunggisagoner](https://github.com/itzhunggisagoner)
Logo and website inspired by [Geode SDK homepage](https://geode-sdk.org)
This project use generative AI to code review and advice.

## License

Released under the [MIT License](LICENSE).

Made by [hunggisagoner](https://github.com/itzhunggisagoner). If it saved you a trip to DevTools, a star on the repo is appreciated.
