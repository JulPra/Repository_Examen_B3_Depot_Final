
const boutonsReservation = document.querySelectorAll(".reservation");

// Créer automatiquement le sélecteur de places
boutonsReservation.forEach((bouton) => {
    const carteFilm = bouton.closest(".movie-card");

    if (!carteFilm) return;

    let select = carteFilm.querySelector(".nombre-places");

    if (!select) {
        select = document.createElement("select");
        select.className = "nombre-places";

        for (let i = 1; i <= 10; i++) {
            const option = document.createElement("option");
            option.value = String(i);
            option.textContent = `${i} place${i > 1 ? "s" : ""}`;
            select.appendChild(option);
        }

        bouton.before(select);
    }
});

// Gestion des réservations
boutonsReservation.forEach((bouton) => {

    bouton.addEventListener("click", async () => {

        const login = sessionStorage.getItem("login");

        // Vérifier la connexion
        if (!login) {
            alert("Vous devez être connecté pour réserver.");
            return;
        }

        const carteFilm = bouton.closest(".movie-card");

        const titreFilm = carteFilm
            .querySelector(".movie-title")
            .textContent.trim();

        const message = carteFilm.querySelector(
            ".message-reservation"
        );

        const select = carteFilm.querySelector(".nombre-places");

        const nombrePlaces = Number(select.value);

        // Récupérer les places disponibles
        const textePlaces = carteFilm
            .querySelector(".movie-places-disponibles")
            .textContent;

        const placesDisponibles = parseInt(
            textePlaces.match(/\d+/)?.[0] ?? "0",
            10
        );

        // Vérifier la disponibilité
        if (
            !Number.isInteger(nombrePlaces) ||
            nombrePlaces < 1 ||
            nombrePlaces > placesDisponibles
        ) {
            message.textContent =
                "Le nombre de places demandé n'est pas disponible.";
            return;
        }

        message.textContent = "";
        bouton.disabled = true;

        try {
            // Demander la création d'une session Stripe au backend
            const response = await fetch(
                "http://localhost:3000/api/paiements/checkout",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        film: titreFilm,
                        login: login,
                        nombrePlaces: nombrePlaces
                    })
                }
            );

            const data = await response.json();

            // Vérifier la réponse du serveur
            if (!response.ok) {
                throw new Error(
                    data.message || "Erreur lors du paiement."
                );
            }

            // Vérifier la présence du lien Stripe
            if (!data.checkoutUrl) {
                throw new Error(
                    "Lien de paiement introuvable."
                );
            }

            // Rediriger vers Stripe Checkout
            window.location.href = data.checkoutUrl;

        } catch (error) {
            console.error("Erreur réservation :", error);

            message.textContent =
                error.message || "Une erreur est survenue.";

            bouton.disabled = false;
        }
    });
});
