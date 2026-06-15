from app.store import Store, create_short_code


def test_create_short_code_length_and_charset():
    code = create_short_code()
    assert len(code) == 7
    assert code.isalnum()


def test_create_short_code_is_random():
    assert create_short_code() != create_short_code()


def test_save_and_get_roundtrip():
    store = Store(":memory:")
    code = store.save("https://example.com")
    assert store.get_url(code) == "https://example.com"


def test_get_unknown_code_returns_none():
    store = Store(":memory:")
    assert store.get_url("nope123") is None


def test_codes_are_unique():
    store = Store(":memory:")
    codes = {store.save(f"https://example.com/{i}") for i in range(50)}
    assert len(codes) == 50
