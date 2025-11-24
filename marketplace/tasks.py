from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from accounts.utils import send_branded_email


@shared_task
def send_application_confirmation(application_id, reference_number):
    """
    Send confirmation email to applicant
    """
    from .models import SellerApplication
    try:
        application = SellerApplication.objects.select_related('applicant__user').get(id=application_id)

        subject = f'Seller Application Submitted - {reference_number}'
        message = f"""
        Hi {application.applicant.user.first_name},

        Your seller application has been successfully submitted!

        Application Details:
        - Reference Number: {reference_number}
        - Business Name: {application.business_name}
        - Status: Pending Review

        What happens next:
        1. Our team will review your application (3-5 business days)
        2. We'll verify your business documents
        3. You'll receive approval or feedback via email

        We'll keep you updated on the progress.

        Best regards,
        RUMI Marketplace Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[application.applicant.user.email],
            recipient_name=application.applicant.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send application confirmation: {e}")


@shared_task
def notify_admin_new_application(application_id):
    """
    Notify admin team of new seller application
    """
    from .models import SellerApplication
    try:
        application = SellerApplication.objects.select_related('applicant__user').get(id=application_id)

        subject = f'New Seller Application - {application.business_name}'
        message = f"""
        A new seller application has been submitted.

        Applicant Details:
        - Name: {application.applicant.user.get_full_name()}
        - Email: {application.applicant.user.email}
        - University: {application.applicant.university}
        - Business Name: {application.business_name}
        - Business Type: {application.business_type}

        Application ID: {application.id}

        Please review this application in the admin panel.

        Admin URL: https://rumi.co.ke/admin/marketplace/sellerapplication/{application.id}/change/

        Best regards,
        RUMI System
        """

        # Send to tech support admin
        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.TECH_SUPPORT_ADMIN_EMAIL],
            recipient_name="Admin",
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to notify admin of new application: {e}")


@shared_task
def send_seller_approval_notifications(seller_id, business_name):
    """
    Send approval notifications to new seller
    """
    from accounts.models import StudentProfile
    try:
        seller = StudentProfile.objects.select_related('user').get(id=seller_id)

        # Email notification
        subject = f'Congratulations! Your Seller Application is Approved'
        message = f"""
        Hi {seller.user.first_name},

        Great news! Your seller application for "{business_name}" has been approved!

        You can now:
        - List products on the RUMI marketplace
        - Access seller analytics and insights
        - Communicate with buyers through our platform
        - Build your business presence

        Next Steps:
        1. Complete your seller profile (add logo, banner, policies)
        2. List your first product
        3. Share your listings on social media

        Start selling: https://rumi.co.ke/marketplace/sell

        Welcome to the RUMI seller community!

        Best regards,
        RUMI Marketplace Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            recipient_name=seller.user.first_name,
            fail_silently=False
        )

        # SMS notification (if phone available)
        if seller.user.phone_number:
            # Here you would integrate with SMS service like Africa's Talking
            print(f"SMS sent to {seller.user.phone_number}: Your seller application has been approved!")

    except Exception as e:
        print(f"Failed to send seller approval notifications: {e}")


@shared_task
def send_seller_rejection_notification(seller_id, business_name, rejection_reason):
    """
    Send rejection notification to applicant
    """
    from accounts.models import StudentProfile
    try:
        seller = StudentProfile.objects.select_related('user').get(id=seller_id)

        subject = f'Seller Application Update - {business_name}'
        message = f"""
        Hi {seller.user.first_name},

        Thank you for your interest in becoming a seller on RUMI.

        After careful review, we are unable to approve your application for "{business_name}" at this time.

        Reason: {rejection_reason}

        You can reapply after 30 days with updated information.

        If you have questions about this decision or need guidance on reapplying, please contact our support team.

        We appreciate your understanding.

        Best regards,
        RUMI Marketplace Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            recipient_name=seller.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send seller rejection notification: {e}")


@shared_task
def send_product_listing_notification(seller_id, product_id, product_title):
    """
    Send notification when product is listed
    """
    from accounts.models import StudentProfile
    try:
        seller = StudentProfile.objects.select_related('user').get(id=seller_id)

        subject = f'Product Listed Successfully - {product_title}'
        message = f"""
        Hi {seller.user.first_name},

        Your product "{product_title}" has been successfully listed on the RUMI marketplace!

        Product Details:
        - Title: {product_title}
        - Status: Available
        - Product ID: {product_id}

        Tips for success:
        - Share your listing on social media
        - Respond quickly to buyer inquiries
        - Keep your contact information updated
        - Mark items as sold when transactions complete

        View your listing: https://rumi.co.ke/marketplace/product/{product_id}

        Best regards,
        RUMI Marketplace Team
        """

        send_branded_email(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            recipient_name=seller.user.first_name,
            fail_silently=False
        )
    except Exception as e:
        print(f"Failed to send product listing notification: {e}")


@shared_task
def update_product_analytics():
    """
    Update product view counts and analytics
    """
    from .models import Product, ProductView
    from django.db.models import Count
    from datetime import timedelta

    try:
        # Update view counts for products
        view_counts = ProductView.objects.filter(
            viewed_at__gte=timezone.now() - timedelta(hours=24)
        ).values('product').annotate(
            view_count=Count('id'),
            unique_view_count=Count('viewer', distinct=True)
        )

        for view_data in view_counts:
            Product.objects.filter(id=view_data['product']).update(
                view_count=view_data['view_count'],
                unique_view_count=view_data['unique_view_count']
            )

        print(f"Updated analytics for {len(view_counts)} products")
        return len(view_counts)
    except Exception as e:
        print(f"Failed to update product analytics: {e}")
        return 0


@shared_task
def cleanup_old_product_views():
    """
    Clean up old product view records (keep last 90 days)
    """
    from .models import ProductView
    try:
        cutoff_date = timezone.now() - timezone.timedelta(days=90)
        deleted_count = ProductView.objects.filter(
            viewed_at__lt=cutoff_date
        ).delete()[0]

        print(f"Cleaned up {deleted_count} old product view records")
        return deleted_count
    except Exception as e:
        print(f"Failed to cleanup old product views: {e}")
        return 0


@shared_task
def send_seller_performance_reports():
    """
    Send weekly performance reports to sellers
    """
    from .models import SellerProfile, Product
    from django.db.models import Sum, Count
    from datetime import timedelta

    try:
        # Get active sellers
        sellers = SellerProfile.objects.filter(is_verified=True)

        report_date = timezone.now() - timedelta(days=7)

        for seller in sellers:
            # Get seller's products
            products = Product.objects.filter(seller=seller.seller)

            # Calculate metrics
            total_views = products.aggregate(Sum('view_count'))['view_count__sum'] or 0
            total_contact_reveals = products.aggregate(Sum('contact_reveal_count'))['contact_reveal_count__sum'] or 0
            active_products = products.filter(is_active=True).count()

            # Send report if there's activity
            if total_views > 0 or total_contact_reveals > 0:
                subject = f'Your Weekly Marketplace Performance Report'
                message = f"""
                Hi {seller.seller.user.first_name},

                Here's your marketplace performance for the past week:

                Products Overview:
                - Active Products: {active_products}
                - Total Views: {total_views}
                - Contact Reveals: {total_contact_reveals}

                Top Performing Products:
                {get_top_products_text(products[:3])}

                Tips to improve:
                - Share your listings on social media
                - Respond quickly to inquiries
                - Keep product photos and descriptions updated

                View full analytics: https://rumi.co.ke/marketplace/analytics

                Keep up the great work!

                Best regards,
                RUMI Marketplace Team
                """

                send_branded_email(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[seller.seller.user.email],
                    recipient_name=seller.seller.user.first_name,
                    fail_silently=True
                )

        print(f"Sent performance reports to {sellers.count()} sellers")
        return sellers.count()
    except Exception as e:
        print(f"Failed to send seller performance reports: {e}")
        return 0


def get_top_products_text(products):
    """Helper to format top products text"""
    if not products:
        return "No products yet"

    text = ""
    for product in products:
        text += f"- {product.title}: {product.view_count} views\n"
    return text


@shared_task
def moderate_reported_products():
    """
    Process product reports and take automated actions
    """
    from .models import ProductReport, Product
    try:
        # Get pending reports
        pending_reports = ProductReport.objects.filter(status='pending')

        moderated_count = 0
        for report in pending_reports:
            # Simple auto-moderation logic
            if report.reason in ['scam', 'prohibited_item']:
                # Auto-hide product for severe violations
                product = report.product
                product.is_active = False
                product.save()

                report.status = 'reviewed'
                report.reviewed_at = timezone.now()
                report.action_taken = 'product_hidden'
                report.save()

                moderated_count += 1

        print(f"Auto-moderated {moderated_count} reported products")
        return moderated_count
    except Exception as e:
        print(f"Failed to moderate reported products: {e}")
        return 0


@shared_task
def update_seller_ratings():
    """
    Update seller average ratings based on reviews
    """
    from .models import SellerProfile
    try:
        sellers = SellerProfile.objects.filter(is_verified=True)

        updated_count = 0
        for seller in sellers:
            # Calculate average rating from reviews (assuming reviews exist)
            # This would need to be implemented based on actual review system
            # For now, just placeholder
            seller.average_rating = 4.5  # Placeholder
            seller.save()
            updated_count += 1

        print(f"Updated ratings for {updated_count} sellers")
        return updated_count
    except Exception as e:
        print(f"Failed to update seller ratings: {e}")
        return 0