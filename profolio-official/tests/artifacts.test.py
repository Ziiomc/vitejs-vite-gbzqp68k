import json, math, unittest
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ('script','link','a'):
            ref=a.get('src') or a.get('href')
            if ref:self.refs.append(ref)

class ProFolioArtifacts(unittest.TestCase):
    def test_all_original_areas_and_geometry(self):
        data=json.loads((ROOT/'wilmington-boundaries.geojson').read_text())
        names={f['properties']['pfName'] for f in data['features']}
        self.assertEqual(len(names),20)
        self.assertEqual(len({f['properties']['pfName'] for f in data['features'] if f['properties']['pfType']=='official'}),16)
        for f in data['features']:
            self.assertTrue(f['properties']['GEOID'])
            g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
            for poly in polys:
                for ring in poly:
                    self.assertEqual(ring[0],ring[-1]);self.assertGreaterEqual(len(ring),4)
                    for x,y in ring:self.assertTrue(math.isfinite(x) and math.isfinite(y) and -79<x<-77 and 33<y<35)
    def test_routes_assets_and_unique_ids(self):
        for page in ('index.html','gps.html'):
            parsed=Links();parsed.feed((ROOT/page).read_text(encoding='utf-8'))
            self.assertEqual(len(parsed.ids),len(set(parsed.ids)),page+' duplicate IDs')
            for ref in parsed.refs:
                if not ref.startswith(('http:','https:','#')):
                    target=ref.split('?')[0]
                    self.assertTrue((ROOT/target).exists(),page+': missing '+ref)
    def test_legend_precedes_map_and_preview_disclosures(self):
        index=(ROOT/'index.html').read_text(encoding='utf-8')
        self.assertLess(index.index('roadmap-legend'),index.index('id="market-map"'))
        self.assertIn('target="_blank" rel="noopener"',index)
        gps=(ROOT/'gps.html').read_text(encoding='utf-8')
        self.assertIn('No live listings',gps);self.assertIn('nothing is recorded',gps)

if __name__=='__main__':unittest.main()
