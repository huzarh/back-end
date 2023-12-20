const readline = require('readline');
const tts = require('simple-tts-mp3');

// Create a readline interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user to enter the text
rl.question('Enter the text to read: ', (text) => {
  // Set the desired language
  const language = 'en';

  // Convert text to speech and play the audio
  tts.Speaker.speak(language, text)
    .then(() => {
      console.log('Speech playback complete.');
    })
    .catch((error) => {
      console.error('Error:', error);
    })
    .finally(() => {
      // Close the readline interface
      rl.close();
    });
});

// Event listener to handle readline interface close
rl.on('close', () => {
  console.log('Exiting...');
  process.exit(0);
});
