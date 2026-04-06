// test_get_charts.js
const { getPinnedChartsAction } = require('./src/app/actions');

async function run() {
   // Wait, getPinnedChartsAction relies on Next.js headers()
   // Next.js headers() will throw an error outside of Next.js context!
   // So getPinnedChartsAction will THROW because getSessionAction() throws outside of Next.js!!!
}
run();
