console.log("✔ script.js chargé !");

let currentDate = new Date();
let currentSchedule = {}; // Stockage des créneaux du mois en cours
let noScheduleMode = false;

// // Configuration par défaut si le fichier JSON n'est pas disponible
// const defaultWeeklySchedule = {
//     1: [], // Lundi fermé
//     2: [{ start: "16h00", end: "18h00" }], // Mardi
//     3: [], // Mercredi fermé
//     4: [], // Jeudi fermé
//     5: [{ start: "16h00", end: "22h00" }], // Vendredi
//     6: [{ start: "10h30", end: "12h30" }, { start: "18h00", end: "22h00" }], // Samedi
//     0: [] // Dimanche fermé
// };

const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

async function loadMonthSchedule(year, month) {
    const monthStr = String(month + 1).padStart(2, '0');
    const filename = `data/horaires-${year}-${monthStr}.json`;

    try {
        const response = await fetch(filename);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            return null;
        }
    } catch (error) {
        console.warn(`Erreur lors du chargement de ${filename}:`, error);
        return null;
    }
}

// // Génère un planning par défaut basé sur les horaires hebdomadaires
// function generateDefaultSchedule(year, month) {
//     const schedule = {
//         year: year,
//         month: month + 1,
//         monthName: monthNames[month],
//         defaultWeekly: defaultWeeklySchedule,
//         specificDates: {},
//         events: []
//     };

//     // Ajouter quelques événements d'exemple pour le mois actuel
//     if (year === 2025 && month === 6) { // Juillet 2025
//         schedule.specificDates = {
//             "25": [{ start: "18h00", end: "01h00", note: "Soirée karaoké" }],
//             "26": [{ start: "16h00", end: "01h00", note: "Tournoi baby-foot" }]
//         };
//     }

//     return schedule;
// }

function getScheduleForDate(date) {
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    
    // Vérifier s'il y a des créneaux spécifiques pour cette date
    if (currentSchedule.specificDates && currentSchedule.specificDates[dayOfMonth]) {
        return currentSchedule.specificDates[dayOfMonth];
    }
    
    // Utiliser les créneaux hebdomadaires par défaut
    if (currentSchedule.defaultWeekly && currentSchedule.defaultWeekly[dayOfWeek]) {
        return currentSchedule.defaultWeekly[dayOfWeek];
    }
    
    return [];
}

function isOpenAtTime(date, currentHour) {
    const schedule = getScheduleForDate(date);
    for (let slot of schedule) {
        const startHour = parseTimeToHours(slot.start);
        const endHour = parseTimeToHours(slot.end);
        if (currentHour >= startHour && currentHour <= endHour) {
            return true;
        }
    }
    return false;
}

function parseTimeToHours(timeStr) {
    const [hours, minutes = 0] = timeStr.replace('h', ':').split(':').map(Number);
    return hours + (minutes / 60);
}

// Fonction permettant de naviguer entre les mois
async function changeMonth(direction) {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);

    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();

    currentDate = new Date(newYear, newMonth, 1);
    await loadAndDisplayCalendar();
}

// Fonction permettant d'éfficher 'N.C' sur tous les jours
function displayNoSchedule(year, month) {
    alert("On entre dans la focntion displayNoSchudle")
    const calendarElement = document.getElementById('calendarGrid');
    calendarElement.innerHTML = ''; // vider calendrier

    // crée des cases avec "N.C"
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day nc-day';
        dayDiv.textContent = day + " : N.C";
        calendarElement.appendChild(dayDiv);
    }

    // Mettre à jour l'en-tête du mois
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;
}

async function loadAndDisplayCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const schedule = await loadMonthSchedule(year, month);
    if (!schedule) {
        noScheduleMode = true;
        currentSchedule = {}; // pour éviter les erreurs
    } else {
        noScheduleMode = false;
        currentSchedule = schedule;
    }

    generateCalendar();
    updateEventsDisplay();
}

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Mettre à jour l'en-tête du mois
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;

    // Calculer le premier jour du mois et le nombre de jours
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

    // Effacer le calendrier existant (garder les en-têtes)
    const calendarGrid = document.getElementById('calendarGrid');
    const existingDays = calendarGrid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());

    const today = new Date();
    const todayStr = today.toDateString();

    // Ajouter les jours du mois précédent
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        const dayDate = new Date(year, month - 1, dayNum);
        const dayElement = createDayElement(dayNum, dayDate, true);
        calendarGrid.appendChild(dayElement);
    }

    // Ajouter les jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const isToday = dayDate.toDateString() === todayStr;
        const dayElement = createDayElement(day, dayDate, false, isToday);
        calendarGrid.appendChild(dayElement);
    }

    // Ajouter les jours du mois suivant pour compléter la grille
    const totalCells = calendarGrid.children.length - 7; // -7 pour les en-têtes
    const remainingCells = 42 - totalCells; // Grille de 6 semaines
    for (let day = 1; day <= remainingCells; day++) {
        const dayDate = new Date(year, month + 1, day);
        const dayElement = createDayElement(day, dayDate, true);
        calendarGrid.appendChild(dayElement);
    }
}

function createDayElement(dayNumber, date, isOtherMonth, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
    
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = dayNumber;
    dayElement.appendChild(dayNumberElement);

    if (!isOtherMonth) {
        if (noScheduleMode) {
            const ncElement = document.createElement('div');
            ncElement.className = 'nc-day';
            ncElement.textContent = 'N.C.';
            dayElement.appendChild(ncElement);
        } else {
            const schedule = getScheduleForDate(date);
            
            if (schedule.length > 0) {
                const slotsContainer = document.createElement('div');
                slotsContainer.className = 'opening-slots';
                
                schedule.forEach(slot => {
                    const slotElement = document.createElement('div');
                    slotElement.className = 'time-slot';
                    slotElement.textContent = `${slot.start}-${slot.end}`;
                    
                    // Ajouter une note si disponible
                    if (slot.note) {
                        slotElement.title = slot.note;
                        slotElement.style.background = 'linear-gradient(135deg, #ed8936, #dd6b20)';
                    }
                    
                    slotsContainer.appendChild(slotElement);
                });
                
                dayElement.appendChild(slotsContainer);
            } else {
                const closedElement = document.createElement('div');
                closedElement.className = 'closed-day';
                closedElement.textContent = 'Fermé';
                dayElement.appendChild(closedElement);
            }
        }
    }
    return dayElement;
}

function updateEventsDisplay() {
    const eventsContainer = document.getElementById('events');
    
    if (currentSchedule.events && currentSchedule.events.length > 0) {
        eventsContainer.innerHTML = '';
        currentSchedule.events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            eventElement.innerHTML = `
                <div class="event-date">${event.date}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-time">${event.time}</div>
                <div class="event-description">${event.description}</div>
            `;
            eventsContainer.appendChild(eventElement);
        });
    }
}

function updateCurrentStatus() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const statusElement = document.getElementById('currentStatus');
    
    if (isOpenAtTime(now, currentHour)) {
        statusElement.className = 'status-indicator open';
        statusElement.innerHTML = '<span class="status-dot"></span><span>Ouvert</span>';
    } else {
        statusElement.className = 'status-indicator closed-status';
        statusElement.innerHTML = '<span class="status-dot"></span><span>Fermé</span>';
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    document.getElementById('lastUpdate').textContent = now.toLocaleDateString('fr-FR', options);
}

// Fonction pour déterminer s'il existe un fichier json pour l'année et le mois passés en paramètre
async function checkIfMonthFileExists(year, monthZeroBased) {
    const monthStr = String(monthZeroBased + 1).padStart(2, '0');
    const filename = `data/horaires-${year}-${monthStr}.json`;
    try {
        const response = await fetch(filename, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.warn(`Erreur lors de la vérification de ${filename} :`, error);
        return false;
    }
}

// Initialisation
loadAndDisplayCalendar();
updateCurrentStatus();
updateLastUpdateTime();

// Mise à jour du statut toutes les minutes
setInterval(updateCurrentStatus, 60000);

// Rendre les fonctions disponibles globalement pour les boutons
window.changeMonth = changeMonth;
