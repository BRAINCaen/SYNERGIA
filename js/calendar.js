// Variables pour le calendrier
let currentDate = new Date();
let events = [];

// Initialiser le calendrier
function initCalendar() {
    // Charger les événements depuis Firestore
    loadEvents();
    
    // Configurer les boutons de navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Configurer le bouton d'ajout d'événement
    document.getElementById('add-event').addEventListener('click', openEventModal);
    
    // Configurer le bouton de fermeture de la modal
    document.getElementById('close-event-modal').addEventListener('click', () => {
        document.getElementById('event-modal').classList.add('hidden');
    });
    
    // Configurer le formulaire d'ajout d'événement
    document.getElementById('event-form').addEventListener('submit', handleEventFormSubmit);
    
    // Afficher le calendrier
    renderCalendar();
}

// Charger les événements depuis Firestore
async function loadEvents() {
    try {
        const eventsSnapshot = await db.collection('events').get();
        events = [];
        
        eventsSnapshot.forEach(doc => {
            const eventData = doc.data();
            events.push({
                id: doc.id,
                title: eventData.title,
                date: new Date(eventData.date),
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                description: eventData.description,
                attendees: eventData.attendees || [],
                createdBy: eventData.createdBy
            });
        });
        
        // Mettre à jour l'interface
        renderCalendar();
        renderEventsList();
    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
    }
}

// Afficher le calendrier
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Mise à jour du titre du mois
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Générer les jours du calendrier
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // Premier jour du mois (0-6, 0 est dimanche)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Ajuster pour que la semaine commence le lundi (0-6, 0 est lundi)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Ajouter les cases vides pour les jours avant le 1er du mois
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day', 'empty');
        calendarDays.appendChild(emptyDay);
    }
    
    // Ajouter les jours du mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDate = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.textContent = i;
        
        // Marquer le jour actuel
        if (year === currentDate.getFullYear() && 
            month === currentDate.getMonth() && 
            i === currentDate.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Vérifier si des événements existent pour cette date
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (events[dateStr] && events[dateStr].length > 0) {
            const eventIndicator = document.createElement('div');
            eventIndicator.classList.add('event-indicator');
            dayElement.appendChild(eventIndicator);
            
            // Ajouter un attribut data-date pour identifier facilement la date
            dayElement.setAttribute('data-date', dateStr);
            
            // Ajouter un événement de clic pour afficher les événements de cette date
            dayElement.addEventListener('click', () => {
                showEventsForDate(dateStr);
            });
        }
        
        calendarDays.appendChild(dayElement);
    }
}

// Fonction pour afficher les événements d'une date spécifique
function showEventsForDate(dateStr) {
    const eventsContainer = document.getElementById('events-list');
    eventsContainer.innerHTML = '';
    
    if (events[dateStr] && events[dateStr].length >

            // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Jours du mois précédent pour compléter la première semaine
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    // Créer les cellules vides pour les jours du mois précédent
    for (let i = 0; i < startDay; i++) {
        const dayNumber = daysInPrevMonth - startDay + i + 1;
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day prev-month';
        dayCell.textContent = dayNumber;
        calendarDays.appendChild(dayCell);
    }
    
    // Créer les cellules pour les jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = i;
        
        // Vérifier si c'est aujourd'hui
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }
        
        // Ajouter les événements du jour s'il y en a
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.date === dateString);
        
        if (dayEvents.length > 0) {
            dayCell.classList.add('has-events');
            
            // Ajouter un indicateur d'événements
            const eventIndicator = document.createElement('span');
            eventIndicator.className = 'event-indicator';
            eventIndicator.textContent = dayEvents.length;
            dayCell.appendChild(eventIndicator);
            
            // Ajouter un gestionnaire d'événements pour afficher les détails
            dayCell.addEventListener('click', () => {
                showDayEvents(dateString, dayEvents);
            });
        }
        
        calendarDays.appendChild(dayCell);
    }
    
    // Calculer le nombre de cellules nécessaires pour compléter la dernière semaine
    const totalCells = startDay + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    
    // Ajouter les jours du mois suivant si nécessaire
    if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day next-month';
            dayCell.textContent = i;
            calendarDays.appendChild(dayCell);
        }
    }
    
    // Mettre à jour l'affichage du mois actuel
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
}

// Afficher les événements pour un jour donné
function showDayEvents(date, dayEvents) {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    const dateObj = new Date(date);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formattedDate = dateObj.toLocaleDateString('fr-FR', options);
    
    const dateHeader = document.createElement('h4');
    dateHeader.textContent = formattedDate;
    eventsList.appendChild(dateHeader);
    
    dayEvents.forEach(event => {
        const eventTemplate = document.getElementById('event-item-template');
        const eventItem = document.importNode(eventTemplate.content, true);
        
        eventItem.querySelector('.event-title').textContent = event.title;
        eventItem.querySelector('.event-time').textContent = `${event.startTime} - ${event.endTime}`;
        eventItem.querySelector('.event-participants').textContent = formatParticipants(event.participants);
        eventItem.querySelector('.event-dot').style.backgroundColor = getEventColor(event.type);
        
        eventsList.appendChild(eventItem);
    });
}

// Formater la liste des participants
function formatParticipants(participants) {
    if (participants.includes('all')) {
        return 'Toute l\'équipe';
    } else {
        const memberNames = {
            'paris': 'Paris Amélie',
            'red': 'Red Houlette',
            'leo': 'Léo Mercier',
            'polar': 'Polar Caron',
            'allan': 'Allan Boehme'
        };
        
        return participants.map(p => memberNames[p] || p).join(', ');
    }
}

// Obtenir une couleur en fonction du type d'événement
function getEventColor(type) {
    const colors = {
        'meeting': '#7e57c2',
        'shift': '#26c6da',
        'training': '#66bb6a',
        'event': '#ffca28',
        'personal': '#ef5350'
    };
    
    return colors[type] || '#7e57c2';
}

// Ajouter un nouvel événement
function addEvent() {
    // Afficher la modale d'ajout d'événement
    const modal = document.getElementById('event-modal');
    modal.classList.remove('hidden');
    
    // Mettre la date actuelle par défaut
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('event-date').value = formattedDate;
}

// Initialiser les gestionnaires d'événements
function initEventListeners() {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
    });
    
    const addEventBtn = document.getElementById('add-event');
    addEventBtn.addEventListener('click', addEvent);
    
    const closeEventModalBtn = document.getElementById('close-event-modal');
    closeEventModalBtn.addEventListener('click', () => {
        document.getElementById('event-modal').classList.add('hidden');
    });
    
    const eventForm = document.getElementById('event-form');
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;
        const description = document.getElementById('event-description').value;
        
        const selectElement = document.getElementById('event-attendees');
        const participants = Array.from(selectElement.selectedOptions).map(option => option.value);
        
        // Créer un nouvel événement
        const newEvent = {
            id: Date.now().toString(),
            title,
            date,
            startTime,
            endTime,
            description,
            participants,
            type: 'meeting', // Type par défaut
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter l'événement à Firebase
        db.collection('events').add(newEvent)
            .then(() => {
                // Fermer la modale et recharger le calendrier
                document.getElementById('event-modal').classList.add('hidden');
                eventForm.reset();
                loadEvents();
                
                // Afficher une notification
                showNotification('Événement créé', `L'événement "${title}" a été ajouté au calendrier.`);
            })
            .catch(error => {
                console.error('Erreur lors de la création de l\'événement:', error);
                showNotification('Erreur', 'Impossible de créer l\'événement, veuillez réessayer.');
            });
    });
}

// Charger les événements depuis Firebase
function loadEvents() {
    db.collection('events')
        .get()
        .then(snapshot => {
            events = [];
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
            
            renderCalendar(currentYear, currentMonth);
            renderUpcomingEvents();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des événements:', error);
        });
}

// Afficher les prochains événements
function renderUpcomingEvents() {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Filtrer les événements à venir (aujourd'hui et après)
    const upcomingEvents = events
        .filter(event => event.date >= todayString)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    
    // Afficher les 5 prochains événements
    const eventsToShow = upcomingEvents.slice(0, 5);
    
    if (eventsToShow.length === 0) {
        const noEvents = document.createElement('p');
        noEvents.className = 'no-events';
        noEvents.textContent = 'Aucun événement à venir';
        eventsList.appendChild(noEvents);
        return;
    }
    
    eventsToShow.forEach(event => {
        const eventTemplate = document.getElementById('event-item-template');
        const eventItem = document.importNode(eventTemplate.content, true);
        
        const dateObj = new Date(event.date);
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        const formattedDate = dateObj.toLocaleDateString('fr-FR', options);
        
        eventItem.querySelector('.event-title').textContent = event.title;
        eventItem.querySelector('.event-time').textContent = `${formattedDate}, ${event.startTime}`;
        eventItem.querySelector('.event-participants').textContent = formatParticipants(event.participants);
        eventItem.querySelector('.event-dot').style.backgroundColor = getEventColor(event.type);
        
        eventsList.appendChild(eventItem);
    });
}

// Initialisation
let events = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si la page du calendrier est active
    if (!document.getElementById('calendar-days')) return;
    
    initEventListeners();
    loadEvents();
});

// Exporter les fonctions
export default {
    renderCalendar,
    loadEvents,
    initCalendarPage: () => {
        initEventListeners();
        loadEvents();
    }
};
