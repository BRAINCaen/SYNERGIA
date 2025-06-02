// js/modules/planning/planning-manager.js
// Gestionnaire du planning et calendrier

class PlanningManager {
    constructor() {
        this.shifts = new Map();
        this.events = new Map();
        this.absences = new Map();
        this.unsubscribers = [];
        this.currentView = 'week';
        this.currentDate = new Date();
        this.isReady = false;
        this.init();
    }

    async init() {
        await window.firebaseManager.waitForReady();
        
        // Charger les données initiales
        this.subscribeToShifts();
        this.subscribeToEvents();
        this.subscribeToAbsences();
        
        this.isReady = true;
        console.log('✅ PlanningManager initialisé');
    }

    // Abonnements temps réel
    subscribeToShifts() {
        // Calculer la plage de dates à surveiller (semaine actuelle + suivante)
        const startDate = this.getWeekStart(this.currentDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14);

        const unsubscribe = window.firebaseManager.collection('shifts')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .orderBy('date')
            .orderBy('startTime')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const shift = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.shifts.set(shift.id, shift);
                        this.notifyUpdate('shift:updated', shift);
                    } else if (change.type === 'removed') {
                        this.shifts.delete(shift.id);
                        this.notifyUpdate('shift:removed', shift);
                    }
                });
                
                this.notifyUpdate('shifts:updated', this.getShifts());
            });

        this.unsubscribers.push(unsubscribe);
    }

    subscribeToEvents() {
        const unsubscribe = window.firebaseManager.collection('events')
            .where('date', '>=', new Date())
            .orderBy('date')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const event = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.events.set(event.id, event);
                        this.notifyUpdate('event:updated', event);
                    } else if (change.type === 'removed') {
                        this.events.delete(event.id);
                        this.notifyUpdate('event:removed', event);
                    }
                });
                
                this.notifyUpdate('events:updated', this.getEvents());
            });

        this.unsubscribers.push(unsubscribe);
    }

    subscribeToAbsences() {
        const unsubscribe = window.firebaseManager.collection('absences')
            .where('status', 'in', ['pending', 'approved'])
            .orderBy('startDate')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const absence = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.absences.set(absence.id, absence);
                        this.notifyUpdate('absence:updated', absence);
                    } else if (change.type === 'removed') {
                        this.absences.delete(absence.id);
                        this.notifyUpdate('absence:removed', absence);
                    }
                });
                
                this.notifyUpdate('absences:updated', this.getAbsences());
            });

        this.unsubscribers.push(unsubscribe);
    }

    // Gestion des shifts
    async createShift(shiftData) {
        try {
            // Validation
            if (!shiftData.employeeId || !shiftData.date || !shiftData.startTime || !shiftData.endTime) {
                throw new Error('Données manquantes pour créer le shift');
            }

            // Vérifier les conflits
            const conflicts = await this.checkShiftConflicts(shiftData);
            if (conflicts.length > 0) {
                throw new Error(`Conflit détecté: ${conflicts[0].message}`);
            }

            // Préparer les données
            const shift = {
                employeeId: shiftData.employeeId,
                date: this.toFirebaseDate(shiftData.date),
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                position: shiftData.position || 'default',
                breakDuration: shiftData.breakDuration || 60, // minutes
                status: 'scheduled',
                notes: shiftData.notes || '',
                createdBy: window.firebaseManager.currentUser?.uid,
                createdAt: window.firebaseManager.timestamp(),
                isRecurring: shiftData.isRecurring || false,
                recurringEndDate: shiftData.recurringEndDate || null
            };

            // Créer le shift
            const docRef = await window.firebaseManager.collection('shifts').add(shift);
            shift.id = docRef.id;

            // Si récurrent, créer les autres occurrences
            if (shift.isRecurring && shift.recurringEndDate) {
                await this.createRecurringShifts(shift);
            }

            // Analytics
            this.logAnalytics('shift_created', {
                shiftId: shift.id,
                employeeId: shift.employeeId
            });

            return shift;
        } catch (error) {
            console.error('❌ Erreur création shift:', error);
            throw error;
        }
    }

    async updateShift(shiftId, updates) {
        try {
            // Validation des conflits si changement d'horaire
            if (updates.date || updates.startTime || updates.endTime || updates.employeeId) {
                const currentShift = this.shifts.get(shiftId);
                const newShiftData = { ...currentShift, ...updates };
                
                const conflicts = await this.checkShiftConflicts(newShiftData, shiftId);
                if (conflicts.length > 0) {
                    throw new Error(`Conflit détecté: ${conflicts[0].message}`);
                }
            }

            // Mettre à jour
            const cleanUpdates = {};
            if (updates.date) cleanUpdates.date = this.toFirebaseDate(updates.date);
            if (updates.startTime) cleanUpdates.startTime = updates.startTime;
            if (updates.endTime) cleanUpdates.endTime = updates.endTime;
            if (updates.position) cleanUpdates.position = updates.position;
            if (updates.breakDuration !== undefined) cleanUpdates.breakDuration = updates.breakDuration;
            if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
            
            cleanUpdates.updatedAt = window.firebaseManager.timestamp();
            cleanUpdates.updatedBy = window.firebaseManager.currentUser?.uid;

            await window.firebaseManager.collection('shifts').doc(shiftId).update(cleanUpdates);

            return true;
        } catch (error) {
            console.error('❌ Erreur mise à jour shift:', error);
            throw error;
        }
    }

    async deleteShift(shiftId) {
        try {
            await window.firebaseManager.collection('shifts').doc(shiftId).delete();
            
            this.logAnalytics('shift_deleted', { shiftId });
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression shift:', error);
            throw error;
        }
    }

    async copyShift(shiftId, newDate) {
        try {
            const originalShift = this.shifts.get(shiftId);
            if (!originalShift) throw new Error('Shift introuvable');

            const newShiftData = {
                ...originalShift,
                date: newDate,
                id: undefined,
                createdAt: undefined,
                createdBy: undefined
            };

            return await this.createShift(newShiftData);
        } catch (error) {
            console.error('❌ Erreur copie shift:', error);
            throw error;
        }
    }

    // Gestion des événements
    async createEvent(eventData) {
        try {
            const event = {
                title: this.sanitizeInput(eventData.title),
                description: this.sanitizeInput(eventData.description || ''),
                date: this.toFirebaseDate(eventData.date),
                startTime: eventData.startTime || '00:00',
                endTime: eventData.endTime || '23:59',
                type: eventData.type || 'general', // general, meeting, training, holiday
                location: eventData.location || '',
                participants: eventData.participants || [],
                isAllDay: eventData.isAllDay || false,
                isRecurring: eventData.isRecurring || false,
                color: eventData.color || '#8b5cf6',
                createdBy: window.firebaseManager.currentUser?.uid,
                createdAt: window.firebaseManager.timestamp()
            };

            const docRef = await window.firebaseManager.collection('events').add(event);
            event.id = docRef.id;

            return event;
        } catch (error) {
            console.error('❌ Erreur création événement:', error);
            throw error;
        }
    }

    // Gestion des absences
    async requestAbsence(absenceData) {
        try {
            const absence = {
                employeeId: absenceData.employeeId || window.firebaseManager.currentUser?.uid,
                type: absenceData.type, // vacation, sick, personal, other
                startDate: this.toFirebaseDate(absenceData.startDate),
                endDate: this.toFirebaseDate(absenceData.endDate),
                reason: this.sanitizeInput(absenceData.reason || ''),
                status: 'pending',
                requestedAt: window.firebaseManager.timestamp(),
                approvedBy: null,
                approvedAt: null,
                rejectionReason: null
            };

            // Vérifier les shifts impactés
            const impactedShifts = await this.getShiftsBetweenDates(
                absence.employeeId,
                absence.startDate,
                absence.endDate
            );

            absence.impactedShifts = impactedShifts.map(s => s.id);

            const docRef = await window.firebaseManager.collection('absences').add(absence);
            absence.id = docRef.id;

            // Notifier les managers
            this.notifyManagers('absence_request', absence);

            return absence;
        } catch (error) {
            console.error('❌ Erreur demande absence:', error);
            throw error;
        }
    }

    async approveAbsence(absenceId, approverId) {
        try {
            const absence = this.absences.get(absenceId);
            if (!absence) throw new Error('Absence introuvable');

            await window.firebaseManager.collection('absences').doc(absenceId).update({
                status: 'approved',
                approvedBy: approverId,
                approvedAt: window.firebaseManager.timestamp()
            });

            // Supprimer ou marquer les shifts impactés
            for (const shiftId of absence.impactedShifts || []) {
                await window.firebaseManager.collection('shifts').doc(shiftId).update({
                    status: 'cancelled',
                    cancellationReason: 'absence'
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur approbation absence:', error);
            throw error;
        }
    }

    // Vérifications et validations
    async checkShiftConflicts(shiftData, excludeShiftId = null) {
        const conflicts = [];
        const shiftDate = this.toJSDate(shiftData.date);
        
        // Récupérer tous les shifts de l'employé pour cette date
        const employeeShifts = Array.from(this.shifts.values()).filter(shift => 
            shift.employeeId === shiftData.employeeId &&
            this.isSameDay(this.toJSDate(shift.date), shiftDate) &&
            shift.id !== excludeShiftId
        );

        // Vérifier les chevauchements
        for (const existingShift of employeeShifts) {
            if (this.isTimeOverlap(
                shiftData.startTime,
                shiftData.endTime,
                existingShift.startTime,
                existingShift.endTime
            )) {
                conflicts.push({
                    type: 'overlap',
                    message: `Chevauchement avec un shift existant (${existingShift.startTime}-${existingShift.endTime})`,
                    conflictingShift: existingShift
                });
            }
        }

        // Vérifier les absences approuvées
        const absences = Array.from(this.absences.values()).filter(absence =>
            absence.employeeId === shiftData.employeeId &&
            absence.status === 'approved' &&
            shiftDate >= this.toJSDate(absence.startDate) &&
            shiftDate <= this.toJSDate(absence.endDate)
        );

        if (absences.length > 0) {
            conflicts.push({
                type: 'absence',
                message: `L'employé est en absence ce jour-là`,
                absence: absences[0]
            });
        }

        // Vérifier les règles métier (ex: temps de repos minimum)
        const previousDayShifts = await this.getEmployeeShiftsForDate(
            shiftData.employeeId,
            new Date(shiftDate.getTime() - 24 * 60 * 60 * 1000)
        );

        if (previousDayShifts.length > 0) {
            const lastShift = previousDayShifts[previousDayShifts.length - 1];
            const restTime = this.calculateRestTime(lastShift.endTime, shiftData.startTime);
            
            if (restTime < 11) { // 11 heures minimum de repos
                conflicts.push({
                    type: 'rest_time',
                    message: `Temps de repos insuffisant (${restTime}h, minimum 11h requis)`,
                    previousShift: lastShift
                });
            }
        }

        return conflicts;
    }

    // Templates et modèles
    async createShiftTemplate(templateData) {
        try {
            const template = {
                name: this.sanitizeInput(templateData.name),
                description: this.sanitizeInput(templateData.description || ''),
                shifts: templateData.shifts, // Array of shift patterns
                createdBy: window.firebaseManager.currentUser?.uid,
                createdAt: window.firebaseManager.timestamp()
            };

            const docRef = await window.firebaseManager.collection('shiftTemplates').add(template);
            template.id = docRef.id;

            return template;
        } catch (error) {
            console.error('❌ Erreur création template:', error);
            throw error;
        }
    }

    async applyTemplate(templateId, startDate, employeeMapping) {
        try {
            const template = await window.firebaseManager.collection('shiftTemplates')
                .doc(templateId)
                .get();
            
            if (!template.exists) throw new Error('Template introuvable');
            
            const templateData = template.data();
            const createdShifts = [];

            for (const shiftPattern of templateData.shifts) {
                const employeeId = employeeMapping[shiftPattern.position] || shiftPattern.defaultEmployeeId;
                
                if (employeeId) {
                    const shiftDate = new Date(startDate);
                    shiftDate.setDate(shiftDate.getDate() + shiftPattern.dayOffset);

                    const shift = await this.createShift({
                        employeeId,
                        date: shiftDate,
                        startTime: shiftPattern.startTime,
                        endTime: shiftPattern.endTime,
                        position: shiftPattern.position,
                        breakDuration: shiftPattern.breakDuration
                    });

                    createdShifts.push(shift);
                }
            }

            return createdShifts;
        } catch (error) {
            console.error('❌ Erreur application template:', error);
            throw error;
        }
    }

    // Statistiques et rapports
    async getWeeklyStats(weekDate) {
        const weekStart = this.getWeekStart(weekDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const shifts = await this.getShiftsBetweenDates(null, weekStart, weekEnd);
        
        const stats = {
            totalShifts: shifts.length,
            totalHours: 0,
            byEmployee: {},
            byPosition: {},
            byDay: {},
            coverage: {}
        };

        shifts.forEach(shift => {
            const hours = this.calculateShiftHours(shift);
            stats.totalHours += hours;

            // Par employé
            if (!stats.byEmployee[shift.employeeId]) {
                stats.byEmployee[shift.employeeId] = {
                    shifts: 0,
                    hours: 0
                };
            }
            stats.byEmployee[shift.employeeId].shifts++;
            stats.byEmployee[shift.employeeId].hours += hours;

            // Par position
            if (!stats.byPosition[shift.position]) {
                stats.byPosition[shift.position] = {
                    shifts: 0,
                    hours: 0
                };
            }
            stats.byPosition[shift.position].shifts++;
            stats.byPosition[shift.position].hours += hours;

            // Par jour
            const dayKey = this.toJSDate(shift.date).toISOString().split('T')[0];
            if (!stats.byDay[dayKey]) {
                stats.byDay[dayKey] = {
                    shifts: 0,
                    hours: 0,
                    employees: new Set()
                };
            }
            stats.byDay[dayKey].shifts++;
            stats.byDay[dayKey].hours += hours;
            stats.byDay[dayKey].employees.add(shift.employeeId);
        });

        // Convertir les Sets en nombres
        Object.keys(stats.byDay).forEach(day => {
            stats.byDay[day].employeeCount = stats.byDay[day].employees.size;
            delete stats.byDay[day].employees;
        });

        return stats;
    }

    // Vues et navigation
    setView(viewType) {
        this.currentView = viewType;
        this.notifyUpdate('view:changed', viewType);
    }

    setCurrentDate(date) {
        this.currentDate = new Date(date);
        this.subscribeToShifts(); // Recharger les shifts pour la nouvelle période
        this.notifyUpdate('date:changed', this.currentDate);
    }

    navigateWeek(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.setCurrentDate(newDate);
    }

    navigateMonth(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.setCurrentDate(newDate);
    }

    // Getters
    getShifts() {
        return Array.from(this.shifts.values());
    }

    getShiftsByDate(date) {
        const targetDate = this.toJSDate(date);
        return this.getShifts().filter(shift => 
            this.isSameDay(this.toJSDate(shift.date), targetDate)
        );
    }

    getShiftsByEmployee(employeeId) {
        return this.getShifts().filter(shift => shift.employeeId === employeeId);
    }

    async getShiftsBetweenDates(employeeId, startDate, endDate) {
        const query = window.firebaseManager.collection('shifts')
            .where('date', '>=', this.toFirebaseDate(startDate))
            .where('date', '<=', this.toFirebaseDate(endDate));

        if (employeeId) {
            query.where('employeeId', '==', employeeId);
        }

        const snapshot = await query.get();
        const shifts = [];
        
        snapshot.forEach(doc => {
            shifts.push({ id: doc.id, ...doc.data() });
        });

        return shifts;
    }

    async getEmployeeShiftsForDate(employeeId, date) {
        const shifts = this.getShiftsByDate(date);
        return shifts.filter(shift => shift.employeeId === employeeId)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    getEvents() {
        return Array.from(this.events.values());
    }

    getEventsByDate(date) {
        const targetDate = this.toJSDate(date);
        return this.getEvents().filter(event =>
            this.isSameDay(this.toJSDate(event.date), targetDate)
        );
    }

    getAbsences() {
        return Array.from(this.absences.values());
    }

    getAbsencesByEmployee(employeeId) {
        return this.getAbsences().filter(absence => absence.employeeId === employeeId);
    }

    getPendingAbsences() {
        return this.getAbsences().filter(absence => absence.status === 'pending');
    }

    // Utilitaires dates
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    getWeekEnd(date) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    }

    getMonthStart(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    getMonthEnd(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    toFirebaseDate(date) {
        if (date instanceof Date) {
            return firebase.firestore.Timestamp.fromDate(date);
        }
        return date;
    }

    toJSDate(date) {
        if (date?.toDate) {
            return date.toDate();
        }
        return new Date(date);
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    isTimeOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
    }

    calculateShiftHours(shift) {
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        
        let hours = endHour - startHour + (endMin - startMin) / 60;
        
        // Soustraire la pause
        if (shift.breakDuration) {
            hours -= shift.breakDuration / 60;
        }
        
        return Math.max(0, hours);
    }

    calculateRestTime(previousEndTime, nextStartTime) {
        const [prevHour, prevMin] = previousEndTime.split(':').map(Number);
        const [nextHour, nextMin] = nextStartTime.split(':').map(Number);
        
        // Supposer que c'est le jour suivant
        const restHours = (24 - prevHour - prevMin/60) + (nextHour + nextMin/60);
        
        return restHours;
    }

    // Utilitaires
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }

    notifyUpdate(event, data) {
        document.dispatchEvent(new CustomEvent(`planning:${event}`, { detail: data }));
    }

    notifyManagers(type, data) {
        // TODO: Implémenter les notifications aux managers
        console.log(`📢 Notification managers: ${type}`, data);
    }

    logAnalytics(event, data) {
        window.firebaseManager.collection('analytics').add({
            event: `planning:${event}`,
            data,
            userId: window.firebaseManager.currentUser?.uid,
            timestamp: window.firebaseManager.timestamp()
        }).catch(console.error);
    }

    // Nettoyage
    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.shifts.clear();
        this.events.clear();
        this.absences.clear();
    }
}

// Instance globale
window.planningManager = new PlanningManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningManager;
}