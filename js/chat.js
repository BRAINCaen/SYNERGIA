// chat.js - Gestion du chat et de la communication en temps réel

import { auth, db, storage } from './firebase-config.js';

// État local du chat
let currentChannel = 'general';
let messages = [];
let unreadMessages = {};
let usersTyping = {};

// Initialiser le chat
function initChat() {
    // Écouter les messages en temps réel
    const messagesRef = db.collection('messages');
    messagesRef
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            const changes = snapshot.docChanges();
            
            changes.forEach(change => {
                if (change.type === 'added') {
                    const message = { id: change.doc.id, ...change.doc.data() };
                    
                    // Ajouter au début pour avoir les plus récents messages en premier
                    messages.unshift(message);
                    
                    // Si le message est nouveau et pas du channel actuel, incrémenter le compteur
                    if (message.channel !== currentChannel) {
                        if (!unreadMessages[message.channel]) {
                            unreadMessages[message.channel] = 0;
                        }
                        unreadMessages[message.channel]++;
                        updateUnreadBadges();
                    }
                }
            });
            
            // Trier les messages par timestamp
            messages.sort((a, b) => a.timestamp - b.timestamp);
            
            // Mettre à jour l'affichage si on est sur la page de chat
            if (document.querySelector('.chat-page')) {
                renderMessages();
            }
        });
    
    // Écouter les indicateurs de frappe
    db.collection('typing').onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        
        changes.forEach(change => {
            const data = change.doc.data();
            
            if (change.type === 'added' || change.type === 'modified') {
                // Quelqu'un commence à taper
                usersTyping[change.doc.id] = {
                    userId: data.userId,
                    displayName: data.displayName,
                    channel: data.channel,
                    timestamp: data.timestamp
                };
            } else if (change.type === 'removed') {
                // Quelqu'un a arrêté de taper
                delete usersTyping[change.doc.id];
            }
        });
        
        // Nettoyer les utilisateurs qui ont arrêté de taper depuis plus de 3 secondes
        const now = Date.now();
        Object.keys(usersTyping).forEach(id => {
            if (now - usersTyping[id].timestamp > 3000) {
                delete usersTyping[id];
            }
        });
        
        // Mettre à jour l'indicateur de frappe
        updateTypingIndicator();
    });
}

// Mettre à jour l'affichage des messages
function renderMessages() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    // Filtrer les messages du canal actuel
    const channelMessages = messages.filter(msg => msg.channel === currentChannel);
    
    if (channelMessages.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-messages';
        emptyMessage.innerHTML = `
            <i class="fas fa-comment-dots"></i>
            <p>Aucun message dans #${currentChannel} pour le moment.<br>Soyez le premier à écrire !</p>
        `;
        chatMessages.appendChild(emptyMessage);
        return;
    }
    
    // Regrouper par jour
    let lastDate = null;
    
    channelMessages.forEach(message => {
        // Ajouter un séparateur de date si nécessaire
        const messageDate = new Date(message.timestamp);
        const messageDay = messageDate.toLocaleDateString('fr-FR');
        
        if (messageDay !== lastDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            
            // Formater la date de manière conviviale
            const today = new Date().toLocaleDateString('fr-FR');
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('fr-FR');
            
            let dateText = messageDay;
            if (messageDay === today) {
                dateText = "Aujourd'hui";
            } else if (messageDay === yesterday) {
                dateText = "Hier";
            }
            
            dateSeparator.textContent = dateText;
            chatMessages.appendChild(dateSeparator);
            lastDate = messageDay;
        }
        
        // Créer l'élément de message
        const messageTemplate = document.getElementById('chat-message-template');
        const messageItem = document.importNode(messageTemplate.content, true);
        
        // Remplir les données du message
        messageItem.querySelector('.message-avatar').src = message.photoURL || 'images/default-avatar.png';
        messageItem.querySelector('.message-author').textContent = message.displayName;
        messageItem.querySelector('.message-text').textContent = message.text;
        
        // Formater l'heure du message
        const hours = messageDate.getHours().toString().padStart(2, '0');
        const minutes = messageDate.getMinutes().toString().padStart(2, '0');
        messageItem.querySelector('.message-time').textContent = `${hours}:${minutes}`;
        
        // Vérifier si c'est notre propre message
        if (message.userId === auth.currentUser.uid) {
            messageItem.querySelector('.chat-message').classList.add('own-message');
        }
        
        chatMessages.appendChild(messageItem);
    });
    
    // Faire défiler jusqu'au bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Réinitialiser le compteur de messages non lus pour ce canal
    unreadMessages[currentChannel] = 0;
    updateUnreadBadges();
}

// Envoyer un message
function sendMessage(text) {
    if (!text.trim()) return;
    
    const user = auth.currentUser;
    
    const message = {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        text: text.trim(),
        channel: currentChannel,
        timestamp: Date.now()
    };
    
    // Enregistrer le message dans Firestore
    db.collection('messages').add(message)
        .then(() => {
            console.log('Message envoyé');
            // Effacer le champ de texte
            document.getElementById('message-input').value = '';
            // Supprimer l'indicateur de frappe
            removeTypingIndicator();
        })
        .catch(error => {
            console.error('Erreur d\'envoi du message:', error);
        });
}

// Changer de canal
function switchChannel(channel) {
    currentChannel = channel;
    
    // Mettre à jour les classes des boutons de canaux
    const channelButtons = document.querySelectorAll('.chat-channel');
    channelButtons.forEach(button => {
        if (button.getAttribute('data-channel') === channel) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Réinitialiser le compteur de messages non lus pour ce canal
    unreadMessages[channel] = 0;
    updateUnreadBadges();
    
    // Mettre à jour l'affichage des messages
    renderMessages();
}

// Mettre à jour les badges de messages non lus
function updateUnreadBadges() {
    // Pour chaque canal
    Object.keys(unreadMessages).forEach(channel => {
        const channelButton = document.querySelector(`.chat-channel[data-channel="${channel}"]`);
        if (channelButton) {
            const badge = channelButton.querySelector('.badge') || document.createElement('span');
            
            if (!badge.classList.contains('badge')) {
                badge.className = 'badge';
                channelButton.appendChild(badge);
            }
            
            if (unreadMessages[channel] > 0) {
                badge.textContent = unreadMessages[channel];
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    });
    
    // Badge global dans la navigation
    const chatBadge = document.getElementById('chat-badge');
    if (chatBadge) {
        const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
        
        if (totalUnread > 0) {
            chatBadge.textContent = totalUnread;
            chatBadge.classList.remove('hidden');
        } else {
            chatBadge.classList.add('hidden');
        }
    }
}

// Gérer l'indicateur de frappe
function updateTypingIndicator() {
    const typingContainer = document.querySelector('.typing-indicator');
    
    // Créer l'indicateur s'il n'existe pas
    if (!typingContainer && document.getElementById('chat-messages')) {
        const container = document.createElement('div');
        container.className = 'typing-indicator';
        document.getElementById('chat-container').insertBefore(container, document.querySelector('.chat-input'));
    }
    
    // Récupérer le conteneur (qui peut avoir été créé juste avant)
    const typingIndicator = document.querySelector('.typing-indicator');
    if (!typingIndicator) return;
    
    // Filtrer les utilisateurs en train d'écrire dans le canal actuel (sauf l'utilisateur actuel)
    const typingUsers = Object.values(usersTyping).filter(user => 
        user.channel === currentChannel && user.userId !== auth.currentUser.uid
    );
    
    if (typingUsers.length > 0) {
        typingIndicator.innerHTML = '';
        
        if (typingUsers.length === 1) {
            typingIndicator.textContent = `${typingUsers[0].displayName} est en train d'écrire...`;
        } else if (typingUsers.length === 2) {
            typingIndicator.textContent = `${typingUsers[0].displayName} et ${typingUsers[1].displayName} sont en train d'écrire...`;
        } else {
            typingIndicator.textContent = `${typingUsers.length} personnes sont en train d'écrire...`;
        }
        
        typingIndicator.classList.remove('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
}

// Indiquer que l'utilisateur est en train d'écrire
function setTypingIndicator() {
    const user = auth.currentUser;
    
    db.collection('typing').doc(user.uid).set({
        userId: user.uid,
        displayName: user.displayName,
        channel: currentChannel,
        timestamp: Date.now()
    });
}

// Supprimer l'indicateur de frappe
function removeTypingIndicator() {
    const user = auth.currentUser;
    db.collection('typing').doc(user.uid).delete();
}

// Initialiser les gestionnaires d'événements
function initEventListeners() {
    // Gestionnaire pour les boutons de canaux
    const channelButtons = document.querySelectorAll('.chat-channel');
    channelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const channel = button.getAttribute('data-channel');
            switchChannel(channel);
        });
    });
    
    // Gestionnaire pour l'envoi de message
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    messageInput.addEventListener('input', () => {
        if (messageInput.value.trim()) {
            setTypingIndicator();
        } else {
            removeTypingIndicator();
        }
    });
    
    messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(messageInput.value);
        }
    });
    
    sendButton.addEventListener('click', () => {
        sendMessage(messageInput.value);
    });
    
    // Supprimer l'indicateur de frappe quand on quitte la page
    window.addEventListener('beforeunload', removeTypingIndicator);
}

// Initialiser la page de chat
function initChatPage() {
    // Vérifier si la page de chat est active
    if (!document.querySelector('.chat-page')) return;
    
    // Initialiser les écouteurs d'événements
    initEventListeners();
    
    // Définir le canal par défaut
    switchChannel('general');
}

// Exporter les fonctions
export default {
    initChat,
    initChatPage,
    switchChannel,
    sendMessage
};
