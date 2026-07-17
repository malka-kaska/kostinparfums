import importlib


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


def test_check_backend_accepts_kostin_health_payload(monkeypatch):
    health_check = importlib.import_module("scripts.health_check")
    response = FakeResponse(
        payload={"status": "healthy", "service": "kostin-backend"},
        text='{"status":"healthy","service":"kostin-backend"}',
    )
    monkeypatch.setattr(health_check.requests, "get", lambda *args, **kwargs: response)

    result = health_check.check_backend("https://example.test/api")

    assert result["ok"] is True
    assert result["body"]["service"] == "kostin-backend"


def test_check_backend_rejects_html_false_positive(monkeypatch):
    health_check = importlib.import_module("scripts.health_check")
    response = FakeResponse(
        payload=ValueError("not JSON"),
        text="<!doctype html><html>frontend</html>",
    )
    monkeypatch.setattr(health_check.requests, "get", lambda *args, **kwargs: response)

    result = health_check.check_backend("https://example.test")

    assert result["ok"] is False
    assert "health" in result["error"].lower()


def test_check_backend_rejects_json_from_wrong_service(monkeypatch):
    health_check = importlib.import_module("scripts.health_check")
    response = FakeResponse(
        payload={"message": "frontend"},
        text='{"message":"frontend"}',
    )
    monkeypatch.setattr(health_check.requests, "get", lambda *args, **kwargs: response)

    result = health_check.check_backend("https://example.test")

    assert result["ok"] is False
    assert "service" in result["error"].lower()
