// Données de test pour les différents modèles

// Utilisateurs
const mockUsers = [
  {
    _id: '60d0fe4f5311236168a109ca',
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@example.com',
    password: 'Password123!',
    role: 'user',
    status: 'online',
    photo: 'default.jpg',
    theme: 'light',
    dateCreation: new Date('2023-01-01')
  },
  {
    _id: '60d0fe4f5311236168a109cb',
    nom: 'Smith',
    prenom: 'Jane',
    email: 'jane.smith@example.com',
    password: 'Password123!',
    role: 'user',
    status: 'offline',
    photo: 'default.jpg',
    theme: 'dark',
    dateCreation: new Date('2023-01-02')
  }
];

// Workspaces
const mockWorkspaces = [
  {
    _id: '60d0fe4f5311236168a109cc',
    nom: 'Workspace Test',
    description: 'Description du workspace de test',
    proprietaire: '60d0fe4f5311236168a109ca', // John Doe
    membres: [
      {
        user: '60d0fe4f5311236168a109ca', // John Doe
        role: 'admin'
      },
      {
        user: '60d0fe4f5311236168a109cb', // Jane Smith
        role: 'member'
      }
    ],
    estPublic: true,
    dateCreation: new Date('2023-01-03')
  }
];

// Canaux
const mockCanaux = [
  {
    _id: '60d0fe4f5311236168a109cd',
    nom: 'general',
    description: 'Canal général',
    workspace: '60d0fe4f5311236168a109cc',
    createur: '60d0fe4f5311236168a109ca', // John Doe
    membres: [
      {
        user: '60d0fe4f5311236168a109ca', // John Doe
        role: 'admin'
      },
      {
        user: '60d0fe4f5311236168a109cb', // Jane Smith
        role: 'member'
      }
    ],
    estPrive: false,
    dateCreation: new Date('2023-01-03')
  }
];

// Messages dans les canaux
const mockMessages = [
  {
    _id: '60d0fe4f5311236168a109ce',
    contenu: 'Bonjour tout le monde!',
    auteur: '60d0fe4f5311236168a109ca', // John Doe
    canal: '60d0fe4f5311236168a109cd',
    dateCreation: new Date('2023-01-04T10:00:00'),
    estEdite: false,
    reactions: [],
    fichiers: []
  },
  {
    _id: '60d0fe4f5311236168a109cf',
    contenu: 'Salut John!',
    auteur: '60d0fe4f5311236168a109cb', // Jane Smith
    canal: '60d0fe4f5311236168a109cd',
    dateCreation: new Date('2023-01-04T10:05:00'),
    estEdite: false,
    reactions: [],
    fichiers: []
  }
];

// Conversations privées
const mockConversationsPrivees = [
  {
    _id: '60d0fe4f5311236168a109d0',
    participants: [
      '60d0fe4f5311236168a109ca', // John Doe
      '60d0fe4f5311236168a109cb'  // Jane Smith
    ],
    dateCreation: new Date('2023-01-05')
  }
];

// Messages privés
const mockMessagesPrives = [
  {
    _id: '60d0fe4f5311236168a109d1',
    contenu: 'Salut Jane, comment ça va?',
    auteur: '60d0fe4f5311236168a109ca', // John Doe
    conversation: '60d0fe4f5311236168a109d0',
    dateCreation: new Date('2023-01-05T11:00:00'),
    estEdite: false,
    estLu: true,
    reactions: [],
    fichiers: []
  },
  {
    _id: '60d0fe4f5311236168a109d2',
    contenu: 'Très bien, merci John!',
    auteur: '60d0fe4f5311236168a109cb', // Jane Smith
    conversation: '60d0fe4f5311236168a109d0',
    dateCreation: new Date('2023-01-05T11:05:00'),
    estEdite: false,
    estLu: false,
    reactions: [],
    fichiers: []
  }
];

// Notifications
const mockNotifications = [
  {
    _id: '60d0fe4f5311236168a109d3',
    type: 'message',
    destinataire: '60d0fe4f5311236168a109ca', // John Doe
    emetteur: '60d0fe4f5311236168a109cb', // Jane Smith
    reference: '60d0fe4f5311236168a109d2', // Message de Jane
    onModel: 'MessagePrivate',
    contenu: 'Nouveau message de Jane Smith',
    estLue: false,
    dateCreation: new Date('2023-01-05T11:05:00')
  }
];

module.exports = {
  mockUsers,
  mockWorkspaces,
  mockCanaux,
  mockMessages,
  mockConversationsPrivees,
  mockMessagesPrives,
  mockNotifications
};
