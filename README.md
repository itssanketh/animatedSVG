# animatedSVG

Free, pointer-reactive SVG line animations for any website. Live at https://animatedsvg.vercel.app

Each `hairline-*.html` file is a self-contained figure (markup, styles, engine and figure code), with no dependencies. `index.html` is the site: a live gallery with copy-code, copy-embed and download buttons. The matching `*.js` files are the figure sources, kept for editing.

Run locally: `python3 -m http.server`, then open http://localhost:8000.

Figures are built on [Hairline](https://github.com/lucasmarkes/hairline) by Lucas Marques (MIT). See THIRD_PARTY_NOTICES.txt.
