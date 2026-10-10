import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/player/alan-moclair", destination: "/player/alan-moclair-ahascragh-fohenagh", permanent: true },
      { source: "/player/tim-sweeney", destination: "/player/tim-sweeney-fohenagh", permanent: true },
      { source: "/player/jimmy-devine", destination: "/player/jimmy-devine-fohenagh", permanent: true },
      { source: "/player/brendan-noone", destination: "/player/brendan-noone-fohenagh", permanent: true },
      { source: "/player/sarah-noone", destination: "/player/sarah-noone-fohenagh", permanent: true },
    ];
  },
};

export default nextConfig;
