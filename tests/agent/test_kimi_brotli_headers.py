from unittest.mock import patch

from run_agent import AIAgent


class _FakeOpenAI:
    constructed = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self._custom_headers = kwargs.get("default_headers", {})
        self._client = None
        _FakeOpenAI.constructed.append(self)

    def close(self):
        pass


def _make_agent(base_url: str):
    _FakeOpenAI.constructed = []
    with patch("run_agent.OpenAI", _FakeOpenAI):
        AIAgent(
            api_key="test-key",
            base_url=base_url,
            provider="kimi-coding",
            model="kimi-k3",
            quiet_mode=True,
            skip_context_files=True,
            skip_memory=True,
        )
    assert _FakeOpenAI.constructed
    return _FakeOpenAI.constructed[-1].kwargs


def test_moonshot_cn_disables_brotli_for_streaming_decode_stability():
    kwargs = _make_agent("https://api.moonshot.cn/v1")

    assert kwargs["default_headers"]["Accept-Encoding"] == "gzip, deflate"


def test_kimi_com_keeps_user_agent_while_disabling_brotli():
    kwargs = _make_agent("https://api.kimi.com/v1")

    assert kwargs["default_headers"]["User-Agent"] == "claude-code/0.1.0"
    assert kwargs["default_headers"]["Accept-Encoding"] == "gzip, deflate"
