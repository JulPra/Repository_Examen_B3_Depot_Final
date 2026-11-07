import { describe, it, expect, beforeEach, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn()
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: fsMocks.readFile,
    writeFile: fsMocks.writeFile,
    mkdir: fsMocks.mkdir
  }
}));

describe("Gestion du stockage des réservations", () => {

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    fsMocks.mkdir.mockResolvedValue(undefined);
    fsMocks.writeFile.mockResolvedValue(undefined);
  });

  async function chargerStorage() {
    return await import("../src/outils/storage.js");
  }

  it("lit correctement les réservations depuis le fichier JSON", async () => {
    const reservations = [
      { id: "123", film: "Film test" },
      { id: "456", film: "Film test 2" }
    ];

    fsMocks.readFile.mockResolvedValue(
      JSON.stringify(reservations)
    );

    const { readReservations } = await chargerStorage();

    const resultat = await readReservations();

    expect(resultat).toEqual(reservations);

    expect(fsMocks.readFile).toHaveBeenCalledWith(
      expect.any(String),
      "utf-8"
    );
  });

  it("crée un fichier vide si reservations.json n'existe pas", async () => {
    const erreur = new Error("Fichier introuvable");
    erreur.code = "ENOENT";

    fsMocks.readFile.mockRejectedValue(erreur);

    const { readReservations } = await chargerStorage();

    const resultat = await readReservations();

    expect(resultat).toEqual([]);

    expect(fsMocks.mkdir).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true }
    );

    expect(fsMocks.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      "[]",
      "utf-8"
    );
  });

  it("retourne un tableau vide si le contenu JSON n'est pas un tableau", async () => {
    fsMocks.readFile.mockResolvedValue(
      JSON.stringify({
        id: "123",
        film: "Film test"
      })
    );

    const { readReservations } = await chargerStorage();

    const resultat = await readReservations();

    expect(resultat).toEqual([]);
  });

  it("propage une erreur si le contenu JSON est invalide", async () => {
    fsMocks.readFile.mockResolvedValue(
      "contenu JSON invalide"
    );

    const { readReservations } = await chargerStorage();

    await expect(readReservations()).rejects.toThrow();

    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("propage une erreur si la lecture échoue pour une autre raison que ENOENT", async () => {
    const erreur = new Error("Permission refusée");
    erreur.code = "EACCES";

    fsMocks.readFile.mockRejectedValue(erreur);

    const { readReservations } = await chargerStorage();

    await expect(readReservations()).rejects.toThrow(
      "Permission refusée"
    );

    expect(fsMocks.writeFile).not.toHaveBeenCalled();
  });

  it("écrit correctement les réservations dans le fichier JSON", async () => {
    const reservations = [
      { id: "123", film: "Film test" },
      { id: "456", film: "Film test 2" }
    ];

    const { writeReservations } = await chargerStorage();

    await writeReservations(reservations);

    expect(fsMocks.mkdir).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true }
    );

    expect(fsMocks.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(reservations, null, 2),
      "utf-8"
    );
  });

});
