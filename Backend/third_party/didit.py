"""
Didit Document Verification Service

Provides free document verification for the RUMI platform:
- Identity document verification
- Document authenticity checking
- Name matching and validation
- Age verification
- Document type detection
"""

import asyncio
import aiohttp
import json
import base64
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

from django.conf import settings
from .base import ThirdPartyServiceBase, ServiceConfig, APIResponse, register_service


@dataclass
class VerificationResult:
    """Document verification result"""
    is_verified: bool
    confidence_score: float
    document_type: str
    extracted_data: Dict[str, Any]
    errors: List[str]
    verification_id: str


@dataclass
class DocumentData:
    """Extracted document data"""
    full_name: Optional[str] = None
    document_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    expiry_date: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None


class DiditService(ThirdPartyServiceBase):
    """Didit document verification service"""
    
    def __init__(self):
        config = ServiceConfig(
            api_key=settings.DIDIT_API_KEY or "",
            base_url="https://api.didit.ai/v1",
            timeout=60,  # Document verification can take time
            retries=3,
            cache_ttl=0,  # No caching for verification
            enabled=bool(settings.DIDIT_API_KEY),
            rate_limit=10  # Lower rate limit for verification
        )
        super().__init__("didit", config)
        
        # Didit configuration
        self.api_key = settings.DIDIT_API_KEY
    
    async def verify_document(
        self,
        document_image: bytes,
        document_type: str = "national_id",
        full_name: Optional[str] = None
    ) -> APIResponse:
        """Verify a document image"""
        try:
            if not self.config.enabled:
                return APIResponse(
                    success=False,
                    error="Didit service is not configured"
                )
            
            # Prepare the request
            url = f"{self.config.base_url}/verify"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Encode image to base64
            image_base64 = base64.b64encode(document_image).decode('utf-8')
            
            payload = {
                'document_type': document_type,
                'image': image_base64,
                'full_name': full_name
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        # Parse verification result
                        verification_data = response_data.get('verification', {})
                        
                        verification_result = VerificationResult(
                            is_verified=verification_data.get('verified', False),
                            confidence_score=verification_data.get('confidence', 0.0),
                            document_type=verification_data.get('document_type', document_type),
                            extracted_data=verification_data.get('extracted_data', {}),
                            errors=verification_data.get('errors', []),
                            verification_id=response_data.get('verification_id', '')
                        )
                        
                        return APIResponse(
                            success=True,
                            data={
                                'verification_result': verification_result,
                                'raw_response': response_data
                            }
                        )
                    else:
                        error_message = response_data.get('error', 'Verification failed')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Document verification failed")
    
    async def verify_kyc(
        self,
        document_image: bytes,
        selfie_image: Optional[bytes] = None,
        document_type: str = "national_id"
    ) -> APIResponse:
        """Verify KYC (Know Your Customer) documents"""
        try:
            if not self.config.enabled:
                return APIResponse(
                    success=False,
                    error="Didit service is not configured"
                )
            
            url = f"{self.config.base_url}/kyc"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Encode images to base64
            document_base64 = base64.b64encode(document_image).decode('utf-8')
            payload = {
                'document_type': document_type,
                'document_image': document_base64
            }
            
            if selfie_image:
                selfie_base64 = base64.b64encode(selfie_image).decode('utf-8')
                payload['selfie_image'] = selfie_base64
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        kyc_data = response_data.get('kyc_result', {})
                        
                        verification_result = VerificationResult(
                            is_verified=kyc_data.get('verified', False),
                            confidence_score=kyc_data.get('confidence', 0.0),
                            document_type=document_type,
                            extracted_data=kyc_data.get('extracted_data', {}),
                            errors=kyc_data.get('errors', []),
                            verification_id=response_data.get('verification_id', '')
                        )
                        
                        return APIResponse(
                            success=True,
                            data={
                                'verification_result': verification_result,
                                'kyc_result': kyc_data,
                                'raw_response': response_data
                            }
                        )
                    else:
                        error_message = response_data.get('error', 'KYC verification failed')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "KYC verification failed")
    
    async def verify_liveness(
        self,
        selfie_image: bytes,
        challenge_type: str = "blink"
    ) -> APIResponse:
        """Verify liveness (ensure real person in image)"""
        try:
            if not self.config.enabled:
                return APIResponse(
                    success=False,
                    error="Didit service is not configured"
                )
            
            url = f"{self.config.base_url}/liveness"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Encode image to base64
            image_base64 = base64.b64encode(selfie_image).decode('utf-8')
            
            payload = {
                'image': image_base64,
                'challenge_type': challenge_type
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        liveness_data = response_data.get('liveness_result', {})
                        
                        return APIResponse(
                            success=True,
                            data={
                                'is_live': liveness_data.get('is_live', False),
                                'confidence': liveness_data.get('confidence', 0.0),
                                'challenge_type': challenge_type,
                                'raw_response': response_data
                            }
                        )
                    else:
                        error_message = response_data.get('error', 'Liveness verification failed')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Liveness verification failed")
    
    async def compare_faces(
        self,
        document_image: bytes,
        selfie_image: bytes
    ) -> APIResponse:
        """Compare faces between document and selfie"""
        try:
            if not self.config.enabled:
                return APIResponse(
                    success=False,
                    error="Didit service is not configured"
                )
            
            url = f"{self.config.base_url}/face-compare"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Encode images to base64
            document_base64 = base64.b64encode(document_image).decode('utf-8')
            selfie_base64 = base64.b64encode(selfie_image).decode('utf-8')
            
            payload = {
                'document_image': document_base64,
                'selfie_image': selfie_base64
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        compare_data = response_data.get('comparison_result', {})
                        
                        return APIResponse(
                            success=True,
                            data={
                                'is_match': compare_data.get('is_match', False),
                                'similarity_score': compare_data.get('similarity_score', 0.0),
                                'confidence': compare_data.get('confidence', 0.0),
                                'raw_response': response_data
                            }
                        )
                    else:
                        error_message = response_data.get('error', 'Face comparison failed')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Face comparison failed")
    
    async def get_verification_status(self, verification_id: str) -> APIResponse:
        """Get status of a verification request"""
        try:
            if not self.config.enabled:
                return APIResponse(
                    success=False,
                    error="Didit service is not configured"
                )
            
            url = f"{self.config.base_url}/verification/{verification_id}"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        return APIResponse(
                            success=True,
                            data=response_data
                        )
                    else:
                        error_message = response_data.get('error', 'Status check failed')
                        return APIResponse(
                            success=False,
                            error=error_message
                        )
                        
        except Exception as e:
            return self.handle_error(e, "Verification status check failed")
    
    def extract_document_data(self, extracted_data: Dict[str, Any]) -> DocumentData:
        """Extract structured data from document verification response"""
        return DocumentData(
            full_name=extracted_data.get('full_name'),
            document_number=extracted_data.get('document_number'),
            date_of_birth=extracted_data.get('date_of_birth'),
            expiry_date=extracted_data.get('expiry_date'),
            nationality=extracted_data.get('nationality'),
            gender=extracted_data.get('gender'),
            address=extracted_data.get('address')
        )


# Create and register the Didit service instance
didit_service = DiditService()
register_service(didit_service)


# Convenience functions for Didit operations
async def verify_identity_document(document_image: bytes, document_type: str = "national_id") -> APIResponse:
    """Verify identity document"""
    return await didit_service.verify_document(document_image, document_type)


async def verify_kyc_documents(document_image: bytes, selfie_image: Optional[bytes] = None) -> APIResponse:
    """Verify KYC documents"""
    return await didit_service.verify_kyc(document_image, selfie_image)


async def verify_liveness(selfie_image: bytes, challenge_type: str = "blink") -> APIResponse:
    """Verify liveness"""
    return await didit_service.verify_liveness(selfie_image, challenge_type)


async def compare_faces(document_image: bytes, selfie_image: bytes) -> APIResponse:
    """Compare faces between document and selfie"""
    return await didit_service.compare_faces(document_image, selfie_image)


async def check_verification_status(verification_id: str) -> APIResponse:
    """Check verification status"""
    return await didit_service.get_verification_status(verification_id)
