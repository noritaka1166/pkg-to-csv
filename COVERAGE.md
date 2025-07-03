# テストカバレッジとSonarQube統合

このプロジェクトでは、包括的なテストカバレッジを測定し、SonarQubeで品質分析を行っています。

## カバレッジ統計

現在のカバレッジ:
- **行カバレッジ**: 98.19% (217/221行)
- **関数カバレッジ**: 100.00% (4/4関数)
- **分岐カバレッジ**: 85.48% (53/62分岐)

## カバレッジの実行

### 基本的なカバレッジレポート
```bash
npm run test:coverage
```
テキスト形式とHTML形式のレポートを生成します。

### SonarQube用カバレッジ
```bash
npm run test:coverage:sonar
```
SonarQubeで読み取り可能なLCOVフォーマットでカバレッジを生成します。

### 個別のLCOVレポート
```bash
npm run test:coverage:lcov
```
LCOVフォーマットのみでカバレッジを生成します。

## 生成されるファイル

### カバレッジディレクトリ (`coverage/`)
- `lcov.info` - 標準のLCOVレポート
- `lcov-sonar.info` - SonarQube用に調整されたLCOVレポート
- `index.html` - HTMLカバレッジレポート
- `lcov-report/` - 詳細なHTMLレポート

### HTMLレポートの確認
```bash
open coverage/index.html
```

## SonarQube設定

### sonar-project.properties
```properties
sonar.typescript.lcov.reportPaths=coverage/lcov-sonar.info
sonar.javascript.lcov.reportPaths=coverage/lcov-sonar.info
sonar.sources=src
sonar.tests=test
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
sonar.coverage.exclusions=**/test/**,**/scripts/**
```

### GitHub Actions統合
`.github/workflows/sonarqube.yml` でCI/CDパイプラインに統合されています。

必要な環境変数:
- `SONAR_TOKEN` - SonarCloudのトークン
- `GITHUB_TOKEN` - 自動的に提供される

## カバレッジツール

### c8 (V8 Coverage)
- Node.js V8エンジンの組み込みカバレッジを使用
- TypeScriptとJavaScriptの両方をサポート
- 高精度なカバレッジ測定

### 設定ファイル (`.c8rc.json`)
```json
{
  "include": ["src/**/*.ts", "dist/**/*.js"],
  "exclude": ["test/**", "scripts/**", "coverage/**"],
  "reporter": ["text", "lcov", "html"],
  "all": true
}
```

## カバレッジ向上のガイドライン

### 未カバーの行
現在未カバーの行:
- `src/index.ts:116-117` - エラーハンドリング
- `src/index.ts:219-220` - コンソール出力

### カバレッジ目標
- **行カバレッジ**: 95%以上
- **関数カバレッジ**: 100%
- **分岐カバレッジ**: 90%以上

## トラブルシューティング

### カバレッジが生成されない場合
1. `npm run build` でビルドが成功することを確認
2. `node_modules` を削除して `npm install` を再実行
3. `.c8rc.json` の設定を確認

### SonarQubeでカバレッジが表示されない場合
1. `coverage/lcov-sonar.info` ファイルが存在することを確認
2. `sonar-project.properties` のパス設定を確認
3. SonarCloudプロジェクトの設定を確認

## 継続的改善

### 定期的なカバレッジチェック
- PRごとにカバレッジを確認
- カバレッジの低下を防ぐ
- 新機能には必ずテストを追加

### 品質ゲート
SonarQubeで以下の品質ゲートを設定:
- カバレッジ: 80%以上
- 重複コード: 3%以下
- 技術的負債: A評価
- セキュリティホットスポット: 0件