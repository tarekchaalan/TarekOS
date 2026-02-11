# ChessEloShield

## Short Description

A browser extension for Chess.com that prevents tilt and rating loss by enforcing configurable cooldown timers after games.

## Overview

ChessEloShield helps Chess.com players protect their ratings by blocking the impulse to rematch after a loss. The extension overlays a configurable cooldown timer on the page, giving players time to reset mentally before queuing another game. Built and published for both Chrome and Firefox, it takes a privacy-first approach with zero tracking or data collection.

## Features

- Enforce a configurable cooldown duration after each game to prevent tilt-driven rematches
- Block the board with a visual overlay that counts down before allowing the next game
- Sync user settings across devices using browser storage APIs
- Run entirely client-side with no external tracking or data collection
- Support both Chrome and Firefox through cross-compatible extension architecture

## Tech Stack

- **Language:** JavaScript
- **Platform:** Chrome Extension, Firefox Add-on
- **APIs:** Browser Extension APIs (background scripts, content scripts, storage sync)
- **Styling:** CSS Overlays

## Links

- **GitHub Repository:** https://github.com/TarekChaalan/ChessEloShield
- **Chrome Web Store:** https://chromewebstore.google.com/detail/chesseloshield/ekjahhkooocdfnjjdfmlglmlbdomkpkn
- **Firefox Add-on:** https://addons.mozilla.org/en-US/firefox/addon/chesseloshield/
