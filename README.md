# SPI Timer

SPI勉強用のストップウォッチ＆カウントダウンタイマー。

## URL

**GitHub Pages:** https://ichito-watanabe.github.io/timer/

> GitHub Pages が有効になっていない場合は、リポジトリの Settings → Pages → Branch を `master` に設定する。

## 起動方法

### ブラウザで直接開く（一番簡単）

`index.html` をダブルクリックしてブラウザで開くだけ。

### ローカルサーバーで起動する（推奨）

```bash
# Python がある場合
python -m http.server 8080

# Node.js がある場合
npx serve .
```

起動後、ブラウザで `http://localhost:8080` を開く。

## 機能

| 操作 | 説明 |
|------|------|
| `Space` | START / STOP |
| `Delete` | RESET |
| `LAP` / `次問` ボタン | ラップ記録 / 問題ごとの時間記録 |

### カウントダウンモード

- プリセット：30秒 / 1分 / 2分 / 英語20分 / 言語30分 / 非言語35分
- 残り25%でオレンジ、残り10%で赤フラッシュ
- 時間切れでビープ音3回
- 「次問」ボタンで何問解いたか・平均ペースを記録

## リポジトリ

https://github.com/ichito-watanabe/timer
