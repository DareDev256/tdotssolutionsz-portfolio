#!/usr/bin/env node
/**
 * Secret Scanner — Pre-commit security check
 *
 * Scans staged files (or all source files) for common credential patterns.
 * Exit code 1 if secrets detected, 0 if clean.
 *
 * Usage:
 *   node scripts/scan-secrets.js          # scan tracked source files
 *   node scripts/scan-secrets.js --staged  # scan only git-staged files
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// High-confidence secret patterns (low false-positive rate)
const SECRET_PATTERNS = [
  { name: 'AWS Access Key',        re: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Token',          re: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'GitHub OAuth',          re: /gho_[A-Za-z0-9]{36}/ },
  { name: 'GitHub Fine-Grained',   re: /github_pat_[A-Za-z0-9_]{82}/ },
  { name: 'OpenAI API Key',        re: /sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}/ },
  { name: 'Anthropic API Key',     re: /sk-ant-[A-Za-z0-9\-_]{80,}/ },
  { name: 'Vercel Token',          re: /verc_[A-Za-z0-9]{24}/ },
  { name: 'npm Token',             re: /npm_[A-Za-z0-9]{36}/ },
  { name: 'Discord Webhook',       re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/ },
  { name: 'Discord Bot Token',     re: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}/ },
  { name: 'Slack Token',           re: /xox[baprs]-[0-9a-zA-Z-]{10,}/ },
  { name: 'Slack Webhook',         re: /hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Private Key',           re: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: 'Generic Secret Assign', re: /(?:password|secret|token|apikey|api_key)\s*[:=]\s*['"][A-Za-z0-9+/=]{16,}['"]/i },
  { name: 'Bearer Token',          re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/  },
  { name: 'Database URI',          re: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+:[^\s'"]+@/ },
  { name: 'Supabase Key',          re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{30,}/ },
  { name: 'Stripe Secret Key',    re: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Restricted Key', re: /rk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Google API Key',       re: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'Google OAuth Secret',  re: /GOCSPX-[A-Za-z0-9\-_]{28}/ },
  { name: 'SendGrid API Key',     re: /SG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}/ },
  { name: 'Twilio Auth Token',    re: /SK[0-9a-fA-F]{32}/ },
  { name: 'Mailgun API Key',      re: /key-[0-9a-zA-Z]{32}/ },
  { name: 'Cloudflare API Token', re: /CF_(?:API_TOKEN|API_KEY)\s*[:=]\s*['"][A-Za-z0-9_-]{37,}['"]/i },
  { name: 'Firebase Server Key', re: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/ },
  { name: 'Azure Connection',    re: /AccountKey=[A-Za-z0-9+/=]{86,}/ },
  { name: 'Heroku API Key',      re: /HEROKU_API_KEY\s*[:=]\s*['"][0-9a-fA-F-]{36,}['"]/i },
  { name: 'DigitalOcean Token',  re: /dop_v1_[a-f0-9]{64}/ },
  { name: 'Datadog API Key',     re: /dd(?:api|app)_[A-Za-z0-9]{32,40}/ },
];

// Files to skip
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vercel', 'coverage']);
const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.yml', '.yaml', '.toml', '.md']);

function getFilesToScan() {
  const staged = process.argv.includes('--staged');
  if (staged) {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8' });
      return output.trim().split('\n').filter(Boolean).map(f => path.join(ROOT, f));
    } catch {
      return [];
    }
  }

  // Walk source files
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (SCAN_EXTENSIONS.has(path.extname(entry.name)) || entry.name.startsWith('.env')) {
        files.push(full);
      }
    }
  }
  walk(ROOT);
  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const findings = [];

  content.split('\n').forEach((line, idx) => {
    // Skip comments that document patterns (like this file itself)
    if (line.includes('re:') || line.includes('RegExp') || line.includes('test(')) return;

    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(line)) {
        findings.push({ file: path.relative(ROOT, filePath), line: idx + 1, pattern: name });
      }
    }
  });

  return findings;
}

// Main
const files = getFilesToScan();
let allFindings = [];

for (const file of files) {
  // Skip this scanner itself and test files
  if (file.endsWith('scan-secrets.js')) continue;
  if (file.includes('.test.') || file.includes('__tests__')) continue;

  try {
    const findings = scanFile(file);
    allFindings.push(...findings);
  } catch {
    // Skip unreadable files
  }
}

if (allFindings.length > 0) {
  console.error('\n🚨 Potential secrets detected:\n');
  for (const f of allFindings) {
    console.error(`  ${f.file}:${f.line} — ${f.pattern}`);
  }
  console.error(`\n❌ ${allFindings.length} finding(s). Remove secrets before committing.\n`);
  process.exit(1);
} else {
  console.log('✅ Secret scan clean — no credentials detected');
  process.exit(0);
}
