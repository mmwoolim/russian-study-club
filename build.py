"""Build the self-contained website using only the Python standard library."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build():
    text = (ROOT / 'vocabulary.txt').read_text(encoding='utf-8')
    text = text.replace('ó', 'о́').replace('é', 'е́')
    text = (text.replace('A1|сахар|', 'A1|са́хар|')
                .replace('A1|утро /', 'A1|у́тро /')
                .replace('A1|ухо|', 'A1|у́хо|')
                .replace('A2|отдых /', 'A2|о́тдых /'))
    words = []
    category = ''
    for line in text.splitlines():
        if not line.strip():
            continue
        if line.startswith('@'):
            category = line[1:]
            continue
        level, ru, en, example, hint = line.split('|')
        key = re.sub(r'\s+', ' ', ru.replace('\u0301', '')).strip()
        words.append(dict(id=key, ru=ru, en=en, example=example,
                          hint=hint, level=level, category=category))
    assert len(words) == 200, len(words)
    assert len({word['id'] for word in words}) == len(words)
    assert all(word['level'] in ['A1', 'A2'] and all(word.values()) for word in words)
    assert not any(re.search('[éó]', word['ru']) for word in words)

    data = json.dumps(words, ensure_ascii=False).replace('<', '\\u003c')
    html = (ROOT / 'template.html').read_text(encoding='utf-8')
    for placeholder, content in {
        '/*STYLE*/': (ROOT / 'style.css').read_text(encoding='utf-8'),
        '/*WORDS*/': data,
        '/*PERSISTENCE*/': (ROOT / 'persistence.js').read_text(encoding='utf-8'),
        '/*APP*/': (ROOT / 'app.js').read_text(encoding='utf-8'),
    }.items():
        assert html.count(placeholder) == 1, placeholder
        html = html.replace(placeholder, content)

    # Also allow opening index.html directly, without a server or internet access.
    (ROOT / 'index.html').write_text(html, encoding='utf-8')
    output = ROOT / 'dist'
    output.mkdir(exist_ok=True)
    (output / 'index.html').write_text(html, encoding='utf-8')
    (output / '.nojekyll').touch()
    print(json.dumps({'file': str(output / 'index.html'), 'cards': len(words),
                      'levels': {level: sum(w['level'] == level for w in words)
                                 for level in ['A1', 'A2']}}))


if __name__ == '__main__':
    build()
