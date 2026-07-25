import inspect
from typing import get_args

import pytest

from unmix_worker.contracts.generated import SeparationFailureCode
from unmix_worker.modules.separation.domain import errors
from unmix_worker.modules.shared.domain.domain_error import DomainError

_CONTRACT_CODES = set(get_args(SeparationFailureCode.model_fields["root"].annotation))
_ERRORS = [
    error
    for _, error in inspect.getmembers(errors, inspect.isclass)
    if issubclass(error, DomainError) and error.__module__ == errors.__name__
]


@pytest.mark.parametrize("error", _ERRORS, ids=lambda error: error.__name__)
def test_every_error_code_is_part_of_the_contract(error: type[DomainError]) -> None:
    assert error.code in _CONTRACT_CODES
