from datetime import time

import pytest

from app.domain.model.value_objects import Notes, TimeRange


class TestTimeRange:
    def test_accepts_valid_range(self) -> None:
        tr = TimeRange(start=time(9, 0), end=time(10, 0))
        assert tr.start < tr.end

    def test_rejects_start_equal_or_after_end(self) -> None:
        with pytest.raises(ValueError):
            TimeRange(start=time(10, 0), end=time(10, 0))
        with pytest.raises(ValueError):
            TimeRange(start=time(11, 0), end=time(10, 0))

    def test_overlaps_returns_true_for_intersecting_ranges(self) -> None:
        a = TimeRange(time(9, 0), time(10, 0))
        b = TimeRange(time(9, 30), time(10, 30))
        assert a.overlaps(b) is True
        assert b.overlaps(a) is True

    def test_overlaps_returns_false_for_adjacent_ranges(self) -> None:
        a = TimeRange(time(9, 0), time(10, 0))
        b = TimeRange(time(10, 0), time(11, 0))
        assert a.overlaps(b) is False


class TestNotes:
    def test_empty_returns_none(self) -> None:
        assert Notes.empty().value is None

    def test_of_strips_whitespace_and_returns_none_for_blank(self) -> None:
        assert Notes.of("  ").value is None
        assert Notes.of(None).value is None
        assert Notes.of("  hello  ").value == "hello"
