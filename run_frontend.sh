#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/AI-Business-Intelligence/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
