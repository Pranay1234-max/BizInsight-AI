#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/AI-Business-Intelligence/frontend
npm install vite@^5.4.11 @vitejs/plugin-react@^4.3.3 --save-dev
rm -rf node_modules package-lock.json
npm install
npm run dev
