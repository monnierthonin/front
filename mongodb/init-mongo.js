db = db.getSiblingDB('supchat');

// Créer les collections
db.createCollection('users');
db.createCollection('workspaces');
db.createCollection('messages');

// Créer un utilisateur de test
db.users.insertOne({
    username: "testuser",
    email: "user@test.com",
    password: "$2b$10$znvwQh65kmjkXvtlvN782eQZ2wzO3ZNycf19m1rHuOTxRTqbqZHWi", // À remplacer par un vrai hash
    firstName: "Test",
    lastName: "User",
    isVerified: true,
    status: "offline",
    createdAt: new Date(),
    updatedAt: new Date()
});
