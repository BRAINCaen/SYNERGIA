/* ===== SYNERGIA TEAM MANAGER - SYSTÈME COMPLET ===== */

class SynergiaTeamManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.teamMembers = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.isInitialized = false;
        
        console.log('👥 Team Manager créé');
    }

    // 🚀 INITIALISATION
    async init(auth, db) {
        this.auth = auth;
        this.db = db;
        
        if (!this.auth || !this.db) {
            console.error('❌ Firebase non disponible pour Team Manager');
            return false;
        }

        // Initialiser les rôles
        await this.initializeRoles();
        
        // Écouter les changements d'auth
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadTeamMembers();
                this.emit('teamLoaded');
            }
        });

        this.isInitialized = true;
        console.log('✅ Team Manager initialisé');
        return true;
    }

    // 🎭 GESTION DES RÔLES
    async initializeRoles() {
        const defaultRoles = [
            {
                id: 'admin',
                name: 'Administrateur',
                description: 'Accès complet à toutes les fonctionnalités',
                permissions: ['all'],
                color: '#ef4444',
                icon: 'fa-crown',
                level: 5
            },
            {
                id: 'manager',
                name: 'Manager',
                description: 'Gestion d\'équipe et supervision',
                permissions: ['team_manage', 'quest_assign', 'reports_view'],
                color: '#8b5cf6',
                icon: 'fa-user-tie',
                level: 4
            },
            {
                id: 'entretien',
                name: 'Entretien & Maintenance',
                description: 'Responsable de la maintenance des équipements',
                permissions: ['quest_complete', 'equipment_manage'],
                color: '#10b981',
                icon: 'fa-tools',
                level: 3
            },
            {
                id: 'accueil',
                name: 'Accueil Client',
                description: 'Interface client et service',
                permissions: ['quest_complete', 'client_manage'],
                color: '#f59e0b',
                icon: 'fa-handshake',
                level: 3
            },
            {
                id: 'animation',
                name: 'Animation',
                description: 'Organisation d\'événements et animations',
                permissions: ['quest_complete', 'event_manage'],
                color: '#06b6d4',
                icon: 'fa-masks-theater',
                level: 3
            },
            {
                id: 'securite',
                name: 'Sécurité',
                description: 'Surveillance et sécurité des locaux',
                permissions: ['quest_complete', 'security_manage'],
                color: '#dc2626',
                icon: 'fa-shield-alt',
                level: 3
            },
            {
                id: 'stagiaire',
                name: 'Stagiaire',
                description: 'En formation, accès limité',
                permissions: ['quest_view'],
                color: '#6b7280',
                icon: 'fa-graduation-cap',
                level: 1
            }
        ];

        // Charger ou créer les rôles
        try {
            const rolesSnapshot = await this.db.collection('roles').get();
            
            if (rolesSnapshot.empty) {
                // Créer les rôles par défaut
                console.log('📝 Création des rôles par défaut...');
                for (const role of defaultRoles) {
                    await this.db.collection('roles').doc(role.id).set(role);
                    this.roles.set(role.id, role);
                }
            } else {
                // Charger les rôles existants
                rolesSnapshot.forEach(doc => {
                    this.roles.set(doc.id, { id: doc.id, ...doc.data() });
                });
            }
            
            console.log(`✅ ${this.roles.size} rôles chargés`);
        } catch (error) {
            console.error('❌ Erreur initialisation rôles:', error);
            // Fallback vers les rôles par défaut
            defaultRoles.forEach(role => {
                this.roles.set(role.id, role);
            });
        }
    }

    // 👥 GESTION DES MEMBRES
    async loadTeamMembers() {
        if (!this.db) return [];

        try {
            const membersSnapshot = await this.db.collection('teamMembers').get();
            
            this.teamMembers.clear();
            const members = [];
            
            membersSnapshot.forEach(doc => {
                const member = { id: doc.id, ...doc.data() };
                this.teamMembers.set(doc.id, member);
                members.push(member);
            });

            console.log(`✅ ${members.length} membres d'équipe chargés`);
            return members;
        } catch (error) {
            console.error('❌ Erreur chargement équipe:', error);
            return [];
        }
    }

    async addTeamMember(memberData) {
        if (!this.db || !this.currentUser) {
            throw new Error('Base de données non disponible');
        }

        // Validation des données
        const validatedData = this.validateMemberData(memberData);
        if (!validatedData.isValid) {
            throw new Error(validatedData.errors.join(', '));
        }

        try {
            // Vérifier si l'email existe déjà
            const existingMember = await this.findMemberByEmail(memberData.email);
            if (existingMember) {
                throw new Error('Un membre avec cet email existe déjà');
            }

            // Préparer les données du membre
            const newMember = {
                email: memberData.email.toLowerCase().trim(),
                displayName: memberData.displayName.trim(),
                role: memberData.role,
                level: parseInt(memberData.level) || 1,
                xp: 0,
                joinedAt: firebase.firestore.Timestamp.now(),
                createdBy: this.currentUser.uid,
                status: 'pending', // pending, active, inactive
                avatar: memberData.avatar || this.getDefaultAvatar(memberData.role),
                preferences: {
                    notifications: true,
                    theme: 'default'
                },
                stats: {
                    questsCompleted: 0,
                    totalXP: 0,
                    streakDays: 0,
                    lastLogin: null
                },
                schedule: this.getDefaultSchedule(),
                skills: this.getRoleSkills(memberData.role)
            };

            // Ajouter à Firebase
            const docRef = await this.db.collection('teamMembers').add(newMember);
            newMember.id = docRef.id;
            
            // Ajouter au cache local
            this.teamMembers.set(docRef.id, newMember);

            // Créer un profil utilisateur Firebase si nécessaire
            await this.createUserProfile(newMember);

            console.log('✅ Membre ajouté:', newMember.displayName);
            this.emit('memberAdded', newMember);
            
            return newMember;
        } catch (error) {
            console.error('❌ Erreur ajout membre:', error);
            throw error;
        }
    }

    async updateTeamMember(memberId, updates) {
        if (!this.db || !memberId) {
            throw new Error('Paramètres invalides');
        }

        try {
            // Validation des mises à jour
            const validatedUpdates = this.validateMemberUpdates(updates);
            
            // Mettre à jour dans Firebase
            await this.db.collection('teamMembers').doc(memberId).update({
                ...validatedUpdates,
                updatedAt: firebase.firestore.Timestamp.now(),
                updatedBy: this.currentUser.uid
            });

            // Mettre à jour le cache local
            const existingMember = this.teamMembers.get(memberId);
            if (existingMember) {
                const updatedMember = { ...existingMember, ...validatedUpdates };
                this.teamMembers.set(memberId, updatedMember);
                
                console.log('✅ Membre mis à jour:', updatedMember.displayName);
                this.emit('memberUpdated', updatedMember);
                
                return updatedMember;
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour membre:', error);
            throw error;
        }
    }

    async removeTeamMember(memberId) {
        if (!this.db || !memberId) {
            throw new Error('Paramètres invalides');
        }

        try {
            const member = this.teamMembers.get(memberId);
            if (!member) {
                throw new Error('Membre non trouvé');
            }

            // Marquer comme inactif plutôt que supprimer
            await this.updateTeamMember(memberId, {
                status: 'inactive',
                deactivatedAt: firebase.firestore.Timestamp.now(),
                deactivatedBy: this.currentUser.uid
            });

            console.log('✅ Membre désactivé:', member.displayName);
            this.emit('memberRemoved', member);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression membre:', error);
            throw error;
        }
    }

    // 🔍 RECHERCHE ET FILTRES
    async findMemberByEmail(email) {
        try {
            const snapshot = await this.db.collection('teamMembers')
                .where('email', '==', email.toLowerCase().trim())
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Erreur recherche membre:', error);
            return null;
        }
    }

    getMembers() {
        return Array.from(this.teamMembers.values());
    }

    getMembersByRole(roleId) {
        return this.getMembers().filter(member => member.role === roleId);
    }

    getActiveMembers() {
        return this.getMembers().filter(member => member.status === 'active');
    }

    getMemberById(memberId) {
        return this.teamMembers.get(memberId);
    }

    // 🎭 GESTION DES RÔLES
    getRoles() {
        return Array.from(this.roles.values());
    }

    getRole(roleId) {
        return this.roles.get(roleId);
    }

    hasPermission(memberId, permission) {
        const member = this.getMemberById(memberId);
        if (!member) return false;

        const role = this.getRole(member.role);
        if (!role) return false;

        return role.permissions.includes('all') || role.permissions.includes(permission);
    }

    // 📊 STATISTIQUES
    getTeamStats() {
        const members = this.getActiveMembers();
        const totalMembers = members.length;
        const roleDistribution = {};
        const levelDistribution = {};
        
        let totalXP = 0;
        let averageLevel = 0;

        members.forEach(member => {
            // Distribution par rôle
            roleDistribution[member.role] = (roleDistribution[member.role] || 0) + 1;
            
            // Distribution par niveau
            levelDistribution[member.level] = (levelDistribution[member.level] || 0) + 1;
            
            // Totaux
            totalXP += member.xp || 0;
            averageLevel += member.level || 1;
        });

        if (totalMembers > 0) {
            averageLevel = Math.round(averageLevel / totalMembers * 10) / 10;
        }

        return {
            totalMembers,
            activeMembers: totalMembers,
            totalXP,
            averageLevel,
            roleDistribution,
            levelDistribution
        };
    }

    // 🛠️ UTILITAIRES
    validateMemberData(data) {
        const errors = [];
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Email invalide');
        }
        
        if (!data.displayName || data.displayName.trim().length < 2) {
            errors.push('Nom trop court (minimum 2 caractères)');
        }
        
        if (!data.role || !this.roles.has(data.role)) {
            errors.push('Rôle invalide');
        }
        
        if (data.level && (isNaN(data.level) || data.level < 1 || data.level > 10)) {
            errors.push('Niveau invalide (1-10)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateMemberUpdates(updates) {
        const validated = {};
        
        // Champs autorisés à la mise à jour
        const allowedFields = ['displayName', 'role', 'level', 'status', 'avatar', 'preferences', 'schedule', 'skills'];
        
        allowedFields.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                validated[field] = updates[field];
            }
        });

        return validated;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getDefaultAvatar(role) {
        const avatars = {
            admin: 'https://img.icons8.com/color/96/administrator-male.png',
            manager: 'https://img.icons8.com/color/96/manager.png',
            entretien: 'https://img.icons8.com/color/96/maintenance.png',
            accueil: 'https://img.icons8.com/color/96/receptionist.png',
            animation: 'https://img.icons8.com/color/96/theater.png',
            securite: 'https://img.icons8.com/color/96/security-guard.png',
            stagiaire: 'https://img.icons8.com/color/96/student-male.png'
        };
        return avatars[role] || 'https://img.icons8.com/color/96/user-male-circle--v1.png';
    }

    getDefaultSchedule() {
        return {
            monday: { start: '08:00', end: '18:00', active: true },
            tuesday: { start: '08:00', end: '18:00', active: true },
            wednesday: { start: '08:00', end: '18:00', active: true },
            thursday: { start: '08:00', end: '18:00', active: true },
            friday: { start: '08:00', end: '17:00', active: true },
            saturday: { start: '09:00', end: '16:00', active: false },
            sunday: { start: '10:00', end: '15:00', active: false }
        };
    }

    getRoleSkills(roleId) {
        const skillsMap = {
            admin: ['Management', 'Leadership', 'Administration'],
            manager: ['Management', 'Communication', 'Organisation'],
            entretien: ['Maintenance', 'Technique', 'Sécurité'],
            accueil: ['Communication', 'Service client', 'Vente'],
            animation: ['Créativité', 'Animation', 'Organisation'],
            securite: ['Surveillance', 'Sécurité', 'Premiers secours'],
            stagiaire: ['Apprentissage', 'Motivation']
        };
        return skillsMap[roleId] || [];
    }

    async createUserProfile(member) {
        try {
            // Créer un profil utilisateur dans la collection users
            const userProfile = {
                displayName: member.displayName,
                email: member.email,
                photoURL: member.avatar,
                role: member.role,
                level: member.level,
                xp: member.xp,
                teamMemberId: member.id,
                joinedAt: member.joinedAt,
                preferences: member.preferences
            };

            // Note: L'ID utilisateur sera généré lors de la première connexion
            console.log('📝 Profil utilisateur préparé pour:', member.email);
        } catch (error) {
            console.error('❌ Erreur création profil utilisateur:', error);
        }
    }

    // 🔄 SYSTÈME D'ÉVÉNEMENTS
    emit(event, data) {
        document.dispatchEvent(new CustomEvent(`synergia:team:${event}`, { detail: data }));
    }

    on(event, callback) {
        document.addEventListener(`synergia:team:${event}`, callback);
    }

    off(event, callback) {
        document.removeEventListener(`synergia:team:${event}`, callback);
    }
}

// Export global
window.SynergiaTeamManager = SynergiaTeamManager;