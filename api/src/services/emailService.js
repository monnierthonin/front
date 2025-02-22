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

// Fonction pour envoyer un email de réinitialisation de mot de passe
const envoyerEmailReinitialisationMotDePasse = async (email, nom, token) => {
  if (!transporter) {
    throw new Error('Le service d\'email n\'est pas configuré correctement');
  }

  const clientUrl = process.env.CLIENT_URL;

  try {
    const info = await transporter.sendMail({
      from: `"SupChat" <${process.env.SMTP_FROM || 'noreply@supchat.com'}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe SupChat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Bonjour ${nom},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe SupChat. Cliquez sur le bouton ci-dessous pour procéder :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clientUrl}/api/v1/auth/reinitialiser-mot-de-passe/${token}" 
               style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
          <p>${clientUrl}/api/v1/auth/reinitialiser-mot-de-passe/${token}</p>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email en toute sécurité.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
      `
    });

    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
  }
};

// Fonction pour envoyer un email d'invitation à un workspace
const envoyerEmailInvitationWorkspace = async (email, nomInviteur, nomWorkspace, description, urlInvitation) => {
  if (!transporter) {
    throw new Error('Le service d\'email n\'est pas configuré correctement');
  }

  try {
    const info = await transporter.sendMail({
      from: `"SupChat" <${process.env.SMTP_FROM || 'noreply@supchat.com'}>`,
      to: email,
      subject: `Invitation à rejoindre le workspace ${nomWorkspace}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .container {
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .workspace-info {
                    background-color: #fff;
                    border-radius: 4px;
                    padding: 15px;
                    margin: 20px 0;
                    border: 1px solid #eee;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .button:hover {
                    background-color: #45a049;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 0.9em;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Invitation à rejoindre un workspace</h1>
                </div>

                <p>Bonjour,</p>
                
                <p><strong>${nomInviteur}</strong> vous invite à rejoindre le workspace <strong>${nomWorkspace}</strong> sur SupChat.</p>

                <div class="workspace-info">
                    <h3>${nomWorkspace}</h3>
                    <p>${description}</p>
                </div>

                <div style="text-align: center;">
                    <a href="${urlInvitation}" class="button">Rejoindre le workspace</a>
                </div>

                <p>Ce lien d'invitation expirera dans 24 heures.</p>

                <div class="footer">
                    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                    <p> 2025 SupChat. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });

    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email d\'invitation au workspace');
  }
};

module.exports = {
  envoyerEmailVerification,
  envoyerEmailReinitialisationMotDePasse,
  envoyerEmailInvitationWorkspace
};
