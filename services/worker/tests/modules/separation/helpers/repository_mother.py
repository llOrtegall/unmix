from typing import Any
from unittest.mock import Mock


def stub(repository: Mock, overrides: dict[str, Any]) -> Mock:
    for method, value in overrides.items():
        if isinstance(value, BaseException):
            getattr(repository, method).side_effect = value
        else:
            getattr(repository, method).side_effect = None
            getattr(repository, method).return_value = value
    return repository
