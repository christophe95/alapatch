let selectedMidiOutput = null;
let selectedMidiInput = null;

/**
 * Initialise l'accès MIDI et renvoie les entrées et sorties disponibles
 * @returns {Promise<{inputs: Array, outputs: Array}>}
 */
export const initWebMidi = () => {
  return new Promise((resolve) => {
    if (!navigator.requestMIDIAccess) {
      console.error("[MIDI] L'API Web MIDI n'est pas supportée.");
      return resolve({ inputs: [], outputs: [] });
    }

    navigator.requestMIDIAccess({ sysex: true })
      .then((midiAccess) => {
        const outputs = Array.from(midiAccess.outputs.values());
        const inputs = Array.from(midiAccess.inputs.values());
        
        // Sélection par défaut du premier périphérique trouvé si non défini
        if (outputs.length > 0 && !selectedMidiOutput) selectedMidiOutput = outputs[0];
        if (inputs.length > 0 && !selectedMidiInput) setupMidiInputListener(inputs[0]);

        resolve({
          outputs: outputs.map(port => ({ id: port.id, name: port.name })),
          inputs: inputs.map(port => ({ id: port.id, name: port.name }))
        });
      })
      .catch(err => {
        console.error("[MIDI] Accès refusé : ", err);
        resolve({ inputs: [], outputs: [] });
      });
  });
};

/**
 * Modifie le port de sortie (MIDI Out)
 */
export const changeMidiOutputPort = (portId) => {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    const outputs = Array.from(midiAccess.outputs.values());
    const target = outputs.find(port => port.id === portId);
    if (target) selectedMidiOutput = target;
  });
};

/**
 * Modifie le port d'entrée (MIDI In) et branche l'écouteur
 */
export const changeMidiInputPort = (portId) => {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    const inputs = Array.from(midiAccess.inputs.values());
    const target = inputs.find(port => port.id === portId);
    if (target) setupMidiInputListener(target);
  });
};

/**
 * Active l'écoute des messages envoyés par le microKORG
 */
const setupMidiInputListener = (inputPort) => {
  if (selectedMidiInput) {
    selectedMidiInput.onmidimessage = null; // Nettoie l'ancien écouteur
  }
  selectedMidiInput = inputPort;
  selectedMidiInput.onmidimessage = (event) => {
    const data = event.data;
    // C'est ici que l'on interceptera plus tard les dumps SysEx reçus du microKORG
    console.log("[MIDI IN] Message reçu du microKORG :", Array.from(data).map(b => b.toString(16).toUpperCase()));
  };
  console.log(`[MIDI IN] Écoute active sur : ${selectedMidiInput.name}`);
};

/**
 * Envoie la trame SysEx au microKORG (MIDI Out)
 */
export const sendMicroKorgParam = (parameterId, value) => {
  if (!selectedMidiOutput) return;
  const sysExMessage = [0xF0, 0x42, 0x30, 0x58, 0x41, parameterId, value, 0xF7];
  selectedMidiOutput.send(sysExMessage);
};
