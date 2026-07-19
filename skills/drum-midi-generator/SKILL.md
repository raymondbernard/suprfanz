---
name: "drum-midi-generator"
description: "Generate valid blues drum MIDI files with shuffle, slow blues, rock, boogie, and slow minor patterns for the Cosmic Blues Band setlist."
---

# Drum MIDI Generator

## Purpose
Generate valid blues drum MIDI files for the Cosmic Blues Band setlist. Each file contains a full drum track with intro fill, main groove (3 choruses), chorus-ending fills, and outro fill.

## Location
- **Generator script:** `blues/generate_drum_midi.py`
- **Output directory:** `blues/midi/`
- **Song charts:** `blues/songs/*.md`

## Song Definitions

Each song is defined as `(filename, tempo_bpm, bars_per_chorus, pattern_type)`:

| # | Song | Tempo | Bars | Pattern |
|---|------|-------|------|---------|
| 01 | Green Onions | 120 | 12 | medium_rock |
| 02 | Going Down | 100 | 12 | shuffle |
| 03 | Little Red Rooster | 70 | 12 | slow_blues |
| 04 | Rock Me Baby | 85 | 12 | slow_blues |
| 05 | King Bee | 95 | 12 | shuffle |
| 06 | Mannish Boy | 80 | 12 | shuffle |
| 07 | Red House | 75 | 12 | slow_blues |
| 08 | Rollin' and Tumblin' | 90 | 8 | shuffle |
| 09 | Back Door Man | 100 | 12 | medium_rock |
| 10 | Love Her With a Feeling | 90 | 12 | shuffle |
| 11 | Dust My Broom | 105 | 12 | shuffle |
| 12 | Stormy Monday | 65 | 12 | slow_blues |
| 13 | Crossroads | 140 | 12 | medium_rock |
| 14 | The Thrill Is Gone | 70 | 12 | slow_minor |
| 15 | Born Under a Bad Sign | 80 | 12 | slow_blues |
| 16 | Sunshine of Your Love | 110 | 12 | medium_rock |
| 17 | Hoochie Coochie Man | 85 | 12 | shuffle |
| 18 | Tobacco Road | 100 | 12 | medium_rock |
| 19 | Key to the Highway | 75 | 8 | slow_blues |
| 20 | Boom Boom | 95 | 12 | boogie |
| 21 | Spoonful | 85 | 12 | slow_blues |
| 22 | Bad Bad Whiskey | 90 | 12 | shuffle |
| 23 | Alabama Train | 100 | 12 | shuffle |
| 24 | Champagne and Reefer | 90 | 12 | shuffle |
| 25 | Sweet Little Angel | 70 | 12 | slow_blues |
| 26 | Bad to the Bone | 85 | 12 | medium_rock |
| 27 | La Grange | 120 | 12 | boogie |
| 28 | Baby Please Don't Go | 100 | 12 | shuffle |
| 29 | I Put a Spell on You | 80 | 12 | slow_minor |
| 30 | I Got Mine | 110 | 12 | medium_rock |

## Drum Patterns

### GM Drum Map
- 36 = Kick | 38 = Snare | 42 = Closed Hat | 46 = Open Hat
- 49 = Crash | 50 = High Tom | 48 = Mid Tom | 45 = Low Tom
- 51 = Ride | 44 = Pedal Hat

### Pattern Types

**shuffle** — Swung 8th notes on hats, kick on 1 & 3, snare on 2 & 4, extra kick on 4&
**slow_blues** — Sparse, kick on 1 & 3, snare on 2 & 4, ghost notes, hats on quarters
**medium_rock** — Straight 8th rock, kick on 1 & 3 (+ & of 3), snare on 2 & 4, hats on all 8ths
**boogie** — Driving 8ths, kick on every beat, snare on 2 & 4, hats on 8ths
**slow_minor** — Very sparse, ride on quarters, kick on 1 & 3, light snare on 2 & 4

## MIDI File Structure

- **Format:** 1 (multi-track, but single drum track)
- **PPQN:** 480 ticks per quarter note
- **Channel:** 9 (GM drum channel)
- **Total bars:** `bars_per_chorus x 3 choruses`
- **Structure per chorus:** Groove bars + fill on last bar
- **Bar 0:** Intro fill + groove
- **Last bar:** Outro fill

## Critical Implementation Notes

### Variable-Length Encoding (MUST USE)
MIDI delta times use variable-length encoding. A proper `encode_varlen()` function is required:

```python
def encode_varlen(value):
    if value == 0:
        return bytes([0])
    bytes_out = []
    bytes_out.append(value & 0x7F)
    value >>= 7
    while value > 0:
        bytes_out.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(bytes_out))
```

### Meta Events
Each track must start with:
- Tempo (0x51) — 3 bytes, microseconds per quarter = `60,000,000 / bpm`
- Time signature (0x58) — 4/4 = `bytes([4, 2, 24, 8])`
- Track name (0x03) — song filename without extension
- End with End-of-Track (0x2F) at delta 0

### Note Events
- Note on: `0x99` (channel 9) + note + velocity
- Note off: `0x89` (channel 9) + note + 0x00
- Duration between on/off: typically 60 ticks (1/8 note at 480 PPQN)

### Track Chunk Assembly
```python
header_chunk = b'MThd' + struct.pack('>I', 6) + struct.pack('>HHH', 1, 1, 480)
track_data = b''.join(events)
track_chunk = b'MTrk' + struct.pack('>I', len(track_data)) + track_data
```

## Usage

```bash
cd blues
python generate_drum_midi.py
```

Regenerates all 30 MIDI files in `blues/midi/`.

## Verification

After generating, verify with:
```python
import struct
with open('midi/01-green-onions.mid', 'rb') as f:
    data = f.read()
assert data[:4] == b'MThd'
fmt, ntracks, ppqn = struct.unpack('>HHH', data[8:14])
assert ppqn == 480
track_len = struct.unpack('>I', data[18:22])[0]
assert track_len > 1000  # should be thousands of bytes
```

## Adding New Songs

1. Add entry to `SONGS` list in `generate_drum_midi.py` as `(filename, tempo, bars, pattern)`
2. Run `python generate_drum_midi.py`
3. Verify the output file has note events

## Common Pitfalls (FIXED)

- **DO NOT** use raw byte arithmetic for delta times — use `encode_varlen()`
- **DO NOT** forget the End-of-Track meta event (0x2F)
- **DO NOT** skip the note-off events — some DAWs require them
- **DO NOT** put note events on wrong channel — drums MUST be channel 9 (0x99/0x89)
