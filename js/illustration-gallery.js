// Illustration gallery: justified rows of near-equal height, sorted dark -> light so
// the gallery reads as a gradient from the upper left to the lower right.
(function () {
    const DIR = 'assets/img/illustrations/';
    const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif)$/i;
    const GAP = 3; // px between images, keep in sync with .illo-row gap in main.css

    // Pieces that belong side by side no matter how their brightness differs.
    // Filenames are matched loosely, so partial names are fine.
    const KEEP_TOGETHER = [
        ['endgames_back', 'endgames_cover_v3'],
    ];

    // 1. Find the images. On GitHub Pages, Jekyll writes the folder contents into
    //    #illustration-manifest at build time. When the page is served without
    //    Jekyll (e.g. `python3 -m http.server`), fall back to the directory listing.
    async function listSources() {
        const manifest = document.getElementById('illustration-manifest');
        if (manifest) {
            try {
                const paths = JSON.parse(manifest.textContent);
                if (Array.isArray(paths) && paths.length) {
                    return paths.filter(p => IMAGE_RE.test(p));
                }
            } catch (e) { /* raw Liquid: page wasn't built by Jekyll */ }
        }
        try {
            const res = await fetch(DIR);
            if (res.ok) {
                const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
                return [...doc.querySelectorAll('a[href]')]
                    .map(a => a.getAttribute('href'))
                    .filter(href => IMAGE_RE.test(href))
                    .map(href => new URL(href, res.url).pathname);
            }
        } catch (e) { /* no directory listing available */ }
        return [];
    }

    // 2. Load an image and measure its average brightness (0 = black, 1 = white).
    const canvas = document.createElement('canvas');
    const SAMPLE = 64;
    canvas.width = canvas.height = SAMPLE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    function brightness(img) {
        ctx.clearRect(0, 0, SAMPLE, SAMPLE);
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        let data;
        try {
            data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
        } catch (e) {
            return 0.5; // canvas is tainted (e.g. opened via file://), can't sort
        }
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        return sum / (SAMPLE * SAMPLE * 255);
    }

    function load(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve({
                src,
                ratio: img.naturalWidth / img.naturalHeight,
                value: brightness(img),
            });
            img.onerror = () => {
                console.error('Failed to load illustration:', src);
                resolve(null);
            };
            img.src = src;
        });
    }

    // 3. Bundle the sorted images into units that must stay within one row. A bundle
    //    sits at its members' average brightness, so the gradient still holds.
    function buildUnits(items) {
        const taken = new Set();
        const units = [];
        for (const names of KEEP_TOGETHER) {
            const members = items.filter(it => !taken.has(it) &&
                names.some(name => it.src.toLowerCase().includes(name.toLowerCase())));
            if (members.length < 2) continue;
            members.forEach(m => taken.add(m));
            units.push({
                items: members,
                value: members.reduce((sum, m) => sum + m.value, 0) / members.length,
            });
        }
        items.forEach(it => {
            if (!taken.has(it)) units.push({ items: [it], value: it.value });
        });
        units.sort((a, b) => a.value - b.value);
        units.forEach((unit, i) => { unit.order = i; }); // place in the brightness order
        return units;
    }

    // 4. Break the units into rows. A row is drawn at the height where its images
    //    exactly fill the width, so nothing is cropped. Every possible row count is
    //    tried and we keep the one whose rows can all sit closest to a single shared
    //    height, which keeps images about the same size all down the page.
    const heightOf = (ratioSum, imageCount, width) =>
        (width - GAP * (imageCount - 1)) / ratioSum;

    function partitionInto(units, width, rowCount) {
        const n = units.length;
        if (rowCount < 1 || rowCount > n) return null;

        const ratio = [0];
        const count = [0];
        units.forEach((unit, i) => {
            ratio[i + 1] = ratio[i] + unit.items.reduce((sum, it) => sum + it.ratio, 0);
            count[i + 1] = count[i] + unit.items.length;
        });
        const images = count[n];

        // The single height at which `rowCount` full-width rows would all be identical.
        const shared = (rowCount * width - GAP * (images - rowCount)) / ratio[n];
        if (!(shared > 0)) return null;

        const cost = Array.from({ length: n + 1 }, () => new Array(rowCount + 1).fill(Infinity));
        const from = Array.from({ length: n + 1 }, () => new Array(rowCount + 1).fill(0));
        cost[0][0] = 0;
        for (let r = 1; r <= rowCount; r++) {
            for (let end = r; end <= n; end++) {
                for (let start = r - 1; start < end; start++) {
                    if (cost[start][r - 1] === Infinity) continue;
                    const h = heightOf(ratio[end] - ratio[start], count[end] - count[start], width);
                    if (h <= 0) continue;
                    const c = cost[start][r - 1] + Math.log(h / shared) ** 2;
                    if (c < cost[end][r]) {
                        cost[end][r] = c;
                        from[end][r] = start;
                    }
                }
            }
        }
        if (cost[n][rowCount] === Infinity) return null;

        const rows = [];
        let end = n;
        for (let r = rowCount; r > 0; r--) {
            const start = from[end][r];
            rows.unshift({
                u0: start,
                u1: end,
                height: heightOf(ratio[end] - ratio[start], count[end] - count[start], width),
            });
            end = start;
        }
        return { rows, shared, cost: cost[n][rowCount] };
    }

    // Try every row count and keep the one whose rows sit closest to a single shared
    // height, with a mild pull toward the preferred image size.
    function partition(units, width, preferred) {
        let best = null;
        for (let rowCount = 1; rowCount <= units.length; rowCount++) {
            const plan = partitionInto(units, width, rowCount);
            if (!plan || plan.shared < 60 || plan.shared > 4 * preferred) continue;
            const total = plan.cost + 0.35 * rowCount * Math.log(plan.shared / preferred) ** 2;
            if (!best || total < best.total) best = { rows: plan.rows, rowCount, total };
        }
        if (best) return best;
        const fallback = partitionInto(units, width, units.length);
        return { rows: fallback.rows, rowCount: units.length };
    }

    // How uneven a set of rows is: the spread of their heights in log space, plus a
    // mild pull toward the preferred image size.
    function unevenness(rows, preferred) {
        const logs = rows.map(row => Math.log(row.height));
        const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
        const spread = logs.reduce((sum, l) => sum + (l - mean) ** 2, 0);
        return spread + 0.35 * rows.length * (mean - Math.log(preferred)) ** 2;
    }

    // Row heights are limited by the brightness order: a row of wide panoramas ends up
    // shorter than a row of portraits. Swapping two images across a row edge barely
    // disturbs the gradient but can even the rows out a lot, so keep any such swap that
    // lowers the spread of row heights. MAX_DRIFT is how far an image may travel from
    // its place in the brightness order; keeping it small protects the gradient, which
    // matters more than the last few percent of evenness.
    const MAX_DRIFT = 3;

    function planRows(units, width, preferred) {
        const initial = partition(units, width, preferred);
        let sequence = units.slice();
        let rows = initial.rows;
        let rowCount = initial.rowCount;
        let cost = unevenness(rows, preferred);

        // Best rows for one sequence, allowing a row more or fewer than we have now.
        const evaluate = trial => {
            let best = null;
            for (const candidate of [rowCount - 1, rowCount, rowCount + 1]) {
                const plan = partitionInto(trial, width, candidate);
                if (!plan || plan.shared < 60 || plan.shared > 4 * preferred) continue;
                const planCost = unevenness(plan.rows, preferred);
                if (!best || planCost < best.cost) {
                    best = { rows: plan.rows, rowCount: candidate, cost: planCost };
                }
            }
            return best;
        };

        for (let pass = 0; pass < 60; pass++) {
            let improved = false;
            search:
            for (let r = 0; r + 1 < rows.length; r++) {
                for (let a = rows[r].u0; a < rows[r].u1; a++) {
                    for (let b = rows[r + 1].u0; b < rows[r + 1].u1; b++) {
                        if (Math.abs(sequence[a].order - b) > MAX_DRIFT) continue;
                        if (Math.abs(sequence[b].order - a) > MAX_DRIFT) continue;
                        const trial = sequence.slice();
                        [trial[a], trial[b]] = [trial[b], trial[a]];
                        const plan = evaluate(trial);
                        if (plan && plan.cost < cost - 1e-9) {
                            sequence = trial;
                            rows = plan.rows;
                            rowCount = plan.rowCount;
                            cost = plan.cost;
                            improved = true;
                            break search;
                        }
                    }
                }
            }
            if (!improved) break;
        }
        return { sequence, rows };
    }

    function targetRowHeight(width) {
        // Fewer, larger images per row on phones; ~4-5 per row on a desktop.
        if (width < 640) return Math.round(width / 2.4);
        return Math.round(Math.max(150, Math.min(230, width / 4.5)));
    }

    // 5. Lightbox with keyboard navigation.
    function openLightbox(items, index) {
        const overlay = document.createElement('div');
        overlay.className = 'illo-lightbox';
        const img = document.createElement('img');
        overlay.appendChild(img);

        const show = i => {
            index = (i + items.length) % items.length;
            img.src = items[index].src;
            img.alt = items[index].alt;
        };
        const close = () => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        };
        const onKey = e => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') show(index + 1);
            else if (e.key === 'ArrowLeft') show(index - 1);
        };

        overlay.addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        show(index);
        document.body.appendChild(overlay);
    }

    function altFromSrc(src) {
        const name = decodeURIComponent(src.split('/').pop()).replace(/\.[^.]+$/, '');
        return name.replace(/[_-]+/g, ' ');
    }

    async function init() {
        const container = document.querySelector('.illustrations-grid');
        if (!container) return;
        container.innerHTML = '<p class="illo-status">loading illustrations…</p>';

        const sources = await listSources();
        const loaded = (await Promise.all(sources.map(load)))
            .filter(Boolean)
            .sort((a, b) => a.value - b.value);

        if (!loaded.length) {
            container.innerHTML = '<p class="illo-status">Could not load illustrations.</p>';
            return;
        }

        const units = buildUnits(loaded);
        const items = units.flatMap(unit => unit.items);

        // Build each tile once; layout just moves them between rows. `order` holds the
        // images as currently laid out, so the lightbox steps through them as shown.
        let order = items;
        const tileFor = new Map();
        for (const item of items) {
            item.alt = altFromSrc(item.src);
            const a = document.createElement('a');
            a.className = 'illo';
            a.href = item.src;
            a.style.flexGrow = item.ratio;
            a.addEventListener('click', e => {
                e.preventDefault();
                openLightbox(order, order.indexOf(item));
            });
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt;
            a.appendChild(img);
            tileFor.set(item, a);
        }

        let lastWidth = 0;
        const layout = () => {
            const width = container.clientWidth;
            if (!width || width === lastWidth) return;
            lastWidth = width;
            const plan = planRows(units, width, targetRowHeight(width));
            order = plan.sequence.flatMap(unit => unit.items);
            const frag = document.createDocumentFragment();
            for (const row of plan.rows) {
                const el = document.createElement('div');
                el.className = 'illo-row';
                el.style.height = row.height + 'px';
                for (let u = row.u0; u < row.u1; u++) {
                    plan.sequence[u].items.forEach(item => el.appendChild(tileFor.get(item)));
                }
                frag.appendChild(el);
            }
            container.replaceChildren(frag);
        };

        layout();
        new ResizeObserver(layout).observe(container);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
