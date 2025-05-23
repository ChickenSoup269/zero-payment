import type { NextConfig } from "next"

const nextConfig: NextConfig = {}
module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/gold-prices",
        destination: "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=1",
      },
    ]
  },
}

export default nextConfig
