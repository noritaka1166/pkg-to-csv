import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, 'temp-npm');

describe('npm レジストリ統合テスト', () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('--latest オプションで最新バージョン情報を取得', async () => {
    const testPackage = {
      name: 'npm-test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.20' // 古いバージョンを指定
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --latest`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 30000 // npmレジストリへのアクセスに時間がかかる可能性
      }
    );

    assert.ok(fs.existsSync(outputFile), 'CSVファイルが作成されるべき');
    
    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // ヘッダーを確認
    const headers = lines[0].split(',');
    assert.ok(headers.includes('latestVersion'), 'latestVersionヘッダーが含まれるべき');
    
    // データ行を確認
    const dataLine = lines[1];
    assert.ok(dataLine.includes('lodash'), 'lodashが含まれるべき');
    
    // 最新バージョンが取得されていることを確認（空でない）
    const columns = dataLine.split(',');
    const latestVersionIndex = headers.indexOf('latestVersion');
    const latestVersion = columns[latestVersionIndex];
    assert.ok(latestVersion && latestVersion.length > 0, '最新バージョンが取得されるべき');
  });

  test('--license オプションでライセンス情報を取得', async () => {
    const testPackage = {
      name: 'license-test-package',
      version: '1.0.0',
      dependencies: {
        'express': '^4.18.0'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --license`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 30000
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const headers = lines[0].split(',');
    assert.ok(headers.includes('license'), 'licenseヘッダーが含まれるべき');
    
    const dataLine = lines[1];
    const columns = dataLine.split(',');
    const licenseIndex = headers.indexOf('license');
    const license = columns[licenseIndex];
    
    // expressのライセンスはMITであることが期待される
    assert.ok(license && license.length > 0, 'ライセンス情報が取得されるべき');
  });

  test('--description オプションで説明を取得', async () => {
    const testPackage = {
      name: 'description-test-package',
      version: '1.0.0',
      dependencies: {
        'commander': '^9.0.0'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --description`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 30000
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const headers = lines[0].split(',');
    assert.ok(headers.includes('description'), 'descriptionヘッダーが含まれるべき');
    
    const dataLine = lines[1];
    const columns = dataLine.split(',');
    const descriptionIndex = headers.indexOf('description');
    const description = columns[descriptionIndex];
    
    assert.ok(description && description.length > 0, '説明が取得されるべき');
  });

  test('--npm-link オプションでnpmリンクを取得', async () => {
    const testPackage = {
      name: 'npm-link-test-package',
      version: '1.0.0',
      dependencies: {
        'typescript': '^5.0.0'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --npm-link`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 30000
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const headers = lines[0].split(',');
    assert.ok(headers.includes('npmLink'), 'npmLinkヘッダーが含まれるべき');
    
    const dataLine = lines[1];
    const columns = dataLine.split(',');
    const npmLinkIndex = headers.indexOf('npmLink');
    const npmLink = columns[npmLinkIndex];
    
    assert.ok(npmLink.includes('https://www.npmjs.com/package/typescript'), 
      'typescriptのnpmリンクが含まれるべき');
  });

  test('全てのnpmオプションを同時に使用', async () => {
    const testPackage = {
      name: 'all-options-test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.20'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --latest --license --description --npm-link`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 45000 // より長いタイムアウト
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const headers = lines[0].split(',');
    assert.ok(headers.includes('latestVersion'), 'latestVersionヘッダーが含まれるべき');
    assert.ok(headers.includes('license'), 'licenseヘッダーが含まれるべき');
    assert.ok(headers.includes('description'), 'descriptionヘッダーが含まれるべき');
    assert.ok(headers.includes('npmLink'), 'npmLinkヘッダーが含まれるべき');
    
    const dataLine = lines[1];
    const columns = dataLine.split(',');
    
    // 各列に値が入っていることを確認
    const latestVersionIndex = headers.indexOf('latestVersion');
    const licenseIndex = headers.indexOf('license');
    const descriptionIndex = headers.indexOf('description');
    const npmLinkIndex = headers.indexOf('npmLink');
    
    assert.ok(columns[latestVersionIndex] && columns[latestVersionIndex].length > 0, 
      '最新バージョンが取得されるべき');
    assert.ok(columns[licenseIndex] && columns[licenseIndex].length > 0, 
      'ライセンスが取得されるべき');
    assert.ok(columns[descriptionIndex] && columns[descriptionIndex].length > 0, 
      '説明が取得されるべき');
    assert.ok(columns[npmLinkIndex] && columns[npmLinkIndex].includes('npmjs.com'), 
      'npmリンクが取得されるべき');
  });

  test('存在しないパッケージのエラーハンドリング', async () => {
    const testPackage = {
      name: 'nonexistent-package-test',
      version: '1.0.0',
      dependencies: {
        'this-package-definitely-does-not-exist-12345': '^1.0.0'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    // 存在しないパッケージでもエラーにならず、空の値で処理されることを確認
    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --latest --license`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 30000
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // CSVファイルは作成されるが、npm情報は空になる
    assert.strictEqual(lines.length, 2, 'ヘッダー + データ行があるべき');
    
    const dataLine = lines[1];
    assert.ok(dataLine.includes('this-package-definitely-does-not-exist-12345'), 
      'パッケージ名は含まれるべき');
  });

  test('ネットワークタイムアウトの処理', async () => {
    const testPackage = {
      name: 'timeout-test-package',
      version: '1.0.0',
      dependencies: {
        'express': '^4.18.0',
        'lodash': '^4.17.21',
        'typescript': '^5.0.0'
      }
    };

    const testFile = path.join(testDir, 'package.json');
    const outputFile = path.join(testDir, 'output.csv');
    
    fs.writeFileSync(testFile, JSON.stringify(testPackage, null, 2));

    // 複数のパッケージでも適切に処理されることを確認
    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testFile} -o ${outputFile} --latest`,
      { 
        cwd: path.join(__dirname, '..'),
        timeout: 60000 // 1分のタイムアウト
      }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // ヘッダー + 3つの依存関係 = 4行
    assert.strictEqual(lines.length, 4, '正しい行数であるべき');
    
    assert.ok(csvContent.includes('express'), 'expressが含まれるべき');
    assert.ok(csvContent.includes('lodash'), 'lodashが含まれるべき');
    assert.ok(csvContent.includes('typescript'), 'typescriptが含まれるべき');
  });
});