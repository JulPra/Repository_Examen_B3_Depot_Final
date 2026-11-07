const boutonsReservation = document.querySelectorAll(".reservation");

const API_URL = "http://localhost:3000/api";

boutonsReservation.forEach((bouton) => {
    const carte = bouton.closest(".movie-card");

    // Création du choix du nombre de places
    let select = carte.querySelector(".nombre-places");

    if (!select) {
        select = document.createElement("select");
        select.className = "nombre-places";

        for (let i = 1; i <= 10; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `${i} place${i > 1 ? "s" : ""}`;
            select.appendChild(option);
        }

        bouton.before(select);
    }

    const message = carte.querySelector(".message-reservation");

    bouton.addEventListener("click", async () => {
        const login = sessionStorage.getItem("login");

        if (!login) {
            alert("Vous devez être connecté pour réserver.");
            window.location.href = "index.html";
            return;
        }

        const film = carte.querySelector(".movie-title")
            .textContent.trim();

        const nombrePlaces = Number(select.value);

        const textePlaces = carte.querySelector(
            ".movie-places-disponibles"
        ).textContent;

        const placesDisponibles = parseInt(
            textePlaces.match(/\d+/)?.[0] ?? "0",
            10
        );

        if (nombrePlaces > placesDisponibles) {
            message.textContent =
                "Le nombre de places demandé n'est pas disponible.";
            return;
        }

        bouton.disabled = true;
        message.textContent = "Préparation du paiement...";

        try {
            const response = await fetch(
                `${API_URL}/paiements/checkout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        film,
                        login,
                        nombrePlaces
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            if (!data.checkoutUrl) {
                throw new Error("Lien de paiement introuvable.");
            }

            window.location.href = data.checkoutUrl;

        } catch (error) {
            message.textContent =
                error.message || "Une erreur est survenue.";

            bouton.disabled = false;
        }
    });
});
