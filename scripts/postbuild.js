import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function run(cmd) {
  console.log(`👉 ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  // ===============================
  // 1️⃣ Gera o 404.html
  // ===============================
  const dist = path.resolve("dist");
  const index = path.join(dist, "index.html");
  const notFound = path.join(dist, "404.html");

  if (!fs.existsSync(index)) {
    console.error("❌ index.html não encontrado");
    process.exit(1);
  }

  fs.copyFileSync(index, notFound);
  console.log("✅ 404.html gerado");

  // ===============================
  // 2️⃣ Git add + commit + push
  // ===============================
  run("git add .");

  // evita erro quando não tem nada pra commitar
  try {
    run(`git commit -m "deploy: build automático ${new Date().toISOString()}"`);
  } catch {
    console.log("⚠️ Nada novo pra commitar");
  }

  run("git push");

  // ===============================
  // 3️⃣ Deploy no GitHub Pages
  // ===============================
  run("npx gh-pages -d dist -b gh-pages");

  console.log("🚀 Deploy COMPLETO com sucesso");
} catch (err) {
  console.error("💥 Falha no postbuild:", err);
  process.exit(1);
}
