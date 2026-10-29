"""Rebuild Orakel WebP previews and Latin WOFF subsets.

Run from the repository root with Pillow and fontTools installed.
Original PNG artwork and OTF fonts are preserved.
"""
from pathlib import Path
from PIL import Image
from fontTools import subset
import json,hashlib,unicodedata
root=Path('de/rauhnaechte/orakel'); out=root/'art/cards';out.mkdir(exist_ok=True)
p=root/'cards.js';head,raw=p.read_text().split('window.oracleDeck = ',1);deck=json.loads(raw.strip().removesuffix(';'))
total_before=total_after=0
for card in deck['cards']:
 original=card.get('originalImage',card['image']);src=root/original.split('?')[0]
 slug=unicodedata.normalize('NFKD',card['title']).encode('ascii','ignore').decode().lower().replace(' ','-')
 for width,suffix in [(640,''),(320,'-thumb')]:
  target=out/(slug+suffix+'.webp')
  with Image.open(src) as im:
   im.thumbnail((width,width*2),Image.Resampling.LANCZOS);im.save(target,'WEBP',quality=84,method=6)
 card['originalImage']=original
 card['image']='./art/cards/'+slug+'.webp?v='+hashlib.sha256((out/(slug+'.webp')).read_bytes()).hexdigest()[:10]
 card['thumbnail']='./art/cards/'+slug+'-thumb.webp?v='+hashlib.sha256((out/(slug+'-thumb.webp')).read_bytes()).hexdigest()[:10]
 total_before+=src.stat().st_size;total_after+=(out/(slug+'.webp')).stat().st_size
with Image.open('orakelkarten/cover.png') as im:
 im.thumbnail((640,960),Image.Resampling.LANCZOS);im.save(out/'cover.webp','WEBP',quality=84,method=6)
deck['backImage']='./art/cards/cover.webp'
p.write_text(head+'window.oracleDeck = '+json.dumps(deck,ensure_ascii=False,indent=2)+';\n')
fontout=root/'art/fonts';fontout.mkdir(exist_ok=True)
for weight in ['Light','Regular']:
 options=subset.Options();options.flavor='woff';options.layout_features=['*']
 font=subset.load_font('fonts/FluxischElse-'+weight+'.otf',options)
 sub=subset.Subsetter(options=options);sub.populate(unicodes=list(range(0x250))+list(range(0x2000,0x2070))+list(range(0x2190,0x2200)))
 sub.subset(font);subset.save_font(font,str(fontout/('FluxischElse-'+weight+'.woff')),options)
print('Full deck: %.2f MB -> %.2f MB (%.1f%% smaller)'%(total_before/1e6,total_after/1e6,100*(1-total_after/total_before)))
print('Cover: %.0f KB -> %.0f KB'%(Path('orakelkarten/cover.png').stat().st_size/1000,(out/'cover.webp').stat().st_size/1000))
print('Subset fonts:',sum(f.stat().st_size for f in fontout.glob('*.woff')),'bytes')
