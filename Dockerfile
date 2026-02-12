# Node.js 20 系（Next.js 16 の要件を満たす）
FROM node:20.11-alpine

WORKDIR /app

# 依存関係だけ先にインストール
COPY package.json package-lock.json ./
RUN npm install

# プロジェクトファイルをすべてコピー
COPY . .

EXPOSE 3000

# 開発用：ホットリロード
CMD ["npm", "run", "dev"]