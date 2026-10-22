// Hostinger entry: run the backend from its own folder so relative paths ("public", .env) resolve
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("./backend", import.meta.url)));
// no top-level await: Hostinger's LiteSpeed loads this file via require()
import("./backend/src/index.js");
