/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist resolves its worker via a relative dynamic import. Bundling it
  // rewrites that path into .next/**/chunks, where no worker file is emitted,
  // so the fake-worker fallback fails. Load these from node_modules at runtime.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
