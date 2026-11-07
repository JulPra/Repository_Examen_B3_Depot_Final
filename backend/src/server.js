import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import paiementRoutes from "./routes/paiementRoutes.js";

const dossierActuel = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(dossierActuel, "../.env")
});

const app = express();

const frontendPath = path.resolve(
    dossierActuel,
    "../../frontend/Application"
);

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend Cinema opérationnel"
    });
});

app.use("/api/paiements", paiementRoutes);

app.use(express.static(frontendPath));

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Application disponible sur http://localhost:${PORT}`);
    });
}

export default app;