import { TEST_PROMPTS } from './prompts.js';

export async function runEvaluation(runPipeline) {
  const results = [];

  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const prompt = TEST_PROMPTS[i];
    const start = Date.now();
    const result = {
      index: i + 1,
      prompt,
      success: false,
      retries: 0,
      errors: [],
      warnings: [],
      latency_ms: 0,
      failure_reason: null
    };

    try {
      const output = await runPipeline(prompt);
      result.success = output.validation_passed;
      result.retries = output.repaired ? 1 : 0;
      result.errors = output.validation?.errors || [];
      result.warnings = output.validation?.warnings || [];
      result.table_count = output.schema?.db?.tables?.length || 0;
      result.endpoint_count = output.schema?.api?.endpoints?.length || 0;
      result.page_count = output.schema?.ui?.pages?.length || 0;
    } catch (e) {
      result.failure_reason = e.message;
    }

    result.latency_ms = Date.now() - start;
    results.push(result);
    console.log(`[${i + 1}/20] ${prompt.slice(0, 50)}...`);
    console.log(`  → ${result.success ? '✅ PASS' : '❌ FAIL'} | ${result.latency_ms}ms | retries: ${result.retries}`);
  }

  const passed = results.filter(r => r.success).length;
  const avgLatency = results.reduce((s, r) => s + r.latency_ms, 0) / results.length;
  const avgRetries = results.reduce((s, r) => s + r.retries, 0) / results.length;

  const summary = {
    total: results.length,
    passed,
    failed: results.length - passed,
    success_rate: `${((passed / results.length) * 100).toFixed(0)}%`,
    avg_latency_seconds: (avgLatency / 1000).toFixed(1),
    avg_retries: avgRetries.toFixed(2),
    results
  };

  console.log('\n=== EVALUATION SUMMARY ===');
  console.log(`Success Rate: ${summary.success_rate}`);
  console.log(`Avg Latency: ${summary.avg_latency_seconds}s`);
  console.log(`Avg Retries: ${summary.avg_retries}`);

  return summary;
}