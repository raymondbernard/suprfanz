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

def write_midi(filename, tempo_bpm, bars, pattern_type, total_choruses=3):
    """
    Write a MIDI file with drum track.
    
    pattern_type: 'shuffle', 'slow_blues', 'medium_rock', 'boogie', 'slow_minor'
    bars: bars per chorus (usually 12, sometimes 8)
    total_choruses: how many times to repeat the form
    """
    ticks_per_quarter = 480
    track_data = []
    
    # Tempo
    microseconds_per_quarter = int(60_000_000 / tempo_bpm)
    tempo_bytes = struct.pack('>I', microseconds_per_quarter)[1:]  # 3 bytes
    track_data.append(midi_meta_event(0x51, tempo_bytes))
    
    # Time signature 4/4
    track_data.append(midi_meta_event(0x58, bytes([4, 2, 24, 8])))
    
    # Track name
    name = filename.replace('.mid', '').replace('blues/songs/', '').encode('ascii')
    track_data.append(midi_meta_event(0x03, name))
    
    total_bars = bars * total_choruses
    
    for bar_num in range(total_bars):
        is_last_bar = (bar_num == total_bars - 1)
        is_chorus_end = ((bar_num + 1) % bars == 0)
        is_first_bar = (bar_num == 0)
        
        if is_first_bar:
            # Intro fill (2 bars of crash + tom fill)
            track_data.extend(generate_fill(tempo_bpm, ticks_per_quarter, bar_num == 0))
            # Then main groove
            track_data.extend(generate_groove(pattern_type, ticks_per_quarter, is_chorus_end))
        elif is_chorus_end and not is_last_bar:
            # Chorus-ending fill
            track_data.extend(generate_groove(pattern_type, ticks_per_quarter, True))
        elif is_last_bar:
            # Outro fill
            track_data.extend(generate_fill(tempo_bpm, ticks_per_quarter, False, is_outro=True))
        else:
            # Standard groove bar
            track_data.extend(generate_groove(pattern_type, ticks_per_quarter, False))
    
    # End of track
    track_data.append(midi_meta_event(0x2F, b''))
    
    # Build MIDI file
    header = struct.pack('>HHH', 1, 1, ticks_per_quarter)  # format 1, 1 track
    header_chunk = b'MThd' + struct.pack('>I', 6) + header
    
    track_bytes = b''.join(track_data)
    track_chunk = b'MTrk' + struct.pack('>I', len(track_bytes)) + track_bytes
    
    with open(filename, 'wb') as f:
        f.write(header_chunk + track_chunk)


def midi_meta_event(meta_type, data):
    """Create a meta event."""
    return bytes([0xFF, meta_type, len(data)]) + data


def note_on(channel, note, velocity, delta=0):
    """Note on event."""
    return bytes([delta & 0x7F | (0x80 if delta >= 128 else 0),
                 0x90 | channel, note, velocity]) if delta < 128 else \
           bytes([0x80 | ((delta >> 7) & 0x7F), delta & 0x7F,
                 0x90 | channel, note, velocity])


def note_off(channel, note, delta=0):
    """Note off event."""
    return bytes([delta & 0x7F | (0x80 if delta >= 128 else 0),
                 0x80 | channel, note, 0]) if delta < 128 else \
           bytes([0x80 | ((delta >> 7) & 0x7F), delta & 0x7F,
                 0x80 | channel, note, 0])


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
        
        # Beat 1
        events.append(drum_event(36, 100, 0))   # Kick
        events.append(drum_event(42, 80, 0))    # Hat (with kick)
        # Beat 1 &
        events.append(drum_event(42, 70, swing_off))
        # Beat 2
        events.append(drum_event(38, 100, short_8th))  # Snare
        events.append(drum_event(42, 80, 0))
        # Beat 2 &
        events.append(drum_event(42, 70, swing_off))
        # Beat 3
        events.append(drum_event(36, 100, short_8th))  # Kick
        events.append(drum_event(42, 80, 0))
        # Beat 3 &
        events.append(drum_event(42, 70, swing_off))
        # Beat 4
        events.append(drum_event(38, 100, short_8th))  # Snare
        events.append(drum_event(42, 80, 0))
        # Beat 4 &
        if fill_end:
            # Fill: toms on beat 4&
            events.append(drum_event(50, 100, swing_off))
            events.append(drum_event(48, 90, int(ppq/6)))
            events.append(drum_event(45, 100, int(ppq/6)))
            events.append(drum_event(36, 100, int(ppq/6)))  # Kick on downbeat
        else:
            events.append(drum_event(42, 70, swing_off))
            events.append(drum_event(36, 90, short_8th))  # Kick on 4& for shuffle
            
    elif pattern_type == 'slow_blues':
        # Slow blues: sparse, kick on 1, snare on 2 and 4, hats on quarters
        # Some ghost notes on snare
        events.append(drum_event(36, 90, 0))    # Kick beat 1
        events.append(drum_event(42, 70, 0))    # Hat
        events.append(drum_event(38, 30, int(ppq/2)))  # Ghost snare
        events.append(drum_event(38, 100, ppq))  # Snare beat 2
        events.append(drum_event(42, 70, 0))
        events.append(drum_event(36, 80, int(ppq/2)))  # Kick on 2&
        events.append(drum_event(36, 90, ppq))  # Kick beat 3
        events.append(drum_event(42, 70, 0))
        events.append(drum_event(38, 30, int(ppq/2)))  # Ghost snare
        events.append(drum_event(38, 100, ppq))  # Snare beat 4
        events.append(drum_event(42, 70, 0))
        if fill_end:
            events.append(drum_event(50, 100, int(ppq/2)))  # Tom fill
            events.append(drum_event(48, 90, int(ppq/4)))
            events.append(drum_event(45, 100, int(ppq/4)))
            events.append(drum_event(36, 100, int(ppq/4)))
        else:
            events.append(drum_event(36, 80, int(ppq/2)))  # Kick on 4&
            
    elif pattern_type == 'medium_rock':
        # Straight 8th rock: kick on 1 and 3, snare on 2 and 4, hats on all 8ths
        eighth = ppq // 2
        
        for beat in range(4):
            delta = 0 if beat == 0 else eighth * 2
            # Hat on every 8th
            events.append(drum_event(42, 80, delta if beat == 0 else 0))
            events.append(drum_event(42, 70, eighth))
            
            if beat == 0 or beat == 2:
                events.append(drum_event(36, 100, 0))  # Kick
            if beat == 1 or beat == 3:
                events.append(drum_event(38, 100, 0))  # Snare
            # Extra kick on & of 3
            if beat == 2:
                events.append(drum_event(36, 80, eighth))
                
        if fill_end:
            # Replace last beat with tom fill
            events = events[:-3]  # Remove last beat
            events.append(drum_event(50, 100, eighth * 2))  # High tom
            events.append(drum_event(48, 90, int(ppq/4)))
            events.append(drum_event(45, 100, int(ppq/4)))
            events.append(drum_event(36, 100, int(ppq/4)))
            
    elif pattern_type == 'boogie':
        # Driving boogie: kick on every beat, snare on 2 and 4, hats on 8ths
        eighth = ppq // 2
        
        for beat in range(4):
            delta = 0 if beat == 0 else eighth * 2
            events.append(drum_event(36, 100, delta if beat == 0 else 0))  # Kick every beat
            events.append(drum_event(42, 75, 0))   # Hat
            events.append(drum_event(42, 65, eighth))  # Hat 8th
            
            if beat == 1 or beat == 3:
                events.append(drum_event(38, 100, 0))  # Snare
                
        if fill_end:
            events = events[-3:]  # Keep last elements
            events.append(drum_event(50, 100, eighth * 2))
            events.append(drum_event(48, 90, int(ppq/4)))
            events.append(drum_event(45, 100, int(ppq/4)))
            events.append(drum_event(36, 100, int(ppq/4)))
            
    elif pattern_type == 'slow_minor':
        # Slow minor blues (for Thrill Is Gone, I Put a Spell): very sparse
        # Kick on 1, light snare on 2 and 4, ride on quarters
        events.append(drum_event(36, 85, 0))     # Kick
        events.append(drum_event(51, 70, 0))    # Ride
        events.append(drum_event(38, 40, int(ppq/2)))  # Ghost snare
        events.append(drum_event(38, 95, ppq))  # Snare beat 2
        events.append(drum_event(51, 65, 0))    # Ride
        events.append(drum_event(36, 75, ppq))  # Kick beat 3
        events.append(drum_event(51, 70, 0))    # Ride
        events.append(drum_event(38, 40, int(ppq/2)))  # Ghost snare
        events.append(drum_event(38, 95, ppq))  # Snare beat 4
        events.append(drum_event(51, 65, 0))    # Ride
        if fill_end:
            events.append(drum_event(50, 100, int(ppq/2)))
            events.append(drum_event(48, 90, int(ppq/4)))
            events.append(drum_event(45, 100, int(ppq/4)))
            events.append(drum_event(36, 100, int(ppq/4)))
        else:
            events.append(drum_event(36, 70, int(ppq/2)))  # Kick on 4&
    
    return events


def generate_fill(tempo_bpm, ppq, is_intro=True, is_outro=False):
    """Generate a drum fill bar."""
    events = []
    eighth = ppq // 2
    
    if is_intro:
        # Intro: crash on 1, tom fill on 3-4
        events.append(drum_event(49, 110, 0))   # Crash
        events.append(drum_event(36, 100, 0))   # Kick with crash
        events.append(drum_event(42, 70, 0))    # Hat
        events.append(drum_event(42, 60, eighth))
        events.append(drum_event(38, 90, eighth))  # Snare on 2
        events.append(drum_event(42, 70, 0))
        events.append(drum_event(42, 60, eighth))
        events.append(drum_event(50, 100, eighth))  # Tom fill on 3
        events.append(drum_event(50, 90, int(ppq/4)))
        events.append(drum_event(48, 95, int(ppq/4)))
        events.append(drum_event(48, 90, int(ppq/4)))
        events.append(drum_event(45, 100, int(ppq/4)))
        events.append(drum_event(45, 100, int(ppq/4)))
        events.append(drum_event(36, 100, int(ppq/4)))
        events.append(drum_event(49, 100, 0))   # Crash on 4
        events.append(drum_event(36, 100, 0))   # Kick
    elif is_outro:
        # Outro: big fill then crash
        events.append(drum_event(36, 100, 0))   # Kick
        events.append(drum_event(42, 75, 0))     # Hat
        events.append(drum_event(38, 90, ppq))   # Snare
        events.append(drum_event(42, 70, 0))
        events.append(drum_event(50, 100, ppq))  # High tom
        events.append(drum_event(48, 95, int(ppq/4)))
        events.append(drum_event(45, 100, int(ppq/4)))
        events.append(drum_event(45, 100, int(ppq/4)))
        events.append(drum_event(49, 110, int(ppq/4)))  # Crash
        events.append(drum_event(36, 100, 0))
        events.append(drum_event(49, 100, ppq * 2))  # Final crash
        events.append(drum_event(36, 90, 0))
    
    return events


def drum_event(note, velocity, delta=0):
    """Create a drum note on/off pair with delta."""
    result = bytearray()
    
    # Handle variable-length delta encoding
    if delta > 0:
        d = delta
        d_bytes = []
        d_bytes.append(d & 0x7F)
        d >>= 7
        while d > 0:
            d_bytes.append((d & 0x7F) | 0x80)
            d >>= 7
        for b in reversed(d_bytes):
            result.append(b)
    
    # Note on
    result.append(0x99)  # Channel 9 (drums)
    result.append(note)
    result.append(velocity)
    
    # Note off after short duration (1 tick)
    result.append(0x00)  # delta = 0
    result.append(0x89)  # Note off channel 9
    result.append(note)
    result.append(0)
    
    return bytes(result)


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