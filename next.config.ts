import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The product photography is already 700x700 WebP at 22-57KB — sized and
    // compressed for the web before it ever reached this repo. Running it back
    // through Next's optimizer re-encodes lossy-on-lossy at quality 75, which
    // visibly softens it while saving no meaningful bytes. Serve the originals.
    unoptimized: true,
  },
};

export default nextConfig;
