const { runAcceptanceTests, ACCEPTANCE_TESTS } = require('../src/services/intentTestSuite.ts');

async function main() {
  console.log('====================================================');
  console.log('   RUNNING 12 ACCEPTANCE TESTS FOR PHASE 6D INTENT  ');
  console.log('====================================================\n');

  let passedCount = 0;

  const results = await runAcceptanceTests((idx, r) => {
    const statusMark = r.passed ? '✅ PASS' : '❌ FAIL';
    if (r.passed) passedCount++;
    console.log(`[Test ${r.test.id}/12] ${statusMark}: "${r.test.prompt}"`);
    console.log(`       Target: ${r.test.expectedDescription}`);
    console.log(`       Result: ${r.details}`);
    console.log(`       Reason: "${r.intent.reason}"\n`);
  });

  console.log('====================================================');
  console.log(`FINAL SCORE: ${passedCount} / ${ACCEPTANCE_TESTS.length} PASSED`);
  console.log('====================================================');
}

main().catch(console.error);
