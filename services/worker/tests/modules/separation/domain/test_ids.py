import pytest
from faker import Faker

from unmix_worker.modules.separation.domain.errors import InvalidJobIdError, InvalidTrackIdError
from unmix_worker.modules.separation.domain.job_id import JobId
from unmix_worker.modules.separation.domain.track_id import TrackId

_faker = Faker()


class TestBasicBehaviour:
    def test_job_id_survives_a_primitive_round_trip(self) -> None:
        value = str(_faker.uuid4())

        assert JobId.from_primitive(value).to_primitive() == value

    def test_track_id_survives_a_primitive_round_trip(self) -> None:
        value = str(_faker.uuid4())

        assert TrackId.from_primitive(value).to_primitive() == value

    def test_compares_by_value(self) -> None:
        value = str(_faker.uuid4())

        assert TrackId.create(value) == TrackId.create(value)


class TestErrorScenarios:
    def test_rejects_a_job_id_that_is_not_a_uuid(self) -> None:
        with pytest.raises(InvalidJobIdError):
            JobId.create("job-1")

    def test_rejects_a_track_id_that_is_not_a_uuid(self) -> None:
        with pytest.raises(InvalidTrackIdError):
            TrackId.create("")
