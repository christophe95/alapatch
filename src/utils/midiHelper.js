// Variable globale contenant l'interface MIDI actuellement sélectionnée par l'utilisateur
let selectedMidiOutput = null;

/**
 * Initialise l'accès MIDI et renvoie la liste des périphériques physiques disponibles
 * @returns {Promise<Array>} Liste des ports de sortie MIDI [{id, name}, ...]
 */
export const initWebMidi = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.requestMIDIAccess) {
      console.error("[MIDI] L'API Web MIDI n'est pas supportée.");
      return resolve([]);
    }

    navigator.requestMIDIAccess({ sysex: true })
      .then((midiAccess) => {
        const outputs = Array.from(midiAccess.outputs.values());
        
        // Si un périphérique est déjà branché, on le sélectionne par défaut
        if (outputs.length > 0 && !selectedMidiOutput) {
          selectedMidiOutput = outputs[0];
        }

        // On renvoie un tableau d'objets simples exploitables par React
        const devices = outputs.map(port => ({ id: port.id, name: port.name }));
        resolve(devices);
      })
      .catch(err => {
        console.error("[MIDI] Accès refusé : ", err);
        resolve([]);
      });
  });
};

/**
 * Permet à l'utilisateur de changer d'interface MIDI depuis le menu déroulant
 * @param {string} portId - L'identifiant du port choisi
 */
export const changeSelectedMidiPort = (portId) => {
  if (!navigator.requestMIDIAccess) return;

  navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    const outputs = Array.from(midiAccess.outputs.values());
    const targetPort = outputs.find(port => port.id === portId);
    if (targetPort) {
      selectedMidiOutput = targetPort;
      console.log(`[MIDI] Nouveau port sélectionné : ${selectedMidiOutput.name}`);
    }
  });
};

/**
 * Envoie la trame SysEx au port actuellement sélectionné
 */
export const sendMicroKorgParam = (parameterId, value) => {
  if (!selectedMidiOutput) return; // Si aucun choix n'est fait, on n'envoie rien

  const sysExMessage = [
    0xF0, 0x42, 0x30, 0x58, 0x41,
    parameterId,
    value,
    0xF7
  ];

  selectedMidiOutput.send(sysExMessage);
};
