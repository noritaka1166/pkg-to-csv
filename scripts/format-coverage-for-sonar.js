#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// プロジェクトルートディレクトリ
const projectRoot = path.resolve(__dirname, '..');
const coverageDir = path.join(projectRoot, 'coverage');
const lcovFile = path.join(coverageDir, 'lcov.info');
const sonarLcovFile = path.join(coverageDir, 'lcov-sonar.info');

function formatLcovForSonar() {
  try {
    // カバレッジディレクトリが存在しない場合は作成
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }

    // lcov.infoファイルが存在するかチェック
    if (!fs.existsSync(lcovFile)) {
      console.log('lcov.info file not found. Running coverage first...');
      return;
    }

    // lcov.infoファイルを読み取り
    let lcovContent = fs.readFileSync(lcovFile, 'utf-8');

    // SonarQube用にパスを調整
    // distディレクトリのパスをsrcディレクトリのパスに変換
    lcovContent = lcovContent.replace(/SF:.*?dist\//g, 'SF:src/');
    
    // TypeScriptファイルの拡張子に変換
    lcovContent = lcovContent.replace(/\.js$/gm, '.ts');
    lcovContent = lcovContent.replace(/\.js:/gm, '.ts:');

    // 絶対パスを相対パスに変換
    const projectRootRegex = new RegExp(projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    lcovContent = lcovContent.replace(projectRootRegex, '.');

    // SonarQube用のlcovファイルを出力
    fs.writeFileSync(sonarLcovFile, lcovContent);
    
    console.log(`✅ SonarQube用のカバレッジファイルを生成しました: ${sonarLcovFile}`);
    
    // カバレッジサマリーを表示
    displayCoverageSummary(lcovContent);
    
  } catch (error) {
    console.error('❌ カバレッジファイルの変換中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

function displayCoverageSummary(lcovContent) {
  const lines = lcovContent.split('\n');
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;

  for (const line of lines) {
    if (line.startsWith('LF:')) {
      totalLines += parseInt(line.split(':')[1]);
    } else if (line.startsWith('LH:')) {
      coveredLines += parseInt(line.split(':')[1]);
    } else if (line.startsWith('FNF:')) {
      totalFunctions += parseInt(line.split(':')[1]);
    } else if (line.startsWith('FNH:')) {
      coveredFunctions += parseInt(line.split(':')[1]);
    } else if (line.startsWith('BRF:')) {
      totalBranches += parseInt(line.split(':')[1]);
    } else if (line.startsWith('BRH:')) {
      coveredBranches += parseInt(line.split(':')[1]);
    }
  }

  console.log('\n📊 カバレッジサマリー:');
  console.log('─'.repeat(40));
  
  if (totalLines > 0) {
    const linesCoverage = ((coveredLines / totalLines) * 100).toFixed(2);
    console.log(`📝 行カバレッジ: ${coveredLines}/${totalLines} (${linesCoverage}%)`);
  }
  
  if (totalFunctions > 0) {
    const functionsCoverage = ((coveredFunctions / totalFunctions) * 100).toFixed(2);
    console.log(`🔧 関数カバレッジ: ${coveredFunctions}/${totalFunctions} (${functionsCoverage}%)`);
  }
  
  if (totalBranches > 0) {
    const branchesCoverage = ((coveredBranches / totalBranches) * 100).toFixed(2);
    console.log(`🌿 分岐カバレッジ: ${coveredBranches}/${totalBranches} (${branchesCoverage}%)`);
  }
  
  console.log('─'.repeat(40));
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  formatLcovForSonar();
}

export { formatLcovForSonar };