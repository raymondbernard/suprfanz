import re
from pathlib import Path

html = Path(r'C:\Users\RayBe\.openclaw\workspace\suprfanz\index.html').read_text(encoding='utf-8')
base = Path(r'C:\Users\RayBe\.openclaw\workspace\suprfanz')

pattern = re.compile(r"(?:href|src)=[\"']([^\"']+)[\"']")
links = pattern.findall(html)

print('Links found and status:')
for link in sorted(set(links)):
    if link.startswith('http') or link.startswith('//'):
        print(f'  EXTERNAL: {link}')
    elif link.startswith('#') or link.startswith('mailto:') or link == '#':
        print(f'  ANCHOR/MAILTO: {link}')
    else:
        exists = (base / link).exists()
        status = 'OK' if exists else 'MISSING'
        print(f'  {status}: {link}')
