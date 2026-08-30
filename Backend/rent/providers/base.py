"""
Payment provider abstraction for RumiaRent.

Providers implement a common interface. Business logic uses PaymentService,
never provider-specific code directly.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Any, Optional


class PaymentProviderError(Exception):
    """Raised when a provider operation fails."""

    def __init__(self, message: str, provider: str, recoverable: bool = False):
        super().__init__(message)
        self.provider = provider
        self.recoverable = recoverable


class ProviderStatus(str, Enum):
    AVAILABLE = 'available'
    NOT_CONFIGURED = 'not_configured'
    DISABLED = 'disabled'


@dataclass
class ProviderConfigStatus:
    provider: str
    status: ProviderStatus
    message: str = ''
    required_env_vars: list[str] = field(default_factory=list)


@dataclass
class InitiatePaymentRequest:
    amount: Decimal
    currency: str
    tenant_email: str
    tenant_phone: str
    internal_reference: str
    callback_url: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class InitiatePaymentResult:
    success: bool
    provider_reference: str = ''
    authorization_url: str = ''
    raw_response: dict[str, Any] = field(default_factory=dict)
    error_message: str = ''


@dataclass
class VerifyPaymentRequest:
    provider_reference: str
    internal_reference: str
    raw_callback: dict[str, Any] = field(default_factory=dict)


@dataclass
class VerifyPaymentResult:
    success: bool
    status: str  # success, failed, pending
    amount: Optional[Decimal] = None
    provider_reference: str = ''
    raw_response: dict[str, Any] = field(default_factory=dict)
    error_message: str = ''


@dataclass
class AccountResolveRequest:
    account_number: str
    bank_code: str


@dataclass
class AccountResolveResult:
    success: bool
    account_name: str = ''
    error_message: str = ''
    raw_response: dict[str, Any] = field(default_factory=dict)


@dataclass
class CreateSubaccountRequest:
    business_name: str
    bank_code: str
    account_number: str
    percentage_charge: Decimal = Decimal('0')


@dataclass
class SubaccountResult:
    success: bool
    subaccount_code: str = ''
    error_message: str = ''
    raw_response: dict[str, Any] = field(default_factory=dict)


class BasePaymentProvider(ABC):
    """Abstract payment provider — never fakes successful transactions."""

    provider_id: str = 'base'

    @abstractmethod
    def get_config_status(self) -> ProviderConfigStatus:
        """Return whether this provider is configured and available."""

    @abstractmethod
    def initiate_payment(self, request: InitiatePaymentRequest) -> InitiatePaymentResult:
        """Start a payment. Returns pending state — never auto-success."""

    @abstractmethod
    def verify_payment(self, request: VerifyPaymentRequest) -> VerifyPaymentResult:
        """Verify payment status from provider callback or polling."""

    def is_available(self) -> bool:
        return self.get_config_status().status == ProviderStatus.AVAILABLE
