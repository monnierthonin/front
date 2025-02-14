const nodemailer = require('nodemailer');

// Créer le transporteur SMTP
const createTransporter = () => {
  // Vérifier que les identifiants sont présents
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Les identifiants SMTP sont manquants dans les variables d\'environnement');
  }

  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Vérifier la configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Erreur de configuration SMTP:', error);
    } else {
      console.log('Service d\'email initialisé avec succès');
    }
  });

  return transporter;
};

// Créer une instance du transporteur
let transporter;
try {
  transporter = createTransporter();
} catch (error) {
  console.error('Erreur lors de la création du service d\'email:', error.message);
}

// Fonction pour envoyer un email de vérification
const envoyerEmailVerification = async (email, nom, token) => {
  if (!transporter) {
    throw new Error('Le service d\'email n\'est pas configuré correctement');
  }

  const clientUrl = process.env.CLIENT_URL;

  try {
    const info = await transporter.sendMail({
      from: `"SupChat" <${process.env.SMTP_FROM || 'noreply@supchat.com'}>`,
      to: email,
      subject: 'Vérifiez votre compte SupChat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue sur SupChat !</h2>
          <p>Bonjour ${nom},</p>
          <p>Merci de vous être inscrit sur SupChat. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clientUrl}/api/v1/auth/verifier-email/${token}" 
               style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
              Vérifier mon compte
            </a>
          </div>
          <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
          <p>${clientUrl}/api/v1/auth/verifier-email/${token}</p>
          <p>Ce lien expirera dans 24 heures.</p>
          <p>Si vous n'avez pas créé de compte sur SupChat, vous pouvez ignorer cet email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
      `
    });

    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
  }
};

module.exports = {
  envoyerEmailVerification
};
