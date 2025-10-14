# Pirate Radio - Text-to-Speech with Kokoro-82M

A Node.js script that uses [fal.ai](https://fal.ai/) to generate speech from text using the [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) text-to-speech model.

**Kokoro-82M** is an open-weight TTS model with 82 million parameters, delivering high-quality speech synthesis with Apache-licensed weights. It's fast, cost-efficient (under $1/M characters), and supports 54 voices across 8 languages.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure API Key:**
   - Create a `.env` file in the project root
   - Get your API key from [fal.ai](https://fal.ai/dashboard/keys) (sign up is free)
   - Add your key to the `.env` file:
     ```
     FAL_KEY=your_fal_key_here
     ```

## Usage

### Basic usage (uses default text and voice):
```bash
npm start
```

### Custom text:
```bash
node index.js "Your custom text here"
```

### Custom text with custom output filename:
```bash
node index.js "Your custom text here" "my-audio.wav"
```

### Custom text, filename, and voice:
```bash
node index.js "Your custom text here" "my-audio.wav" "af_bella"
```

## Available Voices

The model includes **54 voices** across **8 languages**. Some examples:
- `af_heart` (default) - American Female
- `af_bella`, `af_sarah` - Other American Female voices
- `am_adam`, `am_michael` - American Male voices  
- `bf_emma`, `bf_isabella` - British Female voices
- `bm_george`, `bm_lewis` - British Male voices

See the full list at [VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)

## Examples

```bash
# Pirate greeting with default voice
node index.js "Ahoy, matey! Welcome to Pirate Radio!" "pirate-greeting.wav"

# British accent
node index.js "Good day, mate!" "british.wav" "bm_george"

# Different female voice
node index.js "Hello from Kokoro!" "hello.wav" "af_bella"
```

## Features

- ✨ Simple and easy to use
- 🎙️ High-quality text-to-speech using Kokoro-82M (82M parameters)
- 🗣️ **54 voices** across **8 languages**
- 💾 Saves audio output to WAV files (24kHz)
- 🔧 Configurable via command-line arguments
- ⚡ Fast and cost-efficient (under $1/M characters)
- 📜 Apache-licensed model

## API

The script exports a `textToSpeech` function that can be imported:

```javascript
import { textToSpeech } from './index.js';

await textToSpeech('Hello world!', 'hello.wav', 'af_heart');
```

## Requirements

- Node.js 18+ (ES modules & native fetch support)
- fal.ai API key (free tier available)

## Model Information

- **Architecture:** StyleTTS 2 + ISTFTNet
- **Parameters:** 82 million
- **Training Cost:** ~$1000 (1000 GPU hours)
- **License:** Apache 2.0
- **Cost:** Under $1 per million characters (~$0.06 per hour of audio)
- **GitHub:** https://github.com/hexgrad/kokoro
- **Demo:** https://hf.co/spaces/hexgrad/Kokoro-TTS
- **Provider:** fal.ai (official inference provider)

