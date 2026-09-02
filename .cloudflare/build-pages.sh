#!/usr/bin/env bash
set -euo pipefail

readonly PHOTOSWIPE_RELEASE_URL='https://github.com/ouomi/Neos/releases/download/photoswipe-v5.4.4'
readonly PHOTOSWIPE_ARCHIVE='photoswipe-5.4.4-built.tar.gz'
readonly PHOTOSWIPE_CHECKSUM='photoswipe-5.4.4-SHA256SUMS.txt'

download_dir="$(mktemp -d)"
archive_path="$download_dir/$PHOTOSWIPE_ARCHIVE"
checksum_path="$download_dir/$PHOTOSWIPE_CHECKSUM"

cleanup()
{
    rm -rf "$download_dir"
}

trap cleanup EXIT

corepack enable
pnpm install --frozen-lockfile=false

mkdir -p src/vendor
curl --fail --location --retry 3 \
    --output "$archive_path" \
    "$PHOTOSWIPE_RELEASE_URL/$PHOTOSWIPE_ARCHIVE"
curl --fail --location --retry 3 \
    --output "$checksum_path" \
    "$PHOTOSWIPE_RELEASE_URL/$PHOTOSWIPE_CHECKSUM"
tar --extract --gzip --file "$archive_path" --directory src/vendor
(
    cd src/vendor
    sha256sum --check "$checksum_path"
)

pnpm build
