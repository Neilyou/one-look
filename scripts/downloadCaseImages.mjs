// 批量下载二阶魔方公式图片（使用 VisualCube API）
// 用法: node scripts/downloadCaseImages.mjs

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ===== 公式数据（从 caseLibrary.js 同步） =====
const CASE_LIBRARY = {
  EG: {
    'EG-1': [
      { name: 'PBL-0', alg: "y' R' U R' U' R' F R2 U' R' U' R U R' F' R2" },
      { name: 'Sune-0', alg: "U2 R U R' U F R U' R2 F' R" },
      { name: 'Anti-Sune-0', alg: "U R' F R2 U R' F' U' R U' R'" },
      { name: 'Pi-0', alg: "U2 F2 R U R' U2 R U R' U' F" },
      { name: 'U-0', alg: "R U R' U F R' F' R2 U' R' F R' F' R" },
      { name: 'L-0', alg: "F R U' R' U' R U R' F'" },
      { name: 'T-0', alg: "R U R' U' R' F R F'" },
      { name: 'H-0', alg: "R2 U2 R' U2 R2" },
    ],
    'EG-2': [
      { name: 'PBL-0', alg: "F R2 U2 R' U R U2 R2 F R F' R' F'" },
      { name: 'Sune-0', alg: "U' F U' R2 U' R' U2 R U' R2 F'" },
      { name: 'Anti-Sune-0', alg: "U2 R' U R U' R2 F R F' R U R' U' R' F2 R2" },
      { name: 'Pi-0', alg: "F U' R U2 R U' R' U R' F'" },
      { name: 'U-0', alg: "F U' R U2 R U' R' U2 R' U' F'" },
      { name: 'L-0', alg: "R' U' R' F' R U' R U' R' F R" },
      { name: 'T-0', alg: "F R F' R U R' U' R B2 R2" },
      { name: 'H-0', alg: "U R2 F U2 F2 R2 F' R2" },
    ],
    'LEG-1': [
      { name: 'PBL-0', alg: "R' U R' U' R' F R2 U' R' U' R U R' F' R2" },
      { name: 'Sune-0', alg: "U2 R' F U2 R2 F R'" },
      { name: 'Anti-Sune-0', alg: "U2 x' R U' R2 U R2 B2 R'" },
      { name: 'Pi-0', alg: "U' R F R' F' U R U' R2 F R F'" },
      { name: 'U-0', alg: "R U' R U R' U R U R2" },
      { name: 'L-0', alg: "U' R U2 F R' F' R U2 R U R2" },
      { name: 'T-0', alg: "U' R U2 R' U R U2 R' F R' F' R" },
      { name: 'H-0', alg: "R F2 R F' R' F U' F" },
    ],
    CLL: [
      { name: 'PBL-0', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
      { name: 'Sune-0', alg: "R U R' U R U2 R'" },
      { name: 'Anti-Sune-0', alg: "R' U' R U' R' U2 R" },
      { name: 'Pi-0', alg: "R U' R2 U R2 U R2 U' R" },
      { name: 'U-0', alg: "F R U R' U' F'" },
      { name: 'L-0', alg: "F R U' R' U' R U R' F'" },
      { name: 'T-0', alg: "R U R' U' R' F R F'" },
      { name: 'H-0', alg: "R2 U2 R' U2 R2" },
    ],
  },
  TCLL: {
    'TCLL+': [
      { name: 'Hammer-0', alg: "R' F R F' R' F R F'" },
      { name: 'Spaceship-0', alg: "U2 y' R' U' R U R' U' R" },
      { name: 'Stollery-0', alg: "R U R' U F' R U' R' F2" },
      { name: 'Pinwheel-0', alg: "y' F' R U R U2 R2 F' U R F'" },
      { name: 'Two-Face-0', alg: "U R U R' U' R2 U R2 U' R2" },
      { name: 'Turtle-0', alg: "R U' R' U R U' R'" },
      { name: 'Gun-0', alg: "R U' R' U2 R U2 R'" },
    ],
    'TCLL-': [
      { name: 'Hammer-0', alg: "U' F R' F' R F R' F' R" },
      { name: 'Spaceship-0', alg: "R U R' U' R U R'" },
      { name: 'Stollery-0', alg: "U2 F2 R U R' F U' R U' R'" },
      { name: 'Pinwheel-0', alg: "R2 U R' U R' U2 R U2 R' U2 R" },
      { name: 'Two-Face-0', alg: "R2 U R' U R U2 R' U2 R'" },
      { name: 'Turtle-0', alg: "U' y R' F R U' R' F R" },
      { name: 'Gun-0', alg: "U R U2 R' U2 R U R'" },
    ],
  },
  LS: {
    LS1: [{ name: 'LS1-0', alg: "F2 R2 U' R' F R' F2 R U' R'" }],
    LS2: [{ name: 'LS2-0', alg: "U F2 U R U R' U2 F2 R U' R'" }],
    LS3: [{ name: 'LS3-0', alg: "U2 y' R U' R2 U' R F R' F' R" }],
    LS4: [{ name: 'LS4-0', alg: "F R U2 R' U R U' R' F" }],
    LS5: [{ name: 'LS5-0', alg: "R' F R2 U2 R' U R U' R' F" }],
    LS6: [{ name: 'LS6-0', alg: "U2 y' R U' R2 U' R F R' F' R" }],
    LS7: [{ name: 'LS7-0', alg: "R' U R U' R2 U' F R F' R" }],
    LS8: [{ name: 'LS8-0', alg: "U' R U R U' R' F R' F' R U R'" }],
    LS9: [{ name: 'LS9-0', alg: "U2 y' R2 U R' U' R U' R2 F R F'" }],
  },
};

// ===== 配置 =====
const BASE_URL = 'https://visualcube.api.cubing.net/visualcube.php';
const IMAGE_SIZE = 200;
const OUTPUT_DIR = join(__dirname, '..', 'public', 'case-images');

// ===== 工具函数 =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(filePath);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

function buildUrl(alg) {
  // case 参数：显示该公式能解决的 case（内部会用逆公式）
  const params = new URLSearchParams({
    fmt: 'png',
    pzl: '2',
    view: 'plan',
    stage: 'cll',
    size: String(IMAGE_SIZE),
    case: alg.trim(),
  });
  return `${BASE_URL}?${params.toString()}`;
}

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

// ===== 主流程 =====
async function main() {
  console.log('=== 二阶魔方公式图片批量下载 ===\n');

  let total = 0;
  let downloaded = 0;
  let failed = [];

  for (const [group, methods] of Object.entries(CASE_LIBRARY)) {
    for (const [method, cases] of Object.entries(methods)) {
      for (const c of cases) {
        total++;
        const fileName = sanitizeFileName(c.name) + '.png';
        const filePath = join(OUTPUT_DIR, group, method, fileName);
        const url = buildUrl(c.alg);

        if (existsSync(filePath)) {
          console.log(`[跳过] ${group}/${method}/${c.name} (已存在)`);
          downloaded++;
          continue;
        }

        try {
          process.stdout.write(`[下载] ${group}/${method}/${c.name} ... `);
          await downloadFile(url, filePath);
          console.log('OK');
          downloaded++;
        } catch (err) {
          console.log(`FAIL: ${err.message}`);
          failed.push(`${group}/${method}/${c.name}`);
        }

        // 限速，避免请求过快
        await sleep(200);
      }
    }
  }

  console.log(`\n=== 完成 ===`);
  console.log(`总计: ${total}  成功: ${downloaded}  失败: ${failed.length}`);
  if (failed.length > 0) {
    console.log('失败列表:');
    failed.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);
