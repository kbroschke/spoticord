#!/bin/bash
rm -rf lib/
mkdir lib
cd ./lib
git clone https://github.com/librespot-org/librespot.git
cd librespot
cargo build --release --no-default-features
cp target/release/librespot ../librespot-release
cd ..
rm -rf librespot/
mv librespot-release librespot