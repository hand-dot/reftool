TODO
- [x] モック画面の作成
- [ ] とりあえずstaticなpathでいいから jscpd を実行して値をパースして一覧画面に飛ばす
  - パース結果はメモリに保持しておく
- [ ] 一覧画面でそれを受け取り、リスト表示する
- [ ] 詳細画面に遷移する
  - 遷移時にメモリに保持しておいたパース結果をID or indexでサーチして渡す
- [ ] ChatGPTをコールしてマークダウンとして表示する

+@
- How it works とかHow to useの説明を README, ページに書きたい
- Open AIのトークンを設定できるようにする(ローカルストレージ)
- コマンドラインからnpx で起動してローカルでサーバーが立ち上がるところまで作りたい(できればインストール不要)
- jscpdのオプションをカスタマイズできるよにする
- ChatGPTのプロンプトをカスタマイズできるようにする
- skip, complete, in progress, pendingなどの状態を設定できるようにする

---

memo
-V, --version バージョン番号を出力します
-l, --min-lines [number] コード行内の重複の最小サイズ（デフォルトは5）
-k, --min-tokens [number] コードトークン内の重複の最小サイズ（デフォルトは50）
-x, --max-lines [number] 行でのソースの最大サイズ（デフォルトは1000）
-z, --max-size [string] バイトでのソースの最大サイズ、例：1kb, 1mb, 120kb（デフォルトは100kb）
-t, --threshold [number] 重複の閾値、重複が閾値以上の場合jscpdはエラーとして終了します
-c, --config [string] 設定ファイルへのパス（デフォルトは<path>内の.jscpd.json）
-i, --ignore [string] 重複検出から除外するべきファイルのグロブパターン
--ignore-pattern [string] 正規表現パターンにマッチするコードブロックを無視します
-r, --reporters [string] 使用するレポーター、またはカンマで区切られたレポーターリスト（デフォルトはtime,console）
-o, --output [string] 使用するレポーター（デフォルトは./report/）
-m, --mode [string] 検索の品質のモードは「strict」、「mild」、「weak」があります（デフォルトは "function mild(token) {
return strict(token) && token.type !== 'empty' && token.type !== 'new_line';
}"）
-f, --format [string] フォーマット、またはカンマで区切られたフォーマット（例 php,javascript,python）
-p, --pattern [string] ファイル検索用のグロブパターン（例 **/*.txt）
-b, --blame 重複の作者を非難します（gitから作者に関する情報を取得）
-s, --silent 検出進行状況と結果をコンソールに書き込まない
--store [string] 大規模なコードベースに使用するカスタムストアを定義するために使用（例 --store leveldb）
-a, --absolute レポートで絶対パスを使用
-n, --noSymlinks ファイルの検出でシンボリックリンクを使用しない
--ignoreCase コード内の記号の大文字と小文字を無視します（実験的）
-g, --gitignore .gitignoreファイルのすべてのファイルを無視
--formats-exts [string] ファイル拡張子を持つフォーマットのリスト（javascript:es,es6;dart:dt）
-d, --debug デバッグ情報を表示、検出プロセスは実行しません（オプションリストと選択されたファイル）
-v, --verbose 検出プロセス中に完全な情報を表示
--list サポートされるフォーマットのリストを表示
--skipLocal ローカルフォルダー内の重複をスキップ、フォルダー間の重複のみを検出
--exitCode [number] コード重複が検出された場合に使用する終了コード
-h, --help コマンドのヘルプを表示