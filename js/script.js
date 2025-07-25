// Script JavaScript pour mon projet
let currentDate = new Date();
let currentSchedule = {}; // Stockage des créneaux du mois en cours
let noScheduleMode = false;

const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

// Fonction pour ajuster la hauteur de la carte contenant la liste des événements
function adjustTwoCardsHeight() {
  const cardLeft = document.getElementById('card-left');
  const cardRight = document.getElementById('card-right');

  if (!cardLeft) {
    alert("card-left not found");
    return;
  }
  if (!cardRight) {
    alert("card-right not found");
    return;
  }

  // Remet la hauteur à auto pour bien recalculer la hauteur naturelle de la carte gauche
  cardLeft.style.height = 'auto';
    
  // Récupère la hauteur de la carte gauche
  const leftHeight = cardLeft.offsetHeight;

  // Applique cette hauteur fixe à la carte droite
  cardRight.style.height = leftHeight + 'px';

  // On force le débordement vertical à être scrollable (scrollbar si contenu dépasse)
  cardRight.style.overflowY = 'auto';
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

// Fonction pour activer le 'swipe' sur mobile
function enableMobileMonthSwipe() {
  if (!window.matchMedia("(max-width: 768px)").matches) return;

  let startX = 0;

  const header = document.querySelector('.calendar-header');
  header.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  header.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 50) {
      changeMonth(diff < 0 ? 1 : -1);
    }
  });
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

// Retourne une string AAAA-MM-JJ basée sur la date locale
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Récupère les créneaux du jour (spécifiques si présents, sinon hebdo)
function getScheduleForDate(date) {
  const dayOfWeek = date.getDay().toString();
  const dayOfMonth = date.getDate().toString();
  if (!currentSchedule) return [];

  // ✅ Si la date est présente dans specificDates (même avec []), on considère cette date
  if (currentSchedule.specificDates && currentSchedule.specificDates.hasOwnProperty(dayOfMonth)) {
    const specific = currentSchedule.specificDates[dayOfMonth];
    return specific || [];
  }

  // Sinon, on applique la logique hebdomadaire
  if (currentSchedule.defaultWeekly && currentSchedule.defaultWeekly.hasOwnProperty(dayOfWeek)) {
    const weekly = currentSchedule.defaultWeekly[dayOfWeek];
    return weekly || [];
  }

  return [];
}

function isOpenAtTime(date, currentHour) {

    const schedule = getScheduleForDate(date);

    for (let slot of schedule) {
        const startHour = parseTimeToHours(slot.start);
        const endHour = parseTimeToHours(slot.end);

        if (currentHour >= startHour && currentHour <= endHour) {
            console.log("✅ Dans le créneau !");
            return true;
        }
    }
    return false;
}

// Indique si l'heure actuelle est dans un créneau ouvert
function isOpenNow(date = new Date()) {
  const currentHour = date.getHours() + date.getMinutes() / 60;
  const schedule = getScheduleForDate(date);

  for (const slot of schedule) {
    const start = parseTimeToHours(slot.start);
    const end = parseTimeToHours(slot.end);

    if (currentHour >= start && currentHour < end) {
      console.log("✅ Dans le créneau !");
      return true;
    }
  }
  return false;
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
    adjustTwoCardsHeight();
}
async function loadMonthSchedule(year, month) {
    const monthStr = String(month + 1).padStart(2, '0');
    // const filename = `data/horaires-${year}-${monthStr}.json`;
    const filename = `data/horaires-${year}-${monthStr}.json?cache_bust=${new Date().getTime()}`;

    try {
      const response = await fetch(filename);

      if (response.status !== 200) {
        console.warn(`Fichier non trouvé : ${filename} (status ${response.status})`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur fetch ${filename} :`, error);
      return null;
    }
}

// Convertit une chaîne "16h00" en heure décimale 16.0, "23h15" → 23.25
function parseTimeToHours(timeStr) {
  const [hourStr, minStr] = timeStr.split("h");
  const hour = parseInt(hourStr, 10);
  const min = minStr ? parseInt(minStr, 10) : 0;
  return hour + min / 60;
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

function updateEventsDisplay() {
    const eventsContainer = document.getElementById('events');
    eventsContainer.innerHTML = '';

    if (currentSchedule.events && currentSchedule.events.length > 0) {
        currentSchedule.events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            eventElement.innerHTML = `
                <div class="event-header">
                    <div class="event-date">${event.date}</div>
                    <div class="event-time">${event.time}</div>
                </div>
                <div class="event-title">${event.title}</div>
                <div class="event-description">${event.description}</div>
            `;
            eventsContainer.appendChild(eventElement);
        });
    }else{
      // Cas où il n'y a pas d'événements
        const noEventElement = document.createElement('div');
        noEventElement.className = 'event';
        noEventElement.innerHTML = `
            <div class="event-title" style="color:#666; font-style: italic;">
                Aucune animation programmée.
            </div>
        `;
        eventsContainer.appendChild(noEventElement);
    }
}

// Initialisation avec chargement correct des horaires avant de tester l'ouverture
(async function init() {
  await loadAndDisplayCalendar();   // ← Assure que currentSchedule est prêt
  updateCurrentStatus();            // ← Vérifie le statut avec les données chargées

  // Mise à jour du statut toutes les minutes
  setInterval(updateCurrentStatus, 60000);
})();

// Mise à jour du statut toutes les minutes
setInterval(updateCurrentStatus, 60000);

// Rendre les fonctions disponibles globalement pour les boutons
window.changeMonth = changeMonth;

// Ajuster la hauteur des cartes au redimensionnement de la fenêtre
window.addEventListener('load', () => {
  // Tu peux attendre un petit délai pour laisser les cartes se charger
  setTimeout(adjustTwoCardsHeight, 50);
  enableMobileMonthSwipe();
});

window.addEventListener('resize', () =>{
    adjustTwoCardsHeight();
    enableMobileMonthSwipe();
})

document.addEventListener("DOMContentLoaded", function () {
  if (window.matchMedia("(max-width: 768px)").matches) {
    const container = document.querySelector(".main-content");
    container.scrollLeft = 0; // Toujours afficher la card de gauche d'abord
  }
});

