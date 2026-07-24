import requests, re
r = requests.get('https://raymondbernard.github.io/cosmic-blues-epk/', headers={'User-Agent':'Mozilla/5.0'})
t = r.text
print('images:')
for m in re.findall(r'src="([^"]+\.(?:png|jpg|jpeg|svg|webp|gif))"', t):
    print(' ', m)
print('css:')
for m in re.findall(r'href="([^"]+\.css)"', t):
    print(' ', m)
