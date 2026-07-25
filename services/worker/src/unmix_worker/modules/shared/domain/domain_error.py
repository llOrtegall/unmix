class DomainError(Exception):
    code = "domain.error"


class ValidationError(DomainError): ...


class NotFoundError(DomainError): ...


class ConflictError(DomainError): ...


class ForbiddenError(DomainError): ...
