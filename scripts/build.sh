#!/bin/bash
cp package.json build/
cp package-lock.json build/
cp scripts/librespot.sh build/scripts/
cp -R config/ build/
cd build/
npm ci