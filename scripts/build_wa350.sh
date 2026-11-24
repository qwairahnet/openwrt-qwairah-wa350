#!/usr/bin/env bash
set -e

ROOT_DIR="$(pwd)"
rm -rf openwrt
git clone --branch openwrt-23.05 --depth 1 https://github.com/openwrt/openwrt.git openwrt
cd openwrt

sed -i 's/20)/40)/g' package/firmware/wireless-regdb/Makefile || true
sed -i 's/COMFAST CF-E375AC/COMFAST CF-WA350/g' target/linux/ath79/dts/*cf-e375ac*.dts 2>/dev/null || true

./scripts/feeds update -a
./scripts/feeds install -a

find feeds/luci -type f -name "*.htm" -exec sed -i 's|https://github.com/openwrt/luci|#|g' {} + || true
find feeds/luci -type f -name "*.htm" -exec sed -i 's|Powered by LuCI.*|QWAIRAH NET OS - COMFAST CF-WA350|g' {} + || true

cp -r "$ROOT_DIR/files" .
cp "$ROOT_DIR/.config" .config

make defconfig
make toolchain/install -j"$(nproc)"

TOOLCHAIN_GCC=$(find staging_dir/toolchain-* -name "mips-openwrt-linux*-gcc" | head -n 1)
if [ -n "$TOOLCHAIN_GCC" ]; then
    mkdir -p files/usr/bin
    "$TOOLCHAIN_GCC" -O2 -s "$ROOT_DIR/src/qwairah_mndp.c" -o files/usr/bin/qwairah_mndp
    chmod +x files/usr/bin/qwairah_mndp
    cp -f files/usr/bin/qwairah_mndp "$ROOT_DIR/files/usr/bin/qwairah_mndp"
fi

make -j"$(nproc)" || make -j1 target/linux/install V=sc

mkdir -p "$ROOT_DIR/artifacts_out"
cp -f bin/targets/ath79/generic/*cf-e375ac*initramfs-kernel.bin "$ROOT_DIR/artifacts_out/QWAIRAH-COMFAST-CF-WA350-initramfs-kernel.bin" 2>/dev/null || true
cp -f bin/targets/ath79/generic/*cf-e375ac*squashfs-sysupgrade.bin "$ROOT_DIR/artifacts_out/QWAIRAH-COMFAST-CF-WA350-squashfs-sysupgrade.bin" 2>/dev/null || true
ls -la "$ROOT_DIR/artifacts_out/"
