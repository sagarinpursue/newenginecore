// Additional Dependencies
// npm install -g snyk
// brew install semgrep  (pip install semgrep)

// security-scan.mjs
import { execSync } from 'child_process';
import { writeFile } from 'fs/promises';

let report = [];

async function runTool(label, command) {
    report.push(`\n=== ${label} ===\n`);
    try {
        const output = execSync(command, { stdio: 'pipe' }).toString();
        report.push(output);
    } catch (err) {
        const output = err.stdout?.toString() || err.message;
        report.push(output);
    }
}

await runTool('ESLint Security Check (db-api-invoker)', 'npx eslint lambda-functions/db-api-invoker');
await runTool('ESLint Security Check (jwt-token-authorizer)', 'npx eslint lambda-functions/jwt-token-authorizer');
await runTool(
    'ESLint Security Check (kpi-cron-reminder-upload-report)',
    'npx eslint lambda-functions/kpi-cron-reminder-upload-report'
);
await writeFile('eslint-security-check-report.txt', report.join('\n'), 'utf8');
report = [];

await runTool('Snyk Vulnerability Scan (db-api-invoker)', 'snyk test lambda-functions/db-api-invoker');
await runTool('Snyk Vulnerability Scan (jwt-token-authorizer)', 'snyk test lambda-functions/jwt-token-authorizer');
await runTool(
    'Snyk Vulnerability Scan (kpi-cron-reminder-upload-report)',
    'snyk test lambda-functions/kpi-cron-reminder-upload-report'
);
await writeFile('snyk-vulnerability-scan-report.txt', report.join('\n'), 'utf8');
report = [];

await runTool(
    'Semgrep Static Analysis (db-api-invoker)',
    "semgrep scan --config auto --exclude 'lambda-functions/**/local-run-events/**' --exclude 'lambda-functions/**/deployment-config.json' --exclude 'lambda-functions/deploy.js' --exclude 'lambda-functions/deploy-all.js' --exclude 'lambda-functions/index.js' --exclude 'lambda-functions/local-run.js' lambda-functions/db-api-invoker"
);
await runTool(
    'Semgrep Static Analysis (jwt-token-authorizer)',
    "semgrep scan --config auto --exclude 'lambda-functions/**/local-run-events/**' --exclude 'lambda-functions/**/deployment-config.json' --exclude 'lambda-functions/deploy.js' --exclude 'lambda-functions/deploy-all.js' --exclude 'lambda-functions/index.js' --exclude 'lambda-functions/local-run.js' lambda-functions/jwt-token-authorizer"
);
await runTool(
    'Semgrep Static Analysis (kpi-cron-reminder-upload-report)',
    "semgrep scan --config auto --exclude 'lambda-functions/**/local-run-events/**' --exclude 'lambda-functions/**/deployment-config.json' --exclude 'lambda-functions/deploy.js' --exclude 'lambda-functions/deploy-all.js' --exclude 'lambda-functions/index.js' --exclude 'lambda-functions/local-run.js' lambda-functions/kpi-cron-reminder-upload-report"
);
await writeFile('semgrep-static-analysis-security-report.txt', report.join('\n'), 'utf8');
report = [];
