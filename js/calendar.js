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
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth
    
    
    
    
