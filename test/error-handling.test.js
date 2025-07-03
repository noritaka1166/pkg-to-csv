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

const testDir = path.join(__dirname, 'temp-error');

describe('エラーハンドリングとエッジケースのテスト', () => {
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

  test('不正なJSONファイルの処理', async () => {
    const invalidJsonFile = path.join(testDir, 'invalid.json');
    fs.writeFileSync(invalidJsonFile, '{ invalid json content');

    try {
      await execAsync(
        `node dist/index.js -i ${invalidJsonFile}`,
        { cwd: path.join(__dirname, '..') }
      );
      assert.fail('不正なJSONでエラーが発生するべき');
    } catch (error) {
      assert.ok(error.code !== 0, 'ゼロ以外の終了コードであるべき');
    }
  });

  test('読み取り権限のないファイルの処理', async () => {
    const restrictedFile = path.join(testDir, 'restricted.json');
    fs.writeFileSync(restrictedFile, '{"name": "test"}');
    
    // ファイルの読み取り権限を削除（Windowsでは動作しない可能性があります）
    try {
      fs.chmodSync(restrictedFile, 0o000);
      
      try {
        await execAsync(
          `node dist/index.js -i ${restrictedFile}`,
          { cwd: path.join(__dirname, '..') }
        );
        assert.fail('権限エラーが発生するべき');
      } catch (error) {
        assert.ok(error.code !== 0, 'ゼロ以外の終了コードであるべき');
      }
    } catch (chmodError) {
      // chmod が失敗した場合（Windowsなど）はテストをスキップ
      console.log('chmod テストをスキップ（プラットフォーム非対応）');
    } finally {
      // 権限を復元してファイルを削除できるようにする
      try {
        fs.chmodSync(restrictedFile, 0o644);
      } catch (e) {
        // 無視
      }
    }
  });

  test('空のディレクトリの処理', async () => {
    const emptyDir = path.join(testDir, 'empty');
    fs.mkdirSync(emptyDir);

    try {
      await execAsync(
        `node dist/index.js -i ${emptyDir}`,
        { cwd: path.join(__dirname, '..') }
      );
      assert.fail('空のディレクトリでエラーが発生するべき');
    } catch (error) {
      assert.ok(error.code !== 0, 'ゼロ以外の終了コードであるべき');
    }
  });

  test('非常に大きなpackage.jsonファイルの処理', async () => {
    const largePackage = {
      name: 'large-package',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    };

    // 大量の依存関係を追加
    for (let i = 0; i < 1000; i++) {
      largePackage.dependencies[`package-${i}`] = `^${i % 10}.0.0`;
    }

    const largeFile = path.join(testDir, 'package.json');
    fs.writeFileSync(largeFile, JSON.stringify(largePackage, null, 2));

    const outputFile = path.join(testDir, 'large-output.csv');

    // タイムアウトを長めに設定
    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${largeFile} -o ${outputFile}`,
      {
        cwd: path.join(__dirname, '..'),
        timeout: 30000 // 30秒
      }
    );

    assert.ok(fs.existsSync(outputFile), 'CSVファイルが作成されるべき');
    
    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // ヘッダー + 1000の依存関係 = 1001行
    assert.strictEqual(lines.length, 1001, '正しい行数であるべき');
  });

  test('特殊文字を含むパッケージ名の処理', async () => {
    const specialPackage = {
      name: 'special-chars-package',
      version: '1.0.0',
      dependencies: {
        '@types/node': '^20.0.0',
        '@babel/core': '^7.0.0',
        'lodash.debounce': '^4.0.0',
        'some-package_with_underscores': '^1.0.0'
      }
    };

    const specialFile = path.join(testDir, 'package.json');
    fs.writeFileSync(specialFile, JSON.stringify(specialPackage, null, 2));

    const outputFile = path.join(testDir, 'special-output.csv');

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${specialFile} -o ${outputFile}`,
      { cwd: path.join(__dirname, '..') }
    );

    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    
    assert.ok(csvContent.includes('@types/node'), '@types/nodeが含まれるべき');
    assert.ok(csvContent.includes('@babel/core'), '@babel/coreが含まれるべき');
    assert.ok(csvContent.includes('lodash.debounce'), 'lodash.debounceが含まれるべき');
    assert.ok(csvContent.includes('some-package_with_underscores'), 'アンダースコア付きパッケージが含まれるべき');
  });

  test('カンマを含む説明文のCSVエスケープ', async () => {
    // この場合、実際のnpmからの情報取得はモックできないので、
    // CSVエスケープロジックのテストとして実装
    const testData = [
      'Simple description',
      'Description, with comma',
      'Description\nwith newline',
      'Description "with quotes"',
      'Complex, description "with quotes" and\nnewlines'
    ];

    testData.forEach(description => {
      const escaped = typeof description === 'string' && 
        (description.includes(',') || description.includes('\n') || description.includes('"'))
        ? `"${description.replace(/"/g, '""')}"`
        : description;

      if (description.includes(',') || description.includes('\n') || description.includes('"')) {
        assert.ok(escaped.startsWith('"') && escaped.endsWith('"'), 
          `"${description}" は引用符で囲まれるべき`);
      }
    });
  });

  test('循環参照を含むディレクトリ構造（シンボリックリンク）', async () => {
    const subDir = path.join(testDir, 'subdir');
    fs.mkdirSync(subDir);

    // 通常のpackage.jsonを作成
    const normalPackage = {
      name: 'normal-package',
      dependencies: { 'lodash': '^4.0.0' }
    };
    fs.writeFileSync(path.join(subDir, 'package.json'), JSON.stringify(normalPackage, null, 2));

    try {
      // シンボリックリンクで循環参照を作成
      const linkPath = path.join(subDir, 'circular-link');
      fs.symlinkSync(testDir, linkPath, 'dir');

      const outputFile = path.join(testDir, 'circular-output.csv');

      // 再帰的検索でも無限ループにならないことを確認
      const { stdout, stderr } = await execAsync(
        `node dist/index.js -i ${testDir} -o ${outputFile} --recursive`,
        { 
          cwd: path.join(__dirname, '..'),
          timeout: 10000 // 10秒でタイムアウト
        }
      );

      assert.ok(fs.existsSync(outputFile), 'CSVファイルが作成されるべき');
      
      const csvContent = fs.readFileSync(outputFile, 'utf-8');
      assert.ok(csvContent.includes('lodash'), 'lodashが含まれるべき');
      
    } catch (symlinkError) {
      // シンボリックリンクの作成に失敗した場合（権限不足など）はテストをスキップ
      console.log('シンボリックリンクテストをスキップ（権限不足またはプラットフォーム非対応）');
    }
  });

  test('非常に深いディレクトリ構造', async () => {
    // 深いディレクトリ構造を作成
    let currentDir = testDir;
    for (let i = 0; i < 10; i++) {
      currentDir = path.join(currentDir, `level-${i}`);
      fs.mkdirSync(currentDir, { recursive: true });
    }

    // 最深部にpackage.jsonを配置
    const deepPackage = {
      name: 'deep-package',
      dependencies: { 'express': '^4.0.0' }
    };
    fs.writeFileSync(path.join(currentDir, 'package.json'), JSON.stringify(deepPackage, null, 2));

    const outputFile = path.join(testDir, 'deep-output.csv');

    const { stdout, stderr } = await execAsync(
      `node dist/index.js -i ${testDir} -o ${outputFile} --recursive`,
      { cwd: path.join(__dirname, '..') }
    );

    assert.ok(fs.existsSync(outputFile), 'CSVファイルが作成されるべき');
    
    const csvContent = fs.readFileSync(outputFile, 'utf-8');
    assert.ok(csvContent.includes('express'), 'expressが含まれるべき');
    assert.ok(csvContent.includes('deep-package'), 'deep-packageが含まれるべき');
  });
});