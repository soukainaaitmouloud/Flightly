// =========================================
// FLIGHTLY - JAVASCRIPT
// =========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("✈️ Flightly JavaScript loaded successfully.");

    // =========================================
    // ACCOUNT SIGN-IN / SIGN-UP
    // =========================================

    const authDialog = document.querySelector("#authDialog");
    const authTitle = document.querySelector("#authTitle");
    const authMessage = document.querySelector("#authMessage");
    const loginButton = document.querySelector("#loginButton");
    const signupButton = document.querySelector("#signupButton");
    const logoutButton = document.querySelector("#logoutButton");
    const closeAuthDialog = document.querySelector("#closeAuthDialog");
    const loginForm = document.querySelector("#loginForm");
    const signupForm = document.querySelector("#signupForm");
    const switchToSignup = document.querySelector("#switchToSignup");
    const switchToLogin = document.querySelector("#switchToLogin");

    const supabaseUrl = window.FLIGHTLY_SUPABASE_URL;
    const supabasePublishableKey =
        window.FLIGHTLY_SUPABASE_PUBLISHABLE_KEY;

    const hasSupabaseSettings =
        typeof supabaseUrl === "string" &&
        supabaseUrl.startsWith("https://") &&
        typeof supabasePublishableKey === "string" &&
        supabasePublishableKey.length > 20;

    const supabaseClient =
        hasSupabaseSettings &&
        window.supabase &&
        typeof window.supabase.createClient === "function"
            ? window.supabase.createClient(
                  supabaseUrl,
                  supabasePublishableKey
              )
            : null;

    function setAuthMessage(message, type) {
        if (!authMessage) return;

        authMessage.textContent = message;
        authMessage.classList.remove("error", "success");

        if (type) {
            authMessage.classList.add(type);
        }
    }

    function getSignupErrorHint(error) {
        const code = String(
            error && error.code ? error.code : ""
        ).toLowerCase();

        if (code.includes("already")) {
            return "An account may already exist. Try the Log in option.";
        }

        if (code.includes("password")) {
            return "The password does not meet the account rules. Use at least 8 characters.";
        }

        if (code.includes("email")) {
            return "Supabase could not use that email address. Check it and try again.";
        }

        if (code.includes("rate")) {
            return "Too many sign-up attempts. Wait a little, then try again.";
        }

        const safeCode =
            code ||
            (error && error.status
                ? String(error.status)
                : "unknown");

        console.error("Supabase sign-up error code:", safeCode);

        return (
            "Sign-up failed (error code: " +
            safeCode +
            "). Share this code only—never your password."
        );
    }

    function showAuthForm(mode) {
        const isSignup = mode === "signup";

        if (loginForm) loginForm.hidden = isSignup;
        if (signupForm) signupForm.hidden = !isSignup;

        if (authTitle) {
            authTitle.textContent = isSignup
                ? "Create your account"
                : "Log in";
        }

        setAuthMessage("", "");

        if (authDialog && !authDialog.open) {
            authDialog.showModal();
        }

        const firstInput = isSignup
            ? document.querySelector("#signupName")
            : document.querySelector("#loginEmail");

        if (firstInput) firstInput.focus();
    }

    function updateAccountButtons(user) {
        const signedIn = Boolean(user);

        if (loginButton) loginButton.hidden = signedIn;
        if (signupButton) signupButton.hidden = signedIn;
        if (logoutButton) logoutButton.hidden = !signedIn;
    }

    if (loginButton) {
        loginButton.addEventListener("click", function () {
            showAuthForm("login");
        });
    }

    if (signupButton) {
        signupButton.addEventListener("click", function () {
            showAuthForm("signup");
        });
    }

    if (switchToSignup) {
        switchToSignup.addEventListener("click", function () {
            showAuthForm("signup");
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener("click", function () {
            showAuthForm("login");
        });
    }

    if (closeAuthDialog && authDialog) {
        closeAuthDialog.addEventListener("click", function () {
            authDialog.close();
        });
    }

    // LOG IN
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!supabaseClient) {
                setAuthMessage(
                    "The account service is not connected yet. Check your Supabase setup.",
                    "error"
                );
                return;
            }

            const emailInput = document.querySelector("#loginEmail");
            const passwordInput = document.querySelector("#loginPassword");

            if (!emailInput || !passwordInput) {
                setAuthMessage(
                    "The login form is missing a required field.",
                    "error"
                );
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            setAuthMessage("Logging in…", "");

            try {
                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (error) {
                    setAuthMessage(
                        "Login failed. Check your email and password, then try again.",
                        "error"
                    );
                    return;
                }

                updateAccountButtons(data.user);
                loginForm.reset();

                if (authDialog) authDialog.close();
            } catch (error) {
                console.error("Login request failed:", error);

                setAuthMessage(
                    "We couldn't reach the account service. Check your internet connection and try again.",
                    "error"
                );
            }
        });
    }

    // SIGN UP
    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!supabaseClient) {
                setAuthMessage(
                    "The account service is not connected yet. Check your Supabase setup.",
                    "error"
                );
                return;
            }

            const nameInput = document.querySelector("#signupName");
            const emailInput = document.querySelector("#signupEmail");
            const passwordInput = document.querySelector("#signupPassword");

            if (!nameInput || !emailInput || !passwordInput) {
                setAuthMessage(
                    "The sign-up form is missing a required field.",
                    "error"
                );
                return;
            }

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            setAuthMessage("Creating your account…", "");

            try {
                const { data, error } =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: name
                            }
                        }
                    });

                if (error) {
                    setAuthMessage(getSignupErrorHint(error), "error");
                    return;
                }

                signupForm.reset();

                if (data.session) {
                    updateAccountButtons(data.user);

                    if (authDialog) authDialog.close();
                } else {
                    setAuthMessage(
                        "Account created. Check your email for the confirmation link.",
                        "success"
                    );
                }
            } catch (error) {
                console.error("Sign-up request failed:", error);

                setAuthMessage(
                    "We couldn't reach the account service. Check your internet connection and try again.",
                    "error"
                );
            }
        });
    }

    // LOG OUT
    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            if (!supabaseClient) {
                setAuthMessage(
                    "The account service is not connected.",
                    "error"
                );
                return;
            }

            try {
                const { error } = await supabaseClient.auth.signOut();

                if (error) {
                    setAuthMessage(
                        "We couldn't log you out. Please try again.",
                        "error"
                    );
                    return;
                }

                updateAccountButtons(null);
            } catch (error) {
                console.error("Logout request failed:", error);

                setAuthMessage(
                    "We couldn't reach the account service. Please try again.",
                    "error"
                );
            }
        });
    }

    // CHECK EXISTING SESSION
    if (supabaseClient) {
        supabaseClient.auth.getSession().then(function ({ data }) {
            updateAccountButtons(
                data.session ? data.session.user : null
            );
        });

        supabaseClient.auth.onAuthStateChange(function (_event, session) {
            updateAccountButtons(
                session ? session.user : null
            );
        });
    }
        // =========================================
    // PAGE ELEMENTS
    // =========================================

    const tripButtons = document.querySelectorAll(".trip-options button");

    const fromInput = document.querySelector(
        '.search-field input[placeholder="Casablanca (CMN)"]'
    );

    const toInput = document.querySelector(
        '.search-field input[placeholder="Paris (CDG)"]'
    );

    const searchButton = document.querySelector(".search-btn");
    const swapButton = document.querySelector(".swap");
    const dateInputs = document.querySelectorAll(
        '.search-field input[type="date"]'
    );

    const departureInput = dateInputs[0] || null;
    const returnInput = dateInputs[1] || null;

    const flightResults = document.querySelector("#flightResults");
    const resultsFrom = document.querySelector("#resultsFrom");
    const resultsTo = document.querySelector("#resultsTo");
    const resultsInfo = document.querySelector("#resultsInfo");
    const flightList = document.querySelector(".flight-list");

    const flightCards = Array.from(
        document.querySelectorAll(".flight-card")
    );

    const filterButtons = document.querySelectorAll(".filter-btn");

    const sortSelect =
        document.querySelector("#sortSelect") ||
        document.querySelector(".sort-select");

    const flightDetails = document.querySelector("#flightDetails");
    const backResults = document.querySelector(
        "#backResults, .back-results"
    );

    const selectedAirline = document.querySelector("#selectedAirline");
    const selectedFlightNumber = document.querySelector("#selectedFlightNumber");
    const selectedDeparture = document.querySelector("#selectedDeparture");
    const selectedArrival = document.querySelector("#selectedArrival");
    const selectedFrom = document.querySelector("#selectedFrom");
    const selectedTo = document.querySelector("#selectedTo");
    const selectedDuration = document.querySelector("#selectedDuration");
    const selectedPrice = document.querySelector("#selectedPrice");
    const bottomPrice = document.querySelector("#bottomPrice");

    const continueBooking = document.querySelector("#continueBooking");
    const bookingSection = document.querySelector("#bookingSection");
    const bookingAirline = document.querySelector("#bookingAirline");
    const bookingFlight = document.querySelector("#bookingFlight");
    const bookingDeparture = document.querySelector("#bookingDeparture");
    const bookingFrom = document.querySelector("#bookingFrom");
    const bookingArrival = document.querySelector("#bookingArrival");
    const bookingTo = document.querySelector("#bookingTo");
    const bookingPrice = document.querySelector("#bookingPrice");
    const bookingTotal = document.querySelector("#bookingTotal");

    const seatSelectionBtn = document.querySelector("#seatSelectionBtn");
    const seatSelectionSection = document.querySelector(
        "#seatSelectionSection"
    );
    const backPassenger = document.querySelector("#backPassenger");

    const seatAirline = document.querySelector("#seatAirline");
    const seatFlightNumber = document.querySelector("#seatFlightNumber");
    const seatDeparture = document.querySelector("#seatDeparture");
    const seatFrom = document.querySelector("#seatFrom");
    const seatArrival = document.querySelector("#seatArrival");
    const seatTo = document.querySelector("#seatTo");
    const seatDuration = document.querySelector("#seatDuration");
    const seatFlightPrice = document.querySelector("#seatFlightPrice");

    const selectedSeatDisplay = document.querySelector("#selectedSeat");
    const selectedSeatDescription = document.querySelector(
        "#selectedSeatDescription"
    );
    const seatBasePrice = document.querySelector("#seatBasePrice");
    const seatExtraPrice = document.querySelector("#seatPrice");
    const seatTotal = document.querySelector("#seatTotal");

    const summaryFrom = document.querySelector("#summaryFrom");
    const summaryTo = document.querySelector("#summaryTo");
    const summaryFlight = document.querySelector("#summaryFlight");
    const boardingSeat = document.querySelector("#boardingSeat");

    // PAYMENT ELEMENTS — FIXED
    const paymentSection = document.querySelector("#paymentSection");
    const paymentForm = document.querySelector("#paymentForm");
    const paymentBtn = document.querySelector("#paymentBtn");
    const returnToSeat = document.querySelector("#returnToSeat");
    const paymentMessage = document.querySelector("#paymentMessage");

    // =========================================
    // BOOKING VARIABLES
    // =========================================

    let selectedFlight = null;
    let selectedSeatElement = null;
    let selectedSeatPrice = 0;

    // =========================================
    // HELPER FUNCTIONS
    // =========================================

    function show(element) {
        if (element) element.style.display = "block";
    }

    function hide(element) {
        if (element) element.style.display = "none";
    }

    function setText(element, value) {
        if (element) {
            element.textContent =
                value === undefined || value === null ? "" : value;
        }
    }

    function getPriceNumber(value) {
        if (value === undefined || value === null) return 0;

        return (
            parseFloat(String(value).replace(/[^\d.]/g, "")) || 0
        );
    }

    function formatPrice(value) {
        return "€" + Number(value || 0).toFixed(0);
    }

    function parseDuration(durationText) {
        const text = String(durationText || "");

        const hoursMatch = text.match(/(\d+)\s*h/i);
        const minutesMatch = text.match(/(\d+)\s*m/i);

        const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

        return hours * 60 + minutes;
    }

    function scrollToElement(element) {
        if (!element) return;

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function getPrice(card) {
        if (!card) return 0;

        if (card.dataset.price) {
            return getPriceNumber(card.dataset.price);
        }

        const priceElement = card.querySelector(".flight-price strong");

        return priceElement
            ? getPriceNumber(priceElement.textContent)
            : 0;
    }

    function getDuration(card) {
        if (!card) return 0;

        if (card.dataset.duration) {
            return parseDuration(card.dataset.duration);
        }

        const durationElement = card.querySelector(".route-line > span");

        return durationElement
            ? parseDuration(durationElement.textContent)
            : 0;
    }

    // =========================================
    // INITIAL PAGE STATE
    // =========================================

    hide(flightDetails);
    hide(bookingSection);
    hide(seatSelectionSection);
    hide(paymentSection);

    // =========================================
    // TRIP TYPE BUTTONS
    // =========================================

    tripButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            tripButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            const tripType = button.textContent.trim().toLowerCase();

            if (returnInput) {
                if (tripType === "one way") {
                    returnInput.disabled = true;
                    returnInput.value = "";
                } else {
                    returnInput.disabled = false;
                }
            }

            console.log("Selected trip:", tripType);
        });
    });

    // =========================================
    // SWAP DEPARTURE AND DESTINATION
    // =========================================

    if (swapButton && fromInput && toInput) {
        swapButton.addEventListener("click", function (event) {
            event.preventDefault();

            const temporaryValue = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = temporaryValue;
        });
    }

  
    // =========================================
    // SEARCH FLIGHTS — DEMO ROUTES
    // =========================================

    function getAirportCode(value) {
        const text = String(value || "").trim().toLowerCase();

        const codeMatch = text.match(/\(([a-z]{3})\)/i);
        if (codeMatch) return codeMatch[1].toUpperCase();

        const aliases = {
            "casablanca": "CMN",
            "cmn": "CMN",
            "mohammed v airport": "CMN",
            "paris": "CDG",
            "cdg": "CDG",
            "france": "CDG",
            "dubai": "DXB",
            "dxb": "DXB",
            "istanbul": "IST",
            "ist": "IST",
            "barcelona": "BCN",
            "bcn": "BCN",
            "agadir": "AGA",
            "aga": "AGA",
            "london": "LHR",
            "lhr": "LHR",
            "new york": "JFK",
            "jfk": "JFK"
        };

        return aliases[text] || null;
    }

    const demoRoutes = {
        "CMN-CDG": [
            ["Royal Air Maroc", "AT 750", "09:20", "13:15", "3h 55m", 199],
            ["Air France", "AF 1497", "11:45", "15:50", "4h 05m", 229],
            ["Transavia", "TO 3021", "16:30", "20:50", "4h 20m", 179]
        ],
        "CMN-DXB": [
            ["Flightly Demo Air", "FL 201", "08:30", "19:10", "7h 40m", 320],
            ["Flightly Demo Air", "FL 203", "12:15", "22:55", "7h 40m", 350],
            ["Flightly Demo Air", "FL 205", "17:00", "03:40", "7h 40m", 295]
        ],
        "CMN-IST": [
            ["Flightly Demo Air", "FL 301", "09:00", "14:20", "4h 20m", 240],
            ["Flightly Demo Air", "FL 303", "13:30", "18:50", "4h 20m", 265],
            ["Flightly Demo Air", "FL 305", "19:15", "00:35", "4h 20m", 220]
        ],
        "CMN-BCN": [
            ["Flightly Demo Air", "FL 401", "08:00", "10:40", "2h 40m", 130],
            ["Flightly Demo Air", "FL 403", "12:30", "15:10", "2h 40m", 155],
            ["Flightly Demo Air", "FL 405", "18:00", "20:40", "2h 40m", 120]
        ]
    };

    // Also support searches back to Casablanca.
    ["CDG", "DXB", "IST", "BCN"].forEach(function (destination) {
        const original = demoRoutes["CMN-" + destination];

        demoRoutes[destination + "-CMN"] = original.map(function (flight, index) {
            return [
                flight[0],
                flight[1],
                ["08:00", "13:00", "18:00"][index],
                ["11:55", "16:55", "21:55"][index],
                flight[4],
                flight[5]
            ];
        });
    });

    function updateFlightCard(card, flight, fromCode, toCode) {
        const airline = flight[0];
        const number = flight[1];
        const departure = flight[2];
        const arrival = flight[3];
        const duration = flight[4];
        const price = flight[5];

        card.dataset.airline = airline;
        card.dataset.flight = number;
        card.dataset.departure = departure;
        card.dataset.from = fromCode;
        card.dataset.arrival = arrival;
        card.dataset.to = toCode;
        card.dataset.duration = duration;
        card.dataset.price = "€" + price;

        const airlineName = card.querySelector(".airline strong");
        const airlineNumber = card.querySelector(".airline span");
        const times = card.querySelectorAll(".airport-time strong");
        const airports = card.querySelectorAll(".airport-time span");
        const durationText = card.querySelector(".route-line > span");
        const priceText = card.querySelector(".flight-price strong");

        if (airlineName) airlineName.textContent = airline;
        if (airlineNumber) airlineNumber.textContent = number;

        if (times[0]) times[0].textContent = departure;
        if (times[1]) times[1].textContent = arrival;

        if (airports[0]) airports[0].textContent = fromCode;
        if (airports[1]) airports[1].textContent = toCode;

        if (durationText) durationText.textContent = duration;
        if (priceText) priceText.textContent = "€" + price;

        card.style.display = "";
    }

    if (searchButton && fromInput && toInput && flightResults) {
        searchButton.addEventListener("click", function (event) {
            event.preventDefault();

            const from = fromInput.value.trim();
            const to = toInput.value.trim();

            if (!from || !to) {
                alert("Please enter your departure and destination.");
                return;
            }

            const fromCode = getAirportCode(from);
            const toCode = getAirportCode(to);

            if (fromCode && toCode && fromCode === toCode) {
                alert("Departure and destination cannot be the same.");
                return;
            }

            if (
                departureInput &&
                departureInput.value &&
                returnInput &&
                !returnInput.disabled &&
                returnInput.value &&
                returnInput.value < departureInput.value
            ) {
                alert("The return date cannot be before the departure date.");
                return;
            }

            hide(flightDetails);
            hide(bookingSection);
            hide(seatSelectionSection);
            hide(paymentSection);

            show(flightResults);

            setText(resultsFrom, from);
            setText(resultsTo, to);

            const routeKey = fromCode && toCode
                ? fromCode + "-" + toCode
                : "";

            const flights = demoRoutes[routeKey];
            const cards = Array.from(
                document.querySelectorAll(".flight-card")
            );

            cards.forEach(function (card, index) {
                if (flights && flights[index]) {
                    updateFlightCard(
                        card,
                        flights[index],
                        fromCode,
                        toCode
                    );
                } else {
                    card.style.display = "none";
                }
            });

            if (flights) {
                setText(
                    resultsInfo,
                    "Showing 3 demo flights from " +
                    fromCode + " to " + toCode +
                    ". These are sample prices, not live offers."
                );
            } else {
                setText(
                    resultsInfo,
                    "No demo flights are available for this route yet. Try Casablanca to Paris, Dubai, Istanbul, or Barcelona."
                );
            }

            scrollToElement(flightResults);
        });
    }

    // =========================================
    // SORT FLIGHTS
    // =========================================

    function sortFlights(type) {
        if (!flightList) return;

        const sortedCards = [...flightCards];

        if (type === "price-low") {
            sortedCards.sort(function (a, b) {
                return getPrice(a) - getPrice(b);
            });
        } else if (type === "price-high") {
            sortedCards.sort(function (a, b) {
                return getPrice(b) - getPrice(a);
            });
        } else if (type === "duration") {
            sortedCards.sort(function (a, b) {
                return getDuration(a) - getDuration(b);
            });
        }

        sortedCards.forEach(function (card) {
            flightList.appendChild(card);
        });
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();

            filterButtons.forEach(function (btn) {
                btn.classList.remove("active-filter");
            });

            button.classList.add("active-filter");

            const filter = (
                button.dataset.filter || button.textContent
            ).toLowerCase().trim();

            if (filter.includes("cheap")) {
                sortFlights("price-low");
            } else if (filter.includes("fast")) {
                sortFlights("duration");
            } else {
                sortFlights("best");
            }
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            const value = String(sortSelect.value).toLowerCase().trim();

            if (value.includes("low") || value.includes("cheap")) {
                sortFlights("price-low");
            } else if (
                value.includes("high") ||
                value.includes("expensive")
            ) {
                sortFlights("price-high");
            } else if (
                value.includes("duration") ||
                value.includes("short")
            ) {
                sortFlights("duration");
            } else {
                sortFlights("best");
            }
        });
    }
        // =========================================
    // SELECT FLIGHT
    // =========================================

    function selectFlight(button) {
        if (!button) return;

        const card = button.closest(".flight-card");

        if (!card) {
            console.error("Flight card not found.");
            return;
        }

        function getValue(datasetValue, selector) {
            if (datasetValue) return datasetValue;

            const element = card.querySelector(selector);

            return element ? element.textContent.trim() : "";
        }

        const airportTimes = card.querySelectorAll(".airport-time strong");
        const airportNames = card.querySelectorAll(".airport-time span");

        const airline = getValue(
            card.dataset.airline,
            ".airline strong"
        );

        const flightNumber = getValue(
            card.dataset.flight,
            ".airline span"
        );

        const departure =
            card.dataset.departure ||
            (airportTimes[0] ? airportTimes[0].textContent.trim() : "");

        const arrival =
            card.dataset.arrival ||
            (airportTimes[1] ? airportTimes[1].textContent.trim() : "");

        const from =
            card.dataset.from ||
            (airportNames[0] ? airportNames[0].textContent.trim() : "");

        const to =
            card.dataset.to ||
            (airportNames[1] ? airportNames[1].textContent.trim() : "");

        const duration = getValue(
            card.dataset.duration,
            ".route-line > span"
        );

        const price = getValue(
            card.dataset.price,
            ".flight-price strong"
        );

        selectedFlight = {
            airline,
            flightNumber,
            departure,
            arrival,
            from,
            to,
            duration,
            price
        };

        console.log("Selected flight:", selectedFlight);

        // Update flight details
        setText(selectedAirline, airline);
        setText(selectedFlightNumber, flightNumber);
        setText(selectedDeparture, departure);
        setText(selectedArrival, arrival);
        setText(selectedFrom, from);
        setText(selectedTo, to);
        setText(selectedDuration, duration);
        setText(selectedPrice, price);
        setText(bottomPrice, price);

        // Update passenger booking summary
        setText(bookingAirline, airline);
        setText(bookingFlight, flightNumber);
        setText(bookingDeparture, departure);
        setText(bookingFrom, from);
        setText(bookingArrival, arrival);
        setText(bookingTo, to);
        setText(bookingPrice, price);
        setText(bookingTotal, price);

        // Reset the previous seat selection
        selectedSeatElement = null;
        selectedSeatPrice = 0;

        document.querySelectorAll(".seat.selected").forEach(function (seat) {
            seat.classList.remove("selected");
        });

        updateSeatFlightInformation();

        // Keep the results section visible
        show(flightResults);
        hide(bookingSection);
        hide(seatSelectionSection);
        hide(paymentSection);

        show(flightDetails);
        scrollToElement(flightDetails);
    }

    // Handle flight buttons, even after sorting
    document.addEventListener("click", function (event) {
        const button = event.target.closest(".select-flight");

        if (!button) return;

        event.preventDefault();
        selectFlight(button);
    });

    window.selectFlight = selectFlight;

    // =========================================
    // BACK TO FLIGHT RESULTS
    // =========================================

    if (backResults) {
        backResults.addEventListener("click", function (event) {
            event.preventDefault();

            hide(flightDetails);
            hide(bookingSection);
            hide(seatSelectionSection);
            hide(paymentSection);

            show(flightResults);
            scrollToElement(flightResults);
        });
    }

    // =========================================
    // CONTINUE TO PASSENGER INFORMATION
    // =========================================

    if (continueBooking) {
        continueBooking.addEventListener("click", function (event) {
            event.preventDefault();

            if (!selectedFlight) {
                alert("Please select a flight first.");
                return;
            }

            setText(bookingAirline, selectedFlight.airline);
            setText(bookingFlight, selectedFlight.flightNumber);
            setText(bookingDeparture, selectedFlight.departure);
            setText(bookingFrom, selectedFlight.from);
            setText(bookingArrival, selectedFlight.arrival);
            setText(bookingTo, selectedFlight.to);
            setText(bookingPrice, selectedFlight.price);
            setText(bookingTotal, selectedFlight.price);

            hide(flightDetails);
            hide(seatSelectionSection);
            hide(paymentSection);

            show(flightResults);
            show(bookingSection);

            scrollToElement(bookingSection);
        });
    }
        // =========================================
    // UPDATE SEAT AND FLIGHT INFORMATION
    // =========================================

    function updateSeatFlightInformation() {
        if (!selectedFlight) return;

        setText(seatAirline, selectedFlight.airline);
        setText(seatFlightNumber, selectedFlight.flightNumber);
        setText(seatDeparture, selectedFlight.departure);
        setText(seatFrom, selectedFlight.from);
        setText(seatArrival, selectedFlight.arrival);
        setText(seatTo, selectedFlight.to);
        setText(seatDuration, selectedFlight.duration);
        setText(seatFlightPrice, selectedFlight.price);

        setText(summaryFrom, selectedFlight.from);
        setText(summaryTo, selectedFlight.to);
        setText(summaryFlight, selectedFlight.flightNumber);

        setText(seatBasePrice, selectedFlight.price);
        setText(seatTotal, formatPrice(getPriceNumber(selectedFlight.price)));

        setText(selectedSeatDisplay, "—");
        setText(selectedSeatDescription, "Choose a seat to continue.");
        setText(seatExtraPrice, "€0");
        setText(boardingSeat, "—");
    }

    // =========================================
    // OPEN SEAT SELECTION
    // =========================================

    function openSeatSelection() {
        if (!selectedFlight) {
            alert("Please select a flight first.");
            return;
        }

        updateSeatFlightInformation();

        hide(flightDetails);
        hide(bookingSection);
        hide(paymentSection);

        show(flightResults);
        show(seatSelectionSection);

        scrollToElement(seatSelectionSection);
    }

    if (seatSelectionBtn) {
        seatSelectionBtn.addEventListener("click", function (event) {
            event.preventDefault();

            // Validate passenger details before seat selection.
            const requiredIds = [
                "firstName",
                "lastName",
                "email",
                "phone",
                "dateOfBirth",
                "nationality",
                "passport",
                "gender"
            ];

            let firstMissingField = null;

            for (const id of requiredIds) {
                const field = document.getElementById(id);

                if (!field || !String(field.value || "").trim()) {
                    firstMissingField = field;
                    break;
                }
            }

            if (firstMissingField) {
                alert("Please complete all required passenger information.");

                if (firstMissingField) {
                    firstMissingField.focus();
                }

                return;
            }

            const email = document.getElementById("email");

            if (!email || !email.validity.valid) {
                alert("Please enter a valid email address.");

                if (email) email.focus();

                return;
            }

            openSeatSelection();
        });
    }

    window.openSeatSelection = openSeatSelection;

    // =========================================
    // BACK TO PASSENGER INFORMATION
    // =========================================

    if (backPassenger) {
        backPassenger.addEventListener("click", function (event) {
            event.preventDefault();

            hide(seatSelectionSection);
            hide(paymentSection);

            show(bookingSection);
            scrollToElement(bookingSection);
        });
    }

    // =========================================
    // CREATE THE SEAT MAP
    // =========================================

    const seatMap = document.querySelector("#seatMap");

    if (seatMap && seatMap.children.length === 0) {
        const rows = 12;
        const columns = ["A", "B", "C", "D", "E", "F"];

        const occupiedSeats = [
            "1B",
            "2C",
            "3E",
            "5A",
            "6F",
            "8B",
            "9D"
        ];

        for (let row = 1; row <= rows; row++) {
            const rowElement = document.createElement("div");
            rowElement.className = "seat-row";

            columns.forEach(function (column, index) {
                // Create the aisle between seats C and D.
                if (index === 3) {
                    const aisle = document.createElement("div");
                    aisle.className = "aisle-space";
                    rowElement.appendChild(aisle);
                }

                const seat = document.createElement("button");
                const seatNumber = row + column;

                seat.type = "button";
                seat.className = "seat";
                seat.dataset.seat = seatNumber;
                seat.textContent = seatNumber;
                seat.setAttribute(
                    "aria-label",
                    "Seat " + seatNumber
                );

                // Rows 1 and 2 have premium seats.
                if (row <= 2) {
                    seat.classList.add("premium");
                    seat.dataset.price = "25";
                } else {
                    seat.dataset.price = "0";
                }

                // Mark occupied seats.
                if (occupiedSeats.includes(seatNumber)) {
                    seat.classList.add("occupied");
                    seat.disabled = true;
                    seat.setAttribute("aria-label", seatNumber + ", occupied");
                }

                rowElement.appendChild(seat);
            });

            seatMap.appendChild(rowElement);
        }
    }

    // =========================================
    // HANDLE SEAT SELECTION
    // =========================================

    document.addEventListener("click", function (event) {
        const seat = event.target.closest(".seat");

        if (!seat || !seatMap || !seatMap.contains(seat)) return;
        if (seat.disabled) return;

        event.preventDefault();

        if (!selectedFlight) {
            alert("Please select a flight first.");
            return;
        }

        // Clear the previous selection.
        seatMap.querySelectorAll(".seat.selected").forEach(function (oldSeat) {
            oldSeat.classList.remove("selected");
        });

        // Select this seat.
        seat.classList.add("selected");

        selectedSeatElement = seat;
        selectedSeatPrice = Number(seat.dataset.price || 0);

        const seatNumber = seat.dataset.seat;

        setText(selectedSeatDisplay, seatNumber);
        setText(boardingSeat, seatNumber);

        if (selectedSeatPrice > 0) {
            setText(
                selectedSeatDescription,
                "Premium seat · Extra comfort · +" +
                    formatPrice(selectedSeatPrice)
            );
        } else {
            setText(
                selectedSeatDescription,
                "Economy seat · Standard comfort"
            );
        }

        const basePrice = getPriceNumber(selectedFlight.price);
        const total = basePrice + selectedSeatPrice;

        setText(seatExtraPrice, formatPrice(selectedSeatPrice));
        setText(seatTotal, formatPrice(total));

        console.log("Selected seat:", seatNumber);
        console.log("Booking total:", formatPrice(total));
    });
        // =========================================
    // PAYMENT PAGE — DEMO ONLY
    // =========================================

    function openPaymentPage() {
        if (!selectedFlight) {
            alert("Please select a flight first.");
            return;
        }

        if (!selectedSeatElement) {
            alert("Please select a seat before continuing.");
            return;
        }

        const firstName = document.querySelector("#firstName");
        const lastName = document.querySelector("#lastName");
        const email = document.querySelector("#email");

        const requiredFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "dateOfBirth",
            "nationality",
            "passport",
            "gender"
        ];

        for (const id of requiredFields) {
            const field = document.getElementById(id);

            if (!field || !String(field.value || "").trim()) {
                alert("Please complete all required passenger information.");

                hide(seatSelectionSection);
                show(bookingSection);
                scrollToElement(bookingSection);

                if (field) field.focus();

                return;
            }
        }

        if (!email || !email.validity.valid) {
            alert("Please enter a valid email address.");

            if (email) email.focus();

            return;
        }

        const passengerName =
            firstName.value.trim() + " " + lastName.value.trim();

        const seatNumber = selectedSeatElement.dataset.seat;
        const flightPrice = getPriceNumber(selectedFlight.price);
        const total = flightPrice + selectedSeatPrice;

        // Update payment summary.
        setText(
            document.querySelector("#paymentFrom"),
            selectedFlight.from
        );

        setText(
            document.querySelector("#paymentTo"),
            selectedFlight.to
        );

        setText(
            document.querySelector("#paymentDeparture"),
            selectedFlight.departure
        );

        setText(
            document.querySelector("#paymentArrival"),
            selectedFlight.arrival
        );

        setText(
            document.querySelector("#paymentAirline"),
            selectedFlight.airline
        );

        setText(
            document.querySelector("#paymentFlightNumber"),
            selectedFlight.flightNumber
        );

        setText(
            document.querySelector("#paymentPassenger"),
            passengerName
        );

        setText(
            document.querySelector("#paymentSeat"),
            seatNumber
        );

        setText(
            document.querySelector("#paymentFlightPrice"),
            formatPrice(flightPrice)
        );

        setText(
            document.querySelector("#paymentSeatPrice"),
            formatPrice(selectedSeatPrice)
        );

        setText(
            document.querySelector("#paymentTotal"),
            formatPrice(total)
        );

        if (paymentMessage) {
            paymentMessage.textContent = "";
        }

        // Show payment section.
        hide(flightDetails);
        hide(bookingSection);
        hide(seatSelectionSection);

        show(paymentSection);
        scrollToElement(paymentSection);
    }

    // FIX: Explicitly connect the payment button.
    if (paymentBtn) {
        paymentBtn.addEventListener("click", function (event) {
            event.preventDefault();
            openPaymentPage();
        });
    }

    // =========================================
    // RETURN TO SEAT SELECTION
    // =========================================

    if (returnToSeat) {
        returnToSeat.addEventListener("click", function (event) {
            event.preventDefault();

            hide(paymentSection);
            show(seatSelectionSection);

            scrollToElement(seatSelectionSection);
        });
    }

    // =========================================
    // DEMO BOOKING CONFIRMATION
    // NO REAL PAYMENT IS PROCESSED
    // =========================================

    if (paymentForm) {
        paymentForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!paymentForm.checkValidity()) {
                paymentForm.reportValidity();
                return;
            }

            if (!selectedFlight || !selectedSeatElement) {
                if (paymentMessage) {
                    paymentMessage.textContent =
                        "Please select a flight and seat first.";
                    paymentMessage.style.display = "block";
                    paymentMessage.style.color = "#dc2626";
                }
                return;
            }

            const flightPrice = getPriceNumber(selectedFlight.price);
            const total = flightPrice + selectedSeatPrice;

            if (paymentMessage) {
                paymentMessage.textContent =
                    "Demo booking confirmed! No payment was processed.";

                paymentMessage.style.display = "block";
                paymentMessage.style.visibility = "visible";
                paymentMessage.style.color = "#16a34a";
                paymentMessage.classList.add("success");
                paymentMessage.setAttribute("role", "status");

                paymentMessage.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            } else {
                alert(
                    "Demo booking confirmed! No payment was processed."
                );
            }

            console.log("Flightly demo booking confirmed.", {
                flight: selectedFlight.flightNumber,
                seat: selectedSeatElement.dataset.seat,
                total: total
            });
        });
    }

    console.log("✈️ Flightly booking system is ready.");
 });