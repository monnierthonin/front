const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const PDFThumbnail = require('pdf-thumbnail');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// Configuration des prévisualisations
const CONFIG = {
    image: {
        width: 300,
        height: 300,
        fit: 'inside',
        format: 'jpeg',
        quality: 80
    },
    video: {
        timestamp: '00:00:01', // Capture la première seconde
        size: '300x?',
        format: 'jpg'
    },
    pdf: {
        width: 300,
        height: 400
    }
};

/**
 * Crée une prévisualisation pour une image
 * @param {string} cheminFichier - Chemin du fichier source
 * @param {string} cheminPreview - Chemin où sauvegarder la prévisualisation
 */
const creerPreviewImage = async (cheminFichier, cheminPreview) => {
    await sharp(cheminFichier)
        .resize(CONFIG.image.width, CONFIG.image.height, {
            fit: CONFIG.image.fit,
            withoutEnlargement: true
        })
        .jpeg({ quality: CONFIG.image.quality })
        .toFile(cheminPreview);
};

/**
 * Crée une prévisualisation pour un PDF
 * @param {string} cheminFichier - Chemin du fichier source
 * @param {string} cheminPreview - Chemin où sauvegarder la prévisualisation
 */
const creerPreviewPDF = async (cheminFichier, cheminPreview) => {
    const buffer = await PDFThumbnail.fromPath(cheminFichier, {
        width: CONFIG.pdf.width,
        height: CONFIG.pdf.height,
        page: 1
    });
    await fs.writeFile(cheminPreview, buffer);
};

/**
 * Crée une prévisualisation pour une vidéo
 * @param {string} cheminFichier - Chemin du fichier source
 * @param {string} cheminPreview - Chemin où sauvegarder la prévisualisation
 */
const creerPreviewVideo = (cheminFichier, cheminPreview) => {
    return new Promise((resolve, reject) => {
        ffmpeg(cheminFichier)
            .screenshots({
                timestamps: [CONFIG.video.timestamp],
                filename: path.basename(cheminPreview),
                folder: path.dirname(cheminPreview),
                size: CONFIG.video.size
            })
            .on('end', resolve)
            .on('error', reject);
    });
};

/**
 * Crée une prévisualisation pour un fichier audio
 * @param {string} cheminFichier - Chemin du fichier source
 * @param {string} cheminPreview - Chemin où sauvegarder la prévisualisation
 */
const creerPreviewAudio = async (cheminFichier, cheminPreview) => {
    // Utiliser une image par défaut pour l'audio
    const imageAudioDefaut = path.join(__dirname, '..', '..', 'public', 'images', 'audio-preview.png');
    await fs.copyFile(imageAudioDefaut, cheminPreview);
};

/**
 * Crée une prévisualisation pour un fichier
 * @param {string} cheminFichier - Chemin du fichier source
 * @param {string} mimeType - Type MIME du fichier
 * @returns {Promise<string>} - Chemin de la prévisualisation
 */
const creerPreview = async (cheminFichier, mimeType) => {
    const dossierPreviews = path.join(__dirname, '..', '..', 'public', 'previews');
    await fs.mkdir(dossierPreviews, { recursive: true });

    const nomPreview = `${path.basename(cheminFichier, path.extname(cheminFichier))}-preview.jpg`;
    const cheminPreview = path.join(dossierPreviews, nomPreview);

    try {
        const type = mimeType.split('/')[0];
        
        switch (type) {
            case 'image':
                await creerPreviewImage(cheminFichier, cheminPreview);
                break;
            case 'application':
                if (mimeType === 'application/pdf') {
                    await creerPreviewPDF(cheminFichier, cheminPreview);
                }
                break;
            case 'video':
                await creerPreviewVideo(cheminFichier, cheminPreview);
                break;
            case 'audio':
                await creerPreviewAudio(cheminFichier, cheminPreview);
                break;
            default:
                throw new Error('Type de fichier non supporté pour la prévisualisation');
        }

        return `/previews/${nomPreview}`;
    } catch (error) {
        console.error('Erreur lors de la création de la prévisualisation:', error);
        throw error;
    }
};

module.exports = {
    creerPreview
};
