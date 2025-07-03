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

// テスト用の一時ディレクトリ
const testDir = path.join(__dirname, 'temp');
const testPackageJson = path.join(testDir, 'package.json');
const testOutputCsv = path.join(testDir, 'output.csv');

describe('pkg-to-csv CLI tool', () => {
  beforeEach(() => {
    // テスト用ディレクトリを作成
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('基本的なpackage.jsonの処理', async () => {
    // テスト用のpackage.jsonを作成
    const testPackage = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21',
        'express': '^4.18.0'
      },
      devDependencies: {
        'jest': '^29.0.0',
        'typescript': '^5.0.0'
      }
    };

    fs.writeFileSync(testPackageJson, JSON.stringify(testPackage, null, 2));

    // CLIコマンドを実行
    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testPackageJson} -o ${testOutputCsv}`,
      { cwd: path.join(__dirname, '..') }
    );

    // 出力ファイルが作成されたことを確認
    assert.ok(fs.existsSync(testOutputCsv), 'CSVファイルが作成されるべき');

    // CSVの内容を確認
    const csvContent = fs.readFileSync(testOutputCsv, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // ヘッダー行 + 4つの依存関係 = 5行
    assert.strictEqual(lines.length, 5, '正しい行数であるべき');
    
    // ヘッダーの確認
    const headers = lines[0].split(',');
    assert.ok(headers.includes('projectName'), 'projectNameヘッダーが含まれるべき');
    assert.ok(headers.includes('package'), 'packageヘッダーが含まれるべき');
    assert.ok(headers.includes('version'), 'versionヘッダーが含まれるべき');
    assert.ok(headers.includes('type'), 'typeヘッダーが含まれるべき');

    // 依存関係の確認
    assert.ok(csvContent.includes('lodash'), 'lodashが含まれるべき');
    assert.ok(csvContent.includes('express'), 'expressが含まれるべき');
    assert.ok(csvContent.includes('jest'), 'jestが含まれるべき');
    assert.ok(csvContent.includes('typescript'), 'typescriptが含まれるべき');
  });

  test('dependencies のみのオプション', async () => {
    const testPackage = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'jest': '^29.0.0'
      }
    };

    fs.writeFileSync(testPackageJson, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testPackageJson} -o ${testOutputCsv} --deps-only`,
      { cwd: path.join(__dirname, '..') }
    );

    const csvContent = fs.readFileSync(testOutputCsv, 'utf-8');
    
    // lodashは含まれるが、jestは含まれない
    assert.ok(csvContent.includes('lodash'), 'dependenciesのlodashが含まれるべき');
    assert.ok(!csvContent.includes('jest'), 'devDependenciesのjestは含まれないべき');
  });

  test('devDependencies のみのオプション', async () => {
    const testPackage = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21'
      },
      devDependencies: {
        'jest': '^29.0.0'
      }
    };

    fs.writeFileSync(testPackageJson, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testPackageJson} -o ${testOutputCsv} --dev-only`,
      { cwd: path.join(__dirname, '..') }
    );

    const csvContent = fs.readFileSync(testOutputCsv, 'utf-8');
    
    // jestは含まれるが、lodashは含まれない
    assert.ok(!csvContent.includes('lodash'), 'dependenciesのlodashは含まれないべき');
    assert.ok(csvContent.includes('jest'), 'devDependenciesのjestが含まれるべき');
  });

  test('存在しないファイルのエラーハンドリング', async () => {
    const nonExistentFile = path.join(testDir, 'nonexistent.json');
    
    try {
      await execAsync(
        `node dist/index.js -i ${nonExistentFile}`,
        { cwd: path.join(__dirname, '..') }
      );
      assert.fail('エラーが発生するべき');
    } catch (error) {
      assert.ok(error.code !== 0, 'ゼロ以外の終了コードであるべき');
    }
  });

  test('依存関係がないpackage.jsonの処理', async () => {
    const testPackage = {
      name: 'empty-package',
      version: '1.0.0'
    };

    fs.writeFileSync(testPackageJson, JSON.stringify(testPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testPackageJson} -o ${testOutputCsv}`,
      { cwd: path.join(__dirname, '..') }
    );

    // 依存関係がない場合、CSVファイルは作成されない
    assert.ok(!fs.existsSync(testOutputCsv), 'CSVファイルは作成されないべき');
    assert.ok(stdout.includes('No dependencies found'), '依存関係なしのメッセージが表示されるべき');
  });

  test('再帰的検索オプション', async () => {
    // サブディレクトリを作成
    const subDir = path.join(testDir, 'subproject');
    fs.mkdirSync(subDir, { recursive: true });

    // メインのpackage.json
    const mainPackage = {
      name: 'main-package',
      dependencies: { 'lodash': '^4.17.21' }
    };
    fs.writeFileSync(testPackageJson, JSON.stringify(mainPackage, null, 2));

    // サブディレクトリのpackage.json
    const subPackage = {
      name: 'sub-package',
      dependencies: { 'express': '^4.18.0' }
    };
    fs.writeFileSync(path.join(subDir, 'package.json'), JSON.stringify(subPackage, null, 2));

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testDir} -o ${testOutputCsv} --recursive`,
      { cwd: path.join(__dirname, '..') }
    );

    const csvContent = fs.readFileSync(testOutputCsv, 'utf-8');
    
    // 両方のプロジェクトの依存関係が含まれる
    assert.ok(csvContent.includes('lodash'), 'メインプロジェクトのlodashが含まれるべき');
    assert.ok(csvContent.includes('express'), 'サブプロジェクトのexpressが含まれるべき');
    assert.ok(csvContent.includes('main-package'), 'メインプロジェクト名が含まれるべき');
    assert.ok(csvContent.includes('sub-package'), 'サブプロジェクト名が含まれるべき');
  });
});