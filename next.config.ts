import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/player/alan-moclair", destination: "/player/alan-moclair-ahascragh-fohenagh", permanent: false },
      { source: "/player/tim-sweeney", destination: "/player/tim-sweeney-fohenagh", permanent: false },
      { source: "/player/jimmy-devine", destination: "/player/jimmy-devine-fohenagh", permanent: false },
      { source: "/player/brendan-noone", destination: "/player/brendan-noone-fohenagh", permanent: false },
      { source: "/player/sarah-noone", destination: "/player/sarah-noone-fohenagh", permanent: false },
    ];
  },
};

export default nextConfig;
