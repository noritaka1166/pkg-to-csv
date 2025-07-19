# pkg-to-csv

package.json ファイルから依存関係を CSV 形式で出力するツールです。モノレポや複数リポジトリに対応しており、どのプロジェクトの依存関係かを識別できます。

## 機能

- 単一または複数の package.json ファイルから依存関係を抽出
- モノレポ対応（再帰的検索）
- プロジェクト名とパスを含む出力
- npm レジストリから最新バージョン、ライセンス、説明を取得
- dependencies と devDependencies の選択的出力
- CSV 形式での出力またはコンソール表示

## インストール

```bash
npm install -g pkg-to-csv
```

## 使用方法

pkg-to-csv は2つの動作モードを提供します：

### インタラクティブモード（デフォルト）

引数なしまたは `--interactive` で実行すると、インタラクティブなインターフェースが起動します：

```bash
# インタラクティブモードを起動
pkg-to-csv

# 明示的にインタラクティブモードを起動
pkg-to-csv --interactive
```

インタラクティブモードでは以下の操作が可能です：
- 入力パス（package.json ファイルまたはディレクトリ）の設定
- 出力ファイルパスの設定
- 各種オプション（最新バージョン、ライセンス情報等）の切り替え
- 実行前の設定プレビュー

### CLIモード

自動化スクリプトや高度な使用には、コマンドライン引数を使用します：

```bash
# 現在のディレクトリのpackage.jsonを処理
pkg-to-csv -i package.json -o packages.csv

# 特定のpackage.jsonファイルを指定
pkg-to-csv -i path/to/package.json -o output.csv

# ディレクトリを指定（そのディレクトリのpackage.jsonを処理）
pkg-to-csv -i path/to/project -o packages.csv

# 再帰的にpackage.jsonファイルを検索（モノレポ対応）
pkg-to-csv -i . --recursive -o all-packages.csv
```

### オプション

- `-i, --input <path>`: package.json ファイルまたはディレクトリのパス（デフォルト: package.json）
- `-o, --output [path]`: 出力 CSV ファイル（デフォルト: packages.csv）
- `--interactive`: インタラクティブモードを起動
- `--recursive`: サブディレクトリを再帰的に検索して package.json ファイルを見つける
- `--latest`: npm から最新バージョン情報を取得
- `--license`: npm からライセンス情報を取得
- `--description`: npm から説明を取得
- `--npm-link`: npm パッケージリンクを含める
- `--deps-only`: dependencies のみを含める（devDependencies を除外）
- `--dev-only`: devDependencies のみを含める（dependencies を除外）

### 出力形式

CSV 出力には以下の列が含まれます：

- `projectName`: package.json の name フィールド
- `projectPath`: プロジェクトの相対パス
- `package`: パッケージ名
- `version`: インストールされているバージョン
- `type`: 依存関係の種類（dependencies または devDependencies）
- `latestVersion`: 最新バージョン（--latest オプション使用時）
- `license`: ライセンス（--license オプション使用時）
- `description`: 説明（--description オプション使用時）
- `npmLink`: npm リンク（--npm-link オプション使用時）

### 使用例

#### インタラクティブモードの例
```bash
# インタラクティブモードを起動（デフォルト動作）
pkg-to-csv

# UIを通じて全てのオプションを設定
pkg-to-csv --interactive
```

#### CLIモードの例
```bash
# モノレポ全体の依存関係を最新バージョン情報付きでCSV出力
pkg-to-csv -i . --recursive --latest --license -o all-packages.csv

# 特定のプロジェクトのproduction依存関係のみ
pkg-to-csv -i packages/frontend --deps-only -o frontend-deps.csv

# 開発依存関係のみをデフォルトCSV出力
pkg-to-csv -i . --dev-only -o dev-dependencies.csv

# 出力ファイルなしでコンソール表示
pkg-to-csv -i . -o false
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
```
