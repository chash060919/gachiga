"""Firebase 통합 구조의 오프라인 정적 검사 (실서버 연결 테스트 아님)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def test_firebase_script_loaded_before_app():
    html = (ROOT/'index.html').read_text()
    assert html.index('firebase-sync.js') < html.index('app.js?v=11')

def test_remote_room_and_chat_wiring():
    app = (ROOT/'app.js').read_text()
    assert 'await F.create(draft)' in app
    assert 'await F.join(code)' in app
    assert 'await F.send(room.code,text)' in app
    assert 'F.listen(room.code' in app

def test_rules_require_membership_for_chat():
    rules = (ROOT/'firestore.rules').read_text()
    assert 'allow get, list: if member(code)' in rules
    assert 'allow create: if member(code)' in rules
    assert 'allow list: if false' in rules
