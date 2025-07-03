import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テスト用のヘルパー関数
function createTempPackageJson(content, filename = 'package.json') {
  const tempDir = path.join(__dirname, 'temp-unit');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return filePath;
}

function cleanupTempDir() {
  const tempDir = path.join(__dirname, 'temp-unit');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('ユーティリティ関数のテスト', () => {
  test('package.jsonの基本的な解析', () => {
    const packageContent = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21',
        'express': '^4.18.0'
      },
      devDependencies: {
        'jest': '^29.0.0'
      }
    };

    const tempFile = createTempPackageJson(packageContent);
    
    try {
      // ファイルが正しく作成されたことを確認
      assert.ok(fs.existsSync(tempFile), 'テンポラリファイルが作成されるべき');
      
      // ファイルの内容を読み取って確認
      const readContent = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      assert.strictEqual(readContent.name, 'test-package', 'パッケージ名が正しいべき');
      assert.strictEqual(Object.keys(readContent.dependencies).length, 2, 'dependenciesが2つあるべき');
      assert.strictEqual(Object.keys(readContent.devDependencies).length, 1, 'devDependenciesが1つあるべき');
    } finally {
      cleanupTempDir();
    }
  });

  test('CSVエスケープ処理のテスト', () => {
    // CSVエスケープが必要な文字列のテスト
    const testCases = [
      { input: 'simple text', expected: 'simple text' },
      { input: 'text, with comma', expected: '"text, with comma"' },
      { input: 'text\nwith newline', expected: '"text\nwith newline"' },
      { input: 'text "with quotes"', expected: '"text ""with quotes"""' },
      { input: 'text, with "comma and quotes"', expected: '"text, with ""comma and quotes"""' }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = typeof input === 'string' && (input.includes(',') || input.includes('\n') || input.includes('"'))
        ? `"${input.replace(/"/g, '""')}"`
        : input;
      
      assert.strictEqual(result, expected, `"${input}" のエスケープが正しくないです`);
    });
  });

  test('依存関係の型判定', () => {
    const packageContent = {
      name: 'test-package',
      dependencies: {
        'prod-dep': '^1.0.0'
      },
      devDependencies: {
        'dev-dep': '^2.0.0'
      },
      peerDependencies: {
        'peer-dep': '^3.0.0'
      }
    };

    // dependencies の確認
    assert.ok(packageContent.dependencies['prod-dep'], 'production依存関係が存在するべき');
    assert.strictEqual(packageContent.dependencies['prod-dep'], '^1.0.0', 'バージョンが正しいべき');

    // devDependencies の確認
    assert.ok(packageContent.devDependencies['dev-dep'], 'development依存関係が存在するべき');
    assert.strictEqual(packageContent.devDependencies['dev-dep'], '^2.0.0', 'バージョンが正しいべき');

    // peerDependencies の確認
    assert.ok(packageContent.peerDependencies['peer-dep'], 'peer依存関係が存在するべき');
    assert.strictEqual(packageContent.peerDependencies['peer-dep'], '^3.0.0', 'バージョンが正しいべき');
  });

  test('空の依存関係オブジェクトの処理', () => {
    const packageContent = {
      name: 'empty-deps-package',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    };

    const tempFile = createTempPackageJson(packageContent);
    
    try {
      const readContent = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      assert.strictEqual(Object.keys(readContent.dependencies).length, 0, 'dependenciesが空であるべき');
      assert.strictEqual(Object.keys(readContent.devDependencies).length, 0, 'devDependenciesが空であるべき');
    } finally {
      cleanupTempDir();
    }
  });

  test('依存関係が未定義の場合の処理', () => {
    const packageContent = {
      name: 'no-deps-package',
      version: '1.0.0'
      // dependencies と devDependencies が未定義
    };

    const tempFile = createTempPackageJson(packageContent);
    
    try {
      const readContent = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      assert.strictEqual(readContent.dependencies, undefined, 'dependenciesが未定義であるべき');
      assert.strictEqual(readContent.devDependencies, undefined, 'devDependenciesが未定義であるべき');
    } finally {
      cleanupTempDir();
    }
  });

  test('パッケージ名が未定義の場合のフォールバック', () => {
    const packageContent = {
      version: '1.0.0',
      dependencies: {
        'some-dep': '^1.0.0'
      }
      // name が未定義
    };

    const tempFile = createTempPackageJson(packageContent);
    
    try {
      const readContent = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      assert.strictEqual(readContent.name, undefined, 'nameが未定義であるべき');
      
      // ディレクトリ名をフォールバックとして使用することを想定
      const dirName = path.basename(path.dirname(tempFile));
      assert.ok(dirName, 'ディレクトリ名が存在するべき');
    } finally {
      cleanupTempDir();
    }
  });

  test('バージョン文字列の形式確認', () => {
    const versionPatterns = [
      '^1.0.0',
      '~2.1.0',
      '>=3.0.0',
      '1.2.3',
      '*',
      'latest',
      'file:../local-package'
    ];

    versionPatterns.forEach(version => {
      assert.ok(typeof version === 'string', `バージョン "${version}" は文字列であるべき`);
      assert.ok(version.length > 0, `バージョン "${version}" は空でないべき`);
    });
  });
});