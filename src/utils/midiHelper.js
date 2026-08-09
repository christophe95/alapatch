let selectedMidiOutput = null;
let selectedMidiInput = null;
let onLogCallback = null;

// Nouvelle fonction de rappel pour transmettre le dump reçu à Redux
let onPatchReceivedCallback = null;

export const registerMidiLogger = (callback) => { onLogCallback = callback; };

/**
 * Permet à Redux d'enregistrer sa fonction de capture de patch
 */
export const registerPatchReceiver = (callback) => {
  onPatchReceivedCallback = callback;
};

const bytesToHexStr = (bytes) => {
  return Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
};

const logMidiActivity = (direction, directionArrow, rawData) => {
  if (onLogCallback) {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logMidiActivityRaw(timestamp, direction, directionArrow, rawData);
  }
};

const logMidiActivityRaw = (timestamp, direction, directionArrow, rawData) => {
  if (rawData.length > 10) {
    // Si la trame est trop longue (comme un dump), on résume l'affichage dans la console noire
    onLogCallback({ text: `[${timestamp}] ${directionArrow} [DUMP SYSEX RECEVED - ${rawData.length} BYTES]`, type: direction });
  } else {
    onLogCallback({ text: `[${timestamp}] ${directionArrow} ${bytesToHexStr(rawData)}`, type: direction });
  }
};

export const initWebMidi = () => {
  return new Promise((resolve) => {
    if (!navigator.requestMIDIAccess) return resolve({ inputs: [], outputs: [] });
    navigator.requestMIDIAccess({ sysex: true }).then((midiAccess) => {
      const outputs = Array.from(midiAccess.outputs.values());
      const inputs = Array.from(midiAccess.inputs.values());
      if (outputs.length > 0 && !selectedMidiOutput) selectedMidiOutput = outputs[0];
      if (inputs.length > 0 && !selectedMidiInput) setupMidiInputListener(inputs[0]);
      resolve({
        outputs: outputs.map(port => ({ id: port.id, name: port.name })),
        inputs: inputs.map(port => ({ id: port.id, name: port.name }))
      });
    }).catch(() => resolve({ inputs: [], outputs: [] }));
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

/**
 * Envoie une requête de "Current Parameter Dump" au microKORG
 */
export const requestCurrentPatchDump = () => {
  if (!selectedMidiOutput) return;

  // Trame officielle de requête de dump de paramètre courant Korg microKORG
  const requestMessage = [
    0xF0, // Start SysEx
    0x42, // Korg ID
    0x30, // Canal global 1
    0x58, // microKORG ID
    0x10, // Message de requête (Current Data Dump Request)
    0xF7  // End SysEx
  ];

  selectedMidiOutput.send(requestMessage);
  logMidiActivity('out', '➡️ REQ', requestMessage);
};

const setupMidiInputListener = (inputPort) => {
  if (selectedMidiInput) selectedMidiInput.onmidimessage = null;
  selectedMidiInput = inputPort;
  selectedMidiInput.onmidimessage = (event) => {
    const data = event.data;
    if (data[0] === 0xF8) return; // Ignore l'horloge temporelle F8

    // Analyse : S'agit-il d'une réponse de Dump du microKORG ?
    // 0xF0 (SysEx), 0x42 (Korg), Canal, 0x58 (microKorg), 0x40 (Current Data Dump)
    if (data[0] === 0xF0 && data[1] === 0x42 && data[3] === 0x58 && data[4] === 0x40) {
      logMidiActivity('in', '⬅️ IN ', data);
      if (onPatchReceivedCallback) {
        // Envoie le tableau de bytes brut à l'application
        onPatchReceivedCallback(data);
      }
      return;
    }

    logMidiActivity('in', '⬅️ IN ', data);
  };
};

export const sendMicroKorgParam = (parameterId, value) => {
  if (!selectedMidiOutput) return;
  const sysExMessage = [0xF0, 0x42, 0x30, 0x58, 0x41, parameterId, value, 0xF7];
  selectedMidiOutput.send(sysExMessage);
  logMidiActivity('out', '➡️ OUT', sysExMessage);
};
