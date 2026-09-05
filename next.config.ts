import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 何で作ったかを既定で名乗る X-Powered-By ヘッダーを止める。
  // フッターの表記を外したのと同じ理由で、見に来た人に要らない情報だった。
  poweredByHeader: false,
  // 立ち絵は元素材の解像度が小さく、拡大すると眠くなる。
  // レイアウト側で原寸以下に収めているので、生成する幅も実際に使う範囲だけに絞る。
  images: {
    deviceSizes: [360, 480, 640, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 160, 200, 256, 320, 384],
    formats: ["image/avif", "image/webp"],
  },
  // GitHub Pages などの静的ホスティングに出す場合はこの2行を有効にする。
  // output: "export",
  // images: { unoptimized: true },
};

export default nextConfig;
