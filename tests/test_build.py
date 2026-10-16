import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PortableBuildTest(unittest.TestCase):
    def test_clean_checkout_builds_from_another_working_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            checkout = Path(directory) / 'checkout'
            checkout.mkdir()
            for name in ['build.py', 'vocabulary.txt', 'template.html',
                         'app.js', 'persistence.js', 'style.css']:
                shutil.copyfile(ROOT / name, checkout / name)
            before = (checkout / 'vocabulary.txt').read_bytes()
            subprocess.run(['python3', str(checkout / 'build.py')], cwd=directory,
                           check=True, capture_output=True)
            html = (checkout / 'dist/index.html').read_text(encoding='utf-8')
            self.assertEqual(html, (checkout / 'index.html').read_text(encoding='utf-8'))
            self.assertEqual(before, (checkout / 'vocabulary.txt').read_bytes())
            self.assertTrue((checkout / 'dist/.nojekyll').exists())
            self.assertEqual({'index.html', '.nojekyll'},
                             {p.name for p in (checkout / 'dist').iterdir()})
            self.assertNotIn('/*PERSISTENCE*/', html)
            self.assertNotIn('/Users/', html)
            data = json.loads(re.search(r'id="word-data"[^>]*>(.*?)</script>', html, re.S)[1])
            self.assertEqual(200, len(data))
            self.assertEqual(200, len({w['id'] for w in data}))
            self.assertEqual({'A1', 'A2'}, {w['level'] for w in data})
            self.assertEqual('null', re.search(r'id="embedded-progress"[^>]*>(.*?)</script>', html, re.S)[1])
            for script in re.findall(r'<script>(.*?)</script>', html, re.S):
                subprocess.run(['node', '--check'], input=script, text=True,
                               capture_output=True, check=True)
