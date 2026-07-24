from pathlib import Path
t = Path('outreach/residency/SILVANA_RESIDENCY_STRATEGY_V2.md').read_text(encoding='utf-8')
out = []
for s in ['$8','$10','$12','CUID','south','South','south']:
    idx = t.find(s)
    if idx >= 0:
        ctx = t[max(0,idx-50):idx+50]
        out.append(f"--- {s!r} at {idx} ---\n{ctx}\n")
    else:
        out.append(f"--- {s!r} not found ---\n")
Path('outreach/residency/print_assets/audit_strategy.txt').write_text(''.join(out), encoding='utf-8')
print('wrote audit_strategy.txt')
