/**
 * Plays the audio sound for an incoming notification
 */
export function playSoundNotification() {
  new Audio("/assets/audio/notification.wav").play()?.catch((reason) => {
    console.log("Failed to play notification audio: " + reason);
  });
}

/**
 * Plays the audio sound for an incoming message
 */
export function playSoundMessageIn() {
  new Audio("/assets/audio/message_in.wav").play()?.catch((reason) => {
    console.log("Failed to play incoming message audio: " + reason);
  });
}

/**
 * Plays the audio sound for an outgoing message
 */
export function playSoundMessageOut() {
  new Audio("/assets/audio/message_out.wav").play()?.catch((reason) => {
    console.log("Failed to play outgoing message audio: " + reason);
  });
}

/**
 * Plays the audio sound for a new tapback
 */
export function playSoundTapback() {
  new Audio("/assets/audio/tapback.wav").play()?.catch((reason) => {
    console.log("Failed to play tapback audio: " + reason);
  });
}
