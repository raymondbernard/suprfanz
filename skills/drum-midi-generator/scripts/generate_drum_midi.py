"""
Cosmic Blues Band — Drum MIDI Generator
Generates standard blues drum MIDI files for each song in the setlist.

Each MIDI file includes:
- Intro fill (2 bars)
- Main groove (12-bar blues form, 3 choruses)
- Fill at end of each chorus
- Outro fill

Patterns adapted by tempo and style:
- Shuffle: swing 8th notes on hats, triplet feel
- Slow blues: brushes, sparse kicks
- Medium groove: straight 8th rock feel
- Boogie: driving 8th notes
"""

import struct
import os

# ─── MIDI helpers ───────────────────────────────────────────────────────────

def encode_varlen(value):
    """Encode a delta-time value using MIDI variable-length encoding."""
    if value < 0:
        raise ValueError("Delta time cannot be negative")
    if value == 0:
        return bytes([0])
    
    bytes_out = []
    bytes_out.append(value & 0x7F)
    value >>= 7
    while value > 0:
        bytes_out.append((value & 0x7F) | 0x80)
        value >>= 7
    
    return bytes(reversed(bytes_out))


def midi_meta_event(delta, meta_type, data):
    """Create a meta event with delta time."""
    result = bytearray()
    result.extend(encode_varlen(delta))
    result.append(0xFF)
    result.append(meta_type)
    result.extend(encode_varlen(len(data)))
    result.extend(data)
    return bytes(result)


def drum_note(note, velocity, delta=0, duration=60):
    """Create a drum note on/off pair with delta time and duration.
    
    Uses channel 9 (GM drum channel).
    duration = ticks until note_off (default 60 ticks = 1/8 note at 480 PPQN)
    """
    result = bytearray()
    
    # Note on with delta
    result.extend(encode_varlen(delta))
    result.append(0x99)  # Note on, channel 9 (drums)
    result.append(note)
    result.append(velocity)
    
    # Note off after duration
    result.extend(encode_varlen(duration))
    result.append(0x89)  # Note off, channel 9
    result.append(note)
    result.append(0x00)  # Release velocity
    
    return bytes(result)


def write_midi(filename, tempo_bpm, bars, pattern_type, total_choruses=3):
    """
    Write a MIDI file with drum track.
    
    pattern_type: 'shuffle', 'slow_blues', 'medium_rock', 'boogie', 'slow_minor'
    bars: bars per chorus (usually 12, sometimes 8)
    total_choruses: how many times to repeat the form
    """
    ticks_per_quarter = 480
    events = []
    
    # Tempo meta event at delta 0
    microseconds_per_quarter = int(60_000_000 / tempo_bpm)
    tempo_bytes = struct.pack('>I', microseconds_per_quarter)[1:]  # 3 bytes big-endian
    events.append(midi_meta_event(0, 0x51, tempo_bytes))
    
    # Time signature 4/4 at delta 0
    events.append(midi_meta_event(0, 0x58, bytes([4, 2, 24, 8])))
    
    # Track name at delta 0
    song_name = os.path.basename(filename).replace('.mid', '')
    name_bytes = song_name.encode('ascii')
    events.append(midi_meta_event(0, 0x03, name_bytes))
    
    total_bars = bars * total_choruses
    
    for bar_num in range(total_bars):
        is_last_bar = (bar_num == total_bars - 1)
        is_chorus_end = ((bar_num + 1) % bars == 0)
        is_first_bar = (bar_num == 0)
        
        if is_first_bar:
            # Intro fill (1 bar)
            events.extend(generate_fill(tempo_bpm, ticks_per_quarter, is_intro=True))
            # Then main groove for this bar (still counts as bar 0)
            events.extend(generate_groove(pattern_type, ticks_per_quarter, False))
        elif is_chorus_end and not is_last_bar:
            # Chorus-ending fill
            events.extend(generate_groove(pattern_type, ticks_per_quarter, True))
        elif is_last_bar:
            # Outro fill
            events.extend(generate_fill(tempo_bpm, ticks_per_quarter, is_outro=True))
        else:
            # Standard groove bar
            events.extend(generate_groove(pattern_type, ticks_per_quarter, False))
    
    # End of track meta event
    events.append(midi_meta_event(0, 0x2F, b''))
    
    # Build MIDI file
    # Header chunk: MThd + length(6) + format(1) + ntracks(1) + division(480)
    header_chunk = b'MThd' + struct.pack('>I', 6) + struct.pack('>HHH', 1, 1, ticks_per_quarter)
    
    # Track chunk: MTrk + length + data
    track_data = b''.join(events)
    track_chunk = b'MTrk' + struct.pack('>I', len(track_data)) + track_data
    
    with open(filename, 'wb') as f:
        f.write(header_chunk + track_chunk)


def generate_groove(pattern_type, ppq, fill_end=False):
    """
    Generate one bar of drum groove.
    ppq = ticks per quarter note
    
    Drum notes (GM standard):
    36 = Kick, 38 = Snare, 42 = Closed Hat, 46 = Open Hat
    44 = Pedal Hat, 49 = Crash, 50 = High Tom, 48 = Mid Tom, 45 = Low Tom
    51 = Ride, 52 = China
    """
    events = []
    
    if pattern_type == 'shuffle':
        # Shuffle feel: swung 8th notes on hats, kick on 1 and 3, snare on 2 and 4
        # Swing: first 8th is 2/3 of beat, second 8th is 1/3
        swing_off = int(ppq * 2 / 3)  # ~320 ticks
        short_8th = ppq - swing_off    # ~160 ticks
        
        # Beat 1: Kick + Hat
        events.append(drum_note(36, 100, 0))    # Kick
        events.append(drum_note(42, 80, 0))     # Hat (simultaneous)
        # Beat 1 &
        events.append(drum_note(42, 70, swing_off))
        # Beat 2: Snare + Hat
        events.append(drum_note(38, 100, short_8th))  # Snare
        events.append(drum_note(42, 80, 0))           # Hat
        # Beat 2 &
        events.append(drum_note(42, 70, swing_off))
        # Beat 3: Kick + Hat
        events.append(drum_note(36, 100, short_8th))  # Kick
        events.append(drum_note(42, 80, 0))           # Hat
        # Beat 3 &
        events.append(drum_note(42, 70, swing_off))
        # Beat 4: Snare + Hat
        events.append(drum_note(38, 100, short_8th))  # Snare
        events.append(drum_note(42, 80, 0))           # Hat
        # Beat 4 &
        if fill_end:
            # Fill: toms on beat 4&
            events.append(drum_note(50, 100, swing_off))
            events.append(drum_note(48, 90, int(ppq/6)))
            events.append(drum_note(45, 100, int(ppq/6)))
            events.append(drum_note(36, 100, int(ppq/6)))  # Kick on downbeat
        else:
            events.append(drum_note(42, 70, swing_off))
            events.append(drum_note(36, 90, short_8th))  # Kick on 4& for shuffle
            
    elif pattern_type == 'slow_blues':
        # Slow blues: sparse, kick on 1, snare on 2 and 4, hats on quarters
        half = ppq // 2
        
        # Beat 1
        events.append(drum_note(36, 90, 0))     # Kick
        events.append(drum_note(42, 70, 0))     # Hat
        # Beat 1 &
        events.append(drum_note(38, 30, half))  # Ghost snare
        # Beat 2
        events.append(drum_note(38, 100, half)) # Snare
        events.append(drum_note(42, 70, 0))     # Hat
        # Beat 2 &
        events.append(drum_note(36, 80, half))  # Kick on 2&
        # Beat 3
        events.append(drum_note(36, 90, half))  # Kick
        events.append(drum_note(42, 70, 0))     # Hat
        # Beat 3 &
        events.append(drum_note(38, 30, half))  # Ghost snare
        # Beat 4
        events.append(drum_note(38, 100, half)) # Snare
        events.append(drum_note(42, 70, 0))     # Hat
        # Beat 4 &
        if fill_end:
            events.append(drum_note(50, 100, half))  # Tom fill
            events.append(drum_note(48, 90, int(ppq/4)))
            events.append(drum_note(45, 100, int(ppq/4)))
            events.append(drum_note(36, 100, int(ppq/4)))
        else:
            events.append(drum_note(36, 80, half))  # Kick on 4&
            
    elif pattern_type == 'medium_rock':
        # Straight 8th rock: kick on 1 and 3, snare on 2 and 4, hats on all 8ths
        eighth = ppq // 2
        
        # Beat 1
        events.append(drum_note(36, 100, 0))    # Kick
        events.append(drum_note(42, 80, 0))     # Hat
        events.append(drum_note(42, 70, eighth)) # Hat &
        # Beat 2
        events.append(drum_note(38, 100, eighth)) # Snare
        events.append(drum_note(42, 80, 0))       # Hat
        events.append(drum_note(42, 70, eighth))  # Hat &
        # Beat 3
        events.append(drum_note(36, 100, eighth)) # Kick
        events.append(drum_note(42, 80, 0))       # Hat
        events.append(drum_note(42, 70, eighth))  # Hat &
        events.append(drum_note(36, 80, 0))       # Extra kick on & of 3
        # Beat 4
        events.append(drum_note(38, 100, eighth)) # Snare
        events.append(drum_note(42, 80, 0))       # Hat
        
        if fill_end:
            # Replace beat 4 & with tom fill
            events.append(drum_note(50, 100, eighth))  # High tom
            events.append(drum_note(48, 90, int(ppq/4)))
            events.append(drum_note(45, 100, int(ppq/4)))
            events.append(drum_note(36, 100, int(ppq/4)))
        else:
            events.append(drum_note(42, 70, eighth))  # Hat &
            
    elif pattern_type == 'boogie':
        # Driving boogie: kick on every beat, snare on 2 and 4, hats on 8ths
        eighth = ppq // 2
        
        # Beat 1
        events.append(drum_note(36, 100, 0))     # Kick
        events.append(drum_note(42, 75, 0))      # Hat
        events.append(drum_note(42, 65, eighth)) # Hat &
        # Beat 2
        events.append(drum_note(36, 100, eighth)) # Kick
        events.append(drum_note(38, 100, 0))      # Snare
        events.append(drum_note(42, 75, 0))       # Hat
        events.append(drum_note(42, 65, eighth))  # Hat &
        # Beat 3
        events.append(drum_note(36, 100, eighth)) # Kick
        events.append(drum_note(42, 75, 0))       # Hat
        events.append(drum_note(42, 65, eighth))  # Hat &
        # Beat 4
        events.append(drum_note(36, 100, eighth)) # Kick
        events.append(drum_note(38, 100, 0))      # Snare
        events.append(drum_note(42, 75, 0))       # Hat
        
        if fill_end:
            events.append(drum_note(50, 100, eighth))
            events.append(drum_note(48, 90, int(ppq/4)))
            events.append(drum_note(45, 100, int(ppq/4)))
            events.append(drum_note(36, 100, int(ppq/4)))
        else:
            events.append(drum_note(42, 65, eighth))  # Hat &
            
    elif pattern_type == 'slow_minor':
        # Slow minor blues (for Thrill Is Gone, I Put a Spell): very sparse
        # Kick on 1, light snare on 2 and 4, ride on quarters
        half = ppq // 2
        
        # Beat 1
        events.append(drum_note(36, 85, 0))      # Kick
        events.append(drum_note(51, 70, 0))      # Ride
        # Beat 1 &
        events.append(drum_note(38, 40, half))   # Ghost snare
        # Beat 2
        events.append(drum_note(38, 95, half))   # Snare
        events.append(drum_note(51, 65, 0))      # Ride
        # Beat 3
        events.append(drum_note(36, 75, half))   # Kick
        events.append(drum_note(51, 70, 0))      # Ride
        # Beat 3 &
        events.append(drum_note(38, 40, half))   # Ghost snare
        # Beat 4
        events.append(drum_note(38, 95, half))   # Snare
        events.append(drum_note(51, 65, 0))      # Ride
        # Beat 4 &
        if fill_end:
            events.append(drum_note(50, 100, half))
            events.append(drum_note(48, 90, int(ppq/4)))
            events.append(drum_note(45, 100, int(ppq/4)))
            events.append(drum_note(36, 100, int(ppq/4)))
        else:
            events.append(drum_note(36, 70, half))  # Kick on 4&
    
    return events


def generate_fill(tempo_bpm, ppq, is_intro=True, is_outro=False):
    """Generate a drum fill bar."""
    events = []
    eighth = ppq // 2
    quarter = ppq
    sixteenth = ppq // 4
    
    if is_intro:
        # Intro: crash on 1, tom fill on 3-4
        events.append(drum_note(49, 110, 0))    # Crash
        events.append(drum_note(36, 100, 0))    # Kick with crash
        events.append(drum_note(42, 70, 0))     # Hat
        events.append(drum_note(42, 60, eighth)) # Hat &
        # Beat 2
        events.append(drum_note(38, 90, eighth)) # Snare
        events.append(drum_note(42, 70, 0))      # Hat
        events.append(drum_note(42, 60, eighth)) # Hat &
        # Beat 3: Tom fill
        events.append(drum_note(50, 100, eighth))  # High tom
        events.append(drum_note(50, 90, sixteenth))
        events.append(drum_note(48, 95, sixteenth))
        events.append(drum_note(48, 90, sixteenth))
        events.append(drum_note(45, 100, sixteenth))
        # Beat 4: Crash
        events.append(drum_note(49, 100, sixteenth))  # Crash
        events.append(drum_note(36, 100, 0))           # Kick
        events.append(drum_note(36, 90, quarter))      # Kick on beat 4&
    elif is_outro:
        # Outro: big fill then crash
        events.append(drum_note(36, 100, 0))     # Kick
        events.append(drum_note(42, 75, 0))      # Hat
        # Beat 2
        events.append(drum_note(38, 90, quarter)) # Snare
        events.append(drum_note(42, 70, 0))       # Hat
        # Beat 3: Tom fill
        events.append(drum_note(50, 100, quarter)) # High tom
        events.append(drum_note(48, 95, sixteenth))
        events.append(drum_note(45, 100, sixteenth))
        events.append(drum_note(45, 100, sixteenth))
        # Beat 4: Crash
        events.append(drum_note(49, 110, sixteenth))  # Crash
        events.append(drum_note(36, 100, 0))           # Kick
        # Beat 5-6: Final crash + kick (2 beats)
        events.append(drum_note(49, 100, quarter * 2))  # Final crash
        events.append(drum_note(36, 90, 0))             # Kick
    
    return events


# ─── Song definitions ───────────────────────────────────────────────────────

SONGS = [
    # (filename, tempo, bars_per_chorus, pattern_type)
    ("01-green-onions",         120, 12, "medium_rock"),
    ("02-going-down",            100, 12, "shuffle"),
    ("03-little-red-rooster",     70, 12, "slow_blues"),
    ("04-rock-me-baby",           85, 12, "slow_blues"),
    ("05-king-bee",               95, 12, "shuffle"),
    ("06-mannish-boy",            80, 12, "shuffle"),
    ("07-red-house",              75, 12, "slow_blues"),
    ("08-rollin-and-tumblin",     90,  8, "shuffle"),
    ("09-back-door-man",         100, 12, "medium_rock"),
    ("10-love-her-with-a-feeling", 90, 12, "shuffle"),
    ("11-dust-my-broom",         105, 12, "shuffle"),
    ("12-stormy-monday",          65, 12, "slow_blues"),
    ("13-crossroads",             140, 12, "medium_rock"),
    ("14-the-thrill-is-gone",      70, 12, "slow_minor"),
    ("15-born-under-a-bad-sign",   80, 12, "slow_blues"),
    ("16-sunshine-of-your-love",  110, 12, "medium_rock"),
    ("17-hoochie-coochie-man",     85, 12, "shuffle"),
    ("18-tobacco-road",           100, 12, "medium_rock"),
    ("19-key-to-the-highway",      75,  8, "slow_blues"),
    ("20-boom-boom",               95, 12, "boogie"),
    ("21-spoonful",                85, 12, "slow_blues"),
    ("22-bad-bad-whiskey",         90, 12, "shuffle"),
    ("23-alabama-train",          100, 12, "shuffle"),
    ("24-champagne-and-reefer",     90, 12, "shuffle"),
    ("25-sweet-little-angel",       70, 12, "slow_blues"),
    ("26-bad-to-the-bone",          85, 12, "medium_rock"),
    ("27-la-grange",              120, 12, "boogie"),
    ("28-baby-please-dont-go",    100, 12, "shuffle"),
    ("29-i-put-a-spell-on-you",    80, 12, "slow_minor"),
    ("30-i-got-mine",             110, 12, "medium_rock"),
]

# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "midi")
    os.makedirs(output_dir, exist_ok=True)
    
    for song_name, tempo, bars, pattern in SONGS:
        filename = os.path.join(output_dir, f"{song_name}.mid")
        write_midi(filename, tempo, bars, pattern)
        print(f"OK {song_name}.mid - {tempo} BPM, {bars}-bar, {pattern}")
    
    print(f"\nGenerated {len(SONGS)} drum MIDI files in blues/midi/")
