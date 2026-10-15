import { ACCEPTANCE_TESTS } from './intentTestSuite';
import { parseMusicIntent } from './geminiIntentService';

async function testAll() {
  console.log('Running 12 NLP Acceptance Tests...');
  let passed = 0;
  for (const t of ACCEPTANCE_TESTS) {
    const res = await parseMusicIntent(t.prompt);
    const v = t.validate(res);
    if (v.passed) {
      passed++;
      console.log(`[PASS] #${t.id} "${t.prompt}" -> ${v.details} (via ${res.modelUsed})`);
    } else {
      console.log(`[FAIL] #${t.id} "${t.prompt}" -> ${v.details}`);
    }
  }
  console.log(`\nACCEPTANCE TESTS SUMMARY: ${passed} / ${ACCEPTANCE_TESTS.length} PASSED`);
  process.exit(passed === ACCEPTANCE_TESTS.length ? 0 : 1);
}

testAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
