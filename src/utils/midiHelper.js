// Stocke l'interface MIDI physique de sortie
let activeMidiOutput = null;

/**
 * Initialise l'accès à la Web MIDI API du navigateur (Exige un contexte HTTPS ou localhost)
 */
export const initWebMidi = () => {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }) // REQUIS pour le SysEx du microKORG
      .then((midiAccess) => {
        const outputs = Array.from(midiAccess.outputs.values());
        if (outputs.length > 0) {
          activeMidiOutput = outputs[0]; // Sélectionne par défaut la première interface physique
          console.log(`[MIDI ALAPATCH] Connecté au port de sortie : ${activeMidiOutput.name}`);
        } else {
          console.warn("[MIDI ALAPATCH] Aucune interface de sortie MIDI physique trouvée.");
        }
      })
      .catch(err => console.error("[MIDI ALAPATCH] Accès refusé par le navigateur : ", err));
  } else {
    console.error("[MIDI ALAPATCH] Ce navigateur ne gère pas l'API Web MIDI.");
  }
};

/**
 * Transmet un message de changement de paramètre (Parameter Change) en SysEx
 * @param {number} parameterId - L'adresse interne du bouton (ex: 0x1E pour le Cutoff)
 * @param {number} value - La valeur du curseur (0 à 127)
 */
export const sendMicroKorgParam = (parameterId, value) => {
  if (!activeMidiOutput) return; // Si aucune carte MIDI n'est branchée, on ignore

  // Trame System Exclusive standard du protocole Korg microKORG Original (2002)
  const sysExMessage = [
    0xF0,        // Début du message SysEx
    0x42,        // Identification du fabricant (Korg)
    0x30,        // Canal MIDI Global (0x30 = Canal 1)
    0x58,        // Identification du modèle (microKORG)
    0x41,        // Type de commande : Parameter Change
    parameterId, // ID du potentiomètre ciblé (ex: 30 pour le Cutoff)
    value,       // Position du curseur (0-127)
    0xF7         // Fin du message SysEx
  ];

  // Envoi physique immédiat dans le câble USB-MIDI
  activeMidiOutput.send(sysExMessage);
};
