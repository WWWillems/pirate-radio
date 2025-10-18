const generationPrompt = `Generate a natural-sounding conversation as a script for a Podcast for a radio show being aired on Glenelg Pirate Radio about ... 
Write it like a cozy, lively morning radio show between where the friendly host interviews the guest about the given topic.

The podcast should:
- Mention the current date
- Describe the weather in the weather segment.

Keep the pacing dynamic: mix quick banter with moments of warmth and reflection.
Use short, conversational sentences with natural hesitations, laughter, and reactions.
Include small imperfections — unfinished thoughts, interruptions, or filler words ("you know", "I mean").
Make it sound spontaneous, human, and emotionally warm rather than scripted.
Each host should respond to what the other says, creating a real back-and-forth rhythm.

PREPARATIONS FOR THE PODCAST:
- Select a guest who is an expert in the given topic
- The host should research the given topic and the guest's expertise and knowledge about the given topic
- The host should prepare questions for the guest to answer
- The host should prepare the guest's bio and information

PODCAST FORMAT:
- Start - The host briefly mentions the current date and time and introduces the show
- Weather - The host describes the weather in the weather segment.
- Introduction - The host introduces the guest and the topic. The guest introduces themselves and shares their expertise and knowledge about the given topic.
- Interview - The host interviews the guest about the given topic
- Discussion - The host and guest discuss the given topic
- Conclusion - The host and guest conclude the interview
- Wrap-up - The host and guest wrap up the interview
- Outro - The host and guest say goodbye

HOST PERSONA:
- Has an upbeat, curious tone
- Is friendly and engaging
- Is curious about the world
- Is interested in the topic
- Is interested in the guest
- Is interested in the conversation
- Is interested in the audience
- Is interested in the conversation
- Interviews the guest about the given topic

GUEST PERSONA:
- Is calm, witty, and playful
- Is an expert in the given topic
- Is knowledgeable about the given topic
- Is interested in the given topic
- Is willing to share their expertise and knowledge about the given topic
- Talks elaborately and in depth about the given topic

CONTENT DEPTH - Make it interesting and substantive:
- Choose 2-3 SPECIFIC topics (e.g., a particular historical event, a unique local tradition, a specific place, a seasonal phenomenon, local culture/food/music)
- Go DEEP on each topic - include specific details, interesting facts, personal anecdotes, or surprising information
- The hosts should ask follow-up questions and explore "why" and "how" - not just skim the surface
- Include concrete examples, names, dates, or vivid descriptions rather than vague generalities
- Show genuine curiosity - have one host teach the other something specific they didn't know
- Connect topics to broader themes or personal experiences to make them relatable
- Avoid generic statements like "Nova Scotia is beautiful" - instead describe WHAT makes it beautiful with specific sensory details
- If discussing history or culture, include a specific story or moment that brings it to life

IMPORTATNT for music segments, follow these detailed requirements:
- Be specific and original: Avoid vague or generic descriptions like “pop track” or “jazz loop.” Each piece should have a unique sonic identity.
- Instrumentation: Clearly list the core instruments (e.g., acoustic guitar, piano, synth bass, cello, shakers) and mention any textural layers (e.g., ambient pads, rhythmic plucks, soft arpeggios).
- Mood & energy: Describe the emotion and energy curve (e.g., “starts calm and reflective, grows into an inspiring crescendo, then gently fades”).
- Tempo & rhythm: Include approximate tempo (slow, moderate, fast, e.g., 90 BPM) and note the rhythmic feel (e.g., swung, syncopated, straight, percussive).
- Arrangement: Explicitly outline how the track evolves — its intro, build-up, climax, and resolution.
    - Example: “Begins with solo piano and distant pads → introduces soft drums and bass halfway → builds to a layered chorus with strings and light cymbals → gradually strips back to piano-only outro.”
- Avoid references to copyrighted works, artist names, or existing songs.
- Focus on instrumentation and structure, not lyrics or vocals.
- Keep each composition clearly distinct from others to avoid repetitive loops.

Example prompt (good):
“A cinematic piece starting with gentle piano and airy synths, gradually adding low strings and soft percussion. Midway, the tempo picks up with layered drums and warm brass accents, reaching a hopeful climax before tapering into a quiet harp and pad outro.”

Example prompt (bad):
“An epic soundtrack” or “pop beat loop.”
`;

export default generationPrompt;
