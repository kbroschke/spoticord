rm -R lib
mkdir lib
cd ./lib
git clone https://github.com/librespot-org/librespot.git
cd librespot
cargo build --release --no-default-features
cp target/release/librespot ../librespot-release
chmod -R +w .git/
cd ..
rm -R librespot/
mv librespot-release librespot