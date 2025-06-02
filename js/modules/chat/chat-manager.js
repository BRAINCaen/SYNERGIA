// js/modules/chat/chat-manager.js
// Gestionnaire du chat en temps réel

class ChatManager {
    constructor() {
        this.messages = new Map();
        this.conversations = new Map();
        this.unsubscribers = [];
        this.currentConversation = null;
        this.isReady = false;
        this.typingUsers = new Map();
        this.init();
    }

    async init() {
        await window.firebaseManager.waitForReady();
        
        // Écouter les changements d'authentification
        window.firebaseManager.on('authStateChanged', (user) => {
            if (user) {
                this.subscribeToConversations();
                this.subscribeToMessages();
            } else {
                this.unsubscribeAll();
            }
        });
        
        this.isReady = true;
        console.log('✅ ChatManager initialisé');
    }

    // Abonnements temps réel
    subscribeToConversations() {
        const userId = window.firebaseManager.currentUser?.uid;
        if (!userId) return;

        // Écouter les conversations de l'utilisateur
        const unsubscribe = window.firebaseManager.collection('conversations')
            .where('participants', 'array-contains', userId)
            .orderBy('lastMessageAt', 'desc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const conversation = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.conversations.set(conversation.id, conversation);
                        this.notifyUpdate('conversation:updated', conversation);
                    } else if (change.type === 'removed') {
                        this.conversations.delete(conversation.id);
                        this.notifyUpdate('conversation:removed', conversation);
                    }
                });
                
                this.notifyUpdate('conversations:updated', this.getConversations());
            });

        this.unsubscribers.push(unsubscribe);
    }

    subscribeToMessages() {
        if (!this.currentConversation) return;

        // Désabonner l'ancien listener
        if (this.messageUnsubscriber) {
            this.messageUnsubscriber();
        }

        // Écouter les messages de la conversation actuelle
        this.messageUnsubscriber = window.firebaseManager.collection('messages')
            .where('conversationId', '==', this.currentConversation)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });
                
                this.messages.set(this.currentConversation, messages.reverse());
                this.notifyUpdate('messages:updated', messages);
                
                // Marquer comme lu
                this.markAsRead(this.currentConversation);
            });
    }

    // Gestion des conversations
    async createConversation(participantIds, name = null, type = 'direct') {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            if (!userId) throw new Error('Non connecté');

            // Ajouter l'utilisateur actuel aux participants
            const allParticipants = [...new Set([userId, ...participantIds])];
            
            // Pour les conversations directes, vérifier si elle existe déjà
            if (type === 'direct' && allParticipants.length === 2) {
                const existing = await this.findDirectConversation(allParticipants);
                if (existing) return existing;
            }

            // Créer la conversation
            const conversation = {
                participants: allParticipants,
                participantDetails: {},
                name: name || null,
                type: type,
                createdBy: userId,
                createdAt: window.firebaseManager.timestamp(),
                lastMessageAt: window.firebaseManager.timestamp(),
                lastMessage: null,
                unreadCount: {}
            };

            // Initialiser le compteur non lu pour chaque participant
            allParticipants.forEach(pid => {
                conversation.unreadCount[pid] = 0;
            });

            // Récupérer les détails des participants
            for (const pid of allParticipants) {
                const userData = await this.getUserData(pid);
                if (userData) {
                    conversation.participantDetails[pid] = {
                        displayName: userData.displayName,
                        photoURL: userData.photoURL || '',
                        role: userData.role
                    };
                }
            }

            const docRef = await window.firebaseManager.collection('conversations').add(conversation);
            conversation.id = docRef.id;

            return conversation;
        } catch (error) {
            console.error('❌ Erreur création conversation:', error);
            throw error;
        }
    }

    async findDirectConversation(participants) {
        const snapshot = await window.firebaseManager.collection('conversations')
            .where('type', '==', 'direct')
            .where('participants', 'array-contains', participants[0])
            .get();

        for (const doc of snapshot.docs) {
            const conv = doc.data();
            if (conv.participants.length === 2 && 
                conv.participants.includes(participants[1])) {
                return { id: doc.id, ...conv };
            }
        }

        return null;
    }

    async getUserData(userId) {
        // Chercher d'abord dans users
        const userDoc = await window.firebaseManager.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data();
        }

        // Sinon chercher dans teamMembers
        const teamSnapshot = await window.firebaseManager.collection('teamMembers')
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (!teamSnapshot.empty) {
            return teamSnapshot.docs[0].data();
        }

        return null;
    }

    // Gestion des messages
    async sendMessage(conversationId, content, type = 'text', attachments = []) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            if (!userId) throw new Error('Non connecté');

            const message = {
                conversationId,
                senderId: userId,
                content: this.sanitizeInput(content),
                type,
                attachments,
                createdAt: window.firebaseManager.timestamp(),
                editedAt: null,
                deletedAt: null,
                reactions: {},
                readBy: {
                    [userId]: window.firebaseManager.timestamp()
                }
            };

            // Ajouter le message
            const docRef = await window.firebaseManager.collection('messages').add(message);
            message.id = docRef.id;

            // Mettre à jour la conversation
            const conversation = this.conversations.get(conversationId);
            if (conversation) {
                const updates = {
                    lastMessageAt: window.firebaseManager.timestamp(),
                    lastMessage: {
                        id: message.id,
                        content: message.content,
                        senderId: message.senderId,
                        type: message.type
                    }
                };

                // Incrémenter les compteurs non lus pour tous sauf l'expéditeur
                conversation.participants.forEach(pid => {
                    if (pid !== userId) {
                        updates[`unreadCount.${pid}`] = window.firebaseManager.increment(1);
                    }
                });

                await window.firebaseManager.collection('conversations')
                    .doc(conversationId)
                    .update(updates);
            }

            // Notifier les autres participants
            this.sendNotification(conversationId, message);

            return message;
        } catch (error) {
            console.error('❌ Erreur envoi message:', error);
            throw error;
        }
    }

    async editMessage(messageId, newContent) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            
            await window.firebaseManager.collection('messages').doc(messageId).update({
                content: this.sanitizeInput(newContent),
                editedAt: window.firebaseManager.timestamp(),
                editedBy: userId
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur édition message:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            
            await window.firebaseManager.collection('messages').doc(messageId).update({
                deletedAt: window.firebaseManager.timestamp(),
                deletedBy: userId
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur suppression message:', error);
            throw error;
        }
    }

    async addReaction(messageId, emoji) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            
            await window.firebaseManager.collection('messages').doc(messageId).update({
                [`reactions.${userId}`]: emoji
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur ajout réaction:', error);
            throw error;
        }
    }

    async removeReaction(messageId) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            
            await window.firebaseManager.collection('messages').doc(messageId).update({
                [`reactions.${userId}`]: window.firebaseManager.db.FieldValue.delete()
            });

            return true;
        } catch (error) {
            console.error('❌ Erreur suppression réaction:', error);
            throw error;
        }
    }

    // Gestion des lectures
    async markAsRead(conversationId) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            if (!userId) return;

            // Réinitialiser le compteur non lu
            await window.firebaseManager.collection('conversations')
                .doc(conversationId)
                .update({
                    [`unreadCount.${userId}`]: 0
                });

            // Marquer tous les messages comme lus
            const messages = this.messages.get(conversationId) || [];
            const batch = window.firebaseManager.db.batch();
            
            messages.forEach(msg => {
                if (!msg.readBy?.[userId]) {
                    const msgRef = window.firebaseManager.collection('messages').doc(msg.id);
                    batch.update(msgRef, {
                        [`readBy.${userId}`]: window.firebaseManager.timestamp()
                    });
                }
            });

            await batch.commit();
        } catch (error) {
            console.error('❌ Erreur marquage lecture:', error);
        }
    }

    // Gestion du typing
    async setTyping(conversationId, isTyping) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            if (!userId) return;

            if (isTyping) {
                // Ajouter l'utilisateur comme en train de taper
                this.typingUsers.set(userId, {
                    conversationId,
                    timestamp: Date.now()
                });

                // Notifier les autres
                this.notifyUpdate('user:typing', {
                    conversationId,
                    userId,
                    isTyping: true
                });

                // Retirer après 3 secondes
                setTimeout(() => {
                    this.typingUsers.delete(userId);
                    this.notifyUpdate('user:typing', {
                        conversationId,
                        userId,
                        isTyping: false
                    });
                }, 3000);
            } else {
                this.typingUsers.delete(userId);
                this.notifyUpdate('user:typing', {
                    conversationId,
                    userId,
                    isTyping: false
                });
            }
        } catch (error) {
            console.error('❌ Erreur typing:', error);
        }
    }

    // Fichiers et médias
    async uploadFile(file, conversationId) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const path = `chat/${conversationId}/${fileName}`;

            // Upload vers Firebase Storage
            const storageRef = window.firebaseManager.storage.ref(path);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            return {
                url: downloadURL,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: window.firebaseManager.timestamp()
            };
        } catch (error) {
            console.error('❌ Erreur upload fichier:', error);
            throw error;
        }
    }

    // Notifications
    async sendNotification(conversationId, message) {
        // Implémenter les notifications push/email selon les préférences
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        const currentUserId = window.firebaseManager.currentUser?.uid;
        const otherParticipants = conversation.participants.filter(id => id !== currentUserId);

        // Pour chaque participant, vérifier ses préférences et envoyer notification
        for (const participantId of otherParticipants) {
            // TODO: Implémenter notification push/email
            console.log(`📬 Notification pour ${participantId}: Nouveau message dans ${conversation.name || 'conversation'}`);
        }
    }

    // Getters
    getConversations() {
        return Array.from(this.conversations.values())
            .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    }

    getConversation(id) {
        return this.conversations.get(id);
    }

    getMessages(conversationId) {
        return this.messages.get(conversationId) || [];
    }

    getUnreadCount() {
        const userId = window.firebaseManager.currentUser?.uid;
        if (!userId) return 0;

        return Array.from(this.conversations.values())
            .reduce((total, conv) => total + (conv.unreadCount?.[userId] || 0), 0);
    }

    getTypingUsers(conversationId) {
        const typing = [];
        const now = Date.now();

        this.typingUsers.forEach((data, userId) => {
            if (data.conversationId === conversationId && 
                now - data.timestamp < 3000 &&
                userId !== window.firebaseManager.currentUser?.uid) {
                typing.push(userId);
            }
        });

        return typing;
    }

    // Navigation
    async openConversation(conversationId) {
        this.currentConversation = conversationId;
        this.subscribeToMessages();
        await this.markAsRead(conversationId);
        this.notifyUpdate('conversation:opened', conversationId);
    }

    closeConversation() {
        this.currentConversation = null;
        if (this.messageUnsubscriber) {
            this.messageUnsubscriber();
            this.messageUnsubscriber = null;
        }
        this.messages.clear();
        this.notifyUpdate('conversation:closed', null);
    }

    // Recherche
    async searchMessages(query) {
        try {
            const userId = window.firebaseManager.currentUser?.uid;
            const conversations = this.getConversations();
            const results = [];

            for (const conv of conversations) {
                const messages = await window.firebaseManager.collection('messages')
                    .where('conversationId', '==', conv.id)
                    .where('content', '>=', query)
                    .where('content', '<=', query + '\uf8ff')
                    .limit(10)
                    .get();

                messages.forEach(doc => {
                    results.push({
                        message: { id: doc.id, ...doc.data() },
                        conversation: conv
                    });
                });
            }

            return results;
        } catch (error) {
            console.error('❌ Erreur recherche messages:', error);
            return [];
        }
    }

    // Utilitaires
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }

    notifyUpdate(event, data) {
        document.dispatchEvent(new CustomEvent(`chat:${event}`, { detail: data }));
    }

    // Nettoyage
    unsubscribeAll() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        
        if (this.messageUnsubscriber) {
            this.messageUnsubscriber();
            this.messageUnsubscriber = null;
        }
        
        this.messages.clear();
        this.conversations.clear();
        this.typingUsers.clear();
    }

    destroy() {
        this.unsubscribeAll();
    }
}

// Instance globale
window.chatManager = new ChatManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
}