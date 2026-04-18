const fs = require('fs');
const path = require('path');

const blueprintPath = '/Users/NUMTEMA/Downloads/zip (1)/scratch/test-blueprint.json';
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8')).blueprint;

async function runBatch(pages) {
    console.log(`>>> [SQUAD] Starting Batch: ${pages.map(p => p.routeName).join(', ')}`);
    const response = await fetch('http://localhost:3000/api/fill-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages, blueprint })
    });
    return response.json();
}

async function finalize(allResults) {
    console.log(`>>> [FINALIZER] Persisting ${Object.keys(allResults).length} pages to disk...`);
    const response = await fetch('http://localhost:3000/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, generatedFiles: allResults })
    });
    return response.json();
}

async function start() {
    const pages = blueprint.contentPages;
    const allResults = {};

    // Batch 1
    const res1 = await runBatch(pages.slice(0, 5));
    res1.results.forEach(r => allResults[r.routeName] = r.content);

    // Batch 2
    const res2 = await runBatch(pages.slice(5, 10));
    res2.results.forEach(r => allResults[r.routeName] = r.content);

    // Batch 3
    const res3 = await runBatch(pages.slice(10, 15));
    res3.results.forEach(r => allResults[r.routeName] = r.content);

    const final = await finalize(allResults);
    console.log('>>> [SUCCESS] Generation complete!', final);
}

start().catch(console.error);
