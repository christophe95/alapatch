let selectedMidiOutput = null;
let selectedMidiInput = null;

// Fonctions de rappel pour transmettre les logs à l'interface React
let onLogCallback = null;

/**
 * Permet au composant React d'enregistrer sa fonction d'affichage des logs
 */
export const registerMidiLogger = (callback) => {
  onLogCallback = callback;
};

// Utilitaire pour formater un tableau de bytes en chaîne Hexadécimale propre
const bytesToHexStr = (bytes) => {
  return Array.from(bytes)
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
};

const logMidiActivity = (direction, directionArrow, rawData) => {
  if (onLogCallback) {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const hexString = bytesToHexStr(rawData);
    onLogCallback({
      text: `[${timestamp}] ${directionArrow} ${hexString}`,
      type: direction // 'in' ou 'out' pour la couleur
    });
  }
};

export const initWebMidi = () => {
  return new Promise((resolve) => {
    if (!navigator.requestMIDIAccess) {
      return resolve({ inputs: [], outputs: [] });
    }

    navigator.requestMIDIAccess({ sysex: true })
      .then((midiAccess) => {
        const outputs = Array.from(midiAccess.outputs.values());
        const inputs = Array.from(midiAccess.inputs.values());
        
        if (outputs.length > 0 && !selectedMidiOutput) selectedMidiOutput = outputs[0];
        if (inputs.length > 0 && !selectedMidiInput) setupMidiInputListener(inputs[0]);

        resolve({
          outputs: outputs.map(port => ({ id: port.id, name: port.name })),
          inputs: inputs.map(port => ({ id: port.id, name: port.name }))
        });
      })
      .catch(() => resolve({ inputs: [], outputs: [] }));
  });
};

export const changeMidiOutputPort = (portId) => {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    const outputs = Array.from(midiAccess.outputs.values());
    const target = outputs.find(port => port.id === portId);
    if (target) selectedMidiOutput = target;
  });
};

export const changeMidiInputPort = (portId) => {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
    const inputs = Array.from(midiAccess.inputs.values());
    const target = inputs.find(port => port.id === portId);
    if (target) setupMidiInputListener(target);
  });
};

const setupMidiInputListener = (inputPort) => {
  if (selectedMidiInput) selectedMidiInput.onmidimessage = null;
  selectedMidiInput = inputPort;
  selectedMidiInput.onmidimessage = (event) => {
    const data = event.data;

    // PROTECTION ET FILTRAGE : Si l'octet est une horloge MIDI (0xF8), on l'ignore
    if (data[0] === 0xF8) return;

    // Intercepte et logue uniquement les vrais messages (SysEx, Notes, Molettes)
    logMidiActivity('in', '⬅️ IN ', data);
  };
};

export const sendMicroKorgParam = (parameterId, value) => {
  if (!selectedMidiOutput) return;
  const sysExMessage = [0xF0, 0x42, 0x30, 0x58, 0x41, parameterId, value, 0xF7];
  
  selectedMidiOutput.send(sysExMessage);
  
  // Logue la sortie MIDI (Vers le microKORG)
  logMidiActivity('out', '➡️ OUT', sysExMessage);
};
