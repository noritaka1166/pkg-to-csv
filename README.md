# pkg-to-csv

package.jsonファイルから依存関係をCSV形式で出力するツールです。モノレポや複数リポジトリに対応しており、どのプロジェクトの依存関係かを識別できます。

## 機能

- 単一または複数のpackage.jsonファイルから依存関係を抽出
- モノレポ対応（再帰的検索）
- プロジェクト名とパスを含む出力
- npm レジストリから最新バージョン、ライセンス、説明を取得
- dependencies と devDependencies の選択的出力
- CSV形式での出力またはコンソール表示

## インストール

```bash
npm install -g pkg-to-csv
```

## 使用方法

### 基本的な使用方法

```bash
# 現在のディレクトリのpackage.jsonを処理
pkg-to-csv

# 特定のpackage.jsonファイルを指定
pkg-to-csv -i path/to/package.json

# ディレクトリを指定（そのディレクトリのpackage.jsonを処理）
pkg-to-csv -i path/to/project

# 再帰的にpackage.jsonファイルを検索（モノレポ対応）
pkg-to-csv -i . --recursive

# CSV出力
pkg-to-csv -o packages.csv
```

### オプション

- `-i, --input <path>`: package.jsonファイルまたはディレクトリのパス（デフォルト: package.json）
- `-o, --output [path]`: 出力CSVファイル（デフォルト: packages.csv）
- `--recursive`: サブディレクトリを再帰的に検索してpackage.jsonファイルを見つける
- `--latest`: npmから最新バージョン情報を取得
- `--license`: npmからライセンス情報を取得
- `--description`: npmから説明を取得
- `--npm-link`: npmパッケージリンクを含める
- `--deps-only`: dependenciesのみを含める（devDependenciesを除外）
- `--dev-only`: devDependenciesのみを含める（dependenciesを除外）

### 出力形式

CSV出力には以下の列が含まれます：

- `projectName`: package.jsonのnameフィールド
- `projectPath`: プロジェクトの相対パス
- `package`: パッケージ名
- `version`: インストールされているバージョン
- `type`: 依存関係の種類（dependencies または devDependencies）
- `latestVersion`: 最新バージョン（--latestオプション使用時）
- `license`: ライセンス（--licenseオプション使用時）
- `description`: 説明（--descriptionオプション使用時）
- `npmLink`: npmリンク（--npm-linkオプション使用時）

### 使用例

```bash
# モノレポ全体の依存関係を最新バージョン情報付きでCSV出力
pkg-to-csv -i . --recursive --latest --license -o all-packages.csv

# 特定のプロジェクトのproduction依存関係のみ
pkg-to-csv -i packages/frontend --deps-only -o frontend-deps.csv

# 開発依存関係のみをコンソールに表示
pkg-to-csv --dev-only
```

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発実行
npm run dev

# クリーンアップ
npm run clean