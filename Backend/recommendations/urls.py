"""
URL patterns for recommendation system
"""

from django.urls import path
from . import views

app_name = 'recommendations'

urlpatterns = [
    path('student/<str:student_id>/', views.student_recommendations, name='student_recommendations'),
    path('stats/<str:student_id>/', views.recommendation_stats, name='recommendation_stats'),
]
