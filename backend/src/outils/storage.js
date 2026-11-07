
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const dataFile = path.join(
    currentDir,
    "../data/reservations.json"
);

export async function readReservations() {
    try {
        const data = await fs.readFile(dataFile, "utf-8");
        const reservations = JSON.parse(data);

        return Array.isArray(reservations) ? reservations : [];
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeReservations([]);
            return [];
        }

        throw error;
    }
}

export async function writeReservations(reservations) {
    await fs.mkdir(path.dirname(dataFile), {
        recursive: true
    });

    await fs.writeFile(
        dataFile,
        JSON.stringify(reservations, null, 2),
        "utf-8"
    );
}
