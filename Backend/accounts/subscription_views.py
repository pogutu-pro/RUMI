"""
API views for subscription management
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import uuid

from .subscription_models import (
    SubscriptionPlan, LandlordSubscription, 
    SubscriptionPayment, FeatureAccess
)
from .subscription_serializers import (
    SubscriptionPlanSerializer, LandlordSubscriptionSerializer,
    SubscriptionPaymentSerializer, FeatureAccessSerializer,
    SubscriptionUpgradeSerializer, SubscriptionCancelSerializer
)
from .permissions import IsLandlord


class SubscriptionPlansListView(APIView):
    """List all available subscription plans"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Get all active subscription plans"""
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('sort_order')
        serializer = SubscriptionPlanSerializer(plans, many=True)
        
        return Response({
            'plans': serializer.data,
            'total_plans': len(serializer.data)
        }, status=status.HTTP_200_OK)


class SubscriptionPlanDetailView(APIView):
    """Get details of a specific subscription plan"""
    
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, plan_id):
        """Get plan details"""
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            serializer = SubscriptionPlanSerializer(plan)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except SubscriptionPlan.DoesNotExist:
            return Response({
                'error': 'Subscription plan not found'
            }, status=status.HTTP_404_NOT_FOUND)


class MySubscriptionView(APIView):
    """Get current landlord's subscription details"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def get(self, request):
        """Get landlord's subscription"""
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            feature_access = landlord_profile.feature_access
            
            subscription_data = LandlordSubscriptionSerializer(subscription).data
            feature_data = FeatureAccessSerializer(feature_access).data
            
            return Response({
                'subscription': subscription_data,
                'features': feature_data,
                'is_trial': subscription.is_trial_active(),
                'can_access_platform': subscription.is_active_or_trial()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Subscription not found',
                'details': str(e)
            }, status=status.HTTP_404_NOT_FOUND)


class SubscriptionUpgradeView(APIView):
    """Upgrade or downgrade subscription plan"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def post(self, request):
        """Change subscription plan"""
        serializer = SubscriptionUpgradeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            new_plan_id = serializer.validated_data['new_plan_id']
            immediate = serializer.validated_data.get('immediate', False)
            
            # Get new plan
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
            
            # Prevent downgrade to trial
            if new_plan.plan_type == 'trial':
                return Response({
                    'error': 'Cannot switch to trial plan'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if already on this plan
            if subscription.plan.id == new_plan_id:
                return Response({
                    'error': 'Already subscribed to this plan'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                old_plan_name = subscription.plan.name
                
                if immediate:
                    # Immediate upgrade
                    subscription.plan = new_plan
                    subscription.status = 'active'
                    subscription.save()
                    
                    # Sync features
                    feature_access = landlord_profile.feature_access
                    feature_access.sync_with_subscription()
                    
                    message = f'Upgraded immediately from {old_plan_name} to {new_plan.name}'
                else:
                    # Schedule upgrade for next billing period
                    subscription.plan = new_plan
                    subscription.cancel_at_period_end = False
                    subscription.save()
                    
                    message = f'Scheduled upgrade from {old_plan_name} to {new_plan.name} on {subscription.next_billing_date}'
                
                return Response({
                    'message': message,
                    'new_plan': SubscriptionPlanSerializer(new_plan).data,
                    'effective_date': timezone.now().date() if immediate else subscription.next_billing_date,
                    'subscription': LandlordSubscriptionSerializer(subscription).data
                }, status=status.HTTP_200_OK)
                
        except SubscriptionPlan.DoesNotExist:
            return Response({
                'error': 'Plan not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': 'Upgrade failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionCancelView(APIView):
    """Cancel subscription"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def post(self, request):
        """Cancel landlord's subscription"""
        serializer = SubscriptionCancelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            
            if subscription.status in ['cancelled', 'expired']:
                return Response({
                    'error': 'Subscription already cancelled'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            immediate = serializer.validated_data.get('immediate', False)
            reason = serializer.validated_data['reason']
            
            with transaction.atomic():
                if immediate:
                    # Immediate cancellation
                    subscription.status = 'cancelled'
                    subscription.cancelled_at = timezone.now()
                    subscription.cancellation_reason = reason
                    subscription.auto_renew = False
                    subscription.save()
                    
                    # Disable premium features
                    feature_access = landlord_profile.feature_access
                    feature_access.disable_all_premium_features()
                    
                    message = 'Subscription cancelled immediately'
                    effective_date = timezone.now().date()
                else:
                    # Cancel at period end
                    subscription.cancel_at_period_end = True
                    subscription.cancellation_reason = reason
                    subscription.auto_renew = False
                    subscription.save()
                    
                    message = f'Subscription will be cancelled on {subscription.current_period_end}'
                    effective_date = subscription.current_period_end
                
                return Response({
                    'message': message,
                    'cancelled_immediately': immediate,
                    'effective_date': effective_date,
                    'access_until': subscription.current_period_end if not immediate else timezone.now().date()
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': 'Cancellation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionReactivateView(APIView):
    """Reactivate cancelled subscription"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def post(self, request):
        """Reactivate subscription"""
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            
            if subscription.status not in ['cancelled', 'expired']:
                return Response({
                    'error': 'Subscription is already active'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                subscription.status = 'active'
                subscription.cancel_at_period_end = False
                subscription.auto_renew = True
                subscription.cancelled_at = None
                subscription.save()
                
                # Re-enable features
                feature_access = landlord_profile.feature_access
                feature_access.sync_with_subscription()
                
                return Response({
                    'message': 'Subscription reactivated successfully',
                    'subscription': LandlordSubscriptionSerializer(subscription).data
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': 'Reactivation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionPaymentHistoryView(APIView):
    """View subscription payment history"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def get(self, request):
        """Get payment history"""
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            
            payments = SubscriptionPayment.objects.filter(
                subscription=subscription
            ).order_by('-initiated_at')
            
            # Pagination
            limit = int(request.query_params.get('limit', 20))
            offset = int(request.query_params.get('offset', 0))
            
            paginated_payments = payments[offset:offset + limit]
            serializer = SubscriptionPaymentSerializer(paginated_payments, many=True)
            
            return Response({
                'total_payments': payments.count(),
                'payments': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to retrieve payment history',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionInitiatePaymentView(APIView):
    """Initiate subscription payment"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def post(self, request):
        """Initialize subscription payment"""
        try:
            landlord_profile = request.user.landlord_profile
            subscription = landlord_profile.subscription
            
            # Calculate amount
            if subscription.plan.billing_type == 'fixed':
                amount = subscription.plan.fixed_price
            else:
                # For revenue-based, amount is already calculated
                amount = subscription.calculated_fee_this_period
            
            if amount <= 0:
                return Response({
                    'error': 'No payment required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate transaction reference
            transaction_reference = f"SUB-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}"
            
            with transaction.atomic():
                # Create payment record
                payment = SubscriptionPayment.objects.create(
                    subscription=subscription,
                    amount=amount,
                    billing_period_start=subscription.current_period_start,
                    billing_period_end=subscription.current_period_end,
                    rent_revenue_amount=subscription.total_rent_collected_this_period if subscription.plan.billing_type == 'revenue' else None,
                    transaction_reference=transaction_reference,
                    status='pending'
                )
                
                # TODO: Initialize Paystack payment
                # For now, return mock payment link
                payment_link = f"https://paystack.com/pay/{transaction_reference.lower()}"
                
                return Response({
                    'payment_id': payment.id,
                    'transaction_reference': transaction_reference,
                    'amount': float(amount),
                    'payment_link': payment_link,
                    'currency': 'KES',
                    'expires_at': (timezone.now() + timezone.timedelta(minutes=30)).isoformat()
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': 'Payment initialization failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FeatureCheckView(APIView):
    """Check if landlord has access to specific feature"""
    
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    
    def get(self, request, feature_name):
        """Check feature access"""
        try:
            landlord_profile = request.user.landlord_profile
            feature_access = landlord_profile.feature_access
            
            # Map feature name to model field
            feature_field = f"can_{feature_name}"
            
            if not hasattr(feature_access, feature_field):
                return Response({
                    'error': 'Invalid feature name'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            has_access = getattr(feature_access, feature_field)
            
            return Response({
                'feature': feature_name,
                'has_access': has_access,
                'current_plan': feature_access.landlord.subscription.plan.name,
                'plan_type': feature_access.landlord.subscription.plan.plan_type
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Feature check failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)