"""GATIGA 배포 파일 및 기존 JavaScript 테스트를 pytest에서 검증합니다."""
from pathlib import Path
import re
import subprocess
import pytest

ROOT = Path(__file__).resolve().parents[1]


def test_html_css_and_js_files_exist():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert (ROOT / 'style.css').is_file()
    for script in re.findall(r'<script[^>]+src="([^\"]+)"', html):
        assert (ROOT / script.split('?')[0]).is_file(), script


def test_main_app_mount_exists():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert 'id="app"' in html
    assert 'id="modal-root"' in html


def test_demo_room_and_invite_code_present():
    app = (ROOT / 'app.js').read_text(encoding='utf-8')
    assert 'DEMO24' in app
    assert 'join-form' in app


def test_demo_map_module_present():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert 'map-mock.js' in html
    assert 'kakao-config.js' not in html


@pytest.mark.parametrize('testfile', sorted((ROOT / 'tests').glob('*.test.js')), ids=lambda p: p.stem)
def test_javascript_suite(testfile):
    result = subprocess.run(['node', '--test', str(testfile)], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + '\n' + result.stderr
