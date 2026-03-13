/**
 * Playwright Test Suite — CareerPilot
 * Tests form detection, auto-fill, submission, and no-form handling.
 * Run: npx tsx src/lib/playwright-tests.ts
 */
import { chromium, Browser, Page } from 'playwright-core';

export interface TestResult {
  testName: string;
  url: string;
  passed: boolean;
  fieldsDetected: string[];
  logs: string[];
  error?: string;
  durationMs: number;
}

// Stable public pages for testing
const TEST_URL_WITH_FORM = 'https://httpbin.org/forms/post';
const TEST_URL_WITHOUT_FORM = 'https://example.com';

async function withBrowser(fn: (page: Page) => Promise<void>): Promise<void> {
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

// ── TEST 1 — Form detection ────────────────────────────────────────────────
export async function testFormDetection(): Promise<TestResult> {
  const start = Date.now();
  const logs: string[] = [];
  const result: TestResult = {
    testName: 'Détection de formulaire',
    url: TEST_URL_WITH_FORM,
    passed: false,
    fieldsDetected: [],
    logs,
    durationMs: 0,
  };

  try {
    await withBrowser(async (page) => {
      logs.push(`Navigation vers ${TEST_URL_WITH_FORM}`);
      await page.goto(TEST_URL_WITH_FORM, { waitUntil: 'domcontentloaded', timeout: 20000 });

      const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
      const fieldNames = await Promise.all(
        inputs.map(async (el) => {
          const name = await el.getAttribute('name');
          const type = await el.getAttribute('type');
          return `${type ?? 'text'}:${name ?? 'unnamed'}`;
        }),
      );

      result.fieldsDetected = fieldNames;
      logs.push(`Champs détectés : ${fieldNames.join(', ')}`);
      result.passed = fieldNames.length > 0;
      logs.push(result.passed ? '✅ Formulaire détecté' : '❌ Aucun formulaire');
    });
  } catch (e: unknown) {
    result.error = e instanceof Error ? e.message : String(e);
    logs.push(`❌ Erreur : ${result.error}`);
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ── TEST 2 — Auto-fill ────────────────────────────────────────────────────
export async function testAutoFill(): Promise<TestResult> {
  const start = Date.now();
  const logs: string[] = [];
  const result: TestResult = {
    testName: 'Remplissage automatique',
    url: TEST_URL_WITH_FORM,
    passed: false,
    fieldsDetected: [],
    logs,
    durationMs: 0,
  };

  const testData: Record<string, string> = {
    custname: 'Jean Dupont',
    custemail: 'jean.dupont@test.com',
    custtel: '0600000000',
    comments: 'Lettre de motivation test — CareerPilot',
  };

  try {
    await withBrowser(async (page) => {
      logs.push(`Navigation vers ${TEST_URL_WITH_FORM}`);
      await page.goto(TEST_URL_WITH_FORM, { waitUntil: 'domcontentloaded', timeout: 20000 });

      for (const [fieldName, value] of Object.entries(testData)) {
        const selector = `[name="${fieldName}"]`;
        const el = await page.$(selector);
        if (el) {
          await el.fill(value);
          logs.push(`✅ Champ "${fieldName}" rempli`);
          result.fieldsDetected.push(fieldName);
        } else {
          logs.push(`⚠️  Champ "${fieldName}" non trouvé`);
        }
      }

      result.passed = result.fieldsDetected.length > 0;
    });
  } catch (e: unknown) {
    result.error = e instanceof Error ? e.message : String(e);
    logs.push(`❌ Erreur : ${result.error}`);
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ── TEST 3 — Form submission ──────────────────────────────────────────────
export async function testFormSubmit(): Promise<TestResult> {
  const start = Date.now();
  const logs: string[] = [];
  const result: TestResult = {
    testName: 'Soumission de formulaire',
    url: TEST_URL_WITH_FORM,
    passed: false,
    fieldsDetected: [],
    logs,
    durationMs: 0,
  };

  try {
    await withBrowser(async (page) => {
      logs.push(`Navigation vers ${TEST_URL_WITH_FORM}`);
      await page.goto(TEST_URL_WITH_FORM, { waitUntil: 'domcontentloaded', timeout: 20000 });

      await page.fill('[name="custname"]', 'Test CareerPilot');
      await page.fill('[name="custemail"]', 'test@careerpilot.fr');
      logs.push('Formulaire rempli');

      const submitBtn = await page.$('[type="submit"], button[type="submit"], input[type="submit"], button:not([type="button"])');
      if (!submitBtn) {
        logs.push('❌ Bouton submit non trouvé');
        return;
      }

      const urlBefore = page.url();
      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 12000 }).catch(() => null),
        submitBtn.click(),
      ]);

      const finalUrl = page.url();
      logs.push(`URL avant soumission : ${urlBefore}`);
      logs.push(`URL après soumission : ${finalUrl}`);

      result.passed = finalUrl !== urlBefore || response !== null;
      logs.push(result.passed ? '✅ Soumission réussie (navigation détectée)' : '❌ Aucune navigation après soumission');
    });
  } catch (e: unknown) {
    result.error = e instanceof Error ? e.message : String(e);
    logs.push(`❌ Erreur : ${result.error}`);
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ── TEST 4 — No-form page handling ────────────────────────────────────────
export async function testNoFormHandling(): Promise<TestResult> {
  const start = Date.now();
  const logs: string[] = [];
  const result: TestResult = {
    testName: 'Gestion page sans formulaire',
    url: TEST_URL_WITHOUT_FORM,
    passed: false,
    fieldsDetected: [],
    logs,
    durationMs: 0,
  };

  try {
    await withBrowser(async (page) => {
      logs.push(`Navigation vers ${TEST_URL_WITHOUT_FORM}`);
      await page.goto(TEST_URL_WITHOUT_FORM, { waitUntil: 'domcontentloaded', timeout: 20000 });

      const inputs = await page.$$('input:not([type="hidden"]), textarea');
      logs.push(`Champs trouvés : ${inputs.length}`);

      if (inputs.length === 0) {
        result.passed = true;
        logs.push('✅ Aucun formulaire → fallback correct (candidature manuelle requise)');
      } else {
        result.passed = false;
        logs.push(`❌ ${inputs.length} champ(s) trouvé(s) sur une page sans formulaire attendu`);
      }
    });
  } catch (e: unknown) {
    result.error = e instanceof Error ? e.message : String(e);
    logs.push(`❌ Erreur : ${result.error}`);
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ── RUNNER ─────────────────────────────────────────────────────────────────
export async function runAllPlaywrightTests(): Promise<TestResult[]> {
  const tests = [testFormDetection, testAutoFill, testFormSubmit, testNoFormHandling];
  const results: TestResult[] = [];

  console.log('\n═══════════════════════════════════════════');
  console.log('  SUITE DE TESTS PLAYWRIGHT — CareerPilot  ');
  console.log('═══════════════════════════════════════════\n');

  for (const test of tests) {
    process.stdout.write(`  Exécution : ${test.name}... `);
    const result = await test();
    results.push(result);
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', `(${result.durationMs}ms)`);
    for (const log of result.logs) {
      console.log(`    ${log}`);
    }
    if (result.error) {
      console.log(`    ⚠  Erreur : ${result.error}`);
    }
    console.log('');
  }

  const passed = results.filter((r) => r.passed).length;
  console.log('═══════════════════════════════════════════');
  console.log(`  RÉSULTAT : ${passed}/${results.length} tests passés`);
  console.log('═══════════════════════════════════════════\n');

  return results;
}

// Allow direct execution: npx tsx src/lib/playwright-tests.ts
const isMain = process.argv[1]?.endsWith('playwright-tests.ts') ||
               process.argv[1]?.endsWith('playwright-tests.js');
if (isMain) {
  runAllPlaywrightTests().then((results) => {
    const failed = results.filter((r) => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}
