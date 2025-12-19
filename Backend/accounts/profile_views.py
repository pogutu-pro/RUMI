from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

class ProfileCompletionView(APIView):
    """Get profile completion percentage for any role"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Calculate profile completion percentage"""
        user = request.user
        
        # Base required fields for all users
        required_fields = ['first_name', 'last_name', 'email', 'phone_number']
        optional_fields = ['profile_picture', 'bio']
        
        # Role-specific required fields
        role_specific_fields = []
        if user.role == 'student':
            try:
                student_profile = user.student_profile
                role_specific_fields = ['university', 'course', 'year_of_study']
            except:
                role_specific_fields = ['university', 'course', 'year_of_study']
        elif user.role == 'landlord':
            try:
                landlord_profile = user.landlord_profile
                role_specific_fields = ['company_name', 'national_id', 'kra_pin']
            except:
                role_specific_fields = ['company_name', 'national_id', 'kra_pin']
        elif user.role == 'caretaker':
            try:
                caretaker_profile = user.caretaker_profile
                role_specific_fields = ['hostel_id']  # Would be assigned hostel
            except:
                role_specific_fields = ['hostel_id']
        elif user.role == 'tech_support':
            role_specific_fields = ['department', 'employee_id']
        
        # Calculate completion
        all_required_fields = required_fields + role_specific_fields
        completed_fields = []
        missing_fields = []
        
        # Check base user fields
        for field in required_fields:
            if hasattr(user, field) and getattr(user, field):
                completed_fields.append(field)
            else:
                missing_fields.append(field)
        
        # Check role-specific fields
        for field in role_specific_fields:
            if user.role == 'student':
                try:
                    profile = user.student_profile
                    if hasattr(profile, field) and getattr(profile, field):
                        completed_fields.append(field)
                    else:
                        missing_fields.append(field)
                except:
                    missing_fields.append(field)
            elif user.role == 'landlord':
                try:
                    profile = user.landlord_profile
                    if hasattr(profile, field) and getattr(profile, field):
                        completed_fields.append(field)
                    else:
                        missing_fields.append(field)
                except:
                    missing_fields.append(field)
            elif user.role == 'caretaker':
                try:
                    profile = user.caretaker_profile
                    if field == 'hostel_id':
                        if hasattr(profile, 'hostel') and profile.hostel:
                            completed_fields.append(field)
                        else:
                            missing_fields.append(field)
                    else:
                        missing_fields.append(field)
                except:
                    missing_fields.append(field)
            elif user.role == 'tech_support':
                # For tech support, these would be custom fields
                if field in user.profile_data:
                    completed_fields.append(field)
                else:
                    missing_fields.append(field)
        
        # Calculate percentage
        total_required = len(all_required_fields)
        completed_count = len(completed_fields)
        percentage = round((completed_count / total_required * 100) if total_required > 0 else 0, 1)
        
        return Response({
            'percentage': percentage,
            'completed_fields': completed_fields,
            'missing_fields': missing_fields,
            'total_required': total_required,
            'completed_count': completed_count,
            'role': user.role,
            'recommendations': self._get_completion_recommendations(missing_fields, user.role)
        }, status=status.HTTP_200_OK)
    
    def _get_completion_recommendations(self, missing_fields, role):
        """Get recommendations for completing profile"""
        recommendations = []
        
        field_recommendations = {
            'first_name': 'Add your first name to help others identify you',
            'last_name': 'Add your last name for complete identification',
            'phone_number': 'Add your phone number for important notifications',
            'profile_picture': 'Upload a profile picture to personalize your account',
            'bio': 'Add a short bio to tell others about yourself',
            'university': 'Add your university for better roommate matching',
            'course': 'Add your course of study',
            'year_of_study': 'Add your current year of study',
            'company_name': 'Add your company name for verification',
            'national_id': 'Add your national ID for account verification',
            'kra_pin': 'Add your KRA PIN for tax compliance',
            'hostel_id': 'Contact administration to assign you to a hostel',
            'department': 'Add your department for proper support routing',
            'employee_id': 'Add your employee ID for internal tracking'
        }
        
        for field in missing_fields[:3]:  # Limit to top 3 recommendations
            if field in field_recommendations:
                recommendations.append(field_recommendations[field])
        
        return recommendations