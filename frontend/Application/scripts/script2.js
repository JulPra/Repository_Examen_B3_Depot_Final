
const API_URL = "https://repository-examen-b3-depot-final.onrender.com";

const boutonsReservation = document.querySelectorAll(".reservation");

boutonsReservation.forEach((bouton) => {
    bouton.addEventListener("click", async () => {
        const login = sessionStorage.getItem("login");

        if (!login) {
            alert("Vous devez être connecté pour réserver.");
            window.location.href = "index.html";
            return;
        }

        const carteFilm = bouton.closest(".movie-card");
        const titreFilm = carteFilm
            .querySelector(".movie-title")
            .textContent.trim();

        const message = carteFilm.querySelector(".message-reservation");

        message.textContent = "Préparation du paiement...";
        bouton.disabled = true;

        try {
            const response = await fetch(
                `${API_URL}/api/paiements/checkout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        film: titreFilm,
                        login: login,
                        nombrePlaces: 1
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de créer le paiement."
                );
            }

            if (!data.checkoutUrl) {
                throw new Error("Adresse de paiement introuvable.");
            }

            window.location.href = data.checkoutUrl;

        } catch (error) {
            console.error("Erreur réservation :", error);
            message.textContent = error.message;
            bouton.disabled = false;
        }
    });
});
