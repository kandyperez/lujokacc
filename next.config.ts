import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Las imágenes se suben dentro del Server Action del formulario:
      // 8 archivos de hasta 5 MB más los campos de texto.
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
