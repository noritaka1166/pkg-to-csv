#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { program } = require('commander');

program
  .option('-i, --input <path>', 'Path to package.json', 'package.json')
  .option('-o, --output [path]', 'Output CSV file (default: <repo>_package.csv)')
  .option('--latest', 'Include latest version info from npm')
  .option('--license', 'Include license info from npm')
  .parse(process.argv);

const options = program.opts();

const pkgPath = path.resolve(process.cwd(), options.input);
if (!fs.existsSync(pkgPath)) {
  console.error(`Error: Cannot find ${pkgPath}`);
  process.exit(1);
}

// 🔽 デフォルト出力ファイル名を設定
let outputPath = null;
if (options.output !== undefined) {
  if (typeof options.output === 'string') {
    outputPath = path.resolve(process.cwd(), options.output);
  } else if (options.output === true) {
    const repoName = path.basename(path.dirname(pkgPath));
    outputPath = path.resolve(process.cwd(), `${repoName}_package.csv`);
  }
}


const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const allDeps = [];

function collectDeps(deps, type) {
  if (!deps) return;
  for (const [name, version] of Object.entries(deps)) {
    allDeps.push({ name, version, type });
  }
}

collectDeps(pkgJson.dependencies, 'dependencies');
collectDeps(pkgJson.devDependencies, 'devDependencies');

async function getPackageMeta(name) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const latestVersion = data['dist-tags']?.latest || '';
    const license = data.license || (data.versions?.[latestVersion]?.license || '');
    return { latestVersion, license };
  } catch {
    return { latestVersion: '', license: '' };
  }
}

(async () => {
  const result = [];

  for (const dep of allDeps) {
    let latestVersion = '';
    let license = '';
    if (options.latest || options.license) {
      const meta = await getPackageMeta(dep.name);
      if (options.latest) latestVersion = meta.latestVersion;
      if (options.license) license = meta.license;
    }

    result.push({
      package: dep.name,
      version: dep.version,
      type: dep.type,
      ...(options.latest ? { latestVersion } : {}),
      ...(options.license ? { license } : {}),
    });
  }

  if (outputPath) {
    const headers = Object.keys(result[0]);
    const rows = [headers.join(',')];

    for (const row of result) {
      rows.push(headers.map(h => row[h] ?? '').join(','));
    }

    fs.writeFileSync(outputPath, rows.join('\n'));
    console.log(`CSV written to ${outputPath}`);
  } else {
    console.table(result);
  }
})();
